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

const ClassicInvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ order, storeSettings }) => {
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

      <div ref={invoiceRef} className="bg-white text-gray-900 p-3 sm:p-5" dir="rtl">
        {/* Header */}
        <div className="border-b-3 border-blue-600 pb-3 mb-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {logoUrl && (
                <img src={logoUrl} alt="Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
              )}
              <div>
                <h1 className="text-base sm:text-lg font-bold text-blue-600">{storeName}</h1>
                <p className="text-[10px] sm:text-xs text-gray-500">فاتورة مبيعات</p>
              </div>
            </div>
            <div className="text-left bg-blue-50 p-2 rounded-lg">
              <p className="text-[10px] text-gray-500">رقم الفاتورة</p>
              <p className="text-sm sm:text-base font-bold text-blue-600">{order.serial}</p>
              <p className="text-[10px] text-gray-500">
                {new Date(order.order_date || order.date_created).toLocaleDateString('ar-EG')}
              </p>
            </div>
          </div>
        </div>

        {/* Customer & Order Info */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-gray-50 p-2 rounded-lg">
            <h3 className="text-[11px] sm:text-xs font-bold text-gray-700 mb-1.5 border-b border-gray-200 pb-1">
              بيانات العميل
            </h3>
            <div className="space-y-0.5 text-[10px] sm:text-[11px]">
              <p><span className="text-gray-500">الاسم:</span> <span className="font-medium">{order.customer_name || order.client_name}</span></p>
              <p><span className="text-gray-500">الهاتف:</span> <span className="font-medium">{order.customer_phone || order.phone}</span></p>
              {(order.shipping_address || order.address) && (
                <p className="truncate"><span className="text-gray-500">العنوان:</span> <span className="font-medium">{order.shipping_address || order.address}</span></p>
              )}
              {order.governorate && <p><span className="text-gray-500">المحافظة:</span> <span className="font-medium">{order.governorate}</span></p>}
            </div>
          </div>

          <div className="bg-gray-50 p-2 rounded-lg">
            <h3 className="text-[11px] sm:text-xs font-bold text-gray-700 mb-1.5 border-b border-gray-200 pb-1">
              تفاصيل الطلب
            </h3>
            <div className="space-y-0.5 text-[10px] sm:text-[11px]">
              <p><span className="text-gray-500">الدفع:</span> <span className="font-medium">{order.payment_method}</span></p>
              <p><span className="text-gray-500">التوصيل:</span> <span className="font-medium">{order.delivery_method}</span></p>
              <p>
                <span className="text-gray-500">الحالة:</span>
                <span className="mr-1 px-1.5 py-0.5 rounded text-[9px] bg-blue-100 text-blue-700 font-medium">
                  {getStatusLabel(order.status)}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-4">
          <table className="w-full border-collapse text-[10px] sm:text-[11px]">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="p-1.5 text-right w-6">#</th>
                <th className="p-1.5 text-right">المنتج</th>
                <th className="p-1.5 text-center w-14 sm:w-16">المقاس</th>
                <th className="p-1.5 text-center w-8">الكمية</th>
                <th className="p-1.5 text-center w-14 sm:w-16">السعر</th>
                <th className="p-1.5 text-left w-14 sm:w-16">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, index: number) => {
                const itemTotal = item.total_price || (item.quantity * item.price - (item.item_discount || 0));
                return (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-1.5 text-center border-b border-gray-100">{index + 1}</td>
                    <td className="p-1.5 border-b border-gray-100 font-medium truncate max-w-[80px] sm:max-w-none">{item.product_name || item.product_type}</td>
                    <td className="p-1.5 text-center border-b border-gray-100">{item.product_size || item.size}</td>
                    <td className="p-1.5 text-center border-b border-gray-100 font-bold">{item.quantity}</td>
                    <td className="p-1.5 text-center border-b border-gray-100">{formatCurrency(item.unit_price || item.price)}</td>
                    <td className="p-1.5 text-left border-b border-gray-100 font-bold text-blue-600">{formatCurrency(itemTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="mb-4 bg-yellow-50 border-r-3 border-yellow-400 p-2 rounded">
            <p className="text-[10px] sm:text-[11px] text-gray-700">{order.notes}</p>
          </div>
        )}

        {/* Totals */}
        <div className="flex justify-end mb-4">
          <div className="w-full sm:w-56 bg-gray-50 p-2 rounded-lg border border-gray-200">
            <div className="space-y-1 text-[10px] sm:text-[11px]">
              <div className="flex justify-between">
                <span>المجموع الفرعي:</span>
                <span className="font-bold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>الشحن:</span>
                <span className="font-bold">{formatCurrency(shipping)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>الخصم:</span>
                  <span className="font-bold">-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="border-t border-gray-300 pt-1 flex justify-between text-xs font-bold">
                <span>الإجمالي:</span>
                <span className="text-blue-600">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>المدفوع:</span>
                <span className="font-bold">{formatCurrency(-paid)}</span>
              </div>
              <div className="flex justify-between text-red-600 text-xs font-bold">
                <span>المتبقي:</span>
                <span>{formatCurrency(remaining)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-2 text-center">
          <p className="text-xs font-bold text-blue-600">شكراً لتعاملكم معنا</p>
          <p className="text-[10px] text-gray-500">
            {storeSettings?.contact_phone && `${storeSettings.contact_phone}`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClassicInvoiceTemplate;
