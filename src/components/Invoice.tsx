
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
    documentTitle: `فاتورة_${order.serial}`,
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
          margin: 10mm;
        }
        body {
          direction: rtl !important;
          font-family: 'Tajawal', Arial, sans-serif !important;
          background: white !important;
          font-size: 12px !important;
        }
        .professional-invoice {
          box-shadow: none !important;
          border: none !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .invoice-header {
          font-size: 14px !important;
        }
        .invoice-title {
          font-size: 16px !important;
        }
        .invoice-content {
          font-size: 11px !important;
        }
        .invoice-table {
          font-size: 10px !important;
        }
        .invoice-summary {
          font-size: 11px !important;
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
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: 794,
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
      
      pdf.save(`فاتورة_${order.serial}.pdf`);
      toast.success("تم إنشاء ملف PDF بنجاح");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("حدث خطأ أثناء إنشاء ملف PDF");
    }
  };

  const items = order.items || [];

  return (
    <div className="rtl w-full" style={{ direction: 'rtl' }}>
      <div className="mb-3 flex flex-wrap gap-2 justify-end print:hidden">
        <Button 
          onClick={handlePrint}
          className="h-8 text-xs bg-gift-secondary hover:bg-gift-secondaryHover flex items-center gap-1 px-3"
        >
          <FileText className="h-3 w-3" />
          <span>طباعة</span>
        </Button>
        <Button 
          onClick={handleExportPDF}
          className="h-8 text-xs bg-blue-600 hover:bg-blue-700 flex items-center gap-1 px-3"
        >
          <Download className="h-3 w-3" />
          <span>PDF</span>
        </Button>
      </div>
      
      <Card ref={printRef} className="professional-invoice print:shadow-none print:border-none bg-white w-full max-w-full overflow-hidden">
        <CardContent className="p-3 print:p-2">
          {/* Header Section */}
          <div className="text-center mb-3 pb-2 border-b-2 border-gift-primary invoice-header">
            <div className="flex flex-col items-center gap-2 mb-2">
              <div className="text-center">
                <h1 className="text-lg font-bold text-gift-primary invoice-title">#بتاع_هدايا_الأصلى</h1>
                <p className="text-xs text-gray-600">متجر الهدايا المميزة</p>
              </div>
              <div className="flex justify-between w-full text-xs">
                <div className="text-right">
                  <p className="text-gray-600">فاتورة رقم</p>
                  <p className="font-bold text-gift-primary">{order.serial}</p>
                </div>
                <div className="text-left">
                  <p className="text-gray-600">التاريخ</p>
                  <p className="font-medium">{new Date(order.dateCreated).toLocaleDateString('ar-EG')}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Customer and Order Info */}
          <div className="grid grid-cols-1 gap-3 mb-3 invoice-content">
            <div className="bg-gray-50 p-2 rounded border-r-2 border-gift-primary">
              <h3 className="font-bold mb-2 text-xs flex items-center gap-1 text-gift-primary">
                <Phone size={12} /> بيانات العميل
              </h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">اسم العميل:</span>
                  <span className="font-semibold">{order.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">التليفون:</span>
                  <span className="font-semibold">{order.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">طريقة السداد:</span>
                  <span className="font-semibold">{order.paymentMethod}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-2 rounded border-r-2 border-blue-500">
              <h3 className="font-bold mb-2 text-xs flex items-center gap-1 text-blue-600">
                <Home size={12} /> معلومات التوصيل
              </h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">طريقة الاستلام:</span>
                  <span className="font-semibold">{order.deliveryMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">حالة الطلب:</span>
                  <span className="font-semibold px-1 py-0.5 rounded text-xs bg-green-100 text-green-800">
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>
                {order.deliveryMethod === "شحن للمنزل" && (
                  <>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">العنوان:</span>
                      <span className="font-semibold break-words text-right max-w-[120px]">{order.address}</span>
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
          <div className="mb-3">
            <h3 className="font-bold mb-2 text-xs flex items-center gap-1 text-gift-primary">
              <FileText size={12} /> تفاصيل الطلب
            </h3>
            <div className="overflow-x-auto border rounded">
              <Table className="text-xs invoice-table">
                <TableHeader>
                  <TableRow className="bg-gift-primary text-white">
                    <TableHead className="py-1 px-2 text-white font-bold text-right text-xs">المنتج</TableHead>
                    <TableHead className="py-1 px-2 text-white font-bold text-right text-xs">المقاس</TableHead>
                    <TableHead className="py-1 px-2 text-white font-bold text-right text-xs">العدد</TableHead>
                    <TableHead className="py-1 px-2 text-white font-bold text-right text-xs">السعر</TableHead>
                    {items.some(item => item.itemDiscount && item.itemDiscount > 0) && (
                      <TableHead className="py-1 px-2 text-white font-bold text-right text-xs">خصم</TableHead>
                    )}
                    <TableHead className="py-1 px-2 text-white font-bold text-right text-xs">الإجمالي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => {
                    const discountedPrice = item.price - (item.itemDiscount || 0);
                    return (
                      <TableRow key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                        <TableCell className="py-1 px-2 font-medium text-xs">{item.productType}</TableCell>
                        <TableCell className="py-1 px-2 text-xs">{item.size}</TableCell>
                        <TableCell className="py-1 px-2 text-center font-bold text-xs">{item.quantity}</TableCell>
                        <TableCell className="py-1 px-2 text-xs">{formatCurrency(item.price)}</TableCell>
                        {items.some(item => item.itemDiscount && item.itemDiscount > 0) && (
                          <TableCell className="py-1 px-2 text-xs text-red-600">
                            {item.itemDiscount ? formatCurrency(item.itemDiscount) : '-'}
                          </TableCell>
                        )}
                        <TableCell className="py-1 px-2 font-bold text-gift-primary text-xs">
                          {formatCurrency(discountedPrice * item.quantity)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
          
          {/* Summary Section */}
          <div className="flex justify-end mb-3">
            <div className="w-full bg-gray-50 p-2 rounded border invoice-summary">
              <h3 className="font-bold mb-2 text-xs text-gift-primary">ملخص الفاتورة</h3>
              <div className="space-y-1">
                <div className="flex justify-between py-1 border-b text-xs">
                  <span className="font-medium">إجمالي المنتجات:</span>
                  <span className="font-bold">{formatCurrency(items.reduce((sum, item) => {
                    const discountedPrice = item.price - (item.itemDiscount || 0);
                    return sum + discountedPrice * item.quantity;
                  }, 0))}</span>
                </div>
                {order.shippingCost > 0 && (
                  <div className="flex justify-between py-1 border-b text-xs">
                    <span className="font-medium">مصاريف الشحن:</span>
                    <span className="font-bold">{formatCurrency(order.shippingCost)}</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between py-1 border-b text-xs">
                    <span className="font-medium">الخصم الإجمالي:</span>
                    <span className="font-bold text-red-600">- {formatCurrency(order.discount)}</span>
                  </div>
                )}
                {order.deposit > 0 && (
                  <div className="flex justify-between py-1 border-b text-xs">
                    <span className="font-medium">العربون المدفوع:</span>
                    <span className="font-bold text-red-600">- {formatCurrency(order.deposit)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 text-sm border-t-2 border-gift-primary bg-gift-primary text-white px-2 rounded">
                  <span className="font-bold">المجموع الكلي:</span>
                  <span className="font-bold">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="mt-4 pt-2 border-t border-gray-200 text-center">
            <div className="bg-gift-accent p-2 rounded mb-2">
              <p className="text-xs font-bold text-gift-primary mb-1">شكراً لثقتكم في #بتاع_هدايا_الأصلى</p>
              <div className="flex justify-center items-center gap-1 text-xs mb-1">
                <Phone size={10} className="text-gift-primary" />
                <span className="font-medium">للتواصل: 01113977005</span>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-2 mb-2 social-links">
              <a href="https://www.facebook.com/D4Uofficial" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline text-xs font-medium">
                <Facebook size={10} />
                <span>D4Uofficial</span>
              </a>
              
              <a href="https://www.instagram.com/design4you_gift_store" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-pink-600 hover:underline text-xs font-medium">
                <Instagram size={10} />
                <span>design4you_gift_store</span>
              </a>
              
              <a href="https://t.me/GiftsEg" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline text-xs font-medium">
                <Send size={10} />
                <span>GiftsEg</span>
              </a>
            </div>
            
            <p className="text-xs text-gray-500 border-t pt-1">
              جميع الحقوق محفوظة #بتاع_هدايا_الأصلي 2025
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invoice;
