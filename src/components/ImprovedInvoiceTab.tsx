
import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, FileText, Eye, Loader2, Filter, Download, Printer, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useReactToPrint } from 'react-to-print';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

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

  // Filter orders based on search term and filters
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.serial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    const orderDate = new Date(order.date_created);
    const matchesDateFrom = !dateFrom || orderDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || orderDate <= new Date(dateTo);
    
    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
    documentTitle: `فاتورة-${selectedOrder?.serial}`,
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
      case 'pending': return 'bg-yellow-500 text-white';
      case 'confirmed': return 'bg-blue-500 text-white';
      case 'processing': return 'bg-purple-500 text-white';
      case 'shipped': return 'bg-green-500 text-white';
      case 'delivered': return 'bg-emerald-500 text-white';
      case 'cancelled': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Invoice view
  if (selectedOrder) {
    const subtotal = selectedOrder.order_items.reduce((sum, item) => sum + (item.quantity * item.price - item.item_discount), 0);
    const finalTotal = subtotal + selectedOrder.shipping_cost - selectedOrder.discount;
    const remainingAmount = finalTotal - (selectedOrder.deposit || 0);

    return (
      <div className="space-y-4">
        {/* Print Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-2 mb-4 print:hidden">
          <Button variant="outline" onClick={handlePrint} className="w-full sm:w-auto bg-blue-500 text-white hover:bg-blue-600">
            <Download className="h-4 w-4 ml-2" />
            تحميل PDF
          </Button>
          <Button onClick={handlePrint} className="w-full sm:w-auto bg-green-500 text-white hover:bg-green-600">
            <Printer className="h-4 w-4 ml-2" />
            طباعة الفاتورة
          </Button>
          <Button variant="outline" onClick={() => setSelectedOrder(null)} className="w-full sm:w-auto">
            إغلاق
          </Button>
        </div>

        {/* Invoice Content - Optimized for Mobile */}
        <div ref={invoiceRef} className="bg-white text-black p-4 sm:p-6 md:p-8 min-h-screen" dir="rtl">
          {/* Header - Mobile Optimized */}
          <div className="flex flex-col lg:flex-row justify-between items-start mb-6 sm:mb-8 space-y-4 lg:space-y-0">
            <div className="w-full lg:w-auto">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 mb-4">
                <img 
                  src="/lovable-uploads/6e9103de-62f6-4d29-adc7-17c0cbdc9eda.png" 
                  alt="شعار الشركة" 
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain mx-auto sm:mx-0" 
                />
                <div className="text-center sm:text-right">
                  <h1 className="text-xl sm:text-2xl font-bold text-red-600">#بتاع_هدايا_الأصلي</h1>
                  <p className="text-sm sm:text-base text-gray-600">ملوك الهدايا في مصر</p>
                </div>
              </div>
            </div>
            
            <div className="w-full lg:w-auto text-center lg:text-left border-2 border-red-600 rounded-lg p-3 sm:p-4 bg-red-50">
              <h2 className="text-base sm:text-lg font-bold mb-2 text-red-700">فاتورة رقم</h2>
              <h3 className="text-lg sm:text-xl font-bold text-red-600 mb-2">{selectedOrder.serial}</h3>
              <p className="text-sm sm:text-base text-gray-600">
                التاريخ: {new Date(selectedOrder.date_created).toLocaleDateString('ar-EG')}
              </p>
            </div>
          </div>

          <hr className="border-t-2 border-red-600 mb-6 sm:mb-8" />

          {/* Customer Information - Mobile Responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
            <div className="order-1">
              <h3 className="text-base sm:text-lg font-bold text-red-600 mb-3 sm:mb-4 flex items-center">
                <span className="bg-red-600 text-white px-2 py-1 rounded ml-2 text-sm">📋</span>
                بيانات العميل
              </h3>
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg space-y-2 text-sm sm:text-base">
                <p><span className="font-bold">اسم العميل:</span> {selectedOrder.client_name}</p>
                <p><span className="font-bold">التليفون:</span> {selectedOrder.phone}</p>
                <p><span className="font-bold">طريقة الدفع:</span> {selectedOrder.payment_method}</p>
                <p><span className="font-bold">طريقة الاستلام:</span> {selectedOrder.delivery_method}</p>
              </div>
            </div>

            <div className="order-2">
              <h3 className="text-base sm:text-lg font-bold text-blue-600 mb-3 sm:mb-4 flex items-center">
                <span className="bg-blue-600 text-white px-2 py-1 rounded ml-2 text-sm">🚚</span>
                معلومات التوصيل
              </h3>
              <div className="bg-green-50 p-3 sm:p-4 rounded-lg space-y-2 text-sm sm:text-base">
                <p><span className="font-bold">طريقة الاستلام:</span> {selectedOrder.delivery_method}</p>
                <p className="flex flex-wrap items-center"><span className="font-bold ml-2">حالة الطلب:</span> 
                  <Badge className={`text-xs sm:text-sm ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusLabel(selectedOrder.status)}
                  </Badge>
                </p>
                {selectedOrder.address && (
                  <p><span className="font-bold">العنوان:</span> {selectedOrder.address}</p>
                )}
                {selectedOrder.governorate && (
                  <p><span className="font-bold">المحافظة:</span> {selectedOrder.governorate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Order Items Table - Mobile Responsive */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-bold text-red-600 mb-3 sm:mb-4 flex items-center">
              <span className="bg-red-600 text-white px-2 py-1 rounded ml-2 text-sm">🛍️</span>
              تفاصيل الطلب
            </h3>
            
            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-3">
              {selectedOrder.order_items.map((item, index) => (
                <div key={item.id} className="bg-gray-50 p-3 rounded-lg border">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-sm">{item.product_type}</h4>
                    <span className="text-sm font-bold text-green-600">
                      {formatCurrency(item.quantity * item.price - item.item_discount)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <p><span className="font-medium">المقاس:</span> {item.size}</p>
                    <p><span className="font-medium">العدد:</span> {item.quantity}</p>
                    <p><span className="font-medium">السعر:</span> {formatCurrency(item.price)}</p>
                    {item.item_discount > 0 && (
                      <p><span className="font-medium">الخصم:</span> {formatCurrency(item.item_discount)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-red-600 text-white">
                    <th className="border border-red-600 p-2 sm:p-3 text-right">المنتج</th>
                    <th className="border border-red-600 p-2 sm:p-3 text-center">المقاس</th>
                    <th className="border border-red-600 p-2 sm:p-3 text-center">العدد</th>
                    <th className="border border-red-600 p-2 sm:p-3 text-right">السعر</th>
                    <th className="border border-red-600 p-2 sm:p-3 text-right">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.order_items.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="border border-gray-300 p-2 sm:p-3">{item.product_type}</td>
                      <td className="border border-gray-300 p-2 sm:p-3 text-center">{item.size}</td>
                      <td className="border border-gray-300 p-2 sm:p-3 text-center">{item.quantity}</td>
                      <td className="border border-gray-300 p-2 sm:p-3">{formatCurrency(item.price)}</td>
                      <td className="border border-gray-300 p-2 sm:p-3 font-bold">
                        {formatCurrency(item.quantity * item.price - item.item_discount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals - Mobile Optimized */}
          <div className="border-t-2 border-red-600 pt-4">
            <div className="flex justify-end">
              <div className="w-full sm:w-80 space-y-3">
                <div className="flex justify-between text-sm sm:text-lg">
                  <span>المجموع الفرعي:</span>
                  <span className="font-bold">{formatCurrency(subtotal)}</span>
                </div>
                
                {selectedOrder.shipping_cost > 0 && (
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>تكلفة الشحن:</span>
                    <span>{formatCurrency(selectedOrder.shipping_cost)}</span>
                  </div>
                )}
                
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-red-600 text-sm sm:text-base">
                    <span>الخصم:</span>
                    <span>-{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg sm:text-xl font-bold bg-red-600 text-white p-2 sm:p-3 rounded">
                  <span>إجمالي الفاتورة:</span>
                  <span>{formatCurrency(finalTotal)}</span>
                </div>
                
                {selectedOrder.deposit > 0 && (
                  <div className="flex justify-between text-blue-600 font-bold text-sm sm:text-base">
                    <span>المبلغ المسدد:</span>
                    <span>{formatCurrency(selectedOrder.deposit)}</span>
                  </div>
                )}
                
                {remainingAmount > 0 && (
                  <div className="flex justify-between text-red-600 font-bold text-base sm:text-lg">
                    <span>المبلغ المتبقي:</span>
                    <span>{formatCurrency(remainingAmount)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes Section - Mobile Responsive */}
          {selectedOrder.notes && (
            <div className="mt-6 sm:mt-8">
              <h3 className="text-base sm:text-lg font-bold text-gray-700 mb-3">ملاحظات:</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">{selectedOrder.notes}</p>
              </div>
            </div>
          )}

          {/* Footer - Mobile Optimized */}
          <div className="mt-8 sm:mt-12 text-center">
            <div className="bg-blue-100 p-3 sm:p-4 rounded-lg">
              <p className="text-blue-800 font-bold text-sm sm:text-base">#شكراً_لثقتكم_في_بتاع_هدايا_الأصلي</p>
              <p className="text-xs sm:text-sm text-gray-600 mt-2">
                لأي استفسار يرجى التواصل معنا • هذه فاتورة إلكترونية معتمدة
              </p>
              <div className="mt-3 sm:mt-4 flex justify-center">
                <img 
                  src="/lovable-uploads/6e9103de-62f6-4d29-adc7-17c0cbdc9eda.png" 
                  alt="ختم الشركة" 
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain opacity-60" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Invoice tab query error:', error);
    return (
      <Card>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            الفواتير والطلبات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Advanced Filters - Mobile Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <Label htmlFor="search">البحث</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  type="text"
                  placeholder="رقم الطلب، العميل، الهاتف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>حالة الطلب</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
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
              <Label htmlFor="dateFrom">من تاريخ</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="dateTo">إلى تاريخ</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* Orders List - Mobile Responsive */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="mr-2">جاري تحميل الطلبات...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || statusFilter !== 'all' || dateFrom || dateTo 
                ? 'لا توجد طلبات تطابق معايير البحث' 
                : 'لا توجد طلبات'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-3 lg:space-y-0">
                    <div className="flex-1 w-full">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{order.serial}</h3>
                        <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">العميل:</span>
                          <p className="font-medium">{order.client_name}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">الهاتف:</span>
                          <p className="font-medium">{order.phone}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">التاريخ:</span>
                          <p className="font-medium">
                            {new Date(order.date_created).toLocaleDateString('ar-EG')}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">المبلغ الإجمالي:</span>
                          <p className="font-bold text-green-600">
                            {formatCurrency(order.total)}
                          </p>
                        </div>
                      </div>

                      {order.notes && (
                        <div className="mt-2">
                          <span className="text-gray-500 text-sm">الملاحظات:</span>
                          <p className="text-sm bg-gray-100 p-2 rounded mt-1 line-clamp-2">{order.notes}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 w-full lg:w-auto lg:mr-4">
                      <Button
                        onClick={() => setSelectedOrder(order)}
                        size="sm"
                        className="w-full lg:w-auto flex items-center gap-2"
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
