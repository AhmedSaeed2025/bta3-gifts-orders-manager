
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { formatCurrency, exportToExcel } from "@/lib/utils";
import { DownloadCloud, FileText, Download, TrendingUp, Calendar, Edit, Filter, RefreshCw } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  
  // Filter states
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const safeOrders = Array.isArray(orders) ? orders : [];

  // Get available years for filter
  const availableYears = React.useMemo(() => {
    const years = new Set<string>();
    safeOrders.forEach(order => {
      const year = new Date(order.dateCreated).getFullYear().toString();
      years.add(year);
    });
    return Array.from(years).sort().reverse();
  }, [safeOrders]);

  // Filter orders based on selected filters
  const filteredOrders = React.useMemo(() => {
    return safeOrders.filter(order => {
      const orderDate = new Date(order.dateCreated);
      const orderYear = orderDate.getFullYear().toString();
      const orderMonth = (orderDate.getMonth() + 1).toString().padStart(2, '0');
      
      if (filterYear !== "all" && orderYear !== filterYear) return false;
      if (filterMonth !== "all" && orderMonth !== filterMonth) return false;
      if (filterStatus !== "all" && order.status !== filterStatus) return false;
      
      return true;
    });
  }, [safeOrders, filterMonth, filterYear, filterStatus]);

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

  const editOrder = (serial: string) => {
    navigate(`/orders/${serial}`);
  };

  const clearFilters = () => {
    setFilterMonth("all");
    setFilterYear("all");
    setFilterStatus("all");
  };

  const truncateText = (text: string, maxLength: number = 30) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Calculate summary statistics for filtered orders with corrected profit calculation
  const summaryStats = React.useMemo(() => {
    if (!filteredOrders || filteredOrders.length === 0) {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        totalDeposits: 0,
        netRevenue: 0,
        totalProfit: 0,
        totalCost: 0,
        totalShipping: 0,
        avgOrderValue: 0
      };
    }

    const totalOrders = filteredOrders.length;
    let totalRevenue = 0;
    let totalDeposits = 0;
    let totalCost = 0;
    let totalShipping = 0;

    filteredOrders.forEach(order => {
      totalRevenue += order.total;
      totalDeposits += order.deposit || 0;
      totalShipping += order.shippingCost || 0;
      
      // Calculate total cost for this order
      const orderCost = order.items?.reduce((sum, item) => sum + (item.cost * item.quantity), 0) || 0;
      totalCost += orderCost;
    });

    const netRevenue = totalRevenue - totalDeposits;
    // Fixed profit calculation: Revenue - Cost - Shipping (العربون لا يؤثر على الربح)
    const totalProfit = totalRevenue - totalCost - totalShipping;

    return {
      totalOrders,
      totalRevenue,
      totalDeposits,
      netRevenue,
      totalProfit,
      totalCost,
      totalShipping,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
    };
  }, [filteredOrders]);

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
                  تقرير شامل لجميع الطلبات والمبيعات مع إمكانية الفلترة
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

      {/* Filters Section */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-l-4 border-l-indigo-500">
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
              <Label htmlFor="filterStatus">الحالة</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">في انتظار التأكيد</SelectItem>
                  <SelectItem value="confirmed">تم التأكيد</SelectItem>
                  <SelectItem value="sentToPrinter">تم الأرسال للمطبعة</SelectItem>
                  <SelectItem value="readyForDelivery">تحت التسليم</SelectItem>
                  <SelectItem value="shipped">تم الشحن</SelectItem>
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

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">إجمالي الشحن</p>
                <p className="text-2xl font-bold">{formatCurrency(summaryStats.totalShipping)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">صافي المبيعات</p>
                <p className="text-2xl font-bold">{formatCurrency(summaryStats.netRevenue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-indigo-200" />
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
                <ResponsiveTableRow className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                  <ResponsiveTableHeader className="font-semibold text-gray-800 dark:text-white">رقم الطلب</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold text-gray-800 dark:text-white">التاريخ</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold text-gray-800 dark:text-white">اسم العميل</ResponsiveTableHeader>
                  {!isMobile && <ResponsiveTableHeader className="font-semibold text-gray-800 dark:text-white">التليفون</ResponsiveTableHeader>}
                  <ResponsiveTableHeader className="font-semibold text-gray-800 dark:text-white">طريقة السداد</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold text-gray-800 dark:text-white">طريقة التوصيل</ResponsiveTableHeader>
                  {!isMobile && <ResponsiveTableHeader className="font-semibold text-gray-800 dark:text-white">العنوان</ResponsiveTableHeader>}
                  {!isMobile && <ResponsiveTableHeader className="font-semibold text-gray-800 dark:text-white">المحافظة</ResponsiveTableHeader>}
                  <ResponsiveTableHeader className="font-semibold text-gray-800 dark:text-white">نوع المنتج</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold text-gray-800 dark:text-white">المقاس</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold text-gray-800 dark:text-white">الكمية</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold text-gray-800 dark:text-white">سعر البيع</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold text-gray-800 dark:text-white">خصم الصنف</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold text-gray-800 dark:text-white">قيمة الطلب</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold text-gray-800 dark:text-white">العربون</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold text-gray-800 dark:text-white">صافي الطلب</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold text-gray-800 dark:text-white">الحالة</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold text-gray-800 dark:text-white">إجراءات</ResponsiveTableHeader>
                </ResponsiveTableRow>
              </ResponsiveTableHead>
              <ResponsiveTableBody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.flatMap((order, orderIndex) => {
                    const items = order.items || [];
                    
                    return items.map((item, itemIndex) => (
                      <ResponsiveTableRow 
                        key={`${order.serial}-${itemIndex}`} 
                        className={`hover:bg-blue-50 dark:hover:bg-blue-900/20 ${
                          orderIndex % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'
                        } border-b border-gray-200 dark:border-gray-700`}
                      >
                        <ResponsiveTableCell className="font-medium text-blue-600 dark:text-blue-400">{order.serial}</ResponsiveTableCell>
                        <ResponsiveTableCell className="text-gray-600 dark:text-gray-300">{new Date(order.dateCreated).toLocaleDateString('ar-EG')}</ResponsiveTableCell>
                        <ResponsiveTableCell className="font-medium text-gray-800 dark:text-white">{order.clientName}</ResponsiveTableCell>
                        {!isMobile && <ResponsiveTableCell className="text-gray-600 dark:text-gray-300">{order.phone}</ResponsiveTableCell>}
                        <ResponsiveTableCell className="text-gray-600 dark:text-gray-300">{order.paymentMethod}</ResponsiveTableCell>
                        <ResponsiveTableCell className="text-gray-600 dark:text-gray-300">{order.deliveryMethod}</ResponsiveTableCell>
                        {!isMobile && <ResponsiveTableCell className="text-gray-600 dark:text-gray-300">{truncateText(order.address || "")}</ResponsiveTableCell>}
                        {!isMobile && <ResponsiveTableCell className="text-gray-600 dark:text-gray-300">{order.governorate}</ResponsiveTableCell>}
                        <ResponsiveTableCell className="font-medium text-purple-600 dark:text-purple-400">{item.productType}</ResponsiveTableCell>
                        <ResponsiveTableCell className="text-gray-600 dark:text-gray-300">{item.size}</ResponsiveTableCell>
                        <ResponsiveTableCell className="text-center font-medium">{item.quantity}</ResponsiveTableCell>
                        <ResponsiveTableCell className="text-right font-semibold text-green-600 dark:text-green-400">{formatCurrency(item.price)}</ResponsiveTableCell>
                        <ResponsiveTableCell className="text-right text-red-600 dark:text-red-400">{formatCurrency(item.itemDiscount || 0)}</ResponsiveTableCell>
                        <ResponsiveTableCell className="text-right font-semibold text-blue-600 dark:text-blue-400">{itemIndex === 0 ? formatCurrency(order.total) : "-"}</ResponsiveTableCell>
                        <ResponsiveTableCell className="text-right text-orange-600 dark:text-orange-400">{itemIndex === 0 ? formatCurrency(order.deposit || 0) : "-"}</ResponsiveTableCell>
                        <ResponsiveTableCell className="text-right font-bold text-green-600 dark:text-green-400">{itemIndex === 0 ? formatCurrency(order.total - (order.deposit || 0)) : "-"}</ResponsiveTableCell>
                        <ResponsiveTableCell>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            order.status === 'shipped' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                            order.status === 'confirmed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {order.status === 'pending' ? 'في انتظار التأكيد' :
                             order.status === 'confirmed' ? 'تم التأكيد' :
                             order.status === 'sentToPrinter' ? 'تم الأرسال للمطبعة' :
                             order.status === 'readyForDelivery' ? 'تحت التسليم' :
                             order.status === 'shipped' ? 'تم الشحن' : order.status}
                          </span>
                        </ResponsiveTableCell>
                        <ResponsiveTableCell>
                          {itemIndex === 0 && (
                            <Button
                              onClick={() => editOrder(order.serial)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-xs rounded shadow-sm"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              تعديل
                            </Button>
                          )}
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
