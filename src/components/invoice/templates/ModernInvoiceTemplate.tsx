import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { calculateOrderFinancials } from '@/lib/orderFinancials';
import { useOrderStatuses } from '@/hooks/useOrderStatuses';

interface InvoiceTemplateProps {
  order: any;
  storeSettings?: any;
}

const ModernInvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ order, storeSettings }) => {
  const storeName = storeSettings?.store_name || "متجري";
  const logoUrl = storeSettings?.logo_url;
  const { getStatusLabel } = useOrderStatuses();

  const { items, subtotal, shipping, discount, total, paid, remaining } = calculateOrderFinancials(order);

  const getModernStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-500',
      confirmed: 'bg-blue-500',
      processing: 'bg-purple-500',
      shipped: 'bg-green-500',
      delivered: 'bg-emerald-500',
      cancelled: 'bg-red-500',
      completed: 'bg-emerald-600'
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50 text-gray-900 p-4 sm:p-6" dir="rtl">
      {/* Modern Header with Gradient */}
      <div className="bg-gradient-to-l from-blue-600 via-purple-600 to-blue-700 text-white rounded-xl p-4 mb-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {logoUrl && (
              <div className="bg-white p-1.5 rounded-lg shadow">
                <img src={logoUrl} alt="Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
              </div>
            )}
            <div className="text-center sm:text-right">
              <h1 className="text-lg sm:text-xl font-black tracking-tight">{storeName}</h1>
              <p className="text-xs text-blue-100">فاتورة إلكترونية</p>
            </div>
          </div>
          <div className="text-center sm:text-left">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-white/30">
              <p className="text-xs text-blue-100">رقم الفاتورة</p>
              <p className="text-lg sm:text-xl font-black">{order.serial}</p>
              <p className="text-xs text-blue-100 mt-0.5">
                {new Date(order.order_date || order.date_created).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex justify-center mb-5">
        <div className={`${getModernStatusColor(order.status)} text-white px-4 py-1.5 rounded-full shadow text-xs font-bold`}>
          {getStatusLabel(order.status)}
        </div>
      </div>

      {/* Customer & Order Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">👤</span>
            </div>
            <h3 className="text-sm font-bold text-gray-800">معلومات العميل</h3>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-start gap-1">
              <span className="text-gray-500 font-medium min-w-[50px]">الاسم:</span>
              <span className="font-semibold text-gray-800">{order.customer_name || order.client_name}</span>
            </div>
            <div className="flex items-start gap-1">
              <span className="text-gray-500 font-medium min-w-[50px]">الهاتف:</span>
              <span className="font-semibold text-gray-800">{order.customer_phone || order.phone}</span>
            </div>
            {(order.shipping_address || order.address) && (
              <div className="flex items-start gap-1">
                <span className="text-gray-500 font-medium min-w-[50px]">العنوان:</span>
                <span className="font-semibold text-gray-800">{order.shipping_address || order.address}</span>
              </div>
            )}
            {order.governorate && (
              <div className="flex items-start gap-1">
                <span className="text-gray-500 font-medium min-w-[50px]">المحافظة:</span>
                <span className="font-semibold text-gray-800">{order.governorate}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">📦</span>
            </div>
            <h3 className="text-sm font-bold text-gray-800">تفاصيل الطلب</h3>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-start gap-1">
              <span className="text-gray-500 font-medium min-w-[50px]">الدفع:</span>
              <span className="font-semibold text-gray-800">{order.payment_method}</span>
            </div>
            <div className="flex items-start gap-1">
              <span className="text-gray-500 font-medium min-w-[50px]">التوصيل:</span>
              <span className="font-semibold text-gray-800">{order.delivery_method}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table with Modern Design */}
      <div className="mb-5 overflow-x-auto -mx-4 px-4">
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gradient-to-l from-gray-800 via-gray-900 to-gray-800 text-white">
                <th className="p-2 text-right">#</th>
                <th className="p-2 text-right">المنتج</th>
                <th className="p-2 text-right">المقاس</th>
                <th className="p-2 text-center">الكمية</th>
                <th className="p-2 text-right">السعر</th>
                <th className="p-2 text-right">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, index: number) => {
                const itemTotal = item.total_price || (item.quantity * item.price - (item.item_discount || 0));
                return (
                  <tr key={item.id} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50/50 transition-colors`}>
                    <td className="p-2 text-center font-medium">{index + 1}</td>
                    <td className="p-2 font-medium">{item.product_name || item.product_type}</td>
                    <td className="p-2">{item.product_size || item.size}</td>
                    <td className="p-2 text-center">
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">{item.quantity}</span>
                    </td>
                    <td className="p-2">{formatCurrency(item.unit_price || item.price)}</td>
                    <td className="p-2 font-bold text-green-600">{formatCurrency(itemTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="mb-5 bg-gradient-to-r from-amber-50 to-orange-50 border-r-4 border-amber-400 p-3 rounded-lg shadow-sm">
          <h4 className="font-bold text-xs text-amber-900 mb-1 flex items-center gap-1">
            <span>📝</span> ملاحظات
          </h4>
          <p className="text-xs text-gray-700 whitespace-pre-wrap">{order.notes}</p>
        </div>
      )}

      {/* Totals Card */}
      <div className="flex justify-end mb-5">
        <div className="w-full sm:w-72">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-white/10 backdrop-blur-sm p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span>المجموع الفرعي:</span>
                <span className="font-bold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>تكلفة الشحن:</span>
                <span className="font-bold">{formatCurrency(shipping)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>الخصم:</span>
                  <span className="font-bold">-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="border-t border-white/30 pt-2 flex justify-between text-sm">
                <span className="font-black">الإجمالي الكلي:</span>
                <span className="font-black text-yellow-400">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-green-400">
                <span>المبلغ المدفوع:</span>
                <span className="font-bold">{formatCurrency(-paid)}</span>
              </div>
              <div className="flex justify-between text-red-400 text-sm">
                <span className="font-bold">المتبقي:</span>
                <span className="font-bold">{formatCurrency(remaining)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Footer */}
      <div className="bg-gradient-to-l from-gray-800 via-gray-900 to-gray-800 text-white rounded-xl p-4 text-center shadow-lg">
        <p className="text-sm font-black mb-1">✨ شكراً لثقتكم ✨</p>
        <p className="text-xs text-gray-300">
          {storeSettings?.contact_phone && `📞 ${storeSettings.contact_phone}`}
          {storeSettings?.contact_email && ` • 📧 ${storeSettings.contact_email}`}
        </p>
      </div>
    </div>
  );
};

export default ModernInvoiceTemplate;
