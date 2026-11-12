import { NextResponse } from "next/server";
import { z } from "zod";
import { getProductsWithSuppliers, getOpenOrderSkus, isLow, daysLeft, isAtRisk } from "@/lib/inventory";
import { categoryEnum } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  category: categoryEnum.optional(),
  q: z.string().trim().max(60).optional(),
});

/** GET /api/products?category=Dairy&q=milk -> products with supplier, days left and badges */
export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid category or search text." }, { status: 400 });
  }
  const { category, q } = parsed.data;
  try {
    const [products, open] = await Promise.all([getProductsWithSuppliers(), getOpenOrderSkus()]);
    const list = products
      .filter((p) => !category || p.category === category)
      .filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
      .map((p) => ({
        sku: p.sku,
        name: p.name,
        category: p.category,
        unit: p.unit,
        stock_qty: p.stock_qty,
        reorder_level: p.reorder_level,
        reorder_qty: p.reorder_qty,
        unit_cost: p.unit_cost,
        supplier_id: p.supplier_id,
        supplier_name: p.supplier_name,
        lead_time_days: p.lead_time_days,
        days_left: daysLeft(p),
        is_low: isLow(p),
        at_risk: isAtRisk(p),
        already_on_order: open.get(p.sku) ?? null,
      }));
    return NextResponse.json({ count: list.length, products: list });
  } catch (err) {
    console.error("products failed", err);
    return NextResponse.json({ error: "Could not load products." }, { status: 500 });
  }
}
