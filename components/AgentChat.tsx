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
    <div className="flex h-[70vh] flex-col rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
      <div className="border-b border-slate-200 bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4">
        <h2 className="font-bold text-white text-lg flex items-center gap-2">
          🤖 AI Agent
        </h2>
        <p className="text-xs text-emerald-50 mt-1">Ask in plain English. You can see every tool the agent uses.</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4 bg-slate-50">
        {messages.length === 0 && (
          <div className="space-y-2 animate-slide-in">
            <p className="text-sm font-medium text-slate-600 mb-3">💡 Try one of these:</p>
            {SAMPLE_PROMPTS.map((p, i) => (
              <button
                key={p}
                onClick={() => send(p)}
                style={{ animationDelay: `${i * 100}ms` }}
                className="animate-slide-in block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 hover:border-emerald-300 transition-all duration-200 hover:shadow-md"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`animate-slide-in ${m.role === "user" ? "flex justify-end" : "flex justify-start"}`}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm text-white shadow-md"
                  : "max-w-[85%] space-y-2"
              }
            >
              {m.steps && m.steps.length > 0 && <ToolSteps steps={m.steps} />}
              {m.role === "model" ? (
                <div className="whitespace-pre-wrap rounded-2xl bg-white border border-slate-200 px-4 py-3 text-sm shadow-sm">{m.text}</div>
              ) : (
                m.text
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-500 animate-slide-in">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </div>
            <span>Agent is working...</span>
          </div>
        )}
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 animate-slide-in">⚠️ {error}</p>}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t border-slate-200 p-4 bg-white"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your request..."
          className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
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
    <div className="space-y-1.5">
      {steps.map((s, i) => (
        <details key={i} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm hover:shadow-md transition-shadow">
          <summary className="cursor-pointer select-none font-medium">
            <span className={s.ok ? "text-emerald-700" : "text-red-600"}>{s.ok ? "✓ Done" : "✗ Failed"}</span>
            {" · "}
            <span className="font-mono font-semibold text-slate-700">{s.tool}</span>
            {s.writes && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 font-medium">writes data</span>}
          </summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-slate-600 bg-slate-50 rounded-lg p-2 border border-slate-100">
            {JSON.stringify({ args: s.args, ...(s.ok ? { result: s.result } : { error: s.error }) }, null, 2)}
          </pre>
        </details>
      ))}
    </div>
  );
}
