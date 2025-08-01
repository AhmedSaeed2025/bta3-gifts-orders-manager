-- إضافة حقل للدفعات الجزئية في جدول الطلبات
ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS payments_received NUMERIC DEFAULT 0;
ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC DEFAULT 0;

-- إضافة حقل الدفعات الجزئية لجدول orders القديم أيضاً
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payments_received NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC DEFAULT 0;

-- تحديث القيم الموجودة للدفعات المستلمة والمبالغ المتبقية
UPDATE admin_orders 
SET payments_received = COALESCE(deposit, 0),
    remaining_amount = total_amount - COALESCE(deposit, 0)
WHERE payments_received IS NULL OR remaining_amount IS NULL;

UPDATE orders 
SET payments_received = COALESCE(deposit, 0),
    remaining_amount = total - COALESCE(deposit, 0)
WHERE payments_received IS NULL OR remaining_amount IS NULL;