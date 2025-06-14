
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
import { useIsMobile } from "@/hooks/use-mobile";

interface InvoiceProps {
  order: Order;
  allowEdit?: boolean;
  onEdit?: (updatedOrder: Order) => void;
}

const Invoice: React.FC<InvoiceProps> = ({ order, allowEdit = false, onEdit }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

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
          margin: 15mm;
        }
        body {
          direction: rtl !important;
          font-family: 'Tajawal', 'Cairo', 'Amiri', Arial, sans-serif !important;
          background: white !important;
          font-size: 14px !important;
          line-height: 1.6 !important;
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
        }
        .professional-invoice {
          box-shadow: none !important;
          border: none !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
        }
        .invoice-header {
          font-size: 16px !important;
          font-weight: bold !important;
          margin-bottom: 20px !important;
        }
        .invoice-title {
          font-size: 20px !important;
          font-weight: bold !important;
          color: #2563eb !important;
        }
        .invoice-content {
          font-size: 13px !important;
          line-height: 1.5 !important;
        }
        .invoice-table {
          font-size: 12px !important;
          border-collapse: collapse !important;
          width: 100% !important;
        }
        .invoice-table th,
        .invoice-table td {
          border: 1px solid #d1d5db !important;
          padding: 8px !important;
          text-align: right !important;
        }
        .invoice-table th {
          background-color: #2563eb !important;
          color: white !important;
          font-weight: bold !important;
        }
        .invoice-summary {
          font-size: 13px !important;
          margin-top: 20px !important;
        }
        .text-right {
          text-align: right !important;
        }
        .text-center {
          text-align: center !important;
        }
        .flex {
          display: flex !important;
        }
        .justify-between {
          justify-content: space-between !important;
        }
        .items-center {
          align-items: center !important;
        }
        .gap-2 {
          gap: 8px !important;
        }
        .mb-2 {
          margin-bottom: 8px !important;
        }
        .mb-3 {
          margin-bottom: 12px !important;
        }
        .p-2 {
          padding: 8px !important;
        }
        .rounded {
          border-radius: 4px !important;
        }
        .border {
          border: 1px solid #d1d5db !important;
        }
        .bg-gray-50 {
          background-color: #f9fafb !important;
        }
        .bg-blue-50 {
          background-color: #eff6ff !important;
        }
        .font-bold {
          font-weight: bold !important;
        }
        .font-medium {
          font-weight: 500 !important;
        }
        img {
          opacity: 1 !important;
          visibility: visible !important;
          display: inline-block !important;
          max-width: 100% !important;
          height: auto !important;
        }
      }
    `
  });

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    
    try {
      toast.info("جاري إنشاء ملف PDF بجودة عالية...");
      
      const element = printRef.current;
      
      // تحسين إعدادات html2canvas خاصة للموبايل
      const canvas = await html2canvas(element, {
        scale: isMobile ? 2 : 3, // تقليل المقياس للموبايل لتحسين الأداء
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: false,
        foreignObjectRendering: false,
        imageTimeout: 3000,
        removeContainer: true,
        width: element.offsetWidth,
        height: element.offsetHeight,
        windowWidth: isMobile ? 375 : 1200, // تحديد عرض النافذة للموبايل
        windowHeight: isMobile ? 667 : 800,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('.professional-invoice') as HTMLElement;
          if (clonedElement) {
            clonedElement.style.fontFamily = 'Tajawal, Cairo, Amiri, Arial, sans-serif';
            clonedElement.style.direction = 'rtl';
            clonedElement.style.textAlign = 'right';
            clonedElement.style.lineHeight = '1.6';
            clonedElement.style.backgroundColor = 'white';
            clonedElement.style.transform = 'none';
            clonedElement.style.width = '100%';
            clonedElement.style.maxWidth = 'none';
          }
          
          const images = clonedDoc.querySelectorAll('img');
          images.forEach((img) => {
            img.style.opacity = '1';
            img.style.visibility = 'visible';
            img.style.display = 'inline-block';
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
          });
          
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el) => {
            if (el instanceof HTMLElement) {
              el.style.fontFamily = 'Tajawal, Cairo, Amiri, Arial, sans-serif';
              el.style.direction = 'rtl';
              (el.style as any)['-webkit-font-smoothing'] = 'antialiased';
              (el.style as any)['-moz-osx-font-smoothing'] = 'grayscale';
              (el.style as any)['text-rendering'] = 'optimizeLegibility';
              // إزالة hover effects التي تسبب المشاكل
              (el.style as any)['pointer-events'] = 'none';
            }
          });
          
          const tables = clonedDoc.querySelectorAll('table');
          tables.forEach((table) => {
            table.style.borderCollapse = 'collapse';
            table.style.width = '100%';
            table.style.direction = 'rtl';
          });
          
          const tableCells = clonedDoc.querySelectorAll('th, td');
          tableCells.forEach((cell) => {
            if (cell instanceof HTMLElement) {
              cell.style.border = '1px solid #d1d5db';
              cell.style.padding = isMobile ? '4px' : '8px';
              cell.style.textAlign = 'right';
              cell.style.verticalAlign = 'middle';
              cell.style.backgroundColor = 'white';
              cell.style.color = 'black';
              // منع hover effects
              (cell.style as any)['pointer-events'] = 'none';
            }
          });
        }
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: false,
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // تحسين حساب النسبة للموبايل
      const maxWidth = pdfWidth - 20; // هامش 10mm من كل جانب
      const maxHeight = pdfHeight - 20;
      
      let ratio = Math.min(maxWidth / (imgWidth * 0.75), maxHeight / (imgHeight * 0.75));
      
      // تحسين النسبة للموبايل
      if (isMobile) {
        ratio = Math.min(ratio * 1.2, maxWidth / (imgWidth * 0.6));
      }
      
      const finalWidth = (imgWidth * 0.75) * ratio;
      const finalHeight = (imgHeight * 0.75) * ratio;
      
      const x = (pdfWidth - finalWidth) / 2;
      const y = 10;
      
      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight, undefined, 'FAST');
      
      let heightLeft = finalHeight;
      let position = y;
      
      while (heightLeft > (pdfHeight - 20)) {
        position = heightLeft - finalHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', x, position + 10, finalWidth, finalHeight, undefined, 'FAST');
        heightLeft -= (pdfHeight - 20);
      }
      
      pdf.save(`فاتورة_${order.serial}.pdf`);
      toast.success("تم إنشاء ملف PDF بجودة عالية بنجاح");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("حدث خطأ أثناء إنشاء ملف PDF. حاول مرة أخرى.");
    }
  };

  const items = order.items || [];

  return (
    <div className="rtl w-full" style={{ direction: 'rtl', fontFamily: 'Tajawal, Cairo, Amiri, Arial, sans-serif' }}>
      <div className={`mb-3 flex flex-wrap gap-2 justify-end print:hidden ${isMobile ? 'mb-2' : ''}`}>
        <Button 
          onClick={handlePrint}
          className={`${isMobile ? 'h-7 text-[10px]' : 'h-8 text-xs'} bg-gift-secondary hover:bg-gift-secondaryHover flex items-center gap-1 px-3`}
        >
          <FileText className={isMobile ? "h-2.5 w-2.5" : "h-3 w-3"} />
          <span>طباعة</span>
        </Button>
        <Button 
          onClick={handleExportPDF}
          className={`${isMobile ? 'h-7 text-[10px]' : 'h-8 text-xs'} bg-blue-600 hover:bg-blue-700 flex items-center gap-1 px-3`}
        >
          <Download className={isMobile ? "h-2.5 w-2.5" : "h-3 w-3"} />
          <span>PDF عالي الجودة</span>
        </Button>
      </div>
      
      <Card 
        ref={printRef} 
        className="professional-invoice print:shadow-none print:border-none bg-white w-full max-w-full overflow-hidden"
        style={{ 
          fontFamily: 'Tajawal, Cairo, Amiri, Arial, sans-serif',
          direction: 'rtl',
          textAlign: 'right',
          lineHeight: '1.6'
        }}
      >
        <CardContent className={`${isMobile ? 'p-2' : 'p-4'} print:p-3`}>
          {/* Header Section with Logo */}
          <div className={`text-center ${isMobile ? 'mb-2 pb-2' : 'mb-4 pb-3'} border-b-2 border-gift-primary invoice-header`}>
            <div className={`flex flex-col items-center ${isMobile ? 'gap-2 mb-2' : 'gap-3 mb-3'}`}>
              {/* Logo and Brand */}
              <div className="flex items-center justify-center gap-4">
                <img 
                  src="/lovable-uploads/027863c0-c46a-422a-84a8-7bf9c01dbfa6.png" 
                  alt="#بتاع_هدايا_الأصلى Logo" 
                  className={`${isMobile ? 'h-10 w-10' : 'h-14 w-14'} object-contain`}
                  loading="eager"
                  width={isMobile ? "40" : "56"}
                  height={isMobile ? "40" : "56"}
                  style={{ 
                    opacity: 1, 
                    visibility: 'visible', 
                    display: 'inline-block',
                    maxWidth: isMobile ? '40px' : '56px',
                    maxHeight: isMobile ? '40px' : '56px'
                  }}
                />
                <div className="text-center">
                  <h1 className={`${isMobile ? 'text-sm' : 'text-xl'} font-bold text-gift-primary invoice-title`}>#بتاع_هدايا_الأصلى</h1>
                  <p className={`${isMobile ? 'text-[10px]' : 'text-sm'} text-gray-600`}>ملوك الهدايا في مصر</p>
                </div>
              </div>
              
              <div className={`flex justify-between w-full ${isMobile ? 'text-[10px]' : 'text-sm'}`}>
                <div className="text-right">
                  <p className="text-gray-600 font-medium">فاتورة رقم</p>
                  <p className={`font-bold text-gift-primary ${isMobile ? 'text-xs' : 'text-base'}`}>{order.serial}</p>
                </div>
                <div className="text-left">
                  <p className="text-gray-600 font-medium">التاريخ</p>
                  <p className="font-medium">{new Date(order.dateCreated).toLocaleDateString('ar-EG')}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Customer and Order Info */}
          <div className={`grid grid-cols-1 ${isMobile ? 'gap-2 mb-2' : 'gap-4 mb-4'} invoice-content`}>
            <div className={`bg-gray-50 ${isMobile ? 'p-2' : 'p-3'} rounded border-r-4 border-gift-primary`}>
              <h3 className={`font-bold ${isMobile ? 'mb-2 text-[10px]' : 'mb-3 text-sm'} flex items-center gap-2 text-gift-primary`}>
                <Phone size={isMobile ? 10 : 14} /> بيانات العميل
              </h3>
              <div className={`space-y-2 ${isMobile ? 'text-[10px]' : 'text-sm'}`}>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">اسم العميل:</span>
                  <span className="font-semibold">{order.clientName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">التليفون:</span>
                  <span className="font-semibold">{order.phone}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">طريقة السداد:</span>
                  <span className="font-semibold">{order.paymentMethod}</span>
                </div>
              </div>
            </div>
            
            <div className={`bg-blue-50 ${isMobile ? 'p-2' : 'p-3'} rounded border-r-4 border-blue-500`}>
              <h3 className={`font-bold ${isMobile ? 'mb-2 text-[10px]' : 'mb-3 text-sm'} flex items-center gap-2 text-blue-600`}>
                <Home size={isMobile ? 10 : 14} /> معلومات التوصيل
              </h3>
              <div className={`space-y-2 ${isMobile ? 'text-[10px]' : 'text-sm'}`}>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">طريقة الاستلام:</span>
                  <span className="font-semibold">{order.deliveryMethod}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">حالة الطلب:</span>
                  <span className={`font-semibold ${isMobile ? 'px-1 py-0.5 text-[9px]' : 'px-2 py-1 text-sm'} rounded bg-green-100 text-green-800`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>
                {order.deliveryMethod === "شحن للمنزل" && (
                  <>
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-gray-700">العنوان:</span>
                      <span className={`font-semibold text-right ${isMobile ? 'max-w-[120px]' : 'max-w-[200px]'} break-words`}>{order.address}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">المحافظة:</span>
                      <span className="font-semibold">{order.governorate}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Items Table */}
          <div className={`${isMobile ? 'mb-2' : 'mb-4'}`}>
            <h3 className={`font-bold ${isMobile ? 'mb-2 text-[10px]' : 'mb-3 text-sm'} flex items-center gap-2 text-gift-primary`}>
              <FileText size={isMobile ? 10 : 14} /> تفاصيل الطلب
            </h3>
            <div className="overflow-x-auto border rounded">
              <Table className={`${isMobile ? 'text-[9px]' : 'text-sm'} invoice-table w-full border-collapse`}>
                <TableHeader>
                  <TableRow className="bg-gift-primary text-white">
                    <TableHead className={`${isMobile ? 'py-1 px-1' : 'py-2 px-3'} text-white font-bold text-right ${isMobile ? 'text-[9px]' : 'text-sm'} border border-white`}>المنتج</TableHead>
                    <TableHead className={`${isMobile ? 'py-1 px-1' : 'py-2 px-3'} text-white font-bold text-right ${isMobile ? 'text-[9px]' : 'text-sm'} border border-white`}>المقاس</TableHead>
                    <TableHead className={`${isMobile ? 'py-1 px-1' : 'py-2 px-3'} text-white font-bold text-right ${isMobile ? 'text-[9px]' : 'text-sm'} border border-white`}>العدد</TableHead>
                    <TableHead className={`${isMobile ? 'py-1 px-1' : 'py-2 px-3'} text-white font-bold text-right ${isMobile ? 'text-[9px]' : 'text-sm'} border border-white`}>السعر</TableHead>
                    {items.some(item => item.itemDiscount && item.itemDiscount > 0) && (
                      <TableHead className={`${isMobile ? 'py-1 px-1' : 'py-2 px-3'} text-white font-bold text-right ${isMobile ? 'text-[9px]' : 'text-sm'} border border-white`}>خصم</TableHead>
                    )}
                    <TableHead className={`${isMobile ? 'py-1 px-1' : 'py-2 px-3'} text-white font-bold text-right ${isMobile ? 'text-[9px]' : 'text-sm'} border border-white`}>الإجمالي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => {
                    const discountedPrice = item.price - (item.itemDiscount || 0);
                    return (
                      <TableRow 
                        key={index} 
                        className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} invoice-row`}
                        style={{ 
                          backgroundColor: index % 2 === 0 ? "#f9fafb" : "white",
                          transition: "none",
                          pointerEvents: "none"
                        }}
                      >
                        <TableCell 
                          className={`${isMobile ? 'py-1 px-1' : 'py-2 px-3'} font-medium ${isMobile ? 'text-[9px]' : 'text-sm'} border border-gray-300`}
                          style={{ 
                            backgroundColor: "inherit",
                            color: "black",
                            transition: "none",
                            pointerEvents: "none"
                          }}
                        >
                          {item.productType}
                        </TableCell>
                        <TableCell 
                          className={`${isMobile ? 'py-1 px-1' : 'py-2 px-3'} ${isMobile ? 'text-[9px]' : 'text-sm'} border border-gray-300`}
                          style={{ 
                            backgroundColor: "inherit",
                            color: "black",
                            transition: "none",
                            pointerEvents: "none"
                          }}
                        >
                          {item.size}
                        </TableCell>
                        <TableCell 
                          className={`${isMobile ? 'py-1 px-1' : 'py-2 px-3'} text-center font-bold ${isMobile ? 'text-[9px]' : 'text-sm'} border border-gray-300`}
                          style={{ 
                            backgroundColor: "inherit",
                            color: "black",
                            transition: "none",
                            pointerEvents: "none"
                          }}
                        >
                          {item.quantity}
                        </TableCell>
                        <TableCell className={`${isMobile ? 'py-1 px-1' : 'py-2 px-3'} ${isMobile ? 'text-[9px]' : 'text-sm'} border border-gray-300`}>{formatCurrency(item.price)}</TableCell>
                        {items.some(item => item.itemDiscount && item.itemDiscount > 0) && (
                          <TableCell className={`${isMobile ? 'py-1 px-1' : 'py-2 px-3'} ${isMobile ? 'text-[9px]' : 'text-sm'} text-red-600 border border-gray-300`}>
                            {item.itemDiscount ? formatCurrency(item.itemDiscount) : '-'}
                          </TableCell>
                        )}
                        <TableCell className={`${isMobile ? 'py-1 px-1' : 'py-2 px-3'} font-bold text-gift-primary ${isMobile ? 'text-[9px]' : 'text-sm'} border border-gray-300`}>
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
          <div className={`flex justify-end ${isMobile ? 'mb-2' : 'mb-4'}`}>
            <div className={`w-full max-w-md bg-gray-50 ${isMobile ? 'p-2' : 'p-3'} rounded border invoice-summary`}>
              <h3 className={`font-bold ${isMobile ? 'mb-2 text-[10px]' : 'mb-3 text-sm'} text-gift-primary`}>ملخص الفاتورة</h3>
              <div className="space-y-2">
                <div className={`flex justify-between py-1 border-b ${isMobile ? 'text-[10px]' : 'text-sm'}`}>
                  <span className="font-medium">إجمالي المنتجات:</span>
                  <span className="font-bold">{formatCurrency(items.reduce((sum, item) => {
                    const discountedPrice = item.price - (item.itemDiscount || 0);
                    return sum + discountedPrice * item.quantity;
                  }, 0))}</span>
                </div>
                {order.shippingCost > 0 && (
                  <div className={`flex justify-between py-1 border-b ${isMobile ? 'text-[10px]' : 'text-sm'}`}>
                    <span className="font-medium">مصاريف الشحن:</span>
                    <span className="font-bold">{formatCurrency(order.shippingCost)}</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className={`flex justify-between py-1 border-b ${isMobile ? 'text-[10px]' : 'text-sm'}`}>
                    <span className="font-medium">الخصم الإجمالي:</span>
                    <span className="font-bold text-red-600">- {formatCurrency(order.discount)}</span>
                  </div>
                )}
                {order.deposit > 0 && (
                  <div className={`flex justify-between py-1 border-b ${isMobile ? 'text-[10px]' : 'text-sm'}`}>
                    <span className="font-medium">العربون المدفوع:</span>
                    <span className="font-bold text-red-600">- {formatCurrency(order.deposit)}</span>
                  </div>
                )}
                <div className={`flex justify-between ${isMobile ? 'py-2 text-xs' : 'py-3 text-base'} border-t-2 border-gift-primary bg-gift-primary text-white px-3 rounded font-bold`}>
                  <span>المجموع الكلي:</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className={`${isMobile ? 'mt-2 pt-2' : 'mt-4 pt-3'} border-t border-gray-200 text-center`}>
            <div className={`bg-gift-accent ${isMobile ? 'p-2' : 'p-3'} rounded mb-3 flex items-center justify-center gap-3`}>
              <img 
                src="/lovable-uploads/027863c0-c46a-422a-84a8-7bf9c01dbfa6.png" 
                alt="Logo" 
                className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} object-contain`}
                loading="eager"
                width={isMobile ? "24" : "32"}
                height={isMobile ? "24" : "32"}
                style={{ 
                  opacity: 1, 
                  visibility: 'visible', 
                  display: 'inline-block',
                  maxWidth: isMobile ? '24px' : '32px',
                  maxHeight: isMobile ? '24px' : '32px'
                }}
              />
              <div>
                <p className={`${isMobile ? 'text-[10px]' : 'text-sm'} font-bold text-gift-primary mb-1`}>شكراً لثقتكم في #بتاع_هدايا_الأصلى</p>
                <div className={`flex justify-center items-center gap-2 ${isMobile ? 'text-[9px]' : 'text-sm'} mb-1`}>
                  <Phone size={isMobile ? 8 : 12} className="text-gift-primary" />
                  <span className="font-medium">للتواصل: 01113977005</span>
                </div>
              </div>
            </div>
            
            <div className={`flex flex-wrap justify-center items-center gap-3 mb-3 social-links ${isMobile ? 'gap-2' : ''}`}>
              <a href="https://www.facebook.com/D4Uofficial" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1 text-blue-600 hover:underline ${isMobile ? 'text-[9px]' : 'text-sm'} font-medium`}>
                <Facebook size={isMobile ? 8 : 12} />
                <span>D4Uofficial</span>
              </a>
              
              <a href="https://www.instagram.com/design4you_gift_store" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1 text-pink-600 hover:underline ${isMobile ? 'text-[9px]' : 'text-sm'} font-medium`}>
                <Instagram size={isMobile ? 8 : 12} />
                <span>design4you_gift_store</span>
              </a>
              
              <a href="https://t.me/GiftsEg" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1 text-blue-500 hover:underline ${isMobile ? 'text-[9px]' : 'text-sm'} font-medium`}>
                <Send size={isMobile ? 8 : 12} />
                <span>GiftsEg</span>
              </a>
            </div>
            
            <p className={`${isMobile ? 'text-[9px]' : 'text-sm'} text-gray-500 border-t pt-2`}>
              جميع الحقوق محفوظة #بتاع_هدايا_الأصلى 2025
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invoice;
