import React, { useRef, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Camera, Download, Share2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { calculateOrderFinancials } from '@/lib/orderFinancials';
import { useOrderStatuses } from '@/hooks/useOrderStatuses';
import { captureInvoiceScreenshot } from '@/lib/invoiceScreenshot';
import { useInvoicePolicy } from '@/components/admin/settings/InvoicePolicySettings';
import { formatDateEn, formatSerialEn, toEnDigits, NUMERIC_FONT } from '@/lib/invoiceFormat';
import { useIsMobile } from '@/hooks/use-mobile';

interface Props {
  order: any;
  storeSettings?: any;
}

// Inline brand SVG icons (no external network calls — html-to-image safe)
const FB = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M22 12a10 10 0 1 0-11.6 9.9V14.9H8v-2.9h2.4V9.8c0-2.4 1.4-3.7 3.6-3.7 1 0 2.1.2 2.1.2V8.6h-1.2c-1.2 0-1.6.7-1.6 1.5V12H16l-.4 2.9h-2.2V22A10 10 0 0 0 22 12z"/></svg>
);
const IG = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="5" stroke="#fff" strokeWidth="1.8"/><circle cx="12" cy="12" r="4" stroke="#fff" strokeWidth="1.8"/><circle cx="17.5" cy="6.5" r="1.2" fill="#fff"/></svg>
);
const TT = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M16 3v3.1c1 .8 2.4 1.3 4 1.4v3c-1.5 0-2.9-.4-4-1.1V16a5.5 5.5 0 1 1-5.5-5.5c.3 0 .5 0 .8.1V13a2.5 2.5 0 1 0 1.7 2.4V3H16z"/></svg>
);
const WA = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm5.3 14.3c-.2.6-1.3 1.2-1.8 1.2-.5 0-1 .2-3.4-.8a11 11 0 0 1-4.5-4c-.3-.5-1-1.6-1-3 0-1.3.7-2 1-2.3.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .6l-.4.6-.3.3c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.5 1.5.3.1.5 0 .7-.2l.8-1c.2-.2.4-.2.6-.1l1.9.9c.2.1.4.2.5.3.1.2.1.7-.1 1.3z"/></svg>
);

const BrandedInvoiceTemplate: React.FC<Props> = ({ order, storeSettings }) => {
  const { items, subtotal, shipping, discount, total, paid, remaining } = calculateOrderFinancials(order);
  const { getStatusLabel, statusConfigs } = useOrderStatuses();
  const ref = useRef<HTMLDivElement>(null);
  const policy = useInvoicePolicy();
  const isMobile = useIsMobile();
  const [qr, setQr] = useState<string>('');

  const storeName = storeSettings?.store_name || 'بتاع هدايا الأصلي';
  const tagline = storeSettings?.store_tagline || 'ملوك الهدايا في مصر';
  const city = storeSettings?.city || '';
  const country = storeSettings?.country || 'مصر';
  const website = storeSettings?.website_url || '';
  const phone = storeSettings?.contact_phone || '';
  const instagram = storeSettings?.instagram_url || '';
  const thankYou = storeSettings?.invoice_thank_you || 'شكراً لثقتك بنا';
  const businessHours = storeSettings?.business_hours || 'السبت إلى الخميس: 10 صباحاً - 10 مساءً';
  const policyText = storeSettings?.order_policy_text || '';

  // Generate QR for tracking — prefer secure tracking_token over serial
  useEffect(() => {
    const token = order.tracking_token || order.serial || '';
    const url = `${window.location.origin}/track/${encodeURIComponent(token)}`;
    QRCode.toDataURL(url, { width: 200, margin: 1, color: { dark: '#dc2626', light: '#ffffff' } })
      .then(setQr).catch(() => {});
  }, [order.tracking_token, order.serial]);

  const handleScreenshot = () => { if (ref.current) captureInvoiceScreenshot(ref.current, order.serial); };
  const handleWhatsApp = () => {
    const token = order.tracking_token || order.serial || '';
    const txt = `فاتورة #${order.serial}\n${window.location.origin}/track/${encodeURIComponent(token)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, '_blank');
  };
  const handlePrint = () => window.print();

  // Build status timeline from statusConfigs
  const currentIdx = statusConfigs.findIndex(c => c.status === order.status);
  const timeline = statusConfigs.filter(c => c.enabled).slice(0, 6);

  const num: React.CSSProperties = { fontFamily: NUMERIC_FONT, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.3px', direction: 'ltr', display: 'inline-block', unicodeBidi: 'isolate' };
  const red = '#dc2626';
  const redSoft = '#fef2f2';
  const redBorder = '#fecaca';
  const gray = '#6b7280';
  const dark = '#111827';
  const fs = { xs: '10px', sm: '11px', base: '12px', md: '13px', lg: '15px', xl: '18px', xxl: '22px' };

  const containerWidth = isMobile ? 360 : 760;

  return (
    <div>
      {/* Action bar (not captured) */}
      <div style={{ textAlign: 'center', marginBottom: '12px', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }} className="print:hidden">
        <Button onClick={handleScreenshot} variant="outline" size="sm" className="gap-2">
          <Camera className="w-4 h-4" /> حفظ صورة
        </Button>
        <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2">
          <Printer className="w-4 h-4" /> طباعة
        </Button>
        <Button onClick={handleWhatsApp} variant="outline" size="sm" className="gap-2">
          <Share2 className="w-4 h-4" /> مشاركة واتساب
        </Button>
      </div>

      <div
        ref={ref}
        data-invoice-ref="true"
        data-invoice-width={String(containerWidth)}
        style={{
          backgroundColor: '#ffffff',
          color: dark,
          fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
          direction: 'rtl',
          width: '100%',
          maxWidth: `${containerWidth}px`,
          margin: '0 auto',
          boxSizing: 'border-box',
          border: '1px solid #f1f5f9',
          borderRadius: '14px',
          overflow: 'hidden',
          background: 'radial-gradient(circle at top right, #fff5f5 0%, #ffffff 35%)',
        }}
      >
        {/* HEADER */}
        <div style={{ padding: isMobile ? '16px' : '22px 26px', borderBottom: `1px solid ${redBorder}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                {/* Right side (RTL first) = Invoice title block */}
                <td style={{ verticalAlign: 'top', width: '40%', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', marginBottom: '10px' }}>
                    <span style={{ fontSize: isMobile ? '22px' : '30px', fontWeight: 900, color: red, letterSpacing: '0.5px' }}>فاتورة</span>
                    <span style={{ width: '34px', height: '34px', borderRadius: '50%', background: redSoft, border: `1.5px solid ${redBorder}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: red, fontSize: '16px' }}>📄</span>
                  </div>
                  <div style={{ fontSize: fs.sm, color: gray, marginBottom: '2px' }}>رقم الفاتورة</div>
                  <div style={{ fontSize: isMobile ? fs.lg : fs.xl, fontWeight: 800, color: dark, marginBottom: '10px', ...num }}>{formatSerialEn(order.serial)}</div>
                  <div style={{ fontSize: fs.sm, color: gray, marginBottom: '2px' }}>📅 تاريخ الفاتورة</div>
                  <div style={{ fontSize: fs.md, fontWeight: 700, color: dark, ...num }}>{formatDateEn(order.date_created || order.order_date)}</div>
                </td>

                {/* Left side = logo + brand */}
                <td style={{ verticalAlign: 'top', width: '60%', textAlign: 'left' }}>
                  <table style={{ marginLeft: 0, marginRight: 'auto', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ paddingLeft: '12px', verticalAlign: 'middle' }}>
                          {storeSettings?.logo_url ? (
                            <img src={storeSettings.logo_url} alt={storeName} crossOrigin="anonymous"
                              style={{ width: isMobile ? '64px' : '84px', height: isMobile ? '64px' : '84px', objectFit: 'cover', borderRadius: '50%', border: `3px solid ${redBorder}`, padding: '3px', background: '#fff', boxShadow: '0 4px 14px rgba(220,38,38,0.15)' }} />
                          ) : (
                            <div style={{ width: '84px', height: '84px', borderRadius: '50%', background: redSoft, border: `3px solid ${redBorder}` }} />
                          )}
                        </td>
                        <td style={{ verticalAlign: 'middle', textAlign: 'right' }}>
                          <div style={{ fontSize: isMobile ? fs.xl : fs.xxl, fontWeight: 900, color: dark, lineHeight: 1.2 }}>{storeName}</div>
                          {tagline && <div style={{ fontSize: fs.sm, color: gray, marginTop: '4px' }}>{tagline}</div>}
                          {/* Social icons */}
                          <div style={{ display: 'flex', gap: '6px', marginTop: '8px', justifyContent: 'flex-end' }}>
                            {storeSettings?.facebook_url && <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#1877f2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><FB /></span>}
                            {instagram && <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg,#fd5,#f08,#90f)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><IG /></span>}
                            {storeSettings?.tiktok_url && <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><TT /></span>}
                            {(storeSettings?.whatsapp_number || storeSettings?.whatsapp_chat_url) && <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#25d366', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><WA /></span>}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* QR + actions strip */}
        <div style={{ padding: isMobile ? '12px 16px' : '14px 26px', borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ width: isMobile ? '90px' : '110px', verticalAlign: 'middle' }}>
                  {qr && (
                    <div style={{ display: 'inline-block', padding: '5px', background: '#fff', border: `1.5px solid ${redBorder}`, borderRadius: '8px' }}>
                      <img src={qr} alt="QR" style={{ width: isMobile ? '70px' : '85px', height: isMobile ? '70px' : '85px', display: 'block' }} />
                    </div>
                  )}
                </td>
                <td style={{ verticalAlign: 'middle', paddingRight: '12px' }}>
                  <div style={{ fontSize: fs.md, fontWeight: 800, color: dark, marginBottom: '3px' }}>تتبع طلبك</div>
                  <div style={{ fontSize: fs.sm, color: gray, lineHeight: 1.6 }}>امسح الكود لمتابعة حالة طلبك أول بأول</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* CUSTOMER + DELIVERY */}
        <div style={{ padding: isMobile ? '12px 14px' : '16px 22px' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '10px 0' }}>
            <tbody>
              <tr>
                {/* Delivery */}
                <td style={{ verticalAlign: 'top', width: '50%' }}>
                  <div style={{ border: '1px solid #f1f5f9', borderRadius: '10px', padding: '12px', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: fs.md, fontWeight: 800, color: dark }}>عنوان التوصيل</span>
                      <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: redSoft, color: red, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>📍</span>
                    </div>
                    <Row label="المحافظة" value={order.governorate} />
                    <Row label="المدينة" value={order.city} />
                    <Row label="العنوان" value={order.address || order.shipping_address} />
                    <Row label="حالة الطلب" value={<span style={{ background: '#dcfce7', color: '#16a34a', padding: '2px 10px', borderRadius: '12px', fontSize: fs.xs, fontWeight: 700 }}>{getStatusLabel(order.status)}</span>} />
                  </div>
                </td>
                {/* Customer */}
                <td style={{ verticalAlign: 'top', width: '50%' }}>
                  <div style={{ border: `1px solid ${redBorder}`, borderRadius: '10px', padding: '12px', background: redSoft }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: fs.md, fontWeight: 800, color: red }}>بيانات العميل</span>
                      <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#fff', color: red, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>👤</span>
                    </div>
                    <Row label="الاسم" value={order.client_name || order.customer_name} />
                    <Row label="التليفون" value={<span style={{ color: red, fontWeight: 800, ...num }}>{toEnDigits(order.phone || order.customer_phone)}</span>} />
                    {(order.phone2 || order.customer_phone2) && (
                      <Row label="تليفون آخر" value={<span style={{ ...num }}>{toEnDigits(order.phone2 || order.customer_phone2)}</span>} />
                    )}
                    <Row label="السداد" value={order.payment_method} />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ITEMS */}
        <div style={{ padding: isMobile ? '0 14px 12px' : '0 22px 16px' }}>
          <div style={{ border: '1px solid #f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', background: '#fff' }}>
              <span style={{ fontSize: fs.md, fontWeight: 800, color: dark }}>تفاصيل الطلب</span>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: redSoft, color: red, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>🛒</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ background: `linear-gradient(135deg, ${red}, #b91c1c)`, color: '#fff' }}>
                  <th style={{ padding: '9px 4px', fontSize: fs.sm, fontWeight: 800, width: '8%' }}>م</th>
                  <th style={{ padding: '9px 4px', fontSize: fs.sm, fontWeight: 800, width: '32%' }}>المنتج</th>
                  <th style={{ padding: '9px 4px', fontSize: fs.sm, fontWeight: 800, width: '18%' }}>المقاس / الوصف</th>
                  <th style={{ padding: '9px 4px', fontSize: fs.sm, fontWeight: 800, width: '10%' }}>الكمية</th>
                  <th style={{ padding: '9px 4px', fontSize: fs.sm, fontWeight: 800, width: '16%' }}>سعر الوحدة</th>
                  <th style={{ padding: '9px 4px', fontSize: fs.sm, fontWeight: 800, width: '16%' }}>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? items.map((it: any, i: number) => {
                  const price = it.price || it.unit_price || 0;
                  const qty = it.quantity || 1;
                  const itemTotal = price * qty - (it.item_discount || 0);
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 700, fontSize: fs.base, verticalAlign: 'middle', ...num }}>{toEnDigits(i + 1)}</td>
                      <td style={{ padding: '8px 4px', textAlign: 'center', fontSize: fs.base, fontWeight: 700, verticalAlign: 'middle', color: dark, wordBreak: 'break-word' }}>{it.product_type || it.product_name}</td>
                      <td style={{ padding: '8px 4px', textAlign: 'center', verticalAlign: 'middle' }}>
                        <span style={{ background: redSoft, color: '#b91c1c', padding: '3px 8px', borderRadius: '6px', fontSize: fs.xs, fontWeight: 700, border: `1px solid ${redBorder}`, display: 'inline-block', ...num }}>{toEnDigits(it.size || it.product_size || '')}</span>
                      </td>
                      <td style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 700, fontSize: fs.base, verticalAlign: 'middle', ...num }}>{toEnDigits(qty)}</td>
                      <td style={{ padding: '8px 4px', textAlign: 'center', fontSize: fs.base, verticalAlign: 'middle', ...num }}>{formatCurrency(price)}</td>
                      <td style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 800, fontSize: fs.base, verticalAlign: 'middle', color: red, ...num }}>{formatCurrency(itemTotal)}</td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={6} style={{ padding: '14px', textAlign: 'center', color: gray, fontSize: fs.base }}>لا توجد أصناف</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SUMMARY + STATUS TIMELINE */}
        <div style={{ padding: isMobile ? '0 14px 14px' : '0 22px 18px' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '10px 0' }}>
            <tbody>
              <tr>
                {/* Status timeline */}
                <td style={{ verticalAlign: 'top', width: '50%' }}>
                  <div style={{ border: '1px solid #f1f5f9', borderRadius: '10px', padding: '12px', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: fs.md, fontWeight: 800, color: dark }}>حالة الطلب</span>
                      <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: redSoft, color: red, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>⚙️</span>
                    </div>
                    {timeline.map((s, idx) => {
                      const active = currentIdx >= 0 && idx <= currentIdx;
                      const isCurrent = idx === currentIdx;
                      return (
                        <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: fs.sm, fontWeight: isCurrent ? 800 : 500, color: isCurrent ? red : (active ? dark : gray) }}>{s.label}</span>
                          <span style={{
                            width: '18px', height: '18px', borderRadius: '50%',
                            background: isCurrent ? red : (active ? '#16a34a' : '#fff'),
                            border: `2px solid ${isCurrent ? red : (active ? '#16a34a' : '#d1d5db')}`,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: '10px', fontWeight: 900,
                          }}>{active && !isCurrent ? '✓' : ''}</span>
                        </div>
                      );
                    })}
                  </div>
                </td>
                {/* Summary */}
                <td style={{ verticalAlign: 'top', width: '50%' }}>
                  <div style={{ border: '1px solid #f1f5f9', borderRadius: '10px', padding: '12px', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: fs.md, fontWeight: 800, color: dark }}>ملخص الفاتورة</span>
                      <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: redSoft, color: red, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>🧮</span>
                    </div>
                    <SumRow label="إجمالي المنتجات" value={formatCurrency(subtotal)} />
                    {shipping > 0 && <SumRow label="مصاريف الشحن" value={formatCurrency(shipping)} />}
                    {discount > 0 && <SumRow label="الخصم" value={`- ${formatCurrency(discount)}`} color={red} />}
                    <div style={{ height: '1px', background: '#e5e7eb', margin: '8px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: redSoft, border: `1px solid ${redBorder}`, padding: '8px 10px', borderRadius: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: fs.md, fontWeight: 800, color: red }}>الإجمالي الكلي</span>
                      <span style={{ fontSize: fs.lg, fontWeight: 900, color: red, ...num }}>{formatCurrency(total)}</span>
                    </div>
                    {paid > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '7px 10px', borderRadius: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: fs.sm, fontWeight: 700, color: '#16a34a' }}>المدفوع</span>
                        <span style={{ fontSize: fs.md, fontWeight: 800, color: '#16a34a', ...num }}>{formatCurrency(paid)}</span>
                      </div>
                    )}
                    {remaining > 0 ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: redSoft, border: `1px solid ${redBorder}`, padding: '8px 10px', borderRadius: '8px' }}>
                        <span style={{ fontSize: fs.md, fontWeight: 800, color: red }}>المتبقي للسداد</span>
                        <span style={{ fontSize: fs.lg, fontWeight: 900, color: red, ...num }}>{formatCurrency(remaining)}</span>
                      </div>
                    ) : total > 0 ? (
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 10px', borderRadius: '8px', textAlign: 'center', color: '#16a34a', fontWeight: 800, fontSize: fs.md }}>✅ تم السداد بالكامل</div>
                    ) : null}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Notes */}
        {order.notes && (
          <div style={{ padding: isMobile ? '0 14px 12px' : '0 22px 14px' }}>
            <div style={{ background: redSoft, border: `1px solid ${redBorder}`, borderRadius: '8px', padding: '10px' }}>
              <div style={{ fontSize: fs.md, fontWeight: 800, color: red, marginBottom: '4px' }}>📝 ملاحظات</div>
              <div style={{ fontSize: fs.base, color: '#374151', lineHeight: 1.7 }}>{order.notes}</div>
            </div>
          </div>
        )}

        {/* Policy */}
        {policy.enabled && policy.content && (
          <div style={{ padding: isMobile ? '0 14px 12px' : '0 22px 14px' }}>
            <div style={{ background: redSoft, border: `1px solid ${redBorder}`, borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', justifyContent: 'center', color: red, fontWeight: 800, fontSize: fs.md }}>
                <span>🛡️</span><span>{policy.title}</span>
              </div>
              <div style={{ fontSize: fs.sm, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{policy.content}</div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{ padding: isMobile ? '14px 16px' : '16px 26px', background: '#fafafa', borderTop: '1px solid #f1f5f9' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ verticalAlign: 'top', width: '50%' }}>
                  {phone && <FooterLine icon="📞" text={<span style={num}>{toEnDigits(phone)}</span>} />}
                  {instagram && <FooterLine icon="📷" text={instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, '')} />}
                  {businessHours && <FooterLine icon="🕒" text={businessHours} />}
                </td>
                <td style={{ verticalAlign: 'top', width: '50%' }}>
                  {(city || country) && <FooterLine icon="📍" text={[country, city].filter(Boolean).join(' - ')} />}
                  {website && <FooterLine icon="🌐" text={<span style={num}>{website.replace(/^https?:\/\//, '')}</span>} />}
                </td>
              </tr>
            </tbody>
          </table>
          {policyText && (
            <div style={{ marginTop: '12px', padding: '10px 12px', background: '#fff', border: '1px dashed #fecaca', borderRadius: '8px', fontSize: fs.sm, color: '#374151', lineHeight: 1.7, textAlign: 'center' }}>
              {policyText}
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: '12px', fontSize: fs.md, fontWeight: 800, color: red }}>
            {thankYou} <span style={{ color: red }}>♥</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', gap: '8px' }}>
    <span style={{ fontSize: '12px', color: '#111827', fontWeight: 600, textAlign: 'left', wordBreak: 'break-word', flex: 1 }}>{value || '—'}</span>
    <span style={{ fontSize: '11px', color: '#9ca3af' }}>: {label}</span>
  </div>
);

const SumRow: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
    <span style={{ fontSize: '12px', color: color || '#6b7280' }}>{label}</span>
    <span style={{ fontSize: '12px', fontWeight: 800, color: color || '#374151', fontFamily: NUMERIC_FONT, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
  </div>
);

const FooterLine: React.FC<{ icon: string; text: React.ReactNode }> = ({ icon, text }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', marginBottom: '6px', fontSize: '12px', color: '#374151' }}>
    <span style={{ fontWeight: 600 }}>{text}</span>
    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#fff', border: '1px solid #fecaca', color: '#dc2626', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>{icon}</span>
  </div>
);

export default BrandedInvoiceTemplate;
