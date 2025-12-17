import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { calculateOrderFinancials } from '@/lib/orderFinancials';
import { useOrderStatuses } from '@/hooks/useOrderStatuses';

interface InvoiceTemplateProps {
  order: any;
  storeSettings?: any;
}

const ProfessionalInvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ order, storeSettings }) => {
  const { items, subtotal, shipping, discount, total, paid, remaining } = calculateOrderFinancials(order);
  const { getStatusLabel } = useOrderStatuses();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div 
      className="bg-white w-full max-w-[210mm] mx-auto print:max-w-none print:m-0 p-4 sm:p-6"
      dir="rtl"
      style={{ fontFamily: 'Tajawal, Cairo, Arial, sans-serif' }}
    >
      {/* Header */}
      <div className="bg-gradient-to-l from-red-50 to-white border-b-2 border-red-200 p-4 sm:p-5 rounded-t-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Invoice Info */}
          <div className="text-center sm:text-left order-2 sm:order-1">
            <p className="text-xs text-gray-500">التاريخ</p>
            <p className="text-sm font-medium text-gray-700">{formatDate(order.date_created || order.order_date)}</p>
          </div>

          {/* Store Logo & Name */}
          <div className="flex flex-col items-center order-1 sm:order-2">
            {storeSettings?.logo_url && (
              <img 
                src={storeSettings.logo_url} 
                alt={storeSettings?.store_name || 'الشعار'}
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain mb-2"
              />
            )}
            <h1 className="text-lg sm:text-xl font-bold text-red-600">
              {storeSettings?.store_name || 'المتجر'}
            </h1>
            {storeSettings?.store_tagline && (
              <p className="text-xs text-gray-500">{storeSettings.store_tagline}</p>
            )}
          </div>

          {/* Invoice Number */}
          <div className="text-center sm:text-right order-3">
            <p className="text-xs text-gray-500">فاتورة رقم</p>
            <p className="text-red-600 font-bold text-base sm:text-lg">{order.serial}</p>
          </div>
        </div>
      </div>

      {/* Customer Details */}
      <div className="p-4 border-b border-gray-200 bg-gray-50/50">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <h2 className="text-red-600 font-bold text-sm">بيانات العميل</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
          <div className="flex gap-1">
            <span className="text-gray-500">الاسم:</span>
            <span className="font-semibold">{order.client_name || order.customer_name}</span>
          </div>
          <div className="flex gap-1">
            <span className="text-gray-500">التليفون:</span>
            <span className="font-semibold" dir="ltr">{order.phone || order.customer_phone}</span>
          </div>
          <div className="flex gap-1">
            <span className="text-gray-500">طريقة السداد:</span>
            <span className="font-semibold">{order.payment_method}</span>
          </div>
        </div>
      </div>

      {/* Delivery Information */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <h2 className="text-red-600 font-bold text-sm">معلومات التوصيل</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
          <div className="flex gap-1">
            <span className="text-gray-500">طريقة الاستلام:</span>
            <span className="font-semibold">{order.delivery_method}</span>
          </div>
          <div className="flex gap-1">
            <span className="text-gray-500">حالة الطلب:</span>
            <span className="font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">{getStatusLabel(order.status)}</span>
          </div>
          {(order.address || order.shipping_address) && (
            <div className="flex gap-1 col-span-1 sm:col-span-2">
              <span className="text-gray-500">العنوان:</span>
              <span className="font-semibold">{order.address || order.shipping_address}</span>
            </div>
          )}
          {order.governorate && (
            <div className="flex gap-1">
              <span className="text-gray-500">المحافظة:</span>
              <span className="font-semibold">{order.governorate}</span>
            </div>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <h2 className="text-red-600 font-bold text-sm">تفاصيل الطلب</h2>
        </div>
        
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-red-600 text-white">
                <th className="p-2 text-right font-medium">المنتج</th>
                <th className="p-2 text-center font-medium">المقاس</th>
                <th className="p-2 text-center font-medium">العدد</th>
                <th className="p-2 text-center font-medium">السعر</th>
                <th className="p-2 text-left font-medium">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? items.map((item: any, index: number) => {
                const price = item.price || item.unit_price || 0;
                const qty = item.quantity || 1;
                const itemDiscount = item.item_discount || 0;
                const itemTotal = (price * qty) - itemDiscount;
                return (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-2 text-right text-red-600 font-medium">
                      {item.product_type || item.product_name}
                    </td>
                    <td className="p-2 text-center">
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                        {item.size || item.product_size}
                      </span>
                    </td>
                    <td className="p-2 text-center">{item.quantity}</td>
                    <td className="p-2 text-center">{formatCurrency(price)}</td>
                    <td className="p-2 text-left font-semibold">{formatCurrency(itemTotal)}</td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="p-3 text-center text-gray-500 text-xs">لا توجد أصناف</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Summary */}
      <div className="p-4 border-b border-gray-200">
        <div className="w-full sm:max-w-xs sm:mr-auto border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 p-2 text-center border-b border-gray-200">
            <h3 className="font-bold text-gray-700 text-sm">ملخص الفاتورة</h3>
          </div>
          <div className="p-3 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">إجمالي المنتجات:</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">مصاريف الشحن:</span>
              <span className="font-semibold">{formatCurrency(shipping)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">الخصم:</span>
                <span className="font-semibold text-red-600">- {formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="bg-blue-500 text-white px-3 py-1 rounded font-bold text-xs">المجموع الكلي:</span>
              <span className="font-bold text-base">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">المبلغ المدفوع:</span>
              <span className="font-semibold text-green-600">{formatCurrency(-paid)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="bg-red-500 text-white px-3 py-1 rounded font-bold text-xs">المبلغ المتبقي:</span>
              <span className="font-bold text-base text-red-600">{formatCurrency(remaining)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <h2 className="text-red-600 font-bold text-sm">ملاحظات</h2>
          </div>
          <p className="text-gray-600 bg-gray-50 p-2 rounded-lg text-xs sm:text-sm">{order.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 bg-gray-50 rounded-b-lg">
        {/* Thank You Message */}
        <div className="flex items-center justify-center gap-2 mb-3">
          {storeSettings?.logo_url && (
            <img 
              src={storeSettings.logo_url} 
              alt=""
              className="w-8 h-8 object-contain"
            />
          )}
          <p className="text-gray-700 font-semibold text-sm">
            شكراً لثقتكم في {storeSettings?.store_name || 'متجرنا'}
          </p>
        </div>

        {/* Contact */}
        {storeSettings?.contact_phone && (
          <div className="flex items-center justify-center gap-2 text-gray-600 mb-3 text-xs">
            <span>📞</span>
            <span>للتواصل:</span>
            <span dir="ltr" className="font-semibold">{storeSettings.contact_phone}</span>
          </div>
        )}

        {/* Social Links */}
        <div className="flex items-center justify-center gap-3 text-xs text-gray-500 mb-3">
          {storeSettings?.facebook_url && (
            <span>📘 Facebook</span>
          )}
          {storeSettings?.instagram_url && (
            <span>📷 Instagram</span>
          )}
          {storeSettings?.whatsapp_number && (
            <span>💬 WhatsApp</span>
          )}
        </div>

        {/* Copyright */}
        <p className="text-center text-gray-400 text-xs">
          جميع الحقوق محفوظة {storeSettings?.store_name || 'المتجر'} {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default ProfessionalInvoiceTemplate;
