ALTER TABLE public.store_settings 
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'مصر',
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS invoice_thank_you TEXT DEFAULT 'شكراً لثقتك بنا';

GRANT SELECT (city, country, website_url, invoice_thank_you) ON public.store_settings TO anon;
GRANT SELECT (city, country, website_url, invoice_thank_you) ON public.store_settings TO authenticated;