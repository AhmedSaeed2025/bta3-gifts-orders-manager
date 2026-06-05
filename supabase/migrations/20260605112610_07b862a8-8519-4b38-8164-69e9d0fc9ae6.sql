GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_order_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;

GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;
GRANT ALL ON public.admin_orders TO service_role;
GRANT ALL ON public.admin_order_items TO service_role;
GRANT ALL ON public.transactions TO service_role;

CREATE OR REPLACE FUNCTION public.generate_tracking_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
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
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.tracking_token IS NULL OR NEW.tracking_token = '' THEN
    NEW.tracking_token := public.generate_tracking_token();
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.generate_tracking_token() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_tracking_token() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_tracking_token() TO service_role;
GRANT EXECUTE ON FUNCTION public.set_tracking_token() TO service_role;

DROP TRIGGER IF EXISTS trg_orders_tracking_token ON public.orders;
CREATE TRIGGER trg_orders_tracking_token
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_tracking_token();

DROP TRIGGER IF EXISTS trg_admin_orders_tracking_token ON public.admin_orders;
CREATE TRIGGER trg_admin_orders_tracking_token
BEFORE INSERT ON public.admin_orders
FOR EACH ROW EXECUTE FUNCTION public.set_tracking_token();