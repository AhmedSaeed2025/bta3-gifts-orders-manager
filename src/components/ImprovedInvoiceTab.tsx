import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, FileText, Eye, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import InvoiceTemplateSelector from './invoice/InvoiceTemplateSelector';
import { useDateFilter } from '@/components/tabs/StyledIndexTabs';

interface Order {
  id: string;
  serial: string;
  client_name: string;
  phone: string;
  email?: string;
  address?: string;
  governorate?: string;
  payment_method: string;
  delivery_method: string;
  status: string;
  date_created: string;
  total: number;
  profit: number;
  shipping_cost: number;
  discount: number;
  deposit: number;
  notes?: string;
  attached_image_url?: string;
  order_items: OrderItem[];
}

interface OrderItem {
  id: string;
  product_type: string;
  size: string;
  quantity: number;
  price: number;
  cost: number;
  profit: number;
  item_discount: number;
}

const ImprovedInvoiceTab = () => {
  const { user } = useAuth();
  const { startDate, endDate } = useDateFilter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch store settings for invoice (always, not conditionally)
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

  // Fetch orders with proper error handling
  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['orders-invoice'],
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

  // Filter orders based on search term, filters, and date context filter
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.serial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    const orderDate = new Date(order.date_created);
    const matchesDateFrom = !dateFrom || orderDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || orderDate <= new Date(dateTo);
    
    // Apply global date filter from context
    const matchesContextDateFrom = !startDate || orderDate >= startDate;
    const matchesContextDateTo = !endDate || orderDate <= endDate;
    
    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo && matchesContextDateFrom && matchesContextDateTo;
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'قيد المراجعة';
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
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Invoice view
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
    console.error('Invoice tab query error:', error);
    return (
      <Card className="shadow-lg">
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
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-l from-blue-50 to-purple-50">
          <CardTitle className="flex items-center gap-3 text-xl">
            <FileText className="h-6 w-6 text-blue-600" />
            الفواتير والطلبات
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Advanced Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div>
              <Label htmlFor="search" className="text-gray-700 font-medium">البحث</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  type="text"
                  placeholder="رقم الطلب، العميل، الهاتف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-gray-700 font-medium">حالة الطلب</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1 border-gray-300 focus:border-blue-500">
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">قيد المراجعة</SelectItem>
                  <SelectItem value="confirmed">مؤكد</SelectItem>
                  <SelectItem value="processing">قيد التجهيز</SelectItem>
                  <SelectItem value="shipped">تم الشحن</SelectItem>
                  <SelectItem value="delivered">تم التوصيل</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="dateFrom" className="text-gray-700 font-medium">من تاريخ</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <Label htmlFor="dateTo" className="text-gray-700 font-medium">إلى تاريخ</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Orders List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="mr-3 text-gray-600">جاري تحميل الطلبات...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm || statusFilter !== 'all' || dateFrom || dateTo 
                ? 'لا توجد طلبات تطابق معايير البحث' 
                : 'لا توجد طلبات'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-blue-200">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0">
                    <div className="flex-1 w-full">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                        <h3 className="text-xl font-bold text-gray-800">{order.serial}</h3>
                        <span className={`text-sm px-3 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 font-medium">العميل:</span>
                          <p className="font-semibold text-gray-800">{order.client_name}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 font-medium">الهاتف:</span>
                          <p className="font-semibold text-gray-800">{order.phone}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 font-medium">التاريخ:</span>
                          <p className="font-semibold text-gray-800">
                            {new Date(order.date_created).toLocaleDateString('ar-EG')}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 font-medium">المبلغ الإجمالي:</span>
                          <p className="font-bold text-green-600 text-lg">
                            {formatCurrency(order.total)}
                          </p>
                        </div>
                      </div>

                      {order.notes && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-500 text-sm font-medium">الملاحظات:</span>
                          <p className="text-sm text-gray-700 mt-1 line-clamp-2">{order.notes}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="w-full lg:w-auto">
                      <Button
                        onClick={() => setSelectedOrder(order)}
                        className="w-full lg:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg flex items-center gap-2"
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

export default ImprovedInvoiceTab;
