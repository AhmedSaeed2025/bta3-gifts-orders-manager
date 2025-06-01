
import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { formatCurrency, generateMonthlyReport, calculateTotals, exportToExcel } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DownloadCloud, TrendingUp, TrendingDown, FileText } from "lucide-react";

const ProfitReport = () => {
  const { orders, loading } = useSupabaseOrders();
  
  // Ensure orders is an array
  const safeOrders = Array.isArray(orders) ? orders : [];
  
  const monthlyReport = useMemo(() => generateMonthlyReport(safeOrders), [safeOrders]);
  const { totalCost, totalSales, netProfit } = useMemo(() => calculateTotals(safeOrders), [safeOrders]);

  // Prepare data for chart
  const chartData = useMemo(() => {
    return Object.entries(monthlyReport).map(([month, products]) => {
      let monthlyCost = 0;
      let monthlySales = 0;
      
      Object.values(products).forEach(data => {
        monthlyCost += data.totalCost;
        monthlySales += data.totalSales;
      });
      
      return {
        name: month,
        تكاليف: monthlyCost,
        مبيعات: monthlySales,
        أرباح: monthlySales - monthlyCost
      };
    });
  }, [monthlyReport]);

  const handleExport = () => {
    exportToExcel("profitReportTable", "تقرير_الربح");
  };

  // Fixed: type safe formatter function
  const tooltipFormatter = (value: any) => {
    // Make sure value is a number before calling toFixed
    if (typeof value === 'number') {
      return `${value.toFixed(2)} جنيه`;
    }
    return `${value} جنيه`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gift-primary mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">جاري تحميل تقرير الأرباح...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <FileText className="h-5 w-5" />
          تقرير الأرباح والتكاليف
        </CardTitle>
        <Button 
          onClick={handleExport}
          className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
        >
          <DownloadCloud className="h-4 w-4" />
          تصدير إلى Excel
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-red-50 dark:bg-red-900/30">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <p className="text-lg font-medium">إجمالي التكاليف</p>
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalCost)}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-50 dark:bg-blue-900/30">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <p className="text-lg font-medium">إجمالي المبيعات</p>
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalSales)}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50 dark:bg-green-900/30">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <p className="text-lg font-medium">صافي الربح</p>
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(netProfit)}</p>
            </CardContent>
          </Card>
        </div>

        {chartData.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">رسم بياني للأرباح والتكاليف</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={tooltipFormatter} />
                  <Legend />
                  <Bar dataKey="تكاليف" fill="#ef4444" />
                  <Bar dataKey="مبيعات" fill="#3b82f6" />
                  <Bar dataKey="أرباح" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        <h3 className="text-lg font-medium mb-2">تفاصيل الأرباح والتكاليف حسب المنتج والشهر</h3>
        <div className="overflow-x-auto">
          <table id="profitReportTable" className="gift-table">
            <thead>
              <tr>
                <th>الشهر</th>
                <th>نوع المنتج</th>
                <th>إجمالي التكاليف</th>
                <th>إجمالي المبيعات</th>
                <th>صافي الربح</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(monthlyReport).length > 0 ? (
                Object.entries(monthlyReport).flatMap(([month, products]) =>
                  Object.entries(products).map(([productType, data], index) => (
                    <tr key={`${month}-${productType}`}>
                      <td>{month}</td>
                      <td>{productType}</td>
                      <td>{formatCurrency(data.totalCost)}</td>
                      <td>{formatCurrency(data.totalSales)}</td>
                      <td>{formatCurrency(data.totalSales - data.totalCost)}</td>
                    </tr>
                  ))
                )
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-4">لا توجد بيانات متاحة</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfitReport;
