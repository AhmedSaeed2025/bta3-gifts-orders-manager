
-- إنشاء جدول الطلبات الإدارية لحفظ طلبات المتجر
CREATE TABLE IF NOT EXISTS public.admin_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  serial text NOT NULL UNIQUE,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  shipping_address text,
  governorate text,
  payment_method text NOT NULL,
  delivery_method text NOT NULL,
  shipping_cost numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  deposit numeric DEFAULT 0,
  total_amount numeric NOT NULL,
  profit numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  order_date timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- إنشاء جدول عناصر الطلبات الإدارية
CREATE TABLE IF NOT EXISTS public.admin_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.admin_orders(id) ON DELETE CASCADE NOT NULL,
  product_name text NOT NULL,
  product_size text NOT NULL,
  quantity integer NOT NULL,
  unit_cost numeric NOT NULL,
  unit_price numeric NOT NULL,
  item_discount numeric DEFAULT 0,
  total_price numeric NOT NULL,
  profit numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- تفعيل Row Level Security
ALTER TABLE public.admin_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_order_items ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان للطلبات الإدارية
CREATE POLICY "Users can view their admin orders" 
  ON public.admin_orders 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their admin orders" 
  ON public.admin_orders 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their admin orders" 
  ON public.admin_orders 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their admin orders" 
  ON public.admin_orders 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- إنشاء سياسات الأمان لعناصر الطلبات الإدارية
CREATE POLICY "Users can view their admin order items" 
  ON public.admin_order_items 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.admin_orders 
    WHERE id = admin_order_items.order_id 
    AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create their admin order items" 
  ON public.admin_order_items 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.admin_orders 
    WHERE id = admin_order_items.order_id 
    AND user_id = auth.uid()
  ));

CREATE POLICY "Users can update their admin order items" 
  ON public.admin_order_items 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.admin_orders 
    WHERE id = admin_order_items.order_id 
    AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their admin order items" 
  ON public.admin_order_items 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.admin_orders 
    WHERE id = admin_order_items.order_id 
    AND user_id = auth.uid()
  ));

-- إنشاء فهرس للأداء
CREATE INDEX IF NOT EXISTS idx_admin_orders_user_id ON public.admin_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_orders_serial ON public.admin_orders(serial);
CREATE INDEX IF NOT EXISTS idx_admin_orders_status ON public.admin_orders(status);
CREATE INDEX IF NOT EXISTS idx_admin_order_items_order_id ON public.admin_order_items(order_id);
