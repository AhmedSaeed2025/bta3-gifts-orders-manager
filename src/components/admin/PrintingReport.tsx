import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  Package,
  CheckCircle,
  Clock,
  DollarSign,
  Hash,
  User
} from 'lucide-react';

interface PrintingOrder {
  id: string;
  serial: string;
  customer_name: string;
  total_amount: number;
  order_date: string;
  status: string;
  items: Array<{
    id: string;
    product_name: string;
    product_size: string;
    quantity: number;
    unit_cost: number;
    total_price: number;
  }>;
}

const PrintingReport = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch orders sent to printing
  const { data: printingOrders = [], isLoading } = useQuery({
    queryKey: ['printing-orders'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: orders, error } = await supabase
        .from('admin_orders')
        .select(`
          id,
          serial,
          customer_name,
          total_amount,
          order_date,
          status,
          admin_order_items (
            id,
            product_name,
            product_size,
            quantity,
            unit_cost,
            total_price
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'sent_to_printing')
        .order('order_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching printing orders:', error);
        return [];
      }
      
      return orders?.map(order => ({
        ...order,
        items: order.admin_order_items || []
      })) || [];
    },
    enabled: !!user
  });

  // Mark order as received from printing
  const markReceivedMutation = useMutation({
    mutationFn: async (orderId: string) => {
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');
      
      const { error } = await supabase
        .from('admin_orders')
        .update({ status: 'printing_received' })
        .eq('id', orderId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printing-orders'] });
      toast.success('تم تحديث حالة الطلب بنجاح');
    },
    onError: (error: any) => {
      console.error('Update order status error:', error);
      toast.error('حدث خطأ في تحديث حالة الطلب');
    }
  });

  const handleMarkReceived = (orderId: string) => {
    markReceivedMutation.mutate(orderId);
  };

  const totalOrders = printingOrders.length;
  const totalCost = printingOrders.reduce((sum, order) => 
    sum + order.items.reduce((itemSum, item) => itemSum + (item.unit_cost * item.quantity), 0), 0
  );
  const totalItems = printingOrders.reduce((sum, order) => 
    sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );

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
      {/* العنوان */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
          <CardTitle className="text-center text-xl font-bold">تقرير المطبعة</CardTitle>
        </CardHeader>
      </Card>

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-sm text-blue-700 mb-1">عدد الطلبات</p>
            <p className="text-lg font-bold text-blue-800">{totalOrders}</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Hash className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm text-green-700 mb-1">إجمالي القطع</p>
            <p className="text-lg font-bold text-green-800">{totalItems}</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-sm text-purple-700 mb-1">إجمالي التكلفة</p>
            <p className="text-lg font-bold text-purple-800">{formatCurrency(totalCost)}</p>
          </CardContent>
        </Card>
      </div>

      {/* قائمة الطلبات */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">الطلبات المرسلة للمطبعة</CardTitle>
        </CardHeader>
        <CardContent>
          {printingOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>لا توجد طلبات مرسلة للمطبعة حالياً</p>
            </div>
          ) : (
            <div className="space-y-4">
              {printingOrders.map((order) => (
                <Card key={order.id} className="border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-orange-100">
                          <Clock className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            طلب رقم: {order.serial}
                          </h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {order.customer_name}
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-gray-500">
                          {new Date(order.order_date).toLocaleDateString('ar-EG')}
                        </p>
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          في المطبعة
                        </Badge>
                      </div>
                    </div>

                    {/* تفاصيل المنتجات */}
                    <div className="space-y-2 mb-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">
                              {item.product_name} - {item.product_size}
                            </p>
                            <p className="text-sm text-gray-600">
                              الكمية: {item.quantity} | التكلفة: {formatCurrency(item.unit_cost)}
                            </p>
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-gray-800">
                              {formatCurrency(item.unit_cost * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* إجمالي الطلب وزر الاستلام */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div>
                        <p className="text-sm text-gray-600">إجمالي التكلفة</p>
                        <p className="font-bold text-lg text-gray-800">
                          {formatCurrency(
                            order.items.reduce((sum, item) => sum + (item.unit_cost * item.quantity), 0)
                          )}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleMarkReceived(order.id)}
                        disabled={markReceivedMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 ml-2" />
                        {markReceivedMutation.isPending ? 'جاري التحديث...' : 'تم الاستلام'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PrintingReport;