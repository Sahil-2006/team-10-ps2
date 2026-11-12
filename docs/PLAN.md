# StockPilot · Team 18 · PS2 Inventory Restock Agent

Build plan + Claude Code prompts. Read Part A once as a team (5 min), then everyone works from Part C.

---

# PART A — THE PLAN

## A1. What the SQL file is (decided)

`ps2_inventory_restock.sql` **is your whole database**. It creates 4 tables with fake FreshMart Velachery data:

| Table | What it holds |
|---|---|
| `suppliers` | 10 suppliers (SUP01–SUP10) with `lead_time_days`, `rating`, `min_order_value` |
| `products` | 80 SKUs (SKU001–SKU080) with `stock_qty`, `reorder_level`, `reorder_qty`, `avg_daily_sales`, `unit_cost` |
| `purchase_orders` | POs, status `draft / sent / received / cancelled`, `total_cost`, `expected_date`, `notes` |
| `purchase_order_items` | Lines of each PO (`sku`, `quantity`, `unit_cost`) |

How to use it: Supabase → SQL Editor → run `seed/00_starter_example.sql` first, then this file. Re-running it **resets all data** (use this before the demo). RLS is ON with no policies, so only the server (secret key) can read it, which is exactly how the starter works.

Important: unlike PS7/PS8, **PS2 has no database functions**, so per the handbook (PS1–PS6 path) the business rules are checked **in TypeScript inside the write tools**.

## A2. What the data actually says (use this in your demo and slides)

- **18 of 80 products are low stock** (`stock_qty <= reorder_level`), across **9 suppliers** (Frozen Fresh Foods SUP10 has none).
- Worst cases: Tea Powder (2 left, ~0.1 days), Coconut Hair Oil (3 left, ~0.1 days, supplier lead time 5 days!), Garbage Bags, Aluminium Foil, Toned Milk (0.8 days).
- **Edge case to show judges:** Toothpaste 150g is *not* low (67 > 49) but runs out in ~2.7 days and its supplier takes 5 days. "Which items will run out in 3 days?" must include it. That proves your forecast tool is real, not a copy of the low-stock rule.
- Low dairy = Toned Milk, Cheese Slices, Buttermilk (all SUP01). "Create POs for all low-stock dairy" → exactly **1 PO** to Aavin.
- Old PO #1 (SUP05, received) exists. Every new PO starts at id 2.
- `min_order_value` exists in the data but isn't in the rule. We use it as a **warning in notes**, not a block.
- Gotcha: Supabase JS can't compare two columns (`stock_qty <= reorder_level`). Fetch the 80 products and filter in TypeScript. Tiny table, totally fine.

## A3. The agent (this is the 30 marks)

No logged-in user id for PS2 (the user is the store manager). Skip `lib/currentUser.ts`.

| # | Tool | R/W | What it does |
|---|---|---|---|
| 1 | `getLowStockItems` | Read | Low items (`stock_qty <= reorder_level`), optional filter by category / supplier. Each item includes days left, supplier name, lead time, reorder qty, line cost, and **`already_on_order`** (true if it's in a draft/sent PO) |
| 2 | `getStockForecast` | Read | Items that run out within N days (`stock_qty / avg_daily_sales`), incl. non-low ones; flags `stockout_risk` when days left < supplier lead time |
| 3 | `getSupplierDetails` | Read | Supplier by id or name: city, email, lead time, rating, min order value, and their low items |
| 4 | `getPurchaseOrders` | Read | POs with supplier name, status, total, expected date, items |
| 5 | `createPurchaseOrders` | **Write** | Creates draft POs, **one per supplier**, for low items (all / by category / by supplier / by SKU list) |
| 6 | `updatePurchaseOrderStatus` | **Write** | draft → sent, draft/sent → cancelled. Any other change is refused |
| 7 | `receivePurchaseOrder` *(stretch)* | **Write** | sent → received, adds quantities to `stock_qty` (via a database function, atomic) |

**Rules enforced inside `createPurchaseOrders` (in code, not trusted to Gemini):**
1. Gemini only says *which* items (category / supplier / SKUs). **Quantity = `reorder_qty`, price = `unit_cost`, total = sum**, all computed by the server. Gemini never sends a quantity or a price.
2. Only items that are low **right now** are ordered. A requested SKU that is not low → skipped with a reason ("Onion has 389, reorder level 97").
3. Unknown SKU / supplier → clear error.
4. An item already in a draft or sent PO is skipped ("already on PO #3"). This stops duplicate orders if the manager asks twice.
5. **One PO per supplier** per call; `expected_date = today (IST) + lead_time_days`.
6. If a PO total < supplier `min_order_value` → still created, with a warning in `notes` and in the reply.
7. If inserting items fails, delete the half-made PO (no orphan rows).

Zod validates every argument (enums for category and status, `SKU\d{3}` / `SUP\d{2}` regex, limits). `MAX_ROUNDS` goes 5 → 8 because "create POs for dairy" uses 2–3 tools.

## A4. Screens and APIs

| Page | Shows |
|---|---|
| `/` Dashboard | Stat cards (low-stock count, reorder value needed, at-risk items, open POs + value) · Agent chat · Low-stock list (live) |
| `/products` | All 80 products, category filter, search, LOW / AT RISK badges, days left |
| `/purchase-orders` | POs as cards with status badge, items, total, expected date; buttons Send / Cancel / Receive (stretch) |

APIs: `GET /api/dashboard`, `GET /api/products`, `GET /api/purchase-orders`, `POST /api/purchase-orders/[id]/status` (stretch). Health check switched from `tasks` to `products`.

The chat already shows every tool step (starter `AgentChat`), and lists refresh after a write. That's the "user can see what the agent did" UX mark.

## A5. Team roles (team of 4 → combine roles per the guide)

Suggested; swap names as you like, but keep **AI/Agent with one person**.

| Member | Role | Owns (files) | Runs prompts |
|---|---|---|---|
| M P Pranav Kumar | AI / Agent | `lib/agent/`, `lib/inventory.ts` | P1, P2, P3 |
| Subash Moorthi | Team Lead + Database | repo, Supabase, Vercel, README, slides, `seed/` | P0, P6-SQL, P8 |
| Eediga Ram Charan | Backend / API | `app/api/`, `lib/schemas.ts` | P4, P6-API |
| Shreel Singh | Frontend | `app/**/page.tsx`, `components/` | P5, P7 |

**Commit history is judged.** Each person runs *their* prompts in Claude Code on *their own laptop* and pushes. Don't let one laptop do everything.

Also note rule 2: no code before the hackathon. Having this plan and these prompts ready is fine; writing code early is not.

## A6. Timeline

| Time | Who | What |
|---|---|---|
| 10:15–10:30 | All | Read PS2, confirm roles. Lead creates `team-18-ps2` from template. Pranav adds `CLAUDE.md` (Part B) + commits |
| 10:30–10:45 | Subash | Supabase (Mumbai) → run `00_starter_example.sql` then `ps2_inventory_restock.sql`. Everyone: `.env.local`, `npm run dev`. Lead deploys Vercel **now** |
| 10:45–11:00 | Pranav | Show A3 tool table to the mentor (this *is* your plan) |
| 11:00–11:40 | Pranav | **P1** read tools → test → push |
| 11:40–12:15 | Pranav | **P2** write tools → test → push |
| 12:15–12:30 | Pranav | **P3** system prompt → test main demo → push. ✅ Checkpoint |
| 11:00–12:30 (parallel) | Ram Charan | **P4** API routes (don't touch `lib/agent/`) |
| 1:30–2:45 | Shreel | **P5** pages · Ram Charan: help test · Subash: README skeleton |
| 1:30–2:45 | Pranav + Subash | **P6** stretch (receive stock) only if P1–P5 work |
| 2:45–3:15 | Pranav, Ram Charan | **P7** rule tests + `npm run build` + phone check |
| 2:45–3:25 | Subash + Shreel | **P8** README + 5 slides with screenshots |
| 3:25 | Subash | Reset data (re-run seed), test Vercel on a phone |
| 3:30 | — | CODE FREEZE. Submit form 3:30–4:00 (passcode in the form) |

---

# PART B — CLAUDE.md (paste at repo root, also copy to `.github/copilot-instructions.md` and `AGENTS.md`)

```markdown
# StockPilot project rules (Team 18 · PS2 Inventory Restock Agent)

- Goal: turn this starter into StockPilot, a restock agent for the store manager of FreshMart, Velachery. The manager asks in plain English; the agent finds low-stock items, forecasts stock-outs, groups items by supplier and creates draft purchase orders. There is NO logged-in user id; do not create lib/currentUser.ts.
- Stack (fixed, do not change or add frameworks): Next.js App Router, React, TypeScript, Tailwind CSS, Next.js route handlers, Zod, Supabase JS (server only, secret key), Gemini function calling via @google/genai, Vercel.
- Database (already created from seed/ps2_inventory_restock.sql; never rename or alter these):
  - suppliers(id text 'SUP01'..'SUP10', name, city, contact_email, lead_time_days int, rating numeric, min_order_value numeric)
  - products(sku text 'SKU001'..'SKU080', name, category, supplier_id -> suppliers.id, unit, stock_qty int, reorder_level int, reorder_qty int, avg_daily_sales numeric, unit_cost numeric, selling_price numeric)
  - purchase_orders(id bigint identity, supplier_id, status 'draft'|'sent'|'received'|'cancelled', total_cost numeric, expected_date date, notes text, created_at timestamptz)
  - purchase_order_items(id bigint identity, purchase_order_id -> purchase_orders.id on delete cascade, sku -> products.sku, quantity int, unit_cost numeric)
  - Categories (exact strings): Dairy, Bakery, Beverages, Snacks, Staples, Personal Care, Household, Fruits & Vegetables, Spices, Frozen.
- Business rules:
  - An item is LOW when stock_qty <= reorder_level. Supabase JS cannot compare two columns, so fetch products and filter in TypeScript.
  - Days of stock left = stock_qty / avg_daily_sales (1 decimal). AT RISK = days left < supplier lead_time_days.
  - Order exactly reorder_qty units at the product's unit_cost. One purchase order per supplier. New POs are 'draft'.
  - expected_date = today in India (Asia/Kolkata) + supplier lead_time_days.
  - Never order an item that is not low, or that is already in a 'draft' or 'sent' PO.
  - If a PO total is below the supplier's min_order_value, still create it but add a warning to notes.
  - Status changes allowed: draft->sent, draft->cancelled, sent->cancelled, sent->received. Nothing else.
- Gemini never decides quantities, prices or totals. The server computes them from the database.
- Agent tools live in lib/agent/tools.ts, built with defineTool() and a Zod schema, like the starter examples. Descriptions start with "Use this when...". Every Zod field has .describe(). Throw new Error("clear message") when a rule fails. Return small clean objects (max 20 rows).
- Shared inventory helpers live in lib/inventory.ts and are reused by tools and API routes.
- Only files in lib/ and app/api/ may call getSupabase(). Never use the Supabase secret key in components. Never commit .env.local.
- Do not change lib/agent/runAgent.ts (except MAX_ROUNDS), defineTool.ts, auth, proxy.ts or login.
- Money is shown like "Rs 1,23,450" (en-IN format). Numeric columns may arrive as strings: wrap with Number().
- Keep code simple with short comments. After changing code, run `npm run build` and fix every error.
```

---

# PART C — CLAUDE CODE PROMPTS

Rules for using them: one prompt at a time → read the diff → test in the app → `git add . && git commit -m "..." && git push`. Always `git pull` before starting.

## P0 · Setup (no Claude Code; Team Lead + Database)

1. Starter template → Use this template → `team-18-ps2` → add 3 collaborators.
2. Everyone: clone to `C:\Projects` (not OneDrive), `npm install`.
3. Supabase (Mumbai) → SQL Editor → run `seed/00_starter_example.sql`, then copy `ps2_inventory_restock.sql` into `seed/` and run it.
4. `.env.local` with the 5 values (`GEMINI_MODEL=gemini-3.8-flash`). Shared only in private team chat.
5. `npm run dev`, open `/api/health`, log in, try the sample task prompt.
6. Vercel: import repo, add the 5 env vars, Deploy.
7. Pranav: add `CLAUDE.md` from Part B (+ copies), commit "Add project rules".

## P1 · Read tools (Pranav)

```text
Read CLAUDE.md, seed/ps2_inventory_restock.sql, lib/agent/defineTool.ts and lib/agent/tools.ts.

1. Create lib/inventory.ts (server-only) with small helpers:
   - getProductsWithSuppliers(): all products joined with their supplier (name, lead_time_days, min_order_value), numbers converted with Number().
   - isLow(p), daysLeft(p) (stock_qty / avg_daily_sales, 1 decimal; if avg_daily_sales is 0 return null), isAtRisk(p) (daysLeft < supplier lead_time_days).
   - getOpenOrderSkus(): Map of sku -> purchase_order_id for items in POs with status 'draft' or 'sent'.
   - addDaysInIndia(days): YYYY-MM-DD for today in Asia/Kolkata plus days (reuse lib/dates.ts).
   - formatRs(n): "Rs 1,23,450" using en-IN.
   - CATEGORIES constant with the 10 exact category strings, and a Zod enum for it in lib/schemas.ts.

2. In lib/agent/tools.ts, remove the 3 task example tools and add 4 read tools with defineTool:
   - getLowStockItems: optional category (enum), optional supplier_id (regex ^SUP\d{2}$). Returns items where stock_qty <= reorder_level, sorted by days left ascending: sku, name, category, stock_qty, reorder_level, reorder_qty, days_left, supplier_id, supplier_name, lead_time_days, at_risk, line_cost (reorder_qty * unit_cost), already_on_order (PO id or null). Also return count and total_reorder_cost of the items not already on order.
   - getStockForecast: within_days (int 1-30, default 3), optional category. Returns ALL products (low or not) whose days_left <= within_days, with sku, name, stock_qty, days_left, is_low, lead_time_days, at_risk, already_on_order. Sorted by days_left.
   - getSupplierDetails: optional supplier_id, optional name_query (case-insensitive partial match). At least one is required (use a Zod refine). Returns supplier fields plus their currently low items.
   - getPurchaseOrders: optional status (enum draft|sent|received|cancelled), limit 1-20 default 10. Newest first, with supplier name, status, total_cost, expected_date, notes, created_at and items (sku, product name, quantity, unit_cost).
   Descriptions start with "Use this when..." and say clearly when to use each one (for example getStockForecast: "Use this when the manager asks what will run out within some days, even if it is not yet below the reorder level").
   Throw new Error(error.message) on Supabase errors.
3. Update app/api/health/route.ts to check the products table instead of tasks.
4. Run npm run build and fix errors.
```

**Test:** "What do I need to reorder this week?" (expect 18 items, 9 suppliers) · "Which items will run out in the next 3 days?" (Toothpaste must appear, marked not low). Click the grey tool box to see the args.
**Commit:** `Add read tools and inventory helpers`

## P2 · Write tools (Pranav)

```text
In lib/agent/tools.ts add 2 write tools (writes: true), using the helpers in lib/inventory.ts. Follow the rules in CLAUDE.md exactly.

1. createPurchaseOrders
   Args (all optional, Zod): category (enum), supplier_id (^SUP\d{2}$), skus (array of ^SKU\d{3}$, 1-30 items). If no args: all low items.
   Gemini must NOT send quantities, prices or totals; there are no such args.
   Steps:
   a. Load products with suppliers and the open-order SKU map.
   b. Pick the requested items. Unknown SKU or supplier -> throw a clear error.
   c. Split them into: to_order (low AND not already on a draft/sent PO), skipped_not_low (with stock_qty and reorder_level), skipped_already_ordered (with the PO id).
   d. If to_order is empty, throw new Error with a clear explanation of why nothing was ordered.
   e. Group to_order by supplier_id. For each supplier: insert one purchase_orders row (status 'draft', total_cost = sum of reorder_qty * unit_cost, expected_date = addDaysInIndia(lead_time_days), notes "Created by StockPilot agent" plus " | Below min order value of Rs X" if total < min_order_value). Then insert its purchase_order_items (quantity = reorder_qty, unit_cost = product unit_cost). If the items insert fails, delete that purchase_orders row and throw.
   f. Return created POs (id, supplier name, item lines, total, expected_date, warning), skipped_not_low, skipped_already_ordered, grand_total.
   Description: "Use this when the manager clearly asks to create, raise or place purchase orders / restock orders. Never call it just to show what is low."

2. updatePurchaseOrderStatus
   Args: purchase_order_id (positive int), new_status (enum: sent, cancelled).
   Read the PO first. Not found -> error. Allowed: draft->sent, draft->cancelled, sent->cancelled. Anything else -> throw a clear error (for example "PO #1 is already received and cannot be cancelled").
   Update only that row and return id, supplier name, old_status, new_status.
   Description: "Use this when the manager asks to send/approve or cancel a specific purchase order. Call getPurchaseOrders first if you do not know the id."

The tools array must be exactly: getLowStockItems, getStockForecast, getSupplierDetails, getPurchaseOrders, createPurchaseOrders, updatePurchaseOrderStatus.
Run npm run build and fix errors.
```

**Test:** "Create purchase orders for all low-stock dairy items" → 1 PO to Aavin with 3 lines. Ask the same again → refused, "already on PO #2". "Create a PO for SKU065" → refused, onion is not low. "Cancel PO 1" → refused, already received. Check the Supabase tables.
**Commit:** `Add purchase order write tools`

## P3 · System prompt + rounds (Pranav)

```text
1. Rewrite buildSystemPrompt in lib/agent/systemPrompt.ts for StockPilot:
- You are StockPilot, the professional restock assistant for the store manager of FreshMart, Velachery branch (Chennai).
- Keep the line with today's date (India time).
- Always use tools for stock, sales, suppliers and purchase orders. Never invent numbers, SKUs, suppliers or PO ids.
- Never guess an id. Call a read tool first to find real SKUs, supplier ids or PO ids, even if you listed them earlier.
- "What do I need to reorder" or "what is low" -> getLowStockItems, show only. Do NOT create orders unless the manager clearly asks to create, raise or place them.
- "What will run out in N days" -> getStockForecast. Point out items whose days left are less than the supplier lead time (stock-out before delivery).
- Before creating purchase orders, you may check low items, but createPurchaseOrders itself decides quantities (reorder_qty), prices and totals. Never promise a custom quantity; if asked, explain the rule is to order the reorder quantity.
- After creating POs, reply with one short line per PO: PO id, supplier, number of items, total in Rs, expected delivery date, and any warning. Then mention skipped items and why.
- If a tool returns an error, explain it in one sentence and suggest what the manager can do instead.
- Never undo an action to fix your own mistake; explain instead. Only cancel or send a PO when the manager asks for that specific PO.
- If the request is unclear (for example "do the usual"), ask one short question.
- Only help with inventory, suppliers and purchase orders for this store. Politely refuse anything else.
- Keep replies short. Money as "Rs 12,345". Use a short list when showing several items.
2. In lib/agent/runAgent.ts change MAX_ROUNDS from 5 to 8. Change nothing else there.
3. In components/AgentChat.tsx set SAMPLE_PROMPTS to:
   "What do I need to reorder this week?",
   "Create purchase orders for all low-stock dairy items.",
   "Which items will run out in the next 3 days?"
Run npm run build and fix errors.
```

**Test:** refresh, run all 3 samples, then "do the usual" (asks a question) and "write me a poem" (refuses).
**Commit:** `Add StockPilot system prompt`. ✅ 12:30 checkpoint done.

## P4 · API routes (Ram Charan, can run in parallel with P1–P3 once P1's lib/inventory.ts is pushed)

```text
Read CLAUDE.md and lib/inventory.ts. Following the pattern of app/api/tasks/route.ts, create:
1. app/api/dashboard/route.ts GET: { total_products, low_stock_count, at_risk_count, reorder_value (sum of reorder_qty*unit_cost for low items not already on order), inventory_value (sum stock_qty*unit_cost), open_po_count and open_po_value (status draft or sent), low_items (top 10 by days left: sku, name, category, stock_qty, reorder_level, days_left, supplier_name, at_risk, already_on_order) }.
2. app/api/products/route.ts GET with optional query params category and q (search by name). Validate params with Zod. Return all matching products with supplier name, days_left, is_low, at_risk. Order by category, then name.
3. app/api/purchase-orders/route.ts GET: latest 50 POs with supplier name and items (product names), newest first.
Add export const runtime = "nodejs" and export const dynamic = "force-dynamic" to each. On error: console.error and return status 500 with a short message.
Do not touch lib/agent/. Run npm run build and fix errors.
```

**Test:** open `/api/dashboard`, `/api/products?category=Dairy`, `/api/purchase-orders` in the browser (logged in).
**Commit:** `Add dashboard, products and purchase order APIs`

## P5 · Screens (Shreel, after lunch)

```text
Read CLAUDE.md, app/page.tsx and components/AgentChat.tsx. Build the StockPilot screens with Tailwind, clean and simple, working on a 360px phone screen.
1. components/NavBar.tsx: app name "StockPilot · FreshMart Velachery", links Dashboard (/), Products (/products), Purchase Orders (/purchase-orders), and the existing Log out action.
2. app/layout.tsx: page title "StockPilot", render NavBar on every page except /login.
3. app/page.tsx (Dashboard): a row of stat cards from /api/dashboard (Low stock items, Reorder value needed, At risk before delivery, Open POs with value). Below: AgentChat on the left (md:col-span-3) and components/LowStockList.tsx on the right (md:col-span-2), showing low_items with a red LOW badge, an amber AT RISK badge and a blue "On PO #x" badge when already_on_order. Remove TaskList. Reload stats and list when the agent writes data (existing refreshKey pattern) and every 5 seconds.
4. app/products/page.tsx: category filter chips and a search box using /api/products; a responsive table (card list on phones) with SKU, name, category, stock, reorder level, days left, supplier, badges.
5. app/purchase-orders/page.tsx: cards from /api/purchase-orders with PO id, supplier, status badge (draft grey, sent blue, received green, cancelled red), expected date, items with qty, total in Rs. Refresh every 5 seconds.
6. Supabase may return a related row as an object or a one-item array; handle both.
7. Delete components/TaskList.tsx and app/api/tasks when nothing uses them.
Run npm run build and fix errors.
```

**Test:** in chat, "Create purchase orders for all low-stock dairy items" → stats and lists change within 5 s; the new PO appears on `/purchase-orders`. Check on a phone width.
**Commit:** `Add dashboard, products and PO pages`

## P6 · Stretch: receive stock (only if P1–P5 all work by ~2:15)

**P6-SQL (Pranav writes with Claude Code, Subash runs it in Supabase):**

```text
Create seed/ps2_extras.sql with a Postgres function receive_purchase_order(p_po_id bigint) returns json that, in one transaction: locks the PO row (for update), raises an exception if not found or status is not 'sent', adds each purchase_order_items.quantity to products.stock_qty, sets status 'received', and returns json with po id, supplier_id and items received with new stock. End the file with: notify pgrst, 'reload schema';
Then in lib/agent/tools.ts add receivePurchaseOrder (writes: true), arg purchase_order_id (positive int), calling getSupabase().rpc("receive_purchase_order", { p_po_id: purchase_order_id }); throw new Error(error.message) on error. Do not update stock directly in TypeScript. Description: "Use this when the manager says a purchase order has arrived or been delivered." Add it to the tools array.
Run npm run build and fix errors.
```

**P6-API (Ram Charan + Shreel):**

```text
Create app/api/purchase-orders/[id]/status/route.ts POST { status } validated with Zod (enum sent, cancelled, received). Use the same transition rules as updatePurchaseOrderStatus (move the check into a shared helper in lib/inventory.ts and reuse it in the tool). For 'received' call the receive_purchase_order rpc. Return 409 with a clear message for a disallowed change.
On app/purchase-orders/page.tsx add buttons per PO: Send (draft), Cancel (draft/sent), Mark received (sent), with a confirm dialog and an error message on 409.
Run npm run build and fix errors.
```

**Test:** "Send PO 2" → "PO 2 has arrived" → milk/cheese/buttermilk stock goes up and they leave the low list.

## P7 · Test and harden (Pranav + Ram Charan, 2:45)

Type each in the chat. Every refusal must be polite with a reason:

| Test | Expected |
|---|---|
| "Create a PO for onions" | Refused: onion has 389, level 97 |
| "Create purchase orders for all low-stock dairy items" (2nd time) | Nothing new; already on PO #x |
| "Order 1000 units of toned milk" | Explains the rule: orders reorder qty (362) |
| "Cancel purchase order 99999" | Not found |
| "Cancel PO 1" | Already received |
| "Do the usual" | Asks one question |
| "Write me a poem about cricket" | Refuses, stays on topic |
| "Restock everything from Aavin" | 1 PO, SUP01 only |

If one fails:

```text
When the manager types "<test>", the agent <what happened>. It should <what should happen>. Enforce the rule in lib/agent/tools.ts (throw an error before changing data) and add a line to lib/agent/systemPrompt.ts. Run npm run build and fix errors.
```

Then:

```text
Run npm run build and npm run typecheck. Fix every error. Then review app/page.tsx, app/products/page.tsx, app/purchase-orders/page.tsx and components for a 360px phone screen and fix overflow or small tap targets. Make sure no key or secret appears anywhere in the repo and .env.local is git-ignored.
```

Re-run the seed SQL in Supabase to reset data (and `ps2_extras.sql` if used), then test the main demo **on the Vercel link**.

## P8 · README (Subash)

```text
Fill in README.md using the hackathon template:
# StockPilot: Inventory Restock Agent
Team 18 | PS2 | SRM Agentic AI Hackathon
Problem: the store manager of FreshMart Velachery finds out about stock-outs too late; purchase orders are made by hand in a spreadsheet.
What our app does (4 bullets), Live demo (Vercel link: <link>, Passcode: <passcode>, prompt "Create purchase orders for all low-stock dairy items."),
Agent tools table from lib/agent/tools.ts (name, what it does, Reads/Writes), the 4 tables, the business rules we enforce in code, tech stack, and
Team: M P Pranav Kumar (AI / Agent), Subash Moorthi (Team Lead + Database), Eediga Ram Charan (Backend / API), Shreel Singh (Frontend).
Run it locally steps. Plain English, short, no keys.
```

---

# PART D — DEMO, SLIDES, JUDGE QUESTIONS

**Demo flow (2 min):**
1. One line: "FreshMart's manager finds out about stock-outs too late; 18 of 80 items are already below reorder level right now."
2. "Which items will run out in the next 3 days?" → point at Toothpaste (not low, but runs out before its 5-day delivery).
3. "Create purchase orders for all low-stock dairy items." → show the 2–3 tool steps in chat, then the new PO on screen and the dashboard numbers changing.
4. Same prompt again → refused, already on order (shows business rules live in code).
5. (Stretch) "PO 2 has arrived" → stock updates.

**5 slides:** 1 Title + team/roles · 2 Problem (18/80 low, 9 suppliers, Tea Powder at 2 units) · 3 Solution + 2 screenshots (chat with tool steps, PO page after) · 4 How the agent works (user → Gemini → Zod → tools → Supabase; 4 read + 2–3 write tools; the 7 rules) · 5 Results + what refuses + next steps + links.

**Judge Q&A cheat sheet:**
- *How does the agent decide?* Gemini reads the tool descriptions and picks one; our code runs it and returns the result; it loops up to 8 rounds.
- *What stops the AI breaking rules?* Gemini can only choose which items; quantity, price and totals come from the database, and the write tool refuses non-low or already-ordered items before writing.
- *What does Zod do?* Validates Gemini's arguments (category enum, SKU format, status enum) before any tool runs.
- *Why no user id?* PS2 has a single manager; the passcode gate protects the app.
- *Where are keys?* `.env.local` and Vercel settings only.
- *Who wrote what?* Each owner explains their own files (see roles table).
