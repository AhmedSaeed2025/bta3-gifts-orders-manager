
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { formatCurrency } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  FileBarChart, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Truck, 
  Users, 
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const ImprovedSummaryReport = () => {
  const { orders, loading } = useSupabaseOrders();
  const isMobile = useIsMobile();
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const safeOrders = Array.isArray(orders) ? orders : [];
  
  // Filter orders based on selected filters
  const filteredOrders = useMemo(() => {
    return safeOrders.filter(order => {
      const orderDate = new Date(order.dateCreated);
      const orderYear = orderDate.getFullYear().toString();
      const orderMonth = (orderDate.getMonth() + 1).toString().padStart(2, '0');
      
      if (filterYear !== "all" && orderYear !== filterYear) return false;
      if (filterMonth !== "all" && orderMonth !== filterMonth) return false;
      
      return true;
    });
  }, [safeOrders, filterMonth, filterYear]);

  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    if (!filteredOrders.length) {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        totalCost: 0,
        totalShipping: 0,
        totalDiscounts: 0,
        totalDeposits: 0,
        netProfit: 0,
        avgOrderValue: 0,
        totalItems: 0,
        uniqueCustomers: 0,
        pendingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        topProducts: [],
        monthlyBreakdown: {}
      };
    }

    let totalRevenue = 0;
    let totalCost = 0;
    let totalShipping = 0;
    let totalDiscounts = 0;
    let totalDeposits = 0;
    let totalItems = 0;
    let pendingOrders = 0;
    let completedOrders = 0;
    let cancelledOrders = 0;
    
    const customerSet = new Set();
    const productCounts = new Map();
    const monthlyData = new Map();

    filteredOrders.forEach(order => {
      totalRevenue += order.total;
      totalShipping += order.shippingCost || 0;
      totalDiscounts += order.discount || 0;
      totalDeposits += order.deposit || 0;
      
      customerSet.add(order.clientName + order.phone);
      
      // Status counts
      if (order.status === 'pending') pendingOrders++;
      else if (order.status === 'delivered') completedOrders++;
      else if (order.status === 'cancelled') cancelledOrders++;
      
      // Monthly breakdown
      const monthKey = new Date(order.dateCreated).toLocaleDateString('ar-EG', { 
        year: 'numeric', 
        month: 'long' 
      });
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { orders: 0, revenue: 0, cost: 0, profit: 0 });
      }
      const monthData = monthlyData.get(monthKey);
      monthData.orders++;
      monthData.revenue += order.total;
      
      // Process items
      order.items?.forEach(item => {
        totalCost += item.cost * item.quantity;
        totalItems += item.quantity;
        
        const productKey = `${item.productType} - ${item.size}`;
        productCounts.set(productKey, (productCounts.get(productKey) || 0) + item.quantity);
        
        monthData.cost += item.cost * item.quantity;
      });
      
      monthData.profit = monthData.revenue - monthData.cost;
    });

    const netProfit = totalRevenue - totalCost - totalShipping;
    const avgOrderValue = totalRevenue / filteredOrders.length;
    
    const topProducts = Array.from(productCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([product, count]) => ({ product, count }));

    return {
      totalOrders: filteredOrders.length,
      totalRevenue,
      totalCost,
      totalShipping,
      totalDiscounts,
      totalDeposits,
      netProfit,
      avgOrderValue,
      totalItems,
      uniqueCustomers: customerSet.size,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      topProducts,
      monthlyBreakdown: Object.fromEntries(monthlyData)
    };
  }, [filteredOrders]);

  // Get available years and months for filters
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    safeOrders.forEach(order => {
      const year = new Date(order.dateCreated).getFullYear().toString();
      years.add(year);
    });
    return Array.from(years).sort();
  }, [safeOrders]);

  const toggleCardExpansion = (cardId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId);
    } else {
      newExpanded.add(cardId);
    }
    setExpandedCards(newExpanded);
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mx-auto"></div>
            <p className="text-lg font-medium">جاري تحميل التقرير...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-green-600 rounded-xl">
              <FileBarChart className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">تقرير الطلبات المطور</CardTitle>
              <p className="text-muted-foreground text-sm">تحليل شامل لجميع البيانات المالية والإحصائية</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">فلترة البيانات</span>
          </div>
          <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger>
                <SelectValue placeholder="اختر السنة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع السنوات</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الشهر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الشهور</SelectItem>
                <SelectItem value="01">يناير</SelectItem>
                <SelectItem value="02">فبراير</SelectItem>
                <SelectItem value="03">مارس</SelectItem>
                <SelectItem value="04">أبريل</SelectItem>
                <SelectItem value="05">مايو</SelectItem>
                <SelectItem value="06">يونيو</SelectItem>
                <SelectItem value="07">يوليو</SelectItem>
                <SelectItem value="08">أغسطس</SelectItem>
                <SelectItem value="09">سبتمبر</SelectItem>
                <SelectItem value="10">أكتوبر</SelectItem>
                <SelectItem value="11">نوفمبر</SelectItem>
                <SelectItem value="12">ديسمبر</SelectItem>
              </SelectContent>
            </Select>
            
            {(filterMonth !== "all" || filterYear !== "all") && (
              <button
                onClick={() => {
                  setFilterMonth("all");
                  setFilterYear("all");
                }}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                إزالة الفلاتر
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Statistics Grid */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'}`}>
        {/* Total Orders */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">إجمالي الطلبات</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalOrders}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">إجمالي المبيعات</p>
                <p className="text-xl font-bold text-green-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-700">صافي الربح</p>
                <p className="text-xl font-bold text-emerald-900">{formatCurrency(stats.netProfit)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        {/* Average Order Value */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">متوسط قيمة الطلب</p>
                <p className="text-xl font-bold text-purple-900">{formatCurrency(stats.avgOrderValue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Financial Breakdown */}
      <Collapsible>
        <Card>
          <CollapsibleTrigger 
            className="w-full p-0"
            onClick={() => toggleCardExpansion('financial')}
          >
            <CardHeader className="hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  التفصيل المالي الكامل
                </CardTitle>
                {expandedCards.has('financial') ? 
                  <ChevronUp className="h-5 w-5" /> : 
                  <ChevronDown className="h-5 w-5" />
                }
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-sm text-red-700">إجمالي التكلفة</p>
                  <p className="text-xl font-bold text-red-900">{formatCurrency(stats.totalCost)}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <p className="text-sm text-orange-700">مصاريف الشحن</p>
                  <p className="text-xl font-bold text-orange-900">{formatCurrency(stats.totalShipping)}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-700">إجمالي الخصومات</p>
                  <p className="text-xl font-bold text-yellow-900">{formatCurrency(stats.totalDiscounts)}</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <p className="text-sm text-indigo-700">إجمالي العرابين</p>
                  <p className="text-xl font-bold text-indigo-900">{formatCurrency(stats.totalDeposits)}</p>
                </div>
                <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
                  <p className="text-sm text-pink-700">إجمالي القطع</p>
                  <p className="text-xl font-bold text-pink-900">{stats.totalItems}</p>
                </div>
                <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                  <p className="text-sm text-cyan-700">عدد العملاء</p>
                  <p className="text-xl font-bold text-cyan-900">{stats.uniqueCustomers}</p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Order Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            حالة الطلبات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm text-yellow-700">قيد المراجعة</span>
              <Badge className="bg-yellow-500 text-white">{stats.pendingOrders}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-green-700">مكتملة</span>
              <Badge className="bg-green-500 text-white">{stats.completedOrders}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-sm text-red-700">ملغاة</span>
              <Badge className="bg-red-500 text-white">{stats.cancelledOrders}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Products */}
      {stats.topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              أكثر المنتجات مبيعاً
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topProducts.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{index + 1}</Badge>
                    <span className="font-medium">{item.product}</span>
                  </div>
                  <Badge className="bg-blue-500 text-white">{item.count} قطعة</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImprovedSummaryReport;
