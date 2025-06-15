
-- Add notes and attached_image fields to admin_orders table
ALTER TABLE public.admin_orders 
ADD COLUMN notes TEXT,
ADD COLUMN attached_image_url TEXT;

-- Add notes and attached_image fields to orders table as well for consistency
ALTER TABLE public.orders 
ADD COLUMN notes TEXT,
ADD COLUMN attached_image_url TEXT;
