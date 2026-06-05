ALTER TABLE public.orders
ALTER COLUMN serial SET DEFAULT public.generate_serial_number();

ALTER TABLE public.admin_orders
ALTER COLUMN serial SET DEFAULT public.generate_serial_number();