import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';

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
  profit: number;
  status: string;
  order_date: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  attached_image_url?: string;
  admin_order_items: AdminOrderItem[];
}

interface AdminOrderItem {
  id: string;
  product_name: string;
  product_size: string;
  quantity: number;
  unit_cost: number;
  unit_price: number;
  item_discount: number;
  total_price: number;
  profit: number;
}

interface OrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: AdminOrder | null;
  calculateOrderDetails: (order: AdminOrder) => { orderSubtotal: number; orderCost: number; orderNetProfit: number };
}

const OrderDetailsDialog = ({ open, onOpenChange, order, calculateOrderDetails }: OrderDetailsDialogProps) => {
  if (!order) return null;

  const { orderSubtotal, orderCost, orderNetProfit } = calculateOrderDetails(order);
  const orderTotal = orderSubtotal + (order.shipping_cost || 0) - (order.deposit || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>تفاصيل الطلب - {order.serial}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-lg font-bold text-green-600">
                  {formatCurrency(orderSubtotal)}
                </div>
                <p className="text-sm text-muted-foreground">المجموع الفرعي</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-lg font-bold text-red-600">
                  {formatCurrency(orderCost)}
                </div>
                <p className="text-sm text-muted-foreground">التكلفة</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-lg font-bold text-orange-600">
                  {formatCurrency(order.shipping_cost || 0)}
                </div>
                <p className="text-sm text-muted-foreground">مصاريف الشحن</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-lg font-bold text-blue-600">
                  {formatCurrency(order.deposit || 0)}
                </div>
                <p className="text-sm text-muted-foreground">العربون</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-lg font-bold text-purple-600">
                  {formatCurrency(orderTotal)}
                </div>
                <p className="text-sm text-muted-foreground">الصافي</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xl font-bold text-emerald-600">
                  {formatCurrency(orderNetProfit)}
                </div>
                <p className="text-sm text-muted-foreground">صافي الربح</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;