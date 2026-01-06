
import React, { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { formatCurrency, generateMonthlyReport, exportProfitReportToExcel } from "@/lib/utils";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { FileText } from "lucide-react";
import ProfitSummaryCards from "./reports/ProfitSummaryCards";
import ProfitFilters from "./reports/ProfitFilters";
import ProfitChart from "./reports/ProfitChart";
import ProfitTable from "./reports/ProfitTable";

const ProfitReport = () => {
  const { orders, loading, reloadOrders } = useSupabaseOrders();
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
  
  // Enhanced summary calculation
  const summaryData = useMemo(() => {
    if (!filteredOrders || filteredOrders.length === 0) {
      return {
        totalCost: 0,
        totalSales: 0,
        totalShipping: 0,
        totalDiscounts: 0,
        netProfit: 0,
        totalItems: 0,
        totalOrders: 0,
        avgOrderValue: 0
      };
    }

    let totalCost = 0;
    let totalSales = 0;
    let totalShipping = 0;
    let totalDiscounts = 0;
    let totalItems = 0;

    filteredOrders.forEach(order => {
      totalSales += order.total;
      totalShipping += order.shippingCost || 0;
      totalDiscounts += order.discount || 0; // Order-level discount
      
      // Calculate from items
      order.items?.forEach(item => {
        totalCost += item.cost * item.quantity;
        totalDiscounts += (item.itemDiscount || 0) * item.quantity; // Item-level discounts
        totalItems += item.quantity;
      });
    });

    const netProfit = totalSales - totalCost - totalShipping;
    const avgOrderValue = filteredOrders.length > 0 ? totalSales / filteredOrders.length : 0;

    return {
      totalCost,
      totalSales,
      totalShipping,
      totalDiscounts,
      netProfit,
      totalItems,
      totalOrders: filteredOrders.length,
      avgOrderValue
    };
  }, [filteredOrders]);

  // Get available years and products for filters
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

  // Enhanced chart data
  const chartData = useMemo(() => {
    return Object.entries(monthlyReport).map(([month, products]) => {
      let monthlyCost = 0;
      let monthlySales = 0;
      let monthlyShipping = 0;
      let monthlyDiscounts = 0;
      
      Object.values(products).forEach(data => {
        monthlyCost += data.totalCost;
        monthlySales += data.totalSales;
        monthlyShipping += data.totalShipping || 0;
        monthlyDiscounts += data.totalDiscounts || 0;
      });
      
      return {
        name: month,
        تكاليف: monthlyCost,
        مبيعات: monthlySales,
        شحن: monthlyShipping,
        خصومات: monthlyDiscounts,
        أرباح: monthlySales - monthlyCost - monthlyShipping
      };
    });
  }, [monthlyReport]);

  // Enhanced table data
  const tableData = useMemo(() => {
    const data: any[] = [];
    Object.entries(monthlyReport).forEach(([month, products]) => {
      Object.entries(products).forEach(([productType, productData]) => {
        data.push({
          month,
          productType,
          quantity: productData.quantity,
          totalCost: productData.totalCost,
          totalSales: productData.totalSales,
          totalShipping: productData.totalShipping || 0,
          totalDiscounts: productData.totalDiscounts || 0,
          netProfit: productData.totalSales - productData.totalCost - (productData.totalShipping || 0)
        });
      });
    });
    return data;
  }, [monthlyReport]);

  const handleExcelExport = () => {
    exportProfitReportToExcel(tableData, "تقرير_الأرباح_المفصل");
    toast.success("تم تصدير ملف Excel بنجاح");
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
        windowWidth: 1200,
        windowHeight: 800
      });
      
      reportRef.current.classList.remove('pdf-export');
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      
      const imgWidth = 297;
      const pageHeight = 210;
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

  const clearFilters = () => {
    setFilterMonth("all");
    setFilterYear("all");
    setFilterProduct("all");
  };

  if (loading) {
    return (
      <Card className="animate-pulse shadow-xl">
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center space-y-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto"></div>
            <div className="space-y-2">
              <p className={`text-slate-600 dark:text-slate-400 font-medium ${isMobile ? "text-lg" : "text-xl"}`}>
                جاري تحميل تقرير الأرباح...
              </p>
              <p className={`text-slate-500 dark:text-slate-500 ${isMobile ? "text-sm" : "text-base"}`}>
                يرجى الانتظار قليلاً
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rtl space-y-6" style={{ direction: 'rtl' }}>
      {/* Header Section */}
      <Card className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 border-l-4 border-l-green-500 shadow-xl">
        <CardHeader className={`${isMobile ? "pb-4" : "pb-6"}`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <FileText className={`${isMobile ? "h-5 w-5" : "h-6 w-6"} text-white`} />
            </div>
            <div>
              <CardTitle className={`font-bold text-slate-800 dark:text-white ${isMobile ? "text-xl" : "text-3xl"}`}>
                تقرير الأرباح والتكاليف المتطور
              </CardTitle>
              <p className={`text-slate-600 dark:text-slate-400 mt-1 ${isMobile ? "text-sm" : "text-lg"}`}>
                تحليل شامل ومفصل للأرباح والمبيعات والتكاليف والخصومات
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters Section */}
      <ProfitFilters
        filterMonth={filterMonth}
        setFilterMonth={setFilterMonth}
        filterYear={filterYear}
        setFilterYear={setFilterYear}
        filterProduct={filterProduct}
        setFilterProduct={setFilterProduct}
        availableYears={availableYears}
        availableProducts={availableProducts}
        onClearFilters={clearFilters}
        onRefresh={() => reloadOrders()}
        onExportExcel={handleExcelExport}
        onExportPDF={handlePDFExport}
      />

      <div ref={reportRef} className="space-y-6">
        {/* Summary Cards */}
        <ProfitSummaryCards summary={summaryData} />

        {/* Chart Section */}
        {chartData.length > 0 && (
          <ProfitChart chartData={chartData} />
        )}
        
        {/* Detailed Table */}
        <ProfitTable data={tableData} />
      </div>
    </div>
  );
};

export default ProfitReport;
