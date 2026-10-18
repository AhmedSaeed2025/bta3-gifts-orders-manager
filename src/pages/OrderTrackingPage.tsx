import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Package, Truck, CheckCircle, Clock, Phone, MapPin, Loader2, ArrowLeft, Wallet, CalendarClock } from 'lucide-react';
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
        status_history: (o.status_history || []) as { status: string; changed_at: string }[],
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

  const getOrderSteps = (currentStatus: string, history: { status: string; changed_at: string }[] = []) => {
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

    // Latest timestamp recorded for each status
    const timeByStatus: Record<string, string> = {};
    history.forEach((h) => { timeByStatus[h.status] = h.changed_at; });

    return steps.map((step, index) => ({
      ...step,
      completed: currentIndex >= 0 && index <= currentIndex,
      current: index === currentIndex,
      timestamp: timeByStatus[step.key] || null
    }));
  };

  const fmtDateTime = (iso: string) => {
    const d = new Date(iso);
    const date = d.toLocaleDateString('en-GB');
    const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return `${date} - ${time}`;
  };

  const InfoRow = ({ label, value, valueClass = '' }: { label: string; value: React.ReactNode; valueClass?: string }) => (
    <div className="flex justify-between items-center gap-3">
      <span className="text-muted-foreground text-sm shrink-0">{label}</span>
      <span className={`font-medium text-left ${valueClass}`}>{value}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl">
                <Search className="h-5 w-5 sm:h-6 sm:w-6" />
                تتبع الطلب
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">العودة للخلف</span>
                <span className="sm:hidden">رجوع</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            {/* Search Form */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6 sm:mb-8">
              <Input
                placeholder="أدخل رقم الطلب (مثال: INV-2501-0001)"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
                dir="ltr"
              />
              <Button onClick={handleSearch} disabled={!serial.trim() || isLoading} className="w-full sm:w-auto">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                بحث
              </Button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-center py-6 sm:py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
                  <h3 className="font-semibold text-red-800 mb-2">خطأ في البحث</h3>
                  <p className="text-red-600 text-sm">حدث خطأ أثناء البحث عن الطلب. يرجى المحاولة مرة أخرى.</p>
                </div>
              </div>
            )}

            {/* No Order Found */}
            {searchSerial && !order && !isLoading && !error && (
              <div className="text-center py-6 sm:py-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6">
                  <Package className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-yellow-800 mb-2">لم يتم العثور على الطلب</h3>
                  <p className="text-yellow-600 text-sm">رقم الطلب "{searchSerial}" غير موجود. تأكد من صحة الرقم وحاول مرة أخرى.</p>
                </div>
              </div>
            )}

            {/* Order Details */}
            {order && (
              <div className="space-y-4 sm:space-y-8">
                {/* Status banner - prominent on all devices */}
                <div className={`rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-white ${getStatusInfo(order.status).color}`}>
                  <div className="flex items-center gap-3">
                    {React.createElement(getStatusInfo(order.status).icon, { className: 'h-7 w-7 sm:h-8 sm:w-8' })}
                    <div className="text-center sm:text-right">
                      <p className="text-xs sm:text-sm opacity-90">حالة الطلب الحالية</p>
                      <p className="text-lg sm:text-2xl font-bold">{getStatusInfo(order.status).label}</p>
                    </div>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-xs opacity-90">رقم الطلب</p>
                    <p className="font-mono font-bold text-sm sm:text-base" dir="ltr">{order.serial}</p>
                  </div>
                </div>

                {/* Order Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-primary" />
                        معلومات الطلب
                      </h3>
                      <div className="space-y-3">
                        <InfoRow label="رقم الطلب:" value={<span className="font-mono" dir="ltr">{order.serial}</span>} />
                        <InfoRow
                          label="تاريخ الطلب:"
                          value={<span className="font-mono" dir="ltr">{new Date(order.order_date).toLocaleDateString('en-GB')}</span>}
                        />
                        <InfoRow
                          label="إجمالي الطلب:"
                          value={<span className="font-mono tabular-nums">{fmt(order.total_amount)} جنيه</span>}
                        />
                        <InfoRow
                          label="العربون / المدفوع:"
                          value={<span className="font-mono tabular-nums text-green-600">{fmt(order.paid_amount || order.deposit)} جنيه</span>}
                          valueClass="text-green-600"
                        />
                        <div className="flex justify-between items-center gap-3 border-t pt-3">
                          <span className="text-muted-foreground text-sm font-semibold shrink-0">المتبقي:</span>
                          <span className="font-bold font-mono tabular-nums text-orange-600">
                            {fmt(order.remaining_amount)} جنيه
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        معلومات العميل
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium">{order.customer_name}</span>
                        </div>
                        {order.governorate && (
                          <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>{order.governorate}</span>
                          </div>
                        )}
                        {order.delivery_method && (
                          <div className="flex items-center gap-3">
                            <Truck className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>{order.delivery_method}</span>
                          </div>
                        )}
                        {order.estimated_delivery_date && (
                          <div className="flex items-center gap-3">
                            <CalendarClock className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>
                              التسليم المتوقع:{' '}
                              <span className="font-mono" dir="ltr">
                                {new Date(order.estimated_delivery_date).toLocaleDateString('en-GB')}
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Order Items */}
                {order.items && order.items.length > 0 && (
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" />
                        محتويات الطلب
                      </h3>
                      <div className="divide-y">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="py-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium truncate">{item.product_type || item.product_name || item.name || 'منتج'}</p>
                              {item.size && (
                                <p className="text-xs text-muted-foreground">المقاس: {item.size}</p>
                              )}
                            </div>
                            <span className="font-mono tabular-nums font-semibold shrink-0" dir="ltr">
                              × {item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Order Timeline */}
                {order.status !== 'cancelled' && (
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <h3 className="font-semibold mb-6">تتبع مراحل الطلب</h3>
                      <div className="relative">
                        {getOrderSteps(order.status, order.status_history).map((step, index, arr) => {
                          const Icon = getStatusInfo(step.key).icon;
                          const isLast = index === arr.length - 1;
                          return (
                            <div key={step.key} className="flex items-start gap-3 sm:gap-4 relative">
                              {/* Icon + connector line */}
                              <div className="flex flex-col items-center flex-shrink-0">
                                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center z-10 ${
                                  step.completed
                                    ? step.current
                                      ? getStatusInfo(step.key).color + ' text-white ring-4 ring-primary/20'
                                      : 'bg-green-500 text-white'
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                {!isLast && (
                                  <div className={`w-0.5 flex-1 min-h-[2.5rem] sm:min-h-[3rem] ${step.completed && !step.current ? 'bg-green-500' : 'bg-muted'}`} />
                                )}
                              </div>
                              {/* Content */}
                              <div className={`flex-1 min-w-0 ${isLast ? '' : 'pb-5 sm:pb-6'}`}>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <h4 className={`font-medium text-sm sm:text-base ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                                      {step.label}
                                    </h4>
                                    <p className={`text-xs sm:text-sm ${step.completed ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                                      {step.description}
                                    </p>
                                    {step.timestamp && (
                                      <p className="text-xs font-mono tabular-nums text-muted-foreground mt-1 flex items-center gap-1" dir="ltr">
                                        <Clock className="h-3 w-3" />
                                        {fmtDateTime(step.timestamp)}
                                      </p>
                                    )}
                                    {step.current && (
                                      <Badge variant="secondary" className="mt-1.5 text-xs">المرحلة الحالية</Badge>
                                    )}
                                  </div>
                                  {step.completed && !step.current && (
                                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                  )}
                                </div>
                              </div>
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
                    <CardContent className="p-4 sm:p-6">
                      <div className="text-center py-4 sm:py-6">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
                          <Package className="h-10 w-10 sm:h-12 sm:w-12 text-red-600 mx-auto mb-4" />
                          <h3 className="font-semibold text-red-800 mb-2">تم إلغاء الطلب</h3>
                          <p className="text-red-600 text-sm">تم إلغاء هذا الطلب. للاستفسار يرجى التواصل معنا.</p>
                          {order.status_history?.find((h) => h.status === 'cancelled') && (
                            <p className="text-xs font-mono tabular-nums text-red-500 mt-2" dir="ltr">
                              {fmtDateTime(order.status_history.find((h) => h.status === 'cancelled')!.changed_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Instructions */}
            {!searchSerial && (
              <div className="text-center py-6 sm:py-8">
                <Package className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-muted-foreground mb-2">تتبع طلبك</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto px-2">
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
