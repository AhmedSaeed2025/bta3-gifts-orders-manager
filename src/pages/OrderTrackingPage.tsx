
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { Search, Package, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import { ORDER_STATUS_LABELS } from '@/types';
import Logo from '@/components/Logo';

const OrderTrackingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'serial' | 'phone'>('serial');

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['track-orders', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];

      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `);

      if (searchType === 'serial') {
        query = query.eq('serial', searchQuery.trim());
      } else {
        query = query.eq('phone', searchQuery.trim());
      }

      const { data, error } = await query.order('date_created', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }

      return data || [];
    },
    enabled: false // Only run when user searches
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      refetch();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <Package className="h-4 w-4" />;
      case 'processing':
        return <Package className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Search className="h-6 w-6" />
              تتبع الطلبات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search Form */}
            <div className="space-y-4">
              <div className="flex gap-4 justify-center">
                <Button
                  variant={searchType === 'serial' ? 'default' : 'outline'}
                  onClick={() => setSearchType('serial')}
                  size="sm"
                >
                  بحث برقم الطلب
                </Button>
                <Button
                  variant={searchType === 'phone' ? 'default' : 'outline'}
                  onClick={() => setSearchType('phone')}
                  size="sm"
                >
                  بحث برقم الهاتف
                </Button>
              </div>

              <div className="flex gap-2 max-w-md mx-auto">
                <Input
                  placeholder={searchType === 'serial' ? "أدخل رقم الطلب (مثل: INV-2401-0001)" : "أدخل رقم الهاتف"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isLoading}>
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Results */}
            {orders && orders.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-center">
                  {searchType === 'phone' 
                    ? `الطلبات المرتبطة برقم الهاتف: ${searchQuery}`
                    : 'تفاصيل الطلب'
                  }
                </h3>
                
                {orders.map((order) => (
                  <Card key={order.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-semibold text-lg mb-2">معلومات الطلب</h4>
                          <div className="space-y-2 text-sm">
                            <p><strong>رقم الطلب:</strong> {order.serial}</p>
                            <p><strong>اسم العميل:</strong> {order.client_name}</p>
                            <p><strong>رقم الهاتف:</strong> {order.phone}</p>
                            <p><strong>تاريخ الطلب:</strong> {new Date(order.date_created).toLocaleDateString('ar-EG')}</p>
                            <p><strong>طريقة الدفع:</strong> {order.payment_method}</p>
                            <p><strong>طريقة الاستلام:</strong> {order.delivery_method}</p>
                            {order.address && (
                              <p><strong>العنوان:</strong> {order.address}, {order.governorate}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-lg mb-2">حالة الطلب</h4>
                          <div className="flex flex-col items-start gap-3">
                            <Badge className={`${getStatusColor(order.status)} flex items-center gap-2 px-3 py-2`}>
                              {getStatusIcon(order.status)}
                              {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status}
                            </Badge>
                            
                            <div className="text-sm text-muted-foreground">
                              <p><strong>آخر تحديث:</strong> {new Date(order.updated_at).toLocaleDateString('ar-EG')}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-3">تفاصيل المنتجات</h4>
                        <div className="space-y-2">
                          {order.order_items.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                              <div>
                                <span className="font-medium">{item.product_type}</span>
                                <span className="text-sm text-gray-600 mr-2">({item.size})</span>
                              </div>
                              <div className="text-left">
                                <div className="font-medium">{formatCurrency(item.price * item.quantity)}</div>
                                <div className="text-sm text-gray-600">الكمية: {item.quantity}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div className="border-t pt-4 mt-4">
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>المجموع الكلي:</span>
                          <span>{formatCurrency(order.total)}</span>
                        </div>
                        {order.shipping_cost > 0 && (
                          <div className="flex justify-between items-center text-sm text-gray-600">
                            <span>مصاريف الشحن:</span>
                            <span>{formatCurrency(order.shipping_cost)}</span>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {order.notes && (
                        <div className="border-t pt-4 mt-4">
                          <h4 className="font-semibold mb-2">ملاحظات</h4>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{order.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {orders && orders.length === 0 && searchQuery && !isLoading && (
              <div className="text-center py-8">
                <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">لم يتم العثور على طلبات</h3>
                <p className="text-gray-500">
                  {searchType === 'serial' 
                    ? 'تأكد من صحة رقم الطلب المدخل'
                    : 'لا توجد طلبات مرتبطة برقم الهاتف المدخل'
                  }
                </p>
              </div>
            )}

            {!searchQuery && (
              <div className="text-center py-8">
                <Search className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">ابحث عن طلباتك</h3>
                <p className="text-gray-500">
                  يمكنك البحث باستخدام رقم الطلب أو رقم الهاتف المسجل
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderTrackingPage;
