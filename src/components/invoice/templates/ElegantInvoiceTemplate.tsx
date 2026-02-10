import React, { useRef } from 'react';
import { formatCurrency } from '@/lib/utils';
import { calculateOrderFinancials } from '@/lib/orderFinancials';
import { useOrderStatuses } from '@/hooks/useOrderStatuses';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { captureInvoiceScreenshot } from '@/lib/invoiceScreenshot';

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

  const handleScreenshot = () => {
    if (!invoiceRef.current) return;
    captureInvoiceScreenshot(invoiceRef.current, order.serial);
  };

  return (
    <div>
      {/* Screenshot Button */}
      <div style={{ textAlign: 'center', marginBottom: '12px' }} className="print:hidden">
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
        style={{
          backgroundColor: '#ffffff',
          color: '#1f2937',
          padding: '16px',
          fontFamily: 'Tajawal, Arial, sans-serif',
          direction: 'rtl',
          width: '100%',
          maxWidth: '400px',
          margin: '0 auto',
          border: '4px double #d97706',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #d97706', paddingBottom: '12px', marginBottom: '16px' }}>
          {logoUrl && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'inline-block', border: '2px solid #d97706', borderRadius: '50%', padding: '4px' }}>
                <img src={logoUrl} alt="Logo" style={{ width: '48px', height: '48px', objectFit: 'contain', display: 'block', borderRadius: '50%' }} />
              </div>
            </div>
          )}
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#b45309', marginBottom: '4px' }}>{storeName}</div>
          <div style={{ fontSize: '10px', color: '#6b7280', fontStyle: 'italic' }}>فاتورة رسمية</div>
          
          <table style={{ width: '100%', marginTop: '12px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ textAlign: 'right', width: '50%' }}>
                  <div style={{ fontSize: '10px', color: '#6b7280' }}>رقم الفاتورة</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#b45309' }}>{order.serial}</div>
                </td>
                <td style={{ textAlign: 'left', width: '50%' }}>
                  <div style={{ fontSize: '10px', color: '#6b7280' }}>التاريخ</div>
                  <div style={{ fontSize: '11px', fontWeight: '600' }}>
                    {new Date(order.order_date || order.date_created).toLocaleDateString('ar-EG')}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Status */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <span style={{ 
            display: 'inline-block',
            backgroundColor: '#fef3c7', 
            color: '#92400e', 
            padding: '6px 16px', 
            borderRadius: '20px', 
            border: '1px solid #fcd34d',
            fontSize: '11px', 
            fontWeight: '600' 
          }}>
            {getStatusLabel(order.status)}
          </span>
        </div>

        {/* Customer & Order Info */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', verticalAlign: 'top', paddingLeft: '4px' }}>
                <div style={{ border: '1px solid #fcd34d', padding: '10px', borderRadius: '8px', backgroundColor: '#fffbeb' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#92400e', borderBottom: '1px solid #fcd34d', paddingBottom: '4px', marginBottom: '8px' }}>
                    بيانات العميل
                  </div>
                  <div style={{ fontSize: '10px', lineHeight: '1.8' }}>
                    <div><span style={{ color: '#6b7280' }}>الاسم:</span> <span style={{ fontWeight: '500' }}>{order.customer_name || order.client_name}</span></div>
                    <div>
                      <span style={{ color: '#6b7280' }}>الهاتف:</span> <span style={{ fontWeight: '500' }}>{order.customer_phone || order.phone}</span>
                      {(order.phone2 || order.customer_phone2) && (
                        <span style={{ fontWeight: '500' }}> / {order.phone2 || order.customer_phone2}</span>
                      )}
                    </div>
                    {(order.shipping_address || order.address) && (
                      <div><span style={{ color: '#6b7280' }}>العنوان:</span> <span style={{ fontWeight: '500' }}>{order.shipping_address || order.address}</span></div>
                    )}
                  </div>
                </div>
              </td>
              <td style={{ width: '50%', verticalAlign: 'top', paddingRight: '4px' }}>
                <div style={{ border: '1px solid #fcd34d', padding: '10px', borderRadius: '8px', backgroundColor: '#fffbeb' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#92400e', borderBottom: '1px solid #fcd34d', paddingBottom: '4px', marginBottom: '8px' }}>
                    معلومات الطلب
                  </div>
                  <div style={{ fontSize: '10px', lineHeight: '1.8' }}>
                    <div><span style={{ color: '#6b7280' }}>الدفع:</span> <span style={{ fontWeight: '500' }}>{order.payment_method}</span></div>
                    <div><span style={{ color: '#6b7280' }}>التوصيل:</span> <span style={{ fontWeight: '500' }}>{order.delivery_method}</span></div>
                    {order.governorate && <div><span style={{ color: '#6b7280' }}>المحافظة:</span> <span style={{ fontWeight: '500' }}>{order.governorate}</span></div>}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Items Table */}
        <div style={{ marginBottom: '16px', border: '1px solid #fcd34d', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#d97706', color: '#ffffff' }}>
                <th style={{ padding: '8px 4px', textAlign: 'right', fontWeight: '600' }}>#</th>
                <th style={{ padding: '8px 4px', textAlign: 'right', fontWeight: '600' }}>المنتج</th>
                <th style={{ padding: '8px 4px', textAlign: 'center', fontWeight: '600' }}>المقاس</th>
                <th style={{ padding: '8px 4px', textAlign: 'center', fontWeight: '600' }}>الكمية</th>
                <th style={{ padding: '8px 4px', textAlign: 'center', fontWeight: '600' }}>السعر</th>
                <th style={{ padding: '8px 4px', textAlign: 'left', fontWeight: '600' }}>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, index: number) => {
                const itemTotal = item.total_price || (item.quantity * item.price - (item.item_discount || 0));
                return (
                  <tr key={item.id} style={{ backgroundColor: index % 2 === 0 ? '#fffbeb' : '#ffffff', borderBottom: '1px solid #fde68a' }}>
                    <td style={{ padding: '6px 4px', textAlign: 'center' }}>{index + 1}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: '500' }}>{item.product_name || item.product_type}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'center' }}>{item.product_size || item.size}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'center' }}>{formatCurrency(item.unit_price || item.price)}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'left', fontWeight: 'bold', color: '#b45309' }}>{formatCurrency(itemTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Notes */}
        {order.notes && (
          <div style={{ marginBottom: '16px', border: '2px solid #fcd34d', padding: '12px', borderRadius: '8px', backgroundColor: '#fffbeb' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ width: '20px', height: '20px', backgroundColor: '#d97706', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '10px', color: '#fff' }}>📝</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#92400e', marginBottom: '4px' }}>ملاحظات الطلب:</div>
                <div style={{ fontSize: '10px', color: '#374151', lineHeight: '1.6', fontStyle: 'italic' }}>{order.notes}</div>
              </div>
            </div>
          </div>
        )}

        {/* Totals */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ width: '100%', maxWidth: '220px', marginRight: 'auto', border: '2px double #d97706', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fffbeb' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #fcd34d' }}>
                  <td style={{ padding: '6px 10px', fontSize: '10px', color: '#374151' }}>المجموع الفرعي:</td>
                  <td style={{ padding: '6px 10px', fontSize: '10px', fontWeight: 'bold', textAlign: 'left' }}>{formatCurrency(subtotal)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #fcd34d' }}>
                  <td style={{ padding: '6px 10px', fontSize: '10px', color: '#374151' }}>الشحن:</td>
                  <td style={{ padding: '6px 10px', fontSize: '10px', fontWeight: 'bold', textAlign: 'left' }}>{formatCurrency(shipping)}</td>
                </tr>
                {discount > 0 && (
                  <tr style={{ borderBottom: '1px solid #fcd34d' }}>
                    <td style={{ padding: '6px 10px', fontSize: '10px', color: '#dc2626' }}>الخصم:</td>
                    <td style={{ padding: '6px 10px', fontSize: '10px', fontWeight: 'bold', textAlign: 'left', color: '#dc2626' }}>-{formatCurrency(discount)}</td>
                  </tr>
                )}
                <tr style={{ borderBottom: '2px double #d97706' }}>
                  <td style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 'bold', color: '#92400e' }}>الإجمالي:</td>
                  <td style={{ padding: '8px 10px', fontSize: '12px', fontWeight: 'bold', textAlign: 'left', color: '#b45309' }}>{formatCurrency(total)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #fcd34d' }}>
                  <td style={{ padding: '6px 10px', fontSize: '10px', color: '#16a34a' }}>المدفوع:</td>
                  <td style={{ padding: '6px 10px', fontSize: '10px', fontWeight: 'bold', textAlign: 'left', color: '#16a34a' }}>{formatCurrency(-paid)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 'bold', color: '#dc2626' }}>المتبقي:</td>
                  <td style={{ padding: '8px 10px', fontSize: '12px', fontWeight: 'bold', textAlign: 'left', color: '#dc2626' }}>{formatCurrency(remaining)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '2px solid #d97706', paddingTop: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#b45309', marginBottom: '4px' }}>شكراً لثقتكم</div>
          {storeSettings?.contact_phone && (
            <div style={{ fontSize: '10px', color: '#6b7280' }}>☎ {storeSettings.contact_phone}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ElegantInvoiceTemplate;
