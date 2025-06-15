
-- Add banner fields to store_settings table
ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS enable_banners BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS hero_banner_link TEXT,
ADD COLUMN IF NOT EXISTS promo_banner_1_url TEXT,
ADD COLUMN IF NOT EXISTS promo_banner_1_link TEXT,
ADD COLUMN IF NOT EXISTS promo_banner_2_url TEXT,
ADD COLUMN IF NOT EXISTS promo_banner_2_link TEXT,
ADD COLUMN IF NOT EXISTS side_banner_1_url TEXT,
ADD COLUMN IF NOT EXISTS side_banner_1_link TEXT,
ADD COLUMN IF NOT EXISTS side_banner_2_url TEXT,
ADD COLUMN IF NOT EXISTS side_banner_2_link TEXT,
ADD COLUMN IF NOT EXISTS footer_banner_url TEXT,
ADD COLUMN IF NOT EXISTS footer_banner_link TEXT;

-- Add comment to describe the banner fields
COMMENT ON COLUMN store_settings.enable_banners IS 'Enable or disable banner system in the store';
COMMENT ON COLUMN store_settings.hero_banner_link IS 'Link for the hero banner (1920x600px)';
COMMENT ON COLUMN store_settings.promo_banner_1_url IS 'URL for promotional banner 1 (800x400px)';
COMMENT ON COLUMN store_settings.promo_banner_1_link IS 'Link for promotional banner 1';
COMMENT ON COLUMN store_settings.promo_banner_2_url IS 'URL for promotional banner 2 (800x400px)';
COMMENT ON COLUMN store_settings.promo_banner_2_link IS 'Link for promotional banner 2';
COMMENT ON COLUMN store_settings.side_banner_1_url IS 'URL for side banner 1 (400x600px)';
COMMENT ON COLUMN store_settings.side_banner_1_link IS 'Link for side banner 1';
COMMENT ON COLUMN store_settings.side_banner_2_url IS 'URL for side banner 2 (400x600px)';
COMMENT ON COLUMN store_settings.side_banner_2_link IS 'Link for side banner 2';
COMMENT ON COLUMN store_settings.footer_banner_url IS 'URL for footer banner (1200x300px)';
COMMENT ON COLUMN store_settings.footer_banner_link IS 'Link for footer banner';
