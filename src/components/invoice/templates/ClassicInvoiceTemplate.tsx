import React from 'react';
import { formatCurrency } from '@/lib/utils';

interface InvoiceTemplateProps {
  order: any;
  storeSettings?: any;
}

const ClassicInvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ order, storeSettings }) => {
  const items = order.order_items || order.admin_order_items || [];
  const storeName = storeSettings?.store_name || "متجري";
  const logoUrl = storeSettings?.logo_url;
  
  const subtotal = items.reduce((sum: number, item: any) => {
    const itemTotal = item.total_price || (item.quantity * item.price - (item.item_discount || 0));
    return sum + itemTotal;
  }, 0);
  
  const total = subtotal + (order.shipping_cost || 0) - (order.discount || 0);
  const paid = order.payments_received || order.deposit || 0;
  const remaining = total - paid;

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'في الانتظار',
      confirmed: 'مؤكد',
      processing: 'قيد التجهيز',
      shipped: 'تم الشحن',
      delivered: 'تم التوصيل',
      cancelled: 'ملغي'
    };
    return labels[status] || status;
  };

  return (
    <div className="bg-white text-gray-900 p-4 sm:p-6 lg:p-8 min-h-[297mm]" dir="rtl">
      {/* Header */}
      <div className="border-b-4 border-blue-600 pb-4 mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {logoUrl && (
              <img src={logoUrl} alt="Logo" className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />
            )}
            <div className="text-center sm:text-right">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600">{storeName}</h1>
              <p className="text-sm sm:text-base text-gray-600">فاتورة مبيعات</p>
            </div>
          </div>
          <div className="text-center sm:text-left bg-blue-50 p-3 sm:p-4 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-600">رقم الفاتورة</p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{order.serial}</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {new Date(order.order_date || order.date_created).toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 border-b border-gray-300 pb-2">
            بيانات العميل
          </h3>
          <div className="space-y-2 text-sm sm:text-base">
            <p><span className="font-semibold">الاسم:</span> {order.customer_name || order.client_name}</p>
            <p><span className="font-semibold">الهاتف:</span> {order.customer_phone || order.phone}</p>
            {order.customer_email && <p><span className="font-semibold">البريد:</span> {order.customer_email}</p>}
            {(order.shipping_address || order.address) && (
              <p><span className="font-semibold">العنوان:</span> {order.shipping_address || order.address}</p>
            )}
            {order.governorate && <p><span className="font-semibold">المحافظة:</span> {order.governorate}</p>}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 border-b border-gray-300 pb-2">
            تفاصيل الطلب
          </h3>
          <div className="space-y-2 text-sm sm:text-base">
            <p><span className="font-semibold">طريقة الدفع:</span> {order.payment_method}</p>
            <p><span className="font-semibold">التوصيل:</span> {order.delivery_method}</p>
            <p>
              <span className="font-semibold">الحالة:</span>
              <span className="mr-2 px-3 py-1 rounded-full text-xs sm:text-sm bg-blue-100 text-blue-800">
                {getStatusLabel(order.status)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-6 overflow-x-auto">
        <table className="w-full border-collapse border-2 border-gray-300">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="border border-gray-300 p-2 sm:p-3 text-xs sm:text-sm lg:text-base text-right">#</th>
              <th className="border border-gray-300 p-2 sm:p-3 text-xs sm:text-sm lg:text-base text-right">المنتج</th>
              <th className="border border-gray-300 p-2 sm:p-3 text-xs sm:text-sm lg:text-base text-right">المقاس</th>
              <th className="border border-gray-300 p-2 sm:p-3 text-xs sm:text-sm lg:text-base text-center">الكمية</th>
              <th className="border border-gray-300 p-2 sm:p-3 text-xs sm:text-sm lg:text-base text-right">السعر</th>
              <th className="border border-gray-300 p-2 sm:p-3 text-xs sm:text-sm lg:text-base text-right">الخصم</th>
              <th className="border border-gray-300 p-2 sm:p-3 text-xs sm:text-sm lg:text-base text-right">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, index: number) => {
              const itemTotal = item.total_price || (item.quantity * item.price - (item.item_discount || 0));
              return (
                <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 p-2 sm:p-3 text-xs sm:text-sm text-center">{index + 1}</td>
                  <td className="border border-gray-300 p-2 sm:p-3 text-xs sm:text-sm">{item.product_name || item.product_type}</td>
                  <td className="border border-gray-300 p-2 sm:p-3 text-xs sm:text-sm">{item.product_size || item.size}</td>
                  <td className="border border-gray-300 p-2 sm:p-3 text-xs sm:text-sm text-center">{item.quantity}</td>
                  <td className="border border-gray-300 p-2 sm:p-3 text-xs sm:text-sm">{formatCurrency(item.unit_price || item.price)}</td>
                  <td className="border border-gray-300 p-2 sm:p-3 text-xs sm:text-sm text-red-600">{formatCurrency(item.item_discount || 0)}</td>
                  <td className="border border-gray-300 p-2 sm:p-3 text-xs sm:text-sm font-bold">{formatCurrency(itemTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="mb-6 bg-yellow-50 border-r-4 border-yellow-400 p-4 rounded">
          <h4 className="font-bold text-sm sm:text-base text-gray-800 mb-2">ملاحظات:</h4>
          <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap">{order.notes}</p>
        </div>
      )}

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-full sm:w-80 bg-gray-50 p-4 sm:p-6 rounded-lg border-2 border-gray-300">
          <div className="space-y-3 text-sm sm:text-base">
            <div className="flex justify-between">
              <span className="font-medium">المجموع الفرعي:</span>
              <span className="font-bold">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">تكلفة الشحن:</span>
              <span className="font-bold">{formatCurrency(order.shipping_cost || 0)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span className="font-medium">الخصم:</span>
                <span className="font-bold">-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="border-t-2 border-gray-400 pt-3 flex justify-between text-lg sm:text-xl">
              <span className="font-bold">الإجمالي الكلي:</span>
              <span className="font-bold text-blue-600">{formatCurrency(total)}</span>
            </div>
            {paid > 0 && (
              <>
                <div className="flex justify-between text-green-600">
                  <span className="font-medium">المبلغ المدفوع:</span>
                  <span className="font-bold">{formatCurrency(paid)}</span>
                </div>
                {remaining > 0 && (
                  <div className="flex justify-between text-red-600 text-base sm:text-lg">
                    <span className="font-bold">المتبقي:</span>
                    <span className="font-bold">{formatCurrency(remaining)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-gray-300 pt-4 text-center">
        <p className="text-base sm:text-lg font-bold text-blue-600 mb-2">شكراً لتعاملكم معنا</p>
        <p className="text-xs sm:text-sm text-gray-600">
          {storeSettings?.contact_phone && `هاتف: ${storeSettings.contact_phone}`}
          {storeSettings?.contact_email && ` • بريد: ${storeSettings.contact_email}`}
        </p>
      </div>
    </div>
  );
};

export default ClassicInvoiceTemplate;
