
-- 1. ORDER ATTACHMENTS BUCKET: drop broad public policies
DROP POLICY IF EXISTS "Anyone can upload order attachments" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view order attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to order attachments" ON storage.objects;

-- Authenticated-only view; existing "Allow authenticated users to upload order attachments" already covers INSERT
CREATE POLICY "Authenticated users can view order attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'order-attachments');

-- 2. STORE LOGOS BUCKET: restrict UPDATE/DELETE/INSERT to admins
DROP POLICY IF EXISTS "Authenticated users can delete store logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update store logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload store logos" ON storage.objects;

CREATE POLICY "Admins can upload store logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'store-logos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update store logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'store-logos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete store logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'store-logos' AND public.has_role(auth.uid(), 'admin'));

-- 3. PRODUCT SIZES: hide `cost` column from anonymous visitors
REVOKE SELECT ON public.product_sizes FROM anon;
GRANT SELECT (id, product_id, size, price) ON public.product_sizes TO anon;

-- 4. STORE SETTINGS: hide sensitive payment credential columns from anon
REVOKE SELECT ON public.store_settings FROM anon;
GRANT SELECT (
  id, user_id, store_name, logo_url, primary_color, secondary_color,
  contact_phone, contact_email, address, about_us, terms_conditions,
  privacy_policy, shipping_policy, return_policy, is_active, created_at,
  updated_at, store_tagline, contact_phone_2, whatsapp_number, favicon_url,
  hero_banner_url, accent_color, text_color, show_prices, show_out_of_stock,
  enable_dark_mode, free_shipping_enabled, default_shipping_cost,
  free_shipping_threshold, estimated_delivery_time, cash_on_delivery,
  bank_transfer, mobile_wallets, credit_cards, cookie_policy,
  show_product_prices, show_product_sizes, facebook_url, instagram_url,
  twitter_url, youtube_url, linkedin_url, tiktok_url, snapchat_url,
  customer_reviews_enabled, customer_review_images, default_language,
  rtl_enabled, show_back_to_top, enable_banners, hero_banner_link,
  promo_banner_1_url, promo_banner_1_link, promo_banner_2_url,
  promo_banner_2_link, side_banner_1_url, side_banner_1_link,
  side_banner_2_url, side_banner_2_link, footer_banner_url,
  footer_banner_link, main_text, store_description, whatsapp_chat_url,
  whatsapp_catalog_url, telegram_url, footer_brand_text, store_enabled
) ON public.store_settings TO anon;

-- 5. USER ROLES: explicit admin-only mutation policies (defense in depth)
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;

CREATE POLICY "Only admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Lock down SECURITY DEFINER function from anon/authenticated callers
REVOKE EXECUTE ON FUNCTION public.generate_serial_number() FROM PUBLIC, anon, authenticated;
