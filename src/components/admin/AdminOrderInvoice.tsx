import React from 'react';
import InvoiceTemplateSelector from '@/components/invoice/InvoiceTemplateSelector';
import { useStoreSettings } from '@/hooks/useStoreSettings';

interface AdminOrderItem {
  id: string;
  product_name: string;
  product_size: string;
  quantity: number;
  unit_price: number;
  item_discount: number;
  total_price: number;
}

interface AdminOrder {
  id: string;
  serial: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  shipping_address?: string;
  governorate?: string;
  payment_method: string;
  delivery_method: string;
  shipping_cost: number;
  discount: number;
  deposit: number;
  total_amount: number;
  status: string;
  order_date: string;
  notes?: string;
  admin_order_items: AdminOrderItem[];
}

interface AdminOrderInvoiceProps {
  order: AdminOrder;
  onClose?: () => void;
}

const AdminOrderInvoice: React.FC<AdminOrderInvoiceProps> = ({ order, onClose }) => {
  const { data: storeSettings } = useStoreSettings();

  const invoiceOrder = {
    ...order,
    client_name: order.customer_name,
    customer_name: order.customer_name,
    phone: order.customer_phone,
    customer_phone: order.customer_phone,
    address: order.shipping_address,
    shipping_address: order.shipping_address,
    date_created: order.order_date,
    order_date: order.order_date,
    items: order.admin_order_items.map((item) => ({
      product_name: item.product_name,
      product_type: item.product_name,
      size: item.product_size,
      product_size: item.product_size,
      quantity: item.quantity,
      price: item.unit_price,
      unit_price: item.unit_price,
      item_discount: item.item_discount,
      total_price: item.total_price,
    })),
  };

  return (
    <InvoiceTemplateSelector
      order={invoiceOrder}
      storeSettings={storeSettings}
      onClose={onClose}
      initialPreview
    />
  );
};

export default AdminOrderInvoice;