-- Add secondary phone column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS phone2 TEXT;

-- Add secondary phone column to admin_orders table
ALTER TABLE public.admin_orders 
ADD COLUMN IF NOT EXISTS customer_phone2 TEXT;