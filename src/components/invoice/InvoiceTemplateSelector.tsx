import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Printer, Eye } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useIsMobile } from '@/hooks/use-mobile';
import ClassicInvoiceTemplate from './templates/ClassicInvoiceTemplate';
import ModernInvoiceTemplate from './templates/ModernInvoiceTemplate';
import ElegantInvoiceTemplate from './templates/ElegantInvoiceTemplate';
import ProfessionalInvoiceTemplate from './templates/ProfessionalInvoiceTemplate';
import MinimalInvoiceTemplate from './templates/MinimalInvoiceTemplate';
import CompactInvoiceTemplate from './templates/CompactInvoiceTemplate';

interface InvoiceTemplateSelectorProps {
  order: any;
  storeSettings?: any;
  onClose?: () => void;
}

type TemplateType = 'professional' | 'minimal' | 'compact' | 'classic' | 'modern' | 'elegant';

const templates: { key: TemplateType; label: string; desc: string }[] = [
  { key: 'professional', label: 'الاحترافي', desc: 'تصميم احترافي نظيف مع ملخص واضح للفاتورة' },
  { key: 'minimal', label: 'البسيط', desc: 'تصميم بسيط وأنيق بخطوط نظيفة بدون ألوان زائدة' },
  { key: 'compact', label: 'المدمج', desc: 'تصميم مدمج عصري بألوان متدرجة وتنظيم مميز' },
  { key: 'classic', label: 'الكلاسيكي', desc: 'تصميم تقليدي رسمي مناسب للأعمال التجارية' },
  { key: 'modern', label: 'العصري', desc: 'تصميم عصري بألوان متدرجة وتأثيرات حديثة' },
  { key: 'elegant', label: 'الأنيق', desc: 'تصميم أنيق راقي مع إطار ذهبي مميز' },
];

const InvoiceTemplateSelector: React.FC<InvoiceTemplateSelectorProps> = ({
  order,
  storeSettings,
  onClose
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('professional');
  const [previewMode, setPreviewMode] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
    documentTitle: `فاتورة-${order.serial}`,
    pageStyle: `
      @page { size: A4; margin: 0; }
      @media print {
        body {
          direction: rtl !important;
          font-family: 'Tajawal', 'Cairo', 'Amiri', Arial, sans-serif !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `
  });

  const renderTemplate = () => {
    const map: Record<TemplateType, React.ReactNode> = {
      professional: <ProfessionalInvoiceTemplate order={order} storeSettings={storeSettings} />,
      minimal: <MinimalInvoiceTemplate order={order} storeSettings={storeSettings} />,
      compact: <CompactInvoiceTemplate order={order} storeSettings={storeSettings} />,
      classic: <ClassicInvoiceTemplate order={order} storeSettings={storeSettings} />,
      modern: <ModernInvoiceTemplate order={order} storeSettings={storeSettings} />,
      elegant: <ElegantInvoiceTemplate order={order} storeSettings={storeSettings} />,
    };
    return map[selectedTemplate];
  };

  const currentDesc = templates.find(t => t.key === selectedTemplate)?.desc || '';

  if (previewMode) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2 print:hidden">
          <Button onClick={handlePrint} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
            <Printer className="h-4 w-4" />
            طباعة الفاتورة
          </Button>
          <Button variant="outline" onClick={() => setPreviewMode(false)} className="flex items-center gap-2">
            العودة لاختيار النموذج
          </Button>
          {onClose && <Button variant="outline" onClick={onClose}>إغلاق</Button>}
        </div>
        <div ref={invoiceRef} className="overflow-auto">{renderTemplate()}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-6">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">اختر نموذج الفاتورة</h2>
          <p className="text-sm text-muted-foreground">جميع النماذج متوافقة مع الطباعة والموبايل</p>
        </div>

        <Tabs value={selectedTemplate} onValueChange={(v) => setSelectedTemplate(v as TemplateType)} className="w-full" dir="rtl">
          <TabsList className={`grid w-full mb-6 ${isMobile ? 'grid-cols-3 gap-1' : 'grid-cols-6'}`}>
            {templates.map(t => (
              <TabsTrigger key={t.key} value={t.key} className="text-xs sm:text-sm">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mb-6">
            <div className="bg-muted/50 border rounded-lg p-3">
              <p className="text-sm text-center text-muted-foreground">{currentDesc}</p>
            </div>
          </div>

          {templates.map(t => (
            <TabsContent key={t.key} value={t.key} className="mt-0">
              <div className="border-2 border-border rounded-lg overflow-hidden">
                <div className={`${isMobile ? 'scale-50 origin-top-right' : 'scale-75 origin-top'} transform`}>
                  {renderTemplate()}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button onClick={() => setPreviewMode(true)} className="w-full flex items-center justify-center gap-2">
            <Eye className="h-4 w-4" />
            معاينة وطباعة
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">إلغاء</Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default InvoiceTemplateSelector;
