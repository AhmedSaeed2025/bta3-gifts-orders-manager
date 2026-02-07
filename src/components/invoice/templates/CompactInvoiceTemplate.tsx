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

const CompactInvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ order, storeSettings }) => {
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

  const accentColor = '#6366f1'; // Indigo

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
          backgroundColor: '#ffffff', color: '#1f2937', padding: '0',
          fontFamily: 'Tajawal, Arial, sans-serif', direction: 'rtl',
          width: '400px', maxWidth: '400px', margin: '0 auto',
          border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden',
        }}
      >
        {/* Header Band */}
        <div style={{ background: `linear-gradient(135deg, ${accentColor}, #818cf8)`, padding: '14px 16px', color: '#ffffff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {storeSettings?.logo_url && (
                      <img src={storeSettings.logo_url} alt="" style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '6px', background: 'rgba(255,255,255,0.2)', padding: '2px' }} />
                    )}
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700' }}>{storeSettings?.store_name || 'المتجر'}</div>
                      <div style={{ fontSize: '9px', opacity: 0.8 }}>فاتورة مبيعات</div>
                    </div>
                  </div>
                </td>
                <td style={{ textAlign: 'left', verticalAlign: 'middle' }}>
                  <div style={{ fontSize: '9px', opacity: 0.8 }}>الفاتورة</div>
                  <div style={{ fontSize: '13px', fontWeight: '700' }}>{order.serial}</div>
                  <div style={{ fontSize: '9px', opacity: 0.8 }}>{formatDate(order.date_created || order.order_date)}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Customer & Delivery - Compact Grid */}
        <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '2px 0', color: '#64748b', width: '50px' }}>العميل</td>
                <td style={{ padding: '2px 0', fontWeight: '600' }}>{order.client_name || order.customer_name}</td>
                <td style={{ padding: '2px 0', color: '#64748b', width: '50px' }}>الهاتف</td>
                <td style={{ padding: '2px 0', fontWeight: '500' }}>
                  {order.phone || order.customer_phone}
                  {(order.phone2 || order.customer_phone2) && ` / ${order.phone2 || order.customer_phone2}`}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '2px 0', color: '#64748b' }}>الدفع</td>
                <td style={{ padding: '2px 0', fontWeight: '500' }}>{order.payment_method}</td>
                <td style={{ padding: '2px 0', color: '#64748b' }}>التوصيل</td>
                <td style={{ padding: '2px 0', fontWeight: '500' }}>{order.delivery_method}</td>
              </tr>
              {order.governorate && (
                <tr>
                  <td style={{ padding: '2px 0', color: '#64748b' }}>المحافظة</td>
                  <td colSpan={3} style={{ padding: '2px 0', fontWeight: '500' }}>
                    {order.governorate}
                    {(order.address || order.shipping_address) && ` - ${order.address || order.shipping_address}`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Items */}
        <div style={{ padding: '0 16px 12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${accentColor}` }}>
                <th style={{ padding: '8px 4px', textAlign: 'right', fontWeight: '600', color: accentColor }}>المنتج</th>
                <th style={{ padding: '8px 4px', textAlign: 'center', fontWeight: '600', color: accentColor }}>المقاس</th>
                <th style={{ padding: '8px 4px', textAlign: 'center', fontWeight: '600', color: accentColor }}>الكمية</th>
                <th style={{ padding: '8px 4px', textAlign: 'center', fontWeight: '600', color: accentColor }}>السعر</th>
                {items.some((i: any) => (i.item_discount || 0) > 0) && (
                  <th style={{ padding: '8px 4px', textAlign: 'center', fontWeight: '600', color: accentColor }}>الخصم</th>
                )}
                <th style={{ padding: '8px 4px', textAlign: 'left', fontWeight: '600', color: accentColor }}>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, index: number) => {
                const price = item.price || item.unit_price || 0;
                const qty = item.quantity || 1;
                const itemDiscount = item.item_discount || 0;
                const itemTotal = (price * qty) - itemDiscount;
                const hasAnyDiscount = items.some((i: any) => (i.item_discount || 0) > 0);
                return (
                  <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 4px', fontWeight: '500' }}>{item.product_type || item.product_name}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                      <span style={{ backgroundColor: '#eef2ff', color: accentColor, padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '500' }}>
                        {item.size || item.product_size}
                      </span>
                    </td>
                    <td style={{ padding: '6px 4px', textAlign: 'center', fontWeight: '600' }}>{qty}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'center' }}>{formatCurrency(price)}</td>
                    {hasAnyDiscount && (
                      <td style={{ padding: '6px 4px', textAlign: 'center', color: itemDiscount > 0 ? '#dc2626' : '#d1d5db' }}>
                        {itemDiscount > 0 ? `-${formatCurrency(itemDiscount)}` : '-'}
                      </td>
                    )}
                    <td style={{ padding: '6px 4px', textAlign: 'left', fontWeight: '700' }}>{formatCurrency(itemTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Notes */}
        {order.notes && (
          <div style={{ padding: '0 16px 12px' }}>
            <div style={{ padding: '8px 10px', backgroundColor: '#fefce8', borderRight: `3px solid #eab308`, borderRadius: '4px', fontSize: '10px', color: '#713f12', lineHeight: '1.6' }}>
              📝 {order.notes}
            </div>
          </div>
        )}

        {/* Totals - Card Style */}
        <div style={{ padding: '0 16px 14px' }}>
          <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '10px', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '3px 4px', color: '#64748b' }}>المجموع الفرعي</td>
                  <td style={{ padding: '3px 4px', textAlign: 'left', fontWeight: '500' }}>{formatCurrency(subtotal)}</td>
                </tr>
                {shipping > 0 && (
                  <tr>
                    <td style={{ padding: '3px 4px', color: '#64748b' }}>الشحن</td>
                    <td style={{ padding: '3px 4px', textAlign: 'left', fontWeight: '500' }}>{formatCurrency(shipping)}</td>
                  </tr>
                )}
                {discount > 0 && (
                  <tr>
                    <td style={{ padding: '3px 4px', color: '#dc2626' }}>الخصم</td>
                    <td style={{ padding: '3px 4px', textAlign: 'left', fontWeight: '500', color: '#dc2626' }}>-{formatCurrency(discount)}</td>
                  </tr>
                )}
                <tr style={{ borderTop: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '6px 4px', fontWeight: '700', color: accentColor, fontSize: '12px' }}>الإجمالي</td>
                  <td style={{ padding: '6px 4px', textAlign: 'left', fontWeight: '700', color: accentColor, fontSize: '12px' }}>{formatCurrency(total)}</td>
                </tr>
                {paid > 0 && (
                  <tr>
                    <td style={{ padding: '3px 4px', color: '#16a34a' }}>المدفوع</td>
                    <td style={{ padding: '3px 4px', textAlign: 'left', fontWeight: '600', color: '#16a34a' }}>{formatCurrency(-paid)}</td>
                  </tr>
                )}
                {remaining > 0 && (
                  <tr style={{ borderTop: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '6px 4px', fontWeight: '700', color: '#dc2626', fontSize: '11px' }}>المتبقي</td>
                    <td style={{ padding: '6px 4px', textAlign: 'left', fontWeight: '700', color: '#dc2626', fontSize: '11px' }}>{formatCurrency(remaining)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: `linear-gradient(135deg, ${accentColor}, #818cf8)`, padding: '10px 16px', textAlign: 'center', color: '#ffffff', fontSize: '10px' }}>
          <div style={{ fontWeight: '600', marginBottom: '2px' }}>شكراً لثقتكم في {storeSettings?.store_name || 'متجرنا'}</div>
          {storeSettings?.contact_phone && (
            <div style={{ opacity: 0.8, fontSize: '9px' }}>📞 {storeSettings.contact_phone}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompactInvoiceTemplate;
