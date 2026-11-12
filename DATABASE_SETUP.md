# 🗄️ Database Setup Guide

## Your Problem: PS2 - Inventory Restock Agent (Supply Chain)

You need to run the SQL seed file to create the database tables with inventory data.

---

## ⚡ Quick Setup (5 minutes)

### Step 1: Login to Supabase
1. Go to: **https://supabase.com**
2. Sign in (you should already have an account since you have the URL and key)
3. Select your project: `gjqcwwlksgtwksilxskm`

### Step 2: Open SQL Editor
1. Click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**

### Step 3: Run Starter SQL
1. Copy the entire contents of: `seed/00_starter_example.sql`
2. Paste into the SQL Editor
3. Click **"Run"** button (bottom right)
4. Wait for success message ✅

### Step 4: Run Your Problem's SQL
1. Click **"New Query"** again
2. Copy the entire contents of: `seed/ps2_inventory_restock.sql`
3. Paste into the SQL Editor  
4. Click **"Run"** button
5. Wait for success message ✅

### Step 5: Verify Tables Created
Click **"Table Editor"** in left sidebar. You should see:
- ✅ `suppliers` (10 suppliers)
- ✅ `products` (80 products)
- ✅ `purchase_orders`
- ✅ `purchase_order_items`

---

## 🧪 Test Your Setup

### 1. Restart Dev Server
```powershell
# Stop current server (Ctrl+C)
npm run dev
```

### 2. Login
- Go to: http://localhost:3000
- Passcode: `PS2Z`

### 3. Check Dashboard
You should now see:
- ✅ Real stock numbers
- ✅ Low stock items list
- ✅ Stat cards with actual data

### 4. Test AI Agent
Try these prompts:
- "What do I need to reorder this week?"
- "Create purchase orders for all low-stock dairy items"
- "Which items will run out in the next 3 days?"

---

## 🚨 Troubleshooting

### Error: "Could not load dashboard"
**Cause:** SQL files not run yet  
**Fix:** Complete Steps 1-4 above

### Error: "Wrong passcode"
**Cause:** `.env.local` has wrong passcode  
**Fix:** Your passcode is `PS2Z` (check `.env.local`)

### Error: "Gemini model not found"
**Cause:** Model name incorrect  
**Fix:** Already fixed - using `gemini-1.5-flash`

### Dashboard shows "-" everywhere
**Cause:** Database connection issue  
**Fix:** 
1. Check `SUPABASE_URL` in `.env.local` matches your project
2. Check `SUPABASE_SECRET_KEY` is the **service_role** key (not anon key)
3. Verify SQL files were run successfully

---

## 📊 What's in the Database?

Your PS2 seed file creates:

### Suppliers (10 companies)
- Amul Dairy, Britannia Industries, Coca Cola India, etc.
- Each has: contact email, lead time, rating, minimum order value

### Products (80 items)
Categories: Dairy, Bakery, Beverages, Snacks, Staples, Personal Care, Household, Fruits & Vegetables, Spices, Frozen

Each product has:
- SKU, name, category
- Current stock quantity
- Reorder level (when to reorder)
- Reorder quantity (how much to order)
- Average daily sales (for forecasting)
- Unit cost and selling price
- Linked supplier

### Purchase Orders
- Empty at start
- Agent creates them based on low stock

---

## 🎯 Your Task

Build an AI agent that:
1. ✅ Identifies low-stock items
2. ✅ Forecasts stock-outs before delivery arrives
3. ✅ Groups items by supplier
4. ✅ Creates draft purchase orders
5. ✅ Calculates order totals and expected dates

All data is in `seed/ps2_inventory_restock.sql` - the agent should work with this!

---

## 💡 Demo Mode (Alternative)

If you can't setup the database right now, you can use demo mode:

1. Edit `.env.local`
2. Change: `DEMO_MODE=true`
3. Restart server
4. App will use fake data (no database needed)

**Note:** For hackathon judging, use the REAL database with the seed file!

---

**Need help?** Check: https://supabase.com/docs/guides/database/overview
