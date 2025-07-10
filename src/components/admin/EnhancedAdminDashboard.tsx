
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Users,
  Truck,
  AlertCircle,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Filter,
  RefreshCw
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';

const EnhancedAdminDashboard = () => {
  const { user } = useAuth();

  // Fetch orders data
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['dashboard-orders'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('user_id', user.id)
        .order('date_created', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Fetch products data
  const { data: products = [] } = useQuery({
    queryKey: ['dashboard-products'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_sizes (*)
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Calculate dashboard statistics
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const completedOrders = orders.filter(order => order.status === 'completed').length;
  const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
  
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalProfit = orders.reduce((sum, order) => sum + (order.profit || 0), 0);
  const totalShipping = orders.reduce((sum, order) => sum + (order.shipping_cost || 0), 0);
  
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  const activeProducts = products.filter(p => p.is_active).length;
  const totalProducts = products.length;

  // Prepare chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const dailyStats = last7Days.map(date => {
    const dayOrders = orders.filter(order => 
      order.date_created?.split('T')[0] === date
    );
    
    return {
      date: new Date(date).toLocaleDateString('ar-EG', { weekday: 'short' }),
      orders: dayOrders.length,
      revenue: dayOrders.reduce((sum, order) => sum + (order.total || 0), 0),
      profit: dayOrders.reduce((sum, order) => sum + (order.profit || 0), 0)
    };
  });

  const statusData = [
    { name: 'مكتمل', value: completedOrders, color: '#10B981' },
    { name: 'قيد الانتظار', value: pendingOrders, color: '#F59E0B' },
    { name: 'ملغي', value: cancelledOrders, color: '#EF4444' }
  ];

  const paymentMethodStats = orders.reduce((acc, order) => {
    const method = order.payment_method || 'غير محدد';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const paymentData = Object.entries(paymentMethodStats).map(([method, count]) => ({
    method,
    count,
    percentage: ((count / totalOrders) * 100).toFixed(1)
  }));

  // Top performing products
  const productPerformance = products.map(product => {
    const productOrders = orders.flatMap(order => 
      order.order_items?.filter(item => item.product_type === product.name) || []
    );
    
    const totalSold = productOrders.reduce((sum, item) => sum + item.quantity, 0);
    const revenue = productOrders.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    return {
      name: product.name,
      sold: totalSold,
      revenue,
      sizes: product.product_sizes?.length || 0
    };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  if (ordersLoading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            لوحة التحكم المتقدمة
          </h1>
          <p className="text-muted-foreground">نظرة شاملة على أداء مشروعك</p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 ml-1" />
          تحديث البيانات
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">إجمالي الطلبات</p>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{totalOrders}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">إجمالي الإيرادات</p>
                <p className="text-xl font-bold text-green-700 dark:text-green-300">{formatCurrency(totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">صافي الربح</p>
                <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{formatCurrency(totalProfit)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">متوسط قيمة الطلب</p>
                <p className="text-xl font-bold text-orange-700 dark:text-orange-300">{formatCurrency(averageOrderValue)}</p>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              الأداء اليومي - آخر 7 أيام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    name === 'orders' ? value : formatCurrency(Number(value)),
                    name === 'orders' ? 'طلبات' : name === 'revenue' ? 'إيرادات' : 'أرباح'
                  ]}
                />
                <Line type="monotone" dataKey="orders" stroke="#3B82F6" name="طلبات" />
                <Line type="monotone" dataKey="revenue" stroke="#10B981" name="إيرادات" />
                <Line type="monotone" dataKey="profit" stroke="#8B5CF6" name="أرباح" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              توزيع حالة الطلبات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-3 gap-2 mt-4">
              {statusData.map((item) => (
                <div key={item.name} className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-xs">{item.name}</span>
                  </div>
                  <p className="font-bold text-sm">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">طرق الدفع المستخدمة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentData.map((payment, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{payment.method}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{payment.count}</Badge>
                  <span className="text-xs text-muted-foreground">{payment.percentage}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">أفضل المنتجات مبيعاً</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {productPerformance.map((product, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{product.name}</span>
                  <Badge variant="outline">{product.sold} قطعة</Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(product.revenue)}</span>
                  <span>{product.sizes} مقاس</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">إجراءات سريعة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">طلبات قيد الانتظار</span>
                </div>
                <p className="text-lg font-bold text-yellow-700">{pendingOrders}</p>
              </div>
              
              <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">منتجات نشطة</span>
                </div>
                <p className="text-lg font-bold text-blue-700">{activeProducts}/{totalProducts}</p>
              </div>
              
              <div className="p-3 bg-green-50 dark:bg-green-950/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Truck className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">إجمالي الشحن</span>
                </div>
                <p className="text-lg font-bold text-green-700">{formatCurrency(totalShipping)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">مؤشرات الأداء الرئيسية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{((completedOrders / totalOrders) * 100 || 0).toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">معدل إتمام الطلبات</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{((totalProfit / totalRevenue) * 100 || 0).toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">هامش الربح</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalRevenue / 30)}</div>
              <div className="text-xs text-muted-foreground">متوسط الإيرادات اليومية</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{(totalOrders / 30).toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">متوسط الطلبات اليومية</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">{((cancelledOrders / totalOrders) * 100 || 0).toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">معدل الإلغاء</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedAdminDashboard;
