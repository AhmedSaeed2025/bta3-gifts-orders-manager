
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { Printer, Eye, Trash2, FileText, Image } from 'lucide-react';
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

interface OrdersTableProps {
  orders: AdminOrder[];
  updateOrderStatus: (orderId: string, newStatus: string) => void;
  deleteOrder: (orderId: string) => void;
  openInvoiceDialog: (order: AdminOrder) => void;
  openOrderDetailsDialog: (order: AdminOrder) => void;
  openNotesDialog: (order: AdminOrder) => void;
  openImageDialog: (order: AdminOrder) => void;
  calculateOrderDetails: (order: AdminOrder) => { orderSubtotal: number; orderCost: number; orderNetProfit: number };
}

const OrdersTable = ({
  orders,
  updateOrderStatus,
  deleteOrder,
  openInvoiceDialog,
  openOrderDetailsDialog,
  openNotesDialog,
  openImageDialog,
  calculateOrderDetails
}: OrdersTableProps) => {
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

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        لا توجد طلبات حتى الآن
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">رقم الطلب</TableHead>
            <TableHead className="text-right">اسم العميل</TableHead>
            <TableHead className="text-right">الهاتف</TableHead>
            <TableHead className="text-right">طريقة الدفع</TableHead>
            <TableHead className="text-right">المجموع الفرعي</TableHead>
            <TableHead className="text-right">التكلفة</TableHead>
            <TableHead className="text-right">مصاريف الشحن</TableHead>
            <TableHead className="text-right">العربون</TableHead>
            <TableHead className="text-right">الصافي</TableHead>
            <TableHead className="text-right">الربح</TableHead>
            <TableHead className="text-right">الحالة</TableHead>
            <TableHead className="text-right">التاريخ</TableHead>
            <TableHead className="text-center">تفاصيل الطلب</TableHead>
            <TableHead className="text-center">ملاحظات/صور</TableHead>
            <TableHead className="text-center">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const { orderSubtotal, orderCost, orderNetProfit } = calculateOrderDetails(order);
            const orderTotal = orderSubtotal + (order.shipping_cost || 0) - (order.deposit || 0);
            
            return (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.serial}</TableCell>
                <TableCell>{order.customer_name}</TableCell>
                <TableCell>{order.customer_phone}</TableCell>
                <TableCell>{order.payment_method}</TableCell>
                <TableCell className="font-medium text-green-600">{formatCurrency(orderSubtotal)}</TableCell>
                <TableCell className="font-medium text-red-600">{formatCurrency(orderCost)}</TableCell>
                <TableCell className="font-medium text-orange-600">{formatCurrency(order.shipping_cost || 0)}</TableCell>
                <TableCell className="font-medium text-blue-600">{formatCurrency(order.deposit || 0)}</TableCell>
                <TableCell className="font-medium text-purple-600">{formatCurrency(orderTotal)}</TableCell>
                <TableCell className="font-medium text-emerald-600">{formatCurrency(orderNetProfit)}</TableCell>
                <TableCell>
                  <Select 
                    value={order.status} 
                    onValueChange={(value) => updateOrderStatus(order.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue>
                        <Badge className={getStatusBadgeColor(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </SelectValue>
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
                </TableCell>
                <TableCell>
                  {new Date(order.order_date).toLocaleDateString('ar-EG')}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openOrderDetailsDialog(order)}
                    title="عرض تفاصيل الطلب"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 justify-center">
                    {order.notes && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openNotesDialog(order)}
                        title="عرض الملاحظات"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    )}
                    {order.attached_image_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openImageDialog(order)}
                        title="عرض الصورة المرفقة"
                      >
                        <Image className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openInvoiceDialog(order)}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteOrder(order.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrdersTable;
