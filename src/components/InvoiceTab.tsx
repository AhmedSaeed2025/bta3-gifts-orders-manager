
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Eye, Loader2 } from 'lucide-react';
import AdminOrderInvoice from '@/components/admin/AdminOrderInvoice';
import { formatCurrency } from '@/lib/utils';

const InvoiceTab = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Fetch admin orders with proper error handling
  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['admin-orders-invoice'],
    queryFn: async () => {
      if (!user) {
        console.log('No user found for invoice tab');
        return [];
      }
      
      console.log('Fetching orders for invoice tab, user:', user.id);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('user_id', user.id)
        .order('date_created', { ascending: false });
      
      if (error) {
        console.error('Error fetching orders for invoice tab:', error);
        throw error;
      }
      
      console.log('Fetched orders for invoice tab:', data);
      return data || [];
    },
    enabled: !!user,
    retry: 3,
    retryDelay: 1000
  });

  // Filter orders based on search term
  const filteredOrders = orders.filter(order => 
    order.serial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.phone?.includes(searchTerm)
  );

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'confirmed': return 'مؤكد';
      case 'processing': return 'قيد التجهيز';
      case 'shipped': return 'تم الشحن';
      case 'delivered': return 'تم التوصيل';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500 text-white';
      case 'confirmed': return 'bg-blue-500 text-white';
      case 'processing': return 'bg-purple-500 text-white';
      case 'shipped': return 'bg-green-500 text-white';
      case 'delivered': return 'bg-emerald-500 text-white';
      case 'cancelled': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (selectedOrder) {
    return (
      <AdminOrderInvoice 
        order={selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
      />
    );
  }

  if (error) {
    console.error('Invoice tab query error:', error);
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-red-500">
            <p>حدث خطأ في تحميل الطلبات</p>
            <p className="text-sm mt-2">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            الفواتير
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <Label htmlFor="search">البحث في الطلبات</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="search"
                type="text"
                placeholder="ابحث برقم الطلب، اسم العميل، أو رقم الهاتف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Orders List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="mr-2">جاري تحميل الطلبات...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'لا توجد طلبات تطابق البحث' : 'لا توجد طلبات'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{order.serial}</h3>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                         <div>
                           <span className="text-gray-500">العميل:</span>
                           <p className="font-medium">{order.client_name}</p>
                         </div>
                         <div>
                           <span className="text-gray-500">الهاتف:</span>
                           <p className="font-medium">{order.phone}</p>
                         </div>
                        <div>
                           <span className="text-gray-500">التاريخ:</span>
                           <p className="font-medium">
                             {new Date(order.date_created).toLocaleDateString('ar-EG')}
                           </p>
                        </div>
                         <div>
                           <span className="text-gray-500">المبلغ الإجمالي:</span>
                           <p className="font-bold text-green-600">
                             {formatCurrency(order.total)}
                           </p>
                         </div>
                      </div>

                      {order.notes && (
                        <div className="mt-2">
                          <span className="text-gray-500 text-sm">الملاحظات:</span>
                          <p className="text-sm bg-gray-100 p-2 rounded mt-1">{order.notes}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 mr-4">
                      <Button
                        onClick={() => setSelectedOrder(order)}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        عرض الفاتورة
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceTab;
