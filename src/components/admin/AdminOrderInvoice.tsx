
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Printer, Download } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

interface AdminOrderItem {
  id: string;
  product_name: string;
  product_size: string;
  quantity: number;
  unit_cost: number;
  unit_price: number;
  item_discount: number;
  total_price: number;
  profit: number;
}

interface AdminOrder {
  id: string;
  serial: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  shipping_address?: string;
  governorate?: string;
  payment_method: string;
  delivery_method: string;
  shipping_cost: number;
  discount: number;
  deposit: number;
  total_amount: number;
  profit: number;
  status: string;
  order_date: string;
  admin_order_items: AdminOrderItem[];
}

interface AdminOrderInvoiceProps {
  order: AdminOrder;
  onClose: () => void;
}

const AdminOrderInvoice: React.FC<AdminOrderInvoiceProps> = ({ order, onClose }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
    documentTitle: `فاتورة-${order.serial}`,
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'confirmed': return 'مؤكد';
      case 'processing': return 'قيد التجهيز';
      case 'shipped': return 'تم الشحن';
      case 'delivered': return 'تم التوصيل';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500 text-white';
      case 'confirmed': return 'bg-blue-500 text-white';
      case 'processing': return 'bg-purple-500 text-white';
      case 'shipped': return 'bg-green-500 text-white';
      case 'delivered': return 'bg-emerald-500 text-white';
      case 'cancelled': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const subtotal = order.admin_order_items.reduce((sum, item) => sum + item.total_price, 0);

  return (
    <div className="space-y-4">
      {/* Print Actions */}
      <div className="flex items-center gap-2 mb-4 print:hidden">
        <Button onClick={handlePrint} className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          طباعة الفاتورة
        </Button>
        <Button variant="outline" onClick={onClose}>
          إغلاق
        </Button>
      </div>

      {/* Invoice Content */}
      <div ref={invoiceRef} className="bg-white text-black p-8" dir="rtl">
        {/* Header */}
        <div className="border-b-2 border-gray-300 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">فاتورة</h1>
              <p className="text-gray-600 mt-2">رقم الفاتورة: {order.serial}</p>
              <p className="text-gray-600">تاريخ الطلب: {new Date(order.order_date).toLocaleDateString('ar-EG')}</p>
            </div>
            <div className="text-left">
              <h2 className="text-xl font-bold text-gray-800">متجري</h2>
              <p className="text-gray-600">نظام إدارة المتاجر</p>
            </div>
          </div>
        </div>

        {/* Customer & Order Info */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-800">معلومات العميل</h3>
            <div className="space-y-2">
              <p><span className="font-medium">الاسم:</span> {order.customer_name}</p>
              <p><span className="font-medium">الهاتف:</span> {order.customer_phone}</p>
              {order.customer_email && (
                <p><span className="font-medium">البريد الإلكتروني:</span> {order.customer_email}</p>
              )}
              {order.shipping_address && (
                <p><span className="font-medium">العنوان:</span> {order.shipping_address}</p>
              )}
              {order.governorate && (
                <p><span className="font-medium">المحافظة:</span> {order.governorate}</p>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-800">معلومات الطلب</h3>
            <div className="space-y-2">
              <p><span className="font-medium">طريقة الدفع:</span> {order.payment_method}</p>
              <p><span className="font-medium">طريقة التوصيل:</span> {order.delivery_method}</p>
              <p>
                <span className="font-medium">الحالة:</span> 
                <Badge className={`mr-2 ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </Badge>
              </p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">تفاصيل الطلب</h3>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-3 text-right">المنتج</th>
                <th className="border border-gray-300 p-3 text-right">المقاس</th>
                <th className="border border-gray-300 p-3 text-center">الكمية</th>
                <th className="border border-gray-300 p-3 text-right">السعر الوحدة</th>
                <th className="border border-gray-300 p-3 text-right">خصم العنصر</th>
                <th className="border border-gray-300 p-3 text-right">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {order.admin_order_items.map((item) => (
                <tr key={item.id}>
                  <td className="border border-gray-300 p-3">{item.product_name}</td>
                  <td className="border border-gray-300 p-3">{item.product_size}</td>
                  <td className="border border-gray-300 p-3 text-center">{item.quantity}</td>
                  <td className="border border-gray-300 p-3">{formatCurrency(item.unit_price)}</td>
                  <td className="border border-gray-300 p-3">{formatCurrency(item.item_discount)}</td>
                  <td className="border border-gray-300 p-3">{formatCurrency(item.total_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64">
            <div className="space-y-2 border-t border-gray-300 pt-4">
              <div className="flex justify-between">
                <span>المجموع الفرعي:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>تكلفة الشحن:</span>
                <span>{formatCurrency(order.shipping_cost)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>الخصم:</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              {order.deposit > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>العربون المدفوع:</span>
                  <span>-{formatCurrency(order.deposit)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2">
                <span>المبلغ الإجمالي:</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-center text-gray-600">
          <p>شكراً لتعاملكم معنا</p>
          <p className="text-sm mt-2">هذه فاتورة إلكترونية لا تحتاج إلى توقيع أو ختم</p>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderInvoice;
