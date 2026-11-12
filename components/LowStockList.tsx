"use client";

import { StockBadges } from "./Badges";

export type LowItem = {
  sku: string;
  name: string;
  category: string;
  stock_qty: number;
  reorder_level: number;
  days_left: number | null;
  supplier_name: string;
  at_risk: boolean;
  already_on_order: number | null;
};

/** Live list of the most urgent low-stock items (data comes from the dashboard page). */
export default function LowStockList({ items, error }: { items: LowItem[] | null; error: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
      <div className="border-b border-slate-200 bg-gradient-to-r from-red-500 to-orange-500 px-5 py-4">
        <h2 className="font-bold text-white text-lg flex items-center gap-2">
          ⚠️ Low Stock Alert
        </h2>
        <p className="text-xs text-red-50 mt-1">Most urgent first. Updates live.</p>
      </div>
      <ul className="divide-y divide-slate-100 max-h-[calc(70vh-80px)] overflow-y-auto">
        {error && <li className="p-4 text-sm text-red-600 bg-red-50">⚠️ {error}</li>}
        {!error && items?.length === 0 && (
          <li className="p-6 text-center">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-sm font-medium text-emerald-600">All items are stocked!</p>
            <p className="text-xs text-slate-500 mt-1">No low stock items right now</p>
          </li>
        )}
        {items?.map((i, idx) => (
          <li key={i.sku} className="px-4 py-3 text-sm hover:bg-slate-50 transition-colors animate-slide-in" style={{ animationDelay: `${idx * 30}ms` }}>
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-slate-900">{i.name}</p>
              <div className="shrink-0 text-right">
                <p className="text-xs font-bold text-slate-700">{i.days_left ?? "-"} days</p>
                <p className="text-xs text-slate-500">left</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              <span className="font-medium">{i.stock_qty}</span> in stock 
              <span className="text-slate-400"> (level {i.reorder_level})</span>
            </p>
            <p className="text-xs text-slate-600 mt-0.5">📦 {i.supplier_name}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <StockBadges low atRisk={i.at_risk} poId={i.already_on_order} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
