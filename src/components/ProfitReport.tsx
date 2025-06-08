
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { useIsMobile } from "@/hooks/use-mobile";
import { TrendingUp, TrendingDown, DollarSign, Package, Users, Calendar } from "lucide-react";

const ProfitReport = () => {
  const { orders } = useSupabaseOrders();
  const isMobile = useIsMobile();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [periodFilter, setPeriodFilter] = useState<string>("month");

  // Apply filters
  const filteredOrders = orders.filter(order => {
    const statusMatch = statusFilter === "all" || order.status === statusFilter;
    const paymentMatch = paymentFilter === "all" || order.paymentMethod === paymentFilter;
    const dateMatch = !dateFilter || order.dateCreated.includes(dateFilter);
    
    return statusMatch && paymentMatch && dateMatch;
  });

  const profitAnalytics = useMemo(() => {
    const analytics = {
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
      totalOrders: filteredOrders.length,
      avgOrderValue: 0,
      profitMargin: 0,
      topProducts: {} as { [key: string]: { quantity: number; revenue: number; profit: number } },
      monthlyTrend: {} as { [key: string]: { revenue: number; cost: number; profit: number; orders: number } }
    };

    filteredOrders.forEach(order => {
      const revenue = order.items.reduce((sum, item) => {
        const discountedPrice = item.price - (item.itemDiscount || 0);
        return sum + discountedPrice * item.quantity;
      }, 0);
      
      const cost = order.items.reduce((sum, item) => sum + (item.cost * item.quantity), 0) + order.shippingCost;
      const profit = revenue - cost;
      
      analytics.totalRevenue += revenue;
      analytics.totalCost += cost;
      analytics.totalProfit += profit;
      
      // Track products
      order.items.forEach(item => {
        if (!analytics.topProducts[item.productType]) {
          analytics.topProducts[item.productType] = { quantity: 0, revenue: 0, profit: 0 };
        }
        const discountedPrice = item.price - (item.itemDiscount || 0);
        analytics.topProducts[item.productType].quantity += item.quantity;
        analytics.topProducts[item.productType].revenue += discountedPrice * item.quantity;
        analytics.topProducts[item.productType].profit += (discountedPrice - item.cost) * item.quantity;
      });
      
      // Monthly trend
      const date = new Date(order.dateCreated);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!analytics.monthlyTrend[monthKey]) {
        analytics.monthlyTrend[monthKey] = { revenue: 0, cost: 0, profit: 0, orders: 0 };
      }
      
      analytics.monthlyTrend[monthKey].revenue += revenue;
      analytics.monthlyTrend[monthKey].cost += cost;
      analytics.monthlyTrend[monthKey].profit += profit;
      analytics.monthlyTrend[monthKey].orders += 1;
    });

    analytics.avgOrderValue = analytics.totalOrders > 0 ? analytics.totalRevenue / analytics.totalOrders : 0;
    analytics.profitMargin = analytics.totalRevenue > 0 ? (analytics.totalProfit / analytics.totalRevenue) * 100 : 0;

    return analytics;
  }, [filteredOrders]);

  const monthlyData = Object.entries(profitAnalytics.monthlyTrend)
    .map(([month, data]) => ({
      month,
      ...data
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const topProductsData = Object.entries(profitAnalytics.topProducts)
    .map(([product, data]) => ({
      name: product,
      ...data
    }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const MetricCard = ({ title, value, icon: Icon, trend, className = "" }: any) => (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
            {trend && (
              <div className={`flex items-center mt-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                <span className="text-sm">{Math.abs(trend).toFixed(1)}%</span>
              </div>
            )}
          </div>
          <div className="p-3 bg-gift-primary/10 rounded-full">
            <Icon className="h-6 w-6 text-gift-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6" dir="rtl">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            تقرير الأرباح المتقدم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">حالة الطلب</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">منتظر</SelectItem>
                  <SelectItem value="confirmed">مؤكد</SelectItem>
                  <SelectItem value="shipped">مشحون</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">طريقة الدفع</Label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر طريقة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الطرق</SelectItem>
                  <SelectItem value="كاش">كاش</SelectItem>
                  <SelectItem value="انستا باي">انستا باي</SelectItem>
                  <SelectItem value="فودافون كاش">فودافون كاش</SelectItem>
                  <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">التاريخ</Label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">الفترة</Label>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">أسبوعي</SelectItem>
                  <SelectItem value="month">شهري</SelectItem>
                  <SelectItem value="quarter">ربع سنوي</SelectItem>
                  <SelectItem value="year">سنوي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="إجمالي الإيرادات"
          value={formatCurrency(profitAnalytics.totalRevenue)}
          icon={DollarSign}
          className="border-r-4 border-r-green-500"
        />
        <MetricCard
          title="إجمالي التكاليف"
          value={formatCurrency(profitAnalytics.totalCost)}
          icon={Package}
          className="border-r-4 border-r-red-500"
        />
        <MetricCard
          title="صافي الربح"
          value={formatCurrency(profitAnalytics.totalProfit)}
          icon={TrendingUp}
          className="border-r-4 border-r-blue-500"
        />
        <MetricCard
          title="هامش الربح"
          value={`${profitAnalytics.profitMargin.toFixed(1)}%`}
          icon={Calendar}
          className="border-r-4 border-r-purple-500"
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <Users className="h-8 w-8 text-gift-primary mx-auto mb-2" />
              <h3 className="font-semibold text-lg">{profitAnalytics.totalOrders}</h3>
              <p className="text-sm text-gray-600">إجمالي الطلبات</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <DollarSign className="h-8 w-8 text-gift-primary mx-auto mb-2" />
              <h3 className="font-semibold text-lg">{formatCurrency(profitAnalytics.avgOrderValue)}</h3>
              <p className="text-sm text-gray-600">متوسط قيمة الطلب</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <Package className="h-8 w-8 text-gift-primary mx-auto mb-2" />
              <h3 className="font-semibold text-lg">{Object.keys(profitAnalytics.topProducts).length}</h3>
              <p className="text-sm text-gray-600">أنواع المنتجات</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">الاتجاه الشهري للأرباح</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), '']}
                    labelStyle={{ fontSize: '12px' }}
                  />
                  <Area dataKey="profit" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="صافي الربح" />
                  <Area dataKey="revenue" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} name="الإيرادات" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">أفضل المنتجات ربحاً</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProductsData.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{index + 1}</Badge>
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500">الكمية: {product.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{formatCurrency(product.profit)}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(product.revenue)} إيرادات</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">تحليل مفصل للأرباح الشهرية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), '']}
                  labelStyle={{ fontSize: '12px' }}
                />
                <Bar dataKey="revenue" fill="#22c55e" name="الإيرادات" />
                <Bar dataKey="cost" fill="#ef4444" name="التكاليف" />
                <Bar dataKey="profit" fill="#3b82f6" name="صافي الربح" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfitReport;
