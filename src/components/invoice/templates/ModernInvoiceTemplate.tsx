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

const ModernInvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ order, storeSettings }) => {
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
        backgroundColor: '#f8fafc'
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

      <div ref={invoiceRef} className="bg-gradient-to-br from-slate-50 via-white to-slate-50 text-gray-900 p-3 sm:p-5" dir="rtl">
        {/* Header */}
        <div className="bg-gradient-to-l from-blue-600 via-purple-600 to-blue-700 text-white rounded-xl p-3 mb-4 shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {logoUrl && (
                <div className="bg-white p-1 rounded-lg shadow">
                  <img src={logoUrl} alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                </div>
              )}
              <div>
                <h1 className="text-sm sm:text-base font-black">{storeName}</h1>
                <p className="text-[10px] text-blue-100">فاتورة إلكترونية</p>
              </div>
            </div>
            <div className="text-left bg-white/20 backdrop-blur-sm rounded-lg p-2 border border-white/30">
              <p className="text-[10px] text-blue-100">رقم الفاتورة</p>
              <p className="text-sm sm:text-base font-black">{order.serial}</p>
              <p className="text-[10px] text-blue-100">
                {new Date(order.order_date || order.date_created).toLocaleDateString('ar-EG')}
              </p>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center mb-4">
          <div className={`${getModernStatusColor(order.status)} text-white px-3 py-1 rounded-full shadow text-[10px] sm:text-xs font-bold`}>
            {getStatusLabel(order.status)}
          </div>
        </div>

        {/* Customer & Order Info */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-white rounded-lg shadow p-2 border border-gray-100">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-[10px]">👤</span>
              </div>
              <h3 className="text-[11px] sm:text-xs font-bold text-gray-800">معلومات العميل</h3>
            </div>
            <div className="space-y-0.5 text-[10px] sm:text-[11px]">
              <p><span className="text-gray-500">الاسم:</span> <span className="font-medium">{order.customer_name || order.client_name}</span></p>
              <p><span className="text-gray-500">الهاتف:</span> <span className="font-medium">{order.customer_phone || order.phone}</span></p>
              {(order.shipping_address || order.address) && (
                <p className="truncate"><span className="text-gray-500">العنوان:</span> <span className="font-medium">{order.shipping_address || order.address}</span></p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-2 border border-gray-100">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-5 h-5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white text-[10px]">📦</span>
              </div>
              <h3 className="text-[11px] sm:text-xs font-bold text-gray-800">تفاصيل الطلب</h3>
            </div>
            <div className="space-y-0.5 text-[10px] sm:text-[11px]">
              <p><span className="text-gray-500">الدفع:</span> <span className="font-medium">{order.payment_method}</span></p>
              <p><span className="text-gray-500">التوصيل:</span> <span className="font-medium">{order.delivery_method}</span></p>
              {order.governorate && <p><span className="text-gray-500">المحافظة:</span> <span className="font-medium">{order.governorate}</span></p>}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-4 bg-white rounded-lg shadow overflow-hidden border border-gray-100">
          <table className="w-full text-[10px] sm:text-[11px]">
            <thead>
              <tr className="bg-gradient-to-l from-gray-800 via-gray-900 to-gray-800 text-white">
                <th className="p-1.5 text-right w-6">#</th>
                <th className="p-1.5 text-right">المنتج</th>
                <th className="p-1.5 text-center w-12 sm:w-14">المقاس</th>
                <th className="p-1.5 text-center w-8">الكمية</th>
                <th className="p-1.5 text-center w-12 sm:w-14">السعر</th>
                <th className="p-1.5 text-left w-12 sm:w-14">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, index: number) => {
                const itemTotal = item.total_price || (item.quantity * item.price - (item.item_discount || 0));
                return (
                  <tr key={item.id} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50/50`}>
                    <td className="p-1.5 text-center">{index + 1}</td>
                    <td className="p-1.5 font-medium truncate max-w-[70px] sm:max-w-none">{item.product_name || item.product_type}</td>
                    <td className="p-1.5 text-center">{item.product_size || item.size}</td>
                    <td className="p-1.5 text-center">
                      <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full font-bold text-[9px]">{item.quantity}</span>
                    </td>
                    <td className="p-1.5 text-center">{formatCurrency(item.unit_price || item.price)}</td>
                    <td className="p-1.5 text-left font-bold text-green-600">{formatCurrency(itemTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="mb-4 bg-gradient-to-r from-amber-50 to-orange-50 border-r-3 border-amber-400 p-2 rounded-lg shadow-sm">
            <p className="text-[10px] sm:text-[11px] text-gray-700">{order.notes}</p>
          </div>
        )}

        {/* Totals */}
        <div className="flex justify-end mb-4">
          <div className="w-full sm:w-56">
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-3 space-y-1.5 text-[10px] sm:text-[11px]">
                <div className="flex justify-between">
                  <span>المجموع الفرعي:</span>
                  <span className="font-bold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>الشحن:</span>
                  <span className="font-bold">{formatCurrency(shipping)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-red-400">
                    <span>الخصم:</span>
                    <span className="font-bold">-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="border-t border-white/30 pt-1.5 flex justify-between text-xs">
                  <span className="font-black">الإجمالي:</span>
                  <span className="font-black text-yellow-400">{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between text-green-400">
                  <span>المدفوع:</span>
                  <span className="font-bold">{formatCurrency(-paid)}</span>
                </div>
                <div className="flex justify-between text-red-400 text-xs font-bold">
                  <span>المتبقي:</span>
                  <span>{formatCurrency(remaining)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-l from-gray-800 via-gray-900 to-gray-800 text-white rounded-xl p-3 text-center shadow-lg">
          <p className="text-xs font-black">✨ شكراً لثقتكم ✨</p>
          <p className="text-[10px] text-gray-300">
            {storeSettings?.contact_phone && `📞 ${storeSettings.contact_phone}`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ModernInvoiceTemplate;
