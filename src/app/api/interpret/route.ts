import { streamInterpretation } from "@/lib/claude/interpret";
import { buildInitialPrompt } from "@/lib/claude/prompts";
import { calculateSaju, SajuInputError } from "@/lib/saju/calculate";
import { parseSajuInput } from "@/lib/saju/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 요청 형식
 * - 첫 풀이: { input: SajuInput }
 * - 추가 질문: { sessionId: string, question: string }
 *
 * 응답은 한 줄에 하나씩 JSON 이벤트가 오는 스트림(NDJSON)이다.
 */
export async function POST(req: Request) {
  let prompt: string;
  let sessionId: string | undefined;

  try {
    const body = (await req.json()) as Record<string, unknown>;
    if (typeof body.sessionId === "string" && typeof body.question === "string") {
      const question = body.question.trim();
      if (!question) throw new SajuInputError("질문을 입력해 주세요.");
      if (question.length > 2000) throw new SajuInputError("질문이 너무 깁니다. (2000자 이내)");
      sessionId = body.sessionId;
      prompt = question;
    } else {
      prompt = buildInitialPrompt(calculateSaju(parseSajuInput(body.input)));
    }
  } catch (err) {
    const message = err instanceof SajuInputError ? err.message : "요청 형식이 올바르지 않습니다.";
    return Response.json({ error: message }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for await (const event of streamInterpretation({ prompt, sessionId, signal: req.signal })) {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
