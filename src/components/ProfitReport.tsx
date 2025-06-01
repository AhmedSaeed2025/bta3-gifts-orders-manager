
import React, { useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { formatCurrency, generateMonthlyReport, calculateTotals, exportToExcel } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DownloadCloud, TrendingUp, TrendingDown, FileText, Download } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";

const ProfitReport = () => {
  const { orders, loading } = useSupabaseOrders();
  const reportRef = useRef<HTMLDivElement>(null);
  
  const safeOrders = Array.isArray(orders) ? orders : [];
  
  const monthlyReport = useMemo(() => generateMonthlyReport(safeOrders), [safeOrders]);
  const { totalCost, totalSales, netProfit } = useMemo(() => calculateTotals(safeOrders), [safeOrders]);

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

  const handleExcelExport = () => {
    exportToExcel("profitReportTable", "Profit_Report");
  };

  const handlePDFExport = async () => {
    if (!reportRef.current) return;
    
    try {
      toast.info("جاري إنشاء ملف PDF...");
      
      reportRef.current.classList.add('pdf-export');
      
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: reportRef.current.scrollWidth,
        height: reportRef.current.scrollHeight,
        windowWidth: 794,
        windowHeight: 1123
      });
      
      reportRef.current.classList.remove('pdf-export');
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`تقرير_الأرباح_${new Date().toLocaleDateString('ar-EG')}.pdf`);
      toast.success("تم إنشاء ملف PDF بنجاح");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("حدث خطأ أثناء إنشاء ملف PDF");
    }
  };

  const tooltipFormatter = (value: any) => {
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
    <div className="rtl" style={{ direction: 'rtl' }}>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            <FileText className="h-5 w-5" />
            تقرير الأرباح والتكاليف
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={handlePDFExport}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              تصدير PDF
            </Button>
            <Button 
              onClick={handleExcelExport}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              <DownloadCloud className="h-4 w-4" />
              تصدير Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={reportRef}>
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
                    <th>Month</th>
                    <th>Product_Type</th>
                    <th>Total_Costs</th>
                    <th>Total_Sales</th>
                    <th>Net_Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(monthlyReport).length > 0 ? (
                    Object.entries(monthlyReport).flatMap(([month, products]) =>
                      Object.entries(products).map(([productType, data], index) => (
                        <tr key={`${month}-${productType}`}>
                          <td>{month}</td>
                          <td>{productType}</td>
                          <td>{data.totalCost.toFixed(2)}</td>
                          <td>{data.totalSales.toFixed(2)}</td>
                          <td>{(data.totalSales - data.totalCost).toFixed(2)}</td>
                        </tr>
                      ))
                    )
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-4">No data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfitReport;
