# StockPilot project rules (Team 18 · PS2 Inventory Restock Agent)

## Goal
Turn the SRM hackathon starter into StockPilot, a restock agent for the store manager of FreshMart, Velachery. The manager asks in plain English; the agent finds low-stock items, forecasts stock-outs, groups items by supplier and creates draft purchase orders. There is NO logged-in user id; do not create lib/currentUser.ts.

The full build plan is docs/PLAN.md. Part C has the phases and the exact spec for every tool, API route and page.

## Stack (fixed, do not change or add frameworks)
Next.js App Router, React, TypeScript, Tailwind CSS, Next.js route handlers, Zod, Supabase JS (server only, secret key), Gemini function calling via @google/genai, Vercel.

## Database (created by running seed/ps2_inventory_restock.sql in Supabase; never rename or alter these tables)
- suppliers(id text 'SUP01'..'SUP10', name, city, contact_email, lead_time_days int, rating numeric, min_order_value numeric)
- products(sku text 'SKU001'..'SKU080', name, category, supplier_id -> suppliers.id, unit, stock_qty int, reorder_level int, reorder_qty int, avg_daily_sales numeric, unit_cost numeric, selling_price numeric)
- purchase_orders(id bigint identity, supplier_id, status 'draft'|'sent'|'received'|'cancelled', total_cost numeric, expected_date date, notes text, created_at timestamptz)
- purchase_order_items(id bigint identity, purchase_order_id -> purchase_orders.id on delete cascade, sku -> products.sku, quantity int, unit_cost numeric)
- Categories (exact strings): Dairy, Bakery, Beverages, Snacks, Staples, Personal Care, Household, Fruits & Vegetables, Spices, Frozen.

## Business rules
- An item is LOW when stock_qty <= reorder_level. Supabase JS cannot compare two columns, so fetch products and filter in TypeScript (only 80 rows).
- Days of stock left = stock_qty / avg_daily_sales (1 decimal). AT RISK = days left < supplier lead_time_days.
- Order exactly reorder_qty units at the product's unit_cost. One purchase order per supplier. New POs are 'draft'.
- expected_date = today in India (Asia/Kolkata) + supplier lead_time_days.
- Never order an item that is not low, or that is already in a 'draft' or 'sent' PO.
- If a PO total is below the supplier's min_order_value, still create it but add a warning to notes.
- Status changes allowed: draft->sent, draft->cancelled, sent->cancelled, sent->received. Nothing else.
- Gemini never decides quantities, prices or totals. The server computes them from the database.

## Code rules
- Agent tools live in lib/agent/tools.ts, built with defineTool() and a Zod schema, like the starter examples. Descriptions start with "Use this when...". Every Zod field has .describe(). Throw new Error("clear message") when a rule fails. Return small clean objects (max 20 rows).
- Shared inventory helpers live in lib/inventory.ts and are reused by tools and API routes.
- Only files in lib/ and app/api/ may call getSupabase(). Never use the Supabase secret key in components.
- Do not change auth, proxy.ts, login, lib/agent/defineTool.ts, or lib/agent/runAgent.ts (except MAX_ROUNDS = 8).
- Money is shown like "Rs 1,23,450" (en-IN). Numeric columns may arrive as strings: wrap with Number().
- UI must work on a 360px phone screen. Keep code simple with short comments.

---

## How to work in this repo (autonomous mode)

### Phase 0: bootstrap (do this first, only if package.json is missing)
This repo was created empty, so the official starter template is not in it yet. Bring it in with git, keeping history clean:
1. `git remote add template https://github.com/learn2simple/srm-agent-hackathon-starter.git`
   If `git fetch template` fails (404), remove that remote and try `https://github.com/learn2simple/srm-agenthackathon-starter.git`. If both fail, STOP and ask me for the exact template URL.
2. `git fetch template`, then `git merge template/main --allow-unrelated-histories` (use the template's default branch if it is not main).
3. On conflicts: keep OUR versions of CLAUDE.md, AGENTS.md, .github/copilot-instructions.md, docs/, and seed/ps2_inventory_restock.sql. Keep the TEMPLATE's version of everything else (including README.md).
4. `git remote remove template`.
5. Make sure .gitignore contains: .env*.local, node_modules, .next, cookies.txt.
6. `npm install`, then commit "Bring in hackathon starter template" and push.
7. If .env.local does not exist: copy .env.example to .env.local, set GEMINI_MODEL=gemini-3.8-flash, then STOP and ask me to fill in GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SECRET_KEY and APP_PASSCODE, and to run seed/00_starter_example.sql and seed/ps2_inventory_restock.sql in the Supabase SQL Editor. Continue only after I confirm.
8. Start the dev server and check GET /api/health returns ok before building anything.

### Build phases
Follow docs/PLAN.md Part C in order: P1, P2, P3, P4, P5, P7, P8. Do P6 (receive stock) only after P7 passes, and ask me before it, because its SQL file must be run by me in Supabase. Ignore the "who runs it" column; you do all phases.

### After every phase
1. Run `npm run build` (and `npx tsc --noEmit`) and fix every error.
2. Self-test against the running dev server (see below).
3. Check `git status`: never stage .env.local, cookies.txt or any key.
4. `git add -A`, `git commit -m "<phase>: <what changed>"`, `git push`.
5. Print a 2-line status, then continue to the next phase without waiting unless you need me.

### Self-testing
- Start `npm run dev` in the background. Read app/api/login/route.ts for the login body format, log in with curl using APP_PASSCODE from .env.local and save the cookie to cookies.txt, then call the API routes and POST test prompts to /api/agent with that cookie.
- For each agent test, check the `steps` in the response: the right tools were called, write tools succeeded or were refused as the plan says.
- To see real data changes, call /api/purchase-orders or /api/dashboard after a write.
- Gemini quota is small: keep test prompts few and short, wait 60 seconds after a 429, never retry in a loop.
- Tests create purchase orders. At the end, tell me to re-run seed/ps2_inventory_restock.sql in Supabase to reset the data before the demo.

### When you must stop and ask me
Running SQL in Supabase, missing env values, the Vercel link and passcode for the README, the template URL failing, or `git push` being denied (I will sign in to GitHub).

### Final report
List the tools and what each does, which P7 tests passed, the commits made, and what I still need to do by hand (Vercel env vars and deploy, reset seed data, slides).
