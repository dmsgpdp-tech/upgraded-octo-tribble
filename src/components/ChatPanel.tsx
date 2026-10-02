"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkCjkFriendly from "remark-cjk-friendly";

export interface ChatMessage {
  role: "user" | "assistant" | "error";
  content: string;
}

export default function ChatPanel({
  messages,
  streaming,
  canAsk,
  onAsk,
}: {
  messages: ChatMessage[];
  streaming: boolean;
  canAsk: boolean;
  onAsk: (question: string) => void;
}) {
  const [question, setQuestion] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || streaming) return;
    setQuestion("");
    onAsk(q);
  }

  return (
    <section className="space-y-4">
      {messages.map((m, i) =>
        m.role === "user" ? (
          <div key={i} className="ml-auto max-w-[85%] rounded-2xl bg-[var(--accent)] px-4 py-2 text-white">
            {m.content}
          </div>
        ) : m.role === "error" ? (
          <div key={i} className="rounded-2xl border border-rose-400 bg-rose-50 p-4 text-sm whitespace-pre-wrap text-rose-800">
            {m.content}
          </div>
        ) : (
          <div key={i} className="prose-saju rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5">
            {m.content ? <ReactMarkdown remarkPlugins={[remarkCjkFriendly]}>{m.content}</ReactMarkdown> : <p className="text-[var(--muted)]">풀이를 준비하고 있어요…</p>}
          </div>
        ),
      )}

      {canAsk && (
        <form onSubmit={submit} className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 outline-none focus:border-[var(--accent)]"
            placeholder="더 궁금한 점을 물어보세요 (예: 이직은 언제가 좋을까요?)"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={streaming}
          />
          <button
            type="submit"
            disabled={streaming || !question.trim()}
            className="rounded-lg bg-[var(--accent)] px-4 font-medium text-white disabled:opacity-50"
          >
            질문
          </button>
        </form>
      )}
    </section>
  );
}
