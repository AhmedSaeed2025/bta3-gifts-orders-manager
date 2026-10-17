-- Table to log every status change for both order tables
CREATE TABLE public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  source text NOT NULL DEFAULT 'orders', -- 'orders' or 'admin_orders'
  status text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_status_history_order ON public.order_status_history(order_id, changed_at);

GRANT SELECT ON public.order_status_history TO authenticated;
GRANT ALL ON public.order_status_history TO service_role;

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own order status history"
  ON public.order_status_history FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.admin_orders a WHERE a.id = order_id AND a.user_id = auth.uid())
  );

-- Trigger function: log status on insert and on change
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
    INSERT INTO public.order_status_history (order_id, source, status, changed_at)
    VALUES (NEW.id, TG_TABLE_NAME, NEW.status, now());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_orders_status_history
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();

CREATE TRIGGER trg_admin_orders_status_history
  AFTER INSERT OR UPDATE OF status ON public.admin_orders
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();

-- Backfill existing orders: current status timestamped at last update (or creation)
INSERT INTO public.order_status_history (order_id, source, status, changed_at)
SELECT o.id, 'orders', o.status, COALESCE(o.updated_at, o.date_created)
FROM public.orders o
WHERE NOT EXISTS (SELECT 1 FROM public.order_status_history h WHERE h.order_id = o.id);

INSERT INTO public.order_status_history (order_id, source, status, changed_at)
SELECT a.id, 'admin_orders', a.status, COALESCE(a.updated_at, a.order_date)
FROM public.admin_orders a
WHERE NOT EXISTS (SELECT 1 FROM public.order_status_history h WHERE h.order_id = a.id);

-- Extend track_order to return status history timestamps
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
  history jsonb;
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

    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'status', h.status, 'changed_at', h.changed_at
    ) ORDER BY h.changed_at), '[]'::jsonb) INTO history
    FROM public.order_status_history h WHERE h.order_id = rec.id;

    v_paid := coalesce(rec.deposit,0) + coalesce(rec.payments_received,0);
    v_remaining := greatest(coalesce(rec.total,0) - v_paid, 0);

    RETURN jsonb_build_object(
      'serial', rec.serial, 'customer_name', rec.customer_name, 'status', rec.status,
      'order_date', rec.order_date, 'total_amount', rec.total, 'governorate', rec.governorate,
      'delivery_method', rec.delivery_method, 'payment_method', rec.payment_method,
      'estimated_delivery_date', rec.estimated_delivery_date,
      'deposit', rec.deposit, 'paid_amount', v_paid, 'remaining_amount', v_remaining,
      'items', items, 'status_history', history
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

    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'status', h.status, 'changed_at', h.changed_at
    ) ORDER BY h.changed_at), '[]'::jsonb) INTO history
    FROM public.order_status_history h WHERE h.order_id = rec.id;

    v_paid := coalesce(rec.deposit,0) + coalesce(rec.payments_received,0);
    v_remaining := greatest(coalesce(rec.total,0) - v_paid, 0);

    RETURN jsonb_build_object(
      'serial', rec.serial, 'customer_name', rec.customer_name, 'status', rec.status,
      'order_date', rec.order_date, 'total_amount', rec.total, 'governorate', rec.governorate,
      'delivery_method', rec.delivery_method, 'payment_method', rec.payment_method,
      'estimated_delivery_date', rec.estimated_delivery_date,
      'deposit', rec.deposit, 'paid_amount', v_paid, 'remaining_amount', v_remaining,
      'items', items, 'status_history', history
    );
  END IF;

  RETURN NULL;
END;
$function$;