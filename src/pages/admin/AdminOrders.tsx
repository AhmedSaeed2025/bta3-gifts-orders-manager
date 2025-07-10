
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';
import { Search, Plus, Filter, Download, Trash2, FileText, Image } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import OrdersTable from '@/components/admin/OrdersTable';
import MobileOrdersManagement from '@/components/admin/MobileOrdersManagement';
import OrderPaymentDialog from '@/components/admin/OrderPaymentDialog';
import AdminOrderInvoice from '@/components/admin/AdminOrderInvoice';
import { toast } from 'sonner';

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

const AdminOrders = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [orderDetailsDialogOpen, setOrderDetailsDialogOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'collection' | 'shipping' | 'cost'>('collection');

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('admin_orders')
        .select(`
          *,
          admin_order_items (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  const filteredOrders = orders.filter((order: AdminOrder) => {
    const matchesSearch = order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.serial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_phone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const calculateOrderDetails = (order: AdminOrder) => {
    const orderSubtotal = order.admin_order_items?.reduce((sum, item) => {
      return sum + (item.unit_price - (item.item_discount || 0)) * item.quantity;
    }, 0) || 0;
    
    const orderCost = order.admin_order_items?.reduce((sum, item) => {
      return sum + item.unit_cost * item.quantity;
    }, 0) || 0;
    
    const orderNetProfit = orderSubtotal - orderCost;
    
    return { orderSubtotal, orderCost, orderNetProfit };
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('admin_orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('تم تحديث حالة الطلب بنجاح');
      
      // Invalidate all order-related queries to sync across components
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['detailed-orders-report'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      
      refetch();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('حدث خطأ في تحديث حالة الطلب');
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;

    try {
      const { error } = await supabase
        .from('admin_orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      toast.success('تم حذف الطلب بنجاح');
      refetch();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('حدث خطأ في حذف الطلب');
    }
  };

  const openInvoiceDialog = (order: AdminOrder) => {
    setSelectedOrder(order);
    setInvoiceDialogOpen(true);
  };

  const openOrderDetailsDialog = (order: AdminOrder) => {
    setSelectedOrder(order);
    setOrderDetailsDialogOpen(true);
  };

  const openNotesDialog = (order: AdminOrder) => {
    setSelectedOrder(order);
    setNotesDialogOpen(true);
  };

  const openImageDialog = (order: AdminOrder) => {
    setSelectedOrder(order);
    setImageDialogOpen(true);
  };

  const handleEditOrder = (order: AdminOrder) => {
    navigate(`/edit-order/${order.serial}`);
  };

  const handlePayment = async (amount: number, notes?: string) => {
    if (!selectedOrder) return;

    try {
      // Update order based on payment type
      if (paymentType === 'collection') {
        const newDeposit = (selectedOrder.deposit || 0) + amount;
        
        const { error: orderError } = await supabase
          .from('admin_orders')
          .update({ deposit: newDeposit })
          .eq('id', selectedOrder.id);

        if (orderError) throw orderError;
      }

      // Add transaction record
      const transactionType = paymentType === 'collection' ? 'order_collection' :
                             paymentType === 'shipping' ? 'shipping_payment' : 'cost_payment';
      
      const description = paymentType === 'collection' ? `تحصيل من الطلب ${selectedOrder.serial}` :
                         paymentType === 'shipping' ? `سداد شحن للطلب ${selectedOrder.serial}` :
                         `سداد تكلفة للطلب ${selectedOrder.serial}`;

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          amount: amount,
          transaction_type: transactionType,
          description: notes ? `${description} - ${notes}` : description,
          order_serial: selectedOrder.serial
        });

      if (transactionError) throw transactionError;

      toast.success('تم تسجيل المعاملة بنجاح');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setPaymentDialogOpen(false);
    } catch (error) {
      console.error('Error adding payment:', error);
      toast.error('حدث خطأ في تسجيل المعاملة');
    }
  };

  const openPaymentDialog = (order: AdminOrder, type: 'collection' | 'shipping' | 'cost') => {
    setSelectedOrder(order);
    setPaymentType(type);
    setPaymentDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">إدارة الطلبات</CardTitle>
              <p className="text-muted-foreground">إدارة ومتابعة جميع طلبات العملاء</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 ml-1" />
                تصدير
              </Button>
              <Button onClick={() => navigate('/order')} size="sm">
                <Plus className="h-4 w-4 ml-1" />
                طلب جديد
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
            <div className="space-y-2">
              <label className="text-sm font-medium">البحث</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="اسم العميل، رقم الطلب، الهاتف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">حالة الطلب</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">قيد المراجعة</SelectItem>
                  <SelectItem value="confirmed">تم التأكيد</SelectItem>
                  <SelectItem value="processing">قيد التحضير</SelectItem>
                  <SelectItem value="shipped">تم الشحن</SelectItem>
                  <SelectItem value="delivered">تم التوصيل</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">الإجراءات</label>
              <Button variant="outline" className="w-full">
                <Filter className="h-4 w-4 ml-1" />
                فلاتر متقدمة
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {isMobile ? (
        <MobileOrdersManagement
          orders={filteredOrders}
          onUpdateStatus={updateOrderStatus}
          onDeleteOrder={deleteOrder}
          onEditOrder={handleEditOrder}
          onPrintInvoice={openInvoiceDialog}
          onPayment={openPaymentDialog}
          calculateOrderDetails={calculateOrderDetails}
        />
      ) : (
        <OrdersTable
          orders={filteredOrders}
          updateOrderStatus={updateOrderStatus}
          deleteOrder={deleteOrder}
          openInvoiceDialog={openInvoiceDialog}
          openOrderDetailsDialog={openOrderDetailsDialog}
          openNotesDialog={openNotesDialog}
          openImageDialog={openImageDialog}
          calculateOrderDetails={calculateOrderDetails}
        />
      )}

      {/* Invoice Dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>فاتورة الطلب - {selectedOrder?.serial}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <AdminOrderInvoice order={selectedOrder} />
          )}
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={orderDetailsDialogOpen} onOpenChange={setOrderDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب - {selectedOrder?.serial}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">بيانات العميل</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>الاسم: {selectedOrder.customer_name}</div>
                  <div>الهاتف: {selectedOrder.customer_phone}</div>
                  <div>المحافظة: {selectedOrder.governorate || 'غير محدد'}</div>
                  <div>العنوان: {selectedOrder.shipping_address || 'غير محدد'}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">المنتجات</h4>
                <div className="space-y-2">
                  {selectedOrder.admin_order_items?.map((item, index) => (
                    <div key={index} className="bg-gray-50 p-2 rounded">
                      <div>{item.product_name} - {item.product_size}</div>
                      <div className="text-sm text-muted-foreground">
                        الكمية: {item.quantity} | السعر: {formatCurrency(item.total_price)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ملاحظات الطلب - {selectedOrder?.serial}</DialogTitle>
          </DialogHeader>
          {selectedOrder?.notes && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p>{selectedOrder.notes}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>الصورة المرفقة - {selectedOrder?.serial}</DialogTitle>
          </DialogHeader>
          {selectedOrder?.attached_image_url && (
            <div className="flex justify-center">
              <img 
                src={selectedOrder.attached_image_url} 
                alt="صورة مرفقة" 
                className="max-w-full max-h-96 object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <OrderPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        order={selectedOrder}
        paymentType={paymentType}
        onConfirm={handlePayment}
      />
    </div>
  );
};

export default AdminOrders;
