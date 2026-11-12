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
    <div className="flex h-[70vh] flex-col glass rounded-2xl overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-2xl">
            🤖
          </div>
          <div>
            <h2 className="font-bold text-white text-xl">AI Assistant</h2>
            <p className="text-xs text-blue-100">Powered by intelligent automation</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-6 bg-slate-900/40">
        {messages.length === 0 && (
          <div className="space-y-3 animate-slide-up">
            <p className="text-sm font-semibold text-slate-300 mb-4">💡 Quick Actions</p>
            {SAMPLE_PROMPTS.map((p, i) => (
              <button
                key={p}
                onClick={() => send(p)}
                style={{ animationDelay: `${i * 100}ms` }}
                className="animate-slide-up block w-full rounded-xl glass-light px-5 py-4 text-left text-sm hover:bg-slate-700/30 transition-all duration-200 border border-slate-700 hover:border-blue-500/50 group"
              >
                <span className="text-slate-200 group-hover:text-white transition-colors">{p}</span>
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`animate-slide-up flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 text-sm text-white shadow-lg"
                  : "max-w-[85%] space-y-3"
              }
            >
              {m.steps && m.steps.length > 0 && <ToolSteps steps={m.steps} />}
              {m.role === "model" ? (
                <div className="whitespace-pre-wrap rounded-2xl glass-light border border-slate-700 px-5 py-4 text-sm text-slate-200 shadow-xl">
                  {m.text}
                </div>
              ) : (
                m.text
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 text-sm text-slate-400 animate-slide-up">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </div>
            <span>AI is thinking...</span>
          </div>
        )}
        {error && (
          <div className="glass-light border border-red-500/30 rounded-xl px-4 py-3 animate-slide-up">
            <p className="text-sm text-red-400 flex items-start gap-2">
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
        className="flex gap-3 border-t border-slate-800 p-4 bg-slate-900/60"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything about inventory..."
          className="flex-1 rounded-xl glass-light border border-slate-700 px-5 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-200 hover:scale-105 active:scale-95"
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
        <details key={i} className="rounded-xl glass-light border border-slate-700 px-4 py-2.5 text-xs hover:border-slate-600 transition-colors">
          <summary className="cursor-pointer select-none font-semibold flex items-center gap-2">
            <span className={s.ok ? "text-emerald-400" : "text-red-400"}>{s.ok ? "✓ Success" : "✗ Failed"}</span>
            <span className="text-slate-400">•</span>
            <span className="font-mono text-blue-400">{s.tool}</span>
            {s.writes && <span className="ml-auto rounded-full bg-amber-500/20 px-2.5 py-1 text-amber-400 font-medium text-xs">WRITE</span>}
          </summary>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-slate-400 bg-slate-950/50 rounded-lg p-3 border border-slate-800">
            {JSON.stringify({ args: s.args, ...(s.ok ? { result: s.result } : { error: s.error }) }, null, 2)}
          </pre>
        </details>
      ))}
    </div>
  );
}
