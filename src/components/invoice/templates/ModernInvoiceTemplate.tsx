import React from 'react';
import { formatCurrency } from '@/lib/utils';

interface InvoiceTemplateProps {
  order: any;
  storeSettings?: any;
}

const ModernInvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ order, storeSettings }) => {
  const items = order.items || order.order_items || order.admin_order_items || [];
  const storeName = storeSettings?.store_name || "متجري";
  const logoUrl = storeSettings?.logo_url;
  
  const subtotal = items.reduce((sum: number, item: any) => {
    const itemTotal = item.total_price || ((item.price || item.unit_price || 0) * (item.quantity || 1) - (item.item_discount || 0));
    return sum + itemTotal;
  }, 0);
  
  // Use order.total if available, otherwise calculate from items
  const total = order.total || order.total_amount || (subtotal + (order.shipping_cost || 0) - (order.discount || 0));
  const paid = (order.deposit || 0) + (order.payments_received || 0);
  const remaining = order.remaining_amount ?? (total - paid);

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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-500',
      confirmed: 'bg-blue-500',
      processing: 'bg-purple-500',
      shipped: 'bg-green-500',
      delivered: 'bg-emerald-500',
      cancelled: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50 text-gray-900 p-4 sm:p-6 lg:p-8 min-h-[297mm]" dir="rtl">
      {/* Modern Header with Gradient */}
      <div className="bg-gradient-to-l from-blue-600 via-purple-600 to-blue-700 text-white rounded-2xl p-4 sm:p-6 mb-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {logoUrl && (
              <div className="bg-white p-2 rounded-xl shadow-lg">
                <img src={logoUrl} alt="Logo" className="w-12 h-12 sm:w-16 sm:h-16 object-contain" />
              </div>
            )}
            <div className="text-center sm:text-right">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">{storeName}</h1>
              <p className="text-xs sm:text-sm text-blue-100 mt-1">فاتورة إلكترونية</p>
            </div>
          </div>
          <div className="text-center sm:text-left">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/30">
              <p className="text-xs sm:text-sm text-blue-100">رقم الفاتورة</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black">{order.serial}</p>
              <p className="text-xs sm:text-sm text-blue-100 mt-1">
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
      <div className="flex justify-center mb-6">
        <div className={`${getStatusColor(order.status)} text-white px-6 py-2 rounded-full shadow-lg text-sm sm:text-base font-bold`}>
          {getStatusLabel(order.status)}
        </div>
      </div>

      {/* Customer & Order Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-lg sm:text-xl font-bold">👤</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-800">معلومات العميل</h3>
          </div>
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex items-start gap-2">
              <span className="text-gray-500 font-medium min-w-[60px]">الاسم:</span>
              <span className="font-semibold text-gray-800">{order.customer_name || order.client_name}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-gray-500 font-medium min-w-[60px]">الهاتف:</span>
              <span className="font-semibold text-gray-800">{order.customer_phone || order.phone}</span>
            </div>
            {order.customer_email && (
              <div className="flex items-start gap-2">
                <span className="text-gray-500 font-medium min-w-[60px]">البريد:</span>
                <span className="font-semibold text-gray-800 break-all">{order.customer_email}</span>
              </div>
            )}
            {(order.shipping_address || order.address) && (
              <div className="flex items-start gap-2">
                <span className="text-gray-500 font-medium min-w-[60px]">العنوان:</span>
                <span className="font-semibold text-gray-800">{order.shipping_address || order.address}</span>
              </div>
            )}
            {order.governorate && (
              <div className="flex items-start gap-2">
                <span className="text-gray-500 font-medium min-w-[60px]">المحافظة:</span>
                <span className="font-semibold text-gray-800">{order.governorate}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-white text-lg sm:text-xl font-bold">📦</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-800">تفاصيل الطلب</h3>
          </div>
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex items-start gap-2">
              <span className="text-gray-500 font-medium min-w-[60px]">الدفع:</span>
              <span className="font-semibold text-gray-800">{order.payment_method}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-gray-500 font-medium min-w-[60px]">التوصيل:</span>
              <span className="font-semibold text-gray-800">{order.delivery_method}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table with Modern Design */}
      <div className="mb-6 overflow-x-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-l from-gray-800 via-gray-900 to-gray-800 text-white">
                <th className="p-2 sm:p-3 text-xs sm:text-sm lg:text-base text-right">#</th>
                <th className="p-2 sm:p-3 text-xs sm:text-sm lg:text-base text-right">المنتج</th>
                <th className="p-2 sm:p-3 text-xs sm:text-sm lg:text-base text-right">المقاس</th>
                <th className="p-2 sm:p-3 text-xs sm:text-sm lg:text-base text-center">الكمية</th>
                <th className="p-2 sm:p-3 text-xs sm:text-sm lg:text-base text-right">السعر</th>
                <th className="p-2 sm:p-3 text-xs sm:text-sm lg:text-base text-right">الخصم</th>
                <th className="p-2 sm:p-3 text-xs sm:text-sm lg:text-base text-right">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, index: number) => {
                const itemTotal = item.total_price || (item.quantity * item.price - (item.item_discount || 0));
                return (
                  <tr key={item.id} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50/50 transition-colors`}>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm text-center font-medium">{index + 1}</td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm font-medium">{item.product_name || item.product_type}</td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm">{item.product_size || item.size}</td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm text-center">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-bold">{item.quantity}</span>
                    </td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm">{formatCurrency(item.unit_price || item.price)}</td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm text-red-600">{formatCurrency(item.item_discount || 0)}</td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm font-bold text-green-600">{formatCurrency(itemTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-r-4 border-amber-400 p-4 rounded-xl shadow-md">
          <h4 className="font-bold text-sm sm:text-base text-amber-900 mb-2 flex items-center gap-2">
            <span>📝</span> ملاحظات
          </h4>
          <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap">{order.notes}</p>
        </div>
      )}

      {/* Totals Card */}
      <div className="flex justify-end mb-6">
        <div className="w-full sm:w-80">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-white/10 backdrop-blur-sm p-4 sm:p-6 space-y-3 text-sm sm:text-base">
              <div className="flex justify-between">
                <span>المجموع الفرعي:</span>
                <span className="font-bold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>تكلفة الشحن:</span>
                <span className="font-bold">{formatCurrency(order.shipping_cost || 0)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>الخصم:</span>
                  <span className="font-bold">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="border-t-2 border-white/30 pt-3 flex justify-between text-lg sm:text-xl">
                <span className="font-black">الإجمالي الكلي:</span>
                <span className="font-black text-yellow-400">{formatCurrency(total)}</span>
              </div>
              {paid > 0 && (
                <>
                  <div className="flex justify-between text-green-400">
                    <span>المبلغ المدفوع:</span>
                    <span className="font-bold">{formatCurrency(paid)}</span>
                  </div>
                  {remaining > 0 && (
                    <div className="flex justify-between text-red-400 text-base sm:text-lg">
                      <span className="font-bold">المتبقي:</span>
                      <span className="font-bold">{formatCurrency(remaining)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modern Footer */}
      <div className="bg-gradient-to-l from-gray-800 via-gray-900 to-gray-800 text-white rounded-2xl p-4 sm:p-6 text-center shadow-2xl">
        <p className="text-lg sm:text-xl font-black mb-2">✨ شكراً لثقتكم ✨</p>
        <p className="text-xs sm:text-sm text-gray-300">
          {storeSettings?.contact_phone && `📞 ${storeSettings.contact_phone}`}
          {storeSettings?.contact_email && ` • 📧 ${storeSettings.contact_email}`}
        </p>
      </div>
    </div>
  );
};

export default ModernInvoiceTemplate;
