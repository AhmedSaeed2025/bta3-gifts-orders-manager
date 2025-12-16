import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { calculateOrderFinancials } from '@/lib/orderFinancials';

interface InvoiceTemplateProps {
  order: any;
  storeSettings?: any;
}

const ElegantInvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ order, storeSettings }) => {
  const storeName = storeSettings?.store_name || "متجري";
  const logoUrl = storeSettings?.logo_url;

  const { items, subtotal, shipping, discount, total, paid, remaining } = calculateOrderFinancials(order);

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
    <div className="bg-white text-gray-900 p-4 sm:p-6 lg:p-8 min-h-[297mm] border-8 border-double border-amber-600" dir="rtl">
      {/* Elegant Header */}
      <div className="text-center border-b-2 border-amber-600 pb-6 mb-6">
        {logoUrl && (
          <div className="flex justify-center mb-4">
            <div className="border-4 border-amber-600 rounded-full p-2">
              <img src={logoUrl} alt="Logo" className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />
            </div>
          </div>
        )}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-amber-700 mb-2">
          {storeName}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 italic">فاتورة رسمية</p>
        
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 px-4">
          <div className="text-center sm:text-right">
            <p className="text-xs sm:text-sm text-gray-500">رقم الفاتورة</p>
            <p className="text-xl sm:text-2xl font-bold text-amber-700">{order.serial}</p>
          </div>
          <div className="h-12 w-px bg-amber-300 hidden sm:block"></div>
          <div className="text-center sm:text-left">
            <p className="text-xs sm:text-sm text-gray-500">التاريخ</p>
            <p className="text-base sm:text-lg font-semibold">
              {new Date(order.order_date || order.date_created).toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="text-center mb-6">
        <span className="inline-block px-6 py-2 bg-amber-100 text-amber-800 rounded-full border-2 border-amber-300 text-sm sm:text-base font-semibold">
          {getStatusLabel(order.status)}
        </span>
      </div>

      {/* Customer & Order Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div className="border-2 border-amber-200 rounded-lg p-4 sm:p-6 bg-amber-50/30">
          <h3 className="text-base sm:text-lg font-serif font-bold text-amber-800 mb-4 pb-2 border-b-2 border-amber-300">
            بيانات العميل
          </h3>
          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex">
              <span className="text-gray-600 font-medium w-20 flex-shrink-0">الاسم:</span>
              <span className="text-gray-800 font-semibold">{order.customer_name || order.client_name}</span>
            </div>
            <div className="flex">
              <span className="text-gray-600 font-medium w-20 flex-shrink-0">الهاتف:</span>
              <span className="text-gray-800 font-semibold">{order.customer_phone || order.phone}</span>
            </div>
            {order.customer_email && (
              <div className="flex">
                <span className="text-gray-600 font-medium w-20 flex-shrink-0">البريد:</span>
                <span className="text-gray-800 font-semibold break-all">{order.customer_email}</span>
              </div>
            )}
            {(order.shipping_address || order.address) && (
              <div className="flex">
                <span className="text-gray-600 font-medium w-20 flex-shrink-0">العنوان:</span>
                <span className="text-gray-800 font-semibold">{order.shipping_address || order.address}</span>
              </div>
            )}
            {order.governorate && (
              <div className="flex">
                <span className="text-gray-600 font-medium w-20 flex-shrink-0">المحافظة:</span>
                <span className="text-gray-800 font-semibold">{order.governorate}</span>
              </div>
            )}
          </div>
        </div>

        <div className="border-2 border-amber-200 rounded-lg p-4 sm:p-6 bg-amber-50/30">
          <h3 className="text-base sm:text-lg font-serif font-bold text-amber-800 mb-4 pb-2 border-b-2 border-amber-300">
            معلومات الطلب
          </h3>
          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex">
              <span className="text-gray-600 font-medium w-24 flex-shrink-0">طريقة الدفع:</span>
              <span className="text-gray-800 font-semibold">{order.payment_method}</span>
            </div>
            <div className="flex">
              <span className="text-gray-600 font-medium w-24 flex-shrink-0">طريقة التوصيل:</span>
              <span className="text-gray-800 font-semibold">{order.delivery_method}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8 overflow-x-auto">
        <div className="border-2 border-amber-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-l from-amber-600 via-amber-700 to-amber-600 text-white">
                <th className="p-2 sm:p-3 text-xs sm:text-sm lg:text-base text-right font-serif">#</th>
                <th className="p-2 sm:p-3 text-xs sm:text-sm lg:text-base text-right font-serif">المنتج</th>
                <th className="p-2 sm:p-3 text-xs sm:text-sm lg:text-base text-right font-serif">المقاس</th>
                <th className="p-2 sm:p-3 text-xs sm:text-sm lg:text-base text-center font-serif">الكمية</th>
                <th className="p-2 sm:p-3 text-xs sm:text-sm lg:text-base text-right font-serif">السعر</th>
                <th className="p-2 sm:p-3 text-xs sm:text-sm lg:text-base text-right font-serif">الخصم</th>
                <th className="p-2 sm:p-3 text-xs sm:text-sm lg:text-base text-right font-serif">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, index: number) => {
                const itemTotal = item.total_price || (item.quantity * item.price - (item.item_discount || 0));
                return (
                  <tr key={item.id} className={`${index % 2 === 0 ? 'bg-amber-50/50' : 'bg-white'} border-b border-amber-100`}>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm text-center">{index + 1}</td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm font-medium">{item.product_name || item.product_type}</td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm">{item.product_size || item.size}</td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm text-center font-bold">{item.quantity}</td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm">{formatCurrency(item.unit_price || item.price)}</td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm text-red-600">{formatCurrency(item.item_discount || 0)}</td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm font-bold text-amber-700">{formatCurrency(itemTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="mb-8 border-2 border-amber-200 rounded-lg p-4 bg-amber-50/30">
          <h4 className="font-serif font-bold text-sm sm:text-base text-amber-800 mb-3">ملاحظات:</h4>
          <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{order.notes}</p>
        </div>
      )}

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-full sm:w-80">
          <div className="border-4 border-double border-amber-600 rounded-lg p-4 sm:p-6 bg-gradient-to-br from-amber-50 to-white">
            <div className="space-y-3 text-sm sm:text-base">
              <div className="flex justify-between border-b border-amber-200 pb-2">
                <span className="font-serif">المجموع الفرعي:</span>
                <span className="font-bold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between border-b border-amber-200 pb-2">
                <span className="font-serif">تكلفة الشحن:</span>
                <span className="font-bold">{formatCurrency(shipping)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-red-600 border-b border-amber-200 pb-2">
                  <span className="font-serif">الخصم:</span>
                  <span className="font-bold">-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg sm:text-xl font-serif pt-2 border-t-4 border-double border-amber-600">
                <span className="font-bold">الإجمالي الكلي:</span>
                <span className="font-bold text-amber-700">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-green-700 border-t border-amber-200 pt-2">
                <span className="font-serif">المبلغ المدفوع:</span>
                <span className="font-bold">{formatCurrency(-paid)}</span>
              </div>
              <div className="flex justify-between text-red-700 text-base sm:text-lg border-t border-amber-200 pt-2">
                <span className="font-serif font-bold">المتبقي:</span>
                <span className="font-bold">{formatCurrency(remaining)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Elegant Footer */}
      <div className="border-t-2 border-amber-600 pt-6 text-center">
        <p className="text-xl sm:text-2xl font-serif font-bold text-amber-700 mb-3">شكراً لثقتكم</p>
        <p className="text-xs sm:text-sm text-gray-600 mb-2">
          {storeSettings?.contact_phone && `☎ ${storeSettings.contact_phone}`}
          {storeSettings?.contact_email && ` • ✉ ${storeSettings.contact_email}`}
        </p>
        <div className="mt-4 flex justify-center">
          <div className="h-px w-32 sm:w-48 bg-gradient-to-r from-transparent via-amber-600 to-transparent"></div>
        </div>
      </div>
    </div>
  );
};

export default ElegantInvoiceTemplate;
