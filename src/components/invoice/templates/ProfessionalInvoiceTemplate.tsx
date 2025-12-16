import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { calculateOrderFinancials } from '@/lib/orderFinancials';

interface InvoiceTemplateProps {
  order: any;
  storeSettings?: any;
}

const ProfessionalInvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ order, storeSettings }) => {
  const { items, subtotal, shipping, discount, total, paid, remaining } = calculateOrderFinancials(order);

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'قيد المراجعة',
      'processing': 'جاري التجهيز',
      'shipped': 'تم الشحن',
      'delivered': 'تم التسليم',
      'cancelled': 'ملغي',
      'completed': 'مكتمل'
    };
    return statusMap[status] || status;
  };

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
      className="bg-white min-h-[297mm] w-full max-w-[210mm] mx-auto print:max-w-none print:m-0"
      dir="rtl"
      style={{ fontFamily: 'Tajawal, Cairo, Arial, sans-serif' }}
    >
      {/* Header */}
      <div className="bg-gradient-to-l from-red-50 to-white border-b-2 border-red-100 p-6">
        <div className="flex items-center justify-between">
          {/* Invoice Info */}
          <div className="text-left">
            <p className="text-gray-500 text-sm">التاريخ</p>
            <p className="text-gray-700">{formatDate(order.date_created || order.order_date)}</p>
          </div>

          {/* Store Logo & Name */}
          <div className="flex flex-col items-center">
            {storeSettings?.logo_url && (
              <img 
                src={storeSettings.logo_url} 
                alt={storeSettings?.store_name || 'الشعار'}
                className="w-16 h-16 object-contain mb-2"
              />
            )}
            <h1 className="text-xl font-bold text-red-600">
              {storeSettings?.store_name || 'المتجر'}
            </h1>
            {storeSettings?.store_tagline && (
              <p className="text-gray-500 text-sm">{storeSettings.store_tagline}</p>
            )}
          </div>

          {/* Invoice Number */}
          <div className="text-right">
            <p className="text-gray-500 text-sm">فاتورة رقم</p>
            <p className="text-red-600 font-bold text-lg">{order.serial}</p>
          </div>
        </div>
      </div>

      {/* Customer Details */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <h2 className="text-red-600 font-bold">بيانات العميل</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex gap-2">
            <span className="text-gray-500">اسم العميل:</span>
            <span className="font-semibold">{order.client_name || order.customer_name}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500">التليفون:</span>
            <span className="font-semibold" dir="ltr">{order.phone || order.customer_phone}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500">طريقة السداد:</span>
            <span className="font-semibold">{order.payment_method}</span>
          </div>
        </div>
      </div>

      {/* Delivery Information */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <h2 className="text-red-600 font-bold">معلومات التوصيل</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex gap-2">
            <span className="text-gray-500">طريقة الاستلام:</span>
            <span className="font-semibold">{order.delivery_method}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500">حالة الطلب:</span>
            <span className="font-semibold">{getStatusLabel(order.status)}</span>
          </div>
          {(order.address || order.shipping_address) && (
            <div className="flex gap-2 col-span-2">
              <span className="text-gray-500">العنوان:</span>
              <span className="font-semibold">{order.address || order.shipping_address}</span>
            </div>
          )}
          {order.governorate && (
            <div className="flex gap-2">
              <span className="text-gray-500">المحافظة:</span>
              <span className="font-semibold">{order.governorate}</span>
            </div>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <h2 className="text-red-600 font-bold">تفاصيل الطلب</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-red-600 text-white">
                <th className="p-3 text-right font-semibold">المنتج</th>
                <th className="p-3 text-center font-semibold">المقاس</th>
                <th className="p-3 text-center font-semibold">العدد</th>
                <th className="p-3 text-center font-semibold">السعر</th>
                <th className="p-3 text-left font-semibold">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? items.map((item: any, index: number) => {
                const price = item.price || item.unit_price || 0;
                const qty = item.quantity || 1;
                const itemDiscount = item.item_discount || 0;
                const itemTotal = (price * qty) - itemDiscount;
                return (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-3 text-right text-red-600 font-medium">
                      {item.product_type || item.product_name}
                    </td>
                    <td className="p-3 text-center">
                      <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                        {item.size || item.product_size}
                      </span>
                    </td>
                    <td className="p-3 text-center">{item.quantity}</td>
                    <td className="p-3 text-center">{formatCurrency(price)}</td>
                    <td className="p-3 text-left font-semibold">{formatCurrency(itemTotal)}</td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">لا توجد أصناف</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Summary */}
      <div className="p-6 border-b border-gray-200">
        <div className="max-w-sm mr-auto border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 p-3 text-center border-b border-gray-200">
            <h3 className="font-bold text-gray-700">ملخص الفاتورة</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">إجمالي المنتجات:</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">مصاريف الشحن:</span>
              <span className="font-semibold">{formatCurrency(shipping)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">الخصم:</span>
                <span className="font-semibold text-red-600">- {formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <span className="bg-blue-500 text-white px-4 py-2 rounded font-bold">المجموع الكلي:</span>
              <span className="font-bold text-lg">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">المبلغ المدفوع:</span>
              <span className="font-semibold text-green-600">{formatCurrency(-paid)}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <span className="bg-red-500 text-white px-4 py-2 rounded font-bold">المبلغ المتبقي:</span>
              <span className="font-bold text-lg text-red-600">{formatCurrency(remaining)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <h2 className="text-red-600 font-bold">ملاحظات</h2>
          </div>
          <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{order.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="p-6 bg-gray-50">
        {/* Thank You Message */}
        <div className="flex items-center justify-center gap-3 mb-4">
          {storeSettings?.logo_url && (
            <img 
              src={storeSettings.logo_url} 
              alt=""
              className="w-10 h-10 object-contain"
            />
          )}
          <p className="text-gray-700 font-semibold">
            شكراً لثقتكم في {storeSettings?.store_name || 'متجرنا'}
          </p>
        </div>

        {/* Contact */}
        {storeSettings?.contact_phone && (
          <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
            <span>📞</span>
            <span>للتواصل:</span>
            <span dir="ltr" className="font-semibold">{storeSettings.contact_phone}</span>
          </div>
        )}

        {/* Social Links */}
        <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mb-4">
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
        <p className="text-center text-gray-400 text-sm">
          جميع الحقوق محفوظة {storeSettings?.store_name || 'المتجر'} {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default ProfessionalInvoiceTemplate;
