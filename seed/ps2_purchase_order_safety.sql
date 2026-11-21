-- Install the atomic purchase-order writer used by StockPilot.
-- This migration preserves existing inventory and purchase-order data.

create or replace function public.create_stockpilot_purchase_orders(
  p_category text default null,
  p_supplier_id text default null,
  p_skus text[] default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_unknown_skus text;
  v_order_skus text[] := array[]::text[];
  v_product record;
  v_supplier record;
  v_open_po_id bigint;
  v_po_id bigint;
  v_total_cost numeric(12, 2);
  v_expected_date date;
  v_warning text;
  v_items jsonb;
  v_created jsonb := '[]'::jsonb;
  v_skipped_not_low jsonb := '[]'::jsonb;
  v_skipped_already_ordered jsonb := '[]'::jsonb;
  v_grand_total numeric(14, 2) := 0;
begin
  if p_supplier_id is not null and not exists (
    select 1 from suppliers where id = p_supplier_id
  ) then
    raise exception 'Unknown supplier %.', p_supplier_id;
  end if;

  if p_skus is not null then
    select string_agg(requested.sku, ', ' order by requested.sku)
      into v_unknown_skus
    from (
      select distinct sku from unnest(p_skus) as input(sku)
    ) as requested
    where not exists (select 1 from products p where p.sku = requested.sku);

    if v_unknown_skus is not null then
      raise exception 'Unknown SKU: %.', v_unknown_skus;
    end if;
  end if;

  if not exists (
    select 1
    from products p
    where (p_category is null or p.category = p_category)
      and (p_supplier_id is null or p.supplier_id = p_supplier_id)
      and (p_skus is null or p.sku = any(p_skus))
  ) then
    raise exception 'No products match that request.';
  end if;

  -- Serialize overlapping restock requests in a stable order. A retry waits
  -- for the first transaction, then sees its committed draft/sent PO below.
  perform 1
  from products p
  where (p_category is null or p.category = p_category)
    and (p_supplier_id is null or p.supplier_id = p_supplier_id)
    and (p_skus is null or p.sku = any(p_skus))
  order by p.sku
  for update;

  for v_product in
    select p.sku, p.name, p.supplier_id, p.stock_qty, p.reorder_level,
           p.reorder_qty, p.unit_cost, s.name as supplier_name,
           s.lead_time_days, s.min_order_value
    from products p
    join suppliers s on s.id = p.supplier_id
    where (p_category is null or p.category = p_category)
      and (p_supplier_id is null or p.supplier_id = p_supplier_id)
      and (p_skus is null or p.sku = any(p_skus))
    order by p.supplier_id, p.sku
  loop
    if v_product.stock_qty > v_product.reorder_level then
      if p_skus is not null then
        v_skipped_not_low := v_skipped_not_low || jsonb_build_array(
          jsonb_build_object(
            'sku', v_product.sku,
            'name', v_product.name,
            'stock_qty', v_product.stock_qty,
            'reorder_level', v_product.reorder_level
          )
        );
      end if;
      continue;
    end if;

    select po.id
      into v_open_po_id
    from purchase_order_items poi
    join purchase_orders po on po.id = poi.purchase_order_id
    where poi.sku = v_product.sku
      and po.status in ('draft', 'sent')
    order by po.id desc
    limit 1;

    if v_open_po_id is not null then
      v_skipped_already_ordered := v_skipped_already_ordered || jsonb_build_array(
        jsonb_build_object(
          'sku', v_product.sku,
          'name', v_product.name,
          'purchase_order_id', v_open_po_id
        )
      );
    else
      v_order_skus := array_append(v_order_skus, v_product.sku);
    end if;
  end loop;

  for v_supplier in
    select s.id, s.name, s.lead_time_days, s.min_order_value
    from suppliers s
    where exists (
      select 1
      from products p
      where p.supplier_id = s.id and p.sku = any(v_order_skus)
    )
    order by s.id
  loop
    select coalesce(sum(p.reorder_qty * p.unit_cost), 0)
      into v_total_cost
    from products p
    where p.supplier_id = v_supplier.id and p.sku = any(v_order_skus);

    v_warning := null;
    if v_total_cost < v_supplier.min_order_value then
      v_warning := 'Below min order value of Rs ' || v_supplier.min_order_value::text;
    end if;

    v_expected_date :=
      (now() at time zone 'Asia/Kolkata')::date + v_supplier.lead_time_days;

    insert into purchase_orders (
      supplier_id, status, total_cost, expected_date, notes
    ) values (
      v_supplier.id,
      'draft',
      v_total_cost,
      v_expected_date,
      'Created by StockPilot agent' || case
        when v_warning is null then '' else ' | ' || v_warning end
    )
    returning id into v_po_id;

    insert into purchase_order_items (purchase_order_id, sku, quantity, unit_cost)
    select v_po_id, p.sku, p.reorder_qty, p.unit_cost
    from products p
    where p.supplier_id = v_supplier.id and p.sku = any(v_order_skus)
    order by p.sku;

    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'sku', p.sku,
          'name', p.name,
          'quantity', p.reorder_qty,
          'unit_cost', p.unit_cost
        ) order by p.sku
      ),
      '[]'::jsonb
    )
    into v_items
    from products p
    where p.supplier_id = v_supplier.id and p.sku = any(v_order_skus);

    v_created := v_created || jsonb_build_array(
      jsonb_build_object(
        'purchase_order_id', v_po_id,
        'supplier_id', v_supplier.id,
        'supplier_name', v_supplier.name,
        'items', v_items,
        'total_cost', v_total_cost,
        'expected_date', v_expected_date,
        'warning', v_warning
      )
    );
    v_grand_total := v_grand_total + v_total_cost;
  end loop;

  return jsonb_build_object(
    'created', v_created,
    'skipped_not_low', v_skipped_not_low,
    'skipped_already_ordered', v_skipped_already_ordered,
    'grand_total', v_grand_total
  );
end;
$$;

revoke all on function public.create_stockpilot_purchase_orders(text, text, text[]) from public;
grant execute on function public.create_stockpilot_purchase_orders(text, text, text[]) to service_role;
