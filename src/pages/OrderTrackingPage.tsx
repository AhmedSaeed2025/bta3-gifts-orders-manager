
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Package, Truck, CheckCircle, Clock, Phone, Mail, MapPin, Loader2, ArrowLeft } from 'lucide-react';

const OrderTrackingPage = () => {
  const navigate = useNavigate();
  const [serial, setSerial] = useState('');
  const [searchSerial, setSearchSerial] = useState('');

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order-tracking', searchSerial],
    queryFn: async () => {
      if (!searchSerial) return null;
      
      // First try to find in admin_orders table
      const { data: adminOrder, error: adminError } = await supabase
        .from('admin_orders')
        .select('*')
        .eq('serial', searchSerial.toUpperCase())
        .maybeSingle();

      if (adminOrder) {
        return {
          serial: adminOrder.serial,
          customer_name: adminOrder.customer_name,
          customer_phone: adminOrder.customer_phone,
          customer_email: adminOrder.customer_email,
          shipping_address: adminOrder.shipping_address,
          governorate: adminOrder.governorate,
          payment_method: adminOrder.payment_method,
          delivery_method: adminOrder.delivery_method,
          total_amount: adminOrder.total_amount,
          status: adminOrder.status,
          order_date: adminOrder.order_date,
          shipping_cost: adminOrder.shipping_cost
        };
      }

      // If not found in admin_orders, try orders table
      const { data: regularOrder, error: regularError } = await supabase
        .from('orders')
        .select('*')
        .eq('serial', searchSerial.toUpperCase())
        .maybeSingle();

      if (regularOrder) {
        return {
          serial: regularOrder.serial,
          customer_name: regularOrder.client_name,
          customer_phone: regularOrder.phone,
          customer_email: regularOrder.email,
          shipping_address: regularOrder.address,
          governorate: regularOrder.governorate,
          payment_method: regularOrder.payment_method,
          delivery_method: regularOrder.delivery_method,
          total_amount: regularOrder.total,
          status: regularOrder.status,
          order_date: regularOrder.date_created,
          shipping_cost: regularOrder.shipping_cost
        };
      }

      // If not found in either table
      if (adminError && adminError.code !== 'PGRST116') {
        throw adminError;
      }
      if (regularError && regularError.code !== 'PGRST116') {
        throw regularError;
      }

      return null;
    },
    enabled: !!searchSerial
  });

  const handleSearch = () => {
    if (serial.trim()) {
      setSearchSerial(serial.trim());
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'قيد المراجعة', color: 'bg-yellow-500', icon: Clock };
      case 'confirmed':
        return { label: 'تم التأكيد', color: 'bg-blue-500', icon: Package };
      case 'processing':
        return { label: 'قيد التحضير', color: 'bg-orange-500', icon: Package };
      case 'shipped':
        return { label: 'تم الشحن', color: 'bg-purple-500', icon: Truck };
      case 'delivered':
        return { label: 'تم التوصيل', color: 'bg-green-500', icon: CheckCircle };
      case 'cancelled':
        return { label: 'ملغي', color: 'bg-red-500', icon: Clock };
      default:
        return { label: 'غير معروف', color: 'bg-gray-500', icon: Clock };
    }
  };

  const getOrderSteps = (currentStatus: string) => {
    const steps = [
      { key: 'pending', label: 'تم استلام الطلب', description: 'تم تسجيل طلبكم بنجاح' },
      { key: 'confirmed', label: 'تم تأكيد الطلب', description: 'تم مراجعة وتأكيد طلبكم' },
      { key: 'processing', label: 'قيد التحضير', description: 'جاري تحضير طلبكم للشحن' },
      { key: 'shipped', label: 'تم الشحن', description: 'تم شحن طلبكم وهو في الطريق إليكم' },
      { key: 'delivered', label: 'تم التوصيل', description: 'تم توصيل طلبكم بنجاح' }
    ];

    const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <Search className="h-6 w-6" />
                تتبع الطلب
              </CardTitle>
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                العودة للخلف
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search Form */}
            <div className="flex gap-3 mb-8">
              <Input
                placeholder="أدخل رقم الطلب (مثال: INV-2501-0001)"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={!serial.trim() || isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                بحث
              </Button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-center py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h3 className="font-semibold text-red-800 mb-2">خطأ في البحث</h3>
                  <p className="text-red-600">حدث خطأ أثناء البحث عن الطلب. يرجى المحاولة مرة أخرى.</p>
                </div>
              </div>
            )}

            {/* No Order Found */}
            {searchSerial && !order && !isLoading && !error && (
              <div className="text-center py-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <Package className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-yellow-800 mb-2">لم يتم العثور على الطلب</h3>
                  <p className="text-yellow-600">رقم الطلب "{searchSerial}" غير موجود. تأكد من صحة الرقم وحاول مرة أخرى.</p>
                </div>
              </div>
            )}

            {/* Order Details */}
            {order && (
              <div className="space-y-8">
                {/* Order Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4">معلومات الطلب</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">رقم الطلب:</span>
                          <span className="font-medium">{order.serial}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">تاريخ الطلب:</span>
                          <span className="font-medium">
                            {new Date(order.order_date).toLocaleDateString('ar-EG')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">إجمالي المبلغ:</span>
                          <span className="font-medium">{order.total_amount} جنيه</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">الحالة:</span>
                          <Badge className={getStatusInfo(order.status).color}>
                            {getStatusInfo(order.status).label}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4">معلومات العميل</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{order.customer_name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{order.customer_phone}</span>
                        </div>
                        {order.customer_email && (
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span>{order.customer_email}</span>
                          </div>
                        )}
                        {order.shipping_address && (
                          <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{order.shipping_address}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Order Timeline */}
                {order.status !== 'cancelled' && (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-6">تتبع مراحل الطلب</h3>
                      <div className="space-y-6">
                        {getOrderSteps(order.status).map((step, index) => {
                          const Icon = getStatusInfo(step.key).icon;
                          return (
                            <div key={step.key} className="flex items-start gap-4">
                              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                step.completed 
                                  ? step.current 
                                    ? getStatusInfo(step.key).color + ' text-white'
                                    : 'bg-green-500 text-white'
                                  : 'bg-gray-200 text-gray-400'
                              }`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <h4 className={`font-medium ${step.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                                  {step.label}
                                </h4>
                                <p className={`text-sm ${step.completed ? 'text-gray-600' : 'text-gray-400'}`}>
                                  {step.description}
                                </p>
                                {step.current && (
                                  <p className="text-sm text-blue-600 mt-1">المرحلة الحالية</p>
                                )}
                              </div>
                              {step.completed && !step.current && (
                                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Cancelled Order */}
                {order.status === 'cancelled' && (
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center py-6">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                          <Package className="h-12 w-12 text-red-600 mx-auto mb-4" />
                          <h3 className="font-semibold text-red-800 mb-2">تم إلغاء الطلب</h3>
                          <p className="text-red-600">تم إلغاء هذا الطلب. للاستفسار يرجى التواصل معنا.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Instructions */}
            {!searchSerial && (
              <div className="text-center py-8">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">تتبع طلبك</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  أدخل رقم الطلب في الحقل أعلاه لتتبع حالة طلبك ومعرفة المرحلة التي وصل إليها
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
