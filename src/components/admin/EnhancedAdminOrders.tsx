import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOrderStatuses } from '@/hooks/useOrderStatuses';
import { toast } from 'sonner';
import { 
  Edit, 
  Search, 
  Package, 
  User, 
  Phone,
  MapPin,
  CreditCard,
  CheckCircle2,
  XCircle,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

interface Order {
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
  total_amount: number;
  profit: number;
  status: string;
  notes?: string;
  order_date: string;
  payments_received: number;
  remaining_amount: number;
}

const paymentStatusConfig = {
  'not_paid': { label: 'غير مدفوع', color: 'bg-red-100 text-red-800', icon: XCircle },
  'partial': { label: 'دفع جزئي', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
  'paid': { label: 'مدفوع بالكامل', color: 'bg-green-100 text-green-800', icon: CheckCircle2 }
};

const EnhancedAdminOrders = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { getStatusOptions, getStatusLabel, getStatusColor } = useOrderStatuses();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const statusOptions = getStatusOptions();

  // Fetch orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders-enhanced'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('admin_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('order_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching orders:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!user
  });

  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, updates }: { orderId: string; updates: Partial<Order> }) => {
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');
      
      const { error } = await supabase
        .from('admin_orders')
        .update(updates)
        .eq('id', orderId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders-enhanced'] });
      queryClient.invalidateQueries({ queryKey: ['printing-orders'] });
      toast.success('تم تحديث الطلب بنجاح');
      setShowEditDialog(false);
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      console.error('Update order error:', error);
      toast.error('حدث خطأ في تحديث الطلب');
    }
  });

  const handleStatusChange = (order: Order, newStatus: string) => {
    updateOrderMutation.mutate({
      orderId: order.id,
      updates: { status: newStatus }
    });
  };

  // Delete order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');
      
      const { error } = await supabase
        .from('admin_orders')
        .delete()
        .eq('id', orderId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders-enhanced'] });
      toast.success('تم حذف الطلب بنجاح');
    },
    onError: (error: any) => {
      console.error('Delete order error:', error);
      toast.error('حدث خطأ في حذف الطلب');
    }
  });

  const handleDeleteOrder = (orderId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
      deleteOrderMutation.mutate(orderId);
    }
  };

  const getPaymentStatus = (order: Order) => {
    if (order.payments_received >= order.total_amount) {
      return 'paid';
    } else if (order.payments_received > 0) {
      return 'partial';
    }
    return 'not_paid';
  };

  const getCostStatus = (order: Order) => {
    // Assuming order costs are tracked - this would need to be implemented
    // For now, we'll use a simple calculation based on profit
    const estimatedCost = order.total_amount - order.profit - order.shipping_cost;
    return estimatedCost > 0 ? 'pending' : 'paid';
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* العنوان والفلاتر */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 md:p-6">
          <CardTitle className={`text-center font-bold ${isMobile ? 'text-base' : 'text-xl'}`}>إدارة الطلبات</CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="البحث برقم الطلب أو اسم العميل..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="فلترة بالحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قائمة الطلبات */}
      <div className="grid gap-4">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>لا توجد طلبات تطابق البحث</p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const paymentStatus = getPaymentStatus(order);
            const PaymentIcon = paymentStatusConfig[paymentStatus].icon;
            
            return (
              <Card key={order.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-blue-100">
                        <Package className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">
                          {order.serial}
                        </h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {order.customer_name}
                        </p>
                      </div>
                    </div>
                    <div className="text-left space-y-1">
                      <p className="text-sm text-gray-500">
                        {new Date(order.order_date).toLocaleDateString('ar-EG')}
                      </p>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">إجمالي المبلغ</p>
                      <p className="font-bold text-gray-800">{formatCurrency(order.total_amount)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">الربح</p>
                      <p className="font-bold text-green-600">{formatCurrency(order.profit)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">المدفوع</p>
                      <p className="font-bold text-blue-600">{formatCurrency(order.payments_received)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">المتبقي</p>
                      <p className="font-bold text-orange-600">{formatCurrency(order.remaining_amount)}</p>
                    </div>
                  </div>

                  {/* مؤشرات الحالة */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                      {/* حالة التحصيل */}
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${paymentStatusConfig[paymentStatus].color}`}>
                        <PaymentIcon className="h-3 w-3" />
                        {paymentStatusConfig[paymentStatus].label}
                      </div>

                      {/* حالة التكلفة */}
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <DollarSign className="h-3 w-3" />
                        تكلفة معلقة
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {/* تغيير الحالة */}
                      <Select value={order.status} onValueChange={(newStatus) => handleStatusChange(order, newStatus)}>
                        <SelectTrigger className={`${isMobile ? 'w-28 text-xs' : 'w-40'}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* تحرير الطلب */}
                      <Button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowEditDialog(true);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      {/* حذف الطلب */}
                      <Button
                        onClick={() => handleDeleteOrder(order.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* معلومات إضافية */}
                  <div className="text-xs text-gray-500 space-y-1">
                    <p className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {order.customer_phone}
                    </p>
                    {order.shipping_address && (
                      <p className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {order.shipping_address}
                      </p>
                    )}
                    <p className="flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      {order.payment_method}
                    </p>
                  </div>

                  {/* الملاحظات */}
                  {order.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                          <span className="text-white text-xs">📝</span>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block mb-1">ملاحظات:</span>
                          <p className="text-xs text-gray-700 dark:text-gray-300">{order.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* دايالوج تحرير الطلب */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تحرير الطلب</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold">طلب رقم: {selectedOrder.serial}</p>
                <p className="text-sm text-gray-600">العميل: {selectedOrder.customer_name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">الحالة</label>
                <Select 
                  value={selectedOrder.status} 
                  onValueChange={(newStatus) => 
                    setSelectedOrder(prev => prev ? {...prev, status: newStatus} : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={() => selectedOrder && updateOrderMutation.mutate({
                  orderId: selectedOrder.id,
                  updates: { status: selectedOrder.status }
                })}
                disabled={updateOrderMutation.isPending}
                className="w-full"
              >
                {updateOrderMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedAdminOrders;