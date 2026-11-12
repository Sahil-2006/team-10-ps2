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
      <div className="relative bg-gradient-to-r from-red-600 to-orange-600 px-6 py-5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-2xl">
            ⚠️
          </div>
          <div>
            <h2 className="font-bold text-white text-xl">Critical Alerts</h2>
            <p className="text-xs text-red-100">Real-time stock monitoring</p>
          </div>
        </div>
      </div>

      {/* List */}
      <ul className="flex-1 divide-y divide-slate-800 overflow-y-auto bg-slate-900/40">
        {error && (
          <li className="p-5">
            <div className="glass-light border border-red-500/30 rounded-xl p-4">
              <p className="text-sm text-red-400 flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <span>{error}</span>
              </p>
            </div>
          </li>
        )}
        
        {!error && items?.length === 0 && (
          <li className="p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-lg font-semibold text-emerald-400">All Stocked Up!</p>
            <p className="text-sm text-slate-500 mt-2">No critical items at the moment</p>
          </li>
        )}
        
        {items?.map((i, idx) => (
          <li 
            key={i.sku} 
            className="px-5 py-4 hover:bg-slate-800/30 transition-colors animate-slide-up" 
            style={{ animationDelay: `${idx * 30}ms` }}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <p className="font-semibold text-slate-100 flex-1">{i.name}</p>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-red-400">{i.days_left ?? "-"}</p>
                <p className="text-xs text-slate-500">days left</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <span className="font-mono bg-slate-800 px-2 py-1 rounded">{i.stock_qty}</span>
              <span>/</span>
              <span className="text-slate-500">{i.reorder_level} needed</span>
            </div>
            
            <p className="text-xs text-slate-500 mb-3">📦 {i.supplier_name}</p>
            
            <div className="flex flex-wrap gap-2">
              <StockBadges low atRisk={i.at_risk} poId={i.already_on_order} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
