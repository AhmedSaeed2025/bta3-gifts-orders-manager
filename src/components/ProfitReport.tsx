
import React, { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { formatCurrency, generateMonthlyReport, calculateTotals, exportToExcel } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DownloadCloud, TrendingUp, TrendingDown, FileText, Download, Filter, RefreshCw } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

const ProfitReport = () => {
  const { orders, loading } = useSupabaseOrders();
  const reportRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterProduct, setFilterProduct] = useState<string>("all");
  
  const safeOrders = Array.isArray(orders) ? orders : [];
  
  // Filter orders based on selected filters
  const filteredOrders = useMemo(() => {
    return safeOrders.filter(order => {
      const orderDate = new Date(order.dateCreated);
      const orderYear = orderDate.getFullYear().toString();
      const orderMonth = (orderDate.getMonth() + 1).toString().padStart(2, '0');
      
      if (filterYear !== "all" && orderYear !== filterYear) return false;
      if (filterMonth !== "all" && orderMonth !== filterMonth) return false;
      if (filterProduct !== "all") {
        const hasProduct = order.items?.some(item => item.productType === filterProduct);
        if (!hasProduct) return false;
      }
      
      return true;
    });
  }, [safeOrders, filterMonth, filterYear, filterProduct]);
  
  const monthlyReport = useMemo(() => generateMonthlyReport(filteredOrders), [filteredOrders]);
  const { totalCost, totalSales, netProfit } = useMemo(() => calculateTotals(filteredOrders), [filteredOrders]);

  // Get available years, months, and products for filters
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    safeOrders.forEach(order => {
      const year = new Date(order.dateCreated).getFullYear().toString();
      years.add(year);
    });
    return Array.from(years).sort();
  }, [safeOrders]);

  const availableProducts = useMemo(() => {
    const products = new Set<string>();
    safeOrders.forEach(order => {
      order.items?.forEach(item => {
        products.add(item.productType);
      });
    });
    return Array.from(products).sort();
  }, [safeOrders]);

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
    exportToExcel("profitReportTable", "تقرير_الأرباح");
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

  const clearFilters = () => {
    setFilterMonth("all");
    setFilterYear("all");
    setFilterProduct("all");
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gift-primary border-t-transparent mx-auto"></div>
            <p className="text-lg text-gray-600 dark:text-gray-400">جاري تحميل تقرير الأرباح...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rtl space-y-6" style={{ direction: 'rtl' }}>
      {/* Header Section */}
      <Card className={`${isMobile ? "mobile-card" : ""} bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-4 border-l-green-500`}>
        <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-4 ${isMobile ? "card-header" : ""}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-gray-800 dark:text-white`}>
                تقرير الأرباح والتكاليف
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                تحليل شامل للأرباح والمبيعات والتكاليف
              </p>
            </div>
          </div>
          <div className={`flex gap-3 ${isMobile ? "flex-col" : ""}`}>
            <Button 
              onClick={handlePDFExport}
              className={`${isMobile ? "mobile-btn w-full" : ""} bg-blue-600 hover:bg-blue-700 flex items-center gap-2 shadow-lg`}
            >
              <Download className="h-4 w-4" />
              تصدير PDF
            </Button>
            <Button 
              onClick={handleExcelExport}
              className={`${isMobile ? "mobile-btn w-full" : ""} bg-green-600 hover:bg-green-700 flex items-center gap-2 shadow-lg`}
            >
              <DownloadCloud className="h-4 w-4" />
              تصدير Excel
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Filters Section */}
      <Card className="bg-gray-50 dark:bg-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            فلاتر التقرير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-4"}`}>
            <div className="space-y-2">
              <Label htmlFor="filterYear">السنة</Label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر السنة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع السنوات</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="filterMonth">الشهر</Label>
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
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="filterProduct">نوع المنتج</Label>
              <Select value={filterProduct} onValueChange={setFilterProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المنتج" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المنتجات</SelectItem>
                  {availableProducts.map(product => (
                    <SelectItem key={product} value={product}>{product}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={clearFilters}
                variant="outline"
                className="w-full flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                مسح الفلاتر
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div ref={reportRef} className="space-y-6">
        {/* Summary Cards */}
        <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"}`}>
          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-red-100 text-sm font-medium">إجمالي التكاليف</p>
                  <p className="text-3xl font-bold">{formatCurrency(totalCost)}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-blue-100 text-sm font-medium">إجمالي المبيعات</p>
                  <p className="text-3xl font-bold">{formatCurrency(totalSales)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-green-100 text-sm font-medium">صافي الربح</p>
                  <p className="text-3xl font-bold">{formatCurrency(netProfit)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart Section */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                رسم بياني للأرباح والتكاليف
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`${isMobile ? "h-64" : "h-80"} w-full`}>
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
            </CardContent>
          </Card>
        )}
        
        {/* Detailed Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">تفاصيل الأرباح والتكاليف حسب المنتج والشهر</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table id="profitReportTable" className="gift-table w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="text-right p-3 font-semibold">الشهر</th>
                    <th className="text-right p-3 font-semibold">نوع المنتج</th>
                    <th className="text-right p-3 font-semibold">إجمالي التكاليف</th>
                    <th className="text-right p-3 font-semibold">إجمالي المبيعات</th>
                    <th className="text-right p-3 font-semibold">صافي الربح</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(monthlyReport).length > 0 ? (
                    Object.entries(monthlyReport).flatMap(([month, products]) =>
                      Object.entries(products).map(([productType, data]) => (
                        <tr key={`${month}-${productType}`} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="p-3 border-b">{month}</td>
                          <td className="p-3 border-b">{productType}</td>
                          <td className="p-3 border-b text-red-600 font-semibold">{formatCurrency(data.totalCost)}</td>
                          <td className="p-3 border-b text-blue-600 font-semibold">{formatCurrency(data.totalSales)}</td>
                          <td className="p-3 border-b text-green-600 font-semibold">{formatCurrency(data.totalSales - data.totalCost)}</td>
                        </tr>
                      ))
                    )
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-12 w-12 text-gray-400" />
                          <p className="text-gray-500 text-lg">لا توجد بيانات متاحة</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfitReport;
