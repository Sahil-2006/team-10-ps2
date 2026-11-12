import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getProductsWithSuppliers, getOpenOrderSkus, isLow, daysLeft, isAtRisk } from "@/lib/inventory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/dashboard -> stat cards + top 10 urgent low items */
export async function GET() {
  try {
    const [products, open] = await Promise.all([getProductsWithSuppliers(), getOpenOrderSkus()]);
    const low = products
      .filter(isLow)
      .sort((a, b) => (daysLeft(a) ?? 9999) - (daysLeft(b) ?? 9999));

    const { data: pos, error } = await getSupabase()
      .from("purchase_orders")
      .select("total_cost")
      .in("status", ["draft", "sent"]);
    if (error) throw new Error(error.message);

    return NextResponse.json({
      total_products: products.length,
      low_stock_count: low.length,
      at_risk_count: products.filter(isAtRisk).length,
      // Cost of low items that are not already on an open PO
      reorder_value: low
        .filter((p) => !open.has(p.sku))
        .reduce((s, p) => s + p.reorder_qty * p.unit_cost, 0),
      inventory_value: products.reduce((s, p) => s + p.stock_qty * p.unit_cost, 0),
      open_po_count: pos.length,
      open_po_value: pos.reduce((s, p) => s + Number(p.total_cost), 0),
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
