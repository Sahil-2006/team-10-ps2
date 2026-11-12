import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Supabase may return a related row as an object or a one-item array
const one = <T>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

/** GET /api/purchase-orders -> latest 50 POs with supplier name and items */
export async function GET() {
  const { data, error } = await getSupabase()
    .from("purchase_orders")
    .select(
      "id, supplier_id, status, total_cost, expected_date, notes, created_at, suppliers(name), purchase_order_items(sku, quantity, unit_cost, products(name))"
    )
    .order("id", { ascending: false })
    .limit(50);
  if (error) {
    console.error("purchase orders failed", error.message);
    return NextResponse.json({ error: "Could not load purchase orders." }, { status: 500 });
  }
  return NextResponse.json({
    purchase_orders: data.map((po) => ({
      id: Number(po.id),
      supplier_id: po.supplier_id,
      supplier_name: one<{ name: string }>(po.suppliers)?.name ?? po.supplier_id,
      status: po.status,
      total_cost: Number(po.total_cost),
      expected_date: po.expected_date,
      notes: po.notes,
      created_at: po.created_at,
      items: (po.purchase_order_items ?? []).map((i) => ({
        sku: i.sku,
        name: one<{ name: string }>(i.products)?.name ?? i.sku,
        quantity: Number(i.quantity),
        unit_cost: Number(i.unit_cost),
      })),
    })),
  });
}
