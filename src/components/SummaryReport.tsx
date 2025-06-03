
import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { formatCurrency, exportToExcel } from "@/lib/utils";
import { DownloadCloud, FileText, Download, TrendingUp, Calendar } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  ResponsiveTable, 
  ResponsiveTableHead, 
  ResponsiveTableBody, 
  ResponsiveTableRow, 
  ResponsiveTableHeader, 
  ResponsiveTableCell 
} from "@/components/ui/responsive-table";

const SummaryReport = () => {
  const { orders, loading } = useSupabaseOrders();
  const reportRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const handleExcelExport = () => {
    exportToExcel("summaryTable", "تقرير_جميع_الطلبات");
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
      
      pdf.save(`تقرير_جميع_الطلبات_${new Date().toLocaleDateString('ar-EG')}.pdf`);
      toast.success("تم إنشاء ملف PDF بنجاح");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("حدث خطأ أثناء إنشاء ملف PDF");
    }
  };

  // Calculate summary statistics
  const summaryStats = React.useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        avgOrderValue: 0
      };
    }

    const totalOrders = orders.length;
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;

    orders.forEach(order => {
      totalRevenue += order.total;
      totalProfit += order.profit;
      
      if (order.items) {
        order.items.forEach(item => {
          totalCost += item.cost * item.quantity;
        });
      }
    });

    return {
      totalOrders,
      totalRevenue,
      totalCost,
      totalProfit,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
    };
  }, [orders]);

  if (loading) {
    return (
      <Card className={`${isMobile ? "mobile-card" : ""} animate-pulse`}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gift-primary border-t-transparent mx-auto"></div>
            <p className="text-lg text-gray-600 dark:text-gray-400">جاري تحميل التقارير...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rtl space-y-6" style={{ direction: 'rtl' }}>
      {/* Header Section */}
      <Card className={`${isMobile ? "mobile-card" : ""} bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-l-blue-500`}>
        <CardHeader className={`${isMobile ? "card-header pb-4" : "pb-6"}`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-gray-800 dark:text-white`}>
                  تقرير جميع الطلبات
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  تقرير شامل لجميع الطلبات والمبيعات
                </p>
              </div>
            </div>
            <div className={`flex gap-3 ${isMobile ? "flex-col" : ""}`}>
              <Button 
                onClick={handlePDFExport}
                className={`${isMobile ? "mobile-btn w-full" : ""} bg-blue-600 hover:bg-blue-700 flex items-center gap-2 shadow-lg`}
              >
                <Download className="h-4 w-4" />
                {isMobile ? "تصدير PDF" : "تصدير PDF"}
              </Button>
              <Button 
                onClick={handleExcelExport}
                className={`${isMobile ? "mobile-btn w-full" : ""} bg-green-600 hover:bg-green-700 flex items-center gap-2 shadow-lg`}
              >
                <DownloadCloud className="h-4 w-4" />
                {isMobile ? "تصدير Excel" : "تصدير Excel"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">إجمالي الطلبات</p>
                <p className="text-3xl font-bold">{summaryStats.totalOrders}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">إجمالي المبيعات</p>
                <p className="text-2xl font-bold">{formatCurrency(summaryStats.totalRevenue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">إجمالي التكلفة</p>
                <p className="text-2xl font-bold">{formatCurrency(summaryStats.totalCost)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">صافي الربح</p>
                <p className="text-2xl font-bold">{formatCurrency(summaryStats.totalProfit)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className={isMobile ? "mobile-card" : ""}>
        <CardContent className={`${isMobile ? "card-content p-2" : "p-6"}`}>
          <div ref={reportRef} className="overflow-x-auto">
            <ResponsiveTable id="summaryTable" className="w-full">
              <ResponsiveTableHead>
                <ResponsiveTableRow className="bg-gray-50 dark:bg-gray-800">
                  <ResponsiveTableHeader className="font-semibold">رقم الطلب</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold">التاريخ</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold">اسم العميل</ResponsiveTableHeader>
                  {!isMobile && <ResponsiveTableHeader className="font-semibold">التليفون</ResponsiveTableHeader>}
                  <ResponsiveTableHeader className="font-semibold">طريقة السداد</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold">طريقة التوصيل</ResponsiveTableHeader>
                  {!isMobile && <ResponsiveTableHeader className="font-semibold">العنوان</ResponsiveTableHeader>}
                  {!isMobile && <ResponsiveTableHeader className="font-semibold">المحافظة</ResponsiveTableHeader>}
                  <ResponsiveTableHeader className="font-semibold">نوع المنتج</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold">المقاس</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold">الكمية</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold">سعر البيع</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold">التكلفة</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold">خصم الصنف</ResponsiveTableHeader>
                  {!isMobile && <ResponsiveTableHeader className="font-semibold">مصاريف الشحن</ResponsiveTableHeader>}
                  <ResponsiveTableHeader className="font-semibold">الإجمالي</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold">الربح</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold">الحالة</ResponsiveTableHeader>
                </ResponsiveTableRow>
              </ResponsiveTableHead>
              <ResponsiveTableBody>
                {orders.length > 0 ? (
                  orders.flatMap((order, orderIndex) => {
                    const items = order.items || [];
                    
                    return items.map((item, itemIndex) => (
                      <ResponsiveTableRow key={`${order.serial}-${itemIndex}`} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <ResponsiveTableCell className="font-medium">{order.serial}</ResponsiveTableCell>
                        <ResponsiveTableCell>{new Date(order.dateCreated).toLocaleDateString('ar-EG')}</ResponsiveTableCell>
                        <ResponsiveTableCell>{order.clientName}</ResponsiveTableCell>
                        {!isMobile && <ResponsiveTableCell>{order.phone}</ResponsiveTableCell>}
                        <ResponsiveTableCell>{order.paymentMethod}</ResponsiveTableCell>
                        <ResponsiveTableCell>{order.deliveryMethod}</ResponsiveTableCell>
                        {!isMobile && <ResponsiveTableCell>{order.address}</ResponsiveTableCell>}
                        {!isMobile && <ResponsiveTableCell>{order.governorate}</ResponsiveTableCell>}
                        <ResponsiveTableCell>{item.productType}</ResponsiveTableCell>
                        <ResponsiveTableCell>{item.size}</ResponsiveTableCell>
                        <ResponsiveTableCell className="text-center">{item.quantity}</ResponsiveTableCell>
                        <ResponsiveTableCell className="text-right">{formatCurrency(item.price)}</ResponsiveTableCell>
                        <ResponsiveTableCell className="text-right">{formatCurrency(item.cost)}</ResponsiveTableCell>
                        <ResponsiveTableCell className="text-right">{formatCurrency(item.itemDiscount || 0)}</ResponsiveTableCell>
                        {!isMobile && <ResponsiveTableCell className="text-right">{itemIndex === 0 ? formatCurrency(order.shippingCost) : "-"}</ResponsiveTableCell>}
                        <ResponsiveTableCell className="text-right font-semibold">{itemIndex === 0 ? formatCurrency(order.total) : "-"}</ResponsiveTableCell>
                        <ResponsiveTableCell className="text-right">{formatCurrency(item.profit)}</ResponsiveTableCell>
                        <ResponsiveTableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === 'shipped' ? 'bg-green-100 text-green-800' :
                            order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status === 'pending' ? 'في انتظار التأكيد' :
                             order.status === 'confirmed' ? 'تم التأكيد' :
                             order.status === 'sentToPrinter' ? 'تم الأرسال للمطبعة' :
                             order.status === 'readyForDelivery' ? 'تحت التسليم' :
                             order.status === 'shipped' ? 'تم الشحن' : order.status}
                          </span>
                        </ResponsiveTableCell>
                      </ResponsiveTableRow>
                    ));
                  })
                ) : (
                  <ResponsiveTableRow>
                    <ResponsiveTableCell colSpan={isMobile ? 15 : 18} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-12 w-12 text-gray-400" />
                        <p className="text-gray-500 text-lg">لا توجد طلبات متاحة</p>
                      </div>
                    </ResponsiveTableCell>
                  </ResponsiveTableRow>
                )}
              </ResponsiveTableBody>
            </ResponsiveTable>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryReport;
