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
    { label: "Low stock items", value: data ? String(data.low_stock_count) : "-", icon: "⚠️", color: "text-red-600" },
    { label: "Reorder value needed", value: data ? formatRs(data.reorder_value) : "-", icon: "💰", color: "text-emerald-600" },
    { label: "At risk before delivery", value: data ? String(data.at_risk_count) : "-", icon: "🔥", color: "text-orange-600" },
    {
      label: "Open POs",
      value: data ? `${data.open_po_count} · ${formatRs(data.open_po_value)}` : "-",
      icon: "📋",
      color: "text-blue-600"
    },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <div 
            key={c.label} 
            className="elegant-card rounded-2xl p-6 animate-slide-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <span className={`text-4xl ${c.color}`}>{c.icon}</span>
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">{c.label}</p>
            <p className="text-3xl font-bold text-slate-900">{c.value}</p>
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
