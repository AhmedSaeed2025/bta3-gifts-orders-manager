// Columns of `store_settings` that are safe to expose to unauthenticated visitors.
// Sensitive payment/bank credentials are intentionally excluded and only readable
// by authenticated users (admins) via RLS + column grants.
export const PUBLIC_STORE_SETTINGS_COLUMNS = [
  'id', 'user_id', 'store_name', 'logo_url', 'primary_color', 'secondary_color',
  'contact_phone', 'contact_email', 'address', 'about_us', 'terms_conditions',
  'privacy_policy', 'shipping_policy', 'return_policy', 'is_active',
  'created_at', 'updated_at', 'store_tagline', 'contact_phone_2',
  'whatsapp_number', 'favicon_url', 'hero_banner_url', 'accent_color',
  'text_color', 'show_prices', 'show_out_of_stock', 'enable_dark_mode',
  'free_shipping_enabled', 'default_shipping_cost', 'free_shipping_threshold',
  'estimated_delivery_time', 'cash_on_delivery', 'bank_transfer',
  'mobile_wallets', 'credit_cards', 'cookie_policy', 'show_product_prices',
  'show_product_sizes', 'facebook_url', 'instagram_url', 'twitter_url',
  'youtube_url', 'linkedin_url', 'tiktok_url', 'snapchat_url',
  'customer_reviews_enabled', 'customer_review_images', 'default_language',
  'rtl_enabled', 'show_back_to_top', 'enable_banners', 'hero_banner_link',
  'promo_banner_1_url', 'promo_banner_1_link', 'promo_banner_2_url',
  'promo_banner_2_link', 'side_banner_1_url', 'side_banner_1_link',
  'side_banner_2_url', 'side_banner_2_link', 'footer_banner_url',
  'footer_banner_link', 'main_text', 'store_description',
  'whatsapp_chat_url', 'whatsapp_catalog_url', 'telegram_url',
  'footer_brand_text', 'store_enabled',
  'city', 'country', 'website_url', 'invoice_thank_you',
].join(', ');

// Columns of `product_sizes` safe for unauthenticated visitors (excludes `cost`).
export const PUBLIC_PRODUCT_SIZE_COLUMNS = 'id, product_id, size, price';
