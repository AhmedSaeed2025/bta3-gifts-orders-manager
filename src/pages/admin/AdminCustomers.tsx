
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';
import { Users, Search, ShoppingCart, TrendingUp, MapPin } from 'lucide-react';

interface Customer {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  governorate?: string;
  total_orders: number;
  total_spent: number;
  avg_order_value: number;
  first_order_date: string;
  last_order_date: string;
  status: 'active' | 'inactive';
}

const AdminCustomers = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGovernorate, setSelectedGovernorate] = useState('all');
  const [sortBy, setSortBy] = useState('total_spent');

  // Fetch customers data
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_orders')
        .select('customer_name, customer_phone, customer_email, governorate, total_amount, order_date')
        .eq('user_id', user!.id)
        .order('order_date', { ascending: false });

      if (error) throw error;

      // Group by customer and calculate analytics
      const customerMap = new Map<string, Customer>();
      
      data?.forEach(order => {
        const key = `${order.customer_name}-${order.customer_phone}`;
        if (!customerMap.has(key)) {
          customerMap.set(key, {
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            customer_email: order.customer_email,
            governorate: order.governorate,
            total_orders: 0,
            total_spent: 0,
            avg_order_value: 0,
            first_order_date: order.order_date,
            last_order_date: order.order_date,
            status: 'active'
          });
        }
        
        const customer = customerMap.get(key)!;
        customer.total_orders++;
        customer.total_spent += Number(order.total_amount);
        
        // Update first and last order dates
        if (order.order_date < customer.first_order_date) {
          customer.first_order_date = order.order_date;
        }
        if (order.order_date > customer.last_order_date) {
          customer.last_order_date = order.order_date;
        }
      });

      // Calculate average order value and determine status
      const now = new Date();
      const twoMonthsAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000)); // 60 days ago

      customerMap.forEach(customer => {
        customer.avg_order_value = customer.total_spent / customer.total_orders;
        customer.status = new Date(customer.last_order_date) > twoMonthsAgo ? 'active' : 'inactive';
      });

      return Array.from(customerMap.values());
    },
    enabled: !!user
  });

  // Get unique governorates for filter
  const governorates = Array.from(new Set(customers.map(c => c.governorate).filter(Boolean)));

  // Filter and sort customers
  const filteredCustomers = customers
    .filter(customer => {
      const matchesSearch = customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.customer_phone.includes(searchTerm);
      const matchesGovernorate = selectedGovernorate === 'all' || customer.governorate === selectedGovernorate;
      return matchesSearch && matchesGovernorate;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'total_spent':
          return b.total_spent - a.total_spent;
        case 'total_orders':
          return b.total_orders - a.total_orders;
        case 'last_order_date':
          return new Date(b.last_order_date).getTime() - new Date(a.last_order_date).getTime();
        case 'customer_name':
          return a.customer_name.localeCompare(b.customer_name, 'ar');
        default:
          return 0;
      }
    });

  // Calculate summary statistics
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.total_spent, 0);
  const avgOrderValue = customers.length > 0 ? customers.reduce((sum, c) => sum + c.avg_order_value, 0) / customers.length : 0;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold">إدارة العملاء</h1>
        <p className="text-muted-foreground">عرض وتحليل بيانات العملاء وطلباتهم</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{totalCustomers}</div>
                <p className="text-sm text-muted-foreground">إجمالي العملاء</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{activeCustomers}</div>
                <p className="text-sm text-muted-foreground">عملاء نشطين</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(totalRevenue)}
                </div>
                <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(avgOrderValue)}
                </div>
                <p className="text-sm text-muted-foreground">متوسط قيمة الطلب</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث بالاسم أو رقم الهاتف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={selectedGovernorate} onValueChange={setSelectedGovernorate}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="فلترة بالمحافظة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المحافظات</SelectItem>
                {governorates.map(gov => (
                  <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="ترتيب حسب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total_spent">إجمالي المبلغ</SelectItem>
                <SelectItem value="total_orders">عدد الطلبات</SelectItem>
                <SelectItem value="last_order_date">آخر طلب</SelectItem>
                <SelectItem value="customer_name">الاسم</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة العملاء ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || selectedGovernorate !== 'all' ? 'لا توجد نتائج تطابق البحث' : 'لا يوجد عملاء حتى الآن'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">اسم العميل</TableHead>
                    <TableHead className="text-right">الهاتف</TableHead>
                    <TableHead className="text-right">البريد الإلكتروني</TableHead>
                    <TableHead className="text-right">المحافظة</TableHead>
                    <TableHead className="text-center">عدد الطلبات</TableHead>
                    <TableHead className="text-right">إجمالي المبلغ</TableHead>
                    <TableHead className="text-right">متوسط الطلب</TableHead>
                    <TableHead className="text-right">أول طلب</TableHead>
                    <TableHead className="text-right">آخر طلب</TableHead>
                    <TableHead className="text-center">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{customer.customer_name}</TableCell>
                      <TableCell>{customer.customer_phone}</TableCell>
                      <TableCell>{customer.customer_email || 'غير متوفر'}</TableCell>
                      <TableCell>{customer.governorate || 'غير محدد'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{customer.total_orders}</Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(customer.total_spent)}</TableCell>
                      <TableCell>{formatCurrency(customer.avg_order_value)}</TableCell>
                      <TableCell>
                        {new Date(customer.first_order_date).toLocaleDateString('ar-EG')}
                      </TableCell>
                      <TableCell>
                        {new Date(customer.last_order_date).toLocaleDateString('ar-EG')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={customer.status === 'active' ? 'default' : 'secondary'}
                          className={customer.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}
                        >
                          {customer.status === 'active' ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCustomers;
