
-- Add missing columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS video_url text,
ADD COLUMN IF NOT EXISTS discount_percentage numeric DEFAULT 0;
