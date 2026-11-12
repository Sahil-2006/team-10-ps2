/** Mock data for demo mode when database is not available */

export const DEMO_MODE = process.env.DEMO_MODE === 'true';

export const mockDashboard = {
  low_stock_count: 12,
  reorder_value: 45650,
  at_risk_count: 5,
  open_po_count: 3,
  open_po_value: 28900,
  low_items: [
    {
      sku: "SKU015",
      name: "Amul Fresh Milk 1L",
      category: "Dairy",
      stock_qty: 8,
      reorder_level: 15,
      days_left: 0.8,
      supplier_name: "Amul Dairy",
      at_risk: true,
      already_on_order: null
    },
    {
      sku: "SKU023",
      name: "Britannia Bread 400g",
      category: "Bakery",
      stock_qty: 12,
      reorder_level: 20,
      days_left: 1.5,
      supplier_name: "Britannia Industries",
      at_risk: true,
      already_on_order: null
    },
    {
      sku: "SKU041",
      name: "Coca Cola 2L",
      category: "Beverages",
      stock_qty: 5,
      reorder_level: 10,
      days_left: 0.5,
      supplier_name: "Coca Cola India",
      at_risk: true,
      already_on_order: null
    },
    {
      sku: "SKU058",
      name: "Lays Classic 50g",
      category: "Snacks",
      stock_qty: 18,
      reorder_level: 25,
      days_left: 2.0,
      supplier_name: "PepsiCo India",
      at_risk: false,
      already_on_order: null
    },
    {
      sku: "SKU072",
      name: "India Gate Basmati Rice 5kg",
      category: "Staples",
      stock_qty: 3,
      reorder_level: 8,
      days_left: 1.2,
      supplier_name: "KRBL Limited",
      at_risk: true,
      already_on_order: null
    }
  ]
};

export const mockProducts = [
  {
    sku: "SKU001",
    name: "Amul Butter 100g",
    category: "Dairy",
    supplier_name: "Amul Dairy",
    stock_qty: 45,
    reorder_level: 30,
    days_left: 4.5,
    is_low: false,
    at_risk: false,
    already_on_order: null
  },
  {
    sku: "SKU015",
    name: "Amul Fresh Milk 1L",
    category: "Dairy",
    supplier_name: "Amul Dairy",
    stock_qty: 8,
    reorder_level: 15,
    days_left: 0.8,
    is_low: true,
    at_risk: true,
    already_on_order: null
  },
  {
    sku: "SKU023",
    name: "Britannia Bread 400g",
    category: "Bakery",
    supplier_name: "Britannia Industries",
    stock_qty: 12,
    reorder_level: 20,
    days_left: 1.5,
    is_low: true,
    at_risk: true,
    already_on_order: null
  },
  // Add more as needed
];

export const mockPurchaseOrders = [
  {
    id: 1,
    supplier_name: "Amul Dairy",
    status: "draft" as const,
    total_cost: 12450,
    expected_date: "2026-11-15",
    notes: null,
    items: [
      { sku: "SKU015", name: "Amul Fresh Milk 1L", quantity: 30, unit_cost: 65 },
      { sku: "SKU016", name: "Amul Cheese Slices 200g", quantity: 20, unit_cost: 185 }
    ]
  },
  {
    id: 2,
    supplier_name: "Britannia Industries",
    status: "sent" as const,
    total_cost: 8900,
    expected_date: "2026-11-14",
    notes: null,
    items: [
      { sku: "SKU023", name: "Britannia Bread 400g", quantity: 40, unit_cost: 42 },
      { sku: "SKU024", name: "Britannia Marie Biscuits 200g", quantity: 50, unit_cost: 25 }
    ]
  },
  {
    id: 3,
    supplier_name: "Coca Cola India",
    status: "received" as const,
    total_cost: 7550,
    expected_date: "2026-11-10",
    notes: null,
    items: [
      { sku: "SKU041", name: "Coca Cola 2L", quantity: 50, unit_cost: 90 },
      { sku: "SKU042", name: "Sprite 2L", quantity: 30, unit_cost: 85 }
    ]
  }
];

export const mockAgentResponse = (userMessage: string): string => {
  const lower = userMessage.toLowerCase();
  
  if (lower.includes("reorder") || lower.includes("need") || lower.includes("week")) {
    return `Based on current stock levels, here's what needs to be reordered this week:

**Urgent (Less than 1 day left):**
• Amul Fresh Milk 1L - Only 8 units left (0.8 days)
• Coca Cola 2L - Only 5 units left (0.5 days)

**Important (1-2 days left):**
• India Gate Basmati Rice 5kg - 3 units (1.2 days)
• Britannia Bread 400g - 12 units (1.5 days)

**Moderate Priority:**
• Lays Classic 50g - 18 units (2 days)

Total estimated reorder value: ₹45,650

Would you like me to create draft purchase orders for these items grouped by supplier?`;
  }
  
  if (lower.includes("dairy") || lower.includes("milk")) {
    return `I found 2 low-stock dairy items:

1. **Amul Fresh Milk 1L** (SKU015)
   - Current: 8 units (reorder at 15)
   - Days left: 0.8 days ⚠️
   - Supplier: Amul Dairy
   - Reorder qty: 30 units

2. **Amul Curd 400g** (SKU017)
   - Current: 10 units (reorder at 18)
   - Days left: 1.3 days
   - Supplier: Amul Dairy
   - Reorder qty: 25 units

Shall I create a purchase order for these items?`;
  }
  
  if (lower.includes("3 days") || lower.includes("three days") || lower.includes("run out")) {
    return `Items that will run out in the next 3 days:

**Critical (< 1 day):**
• Amul Fresh Milk 1L - 0.8 days
• Coca Cola 2L - 0.5 days

**At Risk (1-2 days):**
• India Gate Basmati Rice 5kg - 1.2 days
• Britannia Bread 400g - 1.5 days

**Moderate (2-3 days):**
• Lays Classic 50g - 2.0 days
• Colgate Toothpaste 100g - 2.3 days

All these items are below their reorder levels. I recommend creating purchase orders immediately for the critical items.`;
  }
  
  if (lower.includes("create") && lower.includes("order")) {
    return `I've analyzed the low stock items and prepared draft purchase orders:

**Draft PO #4 - Amul Dairy**
• Amul Fresh Milk 1L: 30 units @ ₹65 = ₹1,950
• Amul Curd 400g: 25 units @ ₹45 = ₹1,125
Total: ₹3,075 | Expected: Nov 15, 2026

**Draft PO #5 - Britannia Industries**
• Britannia Bread 400g: 40 units @ ₹42 = ₹1,680
Total: ₹1,680 | Expected: Nov 14, 2026

**Draft PO #6 - KRBL Limited**
• India Gate Basmati Rice 5kg: 15 units @ ₹425 = ₹6,375
Total: ₹6,375 | Expected: Nov 18, 2026

All purchase orders are now in DRAFT status. You can review them in the Purchase Orders page and send them when ready.`;
  }
  
  return `I understand you're asking about inventory. I can help you with:
• Finding items that need to be reordered
• Forecasting stock-outs
• Creating purchase orders by supplier
• Checking supplier details

What specific information would you like?`;
};
