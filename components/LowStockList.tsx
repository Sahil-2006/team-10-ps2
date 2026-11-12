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
    <div className="glass rounded-2xl overflow-hidden animate-fade-in h-[70vh] flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl">
            ⚠️
          </div>
          <div>
            <h2 className="font-bold text-white text-lg">Critical Alerts</h2>
            <p className="text-xs text-slate-400">Real-time stock monitoring</p>
          </div>
        </div>
      </div>

      {/* List */}
      <ul className="flex-1 divide-y divide-[#E5DED8] overflow-y-auto bg-white">
        {error && (
          <li className="p-5">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-700 flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <span>{error}</span>
              </p>
            </div>
          </li>
        )}
        
        {!error && items?.length === 0 && (
          <li className="p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-lg font-semibold text-green-700">All Stocked Up!</p>
            <p className="text-sm text-gray-500 mt-2">No critical items at the moment</p>
          </li>
        )}
        
        {items?.map((i, idx) => (
          <li 
            key={i.sku} 
            className="px-5 py-4 hover:bg-[#F5F1ED] transition-colors animate-slide-up" 
            style={{ animationDelay: `${idx * 30}ms` }}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <p className="font-semibold text-gray-900 flex-1">{i.name}</p>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-red-600">{i.days_left ?? "-"}</p>
                <p className="text-xs text-gray-500">days left</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
              <span className="font-mono bg-[#F5F1ED] px-2 py-1 rounded">{i.stock_qty}</span>
              <span>/</span>
              <span className="text-gray-500">{i.reorder_level} needed</span>
            </div>
            
            <p className="text-xs text-gray-500 mb-3">📦 {i.supplier_name}</p>
            
            <div className="flex flex-wrap gap-2">
              <StockBadges low atRisk={i.at_risk} poId={i.already_on_order} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
