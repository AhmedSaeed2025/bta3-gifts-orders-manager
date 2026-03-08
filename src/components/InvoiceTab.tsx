
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, FileText, Eye, Loader2, Receipt } from 'lucide-react';
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
    };
    return map[status] || status;
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    if (status === 'delivered') return 'default';
    if (status === 'cancelled') return 'destructive';
    if (status === 'shipped' || status === 'confirmed') return 'secondary';
    return 'outline';
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
          <Receipt className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">الفواتير والطلبات</h2>
          <p className="text-xs text-muted-foreground">{orders.length} طلب • {filteredOrders.length} نتيجة</p>
        </div>
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">البحث</label>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="رقم الطلب، العميل، الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 h-9 bg-background"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">حالة الطلب</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 bg-background">
              <SelectValue placeholder="جميع الحالات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="pending">في الانتظار</SelectItem>
              <SelectItem value="confirmed">مؤكد</SelectItem>
              <SelectItem value="processing">قيد التجهيز</SelectItem>
              <SelectItem value="sentToPrinter">في المطبعة</SelectItem>
              <SelectItem value="shipped">تم الشحن</SelectItem>
              <SelectItem value="delivered">تم التوصيل</SelectItem>
              <SelectItem value="cancelled">ملغي</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date From */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">من تاريخ</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 bg-background"
          />
        </div>

        {/* Date To */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">إلى تاريخ</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 bg-background"
          />
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">جاري تحميل الطلبات...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">{searchTerm || statusFilter !== 'all' || dateFrom || dateTo ? 'لا توجد طلبات تطابق الفلاتر' : 'لا توجد طلبات'}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden hover:shadow-md transition-all border-border">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0">
                  {/* Serial + Status */}
                  <div className="flex items-center gap-2.5 sm:min-w-[200px]">
                    <span className="font-bold text-sm text-foreground">{order.serial}</span>
                    <Badge variant={getStatusVariant(order.status)} className="text-[10px] h-5 shrink-0">
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>

                  {/* Info Grid */}
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block">العميل:</span>
                      <span className="font-medium text-foreground truncate block">{order.client_name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">الهاتف:</span>
                      <span className="font-medium text-foreground" dir="ltr">{order.phone}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">التاريخ:</span>
                      <span className="font-medium text-foreground">{new Date(order.date_created).toLocaleDateString('ar-EG')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">المبلغ الإجمالي:</span>
                      <span className="font-bold text-primary text-sm">{formatCurrency(order.total)}</span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="sm:mr-4 flex sm:justify-end">
                    <Button
                      onClick={() => setSelectedOrder(order)}
                      size="sm"
                      className="gap-2 h-9 px-5"
                    >
                      <Eye className="h-4 w-4" />
                      عرض الفاتورة
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
