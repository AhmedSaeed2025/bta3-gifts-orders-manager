
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Truck,
  MapPin,
  Calendar,
  Eye,
  Star,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const AdminDashboard = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  // Fetch orders data
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders-dashboard', selectedPeriod],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(selectedPeriod));

      const { data, error } = await supabase
        .from('admin_orders')
        .select(`
          *,
          admin_order_items (*)
        `)
        .eq('user_id', user!.id)
        .gte('order_date', daysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Calculate dashboard metrics
  const dashboardMetrics = useMemo(() => {
    if (!orders.length) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        totalCost: 0,
        netProfit: 0,
        avgOrderValue: 0,
        totalCustomers: 0,
        pendingOrders: 0,
        completedOrders: 0,
        shippedOrders: 0,
        cancelledOrders: 0,
        totalItems: 0,
        topProducts: [],
        salesByDay: [],
        revenueByStatus: [],
        topGovernorates: [],
        profitMargin: 0,
        growthRate: 0
      };
    }

    let totalRevenue = 0;
    let totalCost = 0;
    let totalItems = 0;
    const customerSet = new Set();
    const productMap = new Map();
    const statusMap = new Map();
    const governorateMap = new Map();
    const dailySales = new Map();

    // Process orders
    orders.forEach(order => {
      const orderDate = new Date(order.order_date).toLocaleDateString('ar-EG');
      
      // Calculate order totals
      const orderSubtotal = order.admin_order_items?.reduce((sum, item) => {
        const discountedPrice = item.unit_price - (item.item_discount || 0);
        return sum + (discountedPrice * item.quantity);
      }, 0) || 0;

      const orderCost = order.admin_order_items?.reduce((sum, item) => {
        return sum + (item.unit_cost * item.quantity);
      }, 0) || 0;

      totalRevenue += orderSubtotal;
      totalCost += orderCost;
      
      // Customer tracking
      customerSet.add(`${order.customer_name}-${order.customer_phone}`);
      
      // Status tracking
      statusMap.set(order.status, (statusMap.get(order.status) || 0) + 1);
      
      // Governorate tracking
      if (order.governorate) {
        const gov = governorateMap.get(order.governorate) || { orders: 0, revenue: 0 };
        gov.orders += 1;
        gov.revenue += orderSubtotal;
        governorateMap.set(order.governorate, gov);
      }
      
      // Daily sales
      const daySales = dailySales.get(orderDate) || { date: orderDate, sales: 0, orders: 0, profit: 0 };
      daySales.sales += orderSubtotal;
      daySales.orders += 1;
      daySales.profit += (orderSubtotal - orderCost);
      dailySales.set(orderDate, daySales);
      
      // Process items
      order.admin_order_items?.forEach(item => {
        totalItems += item.quantity;
        const key = `${item.product_name} - ${item.product_size}`;
        const product = productMap.get(key) || { name: key, quantity: 0, revenue: 0 };
        product.quantity += item.quantity;
        product.revenue += item.total_price;
        productMap.set(key, product);
      });
    });

    const netProfit = totalRevenue - totalCost;
    const avgOrderValue = totalRevenue / orders.length;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Get top products
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Get sales by day (last 7 days)
    const salesByDay = Array.from(dailySales.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7);

    // Revenue by status
    const revenueByStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
      percentage: (count / orders.length) * 100
    }));

    // Top governorates
    const topGovernorates = Array.from(governorateMap.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([name, data]) => ({ name, ...data }));

    return {
      totalRevenue,
      totalOrders: orders.length,
      totalCost,
      netProfit,
      avgOrderValue,
      totalCustomers: customerSet.size,
      pendingOrders: statusMap.get('pending') || 0,
      completedOrders: statusMap.get('delivered') || 0,
      shippedOrders: statusMap.get('shipped') || 0,
      cancelledOrders: statusMap.get('cancelled') || 0,
      totalItems,
      topProducts,
      salesByDay,
      revenueByStatus,
      topGovernorates,
      profitMargin,
      growthRate: 0 // Calculate this based on previous period comparison
    };
  }, [orders]);

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (ordersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-lg font-medium">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">لوحة التحكم</h1>
          <p className="text-muted-foreground">نظرة شاملة على أداء مشروعك</p>
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="7">آخر 7 أيام</option>
          <option value="30">آخر 30 يوماً</option>
          <option value="90">آخر 3 أشهر</option>
          <option value="365">آخر سنة</option>
        </select>
      </div>

      {/* Key Metrics Grid */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'}`}>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">إجمالي المبيعات</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(dashboardMetrics.totalRevenue)}
                </p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  {dashboardMetrics.profitMargin.toFixed(1)}% هامش ربح
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">إجمالي الطلبات</p>
                <p className="text-2xl font-bold text-blue-900">{dashboardMetrics.totalOrders}</p>
                <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                  <Users className="h-3 w-3" />
                  {dashboardMetrics.totalCustomers} عميل
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700">صافي الربح</p>
                <p className="text-2xl font-bold text-emerald-900">
                  {formatCurrency(dashboardMetrics.netProfit)}
                </p>
                <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                  <Package className="h-3 w-3" />
                  {dashboardMetrics.totalItems} قطعة
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">متوسط الطلب</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(dashboardMetrics.avgOrderValue)}
                </p>
                <p className="text-xs text-purple-600 flex items-center gap-1 mt-1">
                  <BarChart3 className="h-3 w-3" />
                  قيمة متوسطة
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Cards */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
        <Card className="border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-yellow-600" />
              <div>
                <p className="text-sm text-yellow-700">قيد المراجعة</p>
                <p className="text-xl font-bold text-yellow-900">{dashboardMetrics.pendingOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Truck className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-sm text-blue-700">تم الشحن</p>
                <p className="text-xl font-bold text-blue-900">{dashboardMetrics.shippedOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-sm text-green-700">مكتملة</p>
                <p className="text-xl font-bold text-green-900">{dashboardMetrics.completedOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <p className="text-sm text-red-700">ملغاة</p>
                <p className="text-xl font-bold text-red-900">{dashboardMetrics.cancelledOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {/* Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              اتجاه المبيعات (آخر 7 أيام)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={dashboardMetrics.salesByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    const numValue = typeof value === 'number' ? value : Number(value) || 0;
                    return [
                      name === 'sales' ? formatCurrency(numValue) : numValue,
                      name === 'sales' ? 'المبيعات' : name === 'orders' ? 'الطلبات' : 'الربح'
                    ];
                  }}
                />
                <Area type="monotone" dataKey="sales" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                <Area type="monotone" dataKey="profit" stackId="2" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              توزيع حالات الطلبات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={dashboardMetrics.revenueByStatus}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  label={({ status, percentage }) => `${status}: ${percentage.toFixed(1)}%`}
                >
                  {dashboardMetrics.revenueByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              أكثر المنتجات مبيعاً
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardMetrics.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{index + 1}</Badge>
                    <span className="font-medium text-sm">{product.name}</span>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm">{product.quantity} قطعة</div>
                    <div className="text-xs text-muted-foreground">{formatCurrency(product.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Governorates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              أعلى المحافظات مبيعاً
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardMetrics.topGovernorates.map((gov, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{index + 1}</Badge>
                    <span className="font-medium text-sm">{gov.name}</span>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm">{gov.orders} طلب</div>
                    <div className="text-xs text-muted-foreground">{formatCurrency(gov.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
