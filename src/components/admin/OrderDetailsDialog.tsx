
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تفاصيل الطلب - {order.serial}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Order Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

          {/* Customer Information */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-3">معلومات العميل</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">اسم العميل</p>
                  <p className="font-medium">{order.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                  <p className="font-medium">{order.customer_phone}</p>
                </div>
                {order.customer_email && (
                  <div>
                    <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                    <p className="font-medium">{order.customer_email}</p>
                  </div>
                )}
                {order.shipping_address && (
                  <div>
                    <p className="text-sm text-muted-foreground">عنوان الشحن</p>
                    <p className="font-medium">{order.shipping_address}</p>
                  </div>
                )}
                {order.governorate && (
                  <div>
                    <p className="text-sm text-muted-foreground">المحافظة</p>
                    <p className="font-medium">{order.governorate}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-3">
                أصناف الطلب ({order.admin_order_items?.length || 0} صنف)
              </h3>
              {!order.admin_order_items || order.admin_order_items.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">لا توجد أصناف مسجلة في هذا الطلب</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right p-2">الصنف</th>
                        <th className="text-right p-2">المقاس</th>
                        <th className="text-right p-2">الكمية</th>
                        <th className="text-right p-2">السعر</th>
                        <th className="text-right p-2">التكلفة</th>
                        <th className="text-right p-2">الخصم</th>
                        <th className="text-right p-2">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.admin_order_items.map((item, index) => (
                        <tr key={item.id} className="border-b">
                          <td className="p-2">{item.product_name}</td>
                          <td className="p-2">{item.product_size}</td>
                          <td className="p-2">{item.quantity}</td>
                          <td className="p-2">{formatCurrency(item.unit_price)}</td>
                          <td className="p-2">{formatCurrency(item.unit_cost)}</td>
                          <td className="p-2">{formatCurrency(item.item_discount || 0)}</td>
                          <td className="p-2 font-semibold">{formatCurrency(item.total_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-3">تفاصيل الطلب</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">طريقة الدفع</p>
                  <p className="font-medium">{order.payment_method}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">طريقة التوصيل</p>
                  <p className="font-medium">{order.delivery_method}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">حالة الطلب</p>
                  <p className="font-medium">{order.status}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">تاريخ الطلب</p>
                  <p className="font-medium">{new Date(order.order_date).toLocaleDateString('ar-EG')}</p>
                </div>
              </div>
              {order.notes && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">ملاحظات</p>
                  <p className="font-medium mt-1">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attached Image */}
          {order.attached_image_url && (
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-3">الصورة المرفقة</h3>
                <div className="flex justify-center">
                  <img
                    src={order.attached_image_url}
                    alt="الصورة المرفقة مع الطلب"
                    className="max-w-full h-auto max-h-64 rounded-lg border"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
