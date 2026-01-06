-- Add missing columns used by the UI/settings
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS footer_brand_text text,
ADD COLUMN IF NOT EXISTS store_enabled boolean NOT NULL DEFAULT true;