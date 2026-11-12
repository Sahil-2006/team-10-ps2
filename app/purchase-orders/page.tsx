"use client";

import { Badge } from "@/components/Badges";
import { useLiveData } from "@/components/useLiveData";
import { formatRs } from "@/lib/format";

type PO = {
  id: number;
  supplier_name: string;
  status: "draft" | "sent" | "received" | "cancelled";
  total_cost: number;
  expected_date: string | null;
  notes: string | null;
  items: { sku: string; name: string; quantity: number; unit_cost: number }[];
};

const STATUS_COLOR = { draft: "slate", sent: "blue", received: "green", cancelled: "red" } as const;

/* PURCHASE ORDERS: cards, refreshed every 5 seconds. */
export default function PurchaseOrdersPage() {
  const { data, error } = useLiveData<{ purchase_orders: PO[] }>("/api/purchase-orders");
  const orders = data?.purchase_orders ?? [];

  return (
    <main className="mx-auto max-w-4xl space-y-3 p-4 md:p-6">
      <h1 className="text-lg font-semibold">Purchase Orders</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {data && orders.length === 0 && <p className="text-sm text-slate-500">No purchase orders yet.</p>}
      {orders.map((po) => (
        <article key={po.id} className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">
              PO #{po.id} · {po.supplier_name}
            </p>
            <Badge color={STATUS_COLOR[po.status]}>{po.status.toUpperCase()}</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">Expected: {po.expected_date ?? "-"}</p>
          <ul className="mt-2 divide-y divide-slate-100">
            {po.items.map((i) => (
              <li key={i.sku} className="flex justify-between gap-2 py-1">
                <span>{i.name}</span>
                <span className="shrink-0 text-slate-600">
                  {i.quantity} × {formatRs(i.unit_cost)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-right font-semibold">Total {formatRs(po.total_cost)}</p>
          {po.notes && <p className="mt-1 text-xs text-slate-500">{po.notes}</p>}
        </article>
      ))}
    </main>
  );
}
