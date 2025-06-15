
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';
import { Users, ShoppingCart, TrendingUp, MapPin, Calendar, BarChart3 } from 'lucide-react';

interface CustomerAnalytics {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  governorate?: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string;
  avg_order_value: number;
}

interface LocationStats {
  governorate: string;
  order_count: number;
  total_revenue: number;
}

const AdminReports = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  // Fetch customer analytics
  const { data: customerAnalytics = [] } = useQuery({
    queryKey: ['customer-analytics', selectedPeriod],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(selectedPeriod));

      const { data, error } = await supabase
        .from('admin_orders')
        .select('customer_name, customer_phone, customer_email, governorate, total_amount, order_date')
        .eq('user_id', user!.id)
        .gte('order_date', daysAgo.toISOString())
        .order('order_date', { ascending: false });

      if (error) throw error;

      // Group by customer and calculate analytics
      const customerMap = new Map<string, CustomerAnalytics>();
      
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
            last_order_date: order.order_date,
            avg_order_value: 0
          });
        }
        
        const customer = customerMap.get(key)!;
        customer.total_orders++;
        customer.total_spent += Number(order.total_amount);
        if (order.order_date > customer.last_order_date) {
          customer.last_order_date = order.order_date;
        }
      });

      // Calculate average order value
      customerMap.forEach(customer => {
        customer.avg_order_value = customer.total_spent / customer.total_orders;
      });

      return Array.from(customerMap.values()).sort((a, b) => b.total_spent - a.total_spent);
    },
    enabled: !!user
  });

  // Fetch location statistics
  const { data: locationStats = [] } = useQuery({
    queryKey: ['location-stats', selectedPeriod],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(selectedPeriod));

      const { data, error } = await supabase
        .from('admin_orders')
        .select('governorate, total_amount')
        .eq('user_id', user!.id)
        .gte('order_date', daysAgo.toISOString())
        .not('governorate', 'is', null);

      if (error) throw error;

      // Group by governorate
      const locationMap = new Map<string, LocationStats>();
      
      data?.forEach(order => {
        const gov = order.governorate || 'غير محدد';
        if (!locationMap.has(gov)) {
          locationMap.set(gov, {
            governorate: gov,
            order_count: 0,
            total_revenue: 0
          });
        }
        
        const location = locationMap.get(gov)!;
        location.order_count++;
        location.total_revenue += Number(order.total_amount);
      });

      return Array.from(locationMap.values()).sort((a, b) => b.total_revenue - a.total_revenue);
    },
    enabled: !!user
  });

  // Calculate summary statistics
  const totalCustomers = customerAnalytics.length;
  const totalRevenue = customerAnalytics.reduce((sum, c) => sum + c.total_spent, 0);
  const totalOrders = customerAnalytics.reduce((sum, c) => sum + c.total_orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">التقارير والإحصائيات</h1>
          <p className="text-muted-foreground">تحليل أداء المتجر والعملاء</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">آخر 7 أيام</SelectItem>
            <SelectItem value="30">آخر 30 يوماً</SelectItem>
            <SelectItem value="90">آخر 3 أشهر</SelectItem>
            <SelectItem value="365">آخر سنة</SelectItem>
          </SelectContent>
        </Select>
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
              <ShoppingCart className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{totalOrders}</div>
                <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-purple-600" />
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
              <BarChart3 className="h-8 w-8 text-orange-600" />
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

      {/* Customer Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            تحليل العملاء
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customerAnalytics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد بيانات عملاء للفترة المحددة
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
                    <TableHead className="text-right">آخر طلب</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerAnalytics.map((customer, index) => (
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
                        {new Date(customer.last_order_date).toLocaleDateString('ar-EG')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            إحصائيات المواقع الجغرافية
          </CardTitle>
        </CardHeader>
        <CardContent>
          {locationStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد بيانات مواقع للفترة المحددة
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locationStats.map((location, index) => (
                <Card key={index} className="border">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <h3 className="font-semibold text-lg mb-2">{location.governorate}</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">عدد الطلبات:</span>
                          <Badge variant="outline">{location.order_count}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">إجمالي الإيرادات:</span>
                          <span className="font-medium">{formatCurrency(location.total_revenue)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReports;
