
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import Invoice from "./Invoice";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Download, Pencil } from "lucide-react";
import { Order } from "@/types";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";

const InvoiceTab = () => {
  const { orders, loading } = useSupabaseOrders();
  const [selectedOrderSerial, setSelectedOrderSerial] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<Order | undefined>(orders && orders.length > 0 ? orders[0] : undefined);
  const [isExporting, setIsExporting] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  useEffect(() => {
    if (orders && orders.length > 0 && !selectedOrderSerial) {
      setSelectedOrderSerial(orders[0].serial);
      setSelectedOrder(orders[0]);
    }
  }, [orders, selectedOrderSerial]);

  const handleOrderChange = (serial: string) => {
    setSelectedOrderSerial(serial);
    const order = orders.find(o => o.serial === serial);
    if (order) {
      setSelectedOrder(order);
    }
  };

  const handleEditClick = () => {
    if (selectedOrder) {
      navigate(`/edit-order/${selectedOrder.serial}`);
    }
  };

  const exportToPDF = async () => {
    if (!invoiceRef.current || !selectedOrder || isExporting) return;

    setIsExporting(true);
    try {
      toast.info("جاري إنشاء ملف PDF بجودة عالية، يرجى الانتظار...");

      const invoiceElement = invoiceRef.current;
      
      // تحسين إعدادات html2canvas للحصول على جودة عالية
      const canvas = await html2canvas(invoiceElement, {
        scale: 2, // زيادة الدقة
        useCORS: true,
        logging: false,
        allowTaint: false,
        backgroundColor: "#ffffff",
        imageTimeout: 2000,
        foreignObjectRendering: false,
        removeContainer: true,
        width: invoiceElement.offsetWidth,
        height: invoiceElement.offsetHeight,
        onclone: (clonedDoc) => {
          // تحسين عرض الصور في النسخة المستنسخة
          const images = clonedDoc.querySelectorAll('img');
          images.forEach((img) => {
            img.style.opacity = '1';
            img.style.visibility = 'visible';
            img.style.display = 'inline-block';
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
          });
          
          // تحسين النصوص والخطوط
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el) => {
            if (el instanceof HTMLElement) {
              el.style.fontFamily = 'Tajawal, Arial, sans-serif';
              el.style.webkitFontSmoothing = 'antialiased';
              el.style.mozOsxFontSmoothing = 'grayscale';
            }
          });
        }
      });

      // استخدام PNG بجودة عالية
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: false, // عدم ضغط PDF للحفاظ على الجودة
      });

      // حساب أبعاد الصورة بشكل صحيح لتجنب التكبير الزائد
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // حساب النسبة المناسبة للاحتفاظ بالأبعاد
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      
      // توسيط الصورة في الصفحة
      const x = (pdfWidth - finalWidth) / 2;
      
      // إضافة الصورة بالأبعاد المحسوبة
      pdf.addImage(imgData, 'PNG', x, 0, finalWidth, finalHeight, undefined, 'FAST');
      
      // التعامل مع الصفحات المتعددة إذا لزم الأمر
      let heightLeft = finalHeight;
      let position = 0;
      
      while (heightLeft > pdfHeight) {
        position = heightLeft - finalHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', x, position, finalWidth, finalHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }
      
      pdf.save(`فاتورة-${selectedOrder.clientName}-${selectedOrder.serial}.pdf`);
      toast.success("تم تصدير الفاتورة بجودة عالية بنجاح");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("حدث خطأ أثناء إنشاء ملف PDF. حاول مرة أخرى.");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gift-primary mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400 text-xs">جاري تحميل الفواتير...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="py-2">
        <CardTitle className={`${isMobile ? "text-sm" : "text-base"} flex items-center justify-between`}>
          <span>طباعة الفاتورة</span>
          <div className="flex gap-2">
            {selectedOrder && (
              <>
                <Button
                  onClick={exportToPDF}
                  disabled={isExporting}
                  size={isMobile ? "sm" : "default"}
                  className={`${isMobile ? "text-xs h-6" : "text-xs h-7"} flex items-center gap-1 bg-blue-500 hover:bg-blue-600`}
                >
                  <Download size={isMobile ? 12 : 14} />
                  {isExporting ? "جاري التصدير..." : (isMobile ? "PDF عالي الجودة" : "تصدير PDF عالي الجودة")}
                </Button>
                <Button 
                  variant="outline" 
                  size={isMobile ? "sm" : "default"}
                  onClick={handleEditClick}
                  className={`${isMobile ? "text-xs h-6" : "text-xs h-7"} flex items-center gap-1`}
                >
                  <Pencil size={isMobile ? 12 : 14} />
                  {isMobile ? "تعديل" : "تعديل الطلب"}
                </Button>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className={`${isMobile ? "p-2" : "p-3"}`}>
        {!orders || orders.length === 0 ? (
          <p className="text-center py-3 text-xs">لا توجد طلبات متاحة لعرض الفاتورة</p>
        ) : (
          <div>
            <div className="mb-3">
              <Label htmlFor="orderSelect" className={`${isMobile ? "text-xs" : "text-xs"} mb-1 block`}>اختر الطلب:</Label>
              <Select 
                value={selectedOrderSerial}
                onValueChange={handleOrderChange}
              >
                <SelectTrigger className={`w-full ${isMobile ? "text-xs h-7" : "text-xs h-8"}`}>
                  <SelectValue placeholder="اختر الطلب" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order) => (
                    <SelectItem key={order.serial} value={order.serial} className={`${isMobile ? "text-xs" : "text-xs"}`}>
                      {`${order.serial} - ${order.clientName}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedOrder && (
              <div ref={invoiceRef}>
                <Invoice order={selectedOrder} />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceTab;
