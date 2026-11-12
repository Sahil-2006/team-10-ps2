import "server-only";
import { z } from "zod";
import { defineTool, type AgentTool } from "./defineTool";
import { getSupabase } from "../supabase";
import { categoryEnum, supplierIdSchema, skuSchema } from "../schemas";
import {
  getProductsWithSuppliers,
  getOpenOrderSkus,
  isLow,
  daysLeft,
  isAtRisk,
  addDaysInIndia,
  formatRs,
  assertStatusChange,
  type Product,
} from "../inventory";

/* StockPilot agent tools. Gemini picks the tool; the server does all the maths. */

type Rel<T> = T | T[] | null;
const one = <T>(v: Rel<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

/** Days left sorted ascending; items that never sell go last. */
const byDaysLeft = (a: Product, b: Product) => (daysLeft(a) ?? 9999) - (daysLeft(b) ?? 9999);

// ---------- READ TOOLS ----------

const getLowStockItems = defineTool({
  name: "getLowStockItems",
  description:
    "Use this when the manager asks what is low on stock, what needs reordering or restocking. Returns items where stock is at or below the reorder level, most urgent first. Only shows data, never creates orders.",
  schema: z.object({
    category: categoryEnum.optional().describe("Only items of this category"),
    supplier_id: supplierIdSchema.optional().describe("Only items from this supplier, like SUP01"),
  }),
  run: async ({ category, supplier_id }) => {
    const [products, open] = await Promise.all([getProductsWithSuppliers(), getOpenOrderSkus()]);
    const low = products
      .filter(isLow)
      .filter((p) => !category || p.category === category)
      .filter((p) => !supplier_id || p.supplier_id === supplier_id)
      .sort(byDaysLeft);
    const items = low.map((p) => ({
      sku: p.sku,
      name: p.name,
      category: p.category,
      stock_qty: p.stock_qty,
      reorder_level: p.reorder_level,
      reorder_qty: p.reorder_qty,
      days_left: daysLeft(p),
      supplier_id: p.supplier_id,
      supplier_name: p.supplier_name,
      lead_time_days: p.lead_time_days,
      at_risk: isAtRisk(p),
      line_cost: p.reorder_qty * p.unit_cost,
      already_on_order: open.get(p.sku) ?? null,
    }));
    const toOrder = items.filter((i) => i.already_on_order === null);
    return {
      count: items.length,
      supplier_count: new Set(items.map((i) => i.supplier_id)).size,
      not_yet_ordered_count: toOrder.length,
      total_reorder_cost: toOrder.reduce((s, i) => s + i.line_cost, 0),
      items: items.slice(0, 20),
      note: items.length > 20 ? `Showing the 20 most urgent of ${items.length}` : undefined,
    };
  },
});

const getStockForecast = defineTool({
  name: "getStockForecast",
  description:
    "Use this when the manager asks what will run out within some days, even if it is not yet below the reorder level. Returns all items (low or not) with days of stock left at or under the limit, and flags stock-out risk before delivery.",
  schema: z.object({
    within_days: z
      .number()
      .int()
      .min(1)
      .max(30)
      .default(3)
      .describe("Look ahead this many days (1-30). Default 3."),
    category: categoryEnum.optional().describe("Only items of this category"),
  }),
  run: async ({ within_days, category }) => {
    const [products, open] = await Promise.all([getProductsWithSuppliers(), getOpenOrderSkus()]);
    const hits = products
      .filter((p) => !category || p.category === category)
      .filter((p) => {
        const d = daysLeft(p);
        return d !== null && d <= within_days;
      })
      .sort(byDaysLeft);
    return {
      within_days,
      count: hits.length,
      items: hits.slice(0, 20).map((p) => ({
        sku: p.sku,
        name: p.name,
        stock_qty: p.stock_qty,
        days_left: daysLeft(p),
        is_low: isLow(p),
        lead_time_days: p.lead_time_days,
        at_risk: isAtRisk(p),
        already_on_order: open.get(p.sku) ?? null,
      })),
      note: hits.length > 20 ? `Showing the 20 most urgent of ${hits.length}` : undefined,
    };
  },
});

const getSupplierDetails = defineTool({
  name: "getSupplierDetails",
  description:
    "Use this when the manager asks about a supplier: contact, city, lead time, rating, minimum order value, or which of their items are low. Give a supplier id or part of the name.",
  schema: z
    .object({
      supplier_id: supplierIdSchema.optional().describe("Supplier id like SUP01"),
      name_query: z
        .string()
        .trim()
        .min(1)
        .max(60)
        .optional()
        .describe("Part of the supplier name, case-insensitive, like 'aavin'"),
    })
    .refine((a) => a.supplier_id || a.name_query, {
      message: "Give supplier_id or name_query",
    }),
  run: async ({ supplier_id, name_query }) => {
    let q = getSupabase().from("suppliers").select("*");
    if (supplier_id) q = q.eq("id", supplier_id);
    if (name_query) q = q.ilike("name", `%${name_query}%`);
    const { data, error } = await q.limit(5);
    if (error) throw new Error(error.message);
    if (!data?.length) throw new Error("No supplier matched that id or name.");
    const products = await getProductsWithSuppliers();
    return {
      suppliers: data.map((s) => ({
        id: s.id,
        name: s.name,
        city: s.city,
        contact_email: s.contact_email,
        lead_time_days: Number(s.lead_time_days),
        rating: Number(s.rating),
        min_order_value: Number(s.min_order_value),
        low_items: products
          .filter((p) => p.supplier_id === s.id && isLow(p))
          .sort(byDaysLeft)
          .slice(0, 20)
          .map((p) => ({
            sku: p.sku,
            name: p.name,
            stock_qty: p.stock_qty,
            reorder_qty: p.reorder_qty,
            days_left: daysLeft(p),
          })),
      })),
    };
  },
});

const getPurchaseOrders = defineTool({
  name: "getPurchaseOrders",
  description:
    "Use this when the manager asks to see purchase orders, their status, or needs a PO id. Newest first, with supplier, total, expected date and items.",
  schema: z.object({
    status: z
      .enum(["draft", "sent", "received", "cancelled"])
      .optional()
      .describe("Only POs with this status"),
    limit: z.number().int().min(1).max(20).default(10).describe("How many POs to return (1-20)"),
  }),
  run: async ({ status, limit }) => {
    let q = getSupabase()
      .from("purchase_orders")
      .select(
        "id, status, total_cost, expected_date, notes, created_at, suppliers(name), purchase_order_items(sku, quantity, unit_cost, products(name))"
      )
      .order("id", { ascending: false })
      .limit(limit);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return {
      count: data.length,
      purchase_orders: data.map((po) => ({
        id: Number(po.id),
        supplier_name: one<{ name: string }>(po.suppliers)?.name ?? null,
        status: po.status,
        total_cost: Number(po.total_cost),
        expected_date: po.expected_date,
        notes: po.notes,
        created_at: po.created_at,
        items: (po.purchase_order_items ?? []).map((i) => ({
          sku: i.sku,
          name: one<{ name: string }>(i.products)?.name ?? null,
          quantity: Number(i.quantity),
          unit_cost: Number(i.unit_cost),
        })),
      })),
    };
  },
});

// ---------- WRITE TOOLS ----------

const createPurchaseOrders = defineTool({
  name: "createPurchaseOrders",
  description:
    "Use this when the manager clearly asks to create, raise or place purchase orders / restock orders. Never call it just to show what is low. Creates draft POs, one per supplier, for low items. The server decides quantities (reorder quantity), prices and totals.",
  writes: true,
  schema: z.object({
    category: categoryEnum.optional().describe("Only order low items of this category"),
    supplier_id: supplierIdSchema.optional().describe("Only order low items from this supplier, like SUP01"),
    skus: z
      .array(skuSchema)
      .min(1)
      .max(30)
      .optional()
      .describe("Only order these specific SKUs, like SKU012. Leave out to order all matching low items."),
  }),
  run: async ({ category, supplier_id, skus }) => {
    const [products, open] = await Promise.all([getProductsWithSuppliers(), getOpenOrderSkus()]);

    // Check that the ids exist
    if (supplier_id && !products.some((p) => p.supplier_id === supplier_id)) {
      throw new Error(`Unknown supplier ${supplier_id}.`);
    }
    const unknown = (skus ?? []).filter((s) => !products.some((p) => p.sku === s));
    if (unknown.length) throw new Error(`Unknown SKU: ${unknown.join(", ")}.`);

    // Pick the requested items
    let picked = products;
    if (category) picked = picked.filter((p) => p.category === category);
    if (supplier_id) picked = picked.filter((p) => p.supplier_id === supplier_id);
    if (skus) picked = picked.filter((p) => skus.includes(p.sku));
    if (!picked.length) throw new Error("No products match that request.");

    // Split into: order now / not low / already ordered
    const toOrder: Product[] = [];
    const skippedNotLow: { sku: string; name: string; stock_qty: number; reorder_level: number }[] = [];
    const skippedAlreadyOrdered: { sku: string; name: string; purchase_order_id: number }[] = [];
    for (const p of picked) {
      const onPo = open.get(p.sku);
      if (!isLow(p)) {
        // When asking for everything, non-low items are not interesting. Only report explicit requests.
        if (skus) skippedNotLow.push({ sku: p.sku, name: p.name, stock_qty: p.stock_qty, reorder_level: p.reorder_level });
      } else if (onPo !== undefined) {
        skippedAlreadyOrdered.push({ sku: p.sku, name: p.name, purchase_order_id: onPo });
      } else {
        toOrder.push(p);
      }
    }
    if (!toOrder.length) {
      const why: string[] = [];
      if (skippedNotLow.length)
        why.push(
          "not low: " + skippedNotLow.map((s) => `${s.name} has ${s.stock_qty}, reorder level ${s.reorder_level}`).join("; ")
        );
      if (skippedAlreadyOrdered.length)
        why.push(
          "already ordered: " +
            skippedAlreadyOrdered.map((s) => `${s.name} is already on PO #${s.purchase_order_id}`).join("; ")
        );
      if (!why.length) why.push("none of the matching items are below their reorder level");
      throw new Error(`Nothing was ordered. ${why.join(". ")}.`);
    }

    // One PO per supplier
    const bySupplier = new Map<string, Product[]>();
    for (const p of toOrder) bySupplier.set(p.supplier_id, [...(bySupplier.get(p.supplier_id) ?? []), p]);

    const db = getSupabase();
    const created = [];
    for (const [sid, items] of bySupplier) {
      const first = items[0];
      const total = items.reduce((s, p) => s + p.reorder_qty * p.unit_cost, 0);
      const warning =
        total < first.min_order_value
          ? `Below min order value of ${formatRs(first.min_order_value)}`
          : null;
      const expected = addDaysInIndia(first.lead_time_days);
      const { data: po, error } = await db
        .from("purchase_orders")
        .insert({
          supplier_id: sid,
          status: "draft",
          total_cost: total,
          expected_date: expected,
          notes: "Created by StockPilot agent" + (warning ? ` | ${warning}` : ""),
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      const { error: itemsError } = await db.from("purchase_order_items").insert(
        items.map((p) => ({
          purchase_order_id: po.id,
          sku: p.sku,
          quantity: p.reorder_qty,
          unit_cost: p.unit_cost,
        }))
      );
      if (itemsError) {
        // No half-made PO left behind
        await db.from("purchase_orders").delete().eq("id", po.id);
        throw new Error(itemsError.message);
      }
      created.push({
        purchase_order_id: Number(po.id),
        supplier_id: sid,
        supplier_name: first.supplier_name,
        items: items.map((p) => ({
          sku: p.sku,
          name: p.name,
          quantity: p.reorder_qty,
          unit_cost: p.unit_cost,
        })),
        total_cost: total,
        expected_date: expected,
        warning,
      });
    }
    return {
      created,
      skipped_not_low: skippedNotLow.slice(0, 20),
      skipped_already_ordered: skippedAlreadyOrdered.slice(0, 20),
      grand_total: created.reduce((s, c) => s + c.total_cost, 0),
    };
  },
});

const updatePurchaseOrderStatus = defineTool({
  name: "updatePurchaseOrderStatus",
  description:
    "Use this when the manager asks to send/approve or cancel a specific purchase order. Call getPurchaseOrders first if you do not know the id.",
  writes: true,
  schema: z.object({
    purchase_order_id: z.number().int().positive().describe("The id of the purchase order"),
    new_status: z.enum(["sent", "cancelled"]).describe("sent = send/approve it, cancelled = cancel it"),
  }),
  run: async ({ purchase_order_id, new_status }) => {
    const db = getSupabase();
    const { data: po, error } = await db
      .from("purchase_orders")
      .select("id, status, suppliers(name)")
      .eq("id", purchase_order_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!po) throw new Error(`Purchase order #${purchase_order_id} was not found.`);
    assertStatusChange(purchase_order_id, po.status, new_status);
    const { error: upError } = await db
      .from("purchase_orders")
      .update({ status: new_status })
      .eq("id", purchase_order_id);
    if (upError) throw new Error(upError.message);
    return {
      purchase_order_id,
      supplier_name: one<{ name: string }>(po.suppliers)?.name ?? null,
      old_status: po.status,
      new_status,
    };
  },
});

/** Every tool in this list is given to Gemini. */
export const tools: AgentTool[] = [
  getLowStockItems,
  getStockForecast,
  getSupplierDetails,
  getPurchaseOrders,
  createPurchaseOrders,
  updatePurchaseOrderStatus,
];
