import React, { useRef, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Camera, Share2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { calculateOrderFinancials } from '@/lib/orderFinancials';
import { useOrderStatuses } from '@/hooks/useOrderStatuses';
import { captureInvoiceScreenshot } from '@/lib/invoiceScreenshot';
import { useInvoicePolicy } from '@/components/admin/settings/InvoicePolicySettings';
import { formatDateEn, formatSerialEn, toEnDigits, NUMERIC_FONT } from '@/lib/invoiceFormat';
import { useIsMobile } from '@/hooks/use-mobile';

interface Props {
  order: InvoiceOrder;
  storeSettings?: StoreSettings;
}

type InvoiceItem = {
  price?: number | string | null;
  unit_price?: number | string | null;
  quantity?: number | string | null;
  item_discount?: number | string | null;
  product_name?: string | null;
  name?: string | null;
  product_type?: string | null;
  size?: string | number | null;
  product_size?: string | number | null;
  description?: string | null;
};

type InvoiceOrder = {
  serial?: string | number | null;
  tracking_token?: string | null;
  date_created?: string | null;
  order_date?: string | null;
  status?: string | null;
  governorate?: string | null;
  city?: string | null;
  address?: string | null;
  shipping_address?: string | null;
  client_name?: string | null;
  customer_name?: string | null;
  phone?: string | number | null;
  customer_phone?: string | number | null;
  phone2?: string | number | null;
  customer_phone2?: string | number | null;
  payment_method?: string | null;
  notes?: string | null;
  items?: InvoiceItem[];
  order_items?: InvoiceItem[];
  admin_order_items?: InvoiceItem[];
  [key: string]: unknown;
};

type StoreSettings = {
  store_name?: string | null;
  store_tagline?: string | null;
  city?: string | null;
  country?: string | null;
  website_url?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  invoice_thank_you?: string | null;
  business_hours?: string | null;
  order_policy_text?: string | null;
  logo_url?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  twitter_url?: string | null;
  youtube_url?: string | null;
  linkedin_url?: string | null;
  tiktok_url?: string | null;
  snapchat_url?: string | null;
  telegram_url?: string | null;
  whatsapp_chat_url?: string | null;
  whatsapp_catalog_url?: string | null;
  whatsapp_number?: string | null;
};

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
const XIcon = () => <span style={{ color: '#fff', fontWeight: 900, fontSize: '12px', lineHeight: 1 }}>X</span>;
const YT = () => <span style={{ color: '#fff', fontWeight: 900, fontSize: '10px', lineHeight: 1 }}>▶</span>;
const LI = () => <span style={{ color: '#fff', fontWeight: 900, fontSize: '11px', lineHeight: 1 }}>in</span>;
const SC = () => <span style={{ color: '#111827', fontWeight: 900, fontSize: '10px', lineHeight: 1 }}>SC</span>;
const TG = () => <span style={{ color: '#fff', fontWeight: 900, fontSize: '11px', lineHeight: 1 }}>✈</span>;

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
  const email = storeSettings?.contact_email || '';
  const thankYou = storeSettings?.invoice_thank_you || 'شكراً لثقتك بنا';
  const businessHours = storeSettings?.business_hours || 'السبت إلى الخميس: 10 صباحاً - 10 مساءً';
  const policyText = storeSettings?.order_policy_text || '';
  const orderStatus = String(order.status || '');
  const orderSerial = formatSerialEn(order.serial);
  const invoiceItems = items as InvoiceItem[];

  useEffect(() => {
    const token = String(order.tracking_token || order.serial || '');
    const url = `${window.location.origin}/track/${encodeURIComponent(token)}`;
    QRCode.toDataURL(url, { width: 220, margin: 1, color: { dark: '#dc2626', light: '#ffffff' } })
      .then(setQr).catch(() => {});
  }, [order.tracking_token, order.serial]);

  const handleScreenshot = () => { if (ref.current) captureInvoiceScreenshot(ref.current, orderSerial); };
  const handleWhatsApp = () => {
    const token = String(order.tracking_token || order.serial || '');
    const txt = `فاتورة #${orderSerial}\n${window.location.origin}/track/${encodeURIComponent(token)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, '_blank');
  };
  const handlePrint = () => window.print();

  const currentIdx = statusConfigs.findIndex(c => c.status === orderStatus);
  const timeline = statusConfigs.filter(c => c.enabled).slice(0, 6);
  const currentStatusLabel = getStatusLabel(orderStatus);

  const num: React.CSSProperties = {
    fontFamily: NUMERIC_FONT,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '0px',
    direction: 'ltr',
    display: 'inline-block',
    unicodeBidi: 'isolate',
  };
  const money = (value: number) => toEnDigits(formatCurrency(value));
  const red = '#dc2626';
  const redDark = '#b91c1c';
  const redSoft = '#fff1f2';
  const redBorder = '#fecaca';
  const gray = '#6b7280';
  const softGray = '#f8fafc';
  const line = '#e5e7eb';
  const dark = '#111827';
  const fs = { xs: isMobile ? '9px' : '10px', sm: isMobile ? '10px' : '11px', base: isMobile ? '11px' : '12px', md: isMobile ? '12px' : '13px', lg: isMobile ? '15px' : '16px', xl: isMobile ? '20px' : '25px', xxl: isMobile ? '24px' : '31px' };
  const containerWidth = isMobile ? 360 : 780;

  const socialLinks = [
    { key: 'facebook', label: 'Facebook', value: socialHandle(storeSettings?.facebook_url, 'Facebook'), color: '#1877f2', icon: <FB /> },
    { key: 'instagram', label: 'Instagram', value: socialHandle(storeSettings?.instagram_url, 'Instagram'), color: 'linear-gradient(135deg,#f59e0b,#e11d48,#7c3aed)', icon: <IG /> },
    { key: 'twitter', label: 'X', value: socialHandle(storeSettings?.twitter_url, 'X'), color: '#111827', icon: <XIcon /> },
    { key: 'youtube', label: 'YouTube', value: socialHandle(storeSettings?.youtube_url, 'YouTube'), color: '#dc2626', icon: <YT /> },
    { key: 'linkedin', label: 'LinkedIn', value: socialHandle(storeSettings?.linkedin_url, 'LinkedIn'), color: '#0a66c2', icon: <LI /> },
    { key: 'tiktok', label: 'TikTok', value: socialHandle(storeSettings?.tiktok_url, 'TikTok'), color: '#020617', icon: <TT /> },
    { key: 'snapchat', label: 'Snapchat', value: socialHandle(storeSettings?.snapchat_url, 'Snapchat'), color: '#facc15', icon: <SC /> },
    { key: 'telegram', label: 'Telegram', value: socialHandle(storeSettings?.telegram_url, 'Telegram'), color: '#229ed9', icon: <TG /> },
    { key: 'whatsapp', label: 'WhatsApp', value: socialHandle(storeSettings?.whatsapp_chat_url || storeSettings?.whatsapp_number, 'WhatsApp'), color: '#16a34a', icon: <WA /> },
    { key: 'catalog', label: 'Catalog', value: socialHandle(storeSettings?.whatsapp_catalog_url, 'Catalog'), color: '#15803d', icon: <WA /> },
  ].filter(link => Boolean(link.value));

  return (
    <div>
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
          borderRadius: isMobile ? '12px' : '16px',
          overflow: 'hidden',
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.08)',
          background: '#ffffff',
        }}
      >
        {/* HEADER */}
        <div style={{ padding: isMobile ? '14px' : '18px 24px', borderBottom: `1px solid ${line}`, background: 'linear-gradient(180deg, #ffffff 0%, #fffafa 100%)' }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '14px' : '22px', alignItems: 'stretch', direction: 'ltr' }}>
            <div style={{ flex: 1, direction: 'rtl', display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-start', gap: isMobile ? '10px' : '14px', textAlign: 'right' }}>
              {storeSettings?.logo_url ? (
                <img
                  src={storeSettings.logo_url}
                  alt={storeName}
                  crossOrigin="anonymous"
                  style={{
                    width: isMobile ? '62px' : '82px',
                    height: isMobile ? '62px' : '82px',
                    objectFit: 'cover',
                    borderRadius: '14px',
                    border: `2px solid ${redBorder}`,
                    padding: '3px',
                    background: '#fff',
                    boxShadow: '0 8px 22px rgba(220,38,38,0.16)',
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div style={{ width: isMobile ? '62px' : '82px', height: isMobile ? '62px' : '82px', borderRadius: '14px', background: redSoft, border: `2px solid ${redBorder}`, flexShrink: 0 }} />
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: fs.xl, fontWeight: 900, color: dark, lineHeight: 1.15 }}>{storeName}</div>
                {tagline && <div style={{ fontSize: fs.md, color: red, marginTop: '5px', fontWeight: 800 }}>{tagline}</div>}
                {(city || country) && <div style={{ fontSize: fs.sm, color: gray, marginTop: '4px' }}>{[city, country].filter(Boolean).join('، ')}</div>}
                {socialLinks.length > 0 && (
                  <div style={{ display: 'flex', gap: '5px', marginTop: '9px', justifyContent: isMobile ? 'center' : 'flex-start', flexWrap: 'wrap' }}>
                    {socialLinks.slice(0, 6).map(link => (
                      <span key={link.key} style={{ width: '22px', height: '22px', borderRadius: '50%', background: link.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{link.icon}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ direction: 'rtl', width: isMobile ? '100%' : '238px', borderRight: isMobile ? 'none' : `1px solid ${line}`, paddingRight: isMobile ? 0 : '20px', textAlign: isMobile ? 'center' : 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: isMobile ? 'center' : 'flex-start' }}>
                <span style={{ fontSize: fs.xxl, fontWeight: 900, color: red, lineHeight: 1 }}>فاتورة</span>
                <span style={{ width: isMobile ? '30px' : '36px', height: isMobile ? '30px' : '36px', borderRadius: '50%', background: redSoft, border: `1.5px solid ${redBorder}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: red, fontSize: isMobile ? '14px' : '17px' }}>📋</span>
              </div>
              <div style={{ marginTop: '10px', display: 'grid', gap: '7px' }}>
                <InfoPill label="رقم الفاتورة" value={orderSerial} numStyle={num} red={red} />
                <InfoPill label="تاريخ الفاتورة" value={formatDateEn(order.date_created || order.order_date)} numStyle={num} />
              </div>
            </div>
          </div>
        </div>

        {/* QR + TRACKING */}
        <div style={{ padding: isMobile ? '12px 14px' : '14px 24px', borderBottom: `1px solid ${line}`, background: softGray }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '16px', justifyContent: 'space-between', direction: 'rtl' }}>
            <div style={{ flex: '0 0 auto' }}>
              {qr && (
                <div style={{ padding: '6px', background: '#fff', border: `1.5px solid ${redBorder}`, borderRadius: '12px', boxShadow: '0 8px 20px rgba(220,38,38,0.10)' }}>
                  <img src={qr} alt="QR" style={{ width: isMobile ? '72px' : '92px', height: isMobile ? '72px' : '92px', display: 'block' }} />
                </div>
              )}
            </div>
            <div style={{ flex: 1, textAlign: 'right', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-start', marginBottom: '7px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: fs.lg, fontWeight: 900, color: dark }}>تتبع طلبك</span>
                <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 11px', borderRadius: '999px', fontSize: fs.xs, fontWeight: 900 }}>{currentStatusLabel}</span>
              </div>
              <div style={{ fontSize: fs.base, color: gray, lineHeight: 1.7 }}>امسح الكود لمتابعة حالة طلبك أول بأول من صفحة التتبع الآمنة.</div>
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                {timeline.slice(0, 5).map((s, idx) => {
                  const active = currentIdx >= 0 && idx <= currentIdx;
                  const isCurrent = idx === currentIdx;
                  return (
                    <React.Fragment key={s.status}>
                      {idx > 0 && <span style={{ width: isMobile ? '12px' : '22px', height: '2px', background: active ? '#22c55e' : '#d1d5db', display: 'inline-block' }} />}
                      <span title={s.label} style={{ width: isMobile ? '17px' : '20px', height: isMobile ? '17px' : '20px', borderRadius: '50%', background: isCurrent ? red : (active ? '#22c55e' : '#fff'), border: `2px solid ${isCurrent ? red : (active ? '#22c55e' : '#d1d5db')}`, color: '#fff', fontSize: '10px', fontWeight: 900, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{active && !isCurrent ? '✓' : ''}</span>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* CUSTOMER + DELIVERY */}
        <div style={{ padding: isMobile ? '13px 14px' : '18px 24px' }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column-reverse' : 'row', gap: '12px', direction: 'ltr' }}>
            <InfoCard title="عنوان التوصيل" icon="📍" border="#e5e7eb" bg="#ffffff" titleColor={dark}>
              <Row label="المحافظة" value={order.governorate} />
              <Row label="المدينة" value={order.city} />
              <Row label="العنوان" value={order.address || order.shipping_address} multiline />
              <Row label="حالة الطلب" value={<span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '999px', fontSize: fs.xs, fontWeight: 900 }}>{currentStatusLabel}</span>} />
            </InfoCard>

            <InfoCard title="بيانات العميل" icon="👤" border={redBorder} bg={redSoft} titleColor={red}>
              <Row label="الاسم" value={order.client_name || order.customer_name} />
              <Row label="التليفون" value={<span style={{ color: red, fontWeight: 900, ...num }}>{toEnDigits(order.phone || order.customer_phone)}</span>} />
              {(order.phone2 || order.customer_phone2) && (
                <Row label="تليفون آخر" value={<span style={{ ...num }}>{toEnDigits(order.phone2 || order.customer_phone2)}</span>} />
              )}
              <Row label="السداد" value={order.payment_method} />
            </InfoCard>
          </div>
        </div>

        {/* ITEMS */}
        <div style={{ padding: isMobile ? '0 14px 13px' : '0 24px 18px' }}>
          <div style={{ border: `1px solid ${line}`, borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
            <SectionTitle icon="🛒" title="تفاصيل الطلب" red={red} dark={dark} redSoft={redSoft} redBorder={redBorder} />
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', direction: 'rtl' }}>
              <thead>
                <tr style={{ background: `linear-gradient(180deg, ${red} 0%, ${redDark} 100%)`, color: '#fff' }}>
                  <Th width="7%">م</Th>
                  <Th width="31%">المنتج</Th>
                  <Th width="20%">المقاس / الوصف</Th>
                  <Th width="10%">الكمية</Th>
                  <Th width="16%">سعر الوحدة</Th>
                  <Th width="16%">الإجمالي</Th>
                </tr>
              </thead>
              <tbody>
                {invoiceItems.length > 0 ? invoiceItems.map((it, i) => {
                  const price = Number(it.price || it.unit_price || 0);
                  const qty = Number(it.quantity || 1);
                  const itemTotal = price * qty - Number(it.item_discount || 0);
                  const productName = it.product_name || it.name || it.product_type || 'منتج';
                  const productSize = it.size || it.product_size || it.description || '';
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fcfcfc', borderBottom: i === invoiceItems.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                      <Td center numStyle={num} strong>{toEnDigits(i + 1)}</Td>
                      <Td><span style={{ display: 'block', color: dark, fontWeight: 800, lineHeight: 1.45, wordBreak: 'break-word' }}>{productName}</span></Td>
                      <Td center>{productSize ? <span style={{ background: redSoft, color: redDark, padding: isMobile ? '3px 5px' : '4px 8px', borderRadius: '7px', fontSize: fs.xs, fontWeight: 900, border: `1px solid ${redBorder}`, display: 'inline-block', lineHeight: 1.4, wordBreak: 'break-word' }}>{toEnDigits(productSize)}</span> : <span style={{ color: gray }}>—</span>}</Td>
                      <Td center numStyle={num} strong>{toEnDigits(qty)}</Td>
                      <Td center numStyle={num}>{money(price)}</Td>
                      <Td center numStyle={num} strong color={red}>{money(itemTotal)}</Td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: gray, fontSize: fs.base }}>لا توجد أصناف</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SUMMARY + STATUS TIMELINE */}
        <div style={{ padding: isMobile ? '0 14px 14px' : '0 24px 18px' }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px', direction: 'ltr' }}>
            <div style={{ flex: 1, direction: 'rtl', border: `1px solid ${line}`, borderRadius: '12px', padding: '12px', background: '#fff' }}>
              <SectionTitle icon="⚙️" title="مسار حالة الطلب" red={red} dark={dark} redSoft={redSoft} redBorder={redBorder} compact />
              <div style={{ display: 'grid', gap: '7px', marginTop: '8px' }}>
                {timeline.map((s, idx) => {
                  const active = currentIdx >= 0 && idx <= currentIdx;
                  const isCurrent = idx === currentIdx;
                  return (
                    <div key={s.status} style={{ display: 'grid', gridTemplateColumns: '20px 1fr', alignItems: 'center', gap: '8px', direction: 'rtl' }}>
                      <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: isCurrent ? red : (active ? '#16a34a' : '#fff'), border: `2px solid ${isCurrent ? red : (active ? '#16a34a' : '#d1d5db')}`, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900 }}>{active && !isCurrent ? '✓' : ''}</span>
                      <span style={{ fontSize: fs.base, fontWeight: isCurrent ? 900 : 700, color: isCurrent ? red : (active ? dark : gray) }}>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ flex: 1, direction: 'rtl', border: `1px solid ${line}`, borderRadius: '12px', padding: '12px', background: '#fff' }}>
              <SectionTitle icon="🧮" title="ملخص الفاتورة" red={red} dark={dark} redSoft={redSoft} redBorder={redBorder} compact />
              <div style={{ marginTop: '8px' }}>
                <SumRow label="إجمالي المنتجات" value={money(subtotal)} />
                <SumRow label="مصاريف الشحن" value={money(shipping)} />
                {discount > 0 && <SumRow label="الخصم" value={`- ${money(discount)}`} color={red} />}
                <div style={{ height: '1px', background: line, margin: '9px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', background: `linear-gradient(135deg, ${redSoft}, #ffffff)`, border: `1px solid ${redBorder}`, padding: '9px 11px', borderRadius: '10px', marginBottom: '7px' }}>
                  <span style={{ fontSize: fs.md, fontWeight: 900, color: red }}>الإجمالي الكلي</span>
                  <span style={{ fontSize: fs.lg, fontWeight: 900, color: red, ...num }}>{money(total)}</span>
                </div>
                {paid > 0 && <SumRow label="المدفوع" value={money(paid)} color="#16a34a" />}
                {remaining > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', background: '#fff7ed', border: '1px solid #fed7aa', padding: '8px 10px', borderRadius: '10px', marginTop: '7px' }}>
                    <span style={{ fontSize: fs.md, fontWeight: 900, color: '#c2410c' }}>المتبقي للسداد</span>
                    <span style={{ fontSize: fs.lg, fontWeight: 900, color: '#c2410c', ...num }}>{money(remaining)}</span>
                  </div>
                ) : total > 0 ? (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 10px', borderRadius: '10px', textAlign: 'center', color: '#16a34a', fontWeight: 900, fontSize: fs.md, marginTop: '7px' }}>تم السداد بالكامل</div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {order.notes && (
          <div style={{ padding: isMobile ? '0 14px 12px' : '0 24px 14px' }}>
            <div style={{ background: redSoft, border: `1px solid ${redBorder}`, borderRadius: '10px', padding: '11px' }}>
              <div style={{ fontSize: fs.md, fontWeight: 900, color: red, marginBottom: '5px' }}>📝 ملاحظات</div>
              <div style={{ fontSize: fs.base, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{order.notes}</div>
            </div>
          </div>
        )}

        {policy.enabled && policy.content && (
          <div style={{ padding: isMobile ? '0 14px 12px' : '0 24px 14px' }}>
            <div style={{ background: redSoft, border: `1px solid ${redBorder}`, borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', justifyContent: 'center', color: red, fontWeight: 900, fontSize: fs.md }}>
                <span>🛡️</span><span>{policy.title}</span>
              </div>
              <div style={{ fontSize: fs.sm, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{policy.content}</div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{ padding: isMobile ? '14px' : '17px 24px', background: softGray, borderTop: `1px solid ${line}` }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px', direction: 'ltr' }}>
            <div style={{ flex: 1, direction: 'rtl' }}>
              <div style={{ fontSize: fs.md, fontWeight: 900, color: dark, marginBottom: '8px' }}>تواصل معنا</div>
              {phone && <FooterContactLine icon="📞" text={<span style={num}>{toEnDigits(phone)}</span>} />}
              {email && <FooterContactLine icon="✉️" text={<span style={num}>{email}</span>} />}
              {website && <FooterContactLine icon="🌐" text={<span style={num}>{website.replace(/^https?:\/\//, '')}</span>} />}
              {(city || country) && <FooterContactLine icon="📍" text={[city, country].filter(Boolean).join(' - ')} />}
              {businessHours && <FooterContactLine icon="🕒" text={businessHours} />}
            </div>

            <div style={{ flex: 1, direction: 'rtl' }}>
              <div style={{ fontSize: fs.md, fontWeight: 900, color: dark, marginBottom: '8px' }}>صفحاتنا</div>
              {socialLinks.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', justifyContent: 'flex-start' }}>
                  {socialLinks.map(link => <SocialChip key={link.key} icon={link.icon} color={link.color} label={link.label} value={link.value} numStyle={num} />)}
                </div>
              ) : (
                <div style={{ fontSize: fs.sm, color: gray }}>أضف روابط السوشيال ميديا من الإعدادات لعرضها هنا.</div>
              )}
            </div>
          </div>

          {policyText && (
            <div style={{ marginTop: '13px', padding: '10px 12px', background: '#fff', border: `1px dashed ${redBorder}`, borderRadius: '10px', fontSize: fs.sm, color: '#374151', lineHeight: 1.8, textAlign: 'center', whiteSpace: 'pre-line' }}>
              {policyText}
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: '12px', fontSize: fs.md, fontWeight: 900, color: red }}>
            {thankYou} <span style={{ color: red }}>♥</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const socialHandle = (rawValue: string | null | undefined, fallback: string): string => {
  const value = String(rawValue || '').trim();
  if (!value) return '';
  const plainPhone = value.replace(/[\s()+-]/g, '');
  if (/^\d{8,}$/.test(plainPhone)) return toEnDigits(value);
  try {
    const url = new URL(value.startsWith('http') ? value : `https://${value}`);
    const lastPart = url.pathname.split('/').filter(Boolean).pop();
    if (lastPart) return lastPart.startsWith('@') ? lastPart : `@${lastPart}`;
    return url.hostname.replace(/^www\./, '');
  } catch {
    return value || fallback;
  }
};

const InfoPill: React.FC<{ label: string; value: React.ReactNode; numStyle: React.CSSProperties; red?: string }> = ({ label, value, numStyle, red }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #fee2e2', borderRadius: '9px', padding: '7px 9px' }}>
    <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 800 }}>{label}</span>
    <span style={{ fontSize: '13px', color: red || '#111827', fontWeight: 900, ...numStyle }}>{value}</span>
  </div>
);

const InfoCard: React.FC<{ title: string; icon: string; border: string; bg: string; titleColor: string; children: React.ReactNode }> = ({ title, icon, border, bg, titleColor, children }) => (
  <div style={{ flex: 1, direction: 'rtl', border: `1px solid ${border}`, borderRadius: '12px', padding: '12px', background: bg, minWidth: 0 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px', justifyContent: 'flex-start' }}>
      <span style={{ width: '23px', height: '23px', borderRadius: '50%', background: '#fff', border: `1px solid ${border}`, color: titleColor, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: '13px', fontWeight: 900, color: titleColor }}>{title}</span>
    </div>
    <div style={{ display: 'grid', gap: '6px' }}>{children}</div>
  </div>
);

const Row: React.FC<{ label: string; value: React.ReactNode; multiline?: boolean }> = ({ label, value, multiline }) => (
  <div style={{ display: 'flex', alignItems: multiline ? 'flex-start' : 'center', gap: '8px', direction: 'rtl', minHeight: '20px' }}>
    <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 800, width: '64px', flexShrink: 0, textAlign: 'right' }}>{label} :</span>
    <span style={{ fontSize: '12px', color: '#111827', fontWeight: 800, textAlign: 'right', wordBreak: 'break-word', lineHeight: 1.6, flex: 1 }}>{value || '—'}</span>
  </div>
);

const SectionTitle: React.FC<{ icon: string; title: string; red: string; dark: string; redSoft: string; redBorder: string; compact?: boolean }> = ({ icon, title, red, dark, redSoft, redBorder, compact }) => (
  <div style={{ padding: compact ? '0 0 7px' : '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '7px', borderBottom: compact ? `1px solid ${redBorder}` : '1px solid #f1f5f9', direction: 'rtl' }}>
    <span style={{ width: '23px', height: '23px', borderRadius: '50%', background: redSoft, color: red, border: `1px solid ${redBorder}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>{icon}</span>
    <span style={{ fontSize: '13px', fontWeight: 900, color: dark }}>{title}</span>
  </div>
);

const Th: React.FC<{ width: string; children: React.ReactNode }> = ({ width, children }) => (
  <th style={{ padding: '10px 4px', fontSize: '11px', fontWeight: 900, width, textAlign: 'center', verticalAlign: 'middle', lineHeight: 1.35 }}>{children}</th>
);

const Td: React.FC<{ children: React.ReactNode; center?: boolean; strong?: boolean; color?: string; numStyle?: React.CSSProperties }> = ({ children, center, strong, color, numStyle }) => (
  <td style={{ padding: '10px 6px', fontSize: '12px', fontWeight: strong ? 900 : 700, color: color || '#374151', verticalAlign: 'middle', lineHeight: 1.5, wordBreak: 'break-word', ...numStyle }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: center ? 'center' : 'flex-start', minHeight: '24px', textAlign: center ? 'center' : 'right', width: '100%' }}>
      {children}
    </div>
  </td>
);

const SumRow: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '5px 0' }}>
    <span style={{ fontSize: '12px', color: color || '#6b7280', fontWeight: 800 }}>{label}</span>
    <span style={{ fontSize: '12px', fontWeight: 900, color: color || '#374151', fontFamily: NUMERIC_FONT, fontVariantNumeric: 'tabular-nums', direction: 'ltr', unicodeBidi: 'isolate' }}>{value}</span>
  </div>
);

const FooterContactLine: React.FC<{ icon: string; text: React.ReactNode }> = ({ icon, text }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', justifyContent: 'flex-start', marginBottom: '7px', fontSize: '12px', color: '#374151', direction: 'rtl' }}>
    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#fff', border: '1px solid #fecaca', color: '#dc2626', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', flexShrink: 0 }}>{icon}</span>
    <span style={{ fontWeight: 800, wordBreak: 'break-word' }}>{text}</span>
  </div>
);

const SocialChip: React.FC<{ icon: React.ReactNode; color: string; label: string; value: string; numStyle: React.CSSProperties }> = ({ icon, color, label, value, numStyle }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid #e5e7eb', background: '#fff', borderRadius: '999px', padding: '5px 8px 5px 10px', maxWidth: '100%', direction: 'rtl' }}>
    <span style={{ width: '21px', height: '21px', borderRadius: '50%', background: color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</span>
    <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: 900 }}>{label}</span>
    <span style={{ fontSize: '10px', color: '#111827', fontWeight: 900, direction: 'ltr', unicodeBidi: 'isolate', maxWidth: '96px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...numStyle }}>{value}</span>
  </div>
);

export default BrandedInvoiceTemplate;
