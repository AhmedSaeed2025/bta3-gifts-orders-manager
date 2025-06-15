
-- Add missing social media columns to store_settings table
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS whatsapp_chat_url text,
ADD COLUMN IF NOT EXISTS whatsapp_catalog_url text,
ADD COLUMN IF NOT EXISTS telegram_url text;
