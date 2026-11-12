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
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      
      <form onSubmit={handleSubmit} className="relative w-full max-w-md glass rounded-3xl p-8 shadow-2xl animate-slide-up">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 blur-2xl bg-blue-500 opacity-30 rounded-full"></div>
              <div className="relative text-7xl">📦</div>
            </div>
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Restocker</h1>
          <p className="text-sm text-slate-400">AI-Powered Inventory Intelligence</p>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Access Code</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">🔐</div>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full glass-light border border-slate-700 pl-14 pr-4 py-4 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-white placeholder-slate-500"
                placeholder="Enter your passcode"
                autoFocus
              />
            </div>
          </div>
          
          {error && (
            <div className="glass-light border border-red-500/30 rounded-xl p-4 animate-slide-up">
              <p className="text-sm text-red-400 flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <span>{error}</span>
              </p>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading || !passcode}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
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
