"use client";

import { useState } from "react";

export default function LoginPage() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    setLoading(false);
    if (res.ok) {
      window.location.href = "/";
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Login failed");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-[#F5F1ED]">
      <form onSubmit={handleSubmit} className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-lg border border-slate-200 animate-slide-up">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="text-7xl">📦</div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">StockPilot</h1>
          <p className="text-sm text-slate-600">AI-Powered Inventory Intelligence</p>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Access Code</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">🔐</div>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full bg-[#F5F1ED] border border-slate-300 pl-14 pr-4 py-4 rounded-xl outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all text-slate-900 placeholder-slate-400"
                placeholder="Enter your passcode"
                autoFocus
              />
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-slide-up">
              <p className="text-sm text-red-700 flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <span>{error}</span>
              </p>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading || !passcode}
            className="w-full rounded-xl bg-slate-900 px-6 py-4 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-all duration-300 hover:shadow-lg active:scale-95"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Authenticating...
              </span>
            ) : (
              "Access System →"
            )}
          </button>
          
          <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <span>🔒</span>
            <span>Secure encrypted access</span>
          </p>
        </div>
      </form>
    </main>
  );
}
