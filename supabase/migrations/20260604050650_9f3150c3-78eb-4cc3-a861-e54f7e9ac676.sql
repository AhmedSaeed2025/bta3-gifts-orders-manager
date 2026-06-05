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

DROP TRIGGER IF EXISTS trg_orders_tracking_token ON public.orders;
CREATE TRIGGER trg_orders_tracking_token
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_tracking_token();

DROP TRIGGER IF EXISTS trg_admin_orders_tracking_token ON public.admin_orders;
CREATE TRIGGER trg_admin_orders_tracking_token
BEFORE INSERT ON public.admin_orders
FOR EACH ROW EXECUTE FUNCTION public.set_tracking_token();

UPDATE public.orders
SET tracking_token = public.generate_tracking_token()
WHERE tracking_token IS NULL OR tracking_token = '';

UPDATE public.admin_orders
SET tracking_token = public.generate_tracking_token()
WHERE tracking_token IS NULL OR tracking_token = '';