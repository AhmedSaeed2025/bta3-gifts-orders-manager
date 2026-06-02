
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS estimated_delivery_date date;

ALTER TABLE public.admin_orders
  ADD COLUMN IF NOT EXISTS tracking_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS estimated_delivery_date date;

CREATE OR REPLACE FUNCTION public.generate_tracking_token()
RETURNS text
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
DECLARE
  tok text;
BEGIN
  tok := 'trk_' || replace(extensions.gen_random_uuid()::text, '-', '');
  RETURN substring(tok, 1, 20);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_tracking_token()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.tracking_token IS NULL OR NEW.tracking_token = '' THEN
    NEW.tracking_token := public.generate_tracking_token();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_tracking_token ON public.orders;
CREATE TRIGGER trg_orders_tracking_token
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_tracking_token();

DROP TRIGGER IF EXISTS trg_admin_orders_tracking_token ON public.admin_orders;
CREATE TRIGGER trg_admin_orders_tracking_token
BEFORE INSERT ON public.admin_orders
FOR EACH ROW EXECUTE FUNCTION public.set_tracking_token();

UPDATE public.orders SET tracking_token = public.generate_tracking_token() WHERE tracking_token IS NULL;
UPDATE public.admin_orders SET tracking_token = public.generate_tracking_token() WHERE tracking_token IS NULL;

CREATE POLICY "Public can view order by tracking token"
ON public.orders FOR SELECT
TO anon, authenticated
USING (tracking_token IS NOT NULL);

CREATE POLICY "Public can view admin order by tracking token"
ON public.admin_orders FOR SELECT
TO anon, authenticated
USING (tracking_token IS NOT NULL);

CREATE POLICY "Public can view order items via order"
ON public.order_items FOR SELECT
TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.tracking_token IS NOT NULL));

CREATE POLICY "Public can view admin order items via order"
ON public.admin_order_items FOR SELECT
TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.admin_orders o WHERE o.id = admin_order_items.order_id AND o.tracking_token IS NOT NULL));

GRANT SELECT ON public.orders TO anon;
GRANT SELECT ON public.admin_orders TO anon;
GRANT SELECT ON public.order_items TO anon;
GRANT SELECT ON public.admin_order_items TO anon;

REVOKE SELECT (phone, phone2, email, address, notes, attached_image_url, profit, payments_received, remaining_amount, deposit, discount, user_id)
  ON public.orders FROM anon;
REVOKE SELECT (customer_phone, customer_phone2, customer_email, shipping_address, notes, attached_image_url, profit, payments_received, remaining_amount, deposit, discount, user_id)
  ON public.admin_orders FROM anon;
REVOKE SELECT (cost, profit) ON public.order_items FROM anon;
REVOKE SELECT (unit_cost, profit) ON public.admin_order_items FROM anon;

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS business_hours text DEFAULT 'السبت إلى الخميس: 10 صباحاً - 10 مساءً',
  ADD COLUMN IF NOT EXISTS order_policy_text text DEFAULT 'يتم تنفيذ الطلبات خلال 3 إلى 5 أيام عمل من تاريخ تأكيد الطلب.';
