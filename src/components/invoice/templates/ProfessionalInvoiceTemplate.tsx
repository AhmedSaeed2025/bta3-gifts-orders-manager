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
        <div style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)', padding: '16px 14px', borderBottom: '2px solid #fecaca', borderRadius: '10px 10px 0 0' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', tableLayout: 'fixed' }}>
            <tbody>
              <tr>
                <td style={{ textAlign: 'right', width: '30%', verticalAlign: 'middle', padding: '0 4px' }}>
                  <div style={{ fontSize: fs.xs, color: '#9ca3af', marginBottom: '2px' }}>فاتورة رقم</div>
                  <div style={{ fontSize: fs.lg, fontWeight: 'bold', color: '#dc2626', letterSpacing: '0.5px', wordBreak: 'break-all' }}>{order.serial}</div>
                  <div style={{ fontSize: fs.xs, color: '#6b7280', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {storeTagline || '#بتاع_هدايا_الأصلي'}
                  </div>
                </td>
                <td style={{ textAlign: 'center', width: '40%', verticalAlign: 'middle', padding: '0 4px' }}>
                  {storeSettings?.logo_url ? (
                    <img 
                      src={storeSettings.logo_url} 
                      alt={storeName}
                      crossOrigin="anonymous"
                      style={{ width: '64px', height: '64px', objectFit: 'contain', display: 'inline-block', borderRadius: '50%', border: '2px solid #fecaca', padding: '3px', backgroundColor: '#fff' }}
                    />
                  ) : (
                    <img 
                      src="/lovable-uploads/ac63ecb6-e1d0-4917-9537-12f75da70364.png" 
                      alt={storeName}
                      style={{ width: '64px', height: '64px', objectFit: 'contain', display: 'inline-block', borderRadius: '50%', border: '2px solid #fecaca', padding: '3px', backgroundColor: '#fff' }}
                    />
                  )}
                </td>
                <td style={{ textAlign: 'left', width: '30%', verticalAlign: 'middle', padding: '0 4px' }}>
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
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ marginBottom: '8px' }}>
            <table style={{ borderCollapse: 'collapse' }}><tbody><tr>
              <td style={{ width: '6px', height: '6px', padding: '0 3px 0 0' }}>
                <div style={{ width: '6px', height: '6px', backgroundColor: '#dc2626', borderRadius: '50%' }}></div>
              </td>
              <td style={{ fontSize: fs.md, fontWeight: 'bold', color: '#dc2626', padding: '0' }}>ملخص الفاتورة</td>
            </tr></tbody></table>
          </div>

          {/* Details table */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '4px 10px', fontSize: fs.base, color: '#6b7280', textAlign: 'right', width: '60%' }}>إجمالي المنتجات:</td>
                <td style={{ padding: '4px 10px', fontSize: fs.base, fontWeight: '600', textAlign: 'left', color: '#374151' }}>{formatCurrency(subtotal)}</td>
              </tr>
              {shipping > 0 && (
                <tr>
                  <td style={{ padding: '4px 10px', fontSize: fs.base, color: '#6b7280', textAlign: 'right' }}>مصاريف الشحن:</td>
                  <td style={{ padding: '4px 10px', fontSize: fs.base, fontWeight: '600', textAlign: 'left', color: '#374151' }}>{formatCurrency(shipping)}</td>
                </tr>
              )}
              {discount > 0 && (
                <tr>
                  <td style={{ padding: '4px 10px', fontSize: fs.base, color: '#dc2626', textAlign: 'right' }}>الخصم:</td>
                  <td style={{ padding: '4px 10px', fontSize: fs.base, fontWeight: '600', textAlign: 'left', color: '#dc2626' }}>- {formatCurrency(discount)}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Total - RED table-based box */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '6px', marginBottom: '4px' }}>
            <tbody>
              <tr>
                <td style={{
                  backgroundColor: '#dc2626',
                  padding: '8px 12px',
                  fontSize: fs.lg,
                  fontWeight: 'bold',
                  color: '#ffffff',
                  textAlign: 'right',
                  width: '60%',
                }}>إجمالي الفاتورة</td>
                <td style={{
                  backgroundColor: '#dc2626',
                  padding: '8px 12px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  textAlign: 'left',
                }}>{formatCurrency(total)}</td>
              </tr>
            </tbody>
          </table>

          {/* Paid */}
          {paid > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px' }}>
              <tbody>
                <tr>
                  <td style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    padding: '6px 12px',
                    fontSize: fs.base,
                    fontWeight: '600',
                    color: '#16a34a',
                    textAlign: 'right',
                    width: '60%',
                  }}>المدفوع (عربون)</td>
                  <td style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRight: 'none',
                    borderLeft: '1px solid #bbf7d0',
                    padding: '6px 12px',
                    fontSize: fs.md,
                    fontWeight: 'bold',
                    color: '#16a34a',
                    textAlign: 'left',
                  }}>{formatCurrency(paid)}</td>
                </tr>
              </tbody>
            </table>
          )}

          {/* Remaining */}
          {remaining > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    padding: '7px 12px',
                    fontSize: fs.md,
                    fontWeight: 'bold',
                    color: '#dc2626',
                    textAlign: 'right',
                    width: '60%',
                  }}>المتبقي للسداد</td>
                  <td style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRight: 'none',
                    borderLeft: '1px solid #fecaca',
                    padding: '7px 12px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: '#dc2626',
                    textAlign: 'left',
                  }}>{formatCurrency(remaining)}</td>
                </tr>
              </tbody>
            </table>
          ) : total > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    padding: '7px 12px',
                    fontSize: fs.md,
                    fontWeight: 'bold',
                    color: '#16a34a',
                    textAlign: 'center',
                  }} colSpan={2}>✅ تم السداد بالكامل</td>
                </tr>
              </tbody>
            </table>
          ) : null}
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