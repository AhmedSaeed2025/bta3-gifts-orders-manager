
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useIsMobile } from "@/hooks/use-mobile";

const SummaryReport = () => {
  const { orders } = useSupabaseOrders();
  const isMobile = useIsMobile();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");

  // Apply filters
  const filteredOrders = orders.filter(order => {
    const statusMatch = statusFilter === "all" || order.status === statusFilter;
    const paymentMatch = paymentFilter === "all" || order.paymentMethod === paymentFilter;
    const dateMatch = !dateFilter || order.dateCreated.includes(dateFilter);
    
    return statusMatch && paymentMatch && dateMatch;
  });

  // Calculate totals from filtered orders
  const totalOrders = filteredOrders.length;
  const pendingOrders = filteredOrders.filter(order => order.status === "pending").length;
  const shippedOrders = filteredOrders.filter(order => order.status === "shipped").length;
  const confirmedOrders = filteredOrders.filter(order => order.status === "confirmed").length;
  
  // Calculate revenue (subtotal before shipping and deposit adjustments)
  const totalRevenue = filteredOrders.reduce((sum, order) => {
    const orderRevenue = order.items.reduce((itemSum, item) => {
      const discountedPrice = item.price - (item.itemDiscount || 0);
      return itemSum + discountedPrice * item.quantity;
    }, 0);
    return sum + orderRevenue;
  }, 0);
  
  // Calculate total costs
  const totalCosts = filteredOrders.reduce((sum, order) => {
    const orderCosts = order.items.reduce((itemSum, item) => {
      return itemSum + (item.cost * item.quantity);
    }, 0);
    return sum + orderCosts + order.shippingCost;
  }, 0);
  
  // Calculate total profit (Revenue - Costs - Shipping, العربون لا يؤثر على الربح)
  const totalProfit = totalRevenue - totalCosts;
  
  const totalShipping = filteredOrders.reduce((sum, order) => sum + order.shippingCost, 0);
  const totalDeposits = filteredOrders.reduce((sum, order) => sum + order.deposit, 0);

  // Monthly data for chart
  const monthlyData = filteredOrders.reduce((acc: any[], order) => {
    const date = new Date(order.dateCreated);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const existingMonth = acc.find(item => item.month === monthKey);
    
    const orderRevenue = order.items.reduce((itemSum, item) => {
      const discountedPrice = item.price - (item.itemDiscount || 0);
      return itemSum + discountedPrice * item.quantity;
    }, 0);
    
    if (existingMonth) {
      existingMonth.orders += 1;
      existingMonth.revenue += orderRevenue;
    } else {
      acc.push({
        month: monthKey,
        orders: 1,
        revenue: orderRevenue
      });
    }
    
    return acc;
  }, []).sort((a, b) => a.month.localeCompare(b.month));

  const statsCards = [
    { title: "إجمالي الطلبات", value: totalOrders, color: "text-blue-600" },
    { title: "الطلبات المنتظرة", value: pendingOrders, color: "text-yellow-600" },
    { title: "الطلبات المؤكدة", value: confirmedOrders, color: "text-green-600" },
    { title: "الطلبات المشحونة", value: shippedOrders, color: "text-purple-600" },
  ];

  const financialCards = [
    { title: "إجمالي الإيرادات", value: formatCurrency(totalRevenue), color: "text-green-600" },
    { title: "إجمالي التكاليف", value: formatCurrency(totalCosts), color: "text-red-600" },
    { title: "صافي الربح", value: formatCurrency(totalProfit), color: "text-blue-600" },
    { title: "إجمالي الشحن", value: formatCurrency(totalShipping), color: "text-purple-600" },
    { title: "إجمالي العرابين", value: formatCurrency(totalDeposits), color: "text-orange-600" },
  ];

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className={`${isMobile ? "text-xs" : "text-sm"}`}>
            {truncateText("فلاتر التقرير", isMobile ? 15 : 25)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"}`}>
            <div className="space-y-2">
              <Label className={`${isMobile ? "text-xs" : "text-sm"}`}>حالة الطلب</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={`${isMobile ? "h-8 text-xs" : "h-10"}`}>
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
              <Label className={`${isMobile ? "text-xs" : "text-sm"}`}>طريقة الدفع</Label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className={`${isMobile ? "h-8 text-xs" : "h-10"}`}>
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
              <Label className={`${isMobile ? "text-xs" : "text-sm"}`}>التاريخ</Label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className={`${isMobile ? "h-8 text-xs" : "h-10"}`}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className={`${isMobile ? "text-xs" : "text-sm"}`}>
            {truncateText("إحصائيات الطلبات", isMobile ? 15 : 25)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid ${isMobile ? "grid-cols-2 gap-2" : "grid-cols-2 md:grid-cols-4 gap-4"}`}>
            {statsCards.map((card, index) => (
              <Card key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <CardContent className={`${isMobile ? "p-2" : "p-4"}`}>
                  <div className="text-center">
                    <h3 className={`font-semibold mb-2 ${isMobile ? "text-xs" : "text-xs"}`}>
                      {truncateText(card.title, isMobile ? 8 : 15)}
                    </h3>
                    <p className={`font-bold ${card.color} ${isMobile ? "text-sm" : "text-lg"}`}>
                      {card.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className={`${isMobile ? "text-xs" : "text-sm"}`}>
            {truncateText("الإحصائيات المالية", isMobile ? 15 : 25)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid ${isMobile ? "grid-cols-1 gap-2" : "grid-cols-1 md:grid-cols-3 gap-4"}`}>
            {financialCards.map((card, index) => (
              <Card key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <CardContent className={`${isMobile ? "p-2" : "p-4"}`}>
                  <div className="text-center">
                    <h3 className={`font-semibold mb-2 ${isMobile ? "text-xs" : "text-xs"}`}>
                      {truncateText(card.title, isMobile ? 8 : 15)}
                    </h3>
                    <p className={`font-bold ${card.color} ${isMobile ? "text-xs" : "text-sm"}`}>
                      {card.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Chart */}
      {monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className={`${isMobile ? "text-xs" : "text-sm"}`}>
              {truncateText("الطلبات والإيرادات الشهرية", isMobile ? 15 : 25)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`${isMobile ? "h-48" : "h-64"}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    fontSize={isMobile ? 8 : 10}
                  />
                  <YAxis fontSize={isMobile ? 8 : 10} />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'revenue') {
                        return [formatCurrency(value), 'الإيرادات'];
                      }
                      return [value, 'عدد الطلبات'];
                    }}
                    labelStyle={{ fontSize: isMobile ? '8px' : '10px' }}
                    contentStyle={{ fontSize: isMobile ? '8px' : '10px' }}
                  />
                  <Bar dataKey="orders" fill="#3b82f6" name="orders" />
                  <Bar dataKey="revenue" fill="#22c55e" name="revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SummaryReport;
