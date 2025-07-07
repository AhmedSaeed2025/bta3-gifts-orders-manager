
-- Add shipping_status column to admin_orders table
ALTER TABLE public.admin_orders 
ADD COLUMN shipping_status TEXT DEFAULT 'pending';

-- Add a comment to describe the column
COMMENT ON COLUMN public.admin_orders.shipping_status IS 'Shipping status: pending, collected, delivered, returned';
