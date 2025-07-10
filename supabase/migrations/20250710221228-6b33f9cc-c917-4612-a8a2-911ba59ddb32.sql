
-- Add notes column to orders table if it doesn't exist
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS notes text;

-- Add notes column to admin_orders table if it doesn't exist  
ALTER TABLE public.admin_orders
ADD COLUMN IF NOT EXISTS notes text;
