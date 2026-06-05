CREATE OR REPLACE FUNCTION public.set_order_serial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.serial IS NULL OR NEW.serial = '' THEN
    NEW.serial := public.generate_serial_number();
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.generate_serial_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_order_serial() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_serial_number() TO service_role;
GRANT EXECUTE ON FUNCTION public.set_order_serial() TO service_role;

ALTER TABLE public.orders
ALTER COLUMN serial DROP DEFAULT;

ALTER TABLE public.admin_orders
ALTER COLUMN serial DROP DEFAULT;

DROP TRIGGER IF EXISTS trg_orders_serial ON public.orders;
CREATE TRIGGER trg_orders_serial
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_order_serial();

DROP TRIGGER IF EXISTS trg_admin_orders_serial ON public.admin_orders;
CREATE TRIGGER trg_admin_orders_serial
BEFORE INSERT ON public.admin_orders
FOR EACH ROW EXECUTE FUNCTION public.set_order_serial();