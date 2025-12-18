import React, { useRef } from 'react';
import { formatCurrency } from '@/lib/utils';
import { calculateOrderFinancials } from '@/lib/orderFinancials';
import { useOrderStatuses } from '@/hooks/useOrderStatuses';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface InvoiceTemplateProps {
  order: any;
  storeSettings?: any;
}

const ProfessionalInvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ order, storeSettings }) => {
  const { items, subtotal, shipping, discount, total, paid, remaining } = calculateOrderFinancials(order);
  const { getStatusLabel } = useOrderStatuses();
  const invoiceRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG');
  };

  const handleScreenshot = async () => {
    if (!invoiceRef.current) return;
    
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const link = document.createElement('a');
      link.download = `فاتورة-${order.serial}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('تم حفظ صورة الفاتورة');
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ الصورة');
    }
  };

  return (
    <div className="relative">
      {/* Screenshot Button */}
      <div className="flex justify-center mb-3 print:hidden">
        <Button 
          onClick={handleScreenshot}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Camera className="w-4 h-4" />
          <span className="text-xs">حفظ صورة</span>
        </Button>
      </div>

      <div 
        ref={invoiceRef}
        className="bg-white w-full mx-auto p-3 sm:p-5"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-l from-red-50 to-white border-b-2 border-red-200 p-3 rounded-t-lg">
          <div className="flex items-center justify-between gap-2">
            {/* Date */}
            <div className="text-left">
              <p className="text-[10px] text-gray-500">التاريخ</p>
              <p className="text-[11px] sm:text-xs font-medium text-gray-700">{formatDate(order.date_created || order.order_date)}</p>
            </div>

            {/* Logo & Name */}
            <div className="flex flex-col items-center">
              {storeSettings?.logo_url && (
                <img 
                  src={storeSettings.logo_url} 
                  alt={storeSettings?.store_name || 'الشعار'}
                  className="w-10 h-10 sm:w-12 sm:h-12 object-contain mb-1"
                />
              )}
              <h1 className="text-sm sm:text-base font-bold text-red-600">
                {storeSettings?.store_name || 'المتجر'}
              </h1>
            </div>

            {/* Invoice Number */}
            <div className="text-right">
              <p className="text-[10px] text-gray-500">فاتورة رقم</p>
              <p className="text-red-600 font-bold text-sm sm:text-base">{order.serial}</p>
            </div>
          </div>
        </div>

        {/* Customer & Delivery Info */}
        <div className="grid grid-cols-2 gap-2 p-2 border-b border-gray-200 bg-gray-50/50">
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
              <h2 className="text-red-600 font-bold text-[11px] sm:text-xs">بيانات العميل</h2>
            </div>
            <div className="space-y-0.5 text-[10px] sm:text-[11px]">
              <p><span className="text-gray-500">الاسم:</span> <span className="font-medium">{order.client_name || order.customer_name}</span></p>
              <p><span className="text-gray-500">الهاتف:</span> <span className="font-medium" dir="ltr">{order.phone || order.customer_phone}</span></p>
              <p><span className="text-gray-500">السداد:</span> <span className="font-medium">{order.payment_method}</span></p>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
              <h2 className="text-red-600 font-bold text-[11px] sm:text-xs">التوصيل</h2>
            </div>
            <div className="space-y-0.5 text-[10px] sm:text-[11px]">
              <p><span className="text-gray-500">الطريقة:</span> <span className="font-medium">{order.delivery_method}</span></p>
              <p>
                <span className="text-gray-500">الحالة:</span>
                <span className="font-medium bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[9px] mr-1">{getStatusLabel(order.status)}</span>
              </p>
              {order.governorate && <p><span className="text-gray-500">المحافظة:</span> <span className="font-medium">{order.governorate}</span></p>}
            </div>
          </div>
        </div>

        {/* Address if exists */}
        {(order.address || order.shipping_address) && (
          <div className="p-2 border-b border-gray-200 text-[10px] sm:text-[11px]">
            <span className="text-gray-500">العنوان:</span> <span className="font-medium">{order.address || order.shipping_address}</span>
          </div>
        )}

        {/* Items Table */}
        <div className="p-2 border-b border-gray-200">
          <div className="flex items-center gap-1 mb-2">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
            <h2 className="text-red-600 font-bold text-[11px] sm:text-xs">تفاصيل الطلب</h2>
          </div>
          
          <table className="w-full border-collapse text-[10px] sm:text-[11px]">
            <thead>
              <tr className="bg-red-600 text-white">
                <th className="p-1.5 text-right">المنتج</th>
                <th className="p-1.5 text-center w-12 sm:w-14">المقاس</th>
                <th className="p-1.5 text-center w-8">العدد</th>
                <th className="p-1.5 text-center w-12 sm:w-14">السعر</th>
                <th className="p-1.5 text-left w-12 sm:w-14">الإجمالي</th>
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
                    <td className="p-1.5 text-right text-red-600 font-medium truncate max-w-[70px] sm:max-w-none">
                      {item.product_type || item.product_name}
                    </td>
                    <td className="p-1.5 text-center">
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[9px]">
                        {item.size || item.product_size}
                      </span>
                    </td>
                    <td className="p-1.5 text-center font-bold">{item.quantity}</td>
                    <td className="p-1.5 text-center">{formatCurrency(price)}</td>
                    <td className="p-1.5 text-left font-semibold">{formatCurrency(itemTotal)}</td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="p-2 text-center text-gray-500 text-[10px]">لا توجد أصناف</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Invoice Summary */}
        <div className="p-2 border-b border-gray-200">
          <div className="w-full sm:max-w-[200px] sm:mr-auto border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-1.5 text-center border-b border-gray-200">
              <h3 className="font-bold text-gray-700 text-[11px]">ملخص الفاتورة</h3>
            </div>
            <div className="p-2 space-y-1 text-[10px] sm:text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-600">إجمالي المنتجات:</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">الشحن:</span>
                <span className="font-semibold">{formatCurrency(shipping)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">الخصم:</span>
                  <span className="font-semibold text-red-600">- {formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1.5 border-t border-gray-200">
                <span className="bg-blue-500 text-white px-2 py-0.5 rounded font-bold text-[9px]">المجموع:</span>
                <span className="font-bold text-xs">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">المدفوع:</span>
                <span className="font-semibold text-green-600">{formatCurrency(-paid)}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-gray-200">
                <span className="bg-red-500 text-white px-2 py-0.5 rounded font-bold text-[9px]">المتبقي:</span>
                <span className="font-bold text-xs text-red-600">{formatCurrency(remaining)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="p-2 border-b border-gray-200">
            <div className="flex items-center gap-1 mb-1">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
              <h2 className="text-red-600 font-bold text-[11px]">ملاحظات</h2>
            </div>
            <p className="text-gray-600 bg-gray-50 p-1.5 rounded text-[10px] sm:text-[11px]">{order.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 bg-gray-50 rounded-b-lg text-center">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            {storeSettings?.logo_url && (
              <img 
                src={storeSettings.logo_url} 
                alt=""
                className="w-6 h-6 object-contain"
              />
            )}
            <p className="text-gray-700 font-semibold text-[11px] sm:text-xs">
              شكراً لثقتكم في {storeSettings?.store_name || 'متجرنا'}
            </p>
          </div>

          {storeSettings?.contact_phone && (
            <p className="text-[10px] text-gray-500">
              📞 للتواصل: <span dir="ltr">{storeSettings.contact_phone}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalInvoiceTemplate;
