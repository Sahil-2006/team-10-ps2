"use client";

import { useEffect, useRef, useState } from "react";
import type { AgentResult, AgentStep } from "@/lib/agent/types";

type Message = { role: "user" | "model"; text: string; steps?: AgentStep[] };

const SAMPLE_PROMPTS = [
  "What do I need to reorder this week?",
  "Create purchase orders for all low-stock dairy items.",
  "Which items will run out in the next 3 days?",
];

export default function AgentChat({ onDataChanged }: { onDataChanged?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next: Message[] = [...messages, { role: "user", text: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Only the last 20 messages are sent, to keep requests small.
        body: JSON.stringify({ messages: next.slice(-20).map(({ role, text }) => ({ role, text })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      const result = data as AgentResult;
      setMessages([...next, { role: "model", text: result.reply, steps: result.steps }]);
      if (result.steps.some((s) => s.writes && s.ok)) onDataChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[70vh] flex-col elegant-card rounded-2xl overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="bg-slate-900 px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl">
            🤖
          </div>
          <div>
            <h2 className="font-bold text-white text-lg">AI Assistant</h2>
            <p className="text-xs text-slate-400">Intelligent inventory management</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-6 bg-[#FAFAF9]">
        {messages.length === 0 && (
          <div className="space-y-3 animate-slide-up">
            <p className="text-sm font-semibold text-slate-700 mb-4">💡 Quick Actions</p>
            {SAMPLE_PROMPTS.map((p, i) => (
              <button
                key={p}
                onClick={() => send(p)}
                style={{ animationDelay: `${i * 100}ms` }}
                className="animate-slide-up block w-full rounded-xl bg-white border border-slate-200 px-5 py-4 text-left text-sm hover:border-slate-900 hover:shadow-md transition-all duration-200"
              >
                <span className="text-slate-700">{p}</span>
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`animate-slide-up flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl bg-slate-900 px-5 py-3 text-sm text-white shadow-md"
                  : "max-w-[85%] space-y-3"
              }
            >
              {m.steps && m.steps.length > 0 && <ToolSteps steps={m.steps} />}
              {m.role === "model" ? (
                <div className="whitespace-pre-wrap rounded-2xl bg-white border border-slate-200 px-5 py-4 text-sm text-slate-700 shadow-sm">
                  {m.text}
                </div>
              ) : (
                m.text
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 text-sm text-slate-600 animate-slide-up">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-2 h-2 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-2 h-2 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </div>
            <span>AI is thinking...</span>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 animate-slide-up">
            <p className="text-sm text-red-700 flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-3 border-t border-slate-200 p-4 bg-white"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything about inventory..."
          className="flex-1 rounded-xl border border-slate-300 px-5 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-all duration-200"
        >
          Send
        </button>
      </form>
    </div>
  );
}

/** Shows each tool call so users (and judges) can see what the agent did. */
function ToolSteps({ steps }: { steps: AgentStep[] }) {
  return (
    <div className="space-y-2">
      {steps.map((s, i) => (
        <details key={i} className="rounded-xl bg-white border border-slate-300 px-4 py-2.5 text-xs hover:border-slate-400 transition-colors shadow-sm">
          <summary className="cursor-pointer select-none font-semibold flex items-center gap-2">
            <span className={s.ok ? "text-green-600" : "text-red-600"}>{s.ok ? "✓ Success" : "✗ Failed"}</span>
            <span className="text-slate-400">•</span>
            <span className="font-mono text-slate-700">{s.tool}</span>
            {s.writes && <span className="ml-auto rounded-full bg-amber-100 px-2.5 py-1 text-amber-800 font-medium text-xs">WRITE</span>}
          </summary>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-slate-700 bg-[#F5F1ED] rounded-lg p-3 border border-slate-200">
            {JSON.stringify({ args: s.args, ...(s.ok ? { result: s.result } : { error: s.error }) }, null, 2)}
          </pre>
        </details>
      ))}
    </div>
  );
}
