
import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrders } from "@/context/OrderContext";
import { formatCurrency, generateMonthlyReport, calculateTotals, exportToExcel } from "@/lib/utils";

const ProfitReport = () => {
  const { orders } = useOrders();
  
  // Ensure orders is an array
  const safeOrders = Array.isArray(orders) ? orders : [];
  
  const monthlyReport = useMemo(() => generateMonthlyReport(safeOrders), [safeOrders]);
  const { totalCost, totalSales, netProfit } = useMemo(() => calculateTotals(safeOrders), [safeOrders]);

  const handleExport = () => {
    exportToExcel("profitReportTable", "تقرير_الربح");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl">تقرير الأرباح والتكاليف</CardTitle>
        <Button 
          onClick={handleExport}
          className="bg-green-600 hover:bg-green-700"
        >
          تصدير إلى Excel
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-red-50">
            <CardContent className="pt-6">
              <p className="text-lg font-medium">إجمالي التكاليف</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalCost)}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-50">
            <CardContent className="pt-6">
              <p className="text-lg font-medium">إجمالي المبيعات</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalSales)}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50">
            <CardContent className="pt-6">
              <p className="text-lg font-medium">صافي الربح</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(netProfit)}</p>
            </CardContent>
          </Card>
        </div>
        
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
