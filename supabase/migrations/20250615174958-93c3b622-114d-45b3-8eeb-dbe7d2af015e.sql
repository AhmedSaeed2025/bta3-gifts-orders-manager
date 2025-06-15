
-- Add customer reviews section and language support to store_settings table
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS customer_reviews_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS customer_review_images TEXT[], -- Array of image URLs for customer reviews
ADD COLUMN IF NOT EXISTS default_language TEXT DEFAULT 'ar',
ADD COLUMN IF NOT EXISTS rtl_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_back_to_top BOOLEAN DEFAULT true;

-- Add a dedicated table for customer review images for better management
CREATE TABLE IF NOT EXISTS public.customer_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  review_text TEXT,
  customer_name TEXT,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on customer_reviews table
ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for customer_reviews table
CREATE POLICY "Users can view their own customer reviews" 
  ON public.customer_reviews 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own customer reviews" 
  ON public.customer_reviews 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customer reviews" 
  ON public.customer_reviews 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customer reviews" 
  ON public.customer_reviews 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policy for public access to active customer reviews (for store display)
CREATE POLICY "Public can view active customer reviews" 
  ON public.customer_reviews 
  FOR SELECT 
  USING (is_active = true);
