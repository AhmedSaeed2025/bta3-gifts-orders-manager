-- 1. Create customer_payments table
CREATE TABLE public.customer_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Instapay', 'Wallet', 'Post Office', 'Shipping Company', 'Cash')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_status TEXT NOT NULL DEFAULT 'Unpaid' CHECK (payment_status IN ('Paid', 'Partial', 'Unpaid')),
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create workshop_payments table
CREATE TABLE public.workshop_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  workshop_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  size_or_variant TEXT,
  cost_amount NUMERIC NOT NULL CHECK (cost_amount >= 0),
  payment_status TEXT NOT NULL DEFAULT 'Due' CHECK (payment_status IN ('Paid', 'Due')),
  expected_payment_date TIMESTAMP WITH TIME ZONE,
  actual_payment_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Enable RLS on both tables
ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_payments ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for customer_payments
CREATE POLICY "Users can view their own customer payments"
ON public.customer_payments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own customer payments"
ON public.customer_payments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customer payments"
ON public.customer_payments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customer payments"
ON public.customer_payments FOR DELETE
USING (auth.uid() = user_id);

-- 5. RLS Policies for workshop_payments
CREATE POLICY "Users can view their own workshop payments"
ON public.workshop_payments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workshop payments"
ON public.workshop_payments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workshop payments"
ON public.workshop_payments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workshop payments"
ON public.workshop_payments FOR DELETE
USING (auth.uid() = user_id);

-- 6. Create order_financial_view as a regular VIEW
CREATE OR REPLACE VIEW public.order_financial_view AS
SELECT 
  o.id AS order_id,
  o.serial,
  o.user_id,
  o.total AS selling_price,
  o.client_name,
  o.status AS order_status,
  o.date_created,
  COALESCE(cp_agg.total_paid, 0) AS total_customer_paid,
  COALESCE(wp_agg.total_cost, 0) AS total_workshop_cost,
  COALESCE(wp_agg.paid_cost, 0) AS paid_workshop_cost,
  (COALESCE(cp_agg.total_paid, 0) - COALESCE(wp_agg.paid_cost, 0)) AS net_profit_loss,
  CASE 
    WHEN (COALESCE(cp_agg.total_paid, 0) - COALESCE(wp_agg.paid_cost, 0)) > 0 THEN 'Positive'
    WHEN (COALESCE(cp_agg.total_paid, 0) - COALESCE(wp_agg.paid_cost, 0)) < 0 THEN 'Negative'
    ELSE 'Balanced'
  END AS cash_flow_status,
  CASE 
    WHEN COALESCE(cp_agg.total_paid, 0) = 0 OR COALESCE(wp_agg.total_cost, 0) = 0 THEN 'Incomplete'
    WHEN (COALESCE(cp_agg.total_paid, 0) - COALESCE(wp_agg.total_cost, 0)) > 0 THEN 'Profitable'
    ELSE 'Loss'
  END AS financial_status
FROM public.orders o
LEFT JOIN (
  SELECT order_id, SUM(amount) FILTER (WHERE payment_status IN ('Paid', 'Partial')) AS total_paid
  FROM public.customer_payments
  GROUP BY order_id
) cp_agg ON o.id = cp_agg.order_id
LEFT JOIN (
  SELECT order_id, 
         SUM(cost_amount) AS total_cost,
         SUM(cost_amount) FILTER (WHERE payment_status = 'Paid') AS paid_cost
  FROM public.workshop_payments
  GROUP BY order_id
) wp_agg ON o.id = wp_agg.order_id;

-- 7. Create indexes for better performance
CREATE INDEX idx_customer_payments_order_id ON public.customer_payments(order_id);
CREATE INDEX idx_customer_payments_user_id ON public.customer_payments(user_id);
CREATE INDEX idx_customer_payments_payment_date ON public.customer_payments(payment_date);
CREATE INDEX idx_workshop_payments_order_id ON public.workshop_payments(order_id);
CREATE INDEX idx_workshop_payments_user_id ON public.workshop_payments(user_id);
CREATE INDEX idx_workshop_payments_workshop_name ON public.workshop_payments(workshop_name);