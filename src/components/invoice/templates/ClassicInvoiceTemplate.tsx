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

const ClassicInvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ order, storeSettings }) => {
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
        }}
      >
        {/* Header */}
        <div style={{ borderBottom: '3px solid #2563eb', paddingBottom: '12px', marginBottom: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ verticalAlign: 'middle', textAlign: 'right' }}>
                  {logoUrl && (
                    <img src={logoUrl} alt="Logo" style={{ width: '48px', height: '48px', objectFit: 'contain', display: 'inline-block' }} />
                  )}
                  <div style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2563eb' }}>{storeName}</div>
                    <div style={{ fontSize: '10px', color: '#6b7280' }}>فاتورة مبيعات</div>
                  </div>
                </td>
                <td style={{ verticalAlign: 'middle', textAlign: 'left', backgroundColor: '#eff6ff', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '10px', color: '#6b7280' }}>رقم الفاتورة</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2563eb' }}>{order.serial}</div>
                  <div style={{ fontSize: '10px', color: '#6b7280' }}>
                    {new Date(order.order_date || order.date_created).toLocaleDateString('ar-EG')}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Customer & Order Info */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', verticalAlign: 'top', paddingLeft: '4px' }}>
                <div style={{ backgroundColor: '#f9fafb', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#374151', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '6px' }}>
                    بيانات العميل
                  </div>
                  <div style={{ fontSize: '10px', lineHeight: '1.6' }}>
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
                    {order.governorate && (
                      <div><span style={{ color: '#6b7280' }}>المحافظة:</span> <span style={{ fontWeight: '500' }}>{order.governorate}</span></div>
                    )}
                  </div>
                </div>
              </td>
              <td style={{ width: '50%', verticalAlign: 'top', paddingRight: '4px' }}>
                <div style={{ backgroundColor: '#f9fafb', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#374151', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '6px' }}>
                    تفاصيل الطلب
                  </div>
                  <div style={{ fontSize: '10px', lineHeight: '1.6' }}>
                    <div><span style={{ color: '#6b7280' }}>الدفع:</span> <span style={{ fontWeight: '500' }}>{order.payment_method}</span></div>
                    <div><span style={{ color: '#6b7280' }}>التوصيل:</span> <span style={{ fontWeight: '500' }}>{order.delivery_method}</span></div>
                    <div>
                      <span style={{ color: '#6b7280' }}>الحالة:</span>
                      <span style={{ marginRight: '4px', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', backgroundColor: '#dbeafe', color: '#1d4ed8', fontWeight: '500' }}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Items Table */}
        <div style={{ marginBottom: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#2563eb', color: '#ffffff' }}>
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
                  <tr key={item.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '6px 4px', textAlign: 'center' }}>{index + 1}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: '500' }}>{item.product_name || item.product_type}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'center' }}>{item.product_size || item.size}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'center' }}>{formatCurrency(item.unit_price || item.price)}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'left', fontWeight: 'bold', color: '#2563eb' }}>{formatCurrency(itemTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Notes */}
        {order.notes && (
          <div style={{ marginBottom: '16px', backgroundColor: '#fefce8', borderRight: '4px solid #f59e0b', padding: '10px', borderRadius: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ fontSize: '14px' }}>📝</span>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#92400e', marginBottom: '4px' }}>ملاحظات الطلب:</div>
                <div style={{ fontSize: '10px', color: '#374151', lineHeight: '1.5' }}>{order.notes}</div>
              </div>
            </div>
          </div>
        )}

        {/* Totals */}
        <div style={{ marginBottom: '16px' }}>
          <table style={{ width: '100%', maxWidth: '220px', marginRight: 'auto', borderCollapse: 'collapse', backgroundColor: '#f9fafb', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '6px 8px', fontSize: '10px', color: '#374151' }}>المجموع الفرعي:</td>
                <td style={{ padding: '6px 8px', fontSize: '10px', fontWeight: 'bold', textAlign: 'left' }}>{formatCurrency(subtotal)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '6px 8px', fontSize: '10px', color: '#374151' }}>الشحن:</td>
                <td style={{ padding: '6px 8px', fontSize: '10px', fontWeight: 'bold', textAlign: 'left' }}>{formatCurrency(shipping)}</td>
              </tr>
              {discount > 0 && (
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '6px 8px', fontSize: '10px', color: '#dc2626' }}>الخصم:</td>
                  <td style={{ padding: '6px 8px', fontSize: '10px', fontWeight: 'bold', textAlign: 'left', color: '#dc2626' }}>-{formatCurrency(discount)}</td>
                </tr>
              )}
              <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#dbeafe' }}>
                <td style={{ padding: '8px', fontSize: '11px', fontWeight: 'bold', color: '#1e40af' }}>الإجمالي:</td>
                <td style={{ padding: '8px', fontSize: '12px', fontWeight: 'bold', textAlign: 'left', color: '#1e40af' }}>{formatCurrency(total)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '6px 8px', fontSize: '10px', color: '#16a34a' }}>المدفوع:</td>
                <td style={{ padding: '6px 8px', fontSize: '10px', fontWeight: 'bold', textAlign: 'left', color: '#16a34a' }}>{formatCurrency(-paid)}</td>
              </tr>
              <tr style={{ backgroundColor: '#fee2e2' }}>
                <td style={{ padding: '8px', fontSize: '11px', fontWeight: 'bold', color: '#dc2626' }}>المتبقي:</td>
                <td style={{ padding: '8px', fontSize: '12px', fontWeight: 'bold', textAlign: 'left', color: '#dc2626' }}>{formatCurrency(remaining)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#2563eb', marginBottom: '4px' }}>شكراً لتعاملكم معنا</div>
          {storeSettings?.contact_phone && (
            <div style={{ fontSize: '10px', color: '#6b7280' }}>{storeSettings.contact_phone}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassicInvoiceTemplate;
