
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrderSync } from '@/hooks/useOrderSync';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { 
  Edit, 
  Trash2, 
  Search, 
  Calendar, 
  Package, 
  User, 
  Phone,
  MapPin,
  CreditCard,
  Truck,
  Save,
  X
} from 'lucide-react';

interface Order {
  id: string;
  serial: string;
  client_name: string;
  phone: string;
  email?: string;
  address?: string;
  governorate?: string;
  payment_method: string;
  delivery_method: string;
  shipping_cost: number;
  discount: number;
  deposit: number;
  total: number;
  profit: number;
  status: string;
  notes?: string;
  date_created: string;
}

const AdminOrders = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { syncOrders } = useOrderSync();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch orders
  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('date_created', { ascending: false });
      
      if (error) {
        console.error('Error fetching orders:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!user
  });

  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async (updatedOrder: Order) => {
      const { error } = await supabase
        .from('orders')
        .update({
          client_name: updatedOrder.client_name,
          phone: updatedOrder.phone,
          email: updatedOrder.email,
          address: updatedOrder.address,
          governorate: updatedOrder.governorate,
          payment_method: updatedOrder.payment_method,
          delivery_method: updatedOrder.delivery_method,
          shipping_cost: updatedOrder.shipping_cost,
          discount: updatedOrder.discount,
          deposit: updatedOrder.deposit,
          total: updatedOrder.total,
          status: updatedOrder.status,
          notes: updatedOrder.notes
        })
        .eq('id', updatedOrder.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      syncOrders(); // Use the sync hook instead of individual invalidations
      toast.success('تم تحديث الطلب بنجاح');
      handleCloseDialog(); // Close dialog after successful save
    },
    onError: (error: any) => {
      console.error('Error updating order:', error);
      toast.error('حدث خطأ في تحديث الطلب');
    }
  });

  // Delete order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      syncOrders();
      toast.success('تم حذف الطلب بنجاح');
    },
    onError: (error: any) => {
      console.error('Error deleting order:', error);
      toast.error('حدث خطأ في حذف الطلب');
    }
  });

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setIsEditDialogOpen(true);
  };

  const handleSaveOrder = () => {
    if (editingOrder) {
      updateOrderMutation.mutate(editingOrder);
    }
  };

  const handleCloseDialog = () => {
    setIsEditDialogOpen(false);
    setEditingOrder(null);
  };

  const handleDeleteOrder = (orderId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
      deleteOrderMutation.mutate(orderId);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'shipped': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const statusTexts = {
      'pending': 'في الانتظار',
      'confirmed': 'مؤكد',
      'shipped': 'تم الشحن',
      'delivered': 'تم التسليم',
      'cancelled': 'ملغي'
    };
    return statusTexts[status as keyof typeof statusTexts] || status;
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
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            إدارة الطلبات
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div className="space-y-2">
              <Label>البحث</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="البحث برقم الطلب أو اسم العميل أو رقم الهاتف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>حالة الطلب</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">في الانتظار</SelectItem>
                  <SelectItem value="confirmed">مؤكد</SelectItem>
                  <SelectItem value="shipped">تم الشحن</SelectItem>
                  <SelectItem value="delivered">تم التسليم</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="grid gap-4">
        {filteredOrders.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-4">
              <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-12'}`}>
                {/* Order Info */}
                <div className={`${isMobile ? 'col-span-1' : 'col-span-8'} space-y-3`}>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="outline" className="font-mono">
                      {order.serial}
                    </Badge>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(order.date_created).toLocaleDateString('ar-EG')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>{order.client_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{order.phone}</span>
                    </div>
                    {order.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="truncate">{order.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-500" />
                      <span>{order.payment_method}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-gray-500" />
                      <span>{order.delivery_method}</span>
                    </div>
                  </div>
                </div>

                {/* Financial Info */}
                <div className={`${isMobile ? 'col-span-1' : 'col-span-2'} space-y-2`}>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">الإجمالي</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(order.total)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">الربح</p>
                    <p className="text-sm font-semibold text-blue-600">
                      {formatCurrency(order.profit)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className={`${isMobile ? 'col-span-1' : 'col-span-2'} flex gap-2`}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditOrder(order)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 ml-1" />
                    تعديل
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteOrder(order.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredOrders.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">لا توجد طلبات تطابق معايير البحث</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Order Dialog */}
      <Dialog 
        open={isEditDialogOpen} 
        onOpenChange={(open) => {
          // منع إغلاق النافذة إذا كان هناك تحديث جاري
          if (!open && updateOrderMutation.isPending) {
            return;
          }
          if (!open) {
            handleCloseDialog();
          }
        }}
      >
        <DialogContent 
          className="max-w-2xl max-h-[90vh] overflow-y-auto" 
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>تعديل الطلب {editingOrder?.serial}</DialogTitle>
          </DialogHeader>
          
          {editingOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم العميل</Label>
                  <Input
                    value={editingOrder.client_name}
                    onChange={(e) => setEditingOrder({
                      ...editingOrder,
                      client_name: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>رقم الهاتف</Label>
                  <Input
                    value={editingOrder.phone}
                    onChange={(e) => setEditingOrder({
                      ...editingOrder,
                      phone: e.target.value
                    })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input
                  type="email"
                  value={editingOrder.email || ''}
                  onChange={(e) => setEditingOrder({
                    ...editingOrder,
                    email: e.target.value
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label>العنوان</Label>
                <Textarea
                  value={editingOrder.address || ''}
                  onChange={(e) => setEditingOrder({
                    ...editingOrder,
                    address: e.target.value
                  })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>المحافظة</Label>
                  <Input
                    value={editingOrder.governorate || ''}
                    onChange={(e) => setEditingOrder({
                      ...editingOrder,
                      governorate: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>حالة الطلب</Label>
                  <Select
                    value={editingOrder.status}
                    onValueChange={(value) => setEditingOrder({
                      ...editingOrder,
                      status: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">في الانتظار</SelectItem>
                      <SelectItem value="confirmed">مؤكد</SelectItem>
                      <SelectItem value="shipped">تم الشحن</SelectItem>
                      <SelectItem value="delivered">تم التسليم</SelectItem>
                      <SelectItem value="cancelled">ملغي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>تكلفة الشحن</Label>
                  <Input
                    type="number"
                    value={editingOrder.shipping_cost}
                    onChange={(e) => setEditingOrder({
                      ...editingOrder,
                      shipping_cost: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الخصم</Label>
                  <Input
                    type="number"
                    value={editingOrder.discount}
                    onChange={(e) => setEditingOrder({
                      ...editingOrder,
                      discount: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>العربون</Label>
                  <Input
                    type="number"
                    value={editingOrder.deposit}
                    onChange={(e) => setEditingOrder({
                      ...editingOrder,
                      deposit: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Textarea
                  value={editingOrder.notes || ''}
                  onChange={(e) => setEditingOrder({
                    ...editingOrder,
                    notes: e.target.value
                  })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  onClick={handleSaveOrder}
                  disabled={updateOrderMutation.isPending}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 ml-2" />
                  {updateOrderMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCloseDialog}
                  className="flex-1"
                >
                  <X className="h-4 w-4 ml-2" />
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
