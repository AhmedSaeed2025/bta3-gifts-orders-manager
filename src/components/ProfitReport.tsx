
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useIsMobile } from "@/hooks/use-mobile";

const ProfitReport = () => {
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

  const profitData = useMemo(() => {
    const monthlyData: { [key: string]: { revenue: number; cost: number; profit: number } } = {};
    
    filteredOrders.forEach(order => {
      const date = new Date(order.dateCreated);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, cost: 0, profit: 0 };
      }
      
      // Calculate total cost for this order
      const totalCost = order.items.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
      
      // Revenue is subtotal (before shipping and deposit adjustments)
      const revenue = order.items.reduce((sum, item) => {
        const discountedPrice = item.price - (item.itemDiscount || 0);
        return sum + discountedPrice * item.quantity;
      }, 0);
      
      // Profit = Revenue - Cost - Shipping (العربون لا يؤثر على الربح)
      const profit = revenue - totalCost - order.shippingCost;
      
      monthlyData[monthKey].revenue += revenue;
      monthlyData[monthKey].cost += totalCost + order.shippingCost;
      monthlyData[monthKey].profit += profit;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        cost: data.cost,
        profit: data.profit
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredOrders]);

  const totalProfitData = useMemo(() => {
    const totalRevenue = profitData.reduce((sum, item) => sum + item.revenue, 0);
    const totalCost = profitData.reduce((sum, item) => sum + item.cost, 0);
    const totalProfit = profitData.reduce((sum, item) => sum + item.profit, 0);

    return [
      { name: 'الإيرادات', value: totalRevenue, color: '#22c55e' },
      { name: 'التكاليف', value: totalCost, color: '#ef4444' },
      { name: 'صافي الربح', value: totalProfit, color: '#3b82f6' }
    ];
  }, [profitData]);

  const COLORS = ['#22c55e', '#ef4444', '#3b82f6'];

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

      <Card>
        <CardHeader>
          <CardTitle className={`${isMobile ? "text-xs" : "text-sm"}`}>
            {truncateText("تقرير الأرباح", isMobile ? 15 : 25)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid ${isMobile ? "grid-cols-1 gap-2" : "grid-cols-1 md:grid-cols-3 gap-4"}`}>
            {totalProfitData.map((item, index) => (
              <Card key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <CardContent className={`${isMobile ? "p-3" : "p-6"}`}>
                  <div className="text-center">
                    <h3 className={`font-semibold mb-2 ${isMobile ? "text-xs" : "text-sm"}`} style={{ color: item.color }}>
                      {truncateText(item.name, isMobile ? 8 : 15)}
                    </h3>
                    <p className={`font-bold ${isMobile ? "text-sm" : "text-xl"}`} style={{ color: item.color }}>
                      {formatCurrency(item.value)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {profitData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className={`${isMobile ? "text-xs" : "text-sm"}`}>
              {truncateText("الأرباح الشهرية", isMobile ? 15 : 25)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`${isMobile ? "h-48" : "h-64"}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profitData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    fontSize={isMobile ? 10 : 12}
                  />
                  <YAxis fontSize={isMobile ? 10 : 12} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), '']}
                    labelStyle={{ fontSize: isMobile ? '10px' : '12px' }}
                    contentStyle={{ fontSize: isMobile ? '10px' : '12px' }}
                  />
                  <Bar dataKey="revenue" fill="#22c55e" name="الإيرادات" />
                  <Bar dataKey="cost" fill="#ef4444" name="التكاليف" />
                  <Bar dataKey="profit" fill="#3b82f6" name="صافي الربح" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {totalProfitData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className={`${isMobile ? "text-xs" : "text-sm"}`}>
              {truncateText("توزيع الأرباح", isMobile ? 15 : 25)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`${isMobile ? "h-48" : "h-64"}`}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={totalProfitData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                    outerRadius={isMobile ? 60 : 80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {totalProfitData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ fontSize: isMobile ? '10px' : '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfitReport;
