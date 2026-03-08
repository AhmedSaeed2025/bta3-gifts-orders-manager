
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Eye, Loader2, Receipt, Phone, Calendar, User, DollarSign } from 'lucide-react';
import InvoiceTemplateSelector from '@/components/invoice/InvoiceTemplateSelector';
import { formatCurrency } from '@/lib/utils';

const InvoiceTab = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredOrders = orders.filter(order =>
    order.serial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.phone?.includes(searchTerm)
  );

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: 'في الانتظار', confirmed: 'مؤكد', processing: 'قيد التجهيز',
      shipped: 'تم الشحن', delivered: 'تم التوصيل', cancelled: 'ملغي',
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
          <Receipt className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">الفواتير</h2>
          <p className="text-xs text-muted-foreground">{orders.length} طلب متاح</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="ابحث برقم الطلب، اسم العميل، أو رقم الهاتف..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10 h-10 bg-background border-border"
        />
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">جاري تحميل الطلبات...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">{searchTerm ? 'لا توجد طلبات تطابق البحث' : 'لا توجد طلبات'}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden hover:shadow-md transition-shadow border-border">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  {/* Main Content */}
                  <div className="flex-1 p-3 sm:p-4">
                    {/* Top Row: Serial + Status */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{order.serial}</span>
                        <Badge variant={getStatusVariant(order.status)} className="text-[10px] h-5">
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>
                      <span className="font-bold text-sm text-primary">
                        {formatCurrency(order.total)}
                      </span>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3 shrink-0" />
                        <span className="truncate">{order.client_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 shrink-0" />
                        <span dir="ltr" className="truncate">{order.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>{new Date(order.date_created).toLocaleDateString('ar-EG')}</span>
                      </div>
                    </div>

                    {order.notes && (
                      <p className="text-[11px] text-muted-foreground mt-2 bg-muted/50 rounded px-2 py-1 line-clamp-1">
                        {order.notes}
                      </p>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="flex flex-col items-center justify-center px-4 bg-primary/5 hover:bg-primary/10 transition-colors border-r border-border gap-1"
                  >
                    <Eye className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-medium text-primary">فاتورة</span>
                  </button>
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
