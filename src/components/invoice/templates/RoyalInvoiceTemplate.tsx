import React, { useRef } from 'react';
import { formatCurrency } from '@/lib/utils';
import { calculateOrderFinancials } from '@/lib/orderFinancials';
import { useOrderStatuses } from '@/hooks/useOrderStatuses';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { captureInvoiceScreenshot } from '@/lib/invoiceScreenshot';
import { useInvoicePolicy } from '@/components/admin/settings/InvoicePolicySettings';
import { formatDateEn, formatSerialEn, toEnDigits, NUMERIC_FONT } from '@/lib/invoiceFormat';

interface Props {
  order: any;
  storeSettings?: any;
}

/**
 * Royal — A luxury black + gold invoice. Strong typographic hierarchy,
 * centered content, mono numerics, distinctive but print-friendly.
 */
const RoyalInvoiceTemplate: React.FC<Props> = ({ order, storeSettings }) => {
  const { items, subtotal, shipping, discount, total, paid, remaining } = calculateOrderFinancials(order);
  const { getStatusLabel } = useOrderStatuses();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const invoicePolicy = useInvoicePolicy();

  const handleScreenshot = () => {
    if (invoiceRef.current) captureInvoiceScreenshot(invoiceRef.current, order.serial, '#0b0b0f');
  };

  const fs = { xs: '10px', sm: '11px', base: '12px', md: '13px', lg: '15px', xl: '18px', display: '22px' };
  const num: React.CSSProperties = { fontFamily: NUMERIC_FONT, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.4px' };

  const GOLD = '#d4af37';
  const GOLD_SOFT = '#f5e6a8';
  const INK = '#0b0b0f';
  const INK_2 = '#15151c';
  const LINE = 'rgba(212, 175, 55, 0.25)';

  const storeName = storeSettings?.store_name || '#بتاع_هدايا_الأصلي';
  const storeTagline = storeSettings?.store_tagline || 'ملوك الهدايا في مصر';

  const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div style={{ textAlign: 'center', margin: '14px 0 10px', position: 'relative' }}>
      <span style={{
        display: 'inline-block',
        padding: '4px 14px',
        fontSize: fs.xs,
        fontWeight: 700,
        letterSpacing: '2px',
        color: GOLD,
        background: INK_2,
        border: `1px solid ${LINE}`,
        borderRadius: '999px',
        textTransform: 'uppercase',
      }}>{children}</span>
    </div>
  );

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
        data-invoice-ref="true"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${INK_2} 0%, ${INK} 60%)`,
          color: '#f5f5f7',
          fontFamily: "'Tajawal', 'Cairo', Arial, sans-serif",
          direction: 'rtl',
          width: '100%',
          maxWidth: '420px',
          margin: '0 auto',
          boxSizing: 'border-box',
          border: `1px solid ${LINE}`,
          borderRadius: '14px',
          overflow: 'hidden',
        }}
      >
        {/* Top gold rule */}
        <div style={{ height: '4px', background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />

        {/* Header */}
        <div style={{ padding: '20px 16px 12px', textAlign: 'center', borderBottom: `1px solid ${LINE}` }}>
          {storeSettings?.logo_url ? (
            <img
              src={storeSettings.logo_url}
              alt={storeName}
              crossOrigin="anonymous"
              style={{ width: '88px', height: '88px', objectFit: 'contain', borderRadius: '50%', border: `2px solid ${GOLD}`, padding: '4px', backgroundColor: INK_2, boxShadow: `0 0 0 4px ${INK}, 0 6px 18px rgba(212,175,55,0.25)` }}
            />
          ) : (
            <img
              src="/lovable-uploads/ac63ecb6-e1d0-4917-9537-12f75da70364.png"
              alt={storeName}
              style={{ width: '88px', height: '88px', objectFit: 'contain', borderRadius: '50%', border: `2px solid ${GOLD}`, padding: '4px', backgroundColor: INK_2, boxShadow: `0 0 0 4px ${INK}, 0 6px 18px rgba(212,175,55,0.25)` }}
            />
          )}
          <div style={{ fontSize: fs.lg, fontWeight: 800, color: GOLD_SOFT, marginTop: '10px', letterSpacing: '0.5px' }}>{storeName}</div>
          <div style={{ fontSize: fs.xs, color: '#9b9ba3', marginTop: '2px', letterSpacing: '1px' }}>{storeTagline}</div>

          {/* INVOICE Title */}
          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: fs.xs, letterSpacing: '4px', color: GOLD, fontWeight: 700 }}>INVOICE</div>
            <div style={{ fontSize: fs.display, fontWeight: 800, color: '#fff', letterSpacing: '1.5px', marginTop: '2px', ...num }}>
              {formatSerialEn(order.serial)}
            </div>
            <div style={{ fontSize: fs.xs, color: '#9b9ba3', marginTop: '4px', ...num }}>
              {formatDateEn(order.date_created || order.order_date)}
            </div>
          </div>
        </div>

        {/* Customer */}
        <SectionLabel>Customer · العميل</SectionLabel>
        <div style={{ padding: '0 16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '4px 0', textAlign: 'center', fontSize: fs.base }}>
                  <div style={{ color: '#9b9ba3', fontSize: fs.xs, marginBottom: '2px' }}>الاسم</div>
                  <div style={{ color: '#fff', fontWeight: 700 }}>{order.client_name || order.customer_name}</div>
                </td>
                <td style={{ padding: '4px 0', textAlign: 'center', fontSize: fs.base }}>
                  <div style={{ color: '#9b9ba3', fontSize: fs.xs, marginBottom: '2px' }}>التليفون</div>
                  <div style={{ color: '#fff', fontWeight: 700, ...num }}>
                    {toEnDigits(order.phone || order.customer_phone)}
                    {(order.phone2 || order.customer_phone2) && ` / ${toEnDigits(order.phone2 || order.customer_phone2)}`}
                  </div>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '6px 0', textAlign: 'center', fontSize: fs.base }}>
                  <div style={{ color: '#9b9ba3', fontSize: fs.xs, marginBottom: '2px' }}>السداد</div>
                  <div style={{ color: '#fff', fontWeight: 700 }}>{order.payment_method}</div>
                </td>
                <td style={{ padding: '6px 0', textAlign: 'center', fontSize: fs.base }}>
                  <div style={{ color: '#9b9ba3', fontSize: fs.xs, marginBottom: '2px' }}>التوصيل</div>
                  <div style={{ color: '#fff', fontWeight: 700 }}>{order.delivery_method}</div>
                </td>
              </tr>
            </tbody>
          </table>

          {(order.address || order.shipping_address || order.governorate) && (
            <div style={{ marginTop: '10px', padding: '8px 10px', border: `1px solid ${LINE}`, borderRadius: '8px', background: 'rgba(212,175,55,0.04)', textAlign: 'center' }}>
              {order.governorate && (
                <div style={{ fontSize: fs.xs, color: GOLD, fontWeight: 700, letterSpacing: '1px', marginBottom: '2px' }}>{order.governorate}</div>
              )}
              {(order.address || order.shipping_address) && (
                <div style={{ fontSize: fs.sm, color: '#e7e7ea', lineHeight: 1.6 }}>{order.address || order.shipping_address}</div>
              )}
              <div style={{ marginTop: '6px' }}>
                <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '999px', background: GOLD, color: INK, fontSize: fs.xs, fontWeight: 800, letterSpacing: '0.5px' }}>
                  {getStatusLabel(order.status)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Items */}
        <SectionLabel>Order Details · تفاصيل الطلب</SectionLabel>
        <div style={{ padding: '0 16px' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', tableLayout: 'fixed', border: `1px solid ${LINE}`, borderRadius: '8px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: `linear-gradient(135deg, ${GOLD} 0%, #b8941f 100%)`, color: INK }}>
                <th style={{ padding: '8px 4px', textAlign: 'center', fontSize: fs.xs, fontWeight: 800, letterSpacing: '0.5px', width: '34%' }}>المنتج</th>
                <th style={{ padding: '8px 4px', textAlign: 'center', fontSize: fs.xs, fontWeight: 800, letterSpacing: '0.5px', width: '16%' }}>المقاس</th>
                <th style={{ padding: '8px 4px', textAlign: 'center', fontSize: fs.xs, fontWeight: 800, letterSpacing: '0.5px', width: '10%' }}>العدد</th>
                <th style={{ padding: '8px 4px', textAlign: 'center', fontSize: fs.xs, fontWeight: 800, letterSpacing: '0.5px', width: '20%' }}>السعر</th>
                <th style={{ padding: '8px 4px', textAlign: 'center', fontSize: fs.xs, fontWeight: 800, letterSpacing: '0.5px', width: '20%' }}>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? items.map((item: any, i: number) => {
                const price = item.price || item.unit_price || 0;
                const qty = item.quantity || 1;
                const itemDiscount = item.item_discount || 0;
                const itemTotal = price * qty - itemDiscount;
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', borderTop: `1px solid ${LINE}` }}>
                    <td style={{ padding: '8px 4px', textAlign: 'center', verticalAlign: 'middle', fontSize: fs.sm, color: '#fff', fontWeight: 700, lineHeight: 1.4, wordBreak: 'break-word' }}>
                      {item.product_type || item.product_name}
                    </td>
                    <td style={{ padding: '8px 4px', textAlign: 'center', verticalAlign: 'middle', fontSize: fs.xs }}>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '6px', border: `1px solid ${LINE}`, color: GOLD_SOFT, ...num }}>
                        {toEnDigits(item.size || item.product_size)}
                      </span>
                    </td>
                    <td style={{ padding: '8px 4px', textAlign: 'center', verticalAlign: 'middle', fontSize: fs.sm, color: '#fff', fontWeight: 700, ...num }}>{toEnDigits(qty)}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'center', verticalAlign: 'middle', fontSize: fs.sm, color: '#e7e7ea', ...num }}>{formatCurrency(price)}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'center', verticalAlign: 'middle', fontSize: fs.sm, color: GOLD_SOFT, fontWeight: 800, ...num }}>{formatCurrency(itemTotal)}</td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={5} style={{ padding: '14px', textAlign: 'center', color: '#9b9ba3', fontSize: fs.sm }}>لا توجد أصناف</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <SectionLabel>Summary · ملخص الفاتورة</SectionLabel>
        <div style={{ padding: '0 16px 14px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '5px 8px', fontSize: fs.sm, color: '#9b9ba3', textAlign: 'right' }}>إجمالي المنتجات</td>
                <td style={{ padding: '5px 8px', fontSize: fs.sm, color: '#fff', fontWeight: 700, textAlign: 'left', ...num }}>{formatCurrency(subtotal)}</td>
              </tr>
              {shipping > 0 && (
                <tr>
                  <td style={{ padding: '5px 8px', fontSize: fs.sm, color: '#9b9ba3', textAlign: 'right' }}>مصاريف الشحن</td>
                  <td style={{ padding: '5px 8px', fontSize: fs.sm, color: '#fff', fontWeight: 700, textAlign: 'left', ...num }}>{formatCurrency(shipping)}</td>
                </tr>
              )}
              {discount > 0 && (
                <tr>
                  <td style={{ padding: '5px 8px', fontSize: fs.sm, color: '#fca5a5', textAlign: 'right' }}>الخصم</td>
                  <td style={{ padding: '5px 8px', fontSize: fs.sm, color: '#fca5a5', fontWeight: 700, textAlign: 'left', ...num }}>- {formatCurrency(discount)}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Grand Total */}
          <div style={{ marginTop: '10px', padding: '12px 14px', borderRadius: '10px', background: `linear-gradient(135deg, ${GOLD} 0%, #b8941f 100%)`, color: INK, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 6px 18px rgba(212,175,55,0.25)' }}>
            <span style={{ fontSize: fs.md, fontWeight: 800, letterSpacing: '0.5px' }}>إجمالي الفاتورة</span>
            <span style={{ fontSize: fs.xl, fontWeight: 900, ...num }}>{formatCurrency(total)}</span>
          </div>

          {paid > 0 && (
            <div style={{ marginTop: '6px', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.4)', background: 'rgba(34,197,94,0.08)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: fs.sm, color: '#86efac', fontWeight: 700 }}>المدفوع (عربون)</span>
              <span style={{ fontSize: fs.md, color: '#86efac', fontWeight: 800, ...num }}>{formatCurrency(paid)}</span>
            </div>
          )}

          {remaining > 0 ? (
            <div style={{ marginTop: '6px', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.5)', background: 'rgba(248,113,113,0.1)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: fs.md, color: '#fca5a5', fontWeight: 800 }}>المتبقي للسداد</span>
              <span style={{ fontSize: fs.lg, color: '#fecaca', fontWeight: 900, ...num }}>{formatCurrency(remaining)}</span>
            </div>
          ) : total > 0 ? (
            <div style={{ marginTop: '6px', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.4)', background: 'rgba(34,197,94,0.08)', textAlign: 'center', color: '#86efac', fontWeight: 800, fontSize: fs.sm }}>
              ✓ تم السداد بالكامل
            </div>
          ) : null}
        </div>

        {order.notes && (
          <div style={{ padding: '0 16px 12px' }}>
            <div style={{ border: `1px solid ${LINE}`, borderRadius: '8px', padding: '8px 10px', background: 'rgba(212,175,55,0.04)' }}>
              <div style={{ fontSize: fs.xs, color: GOLD, fontWeight: 700, marginBottom: '4px', letterSpacing: '1px' }}>NOTES · ملاحظات</div>
              <div style={{ fontSize: fs.sm, color: '#e7e7ea', lineHeight: 1.6 }}>{order.notes}</div>
            </div>
          </div>
        )}

        {invoicePolicy.enabled && invoicePolicy.content && (
          <div style={{ padding: '0 16px 12px' }}>
            <div style={{ border: `1px solid ${LINE}`, borderRadius: '8px', padding: '8px 10px', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontSize: fs.xs, color: GOLD, fontWeight: 700, textAlign: 'center', marginBottom: '4px', letterSpacing: '1px' }}>{invoicePolicy.title}</div>
              <div style={{ fontSize: fs.xs, color: '#b9b9c1', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{invoicePolicy.content}</div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ height: '1px', background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />
        <div style={{ padding: '12px 16px', textAlign: 'center', background: INK_2 }}>
          <div style={{ fontSize: fs.sm, fontWeight: 700, color: GOLD_SOFT, letterSpacing: '0.5px' }}>شكراً لثقتكم في {storeName}</div>
          {storeSettings?.contact_phone && (
            <div style={{ fontSize: fs.xs, color: '#9b9ba3', marginTop: '4px' }}>
              📞 <span style={num}>{toEnDigits(storeSettings.contact_phone)}</span>
            </div>
          )}
        </div>
        <div style={{ height: '4px', background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />
      </div>
    </div>
  );
};

export default RoyalInvoiceTemplate;
