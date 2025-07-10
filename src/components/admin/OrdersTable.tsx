
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { Printer, Eye, Trash2, FileText, Image } from 'lucide-react';
import { ORDER_STATUS_LABELS } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileOrderDetailsDialog from './MobileOrderDetailsDialog';

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
  shipping_status?: string;
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
  const isMobile = useIsMobile();
  const [mobileDialogOpen, setMobileDialogOpen] = React.useState(false);
  const [selectedMobileOrder, setSelectedMobileOrder] = React.useState<AdminOrder | null>(null);

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

  const handleMobileOrderView = (order: AdminOrder) => {
    setSelectedMobileOrder(order);
    setMobileDialogOpen(true);
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        لا توجد طلبات حتى الآن
      </div>
    );
  }

  // Mobile view - simplified cards
  if (isMobile) {
    return (
      <>
        <div className="space-y-4">
          {orders.map((order) => {
            const { orderSubtotal, orderCost, orderNetProfit } = calculateOrderDetails(order);
            const orderTotal = orderSubtotal + (order.shipping_cost || 0) - (order.deposit || 0);
            
            return (
              <div key={order.id} className="bg-white border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-lg">{order.serial}</div>
                    <div className="text-sm text-muted-foreground">{order.customer_name}</div>
                  </div>
                  <Badge className={getStatusBadgeColor(order.status)}>
                    {getStatusLabel(order.status)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">الهاتف:</span>
                    <div dir="ltr" className="font-medium">{order.customer_phone}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">المحافظة:</span>
                    <div className="font-medium">{order.governorate || 'غير محدد'}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">المجموع الفرعي:</span>
                    <div className="font-bold text-green-600">{formatCurrency(orderSubtotal)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">التكلفة:</span>
                    <div className="font-bold text-red-600">{formatCurrency(orderCost)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">الشحن:</span>
                    <div className="font-bold text-orange-600">{formatCurrency(order.shipping_cost || 0)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">العربون:</span>
                    <div className="font-bold text-blue-600">{formatCurrency(order.deposit || 0)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">الصافي:</span>
                    <div className="font-bold text-purple-600">{formatCurrency(orderTotal)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">الربح:</span>
                    <div className="font-bold text-emerald-600">{formatCurrency(orderNetProfit)}</div>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {new Date(order.order_date).toLocaleDateString('ar-EG')}
                </div>
                
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMobileOrderView(order)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 ml-2" />
                    عرض التفاصيل
                  </Button>
                  
                  <Select 
                    value={order.status} 
                    onValueChange={(value) => updateOrderStatus(order.id, value)}
                  >
                    <SelectTrigger className="w-32">
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
                
                {(order.notes || order.attached_image_url) && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    {order.notes && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openNotesDialog(order)}
                      >
                        <FileText className="h-4 w-4 ml-2" />
                        ملاحظات
                      </Button>
                    )}
                    {order.attached_image_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openImageDialog(order)}
                      >
                        <Image className="h-4 w-4 ml-2" />
                        صورة
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <MobileOrderDetailsDialog
          open={mobileDialogOpen}
          onOpenChange={setMobileDialogOpen}
          order={selectedMobileOrder}
          calculateOrderDetails={calculateOrderDetails}
        />
      </>
    );
  }

  // Desktop view - table format
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right min-w-[120px]">رقم الطلب</TableHead>
            <TableHead className="text-right min-w-[150px]">اسم العميل</TableHead>
            <TableHead className="text-right min-w-[120px]">الهاتف</TableHead>
            <TableHead className="text-right min-w-[100px]">طريقة الدفع</TableHead>
            <TableHead className="text-right min-w-[120px]">المحافظة</TableHead>
            <TableHead className="text-right min-w-[120px] bg-green-50">المجموع الفرعي</TableHead>
            <TableHead className="text-right min-w-[100px] bg-red-50">التكلفة</TableHead>
            <TableHead className="text-right min-w-[120px] bg-orange-50">مصاريف الشحن</TableHead>
            <TableHead className="text-right min-w-[100px] bg-blue-50">العربون</TableHead>
            <TableHead className="text-right min-w-[100px] bg-purple-50">الصافي</TableHead>
            <TableHead className="text-right min-w-[100px] bg-emerald-50">قيمة الربح</TableHead>
            <TableHead className="text-right min-w-[120px]">الحالة</TableHead>
            <TableHead className="text-right min-w-[100px]">التاريخ</TableHead>
            <TableHead className="text-center min-w-[80px]">تفاصيل</TableHead>
            <TableHead className="text-center min-w-[100px]">ملاحظات/صور</TableHead>
            <TableHead className="text-center min-w-[120px]">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const { orderSubtotal, orderCost, orderNetProfit } = calculateOrderDetails(order);
            const orderTotal = orderSubtotal + (order.shipping_cost || 0) - (order.deposit || 0);
            
            return (
              <TableRow key={order.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{order.serial}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{order.customer_name}</div>
                    {order.customer_email && (
                      <div className="text-xs text-muted-foreground">{order.customer_email}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{order.customer_phone}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{order.payment_method}</div>
                    <div className="text-xs text-muted-foreground">{order.delivery_method}</div>
                  </div>
                </TableCell>
                <TableCell>{order.governorate || 'غير محدد'}</TableCell>
                <TableCell className="font-medium text-green-600 bg-green-50">
                  {formatCurrency(orderSubtotal)}
                </TableCell>
                <TableCell className="font-medium text-red-600 bg-red-50">
                  {formatCurrency(orderCost)}
                </TableCell>
                <TableCell className="font-medium text-orange-600 bg-orange-50">
                  {formatCurrency(order.shipping_cost || 0)}
                </TableCell>
                <TableCell className="font-medium text-blue-600 bg-blue-50">
                  {formatCurrency(order.deposit || 0)}
                </TableCell>
                <TableCell className="font-medium text-purple-600 bg-purple-50">
                  {formatCurrency(orderTotal)}
                </TableCell>
                <TableCell className="font-bold text-emerald-600 bg-emerald-50">
                  {formatCurrency(orderNetProfit)}
                </TableCell>
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
                <TableCell className="text-sm">
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
                  <div className="flex items-center gap-1 justify-center">
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
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openInvoiceDialog(order)}
                      title="طباعة الفاتورة"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteOrder(order.id)}
                      title="حذف الطلب"
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
