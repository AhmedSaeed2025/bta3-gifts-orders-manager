import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Package, Truck, CheckCircle, Clock, Phone, Mail, MapPin, Loader2, ArrowLeft } from 'lucide-react';
import { ORDER_STATUS_LABELS } from '@/types';

const OrderTrackingPage = () => {
  const navigate = useNavigate();
  const params = useParams<{ serial?: string }>();
  const [serial, setSerial] = useState(params.serial || '');
  const [searchSerial, setSearchSerial] = useState(params.serial || '');

  useEffect(() => {
    if (params.serial) {
      setSerial(params.serial);
      setSearchSerial(params.serial);
    }
  }, [params.serial]);

  const isToken = (v: string) => v.toLowerCase().startsWith('trk_');

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order-tracking', searchSerial],
    queryFn: async () => {
      if (!searchSerial) return null;
      const q = searchSerial.trim();

      // Public, privacy-safe lookup (works for guests via QR link or serial)
      const { data, error } = await supabase.rpc('track_order', { _token: q });
      if (error) throw error;
      if (!data) return null;

      const o = data as any;
      return {
        serial: o.serial,
        customer_name: o.customer_name,
        shipping_address: null,
        governorate: o.governorate,
        payment_method: o.payment_method,
        delivery_method: o.delivery_method,
        total_amount: Number(o.total_amount ?? 0),
        deposit: Number(o.deposit ?? 0),
        paid_amount: Number(o.paid_amount ?? 0),
        remaining_amount: Number(o.remaining_amount ?? 0),
        status: o.status,
        order_date: o.order_date,
        estimated_delivery_date: o.estimated_delivery_date,
        items: o.items || [],
      };
    },
    enabled: !!searchSerial
  });

  const handleSearch = () => {
    if (serial.trim()) {
      setSearchSerial(serial.trim());
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(n || 0));

  const getStatusInfo = (status: string) => {
    const map: Record<string, { label: string; color: string; icon: any }> = {
      pending: { label: ORDER_STATUS_LABELS.pending, color: 'bg-yellow-500', icon: Clock },
      confirmed: { label: ORDER_STATUS_LABELS.confirmed, color: 'bg-blue-500', icon: Package },
      processing: { label: ORDER_STATUS_LABELS.processing, color: 'bg-orange-500', icon: Package },
      sentToPrinter: { label: ORDER_STATUS_LABELS.sentToPrinter, color: 'bg-indigo-500', icon: Package },
      readyForDelivery: { label: ORDER_STATUS_LABELS.readyForDelivery, color: 'bg-teal-500', icon: Package },
      shipped: { label: ORDER_STATUS_LABELS.shipped, color: 'bg-purple-500', icon: Truck },
      delivered: { label: ORDER_STATUS_LABELS.delivered, color: 'bg-green-500', icon: CheckCircle },
      cancelled: { label: ORDER_STATUS_LABELS.cancelled, color: 'bg-red-500', icon: Clock },
    };
    return map[status] || { label: status || 'غير معروف', color: 'bg-gray-500', icon: Clock };
  };

  const getOrderSteps = (currentStatus: string) => {
    const steps = [
      { key: 'pending', label: 'تم استلام الطلب', description: 'تم تسجيل طلبكم بنجاح' },
      { key: 'confirmed', label: 'تم تأكيد الطلب', description: 'تم مراجعة وتأكيد طلبكم' },
      { key: 'processing', label: 'قيد التحضير', description: 'جاري تحضير طلبكم' },
      { key: 'sentToPrinter', label: 'تم الإرسال للمطبعة', description: 'جاري تنفيذ التصنيع/الطباعة' },
      { key: 'readyForDelivery', label: 'تحت التسليم', description: 'الطلب جاهز للتسليم' },
      { key: 'shipped', label: 'تم الشحن', description: 'تم شحن طلبكم وهو في الطريق إليكم' },
      { key: 'delivered', label: 'تم التوصيل', description: 'تم توصيل طلبكم بنجاح' }
    ];

    const statusOrder = steps.map((s) => s.key);
    const currentIndex = statusOrder.indexOf(currentStatus);

    return steps.map((step, index) => ({
      ...step,
      completed: currentIndex >= 0 && index <= currentIndex,
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
                          <span className="font-medium font-mono" dir="ltr">
                            {new Date(order.order_date).toLocaleDateString('en-GB')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">إجمالي الطلب:</span>
                          <span className="font-medium font-mono tabular-nums">{fmt(order.total_amount)} جنيه</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">العربون / المدفوع:</span>
                          <span className="font-medium font-mono tabular-nums text-green-600">
                            {fmt(order.paid_amount || order.deposit)} جنيه
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-3">
                          <span className="text-gray-600 font-semibold">المتبقي:</span>
                          <span className="font-bold font-mono tabular-nums text-orange-600">
                            {fmt(order.remaining_amount)} جنيه
                          </span>
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
                        {order.governorate && (
                          <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{order.governorate}</span>
                          </div>
                        )}
                        {order.estimated_delivery_date && (
                          <div className="flex items-center gap-3">
                            <Truck className="h-4 w-4 text-gray-400" />
                            <span>التسليم المتوقع: {new Date(order.estimated_delivery_date).toLocaleDateString('ar-EG')}</span>
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
