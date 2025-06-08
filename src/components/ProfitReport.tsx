
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useIsMobile } from "@/hooks/use-mobile";

const ProfitReport = () => {
  const { orders } = useSupabaseOrders();
  const isMobile = useIsMobile();

  const profitData = useMemo(() => {
    const monthlyData: { [key: string]: { revenue: number; cost: number; profit: number } } = {};
    
    orders.forEach(order => {
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
  }, [orders]);

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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className={`${isMobile ? "text-sm truncate" : "text-lg"}`}>
            تقرير الأرباح
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid ${isMobile ? "grid-cols-1 gap-2" : "grid-cols-1 md:grid-cols-3 gap-4"}`}>
            {totalProfitData.map((item, index) => (
              <Card key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <CardContent className={`${isMobile ? "p-3" : "p-6"}`}>
                  <div className="text-center">
                    <h3 className={`font-semibold mb-2 ${isMobile ? "text-xs" : "text-sm"}`} style={{ color: item.color }}>
                      {item.name}
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
            <CardTitle className={`${isMobile ? "text-sm" : "text-lg"}`}>
              الأرباح الشهرية
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
            <CardTitle className={`${isMobile ? "text-sm" : "text-lg"}`}>
              توزيع الأرباح
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
