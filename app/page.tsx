"use client";

import { useState } from "react";
import AgentChat from "@/components/AgentChat";
import LowStockList, { type LowItem } from "@/components/LowStockList";
import { useLiveData } from "@/components/useLiveData";
import { formatRs } from "@/lib/format";

type Dashboard = {
  low_stock_count: number;
  reorder_value: number;
  at_risk_count: number;
  open_po_count: number;
  open_po_value: number;
  low_items: LowItem[];
};

/* DASHBOARD: stat cards, agent chat and the live low-stock list. */
export default function HomePage() {
  // Changes every time the agent writes data, so everything reloads at once.
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, error } = useLiveData<Dashboard>("/api/dashboard", refreshKey);

  const cards = [
    { label: "Low stock items", value: data ? String(data.low_stock_count) : "-", icon: "⚠️", color: "from-red-500 to-orange-500", bgGlow: "bg-red-500" },
    { label: "Reorder value needed", value: data ? formatRs(data.reorder_value) : "-", icon: "💰", color: "from-emerald-500 to-teal-500", bgGlow: "bg-emerald-500" },
    { label: "At risk before delivery", value: data ? String(data.at_risk_count) : "-", icon: "🔥", color: "from-amber-500 to-yellow-500", bgGlow: "bg-amber-500" },
    {
      label: "Open POs",
      value: data ? `${data.open_po_count} · ${formatRs(data.open_po_value)}` : "-",
      icon: "📋",
      color: "from-blue-500 to-indigo-500",
      bgGlow: "bg-blue-500"
    },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <div 
            key={c.label} 
            className="group relative animate-slide-up glass-light rounded-2xl p-6 transition-all duration-300 hover:scale-105"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {/* Glow effect */}
            <div className={`absolute inset-0 ${c.bgGlow} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-300 rounded-2xl`}></div>
            
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div className={`text-4xl bg-gradient-to-br ${c.color} bg-clip-text opacity-80 group-hover:opacity-100 transition-opacity`}>
                  {c.icon}
                </div>
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${c.color} opacity-20`}></div>
              </div>
              <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold mb-2">{c.label}</p>
              <p className="text-3xl font-bold text-white">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <AgentChat onDataChanged={() => setRefreshKey((k) => k + 1)} />
        </section>
        <section>
          <LowStockList items={data?.low_items ?? null} error={error} />
        </section>
      </div>
    </main>
  );
}
