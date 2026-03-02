import React, { useRef } from 'react';
import { formatCurrency } from '@/lib/utils';
import { calculateOrderFinancials } from '@/lib/orderFinancials';
import { useOrderStatuses } from '@/hooks/useOrderStatuses';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { captureInvoiceScreenshot } from '@/lib/invoiceScreenshot';
import { useInvoicePolicy } from '@/components/admin/settings/InvoicePolicySettings';

interface InvoiceTemplateProps {
  order: any;
  storeSettings?: any;
}

const ModernInvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ order, storeSettings }) => {
  const storeName = storeSettings?.store_name || "متجري";
  const logoUrl = storeSettings?.logo_url;
  const { getStatusLabel } = useOrderStatuses();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const invoicePolicy = useInvoicePolicy();

  const { items, subtotal, shipping, discount, total, paid, remaining } = calculateOrderFinancials(order);

  const handleScreenshot = () => {
    if (!invoiceRef.current) return;
    captureInvoiceScreenshot(invoiceRef.current, order.serial, '#f8fafc');
  };

  const getModernStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      processing: '#8b5cf6',
      shipped: '#22c55e',
      delivered: '#10b981',
      cancelled: '#ef4444',
      completed: '#059669'
    };
    return colors[status] || '#6b7280';
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
          backgroundColor: '#f8fafc',
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
        <div style={{ backgroundColor: '#7c3aed', color: '#ffffff', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ verticalAlign: 'middle', textAlign: 'right' }}>
                  {logoUrl && (
                    <div style={{ display: 'inline-block', backgroundColor: '#ffffff', padding: '4px', borderRadius: '8px', marginLeft: '8px', verticalAlign: 'middle' }}>
                      <img src={logoUrl} alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain', display: 'block' }} />
                    </div>
                  )}
                  <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{storeName}</div>
                    <div style={{ fontSize: '10px', opacity: '0.8' }}>فاتورة إلكترونية</div>
                  </div>
                </td>
                <td style={{ verticalAlign: 'middle', textAlign: 'left', backgroundColor: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '10px', opacity: '0.8' }}>رقم الفاتورة</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{order.serial}</div>
                  <div style={{ fontSize: '10px', opacity: '0.8' }}>
                    {new Date(order.order_date || order.date_created).toLocaleDateString('ar-EG')}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Status Badge */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <span style={{ 
            display: 'inline-block',
            backgroundColor: getModernStatusColor(order.status), 
            color: '#ffffff', 
            padding: '6px 16px', 
            borderRadius: '20px', 
            fontSize: '11px', 
            fontWeight: 'bold' 
          }}>
            {getStatusLabel(order.status)}
          </span>
        </div>

        {/* Customer & Order Info */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', verticalAlign: 'top', paddingLeft: '4px' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '10px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}>
                    <span style={{ display: 'inline-block', width: '20px', height: '20px', backgroundColor: '#7c3aed', borderRadius: '50%', textAlign: 'center', lineHeight: '20px', color: '#fff', fontSize: '10px', marginLeft: '6px', verticalAlign: 'middle' }}>👤</span>
                    معلومات العميل
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
                <div style={{ backgroundColor: '#ffffff', padding: '10px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}>
                    <span style={{ display: 'inline-block', width: '20px', height: '20px', backgroundColor: '#10b981', borderRadius: '50%', textAlign: 'center', lineHeight: '20px', color: '#fff', fontSize: '10px', marginLeft: '6px', verticalAlign: 'middle' }}>📦</span>
                    تفاصيل الطلب
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
        <div style={{ marginBottom: '16px', backgroundColor: '#ffffff', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#1f2937', color: '#ffffff' }}>
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
                  <tr key={item.id} style={{ backgroundColor: index % 2 === 0 ? '#f9fafb' : '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '6px 4px', textAlign: 'center' }}>{index + 1}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: '500' }}>{item.product_name || item.product_type}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'center' }}>{item.product_size || item.size}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                      <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold', fontSize: '9px' }}>{item.quantity}</span>
                    </td>
                    <td style={{ padding: '6px 4px', textAlign: 'center' }}>{formatCurrency(item.unit_price || item.price)}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'left', fontWeight: 'bold', color: '#16a34a' }}>{formatCurrency(itemTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Notes */}
        {order.notes && (
          <div style={{ marginBottom: '16px', backgroundColor: '#fef3c7', borderRight: '4px solid #f59e0b', padding: '12px', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ width: '24px', height: '24px', backgroundColor: '#f59e0b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '12px' }}>📝</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#92400e', marginBottom: '4px' }}>ملاحظات الطلب:</div>
                <div style={{ fontSize: '10px', color: '#374151', lineHeight: '1.6' }}>{order.notes}</div>
              </div>
            </div>
          </div>
        )}

        {/* Totals */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ width: '100%', maxWidth: '220px', marginRight: 'auto', backgroundColor: '#1f2937', borderRadius: '12px', overflow: 'hidden', color: '#ffffff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                  <td style={{ padding: '8px 12px', fontSize: '10px' }}>المجموع الفرعي:</td>
                  <td style={{ padding: '8px 12px', fontSize: '10px', fontWeight: 'bold', textAlign: 'left' }}>{formatCurrency(subtotal)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                  <td style={{ padding: '8px 12px', fontSize: '10px' }}>الشحن:</td>
                  <td style={{ padding: '8px 12px', fontSize: '10px', fontWeight: 'bold', textAlign: 'left' }}>{formatCurrency(shipping)}</td>
                </tr>
                {discount > 0 && (
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                    <td style={{ padding: '8px 12px', fontSize: '10px', color: '#f87171' }}>الخصم:</td>
                    <td style={{ padding: '8px 12px', fontSize: '10px', fontWeight: 'bold', textAlign: 'left', color: '#f87171' }}>-{formatCurrency(discount)}</td>
                  </tr>
                )}
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                  <td style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 'bold' }}>الإجمالي:</td>
                  <td style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 'bold', textAlign: 'left', color: '#fbbf24' }}>{formatCurrency(total)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                  <td style={{ padding: '8px 12px', fontSize: '10px', color: '#4ade80' }}>المدفوع:</td>
                  <td style={{ padding: '8px 12px', fontSize: '10px', fontWeight: 'bold', textAlign: 'left', color: '#4ade80' }}>{formatCurrency(-paid)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 'bold', color: '#f87171' }}>المتبقي:</td>
                  <td style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 'bold', textAlign: 'left', color: '#f87171' }}>{formatCurrency(remaining)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {invoicePolicy.enabled && invoicePolicy.content && (
          <div style={{ padding: '10px 16px', marginBottom: '8px' }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', backgroundColor: '#f8fafc' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#334155', marginBottom: '4px', textAlign: 'center' }}>📋 {invoicePolicy.title}</div>
              <div style={{ fontSize: '8px', color: '#475569', lineHeight: '1.8', whiteSpace: 'pre-line' }}>{invoicePolicy.content}</div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ backgroundColor: '#1f2937', color: '#ffffff', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>✨ شكراً لثقتكم ✨</div>
          {storeSettings?.contact_phone && (
            <div style={{ fontSize: '10px', opacity: '0.8' }}>📞 {storeSettings.contact_phone}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModernInvoiceTemplate;
