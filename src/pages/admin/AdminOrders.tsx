
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';
import AdminOrderInvoice from '@/components/admin/AdminOrderInvoice';
import OrderStatsCards from '@/components/admin/OrderStatsCards';
import OrdersTable from '@/components/admin/OrdersTable';
import OrderDetailsDialog from '@/components/admin/OrderDetailsDialog';
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
  const [orderDetailsDialogOpen, setOrderDetailsDialogOpen] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<AdminOrder | null>(null);

  // Load orders from database
  const loadOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Loading admin orders...');
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

      console.log('Loaded orders:', ordersData?.length || 0);
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

  // حساب إجماليات صحيحة - إجمالي الطلبات = المجموع الفرعي (بدون شحن)
  const calculateOrderTotals = () => {
    const subtotal = orders.reduce((sum, order) => {
      // حساب المجموع الفرعي من الأصناف فقط (السعر - الخصم) * الكمية
      const orderSubtotal = order.admin_order_items.reduce((itemSum, item) => {
        const discountedPrice = item.unit_price - (item.item_discount || 0);
        return itemSum + (discountedPrice * item.quantity);
      }, 0);
      return sum + orderSubtotal;
    }, 0);

    const totalCost = orders.reduce((sum, order) => {
      // حساب إجمالي التكلفة من تكلفة الأصناف * الكمية
      const orderCost = order.admin_order_items.reduce((itemSum, item) => {
        return itemSum + (item.unit_cost * item.quantity);
      }, 0);
      return sum + orderCost;
    }, 0);

    const totalShipping = orders.reduce((sum, order) => sum + (order.shipping_cost || 0), 0);
    const totalDeposit = orders.reduce((sum, order) => sum + (order.deposit || 0), 0);
    const netProfit = subtotal - totalCost; // الربح الصافي = المجموع الفرعي - التكلفة (بدون شحن)

    return { subtotal, totalCost, totalShipping, totalDeposit, netProfit };
  };

  const { subtotal: totalOrders, totalCost: totalOrderCost, totalShipping, totalDeposit, netProfit: totalNetProfit } = calculateOrderTotals();

  // حساب تفاصيل الطلب الفردي
  const calculateOrderDetails = (order: AdminOrder) => {
    const orderSubtotal = order.admin_order_items.reduce((sum, item) => {
      const discountedPrice = item.unit_price - (item.item_discount || 0);
      return sum + (discountedPrice * item.quantity);
    }, 0);

    const orderCost = order.admin_order_items.reduce((sum, item) => {
      return sum + (item.unit_cost * item.quantity);
    }, 0);

    const orderNetProfit = orderSubtotal - orderCost;

    return { orderSubtotal, orderCost, orderNetProfit };
  };

  const openInvoiceDialog = (order: AdminOrder) => {
    console.log('Opening invoice dialog for order:', order.serial);
    setSelectedOrder(order);
    setInvoiceDialogOpen(true);
  };

  const openNotesDialog = (order: AdminOrder) => {
    console.log('Opening notes dialog for order:', order.serial);
    setSelectedOrderForNotes(order);
    setNotesDialogOpen(true);
  };

  const openImageDialog = (order: AdminOrder) => {
    console.log('Opening image dialog for order:', order.serial);
    setSelectedOrderForImage(order);
    setImageDialogOpen(true);
  };

  const openOrderDetailsDialog = (order: AdminOrder) => {
    console.log('Opening order details dialog for order:', order.serial);
    setSelectedOrderForDetails(order);
    setOrderDetailsDialogOpen(true);
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
      <OrderStatsCards
        totalOrders={orders.length}
        pendingOrders={orders.filter(o => o.status === 'pending').length}
        totalOrdersValue={totalOrders}
        totalOrderCost={totalOrderCost}
        totalShipping={totalShipping}
        totalDeposit={totalDeposit}
        totalNetProfit={totalNetProfit}
      />

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الطلبات</CardTitle>
        </CardHeader>
        <CardContent>
          <OrdersTable
            orders={orders}
            updateOrderStatus={updateOrderStatus}
            deleteOrder={deleteOrder}
            openInvoiceDialog={openInvoiceDialog}
            openOrderDetailsDialog={openOrderDetailsDialog}
            openNotesDialog={openNotesDialog}
            openImageDialog={openImageDialog}
            calculateOrderDetails={calculateOrderDetails}
          />
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <OrderDetailsDialog
        open={orderDetailsDialogOpen}
        onOpenChange={setOrderDetailsDialogOpen}
        order={selectedOrderForDetails}
        calculateOrderDetails={calculateOrderDetails}
      />

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
