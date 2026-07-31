CREATE OR REPLACE FUNCTION public.track_order(_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  t text := btrim(coalesce(_token, ''));
  rec record;
  items jsonb;
  v_paid numeric;
  v_remaining numeric;
BEGIN
  IF length(t) < 6 THEN
    RETURN NULL;
  END IF;

  SELECT o.id, o.serial, o.client_name AS customer_name, o.status, o.date_created AS order_date,
         o.total, coalesce(o.deposit,0) AS deposit, coalesce(o.payments_received,0) AS payments_received,
         o.governorate, o.delivery_method, o.payment_method, o.estimated_delivery_date
    INTO rec
  FROM public.orders o
  WHERE o.tracking_token = t OR upper(o.serial) = upper(t)
  LIMIT 1;

  IF FOUND THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'product_type', i.product_type, 'size', i.size, 'quantity', i.quantity
    )), '[]'::jsonb) INTO items
    FROM public.order_items i WHERE i.order_id = rec.id;

    v_paid := coalesce(rec.deposit,0) + coalesce(rec.payments_received,0);
    v_remaining := greatest(coalesce(rec.total,0) - v_paid, 0);

    RETURN jsonb_build_object(
      'serial', rec.serial, 'customer_name', rec.customer_name, 'status', rec.status,
      'order_date', rec.order_date, 'total_amount', rec.total, 'governorate', rec.governorate,
      'delivery_method', rec.delivery_method, 'payment_method', rec.payment_method,
      'estimated_delivery_date', rec.estimated_delivery_date,
      'deposit', rec.deposit, 'paid_amount', v_paid, 'remaining_amount', v_remaining,
      'items', items
    );
  END IF;

  SELECT a.id, a.serial, a.customer_name, a.status, a.order_date,
         a.total_amount AS total, coalesce(a.deposit,0) AS deposit, coalesce(a.payments_received,0) AS payments_received,
         a.governorate, a.delivery_method, a.payment_method, a.estimated_delivery_date
    INTO rec
  FROM public.admin_orders a
  WHERE a.tracking_token = t OR upper(a.serial) = upper(t)
  LIMIT 1;

  IF FOUND THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'product_type', i.product_name, 'size', i.product_size, 'quantity', i.quantity
    )), '[]'::jsonb) INTO items
    FROM public.admin_order_items i WHERE i.order_id = rec.id;

    v_paid := coalesce(rec.deposit,0) + coalesce(rec.payments_received,0);
    v_remaining := greatest(coalesce(rec.total,0) - v_paid, 0);

    RETURN jsonb_build_object(
      'serial', rec.serial, 'customer_name', rec.customer_name, 'status', rec.status,
      'order_date', rec.order_date, 'total_amount', rec.total, 'governorate', rec.governorate,
      'delivery_method', rec.delivery_method, 'payment_method', rec.payment_method,
      'estimated_delivery_date', rec.estimated_delivery_date,
      'deposit', rec.deposit, 'paid_amount', v_paid, 'remaining_amount', v_remaining,
      'items', items
    );
  END IF;

  RETURN NULL;
END;
$function$;