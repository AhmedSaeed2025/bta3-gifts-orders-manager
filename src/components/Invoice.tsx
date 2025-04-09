
import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Order, ORDER_STATUS_LABELS } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useReactToPrint } from "react-to-print";
import { Facebook, Phone, Home, Map, Instagram, Send } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface InvoiceProps {
  order: Order;
}

const Invoice: React.FC<InvoiceProps> = ({ order }) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Safety check - ensure order exists
  if (!order) {
    return <div>لا توجد بيانات للفاتورة</div>;
  }

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `فاتورة_${order.serial}`,
    onBeforePrint: () => {
      // Add a print-specific class to body before printing
      document.body.classList.add('printing-invoice');
    },
    onAfterPrint: () => {
      // Remove the print-specific class after printing
      document.body.classList.remove('printing-invoice');
    }
  });

  // Ensure items array exists, or default to empty array
  const items = order.items || [];

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button 
          onClick={handlePrint}
          className="bg-gift-secondary hover:bg-gift-secondaryHover print:hidden"
        >
          طباعة الفاتورة
        </Button>
      </div>
      
      <Card ref={printRef} className="print:shadow-none print:border-none">
        <CardContent className="p-2 print:p-0 text-xs">
          <div className="text-center mb-3">
            <h1 className="text-lg md:text-xl font-bold text-gift-primary">#بتاع_هدايا_الأصلى</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">فاتورة طلب</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 text-xs">
            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
              <h3 className="font-semibold mb-1 text-xs flex items-center gap-1">
                <Map size={12} /> بيانات الفاتورة
              </h3>
              <div className="space-y-0.5">
                <p><span className="font-medium">رقم الفاتورة:</span> {order.serial}</p>
                <p><span className="font-medium">حالة الطلب:</span> {ORDER_STATUS_LABELS[order.status]}</p>
                <p><span className="font-medium">تاريخ الإصدار:</span> {new Date(order.dateCreated).toLocaleDateString('ar-EG')}</p>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
              <h3 className="font-semibold mb-1 text-xs flex items-center gap-1">
                <Phone size={12} /> بيانات العميل
              </h3>
              <div className="space-y-0.5">
                <p><span className="font-medium">اسم العميل:</span> {order.clientName}</p>
                <p><span className="font-medium">رقم التليفون:</span> {order.phone}</p>
                <p><span className="font-medium">طريقة السداد:</span> {order.paymentMethod}</p>
              </div>
            </div>
          </div>
          
          <div className="mb-3 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg text-xs">
            <h3 className="font-semibold mb-1 text-xs flex items-center gap-1">
              <Home size={12} /> معلومات التوصيل
            </h3>
            <div className="space-y-0.5">
              <p><span className="font-medium">طريقة الاستلام:</span> {order.deliveryMethod}</p>
              {order.deliveryMethod === "شحن للمنزل" && (
                <>
                  <p><span className="font-medium">العنوان:</span> {order.address}</p>
                  <p><span className="font-medium">المحافظة:</span> {order.governorate}</p>
                </>
              )}
            </div>
          </div>
          
          <div className="mb-3">
            <h3 className="font-semibold mb-1 text-xs">تفاصيل الطلب</h3>
            <div className="overflow-x-auto">
              <Table className="text-xs border-collapse">
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="py-1 px-1">المنتج</TableHead>
                    <TableHead className="py-1 px-1">المقاس</TableHead>
                    <TableHead className="py-1 px-1">العدد</TableHead>
                    <TableHead className="py-1 px-1">السعر</TableHead>
                    <TableHead className="py-1 px-1">الإجمالي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index} className="border-b border-gray-200">
                      <TableCell className="py-1 px-1">{item.productType}</TableCell>
                      <TableCell className="py-1 px-1">{item.size}</TableCell>
                      <TableCell className="py-1 px-1">{item.quantity}</TableCell>
                      <TableCell className="py-1 px-1">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="py-1 px-1 font-medium">{formatCurrency(item.price * item.quantity)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <div className="flex justify-end">
            <div className="w-full md:w-64">
              <div className="flex justify-between py-1 text-xs">
                <span className="font-medium">إجمالي المنتجات:</span>
                <span>{formatCurrency(items.reduce((sum, item) => sum + item.price * item.quantity, 0))}</span>
              </div>
              {order.shippingCost > 0 && (
                <div className="flex justify-between py-1 text-xs border-t border-gray-200 dark:border-gray-700">
                  <span className="font-medium">مصاريف الشحن:</span>
                  <span>{formatCurrency(order.shippingCost)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between py-1 text-xs border-t border-gray-200 dark:border-gray-700">
                  <span className="font-medium">الخصم:</span>
                  <span className="text-red-600 font-medium">- {formatCurrency(order.discount)}</span>
                </div>
              )}
              {order.deposit > 0 && (
                <div className="flex justify-between py-1 text-xs border-t border-gray-200 dark:border-gray-700">
                  <span className="font-medium">العربون المدفوع:</span>
                  <span className="text-red-600 font-medium">- {formatCurrency(order.deposit)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 text-sm border-t border-gray-200 dark:border-gray-700">
                <span className="font-bold">المجموع الكلي:</span>
                <span className="font-bold">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500 dark:text-gray-400">
            <p>شكراً لثقتكم في #بتاع_هدايا_الأصلى</p>
            <div className="flex justify-center items-center gap-1 mt-1">
              <Phone size={10} />
              <span>للتواصل: 01113977005</span>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-3 mt-2">
              <a href="https://www.facebook.com/D4Uofficial" className="flex items-center gap-1 text-blue-600 hover:underline">
                <Facebook size={10} />
                <span>D4Uofficial</span>
              </a>
              
              <a href="https://www.instagram.com/design4you_gift_store" className="flex items-center gap-1 text-pink-600 hover:underline">
                <Instagram size={10} />
                <span>design4you_gift_store</span>
              </a>
              
              <a href="https://www.tiktok.com/@giftstore2022" className="flex items-center gap-1 text-gray-800 hover:underline">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"></path>
                  <path d="M15 8c0 1 .1 2 2 2"></path>
                  <path d="M12 16c-1.9 0-3-1.1-3-3V9"></path>
                  <path d="M14 4c0 1 2 2 2 2"></path>
                  <path d="M14 8c4 0 4-4 4-4"></path>
                  <path d="M15 12V4"></path>
                </svg>
                <span>giftstore2022</span>
              </a>
              
              <a href="https://t.me/GiftsEg" className="flex items-center gap-1 text-blue-500 hover:underline">
                <Send size={10} />
                <span>GiftsEg</span>
              </a>
            </div>
            
            <p className="mt-2 text-[9px]">جميع الحقوق محفوظة #بتاع_هدايا_الأصلي 2025</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invoice;
