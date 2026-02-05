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

const ProfessionalInvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ order, storeSettings }) => {
  const { items, subtotal, shipping, discount, total, paid, remaining } = calculateOrderFinancials(order);
  const { getStatusLabel } = useOrderStatuses();
  const invoiceRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG');
  };

  const handleScreenshot = async () => {
    if (!invoiceRef.current) return;
    
    try {
      const element = invoiceRef.current;
      
      // Force a reflow to ensure proper rendering
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
      });
      
      // Create download link
      const link = document.createElement('a');
      link.download = `فاتورة-${order.serial}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('تم حفظ صورة الفاتورة');
    } catch (error) {
      console.error('Screenshot error:', error);
      toast.error('حدث خطأ أثناء حفظ الصورة');
    }
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
        data-invoice-ref="true"
        style={{
          backgroundColor: '#ffffff',
          color: '#1f2937',
          padding: '16px',
          fontFamily: 'Tajawal, Arial, sans-serif',
          direction: 'rtl',
          width: '400px',
          maxWidth: '400px',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div style={{ backgroundColor: '#fef2f2', borderBottom: '2px solid #fecaca', padding: '12px', borderRadius: '8px 8px 0 0', marginBottom: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ textAlign: 'left', width: '30%' }}>
                  <div style={{ fontSize: '10px', color: '#6b7280' }}>التاريخ</div>
                  <div style={{ fontSize: '11px', fontWeight: '500' }}>{formatDate(order.date_created || order.order_date)}</div>
                </td>
                <td style={{ textAlign: 'center', width: '40%' }}>
                  {storeSettings?.logo_url && (
                    <img 
                      src={storeSettings.logo_url} 
                      alt={storeSettings?.store_name || 'الشعار'}
                      style={{ width: '48px', height: '48px', objectFit: 'contain', display: 'inline-block', marginBottom: '4px' }}
                    />
                  )}
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#dc2626' }}>
                    {storeSettings?.store_name || 'المتجر'}
                  </div>
                </td>
                <td style={{ textAlign: 'right', width: '30%' }}>
                  <div style={{ fontSize: '10px', color: '#6b7280' }}>فاتورة رقم</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#dc2626' }}>{order.serial}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Customer Details */}
        <div style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#dc2626', borderRadius: '50%', marginLeft: '6px', verticalAlign: 'middle' }}></span>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#dc2626', verticalAlign: 'middle' }}>بيانات العميل</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ fontSize: '10px', padding: '2px 0' }}>
                  <span style={{ color: '#6b7280' }}>الاسم:</span> <span style={{ fontWeight: '500' }}>{order.client_name || order.customer_name}</span>
                </td>
                <td style={{ fontSize: '10px', padding: '2px 0' }}>
                  <span style={{ color: '#6b7280' }}>التليفون:</span> <span style={{ fontWeight: '500' }}>{order.phone || order.customer_phone}</span>
                  {(order.phone2 || order.customer_phone2) && (
                    <span style={{ marginRight: '4px', fontWeight: '500' }}> / {order.phone2 || order.customer_phone2}</span>
                  )}
                </td>
              </tr>
              <tr>
                <td style={{ fontSize: '10px', padding: '2px 0' }}>
                  <span style={{ color: '#6b7280' }}>السداد:</span> <span style={{ fontWeight: '500' }}>{order.payment_method}</span>
                </td>
                <td style={{ fontSize: '10px', padding: '2px 0' }}>
                  <span style={{ color: '#6b7280' }}>التوصيل:</span> <span style={{ fontWeight: '500' }}>{order.delivery_method}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Delivery Info */}
        <div style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#dc2626', borderRadius: '50%', marginLeft: '6px', verticalAlign: 'middle' }}></span>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#dc2626', verticalAlign: 'middle' }}>معلومات التوصيل</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ fontSize: '10px', padding: '2px 0' }}>
                  <span style={{ color: '#6b7280' }}>الحالة:</span>
                  <span style={{ marginRight: '4px', padding: '2px 8px', borderRadius: '10px', fontSize: '9px', backgroundColor: '#fee2e2', color: '#b91c1c', fontWeight: '500' }}>
                    {getStatusLabel(order.status)}
                  </span>
                </td>
                {order.governorate && (
                  <td style={{ fontSize: '10px', padding: '2px 0' }}>
                    <span style={{ color: '#6b7280' }}>المحافظة:</span> <span style={{ fontWeight: '500' }}>{order.governorate}</span>
                  </td>
                )}
              </tr>
              {(order.address || order.shipping_address) && (
                <tr>
                  <td colSpan={2} style={{ fontSize: '10px', padding: '2px 0' }}>
                    <span style={{ color: '#6b7280' }}>العنوان:</span> <span style={{ fontWeight: '500' }}>{order.address || order.shipping_address}</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Items Table */}
        <div style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#dc2626', borderRadius: '50%', marginLeft: '6px', verticalAlign: 'middle' }}></span>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#dc2626', verticalAlign: 'middle' }}>تفاصيل الطلب</span>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ backgroundColor: '#dc2626', color: '#ffffff' }}>
                <th style={{ padding: '5px 2px', textAlign: 'right', fontWeight: '500', width: '30%' }}>المنتج</th>
                <th style={{ padding: '5px 2px', textAlign: 'center', fontWeight: '500', width: '15%' }}>المقاس</th>
                <th style={{ padding: '5px 2px', textAlign: 'center', fontWeight: '500', width: '10%' }}>العدد</th>
                <th style={{ padding: '5px 2px', textAlign: 'center', fontWeight: '500', width: '15%' }}>السعر</th>
                <th style={{ padding: '5px 2px', textAlign: 'center', fontWeight: '500', width: '15%' }}>الخصم</th>
                <th style={{ padding: '5px 2px', textAlign: 'left', fontWeight: '500', width: '15%' }}>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? items.map((item: any, index: number) => {
                const price = item.price || item.unit_price || 0;
                const qty = item.quantity || 1;
                const itemDiscount = item.item_discount || 0;
                const itemTotal = (price * qty) - itemDiscount;
                return (
                  <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '5px 2px', textAlign: 'right', color: '#dc2626', fontWeight: '500', wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: '1.4' }}>
                      {item.product_type || item.product_name}
                    </td>
                    <td style={{ padding: '5px 2px', textAlign: 'center' }}>
                      <span style={{ backgroundColor: '#f3f4f6', padding: '2px 4px', borderRadius: '4px', fontSize: '8px' }}>
                        {item.size || item.product_size}
                      </span>
                    </td>
                    <td style={{ padding: '5px 2px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</td>
                    <td style={{ padding: '5px 2px', textAlign: 'center' }}>{formatCurrency(price)}</td>
                    <td style={{ padding: '5px 2px', textAlign: 'center', color: itemDiscount > 0 ? '#dc2626' : '#9ca3af' }}>
                      {itemDiscount > 0 ? `-${formatCurrency(itemDiscount)}` : '-'}
                    </td>
                    <td style={{ padding: '5px 2px', textAlign: 'left', fontWeight: '600' }}>{formatCurrency(itemTotal)}</td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontSize: '10px' }}>لا توجد أصناف</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Invoice Summary */}
        <div style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
          <table style={{ width: '180px', marginRight: 'auto', marginLeft: '0', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <thead>
              <tr>
                <th colSpan={2} style={{ backgroundColor: '#f9fafb', padding: '6px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontSize: '10px', fontWeight: 'bold', color: '#374151' }}>
                  ملخص الفاتورة
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '6px 8px', fontSize: '10px', color: '#6b7280', textAlign: 'right' }}>إجمالي المنتجات:</td>
                <td style={{ padding: '6px 8px', fontSize: '10px', fontWeight: '600', textAlign: 'left' }}>{formatCurrency(subtotal)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '6px 8px', fontSize: '10px', color: '#6b7280', textAlign: 'right' }}>الشحن:</td>
                <td style={{ padding: '6px 8px', fontSize: '10px', fontWeight: '600', textAlign: 'left' }}>{formatCurrency(shipping)}</td>
              </tr>
              {discount > 0 && (
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '6px 8px', fontSize: '10px', color: '#6b7280', textAlign: 'right' }}>الخصم:</td>
                  <td style={{ padding: '6px 8px', fontSize: '10px', fontWeight: '600', textAlign: 'left', color: '#dc2626' }}>- {formatCurrency(discount)}</td>
                </tr>
              )}
              <tr style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: '#dbeafe' }}>
                <td style={{ padding: '8px', fontSize: '10px', fontWeight: 'bold', color: '#3b82f6', textAlign: 'right' }}>المجموع:</td>
                <td style={{ padding: '8px', fontSize: '12px', fontWeight: 'bold', textAlign: 'left' }}>{formatCurrency(total)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '6px 8px', fontSize: '10px', color: '#6b7280', textAlign: 'right' }}>المدفوع:</td>
                <td style={{ padding: '6px 8px', fontSize: '10px', fontWeight: '600', textAlign: 'left', color: '#16a34a' }}>{formatCurrency(-paid)}</td>
              </tr>
              <tr style={{ backgroundColor: '#fee2e2' }}>
                <td style={{ padding: '8px', fontSize: '10px', fontWeight: 'bold', color: '#dc2626', textAlign: 'right' }}>المتبقي:</td>
                <td style={{ padding: '8px', fontSize: '12px', fontWeight: 'bold', textAlign: 'left', color: '#dc2626' }}>{formatCurrency(remaining)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Notes */}
        {order.notes && (
          <div style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ width: '22px', height: '22px', backgroundColor: '#dc2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '10px', color: '#fff' }}>📝</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#dc2626', marginBottom: '4px' }}>ملاحظات الطلب:</div>
                  <div style={{ fontSize: '10px', color: '#374151', lineHeight: '1.6' }}>{order.notes}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '0 0 8px 8px', textAlign: 'center' }}>
          <div style={{ marginBottom: '4px' }}>
            {storeSettings?.logo_url && (
              <img 
                src={storeSettings.logo_url} 
                alt=""
                style={{ width: '24px', height: '24px', objectFit: 'contain', display: 'inline-block', verticalAlign: 'middle', marginLeft: '6px' }}
              />
            )}
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#374151', verticalAlign: 'middle' }}>
              شكراً لثقتكم في {storeSettings?.store_name || 'متجرنا'}
            </span>
          </div>

          {storeSettings?.contact_phone && (
            <div style={{ fontSize: '10px', color: '#6b7280' }}>
              📞 للتواصل: {storeSettings.contact_phone}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalInvoiceTemplate;
