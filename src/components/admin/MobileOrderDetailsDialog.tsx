
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Phone, Mail, MapPin, Package, CreditCard, Truck, Calendar, User, FileText, Image as ImageIcon } from 'lucide-react';

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

interface MobileOrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: AdminOrder | null;
  calculateOrderDetails: (order: AdminOrder) => { orderSubtotal: number; orderCost: number; orderNetProfit: number };
}

const MobileOrderDetailsDialog = ({ open, onOpenChange, order, calculateOrderDetails }: MobileOrderDetailsDialogProps) => {
  if (!order) return null;

  const { orderSubtotal, orderCost, orderNetProfit } = calculateOrderDetails(order);
  const orderTotal = orderSubtotal + (order.shipping_cost || 0) - (order.deposit || 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-orange-100 text-orange-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            طلب رقم {order.serial}
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-4 pb-4 space-y-4">
          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge className={getStatusColor(order.status)}>
              {order.status}
            </Badge>
          </div>

          {/* Financial Summary */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                الملخص المالي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white p-2 rounded">
                  <span className="text-gray-600">المجموع الفرعي:</span>
                  <div className="font-bold text-green-600">{formatCurrency(orderSubtotal)}</div>
                </div>
                <div className="bg-white p-2 rounded">
                  <span className="text-gray-600">التكلفة:</span>
                  <div className="font-bold text-red-600">{formatCurrency(orderCost)}</div>
                </div>
                <div className="bg-white p-2 rounded">
                  <span className="text-gray-600">الشحن:</span>
                  <div className="font-bold text-orange-600">{formatCurrency(order.shipping_cost || 0)}</div>
                </div>
                <div className="bg-white p-2 rounded">
                  <span className="text-gray-600">العربون:</span>
                  <div className="font-bold text-blue-600">{formatCurrency(order.deposit || 0)}</div>
                </div>
                <div className="bg-white p-2 rounded">
                  <span className="text-gray-600">الصافي:</span>
                  <div className="font-bold text-purple-600">{formatCurrency(orderTotal)}</div>
                </div>
                <div className="bg-white p-2 rounded">
                  <span className="text-gray-600">الربح:</span>
                  <div className="font-bold text-emerald-600">{formatCurrency(orderNetProfit)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                بيانات العميل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-gray-500" />
                <span>{order.customer_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-gray-500" />
                <span dir="ltr">{order.customer_phone}</span>
              </div>
              {order.customer_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-gray-500" />
                  <span className="text-xs">{order.customer_email}</span>
                </div>
              )}
              {order.governorate && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-gray-500" />
                  <span>{order.governorate}</span>
                </div>
              )}
              {order.shipping_address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-3 w-3 text-gray-500 mt-0.5" />
                  <span className="text-xs leading-relaxed">{order.shipping_address}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                تفاصيل الطلب
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-600">الدفع:</span>
                  <div className="font-medium">{order.payment_method}</div>
                </div>
                <div>
                  <span className="text-gray-600">التوصيل:</span>
                  <div className="font-medium">{order.delivery_method}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-gray-500" />
                <span>{new Date(order.order_date).toLocaleDateString('ar-EG')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />
                الأصناف ({order.admin_order_items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.admin_order_items?.length > 0 ? (
                <div className="space-y-3">
                  {order.admin_order_items.map((item, index) => (
                    <div key={item.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="font-medium text-sm mb-2">{item.product_name}</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">المقاس:</span> {item.product_size}
                        </div>
                        <div>
                          <span className="text-gray-600">الكمية:</span> {item.quantity}
                        </div>
                        <div>
                          <span className="text-gray-600">السعر:</span> {formatCurrency(item.unit_price)}
                        </div>
                        <div>
                          <span className="text-gray-600">التكلفة:</span> {formatCurrency(item.unit_cost)}
                        </div>
                        {item.item_discount > 0 && (
                          <div className="col-span-2">
                            <span className="text-gray-600">الخصم:</span> {formatCurrency(item.item_discount)}
                          </div>
                        )}
                        <div className="col-span-2 pt-1 border-t">
                          <span className="text-gray-600">الإجمالي:</span> 
                          <span className="font-bold text-green-600 mr-1">{formatCurrency(item.total_price)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  لا توجد أصناف
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  ملاحظات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap">
                  {order.notes}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attached Image */}
          {order.attached_image_url && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  الصورة المرفقة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={order.attached_image_url}
                  alt="الصورة المرفقة"
                  className="w-full rounded-lg border"
                />
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MobileOrderDetailsDialog;
