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
    { label: "Low stock items", value: data ? String(data.low_stock_count) : "-", icon: "📊", color: "from-red-500 to-orange-500" },
    { label: "Reorder value needed", value: data ? formatRs(data.reorder_value) : "-", icon: "💰", color: "from-emerald-500 to-teal-500" },
    { label: "At risk before delivery", value: data ? String(data.at_risk_count) : "-", icon: "⚠️", color: "from-amber-500 to-yellow-500" },
    {
      label: "Open POs",
      value: data ? `${data.open_po_count} · ${formatRs(data.open_po_value)}` : "-",
      icon: "📋",
      color: "from-blue-500 to-indigo-500"
    },
  ];

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {cards.map((c, i) => (
          <div key={c.label} className="group animate-slide-in rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{c.label}</p>
                <p className="mt-2 break-words text-2xl font-bold text-slate-900">{c.value}</p>
              </div>
              <div className={`text-3xl bg-gradient-to-br ${c.color} bg-clip-text opacity-70 group-hover:opacity-100 transition-opacity`}>
                {c.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-5 md:gap-6">
        <section className="md:col-span-3">
          <AgentChat onDataChanged={() => setRefreshKey((k) => k + 1)} />
        </section>
        <section className="md:col-span-2">
          <LowStockList items={data?.low_items ?? null} error={error} />
        </section>
      </div>
    </main>
  );
}
