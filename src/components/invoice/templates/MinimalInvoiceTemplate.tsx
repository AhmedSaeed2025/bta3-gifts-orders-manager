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

const MinimalInvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ order, storeSettings }) => {
  const { items, subtotal, shipping, discount, total, paid, remaining } = calculateOrderFinancials(order);
  const { getStatusLabel } = useOrderStatuses();
  const invoiceRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ar-EG');

  const handleScreenshot = async () => {
    if (!invoiceRef.current) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false, allowTaint: true,
      });
      const link = document.createElement('a');
      link.download = `فاتورة-${order.serial}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      toast.success('تم حفظ صورة الفاتورة');
    } catch { toast.error('حدث خطأ أثناء حفظ الصورة'); }
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '12px' }} className="print:hidden">
        <Button onClick={handleScreenshot} variant="outline" size="sm" className="gap-2">
          <Camera className="w-4 h-4" />
          <span className="text-xs">حفظ صورة</span>
        </Button>
      </div>

      <div
        ref={invoiceRef}
        style={{
          backgroundColor: '#ffffff', color: '#111827', padding: '20px',
          fontFamily: 'Tajawal, Arial, sans-serif', direction: 'rtl',
          width: '400px', maxWidth: '400px', margin: '0 auto',
        }}
      >
        {/* Header - Clean & Minimal */}
        <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '14px', marginBottom: '14px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {storeSettings?.logo_url && (
                      <img src={storeSettings.logo_url} alt="" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
                    )}
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>{storeSettings?.store_name || 'المتجر'}</div>
                      <div style={{ fontSize: '9px', color: '#9ca3af', letterSpacing: '1px' }}>INVOICE</div>
                    </div>
                  </div>
                </td>
                <td style={{ textAlign: 'left', verticalAlign: 'middle' }}>
                  <div style={{ fontSize: '10px', color: '#6b7280' }}>رقم الفاتورة</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>{order.serial}</div>
                  <div style={{ fontSize: '10px', color: '#6b7280' }}>{formatDate(order.date_created || order.order_date)}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Customer Info - Single Row */}
        <div style={{ marginBottom: '14px', fontSize: '10px', lineHeight: '1.8' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ color: '#6b7280', width: '55px' }}>العميل:</td>
                <td style={{ fontWeight: '600' }}>{order.client_name || order.customer_name}</td>
                <td style={{ color: '#6b7280', width: '55px' }}>الهاتف:</td>
                <td style={{ fontWeight: '500' }}>
                  {order.phone || order.customer_phone}
                  {(order.phone2 || order.customer_phone2) && ` / ${order.phone2 || order.customer_phone2}`}
                </td>
              </tr>
              <tr>
                <td style={{ color: '#6b7280' }}>الدفع:</td>
                <td style={{ fontWeight: '500' }}>{order.payment_method}</td>
                <td style={{ color: '#6b7280' }}>التوصيل:</td>
                <td style={{ fontWeight: '500' }}>{order.delivery_method}</td>
              </tr>
              {(order.governorate || order.address || order.shipping_address) && (
                <tr>
                  {order.governorate && (
                    <>
                      <td style={{ color: '#6b7280' }}>المحافظة:</td>
                      <td style={{ fontWeight: '500' }}>{order.governorate}</td>
                    </>
                  )}
                  {(order.address || order.shipping_address) && (
                    <>
                      <td style={{ color: '#6b7280' }}>العنوان:</td>
                      <td style={{ fontWeight: '500' }}>{order.address || order.shipping_address}</td>
                    </>
                  )}
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Items - Clean Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '14px' }}>
          <thead>
            <tr style={{ borderTop: '2px solid #111827', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '8px 4px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>المنتج</th>
              <th style={{ padding: '8px 4px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>المقاس</th>
              <th style={{ padding: '8px 4px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>الكمية</th>
              <th style={{ padding: '8px 4px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>السعر</th>
              <th style={{ padding: '8px 4px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, index: number) => {
              const price = item.price || item.unit_price || 0;
              const qty = item.quantity || 1;
              const itemDiscount = item.item_discount || 0;
              const itemTotal = (price * qty) - itemDiscount;
              return (
                <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '6px 4px', fontWeight: '500' }}>{item.product_type || item.product_name}</td>
                  <td style={{ padding: '6px 4px', textAlign: 'center', color: '#6b7280' }}>{item.size || item.product_size}</td>
                  <td style={{ padding: '6px 4px', textAlign: 'center' }}>{qty}</td>
                  <td style={{ padding: '6px 4px', textAlign: 'center' }}>{formatCurrency(price)}</td>
                  <td style={{ padding: '6px 4px', textAlign: 'left', fontWeight: '600' }}>{formatCurrency(itemTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Notes */}
        {order.notes && (
          <div style={{ marginBottom: '14px', padding: '8px', backgroundColor: '#f9fafb', borderRadius: '4px', fontSize: '10px', color: '#374151', lineHeight: '1.6' }}>
            <span style={{ fontWeight: '600' }}>ملاحظات: </span>{order.notes}
          </div>
        )}

        {/* Totals - Right Aligned Minimal */}
        <div style={{ borderTop: '2px solid #111827', paddingTop: '10px', marginBottom: '16px' }}>
          <table style={{ width: '180px', marginRight: 'auto', borderCollapse: 'collapse', fontSize: '10px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '3px 0', color: '#6b7280' }}>المجموع الفرعي</td>
                <td style={{ padding: '3px 0', textAlign: 'left', fontWeight: '500' }}>{formatCurrency(subtotal)}</td>
              </tr>
              {shipping > 0 && (
                <tr>
                  <td style={{ padding: '3px 0', color: '#6b7280' }}>الشحن</td>
                  <td style={{ padding: '3px 0', textAlign: 'left', fontWeight: '500' }}>{formatCurrency(shipping)}</td>
                </tr>
              )}
              {discount > 0 && (
                <tr>
                  <td style={{ padding: '3px 0', color: '#dc2626' }}>الخصم</td>
                  <td style={{ padding: '3px 0', textAlign: 'left', fontWeight: '500', color: '#dc2626' }}>-{formatCurrency(discount)}</td>
                </tr>
              )}
              <tr style={{ borderTop: '1px solid #d1d5db' }}>
                <td style={{ padding: '6px 0', fontWeight: '700', fontSize: '12px' }}>الإجمالي</td>
                <td style={{ padding: '6px 0', textAlign: 'left', fontWeight: '700', fontSize: '12px' }}>{formatCurrency(total)}</td>
              </tr>
              {paid > 0 && (
                <tr>
                  <td style={{ padding: '3px 0', color: '#16a34a' }}>المدفوع</td>
                  <td style={{ padding: '3px 0', textAlign: 'left', fontWeight: '500', color: '#16a34a' }}>{formatCurrency(-paid)}</td>
                </tr>
              )}
              {remaining > 0 && (
                <tr style={{ borderTop: '1px solid #d1d5db' }}>
                  <td style={{ padding: '6px 0', fontWeight: '700', color: '#dc2626', fontSize: '11px' }}>المتبقي</td>
                  <td style={{ padding: '6px 0', textAlign: 'left', fontWeight: '700', color: '#dc2626', fontSize: '11px' }}>{formatCurrency(remaining)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '10px', textAlign: 'center', fontSize: '9px', color: '#9ca3af' }}>
          شكراً لتعاملكم معنا • {storeSettings?.store_name || 'المتجر'}
          {storeSettings?.contact_phone && ` • ${storeSettings.contact_phone}`}
        </div>
      </div>
    </div>
  );
};

export default MinimalInvoiceTemplate;
