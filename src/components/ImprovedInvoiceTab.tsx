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
        <div className="flex items-center gap-2 mb-4 print:hidden">
          <Button variant="outline" onClick={handlePrint} className="bg-blue-500 text-white hover:bg-blue-600">
            <Download className="h-4 w-4 ml-2" />
            تحميل PDF الجودة
          </Button>
          <Button onClick={handlePrint} className="bg-green-500 text-white hover:bg-green-600">
            <Printer className="h-4 w-4 ml-2" />
            طباعة
          </Button>
          <Button variant="outline" onClick={() => setSelectedOrder(null)}>
            إغلاق
          </Button>
        </div>

        {/* Invoice Content */}
        <div ref={invoiceRef} className="bg-white text-black p-8 min-h-screen" dir="rtl">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src="/lovable-uploads/6e9103de-62f6-4d29-adc7-17c0cbdc9eda.png" 
                  alt="شعار الشركة" 
                  className="w-16 h-16 object-contain" 
                />
                <div>
                  <h1 className="text-2xl font-bold text-red-600">بناء هديا الأصيل</h1>
                  <p className="text-gray-600">ملوك الهدايا في مصر</p>
                </div>
              </div>
            </div>
            
            <div className="text-left">
              <h2 className="text-lg font-bold mb-2">فاتورة رقم</h2>
              <h3 className="text-xl font-bold text-red-600 mb-2">{selectedOrder.serial}</h3>
              <p className="text-gray-600">
                التاريخ: {new Date(selectedOrder.date_created).toLocaleDateString('ar-EG')}
              </p>
            </div>
          </div>

          <hr className="border-t-2 border-red-600 mb-8" />

          {/* Customer Information */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center">
                <span className="bg-red-600 text-white px-2 py-1 rounded ml-2">📋</span>
                بيانات العميل
              </h3>
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <p><span className="font-bold">اسم العميل:</span> {selectedOrder.client_name}</p>
                <p><span className="font-bold">التليفون:</span> {selectedOrder.phone}</p>
                <p><span className="font-bold">طريقة الدفع:</span> {selectedOrder.payment_method}</p>
                <p><span className="font-bold">طريقة الاستلام:</span> نقدي عند الاستلام</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-blue-600 mb-4 flex items-center">
                <span className="bg-blue-600 text-white px-2 py-1 rounded ml-2">🚚</span>
                معلومات التوصيل
              </h3>
              <div className="bg-green-50 p-4 rounded-lg space-y-2">
                <p><span className="font-bold">طريقة الاستلام:</span> {selectedOrder.delivery_method}</p>
                <p><span className="font-bold">حالة الطلب:</span> 
                  <Badge className={`mr-2 ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusLabel(selectedOrder.status)}
                  </Badge>
                </p>
              </div>
            </div>
          </div>

          {/* Order Items Table */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center">
              <span className="bg-red-600 text-white px-2 py-1 rounded ml-2">🛍️</span>
              تفاصيل الطلب
            </h3>
            
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-red-600 text-white">
                  <th className="border border-red-600 p-3 text-right">المنتج</th>
                  <th className="border border-red-600 p-3 text-center">المقاس</th>
                  <th className="border border-red-600 p-3 text-center">العدد</th>
                  <th className="border border-red-600 p-3 text-right">السعر</th>
                  <th className="border border-red-600 p-3 text-right">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.order_items.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="border border-gray-300 p-3">{item.product_type}</td>
                    <td className="border border-gray-300 p-3 text-center">{item.size}</td>
                    <td className="border border-gray-300 p-3 text-center">{item.quantity}</td>
                    <td className="border border-gray-300 p-3">{formatCurrency(item.price)}</td>
                    <td className="border border-gray-300 p-3 font-bold">
                      {formatCurrency(item.quantity * item.price - item.item_discount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t-2 border-red-600 pt-4">
            <div className="flex justify-end">
              <div className="w-80 space-y-3">
                <div className="flex justify-between text-lg">
                  <span>المجموع الفرعي:</span>
                  <span className="font-bold">{formatCurrency(subtotal)}</span>
                </div>
                
                {selectedOrder.shipping_cost > 0 && (
                  <div className="flex justify-between">
                    <span>تكلفة الشحن:</span>
                    <span>{formatCurrency(selectedOrder.shipping_cost)}</span>
                  </div>
                )}
                
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>الخصم:</span>
                    <span>-{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-xl font-bold bg-red-600 text-white p-3 rounded">
                  <span>إجمالي الفاتورة:</span>
                  <span>{formatCurrency(finalTotal)}</span>
                </div>
                
                {selectedOrder.deposit > 0 && (
                  <div className="flex justify-between text-blue-600 font-bold">
                    <span>المبلغ المسدد:</span>
                    <span>{formatCurrency(selectedOrder.deposit)}</span>
                  </div>
                )}
                
                {remainingAmount > 0 && (
                  <div className="flex justify-between text-red-600 font-bold text-lg">
                    <span>المبلغ المتبقي:</span>
                    <span>{formatCurrency(remainingAmount)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <div className="bg-blue-100 p-4 rounded-lg">
              <p className="text-blue-800 font-bold">شكراً لثقتكم في بناء هديا الأصيل</p>
              <p className="text-sm text-gray-600 mt-2">
                لأي استفسار يرجى التواصل معنا • هذه فاتورة إلكترونية معتمدة
              </p>
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
          {/* Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

          {/* Orders List */}
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
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{order.serial}</h3>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                          <p className="text-sm bg-gray-100 p-2 rounded mt-1">{order.notes}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 mr-4">
                      <Button
                        onClick={() => setSelectedOrder(order)}
                        size="sm"
                        className="flex items-center gap-2"
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