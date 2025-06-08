
import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Order, ORDER_STATUS_LABELS } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useReactToPrint } from "react-to-print";
import { Facebook, Phone, Home, Map, Instagram, Send, Download, FileText, MapPin, Calendar, CreditCard, Package, User } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";

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
          margin: 10mm;
        }
        body {
          direction: rtl !important;
          font-family: 'Cairo', 'Tajawal', Arial, sans-serif !important;
          background: white !important;
          font-size: 12px !important;
        }
        .invoice-container {
          box-shadow: none !important;
          border: none !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .no-print { display: none !important; }
      }
    `
  });

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    
    try {
      toast.info("جاري إنشاء ملف PDF...");
      
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      
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
      
      pdf.save(`فاتورة_${order.clientName}_${order.serial}.pdf`);
      toast.success("تم إنشاء ملف PDF بنجاح");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("حدث خطأ أثناء إنشاء ملف PDF");
    }
  };

  const items = order.items || [];
  const subtotal = items.reduce((sum, item) => {
    const discountedPrice = item.price - (item.itemDiscount || 0);
    return sum + discountedPrice * item.quantity;
  }, 0);

  return (
    <div className="rtl w-full" style={{ direction: 'rtl' }}>
      {/* Action Buttons */}
      <div className="mb-4 flex flex-wrap gap-2 justify-end no-print">
        <Button 
          onClick={handlePrint}
          size={isMobile ? "sm" : "default"}
          className="bg-gift-secondary hover:bg-gift-secondaryHover flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          <span>طباعة</span>
        </Button>
        <Button 
          onClick={handleExportPDF}
          size={isMobile ? "sm" : "default"}
          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          <span>تصدير PDF</span>
        </Button>
      </div>
      
      <Card ref={printRef} className="invoice-container bg-white w-full overflow-hidden print:shadow-none print:border-none">
        <CardContent className="p-6 print:p-4">
          {/* Header */}
          <div className="border-b-2 border-gift-primary pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gift-primary mb-2">#بتاع_هدايا_الأصلى</h1>
                <p className="text-gray-600 mb-4">متجر الهدايا المميزة والتصميمات الحصرية</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gift-primary" />
                    <span>01113977005</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gift-primary" />
                    <span>مصر - جميع المحافظات</span>
                  </div>
                </div>
              </div>
              
              <div className="text-left">
                <div className="bg-gift-primary text-white px-4 py-2 rounded-lg mb-4">
                  <p className="text-sm opacity-90">رقم الفاتورة</p>
                  <p className="text-xl font-bold">{order.serial}</p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{new Date(order.dateCreated).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                  <Badge className={`
                    ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : ''}
                    ${order.status === 'shipped' ? 'bg-green-100 text-green-800' : ''}
                  `}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Delivery Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Customer Info */}
            <Card className="border-r-4 border-r-gift-primary">
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-gift-primary">
                  <User className="h-5 w-5" />
                  بيانات العميل
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">اسم العميل:</span>
                    <span className="font-semibold">{order.clientName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">رقم الهاتف:</span>
                    <span className="font-semibold" dir="ltr">{order.phone}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">طريقة الدفع:</span>
                    <div className="flex items-center gap-1">
                      <CreditCard className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold">{order.paymentMethod}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Info */}
            <Card className="border-r-4 border-r-blue-500">
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-blue-600">
                  <Package className="h-5 w-5" />
                  معلومات التوصيل
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">طريقة الاستلام:</span>
                    <span className="font-semibold">{order.deliveryMethod}</span>
                  </div>
                  {order.deliveryMethod === "شحن للمنزل" && (
                    <>
                      <div className="flex justify-between items-start">
                        <span className="text-gray-600">العنوان:</span>
                        <span className="font-semibold text-right max-w-[200px]">{order.address}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">المحافظة:</span>
                        <span className="font-semibold">{order.governorate}</span>
                      </div>
                    </>
                  )}
                  {order.shippingCost > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">تكلفة الشحن:</span>
                      <span className="font-semibold text-orange-600">{formatCurrency(order.shippingCost)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gift-primary">
              <Package className="h-5 w-5" />
              تفاصيل الطلب
            </h3>
            
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gift-primary text-white">
                    <TableHead className="text-white font-bold text-right">#</TableHead>
                    <TableHead className="text-white font-bold text-right">المنتج</TableHead>
                    <TableHead className="text-white font-bold text-right">المقاس</TableHead>
                    <TableHead className="text-white font-bold text-right">الكمية</TableHead>
                    <TableHead className="text-white font-bold text-right">السعر الأساسي</TableHead>
                    {items.some(item => item.itemDiscount && item.itemDiscount > 0) && (
                      <TableHead className="text-white font-bold text-right">الخصم</TableHead>
                    )}
                    <TableHead className="text-white font-bold text-right">السعر النهائي</TableHead>
                    <TableHead className="text-white font-bold text-right">الإجمالي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => {
                    const discountedPrice = item.price - (item.itemDiscount || 0);
                    const itemTotal = discountedPrice * item.quantity;
                    
                    return (
                      <TableRow key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="font-medium">{item.productType}</TableCell>
                        <TableCell>{item.size}</TableCell>
                        <TableCell className="text-center font-bold text-gift-primary">{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.price)}</TableCell>
                        {items.some(item => item.itemDiscount && item.itemDiscount > 0) && (
                          <TableCell className="text-red-600">
                            {item.itemDiscount ? formatCurrency(item.itemDiscount) : '-'}
                          </TableCell>
                        )}
                        <TableCell className="font-semibold">{formatCurrency(discountedPrice)}</TableCell>
                        <TableCell className="font-bold text-gift-primary">{formatCurrency(itemTotal)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div></div>
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gift-primary">
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-4 text-gift-primary">ملخص الفاتورة</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">إجمالي المنتجات:</span>
                    <span className="font-bold">{formatCurrency(subtotal)}</span>
                  </div>
                  
                  {order.shippingCost > 0 && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium">مصاريف الشحن:</span>
                      <span className="font-bold text-orange-600">+ {formatCurrency(order.shippingCost)}</span>
                    </div>
                  )}
                  
                  {order.discount > 0 && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium">الخصم الإجمالي:</span>
                      <span className="font-bold text-red-600">- {formatCurrency(order.discount)}</span>
                    </div>
                  )}
                  
                  {order.deposit > 0 && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium">العربون المدفوع:</span>
                      <span className="font-bold text-red-600">- {formatCurrency(order.deposit)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center py-3 bg-gift-primary text-white px-4 rounded-lg text-lg">
                    <span className="font-bold">المجموع الكلي:</span>
                    <span className="font-bold">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="border-t-2 border-gift-primary pt-6 mt-6">
            <div className="text-center mb-4">
              <div className="bg-gift-accent p-4 rounded-lg mb-4">
                <p className="font-bold text-lg text-gift-primary mb-2">شكراً لثقتكم في #بتاع_هدايا_الأصلى</p>
                <p className="text-sm text-gray-600">نتطلع لخدمتكم مرة أخرى</p>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-4 mb-4">
              <a href="tel:01113977005" className="flex items-center gap-2 text-gift-primary hover:underline">
                <Phone className="h-4 w-4" />
                <span className="font-medium">01113977005</span>
              </a>
              
              <a href="https://www.facebook.com/D4Uofficial" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                <Facebook className="h-4 w-4" />
                <span>D4Uofficial</span>
              </a>
              
              <a href="https://www.instagram.com/design4you_gift_store" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-pink-600 hover:underline">
                <Instagram className="h-4 w-4" />
                <span>design4you_gift_store</span>
              </a>
              
              <a href="https://t.me/GiftsEg" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-500 hover:underline">
                <Send className="h-4 w-4" />
                <span>GiftsEg</span>
              </a>
            </div>
            
            <div className="text-center text-xs text-gray-500 border-t pt-3">
              <p>جميع الحقوق محفوظة © #بتاع_هدايا_الأصلي 2025</p>
              <p className="mt-1">تم إنشاء هذه الفاتورة بتاريخ {new Date().toLocaleDateString('ar-EG')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invoice;
