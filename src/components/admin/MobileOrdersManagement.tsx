
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import { Eye, Edit, Printer, Trash2, User, Phone, MapPin, Calendar, DollarSign, Receipt, Truck } from 'lucide-react';
import { ORDER_STATUS_LABELS } from '@/types';

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
  notes?: string;
  attached_image_url?: string;
  admin_order_items: any[];
}

interface MobileOrdersManagementProps {
  orders: AdminOrder[];
  onUpdateStatus: (orderId: string, status: string) => void;
  onDeleteOrder: (orderId: string) => void;
  onEditOrder: (order: AdminOrder) => void;
  onPrintInvoice: (order: AdminOrder) => void;
  onPayment: (order: AdminOrder, type: 'collection' | 'shipping' | 'cost') => void;
  calculateOrderDetails: (order: AdminOrder) => { orderSubtotal: number; orderCost: number; orderNetProfit: number };
}

const MobileOrdersManagement = ({
  orders,
  onUpdateStatus,
  onDeleteOrder,
  onEditOrder,
  onPrintInvoice,
  onPayment,
  calculateOrderDetails
}: MobileOrdersManagementProps) => {
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500 text-white';
      case 'confirmed': return 'bg-blue-500 text-white';
      case 'processing': return 'bg-orange-500 text-white';
      case 'shipped': return 'bg-purple-500 text-white';
      case 'delivered': return 'bg-green-500 text-white';
      case 'cancelled': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    return ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] || status;
  };

  const openDetails = (order: AdminOrder) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        لا توجد طلبات حتى الآن
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {orders.map((order) => {
          const { orderSubtotal, orderCost, orderNetProfit } = calculateOrderDetails(order);
          const remainingAmount = order.total_amount - (order.deposit || 0);
          
          return (
            <Card key={order.id} className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-lg">{order.serial}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {order.customer_name}
                      </div>
                    </div>
                    <Badge className={getStatusBadgeColor(order.status)}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>

                  {/* Customer Info */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span dir="ltr">{order.customer_phone}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span>{order.governorate || 'غير محدد'}</span>
                    </div>
                  </div>

                  {/* Financial Info */}
                  <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 p-3 rounded-lg">
                    <div>
                      <span className="text-muted-foreground">المبلغ الإجمالي:</span>
                      <div className="font-bold text-green-600">{formatCurrency(order.total_amount)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">العربون:</span>
                      <div className="font-bold text-blue-600">{formatCurrency(order.deposit || 0)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">المتبقي:</span>
                      <div className="font-bold text-orange-600">{formatCurrency(remainingAmount)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">الربح:</span>
                      <div className="font-bold text-emerald-600">{formatCurrency(orderNetProfit)}</div>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(order.order_date).toLocaleDateString('ar-EG')}
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-2 border-t">
                    {/* Status and Main Actions */}
                    <div className="flex gap-2">
                      <Select 
                        value={order.status} 
                        onValueChange={(value) => onUpdateStatus(order.id, value)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">قيد المراجعة</SelectItem>
                          <SelectItem value="confirmed">تم التأكيد</SelectItem>
                          <SelectItem value="processing">قيد التحضير</SelectItem>
                          <SelectItem value="shipped">تم الشحن</SelectItem>
                          <SelectItem value="delivered">تم التوصيل</SelectItem>
                          <SelectItem value="cancelled">ملغي</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDetails(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Secondary Actions */}
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEditOrder(order)}
                        className="flex-1 text-xs"
                      >
                        <Edit className="h-3 w-3 ml-1" />
                        تعديل
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onPrintInvoice(order)}
                        className="flex-1 text-xs"
                      >
                        <Printer className="h-3 w-3 ml-1" />
                        طباعة
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDeleteOrder(order.id)}
                        className="text-xs"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Payment Actions */}
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onPayment(order, 'collection')}
                        className="flex-1 text-xs bg-green-50 hover:bg-green-100"
                      >
                        <Receipt className="h-3 w-3 ml-1" />
                        تحصيل
                      </Button>
                      
                      {order.shipping_cost > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onPayment(order, 'shipping')}
                          className="flex-1 text-xs bg-orange-50 hover:bg-orange-100"
                        >
                          <Truck className="h-3 w-3 ml-1" />
                          شحن
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onPayment(order, 'cost')}
                        className="flex-1 text-xs bg-red-50 hover:bg-red-100"
                      >
                        <DollarSign className="h-3 w-3 ml-1" />
                        تكلفة
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب - {selectedOrder?.serial}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              {/* Customer Details */}
              <div className="space-y-2">
                <h4 className="font-semibold">بيانات العميل</h4>
                <div className="text-sm space-y-1">
                  <div>الاسم: {selectedOrder.customer_name}</div>
                  <div>الهاتف: {selectedOrder.customer_phone}</div>
                  <div>المحافظة: {selectedOrder.governorate || 'غير محدد'}</div>
                  <div>العنوان: {selectedOrder.shipping_address || 'غير محدد'}</div>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-2">
                <h4 className="font-semibold">المنتجات</h4>
                <div className="space-y-2">
                  {selectedOrder.admin_order_items?.map((item, index) => (
                    <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                      <div className="font-medium">{item.product_name}</div>
                      <div>المقاس: {item.product_size} | الكمية: {item.quantity}</div>
                      <div>السعر: {formatCurrency(item.total_price)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="space-y-2">
                <h4 className="font-semibold">الملخص المالي</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>المبلغ الإجمالي:</span>
                    <span>{formatCurrency(selectedOrder.total_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>العربون المسدد:</span>
                    <span className="text-green-600">{formatCurrency(selectedOrder.deposit || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الشحن:</span>
                    <span>{formatCurrency(selectedOrder.shipping_cost || 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-1">
                    <span>المتبقي:</span>
                    <span className="text-orange-600">{formatCurrency(selectedOrder.total_amount - (selectedOrder.deposit || 0))}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="space-y-2">
                  <h4 className="font-semibold">ملاحظات</h4>
                  <div className="text-sm bg-gray-50 p-2 rounded">
                    {selectedOrder.notes}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MobileOrdersManagement;
