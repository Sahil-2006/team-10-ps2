import "server-only";
import { getSupabase } from "./supabase";
import { CATEGORY_LIST } from "./schemas";

/* Shared inventory helpers, used by agent tools and API routes. */

export const CATEGORIES = CATEGORY_LIST;

export type Product = {
  sku: string;
  name: string;
  category: string;
  supplier_id: string;
  unit: string;
  stock_qty: number;
  reorder_level: number;
  reorder_qty: number;
  avg_daily_sales: number;
  unit_cost: number;
  selling_price: number;
  supplier_name: string;
  lead_time_days: number;
  min_order_value: number;
};

type Rel<T> = T | T[] | null; // Supabase may return a related row as object or array
const one = <T>(v: Rel<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

/** All products joined with their supplier. Numbers are converted with Number(). */
export async function getProductsWithSuppliers(): Promise<Product[]> {
  const { data, error } = await getSupabase()
    .from("products")
    .select("*, suppliers(name, lead_time_days, min_order_value)")
    .order("sku");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const s = one<{ name: string; lead_time_days: number; min_order_value: number }>(row.suppliers);
    return {
      sku: row.sku,
      name: row.name,
      category: row.category,
      supplier_id: row.supplier_id,
      unit: row.unit,
      stock_qty: Number(row.stock_qty),
      reorder_level: Number(row.reorder_level),
      reorder_qty: Number(row.reorder_qty),
      avg_daily_sales: Number(row.avg_daily_sales),
      unit_cost: Number(row.unit_cost),
      selling_price: Number(row.selling_price),
      supplier_name: s?.name ?? row.supplier_id,
      lead_time_days: Number(s?.lead_time_days ?? 0),
      min_order_value: Number(s?.min_order_value ?? 0),
    };
  });
}

/** LOW = stock at or below the reorder level. */
export const isLow = (p: Product) => p.stock_qty <= p.reorder_level;

/** Days of stock left, 1 decimal. null when the item does not sell. */
export function daysLeft(p: Product): number | null {
  if (p.avg_daily_sales <= 0) return null;
  return Math.round((p.stock_qty / p.avg_daily_sales) * 10) / 10;
}

/** AT RISK = it will run out before a new delivery could arrive. */
export function isAtRisk(p: Product): boolean {
  const d = daysLeft(p);
  return d !== null && d < p.lead_time_days;
}

/** Map of sku -> purchase order id for items on a draft or sent PO. */
export async function getOpenOrderSkus(): Promise<Map<string, number>> {
  const { data, error } = await getSupabase()
    .from("purchase_order_items")
    .select("sku, purchase_order_id, purchase_orders!inner(status)")
    .in("purchase_orders.status", ["draft", "sent"]);
  if (error) throw new Error(error.message);
  const map = new Map<string, number>();
  for (const r of data ?? []) {
    const id = Number(r.purchase_order_id);
    const prev = map.get(r.sku);
    if (prev === undefined || id > prev) map.set(r.sku, id);
  }
  return map;
}

/** YYYY-MM-DD for today in India plus N days. */
export function addDaysInIndia(days: number): string {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** "Rs 1,23,450" (shared with the UI) */
export { formatRs } from "./format";

/** Allowed purchase order status changes. Nothing else is allowed. */
const TRANSITIONS: Record<string, string[]> = {
  draft: ["sent", "cancelled"],
  sent: ["cancelled", "received"],
  received: [],
  cancelled: [],
};
export function assertStatusChange(poId: number, from: string, to: string) {
  if ((TRANSITIONS[from] ?? []).includes(to)) return;
  if (from === to) throw new Error(`PO #${poId} is already ${from}.`);
  if (from === "received" || from === "cancelled")
    throw new Error(`PO #${poId} is already ${from} and cannot be changed to ${to}.`);
  throw new Error(`PO #${poId} is ${from} and cannot be changed to ${to}.`);
}
