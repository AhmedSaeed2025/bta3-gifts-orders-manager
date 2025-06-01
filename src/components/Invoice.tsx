
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

  if (!order) {
    return <div>لا توجد بيانات للفاتورة</div>;
  }

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `فاتورة_GFT${order.serial}`,
    onBeforePrint: () => {
      document.body.classList.add('printing-invoice');
    },
    onAfterPrint: () => {
      document.body.classList.remove('printing-invoice');
    },
    pageStyle: `
      @media print {
        @page {
          size: A4;
          margin: 15mm;
        }
        body {
          direction: rtl !important;
          font-family: 'Tajawal', Arial, sans-serif !important;
          background: white !important;
        }
        .professional-invoice {
          box-shadow: none !important;
          border: none !important;
        }
      }
    `
  });

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    
    try {
      toast.info("جاري إنشاء ملف PDF...");
      
      printRef.current.classList.add('pdf-export');
      
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: printRef.current.scrollWidth,
        height: printRef.current.scrollHeight,
        windowWidth: 794,
        windowHeight: 1123
      });
      
      printRef.current.classList.remove('pdf-export');
      
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
      
      pdf.save(`فاتورة_GFT${order.serial}.pdf`);
      toast.success("تم إنشاء ملف PDF بنجاح");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("حدث خطأ أثناء إنشاء ملف PDF");
    }
  };

  const items = order.items || [];

  return (
    <div className="rtl" style={{ direction: 'rtl' }}>
      <div className="mb-4 flex flex-wrap gap-2 justify-end print:hidden">
        <Button 
          onClick={handlePrint}
          className="h-8 md:h-10 text-xs md:text-sm bg-gift-secondary hover:bg-gift-secondaryHover flex items-center gap-1"
        >
          <FileText className="h-3.5 w-3.5 md:h-4 md:w-4" />
          طباعة الفاتورة
        </Button>
        <Button 
          onClick={handleExportPDF}
          className="h-8 md:h-10 text-xs md:text-sm bg-blue-600 hover:bg-blue-700 flex items-center gap-1"
        >
          <Download className="h-3.5 w-3.5 md:h-4 md:w-4" />
          تصدير PDF
        </Button>
      </div>
      
      <Card ref={printRef} className="professional-invoice print:shadow-none print:border-none bg-white">
        <CardContent className="p-6 print:p-4">
          {/* Header Section */}
          <div className="text-center mb-6 pb-4 border-b-2 border-gift-primary">
            <div className="flex justify-between items-center mb-2">
              <div className="text-right">
                <p className="text-sm text-gray-600">فاتورة رقم</p>
                <p className="text-xl font-bold text-gift-primary">GFT{order.serial}</p>
              </div>
              <div className="text-center">
                <h1 className="text-2xl md:text-3xl font-bold text-gift-primary">#بتاع_هدايا_الأصلى</h1>
                <p className="text-sm text-gray-600">متجر الهدايا المميزة</p>
              </div>
              <div className="text-left">
                <p className="text-sm text-gray-600">التاريخ</p>
                <p className="text-lg font-medium">{new Date(order.dateCreated).toLocaleDateString('ar-EG')}</p>
              </div>
            </div>
          </div>
          
          {/* Customer and Order Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg border-r-4 border-gift-primary">
              <h3 className="font-bold mb-3 text-lg flex items-center gap-2 text-gift-primary">
                <Phone size={18} /> بيانات العميل
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">اسم العميل:</span>
                  <span className="font-semibold">{order.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">رقم التليفون:</span>
                  <span className="font-semibold">{order.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">طريقة السداد:</span>
                  <span className="font-semibold">{order.paymentMethod}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border-r-4 border-blue-500">
              <h3 className="font-bold mb-3 text-lg flex items-center gap-2 text-blue-600">
                <Home size={18} /> معلومات التوصيل
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">طريقة الاستلام:</span>
                  <span className="font-semibold">{order.deliveryMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">حالة الطلب:</span>
                  <span className="font-semibold px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>
                {order.deliveryMethod === "شحن للمنزل" && (
                  <>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">العنوان:</span>
                      <span className="font-semibold">{order.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">المحافظة:</span>
                      <span className="font-semibold">{order.governorate}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Items Table */}
          <div className="mb-6">
            <h3 className="font-bold mb-3 text-lg flex items-center gap-2 text-gift-primary">
              <FileText size={18} /> تفاصيل الطلب
            </h3>
            <div className="overflow-x-auto border rounded-lg">
              <Table className="text-sm">
                <TableHeader>
                  <TableRow className="bg-gift-primary text-white">
                    <TableHead className="py-3 px-4 text-white font-bold text-right">المنتج</TableHead>
                    <TableHead className="py-3 px-4 text-white font-bold text-right">المقاس</TableHead>
                    <TableHead className="py-3 px-4 text-white font-bold text-right">العدد</TableHead>
                    <TableHead className="py-3 px-4 text-white font-bold text-right">السعر</TableHead>
                    <TableHead className="py-3 px-4 text-white font-bold text-right">الإجمالي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <TableCell className="py-3 px-4 font-medium">{item.productType}</TableCell>
                      <TableCell className="py-3 px-4">{item.size}</TableCell>
                      <TableCell className="py-3 px-4 text-center font-bold">{item.quantity}</TableCell>
                      <TableCell className="py-3 px-4">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="py-3 px-4 font-bold text-gift-primary">
                        {formatCurrency(item.price * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          
          {/* Summary Section */}
          <div className="flex justify-end mb-6">
            <div className="w-full md:w-80 bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-bold mb-3 text-lg text-gift-primary">ملخص الفاتورة</h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">إجمالي المنتجات:</span>
                  <span className="font-bold">{formatCurrency(items.reduce((sum, item) => sum + item.price * item.quantity, 0))}</span>
                </div>
                {order.shippingCost > 0 && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">مصاريف الشحن:</span>
                    <span className="font-bold">{formatCurrency(order.shippingCost)}</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">الخصم:</span>
                    <span className="font-bold text-red-600">- {formatCurrency(order.discount)}</span>
                  </div>
                )}
                {order.deposit > 0 && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">العربون المدفوع:</span>
                    <span className="font-bold text-red-600">- {formatCurrency(order.deposit)}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 text-lg border-t-2 border-gift-primary bg-gift-primary text-white px-2 rounded">
                  <span className="font-bold">المجموع الكلي:</span>
                  <span className="font-bold">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="mt-8 pt-4 border-t-2 border-gray-200 text-center">
            <div className="bg-gift-accent p-4 rounded-lg mb-4">
              <p className="text-lg font-bold text-gift-primary mb-2">شكراً لثقتكم في #بتاع_هدايا_الأصلى</p>
              <div className="flex justify-center items-center gap-2 text-sm mb-3">
                <Phone size={16} className="text-gift-primary" />
                <span className="font-medium">للتواصل: 01113977005</span>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-4 mb-4 social-links">
              <a href="https://www.facebook.com/D4Uofficial" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:underline text-xs font-medium">
                <Facebook size={16} />
                <span>D4Uofficial</span>
              </a>
              
              <a href="https://www.instagram.com/design4you_gift_store" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-pink-600 hover:underline text-xs font-medium">
                <Instagram size={16} />
                <span>design4you_gift_store</span>
              </a>
              
              <a href="https://www.tiktok.com/@giftstore2022" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-black dark:text-white hover:underline text-xs font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
                <span>giftstore2022</span>
              </a>
              
              <a href="https://t.me/GiftsEg" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-500 hover:underline text-xs font-medium">
                <Send size={16} />
                <span>GiftsEg</span>
              </a>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 border-t pt-2">
              جميع الحقوق محفوظة #بتاع_هدايا_الأصلي 2025
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invoice;
