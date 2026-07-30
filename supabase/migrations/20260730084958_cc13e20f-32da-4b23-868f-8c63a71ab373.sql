DROP POLICY IF EXISTS "Public can view order by tracking token" ON public.orders;
DROP POLICY IF EXISTS "Public can view admin order by tracking token" ON public.admin_orders;
DROP POLICY IF EXISTS "Public can view order items via order" ON public.order_items;
DROP POLICY IF EXISTS "Public can view admin order items via order" ON public.admin_order_items;

CREATE OR REPLACE FUNCTION public.track_order(_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t text := btrim(coalesce(_token, ''));
  rec record;
  items jsonb;
  result jsonb;
BEGIN
  IF length(t) < 6 THEN
    RETURN NULL;
  END IF;

  SELECT o.id, o.serial, o.client_name AS customer_name, o.status, o.date_created AS order_date,
         o.total, o.governorate, o.delivery_method, o.payment_method, o.estimated_delivery_date
    INTO rec
  FROM public.orders o
  WHERE o.tracking_token = t OR upper(o.serial) = upper(t)
  LIMIT 1;

  IF FOUND THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'product_type', i.product_type, 'size', i.size, 'quantity', i.quantity
    )), '[]'::jsonb) INTO items
    FROM public.order_items i WHERE i.order_id = rec.id;

    RETURN jsonb_build_object(
      'serial', rec.serial, 'customer_name', rec.customer_name, 'status', rec.status,
      'order_date', rec.order_date, 'total_amount', rec.total, 'governorate', rec.governorate,
      'delivery_method', rec.delivery_method, 'payment_method', rec.payment_method,
      'estimated_delivery_date', rec.estimated_delivery_date, 'items', items
    );
  END IF;

  SELECT a.id, a.serial, a.customer_name, a.status, a.order_date,
         a.total_amount, a.governorate, a.delivery_method, a.payment_method, a.estimated_delivery_date
    INTO rec
  FROM public.admin_orders a
  WHERE a.tracking_token = t OR upper(a.serial) = upper(t)
  LIMIT 1;

  IF FOUND THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'product_type', i.product_name, 'size', i.product_size, 'quantity', i.quantity
    )), '[]'::jsonb) INTO items
    FROM public.admin_order_items i WHERE i.order_id = rec.id;

    RETURN jsonb_build_object(
      'serial', rec.serial, 'customer_name', rec.customer_name, 'status', rec.status,
      'order_date', rec.order_date, 'total_amount', rec.total_amount, 'governorate', rec.governorate,
      'delivery_method', rec.delivery_method, 'payment_method', rec.payment_method,
      'estimated_delivery_date', rec.estimated_delivery_date, 'items', items
    );
  END IF;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.track_order(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_order(text) TO anon, authenticated;