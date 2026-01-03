-- Fix SECURITY DEFINER view by recreating as SECURITY INVOKER (default)
DROP VIEW IF EXISTS public.order_financial_view;

CREATE VIEW public.order_financial_view 
WITH (security_invoker = true)
AS
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