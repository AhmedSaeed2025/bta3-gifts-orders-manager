import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { formatCurrency, exportToExcel } from "@/lib/utils";
import { DownloadCloud, FileText, Download } from "lucide-react";
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
    exportToExcel("summaryTable", "Orders_Report");
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
      
      const imgWidth = 297; // A4 landscape width
      const pageHeight = 210; // A4 landscape height
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
      
      pdf.save(`تقرير_الطلبات_${new Date().toLocaleDateString('ar-EG')}.pdf`);
      toast.success("تم إنشاء ملف PDF بنجاح");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("حدث خطأ أثناء إنشاء ملف PDF");
    }
  };

  if (loading) {
    return (
      <Card className={isMobile ? "mobile-card" : ""}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gift-primary mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">جاري تحميل التقارير...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rtl" style={{ direction: 'rtl' }}>
      <Card className={isMobile ? "mobile-card" : ""}>
        <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${isMobile ? "card-header" : ""}`}>
          <CardTitle className={`${isMobile ? "text-lg" : "text-xl"} flex items-center gap-2`}>
            <FileText className="h-5 w-5" />
            تقرير الطلبات
          </CardTitle>
          <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
            <Button 
              onClick={handlePDFExport}
              className={`bg-blue-600 hover:bg-blue-700 flex items-center gap-2 ${isMobile ? "mobile-btn" : ""}`}
            >
              <Download className="h-4 w-4" />
              {isMobile ? "PDF" : "تصدير PDF"}
            </Button>
            <Button 
              onClick={handleExcelExport}
              className={`bg-green-600 hover:bg-green-700 flex items-center gap-2 ${isMobile ? "mobile-btn" : ""}`}
            >
              <DownloadCloud className="h-4 w-4" />
              {isMobile ? "Excel" : "تصدير Excel"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className={isMobile ? "card-content" : ""}>
          <div ref={reportRef} className="overflow-x-auto">
            <ResponsiveTable id="summaryTable">
              <ResponsiveTableHead>
                <ResponsiveTableRow>
                  <ResponsiveTableHeader>رقم الطلب</ResponsiveTableHeader>
                  <ResponsiveTableHeader>التاريخ</ResponsiveTableHeader>
                  <ResponsiveTableHeader>اسم العميل</ResponsiveTableHeader>
                  <ResponsiveTableHeader>التليفون</ResponsiveTableHeader>
                  <ResponsiveTableHeader>طريقة السداد</ResponsiveTableHeader>
                  <ResponsiveTableHeader>طريقة التوصيل</ResponsiveTableHeader>
                  <ResponsiveTableHeader>العنوان</ResponsiveTableHeader>
                  <ResponsiveTableHeader>المحافظة</ResponsiveTableHeader>
                  <ResponsiveTableHeader>نوع المنتج</ResponsiveTableHeader>
                  <ResponsiveTableHeader>المقاس</ResponsiveTableHeader>
                  <ResponsiveTableHeader>الكمية</ResponsiveTableHeader>
                  <ResponsiveTableHeader>سعر البيع</ResponsiveTableHeader>
                  <ResponsiveTableHeader>التكلفة</ResponsiveTableHeader>
                  <ResponsiveTableHeader>الخصم</ResponsiveTableHeader>
                  <ResponsiveTableHeader>مصاريف الشحن</ResponsiveTableHeader>
                  <ResponsiveTableHeader>الإجمالي</ResponsiveTableHeader>
                  <ResponsiveTableHeader>الربح</ResponsiveTableHeader>
                  <ResponsiveTableHeader>الحالة</ResponsiveTableHeader>
                </ResponsiveTableRow>
              </ResponsiveTableHead>
              <ResponsiveTableBody>
                {orders.length > 0 ? (
                  orders.flatMap((order, orderIndex) => {
                    const items = order.items || [];
                    
                    return items.map((item, itemIndex) => (
                      <ResponsiveTableRow key={`${order.serial}-${itemIndex}`}>
                        <ResponsiveTableCell>INV-{order.serial}</ResponsiveTableCell>
                        <ResponsiveTableCell>{new Date(order.dateCreated).toLocaleDateString('ar-EG')}</ResponsiveTableCell>
                        <ResponsiveTableCell>{order.clientName}</ResponsiveTableCell>
                        <ResponsiveTableCell>{order.phone}</ResponsiveTableCell>
                        <ResponsiveTableCell>{order.paymentMethod}</ResponsiveTableCell>
                        <ResponsiveTableCell>{order.deliveryMethod}</ResponsiveTableCell>
                        <ResponsiveTableCell>{order.address}</ResponsiveTableCell>
                        <ResponsiveTableCell>{order.governorate}</ResponsiveTableCell>
                        <ResponsiveTableCell>{item.productType}</ResponsiveTableCell>
                        <ResponsiveTableCell>{item.size}</ResponsiveTableCell>
                        <ResponsiveTableCell>{item.quantity}</ResponsiveTableCell>
                        <ResponsiveTableCell>{item.price.toFixed(2)}</ResponsiveTableCell>
                        <ResponsiveTableCell>{item.cost.toFixed(2)}</ResponsiveTableCell>
                        <ResponsiveTableCell>{itemIndex === 0 ? order.discount.toFixed(2) : "0.00"}</ResponsiveTableCell>
                        <ResponsiveTableCell>{itemIndex === 0 ? order.shippingCost.toFixed(2) : "0.00"}</ResponsiveTableCell>
                        <ResponsiveTableCell>{itemIndex === 0 ? order.total.toFixed(2) : "-"}</ResponsiveTableCell>
                        <ResponsiveTableCell>{item.profit.toFixed(2)}</ResponsiveTableCell>
                        <ResponsiveTableCell>{order.status}</ResponsiveTableCell>
                      </ResponsiveTableRow>
                    ));
                  })
                ) : (
                  <ResponsiveTableRow>
                    <ResponsiveTableCell colSpan={18} className="text-center py-4">لا توجد بيانات</ResponsiveTableCell>
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
