
import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Order, ORDER_STATUS_LABELS } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useReactToPrint } from "react-to-print";

interface InvoiceProps {
  order: Order;
}

const Invoice: React.FC<InvoiceProps> = ({ order }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `فاتورة_${order.serial}`
  });

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button 
          onClick={handlePrint}
          className="bg-gift-secondary hover:bg-gift-secondaryHover"
        >
          طباعة الفاتورة
        </Button>
      </div>
      
      <Card ref={printRef} className="print:shadow-none print:border-none">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gift-primary">#بتاع_هدايا_الأصلى</h1>
            <p className="text-sm text-gray-600 mt-1">فاتورة طلب</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold mb-2 text-lg">بيانات الفاتورة</h3>
              <div className="space-y-1">
                <p><span className="font-medium">رقم الفاتورة:</span> {order.serial}</p>
                <p><span className="font-medium">حالة الطلب:</span> {ORDER_STATUS_LABELS[order.status]}</p>
                <p><span className="font-medium">تاريخ الإصدار:</span> {new Date(order.dateCreated).toLocaleDateString('ar-EG')}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 text-lg">بيانات العميل</h3>
              <div className="space-y-1">
                <p><span className="font-medium">اسم العميل:</span> {order.clientName}</p>
                <p><span className="font-medium">رقم التليفون:</span> {order.phone}</p>
                <p><span className="font-medium">طريقة السداد:</span> {order.paymentMethod}</p>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-semibold mb-2 text-lg">معلومات التوصيل</h3>
            <div className="space-y-1">
              <p><span className="font-medium">طريقة الاستلام:</span> {order.deliveryMethod}</p>
              {order.deliveryMethod === "شحن للمنزل" && (
                <>
                  <p><span className="font-medium">العنوان:</span> {order.address}</p>
                  <p><span className="font-medium">المحافظة:</span> {order.governorate}</p>
                </>
              )}
            </div>
          </div>
          
          <h3 className="font-semibold mb-2 text-lg">تفاصيل الطلب</h3>
          <table className="gift-table mb-6">
            <thead>
              <tr>
                <th>نوع المنتج</th>
                <th>المقاس</th>
                <th>الكمية</th>
                <th>سعر الوحدة</th>
                <th>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{order.productType}</td>
                <td>{order.size}</td>
                <td>{order.quantity}</td>
                <td>{formatCurrency(order.price)}</td>
                <td>{formatCurrency(order.price * order.quantity)}</td>
              </tr>
            </tbody>
          </table>
          
          <div className="flex justify-end">
            <div className="w-full md:w-64">
              <div className="flex justify-between py-2">
                <span className="font-medium">الإجمالي:</span>
                <span>{formatCurrency(order.price * order.quantity)}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-gray-200">
                <span className="font-medium">الخصم:</span>
                <span>{formatCurrency(order.discount)}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-gray-200">
                <span className="font-bold text-lg">المجموع الكلي:</span>
                <span className="font-bold text-lg">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
            <p>شكراً لثقتكم في #بتاع_هدايا_الأصلى</p>
            <p>للتواصل: 01234567890</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invoice;
