import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getProductsWithSuppliers, getOpenOrderSkus, isLow, daysLeft, isAtRisk } from "@/lib/inventory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/dashboard -> stat cards + top 10 urgent low items */
export async function GET() {
  try {
    const db = getSupabase();
    const [products, open, openOrders, received] = await Promise.all([
      getProductsWithSuppliers(),
      getOpenOrderSkus(),
      db.from("purchase_orders").select("total_cost").in("status", ["draft", "sent"]),
      db.from("purchase_orders").select("id, total_cost").eq("status", "received")
        .order("id", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (openOrders.error) throw new Error(openOrders.error.message);
    if (received.error) throw new Error(received.error.message);
    const low = products
      .filter(isLow)
      .sort((a, b) => (daysLeft(a) ?? 9999) - (daysLeft(b) ?? 9999));

    return NextResponse.json({
      total_products: products.length,
      low_stock_count: low.length,
      at_risk_count: products.filter(isAtRisk).length,
      // Cost of low items that are not already on an open PO
      reorder_value: low
        .filter((p) => !open.has(p.sku))
        .reduce((s, p) => s + p.reorder_qty * p.unit_cost, 0),
      inventory_value: products.reduce((s, p) => s + p.stock_qty * p.unit_cost, 0),
      open_po_count: openOrders.data.length,
      open_po_value: openOrders.data.reduce((sum, po) => sum + Number(po.total_cost), 0),
      latest_received_po: received.data
        ? { id: Number(received.data.id), total_cost: Number(received.data.total_cost) }
        : null,
      low_items: low.slice(0, 10).map((p) => ({
        sku: p.sku,
        name: p.name,
        category: p.category,
        stock_qty: p.stock_qty,
        reorder_level: p.reorder_level,
        days_left: daysLeft(p),
        supplier_name: p.supplier_name,
        at_risk: isAtRisk(p),
        already_on_order: open.get(p.sku) ?? null,
      })),
    });
  } catch (err) {
    console.error("dashboard failed", err);
    return NextResponse.json({ error: "Could not load the dashboard." }, { status: 500 });
  }
}
