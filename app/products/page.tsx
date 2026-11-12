"use client";

import { useState } from "react";
import { StockBadges } from "@/components/Badges";
import { useLiveData } from "@/components/useLiveData";
import { CATEGORY_LIST } from "@/lib/schemas";

type Product = {
  sku: string;
  name: string;
  category: string;
  stock_qty: number;
  reorder_level: number;
  days_left: number | null;
  supplier_name: string;
  is_low: boolean;
  at_risk: boolean;
  already_on_order: number | null;
};

/* PRODUCTS: all 80 items with category filter and search. */
export default function ProductsPage() {
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (q.trim()) params.set("q", q.trim());
  const { data, error } = useLiveData<{ products: Product[] }>(`/api/products?${params}`, 0, 10000);
  const products = data?.products ?? [];

  return (
    <main className="mx-auto max-w-6xl space-y-3 p-4 md:p-6">
      <h1 className="text-lg font-semibold">Products</h1>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name..."
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
      />
      <div className="flex flex-wrap gap-2">
        {["", ...CATEGORY_LIST].map((c) => (
          <button
            key={c || "all"}
            onClick={() => setCategory(c)}
            className={`min-h-9 rounded-full border px-3 py-1 text-sm ${
              category === c ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white"
            }`}
          >
            {c || "All"}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-slate-500">{products.length} products</p>

      {/* Phones: card list */}
      <ul className="space-y-2 md:hidden">
        {products.map((p) => (
          <li key={p.sku} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium">{p.name}</p>
              <p className="shrink-0 text-xs text-slate-500">{p.sku}</p>
            </div>
            <p className="text-xs text-slate-500">
              {p.category} · {p.supplier_name}
            </p>
            <p className="mt-1">
              Stock <b>{p.stock_qty}</b> (level {p.reorder_level}) · {p.days_left ?? "-"} days left
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              <StockBadges low={p.is_low} atRisk={p.at_risk} poId={p.already_on_order} />
            </div>
          </li>
        ))}
      </ul>

      {/* Larger screens: table */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              {["SKU", "Name", "Category", "Stock", "Reorder level", "Days left", "Supplier", "Status"].map((h) => (
                <th key={h} className="px-3 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => (
              <tr key={p.sku}>
                <td className="px-3 py-2 text-slate-500">{p.sku}</td>
                <td className="px-3 py-2 font-medium">{p.name}</td>
                <td className="px-3 py-2">{p.category}</td>
                <td className="px-3 py-2">{p.stock_qty}</td>
                <td className="px-3 py-2">{p.reorder_level}</td>
                <td className="px-3 py-2">{p.days_left ?? "-"}</td>
                <td className="px-3 py-2">{p.supplier_name}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <StockBadges low={p.is_low} atRisk={p.at_risk} poId={p.already_on_order} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
