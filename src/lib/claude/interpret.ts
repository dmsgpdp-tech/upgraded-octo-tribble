import { query } from "@anthropic-ai/claude-agent-sdk";
import { SYSTEM_PROMPT } from "./prompts";

/**
 * Claude 호출은 이 파일 한 곳에서만 한다.
 *
 * 지금은 Claude 구독(Pro/Max)의 OAuth 토큰(CLAUDE_CODE_OAUTH_TOKEN)을 쓴다.
 * 나중에 다른 사람에게 공개하는 서비스로 바꾼다면 구독 토큰 대신 API 키를 써야 하므로,
 * 그때는 buildEnv()에서 ANTHROPIC_API_KEY를 넘기도록 바꾸면 된다.
 */

export type InterpretEvent =
  | { type: "session"; sessionId: string }
  | { type: "text"; text: string }
  | { type: "error"; message: string }
  | { type: "done" };

function buildEnv(): Record<string, string | undefined> {
  const env: Record<string, string | undefined> = { ...process.env };
  // API 키가 있으면 그쪽(종량제)이 우선 쓰이므로, 구독으로만 동작하도록 지운다.
  delete env.ANTHROPIC_API_KEY;
  return env;
}

export async function* streamInterpretation(params: {
  prompt: string;
  /** 이어서 질문할 때 이전 대화의 세션 ID */
  sessionId?: string;
  signal?: AbortSignal;
}): AsyncGenerator<InterpretEvent> {
  const abortController = new AbortController();
  params.signal?.addEventListener("abort", () => abortController.abort());

  const q = query({
    prompt: params.prompt,
    options: {
      systemPrompt: SYSTEM_PROMPT,
      // 파일 읽기·명령 실행 같은 도구는 전부 끄고 글만 받는다.
      tools: [],
      maxTurns: 1,
      includePartialMessages: true,
      settingSources: [],
      resume: params.sessionId,
      model: process.env.SAJU_MODEL || undefined,
      env: buildEnv(),
      abortController,
    },
  });

  let sentSession = false;
  let streamedText = false;

  try {
    for await (const message of q) {
      if (!sentSession && "session_id" in message && message.session_id) {
        sentSession = true;
        yield { type: "session", sessionId: message.session_id };
      }

      if (message.type === "stream_event") {
        const event = message.event;
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          streamedText = true;
          yield { type: "text", text: event.delta.text };
        }
      } else if (message.type === "result") {
        if (message.subtype !== "success" || message.is_error) {
          const detail =
            message.subtype === "success" ? message.result : message.errors?.join("\n") || message.subtype;
          yield { type: "error", message: explainError(detail) };
        } else if (!streamedText && message.result) {
          // 스트리밍 조각이 오지 않은 경우 최종 결과를 한 번에 보낸다.
          yield { type: "text", text: message.result };
        }
      }
    }
    yield { type: "done" };
  } catch (err) {
    if (abortController.signal.aborted) return;
    yield { type: "error", message: explainError(err instanceof Error ? err.message : String(err)) };
  }
}

function explainError(detail: string): string {
  const lower = detail.toLowerCase();
  if (lower.includes("login") || lower.includes("auth") || lower.includes("401") || lower.includes("oauth")) {
    return (
      "Claude 인증에 실패했습니다. 터미널에서 `claude setup-token` 으로 토큰을 발급받아 " +
      ".env.local 의 CLAUDE_CODE_OAUTH_TOKEN 에 넣고 서버를 다시 시작해 주세요.\n\n(원인: " +
      detail +
      ")"
    );
  }
  if (lower.includes("rate") || lower.includes("limit") || lower.includes("429")) {
    return "구독 사용량 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.\n\n(원인: " + detail + ")";
  }
  return "풀이 중 오류가 발생했습니다: " + detail;
}
