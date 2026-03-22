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

const ProfessionalInvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ order, storeSettings }) => {
  const { items, subtotal, shipping, discount, total, paid, remaining } = calculateOrderFinancials(order);
  const { getStatusLabel } = useOrderStatuses();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const invoicePolicy = useInvoicePolicy();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG');
  };

  const handleScreenshot = () => {
    if (!invoiceRef.current) return;
    captureInvoiceScreenshot(invoiceRef.current, order.serial);
  };

  // Unified font sizes
  const fs = {
    xs: '9px',
    sm: '10px',
    base: '10.5px',
    md: '11px',
    lg: '12px',
    xl: '13px',
  };

  const storeName = storeSettings?.store_name || 'المتجر';
  const storeTagline = storeSettings?.store_tagline || '';

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
        data-invoice-ref="true"
        style={{
          backgroundColor: '#ffffff',
          color: '#1f2937',
          fontFamily: 'Tajawal, Arial, sans-serif',
          direction: 'rtl',
          width: '100%',
          maxWidth: '420px',
          margin: '0 auto',
          boxSizing: 'border-box',
          border: '1px solid #e5e7eb',
          borderRadius: '10px',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)', padding: '16px 14px', borderBottom: '2px solid #fecaca' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ textAlign: 'right', width: '28%', verticalAlign: 'middle' }}>
                  <div style={{ fontSize: fs.xs, color: '#9ca3af', marginBottom: '2px' }}>فاتورة رقم</div>
                  <div style={{ fontSize: fs.lg, fontWeight: 'bold', color: '#dc2626', letterSpacing: '0.5px' }}>{order.serial}</div>
                  <div style={{ fontSize: fs.xs, color: '#6b7280', fontWeight: '500' }}>
                    {storeTagline || '#بتاع_هدايا_الأصلي'}
                  </div>
                </td>
                <td style={{ textAlign: 'center', width: '44%', verticalAlign: 'middle' }}>
                  {storeSettings?.logo_url && (
                    <img 
                      src={storeSettings.logo_url} 
                      alt={storeName}
                      style={{ width: '50px', height: '50px', objectFit: 'contain', display: 'inline-block', marginBottom: '4px', borderRadius: '50%', border: '2px solid #fecaca', padding: '2px', backgroundColor: '#fff' }}
                    />
                  )}
                </td>
                <td style={{ textAlign: 'left', width: '28%', verticalAlign: 'middle' }}>
                  <div style={{ fontSize: fs.xs, color: '#9ca3af', marginBottom: '2px' }}>التاريخ</div>
                  <div style={{ fontSize: fs.md, fontWeight: '600', color: '#374151' }}>{formatDate(order.date_created || order.order_date)}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Customer Details */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: '#dc2626', borderRadius: '50%' }}></span>
            <span style={{ fontSize: fs.md, fontWeight: 'bold', color: '#dc2626' }}>بيانات العميل</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ fontSize: fs.base, padding: '2px 0', width: '50%' }}>
                  <span style={{ color: '#9ca3af' }}>الاسم: </span>
                  <span style={{ fontWeight: '600', color: '#111827' }}>{order.client_name || order.customer_name}</span>
                </td>
                <td style={{ fontSize: fs.base, padding: '2px 0', width: '50%' }}>
                  <span style={{ color: '#9ca3af' }}>التليفون: </span>
                  <span style={{ fontWeight: '600', color: '#111827' }}>{order.phone || order.customer_phone}</span>
                  {(order.phone2 || order.customer_phone2) && (
                    <span style={{ fontWeight: '600', color: '#111827' }}> / {order.phone2 || order.customer_phone2}</span>
                  )}
                </td>
              </tr>
              <tr>
                <td style={{ fontSize: fs.base, padding: '2px 0' }}>
                  <span style={{ color: '#9ca3af' }}>السداد: </span>
                  <span style={{ fontWeight: '600', color: '#111827' }}>{order.payment_method}</span>
                </td>
                <td style={{ fontSize: fs.base, padding: '2px 0' }}>
                  <span style={{ color: '#9ca3af' }}>التوصيل: </span>
                  <span style={{ fontWeight: '600', color: '#111827' }}>{order.delivery_method}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Delivery Info */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: '#dc2626', borderRadius: '50%' }}></span>
            <span style={{ fontSize: fs.md, fontWeight: 'bold', color: '#dc2626' }}>معلومات التوصيل</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ fontSize: fs.base, padding: '2px 0', width: '50%' }}>
                  <span style={{ color: '#9ca3af' }}>الحالة: </span>
                  <span style={{ padding: '1px 10px', borderRadius: '10px', fontSize: fs.sm, backgroundColor: '#dcfce7', color: '#16a34a', fontWeight: '600', display: 'inline-block', lineHeight: '1.6' }}>
                    {getStatusLabel(order.status)}
                  </span>
                </td>
                {order.governorate && (
                  <td style={{ fontSize: fs.base, padding: '2px 0', width: '50%' }}>
                    <span style={{ color: '#9ca3af' }}>المحافظة: </span>
                    <span style={{ fontWeight: '600', color: '#111827' }}>{order.governorate}</span>
                  </td>
                )}
              </tr>
              {(order.address || order.shipping_address) && (
                <tr>
                  <td colSpan={2} style={{ fontSize: fs.base, padding: '2px 0' }}>
                    <span style={{ color: '#9ca3af' }}>العنوان: </span>
                    <span style={{ fontWeight: '600', color: '#111827' }}>{order.address || order.shipping_address}</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Items Table */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: '#dc2626', borderRadius: '50%' }}></span>
            <span style={{ fontSize: fs.md, fontWeight: 'bold', color: '#dc2626' }}>تفاصيل الطلب</span>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ backgroundColor: '#dc2626', color: '#ffffff' }}>
                <th style={{ padding: '5px 3px', textAlign: 'right', fontWeight: '600', fontSize: fs.sm, width: '30%' }}>المنتج</th>
                <th style={{ padding: '5px 3px', textAlign: 'center', fontWeight: '600', fontSize: fs.sm, width: '14%' }}>المقاس</th>
                <th style={{ padding: '5px 3px', textAlign: 'center', fontWeight: '600', fontSize: fs.sm, width: '10%' }}>العدد</th>
                <th style={{ padding: '5px 3px', textAlign: 'center', fontWeight: '600', fontSize: fs.sm, width: '15%' }}>السعر</th>
                <th style={{ padding: '5px 3px', textAlign: 'center', fontWeight: '600', fontSize: fs.sm, width: '13%' }}>الخصم</th>
                <th style={{ padding: '5px 3px', textAlign: 'left', fontWeight: '600', fontSize: fs.sm, width: '18%' }}>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? items.map((item: any, index: number) => {
                const price = item.price || item.unit_price || 0;
                const qty = item.quantity || 1;
                const itemDiscount = item.item_discount || 0;
                const itemTotal = (price * qty) - itemDiscount;
                return (
                  <tr key={index} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                    <td style={{ padding: '5px 3px', textAlign: 'right', color: '#111827', fontWeight: '600', wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: '1.4', fontSize: fs.base }}>
                      {item.product_type || item.product_name}
                    </td>
                    <td style={{ padding: '5px 3px', textAlign: 'center', fontSize: fs.base }}>
                      <span style={{ backgroundColor: '#f3f4f6', padding: '1px 4px', borderRadius: '3px', fontSize: fs.xs }}>
                        {item.size || item.product_size}
                      </span>
                    </td>
                    <td style={{ padding: '5px 3px', textAlign: 'center', fontWeight: '600', fontSize: fs.base }}>{item.quantity}</td>
                    <td style={{ padding: '5px 3px', textAlign: 'center', fontSize: fs.base }}>{formatCurrency(price)}</td>
                    <td style={{ padding: '5px 3px', textAlign: 'center', color: itemDiscount > 0 ? '#dc2626' : '#d1d5db', fontSize: fs.base }}>
                      {itemDiscount > 0 ? `-${formatCurrency(itemDiscount)}` : '-'}
                    </td>
                    <td style={{ padding: '5px 3px', textAlign: 'left', fontWeight: '600', fontSize: fs.base }}>{formatCurrency(itemTotal)}</td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontSize: fs.base }}>لا توجد أصناف</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Invoice Summary */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: '#dc2626', borderRadius: '50%' }}></span>
            <span style={{ fontSize: fs.md, fontWeight: 'bold', color: '#dc2626' }}>ملخص الفاتورة</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '5px 10px', fontSize: fs.base, color: '#6b7280', textAlign: 'right', width: '60%' }}>إجمالي المنتجات:</td>
                <td style={{ padding: '5px 10px', fontSize: fs.base, fontWeight: '600', textAlign: 'left', color: '#111827' }}>{formatCurrency(subtotal)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '5px 10px', fontSize: fs.base, color: '#6b7280', textAlign: 'right' }}>الشحن:</td>
                <td style={{ padding: '5px 10px', fontSize: fs.base, fontWeight: '600', textAlign: 'left', color: '#111827' }}>{formatCurrency(shipping)}</td>
              </tr>
              {discount > 0 && (
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '5px 10px', fontSize: fs.base, color: '#6b7280', textAlign: 'right' }}>الخصم:</td>
                  <td style={{ padding: '5px 10px', fontSize: fs.base, fontWeight: '600', textAlign: 'left', color: '#dc2626' }}>- {formatCurrency(discount)}</td>
                </tr>
              )}
              <tr style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: '#eff6ff' }}>
                <td style={{ padding: '6px 10px', fontSize: fs.md, fontWeight: 'bold', color: '#2563eb', textAlign: 'right' }}>المجموع:</td>
                <td style={{ padding: '6px 10px', fontSize: fs.md, fontWeight: 'bold', textAlign: 'left', color: '#2563eb' }}>{formatCurrency(total)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '5px 10px', fontSize: fs.base, color: '#16a34a', fontWeight: '600', textAlign: 'right' }}>المدفوع:</td>
                <td style={{ padding: '5px 10px', fontSize: fs.base, fontWeight: '600', textAlign: 'left', color: '#16a34a' }}>- {formatCurrency(paid)}</td>
              </tr>
              <tr style={{ backgroundColor: remaining > 0 ? '#fef2f2' : '#f0fdf4' }}>
                <td style={{ padding: '6px 10px', fontSize: fs.md, fontWeight: 'bold', color: remaining > 0 ? '#dc2626' : '#16a34a', textAlign: 'right' }}>المتبقي:</td>
                <td style={{ padding: '6px 10px', fontSize: fs.md, fontWeight: 'bold', textAlign: 'left', color: remaining > 0 ? '#dc2626' : '#16a34a' }}>{formatCurrency(remaining)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Notes */}
        {order.notes && (
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '8px 10px' }}>
              <div style={{ fontSize: fs.md, fontWeight: 'bold', color: '#dc2626', marginBottom: '3px' }}>📝 ملاحظات:</div>
              <div style={{ fontSize: fs.base, color: '#374151', lineHeight: '1.6' }}>{order.notes}</div>
            </div>
          </div>
        )}

        {/* Invoice Policy */}
        {invoicePolicy.enabled && invoicePolicy.content && (
          <div style={{ padding: '8px 14px', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px 10px', backgroundColor: '#f9fafb' }}>
              <div style={{ fontSize: fs.sm, fontWeight: 'bold', color: '#6b7280', marginBottom: '4px', textAlign: 'center' }}>
                📋 {invoicePolicy.title}
              </div>
              <div style={{ fontSize: fs.xs, color: '#6b7280', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
                {invoicePolicy.content}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '10px 14px', backgroundColor: '#f9fafb', textAlign: 'center' }}>
          <div style={{ marginBottom: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            {storeSettings?.logo_url && (
              <img 
                src={storeSettings.logo_url} 
                alt=""
                style={{ width: '20px', height: '20px', objectFit: 'contain', borderRadius: '50%' }}
              />
            )}
            <span style={{ fontSize: fs.base, fontWeight: '600', color: '#374151' }}>
              شكراً لثقتكم في {storeName}
            </span>
          </div>
          {storeSettings?.contact_phone && (
            <div style={{ fontSize: fs.xs, color: '#9ca3af' }}>
              📞 للتواصل: {storeSettings.contact_phone}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalInvoiceTemplate;