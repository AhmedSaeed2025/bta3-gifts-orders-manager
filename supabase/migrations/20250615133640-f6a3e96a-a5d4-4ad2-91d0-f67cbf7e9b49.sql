
-- Add fields to store_settings for product display options
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS show_product_prices boolean DEFAULT true;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS show_product_sizes boolean DEFAULT true;

-- Add email field to orders table for guest orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS email text;

-- Create storage bucket for order attachments if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-attachments', 'order-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policy for order attachments
CREATE POLICY "Anyone can upload order attachments" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'order-attachments');

CREATE POLICY "Anyone can view order attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'order-attachments');
