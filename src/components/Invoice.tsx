
import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Order, ORDER_STATUS_LABELS } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useReactToPrint } from "react-to-print";
import { Facebook, Phone, Home, Map, Instagram, Send, Download, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";

interface InvoiceProps {
  order: Order;
  allowEdit?: boolean;
  onEdit?: (updatedOrder: Order) => void;
}

const Invoice: React.FC<InvoiceProps> = ({ order, allowEdit = false, onEdit }) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Safety check - ensure order exists
  if (!order) {
    return <div>لا توجد بيانات للفاتورة</div>;
  }

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `فاتورة_${order.serial}`,
    onBeforePrint: () => {
      document.body.classList.add('printing-invoice');
    },
    onAfterPrint: () => {
      document.body.classList.remove('printing-invoice');
    }
  });

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    
    try {
      toast.info("جاري إنشاء ملف PDF...");
      
      const canvas = await html2canvas(printRef.current, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowHeight: printRef.current.scrollHeight,
        height: printRef.current.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add pages if content overflows
      while (heightLeft > 0) {
        position = heightLeft - imgHeight; // top of new page
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`فاتورة_${order.serial}.pdf`);
      toast.success("تم إنشاء ملف PDF بنجاح");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("حدث خطأ أثناء إنشاء ملف PDF");
    }
  };

  // Ensure items array exists, or default to empty array
  const items = order.items || [];

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2 justify-end">
        <Button 
          onClick={handlePrint}
          className="h-8 md:h-10 text-xs md:text-sm bg-gift-secondary hover:bg-gift-secondaryHover print:hidden flex items-center gap-1"
        >
          <FileText className="h-3.5 w-3.5 md:h-4 md:w-4" />
          طباعة الفاتورة
        </Button>
        <Button 
          onClick={handleExportPDF}
          className="h-8 md:h-10 text-xs md:text-sm bg-blue-600 hover:bg-blue-700 print:hidden flex items-center gap-1"
        >
          <Download className="h-3.5 w-3.5 md:h-4 md:w-4" />
          تصدير PDF
        </Button>
      </div>
      
      <Card ref={printRef} className="print:shadow-none print:border-none">
        <CardContent className="p-4 print:p-0">
          <div className="text-center mb-4 border-b pb-3 dark:border-gray-700">
            <h1 className="text-xl md:text-2xl font-bold text-gift-primary">#بتاع_هدايا_الأصلى</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">فاتورة طلب</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <h3 className="font-semibold mb-1 text-sm flex items-center gap-1.5">
                <Map size={16} className="text-gift-primary" /> بيانات الفاتورة
              </h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">رقم الفاتورة:</span> {order.serial}</p>
                <p><span className="font-medium">حالة الطلب:</span> {ORDER_STATUS_LABELS[order.status]}</p>
                <p><span className="font-medium">تاريخ الإصدار:</span> {new Date(order.dateCreated).toLocaleDateString('ar-EG')}</p>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <h3 className="font-semibold mb-1 text-sm flex items-center gap-1.5">
                <Phone size={16} className="text-gift-primary" /> بيانات العميل
              </h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">اسم العميل:</span> {order.clientName}</p>
                <p><span className="font-medium">رقم التليفون:</span> {order.phone}</p>
                <p><span className="font-medium">طريقة السداد:</span> {order.paymentMethod}</p>
              </div>
            </div>
          </div>
          
          <div className="mb-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <h3 className="font-semibold mb-1 text-sm flex items-center gap-1.5">
              <Home size={16} className="text-gift-primary" /> معلومات التوصيل
            </h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">طريقة الاستلام:</span> {order.deliveryMethod}</p>
              {order.deliveryMethod === "شحن للمنزل" && (
                <>
                  <p><span className="font-medium">العنوان:</span> {order.address}</p>
                  <p><span className="font-medium">المحافظة:</span> {order.governorate}</p>
                </>
              )}
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="font-semibold mb-2 text-sm flex items-center gap-1.5">
              <FileText size={16} className="text-gift-primary" /> تفاصيل الطلب
            </h3>
            <div className="overflow-x-auto">
              <Table className="text-xs border-collapse">
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800">
                    <TableHead className="py-1.5 px-2 text-xs font-bold">المنتج</TableHead>
                    <TableHead className="py-1.5 px-2 text-xs font-bold">المقاس</TableHead>
                    <TableHead className="py-1.5 px-2 text-xs font-bold">العدد</TableHead>
                    <TableHead className="py-1.5 px-2 text-xs font-bold">السعر</TableHead>
                    <TableHead className="py-1.5 px-2 text-xs font-bold">الإجمالي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index} className="border-b border-gray-200 dark:border-gray-700">
                      <TableCell className="py-1.5 px-2">{item.productType}</TableCell>
                      <TableCell className="py-1.5 px-2">{item.size}</TableCell>
                      <TableCell className="py-1.5 px-2">{item.quantity}</TableCell>
                      <TableCell className="py-1.5 px-2">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="py-1.5 px-2 font-medium">{formatCurrency(item.price * item.quantity)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <div className="flex justify-end mb-4">
            <div className="w-full md:w-64">
              <div className="flex justify-between py-1.5 text-sm">
                <span className="font-medium">إجمالي المنتجات:</span>
                <span>{formatCurrency(items.reduce((sum, item) => sum + item.price * item.quantity, 0))}</span>
              </div>
              {order.shippingCost > 0 && (
                <div className="flex justify-between py-1.5 text-sm border-t border-gray-200 dark:border-gray-700">
                  <span className="font-medium">مصاريف الشحن:</span>
                  <span>{formatCurrency(order.shippingCost)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between py-1.5 text-sm border-t border-gray-200 dark:border-gray-700">
                  <span className="font-medium">الخصم:</span>
                  <span className="text-red-600 font-medium">- {formatCurrency(order.discount)}</span>
                </div>
              )}
              {order.deposit > 0 && (
                <div className="flex justify-between py-1.5 text-sm border-t border-gray-200 dark:border-gray-700">
                  <span className="font-medium">العربون المدفوع:</span>
                  <span className="text-red-600 font-medium">- {formatCurrency(order.deposit)}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 text-base border-t border-gray-200 dark:border-gray-700">
                <span className="font-bold">المجموع الكلي:</span>
                <span className="font-bold">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-5 pt-3 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-sm font-medium mb-2">شكراً لثقتكم في #بتاع_هدايا_الأصلى</p>
            <div className="flex justify-center items-center gap-1 text-sm mb-3">
              <Phone size={14} className="text-gift-primary" />
              <span>للتواصل: 01113977005</span>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-4 mb-3">
              <a href="https://www.facebook.com/D4Uofficial" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:underline text-xs">
                <Facebook size={16} />
                <span>D4Uofficial</span>
              </a>
              
              <a href="https://www.instagram.com/design4you_gift_store" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-pink-600 hover:underline text-xs">
                <Instagram size={16} />
                <span>design4you_gift_store</span>
              </a>
              
              <a href="https://www.tiktok.com/@giftstore2022" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-black dark:text-white hover:underline text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
                <span>giftstore2022</span>
              </a>
              
              <a href="https://t.me/GiftsEg" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-500 hover:underline text-xs">
                <Send size={16} />
                <span>GiftsEg</span>
              </a>
            </div>
            
            <p className="text-[10px] text-gray-500 dark:text-gray-400">جميع الحقوق محفوظة #بتاع_هدايا_الأصلي 2025</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invoice;
