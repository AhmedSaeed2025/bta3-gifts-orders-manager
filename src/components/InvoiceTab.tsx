
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, FileText, Eye, Loader2, Receipt, UserCircle, PhoneCall, Calendar, Wallet, Filter, RotateCcw, Hash } from 'lucide-react';
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
      pending: 'في الانتظار',
      confirmed: 'مؤكد',
      processing: 'قيد التجهيز',
      shipped: 'تم الشحن',
      delivered: 'تم التوصيل',
      cancelled: 'ملغي',
      sentToPrinter: 'في المطبعة',
      sent_to_printing: 'في المطبعة',
      readyForDelivery: 'جاهز للتسليم',
    };
    return map[status] || status;
  };

  const getStatusStyle = (status: string) => {
    const styles: Record<string, { bg: string; text: string; dot: string }> = {
      pending: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
      confirmed: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
      processing: { bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500' },
      shipped: { bg: 'bg-cyan-50 dark:bg-cyan-950/40', text: 'text-cyan-700 dark:text-cyan-300', dot: 'bg-cyan-500' },
      delivered: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
      cancelled: { bg: 'bg-red-50 dark:bg-red-950/40', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
      sentToPrinter: { bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-700 dark:text-violet-300', dot: 'bg-violet-500' },
      sent_to_printing: { bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-700 dark:text-violet-300', dot: 'bg-violet-500' },
      readyForDelivery: { bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-700 dark:text-teal-300', dot: 'bg-teal-500' },
    };
    return styles[status] || { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground' };
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || dateFrom || dateTo;

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
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
      <Card className="border-destructive/30">
        <CardContent className="p-8">
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-destructive" />
            </div>
            <p className="font-bold text-lg text-destructive">حدث خطأ في تحميل الطلبات</p>
            <p className="text-sm mt-2 text-muted-foreground">{(error as Error).message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border border-primary/10 p-6">
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full -translate-x-10 -translate-y-10" />
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary/5 rounded-full translate-x-8 translate-y-8" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 shadow-sm border border-primary/10">
              <Receipt className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground tracking-tight">تقرير الفواتير</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-muted-foreground">
                  إجمالي <span className="font-bold text-foreground">{orders.length}</span> فاتورة
                </span>
                {hasActiveFilters && (
                  <span className="text-sm text-primary font-semibold">
                    • {filteredOrders.length} نتيجة
                  </span>
                )}
              </div>
            </div>
          </div>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="gap-1.5 text-xs border-primary/20 text-primary hover:bg-primary/5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              مسح الفلاتر
            </Button>
          )}
        </div>
      </div>

      {/* Filters Section */}
      <Card className="border-border/40 shadow-sm rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 bg-muted/30 border-b border-border/40">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">فلترة وبحث</span>
        </div>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-foreground/70 uppercase tracking-wider">البحث</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="رقم الطلب، العميل، الهاتف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 h-11 bg-muted/30 border-border/30 rounded-lg text-sm placeholder:text-muted-foreground/40 focus-visible:ring-primary/20 focus-visible:border-primary/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-foreground/70 uppercase tracking-wider">حالة الطلب</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 bg-muted/30 border-border/30 rounded-lg text-sm">
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

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-foreground/70 uppercase tracking-wider">من تاريخ</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-11 bg-muted/30 border-border/30 rounded-lg text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-foreground/70 uppercase tracking-wider">إلى تاريخ</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-11 bg-muted/30 border-border/30 rounded-lg text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">جاري تحميل الفواتير...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="border-dashed border-2 border-border/40 rounded-xl">
          <CardContent className="py-24">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-5">
                <FileText className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <p className="font-bold text-lg text-foreground/70">
                {hasActiveFilters ? 'لا توجد نتائج مطابقة' : 'لا توجد فواتير بعد'}
              </p>
              <p className="text-sm mt-2 text-muted-foreground/60">
                {hasActiveFilters ? 'جرّب تعديل معايير البحث أو الفلاتر' : 'ستظهر الفواتير هنا عند إنشاء طلبات جديدة'}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4 gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" />
                  مسح الفلاتر
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order, index) => {
            const statusStyle = getStatusStyle(order.status);
            return (
              <Card
                key={order.id}
                className="group rounded-xl border-border/30 hover:border-primary/20 hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    {/* Right accent bar */}
                    <div className={`hidden sm:block w-1.5 ${statusStyle.dot} shrink-0`} />
                    
                    <div className="flex-1 p-5 sm:p-6">
                      {/* Top Row: Serial + Status */}
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Hash className="h-4 w-4 text-muted-foreground/40" />
                            <h3 className="font-black text-lg tracking-tight text-foreground">
                              {order.serial}
                            </h3>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg ${statusStyle.bg} ${statusStyle.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                        
                        <Button
                          onClick={() => setSelectedOrder(order)}
                          size="sm"
                          className="gap-2 h-9 px-5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all font-bold text-xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          عرض الفاتورة
                        </Button>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0 mt-0.5">
                            <UserCircle className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-0.5">العميل</p>
                            <p className="text-sm font-bold text-foreground truncate">{order.client_name}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center justify-center shrink-0 mt-0.5">
                            <PhoneCall className="h-4.5 w-4.5 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-0.5">الهاتف</p>
                            <p className="text-sm font-bold text-foreground" dir="ltr">{order.phone}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center shrink-0 mt-0.5">
                            <Calendar className="h-4.5 w-4.5 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-0.5">التاريخ</p>
                            <p className="text-sm font-bold text-foreground">
                              {new Date(order.date_created).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center shrink-0 mt-0.5">
                            <Wallet className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-0.5">الإجمالي</p>
                            <p className="text-base font-black text-primary">
                              {formatCurrency(order.total)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InvoiceTab;
