-- Test Purchase Order to show non-zero "Open POs" on dashboard
-- Run this in Supabase SQL Editor to add sample data

-- Insert a draft purchase order
INSERT INTO purchase_orders (supplier_id, status, total_cost, expected_date, notes, created_at)
VALUES 
  ('SUP01', 'draft', 25000.00, CURRENT_DATE + INTERVAL '3 days', 'Test draft order for demo', NOW()),
  ('SUP02', 'sent', 18500.00, CURRENT_DATE + INTERVAL '2 days', 'Test sent order for demo', NOW());

-- Get the IDs of the orders we just created
WITH new_orders AS (
  SELECT id, supplier_id FROM purchase_orders 
  WHERE notes LIKE '%Test%order for demo%'
  ORDER BY created_at DESC
  LIMIT 2
)
-- Add some items to the first order (SUP01)
INSERT INTO purchase_order_items (purchase_order_id, sku, quantity, unit_cost)
SELECT 
  (SELECT id FROM new_orders WHERE supplier_id = 'SUP01'),
  'SKU005', -- Toned Milk 500ml
  100,
  22.00
UNION ALL
SELECT 
  (SELECT id FROM new_orders WHERE supplier_id = 'SUP01'),
  'SKU006', -- Buttermilk 200ml
  60,
  15.00;

-- Add items to the second order (SUP02)
INSERT INTO purchase_order_items (purchase_order_id, sku, quantity, unit_cost)
SELECT 
  (SELECT id FROM new_orders WHERE supplier_id = 'SUP02'),
  'SKU013', -- Tea Powder 500g
  100,
  185.00;

-- Verify the orders
SELECT 
  po.id,
  po.supplier_id,
  s.name as supplier_name,
  po.status,
  po.total_cost,
  po.expected_date,
  COUNT(poi.id) as item_count
FROM purchase_orders po
JOIN suppliers s ON s.id = po.supplier_id
LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
WHERE po.notes LIKE '%Test%order for demo%'
GROUP BY po.id, po.supplier_id, s.name, po.status, po.total_cost, po.expected_date;
