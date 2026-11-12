# 📦 Restocker: AI-Powered Inventory Restock Agent

**Team 10** | PS2 | SRM Agentic AI Hackathon

**Problem:** the store manager of FreshMart Velachery finds out about stock-outs too late, and purchase orders are made by hand in a spreadsheet.

## What our app does

- Finds items that are low on stock (at or below the reorder level) and shows how many days each will last.
- Forecasts stock-outs: "what runs out in 3 days?" also catches items that are not low yet but will run out before the supplier can deliver.
- Groups low items by supplier and creates draft purchase orders, one per supplier, in plain English.
- Shows a live dashboard, product list and purchase order list. Every tool the agent uses is visible in the chat.

## Live demo

- Link: **TODO: add Vercel link**
- Passcode: **TODO: add passcode**
- Try: `Create purchase orders for all low-stock dairy items.`

## Agent tools

| Tool | What it does | Reads / Writes |
|---|---|---|
| `getLowStockItems` | Low items (optional category / supplier), with days left, supplier, line cost and whether already on a PO | Reads |
| `getStockForecast` | Items that run out within N days (low or not), flags stock-out before delivery | Reads |
| `getSupplierDetails` | Supplier contact, lead time, rating, minimum order and their low items | Reads |
| `getPurchaseOrders` | Purchase orders with supplier, status, total, expected date and items | Reads |
| `createPurchaseOrders` | Creates draft POs, one per supplier, for low items (all / category / supplier / SKUs) | Writes |
| `updatePurchaseOrderStatus` | Sends or cancels a purchase order, only when the change is allowed | Writes |

## Database (Supabase)

`suppliers`, `products`, `purchase_orders`, `purchase_order_items`. Created from `seed/ps2_inventory_restock.sql`. Re-running that file resets the data.

## Rules enforced in code (not trusted to the AI)

1. Low means `stock_qty <= reorder_level`. Days left = stock / average daily sales. At risk means days left is less than the supplier lead time.
2. Gemini only chooses which items. Quantity (reorder quantity), price (unit cost) and totals are computed by the server from the database.
3. Items that are not low are never ordered; the reply says why.
4. Items already on a draft or sent PO are never ordered again.
5. One draft PO per supplier. Expected date = today (India time) + supplier lead time.
6. A PO below the supplier's minimum order value is still created, with a warning in its notes.
7. Status changes allowed: draft to sent, draft to cancelled, sent to cancelled. Anything else is refused.
8. If saving the PO lines fails, the half-made PO is deleted.

## Tech stack

Next.js (App Router), React, TypeScript, Tailwind CSS, Next.js route handlers, Zod, Supabase JS (server only), Gemini function calling (`@google/genai`), Vercel.

## Run it locally

1. `npm install`
2. In Supabase SQL Editor, run `seed/00_starter_example.sql`, then `seed/ps2_inventory_restock.sql`.
3. Copy `.env.example` to `.env.local` and fill in `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `APP_PASSCODE`.
4. `npm run dev`, open http://localhost:3000 and enter the passcode.
5. Check `/api/health` if something does not work.

## Team

- M P Pranav Kumar: AI / Agent
- Subash Moorthi: Team Lead + Database
- Eediga Ram Charan: Backend / API
- Shreel Singh: Frontend
