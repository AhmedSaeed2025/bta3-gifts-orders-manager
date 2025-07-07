import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { Truck, RefreshCw, Package, CheckCircle, Calendar, Filter } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ShippingOrder {
  id: string;
  serial: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  governorate: string;
  shipping_cost: number;
  total_amount: number;
  status: string;
  order_date: string;
  delivery_method: string;
  payment_method: string;
  shipping_status?: 'pending' | 'collected' | 'delivered' | 'returned';
}

const ShippingReport = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<ShippingOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ShippingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ShippingOrder | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [shippingStatusFilter, setShippingStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const isMobile = useIsMobile();

  const loadShippingOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Loading all admin orders for shipping report');
      
      const { data: ordersData, error } = await supabase
        .from('admin_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading orders:', error);
        toast.error('خطأ في تحميل طلبات الشحن');
        return;
      }

      console.log('Loaded orders:', ordersData?.length || 0);

      const shippingOrders: ShippingOrder[] = ordersData?.map(order => ({
        id: order.id,
        serial: order.serial,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        shipping_address: order.shipping_address || '',
        governorate: order.governorate || '',
        shipping_cost: order.shipping_cost || 0,
        total_amount: order.total_amount,
        status: order.status,
        order_date: order.order_date,
        delivery_method: order.delivery_method,
        payment_method: order.payment_method,
        shipping_status: (order.shipping_status as 'pending' | 'collected' | 'delivered' | 'returned') || 'pending'
      })) || [];

      setOrders(shippingOrders);
      setFilteredOrders(shippingOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('خطأ في تحميل طلبات الشحن');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShippingOrders();
  }, [user]);

  useEffect(() => {
    let filtered = orders;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (shippingStatusFilter !== 'all') {
      filtered = filtered.filter(order => order.shipping_status === shippingStatusFilter);
    }

    if (dateFilter) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.order_date).toISOString().slice(0, 10);
        return orderDate === dateFilter;
      });
    }

    setFilteredOrders(filtered);
  }, [orders, statusFilter, shippingStatusFilter, dateFilter]);

  const updateShippingStatus = async (orderId: string, newShippingStatus: string) => {
    try {
      const { error } = await supabase
        .from('admin_orders')
        .update({ 
          shipping_status: newShippingStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error updating shipping status:', error);
        toast.error('خطأ في تحديث حالة الشحن');
        return;
      }

      toast.success('تم تحديث حالة الشحن بنجاح');
      loadShippingOrders();
    } catch (error) {
      console.error('Error updating shipping status:', error);
      toast.error('خطأ في تحديث حالة الشحن');
    }
  };

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
      loadShippingOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('خطأ في تحديث حالة الطلب');
    }
  };

  const getShippingStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-yellow-500 text-white">في الانتظار</Badge>;
      case 'collected': return <Badge className="bg-blue-500 text-white">تم التحصيل</Badge>;
      case 'delivered': return <Badge className="bg-green-500 text-white">تم التوصيل</Badge>;
      case 'returned': return <Badge className="bg-red-500 text-white">مرتجع</Badge>;
      default: return <Badge className="bg-gray-500 text-white">غير محدد</Badge>;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-yellow-500 text-white">قيد المراجعة</Badge>;
      case 'confirmed': return <Badge className="bg-blue-500 text-white">مؤكد</Badge>;
      case 'processing': return <Badge className="bg-orange-500 text-white">قيد التحضير</Badge>;
      case 'shipped': return <Badge className="bg-purple-500 text-white">تم الشحن</Badge>;
      case 'delivered': return <Badge className="bg-green-500 text-white">تم التوصيل</Badge>;
      case 'cancelled': return <Badge className="bg-red-500 text-white">ملغي</Badge>;
      default: return <Badge className="bg-gray-500 text-white">{status}</Badge>;
    }
  };

  const calculateTotals = () => {
    const totalOrders = filteredOrders.length;
    const totalShippingFees = filteredOrders.reduce((sum, order) => sum + order.shipping_cost, 0);
    const pendingOrders = filteredOrders.filter(order => order.shipping_status === 'pending').length;
    const collectedOrders = filteredOrders.filter(order => order.shipping_status === 'collected').length;
    const deliveredOrders = filteredOrders.filter(order => order.shipping_status === 'delivered').length;

    return { totalOrders, totalShippingFees, pendingOrders, collectedOrders, deliveredOrders };
  };

  const { totalOrders, totalShippingFees, pendingOrders, collectedOrders, deliveredOrders } = calculateTotals();

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
    <div className="p-3 md:p-6 space-y-4 md:space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">تقرير شركة الشحن</h1>
          <p className="text-muted-foreground text-sm md:text-base">متابعة وإدارة طلبات الشحن</p>
        </div>
        <Button onClick={loadShippingOrders} variant="outline" size={isMobile ? "sm" : "default"}>
          <RefreshCw className="h-4 w-4 mr-2" />
          تحديث
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="text-lg md:text-2xl font-bold text-blue-600">
              {totalOrders}
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">إجمالي الطلبات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="text-lg md:text-2xl font-bold text-green-600">
              {formatCurrency(totalShippingFees)}
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">رسوم الشحن</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="text-lg md:text-2xl font-bold text-yellow-600">
              {pendingOrders}
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">في الانتظار</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="text-lg md:text-2xl font-bold text-blue-600">
              {collectedOrders}
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">تم التحصيل</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="text-lg md:text-2xl font-bold text-green-600">
              {deliveredOrders}
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">تم التوصيل</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl flex items-center gap-2">
            <Filter className="h-5 w-5" />
            الفلاتر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="status-filter" className="text-sm">حالة الطلب</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" className="w-full">
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">قيد المراجعة</SelectItem>
                  <SelectItem value="confirmed">مؤكد</SelectItem>
                  <SelectItem value="processing">قيد التحضير</SelectItem>
                  <SelectItem value="shipped">تم الشحن</SelectItem>
                  <SelectItem value="delivered">تم التوصيل</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="shipping-status-filter" className="text-sm">حالة الشحن</Label>
              <Select value={shippingStatusFilter} onValueChange={setShippingStatusFilter}>
                <SelectTrigger id="shipping-status-filter" className="w-full">
                  <SelectValue placeholder="جميع حالات الشحن" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع حالات الشحن</SelectItem>
                  <SelectItem value="pending">في الانتظار</SelectItem>
                  <SelectItem value="collected">تم التحصيل</SelectItem>
                  <SelectItem value="delivered">تم التوصيل</SelectItem>
                  <SelectItem value="returned">مرتجع</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date-filter" className="text-sm">التاريخ</Label>
              <Input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => {
                  setStatusFilter('all');
                  setShippingStatusFilter('all');
                  setDateFilter('');
                }} 
                variant="outline"
                className="w-full"
              >
                إعادة تعيين
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">طلبات الشحن</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد طلبات شحن
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right text-xs md:text-sm">رقم الطلب</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">العميل</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">العنوان</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">المحافظة</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">طريقة التوصيل</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">رسوم الشحن</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">المبلغ الإجمالي</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">حالة الطلب</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">حالة الشحن</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">التاريخ</TableHead>
                    <TableHead className="text-center text-xs md:text-sm">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium text-xs md:text-sm">{order.serial}</TableCell>
                      <TableCell className="text-xs md:text-sm">
                        <div>
                          <div className="font-medium">{order.customer_name}</div>
                          <div className="text-muted-foreground text-xs">{order.customer_phone}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs md:text-sm max-w-32 truncate" title={order.shipping_address}>
                        {order.shipping_address || 'غير محدد'}
                      </TableCell>
                      <TableCell className="text-xs md:text-sm">{order.governorate || 'غير محدد'}</TableCell>
                      <TableCell className="text-xs md:text-sm">{order.delivery_method}</TableCell>
                      <TableCell className="text-xs md:text-sm">{formatCurrency(order.shipping_cost)}</TableCell>
                      <TableCell className="text-xs md:text-sm">{formatCurrency(order.total_amount)}</TableCell>
                      <TableCell className="text-xs md:text-sm">
                        <Select 
                          value={order.status} 
                          onValueChange={(value) => updateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-24 md:w-32 h-8">
                            <SelectValue>
                              {getOrderStatusBadge(order.status)}
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
                      <TableCell className="text-xs md:text-sm">
                        <Select 
                          value={order.shipping_status || 'pending'} 
                          onValueChange={(value) => updateShippingStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-24 md:w-32 h-8">
                            <SelectValue>
                              {getShippingStatusBadge(order.shipping_status || 'pending')}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">في الانتظار</SelectItem>
                            <SelectItem value="collected">تم التحصيل</SelectItem>
                            <SelectItem value="delivered">تم التوصيل</SelectItem>
                            <SelectItem value="returned">مرتجع</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-xs md:text-sm">
                        {new Date(order.order_date).toLocaleDateString('ar-EG')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedOrder(order);
                              setUpdateDialogOpen(true);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Package className="h-4 w-4" />
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

      {/* Update Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تحديث حالة الشحن - {selectedOrder?.serial}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>معلومات العميل</Label>
                <div className="text-sm text-muted-foreground">
                  <div>{selectedOrder.customer_name}</div>
                  <div>{selectedOrder.customer_phone}</div>
                  <div>{selectedOrder.shipping_address}</div>
                  <div>{selectedOrder.governorate}</div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>تفاصيل الشحن</Label>
                <div className="text-sm text-muted-foreground">
                  <div>طريقة التوصيل: {selectedOrder.delivery_method}</div>
                  <div>رسوم الشحن: {formatCurrency(selectedOrder.shipping_cost)}</div>
                  <div>المبلغ الإجمالي: {formatCurrency(selectedOrder.total_amount)}</div>
                  <div>طريقة الدفع: {selectedOrder.payment_method}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    updateShippingStatus(selectedOrder.id, 'collected');
                    setUpdateDialogOpen(false);
                  }}
                  className="flex-1"
                  variant="outline"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  تم التحصيل
                </Button>
                <Button
                  onClick={() => {
                    updateShippingStatus(selectedOrder.id, 'delivered');
                    updateOrderStatus(selectedOrder.id, 'delivered');
                    setUpdateDialogOpen(false);
                  }}
                  className="flex-1"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  تم التوصيل
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShippingReport;
