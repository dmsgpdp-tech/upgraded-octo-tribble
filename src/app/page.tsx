"use client";

import { useRef, useState } from "react";
import BirthForm from "@/components/BirthForm";
import ChatPanel, { type ChatMessage } from "@/components/ChatPanel";
import SajuTable from "@/components/SajuTable";
import type { InterpretEvent } from "@/lib/claude/interpret";
import type { SajuInput, SajuResult } from "@/lib/saju/types";

export default function Home() {
  const [saju, setSaju] = useState<SajuResult | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const sessionIdRef = useRef<string | null>(null);
  const [hasSession, setHasSession] = useState(false);

  /** /api/interpret 응답 스트림을 읽어 마지막 assistant 메시지에 이어 붙인다. */
  async function runInterpret(body: object) {
    setStreaming(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const appendToLast = (fn: (m: ChatMessage) => ChatMessage) =>
      setMessages((prev) => [...prev.slice(0, -1), fn(prev[prev.length - 1])]);

    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `요청 실패 (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as InterpretEvent;
          if (event.type === "session") {
            sessionIdRef.current = event.sessionId;
          } else if (event.type === "text") {
            appendToLast((m) => ({ ...m, content: m.content + event.text }));
          } else if (event.type === "error") {
            // 아직 받은 글이 없으면 빈 풀이 칸을 오류로 바꾸고, 있으면 오류를 아래에 덧붙인다.
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              const error: ChatMessage = { role: "error", content: event.message };
              return last.role === "assistant" && !last.content ? [...prev.slice(0, -1), error] : [...prev, error];
            });
          }
        }
      }
    } catch (err) {
      appendToLast(() => ({ role: "error", content: err instanceof Error ? err.message : String(err) }));
    } finally {
      setHasSession(sessionIdRef.current !== null);
      setStreaming(false);
    }
  }

  async function handleSubmit(input: SajuInput) {
    setFormError(null);
    setSaju(null);
    setMessages([]);
    sessionIdRef.current = null;
    setHasSession(false);

    const res = await fetch("/api/saju", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) {
      setFormError(data.error ?? "사주 계산에 실패했습니다.");
      return;
    }
    setSaju(data as SajuResult);
    await runInterpret({ input });
  }

  function handleAsk(question: string) {
    if (!sessionIdRef.current) return;
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    void runInterpret({ sessionId: sessionIdRef.current, question });
  }

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-4 py-10">
      <header className="text-center">
        <h1 className="text-3xl font-bold">AI 사주 풀이</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">만세력으로 사주팔자를 계산하고 Claude가 풀이해 드려요</p>
      </header>

      <BirthForm onSubmit={handleSubmit} disabled={streaming} />
      {formError && <p className="text-center text-sm text-rose-600">{formError}</p>}

      {saju && <SajuTable saju={saju} />}

      {messages.length > 0 && (
        <ChatPanel messages={messages} streaming={streaming} canAsk={hasSession} onAsk={handleAsk} />
      )}
    </main>
  );
}
