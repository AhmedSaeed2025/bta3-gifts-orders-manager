
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useIsMobile } from "@/hooks/use-mobile";

const SummaryReport = () => {
  const { orders } = useSupabaseOrders();
  const isMobile = useIsMobile();

  // Calculate totals
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.status === "pending").length;
  const completedOrders = orders.filter(order => order.status === "completed").length;
  const cancelledOrders = orders.filter(order => order.status === "cancelled").length;
  
  // Calculate revenue (subtotal before shipping and deposit adjustments)
  const totalRevenue = orders.reduce((sum, order) => {
    const orderRevenue = order.items.reduce((itemSum, item) => {
      const discountedPrice = item.price - (item.itemDiscount || 0);
      return itemSum + discountedPrice * item.quantity;
    }, 0);
    return sum + orderRevenue;
  }, 0);
  
  // Calculate total costs
  const totalCosts = orders.reduce((sum, order) => {
    const orderCosts = order.items.reduce((itemSum, item) => {
      return itemSum + (item.cost * item.quantity);
    }, 0);
    return sum + orderCosts + order.shippingCost;
  }, 0);
  
  // Calculate total profit (Revenue - Costs - Shipping, العربون لا يؤثر على الربح)
  const totalProfit = totalRevenue - totalCosts;
  
  const totalShipping = orders.reduce((sum, order) => sum + order.shippingCost, 0);
  const totalDeposits = orders.reduce((sum, order) => sum + order.deposit, 0);

  // Monthly data for chart
  const monthlyData = orders.reduce((acc: any[], order) => {
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
    { title: "الطلبات المكتملة", value: completedOrders, color: "text-green-600" },
    { title: "الطلبات الملغية", value: cancelledOrders, color: "text-red-600" },
  ];

  const financialCards = [
    { title: "إجمالي الإيرادات", value: formatCurrency(totalRevenue), color: "text-green-600" },
    { title: "إجمالي التكاليف", value: formatCurrency(totalCosts), color: "text-red-600" },
    { title: "صافي الربح", value: formatCurrency(totalProfit), color: "text-blue-600" },
    { title: "إجمالي الشحن", value: formatCurrency(totalShipping), color: "text-purple-600" },
    { title: "إجمالي العرابين", value: formatCurrency(totalDeposits), color: "text-orange-600" },
  ];

  return (
    <div className="space-y-4">
      {/* Order Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className={`${isMobile ? "text-sm truncate" : "text-lg"}`}>
            إحصائيات الطلبات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid ${isMobile ? "grid-cols-2 gap-2" : "grid-cols-2 md:grid-cols-4 gap-4"}`}>
            {statsCards.map((card, index) => (
              <Card key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <CardContent className={`${isMobile ? "p-3" : "p-6"}`}>
                  <div className="text-center">
                    <h3 className={`font-semibold mb-2 ${isMobile ? "text-xs" : "text-sm"}`}>
                      {card.title}
                    </h3>
                    <p className={`font-bold ${card.color} ${isMobile ? "text-lg" : "text-2xl"}`}>
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
          <CardTitle className={`${isMobile ? "text-sm truncate" : "text-lg"}`}>
            الإحصائيات المالية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid ${isMobile ? "grid-cols-1 gap-2" : "grid-cols-1 md:grid-cols-3 gap-4"}`}>
            {financialCards.map((card, index) => (
              <Card key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <CardContent className={`${isMobile ? "p-3" : "p-6"}`}>
                  <div className="text-center">
                    <h3 className={`font-semibold mb-2 ${isMobile ? "text-xs" : "text-sm"}`}>
                      {card.title}
                    </h3>
                    <p className={`font-bold ${card.color} ${isMobile ? "text-sm" : "text-xl"}`}>
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
            <CardTitle className={`${isMobile ? "text-sm" : "text-lg"}`}>
              الطلبات والإيرادات الشهرية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`${isMobile ? "h-48" : "h-64"}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    fontSize={isMobile ? 10 : 12}
                  />
                  <YAxis fontSize={isMobile ? 10 : 12} />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'revenue') {
                        return [formatCurrency(value), 'الإيرادات'];
                      }
                      return [value, 'عدد الطلبات'];
                    }}
                    labelStyle={{ fontSize: isMobile ? '10px' : '12px' }}
                    contentStyle={{ fontSize: isMobile ? '10px' : '12px' }}
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
