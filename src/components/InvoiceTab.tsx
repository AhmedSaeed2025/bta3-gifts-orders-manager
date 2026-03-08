
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, FileText, Eye, Loader2, ClipboardList, User, Phone, CalendarDays, Banknote } from 'lucide-react';
import InvoiceTemplateSelector from '@/components/invoice/InvoiceTemplateSelector';
import { formatCurrency } from '@/lib/utils';

const InvoiceTab = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings-invoice'],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('store_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();
      return data;
    },
    enabled: !!user
  });

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['admin-orders-invoice'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items (*)`)
        .eq('user_id', user.id)
        .order('date_created', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    retry: 3,
    retryDelay: 1000
  });

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = !searchTerm ||
        order.serial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.phone?.includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const orderDate = new Date(order.date_created);
      const matchesDateFrom = !dateFrom || orderDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || orderDate <= new Date(dateTo + 'T23:59:59');
      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  }, [orders, searchTerm, statusFilter, dateFrom, dateTo]);

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: 'في الانتظار', confirmed: 'مؤكد', processing: 'قيد التجهيز',
      shipped: 'تم الشحن', delivered: 'تم التوصيل', cancelled: 'ملغي',
      sentToPrinter: 'في المطبعة', sent_to_printing: 'في المطبعة',
      readyForDelivery: 'جاهز للتسليم',
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      processing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      shipped: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
      delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      sentToPrinter: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
      sent_to_printing: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
      readyForDelivery: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
    };
    return map[status] || 'bg-muted text-muted-foreground';
  };

  if (selectedOrder) {
    return (
      <InvoiceTemplateSelector
        order={selectedOrder}
        storeSettings={storeSettings}
        onClose={() => setSelectedOrder(null)}
      />
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-destructive">
            <p>حدث خطأ في تحميل الطلبات</p>
            <p className="text-sm mt-2 text-muted-foreground">{(error as Error).message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 bg-gradient-to-l from-primary/5 to-primary/10 rounded-xl px-5 py-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15 shadow-sm">
          <ClipboardList className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-foreground tracking-tight">الفواتير والطلبات</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            إجمالي <span className="font-semibold text-foreground">{orders.length}</span> طلب
            {filteredOrders.length !== orders.length && (
              <> • عرض <span className="font-semibold text-primary">{filteredOrders.length}</span> نتيجة</>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-primary">البحث</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="رقم الطلب، العميل، الهاتف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 h-10 bg-background border-border/50 focus-visible:ring-primary/30"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-primary">حالة الطلب</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 bg-background border-border/50">
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">في الانتظار</SelectItem>
                  <SelectItem value="confirmed">مؤكد</SelectItem>
                  <SelectItem value="processing">قيد التجهيز</SelectItem>
                  <SelectItem value="sentToPrinter">في المطبعة</SelectItem>
                  <SelectItem value="readyForDelivery">جاهز للتسليم</SelectItem>
                  <SelectItem value="shipped">تم الشحن</SelectItem>
                  <SelectItem value="delivered">تم التوصيل</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-primary">من تاريخ</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-10 bg-background border-border/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-primary">إلى تاريخ</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10 bg-background border-border/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">جاري تحميل الطلبات...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-20">
            <div className="text-center text-muted-foreground">
              <FileText className="h-14 w-14 mx-auto mb-4 opacity-20" />
              <p className="font-semibold text-base">
                {searchTerm || statusFilter !== 'all' || dateFrom || dateTo
                  ? 'لا توجد طلبات تطابق الفلاتر المحددة'
                  : 'لا توجد طلبات بعد'}
              </p>
              <p className="text-xs mt-1.5 opacity-70">جرّب تغيير معايير البحث أو الفلاتر</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <Card
              key={order.id}
              className="group overflow-hidden border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-200"
            >
              <CardContent className="p-5 sm:p-6">
                {/* Top: Serial + Status */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="font-extrabold text-base tracking-tight text-foreground">
                      {order.serial}
                    </h3>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                </div>

                {/* Info + Action */}
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        <span className="text-[11px]">العميل:</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground truncate">{order.client_name}</p>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span className="text-[11px]">الهاتف:</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground" dir="ltr">{order.phone}</p>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span className="text-[11px]">التاريخ:</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {new Date(order.date_created).toLocaleDateString('ar-EG')}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Banknote className="h-3.5 w-3.5" />
                        <span className="text-[11px]">المبلغ الإجمالي:</span>
                      </div>
                      <p className="text-lg font-extrabold text-primary leading-tight">
                        {formatCurrency(order.total)}
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="shrink-0">
                    <Button
                      onClick={() => setSelectedOrder(order)}
                      className="gap-2 h-10 px-6 rounded-lg bg-gradient-to-l from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="font-semibold text-sm">عرض الفاتورة</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvoiceTab;
