import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { Printer, Eye, Edit, Trash2, RefreshCw, Plus, FileText, Image } from 'lucide-react';
import AdminOrderInvoice from '@/components/admin/AdminOrderInvoice';
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

const AdminOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedOrderForNotes, setSelectedOrderForNotes] = useState<AdminOrder | null>(null);
  const [selectedOrderForImage, setSelectedOrderForImage] = useState<AdminOrder | null>(null);

  // Load orders from database
  const loadOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data: ordersData, error } = await supabase
        .from('admin_orders')
        .select(`
          *,
          admin_order_items (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading orders:', error);
        toast.error('خطأ في تحميل الطلبات');
        return;
      }

      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('خطأ في تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [user]);

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('admin_orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error updating order status:', error);
        toast.error('خطأ في تحديث حالة الطلب');
        return;
      }

      toast.success('تم تحديث حالة الطلب بنجاح');
      loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('خطأ في تحديث حالة الطلب');
    }
  };

  // Enhanced delete order function to also delete related transactions
  const deleteOrder = async (orderId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الطلب؟ سيتم حذف جميع المعاملات المرتبطة به أيضاً.')) {
      return;
    }

    try {
      const orderToDelete = orders.find(order => order.id === orderId);
      if (!orderToDelete) {
        toast.error('الطلب غير موجود');
        return;
      }

      console.log('Deleting order and related transactions:', orderToDelete.serial);

      // First delete related transactions from both transactions tables
      const { error: transactionError } = await supabase
        .from('transactions')
        .delete()
        .eq('order_serial', orderToDelete.serial)
        .eq('user_id', user?.id);

      if (transactionError) {
        console.error('Error deleting transactions:', transactionError);
        // Don't throw error, just log it as transactions might not exist
      }

      // Delete the order (cascade will handle admin_order_items)
      const { error: orderError } = await supabase
        .from('admin_orders')
        .delete()
        .eq('id', orderId)
        .eq('user_id', user?.id);

      if (orderError) {
        console.error('Error deleting order:', orderError);
        throw orderError;
      }

      console.log('Order and related data deleted successfully');
      toast.success('تم حذف الطلب وجميع المعاملات المرتبطة به بنجاح');
      loadOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('حدث خطأ في حذف الطلب');
    }
  };

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

  const openInvoiceDialog = (order: AdminOrder) => {
    setSelectedOrder(order);
    setInvoiceDialogOpen(true);
  };

  const openNotesDialog = (order: AdminOrder) => {
    setSelectedOrderForNotes(order);
    setNotesDialogOpen(true);
  };

  const openImageDialog = (order: AdminOrder) => {
    setSelectedOrderForImage(order);
    setImageDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الطلبات</h1>
          <p className="text-muted-foreground">تتبع وإدارة جميع طلبات العملاء</p>
        </div>
        <Button onClick={loadOrders} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          تحديث
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {orders.length}
            </div>
            <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {orders.filter(o => o.status === 'pending').length}
            </div>
            <p className="text-sm text-muted-foreground">طلبات في الانتظار</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(orders.reduce((sum, o) => sum + o.total_amount, 0))}
            </div>
            <p className="text-sm text-muted-foreground">إجمالي المبيعات (بعد الخصم)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(orders.reduce((sum, o) => sum + o.profit, 0))}
            </div>
            <p className="text-sm text-muted-foreground">إجمالي الربح</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الطلبات</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد طلبات حتى الآن
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم الطلب</TableHead>
                    <TableHead className="text-right">اسم العميل</TableHead>
                    <TableHead className="text-right">الهاتف</TableHead>
                    <TableHead className="text-right">طريقة الدفع</TableHead>
                    <TableHead className="text-right">المبلغ الإجمالي</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-center">ملاحظات/صور</TableHead>
                    <TableHead className="text-center">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.serial}</TableCell>
                      <TableCell>{order.customer_name}</TableCell>
                      <TableCell>{order.customer_phone}</TableCell>
                      <TableCell>{order.payment_method}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{formatCurrency(order.total_amount)}</div>
                          {order.deposit && order.deposit > 0 && (
                            <div className="text-xs text-muted-foreground">
                              عربون: {formatCurrency(order.deposit)}
                            </div>
                          )}
                        </div>
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
                      <TableCell>
                        {new Date(order.order_date).toLocaleDateString('ar-EG')}
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>فاتورة الطلب - {selectedOrder?.serial}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <AdminOrderInvoice 
              order={selectedOrder}
              onClose={() => setInvoiceDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>ملاحظات الطلب - {selectedOrderForNotes?.serial}</DialogTitle>
          </DialogHeader>
          {selectedOrderForNotes?.notes && (
            <div className="p-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">{selectedOrderForNotes.notes}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>الصورة المرفقة - {selectedOrderForImage?.serial}</DialogTitle>
          </DialogHeader>
          {selectedOrderForImage?.attached_image_url && (
            <div className="p-4">
              <img
                src={selectedOrderForImage.attached_image_url}
                alt="الصورة المرفقة مع الطلب"
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg border"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
