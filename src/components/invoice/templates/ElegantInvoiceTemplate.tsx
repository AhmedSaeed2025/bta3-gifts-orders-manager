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

const ElegantInvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ order, storeSettings }) => {
  const storeName = storeSettings?.store_name || "متجري";
  const logoUrl = storeSettings?.logo_url;
  const { getStatusLabel } = useOrderStatuses();
  const invoiceRef = useRef<HTMLDivElement>(null);

  const { items, subtotal, shipping, discount, total, paid, remaining } = calculateOrderFinancials(order);

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

      <div ref={invoiceRef} className="bg-white text-gray-900 p-3 sm:p-5 border-4 border-double border-amber-600" dir="rtl">
        {/* Header */}
        <div className="text-center border-b-2 border-amber-600 pb-3 mb-4">
          {logoUrl && (
            <div className="flex justify-center mb-2">
              <div className="border-2 border-amber-600 rounded-full p-1">
                <img src={logoUrl} alt="Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
              </div>
            </div>
          )}
          <h1 className="text-base sm:text-lg font-serif font-bold text-amber-700 mb-0.5">
            {storeName}
          </h1>
          <p className="text-[10px] text-gray-500 italic">فاتورة رسمية</p>
          
          <div className="mt-3 flex justify-between items-center gap-2 px-2">
            <div className="text-right">
              <p className="text-[10px] text-gray-500">رقم الفاتورة</p>
              <p className="text-sm sm:text-base font-bold text-amber-700">{order.serial}</p>
            </div>
            <div className="text-left">
              <p className="text-[10px] text-gray-500">التاريخ</p>
              <p className="text-[11px] sm:text-xs font-semibold">
                {new Date(order.order_date || order.date_created).toLocaleDateString('ar-EG')}
              </p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="text-center mb-4">
          <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-300 text-[10px] sm:text-xs font-semibold">
            {getStatusLabel(order.status)}
          </span>
        </div>

        {/* Customer & Order Info */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="border border-amber-200 rounded-lg p-2 bg-amber-50/30">
            <h3 className="text-[11px] sm:text-xs font-serif font-bold text-amber-800 mb-1.5 pb-1 border-b border-amber-300">
              بيانات العميل
            </h3>
            <div className="space-y-0.5 text-[10px] sm:text-[11px]">
              <p><span className="text-gray-500">الاسم:</span> <span className="font-medium">{order.customer_name || order.client_name}</span></p>
              <p><span className="text-gray-500">الهاتف:</span> <span className="font-medium">{order.customer_phone || order.phone}</span></p>
              {(order.shipping_address || order.address) && (
                <p className="truncate"><span className="text-gray-500">العنوان:</span> <span className="font-medium">{order.shipping_address || order.address}</span></p>
              )}
            </div>
          </div>

          <div className="border border-amber-200 rounded-lg p-2 bg-amber-50/30">
            <h3 className="text-[11px] sm:text-xs font-serif font-bold text-amber-800 mb-1.5 pb-1 border-b border-amber-300">
              معلومات الطلب
            </h3>
            <div className="space-y-0.5 text-[10px] sm:text-[11px]">
              <p><span className="text-gray-500">الدفع:</span> <span className="font-medium">{order.payment_method}</span></p>
              <p><span className="text-gray-500">التوصيل:</span> <span className="font-medium">{order.delivery_method}</span></p>
              {order.governorate && <p><span className="text-gray-500">المحافظة:</span> <span className="font-medium">{order.governorate}</span></p>}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-4 border border-amber-200 rounded-lg overflow-hidden">
          <table className="w-full text-[10px] sm:text-[11px]">
            <thead>
              <tr className="bg-gradient-to-l from-amber-600 via-amber-700 to-amber-600 text-white">
                <th className="p-1.5 text-right font-serif w-6">#</th>
                <th className="p-1.5 text-right font-serif">المنتج</th>
                <th className="p-1.5 text-center font-serif w-12 sm:w-14">المقاس</th>
                <th className="p-1.5 text-center font-serif w-8">الكمية</th>
                <th className="p-1.5 text-center font-serif w-12 sm:w-14">السعر</th>
                <th className="p-1.5 text-left font-serif w-12 sm:w-14">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, index: number) => {
                const itemTotal = item.total_price || (item.quantity * item.price - (item.item_discount || 0));
                return (
                  <tr key={item.id} className={`${index % 2 === 0 ? 'bg-amber-50/50' : 'bg-white'} border-b border-amber-100`}>
                    <td className="p-1.5 text-center">{index + 1}</td>
                    <td className="p-1.5 font-medium truncate max-w-[70px] sm:max-w-none">{item.product_name || item.product_type}</td>
                    <td className="p-1.5 text-center">{item.product_size || item.size}</td>
                    <td className="p-1.5 text-center font-bold">{item.quantity}</td>
                    <td className="p-1.5 text-center">{formatCurrency(item.unit_price || item.price)}</td>
                    <td className="p-1.5 text-left font-bold text-amber-700">{formatCurrency(itemTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="mb-4 border border-amber-200 rounded-lg p-2 bg-amber-50/30">
            <p className="text-[10px] sm:text-[11px] text-gray-700">{order.notes}</p>
          </div>
        )}

        {/* Totals */}
        <div className="flex justify-end mb-4">
          <div className="w-full sm:w-56 border-2 border-double border-amber-600 rounded-lg p-2 bg-gradient-to-br from-amber-50 to-white">
            <div className="space-y-1 text-[10px] sm:text-[11px]">
              <div className="flex justify-between border-b border-amber-200 pb-0.5">
                <span className="font-serif">المجموع الفرعي:</span>
                <span className="font-bold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between border-b border-amber-200 pb-0.5">
                <span className="font-serif">الشحن:</span>
                <span className="font-bold">{formatCurrency(shipping)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-red-600 border-b border-amber-200 pb-0.5">
                  <span className="font-serif">الخصم:</span>
                  <span className="font-bold">-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-serif pt-1 border-t-2 border-double border-amber-600">
                <span className="font-bold">الإجمالي:</span>
                <span className="font-bold text-amber-700">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-green-700">
                <span className="font-serif">المدفوع:</span>
                <span className="font-bold">{formatCurrency(-paid)}</span>
              </div>
              <div className="flex justify-between text-red-700 text-xs font-bold">
                <span className="font-serif">المتبقي:</span>
                <span>{formatCurrency(remaining)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-amber-600 pt-3 text-center">
          <p className="text-xs font-serif font-bold text-amber-700 mb-1">شكراً لثقتكم</p>
          <p className="text-[10px] text-gray-500">
            {storeSettings?.contact_phone && `☎ ${storeSettings.contact_phone}`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ElegantInvoiceTemplate;
