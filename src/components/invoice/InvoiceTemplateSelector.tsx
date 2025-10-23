import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Printer, Download, Eye } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useIsMobile } from '@/hooks/use-mobile';
import ClassicInvoiceTemplate from './templates/ClassicInvoiceTemplate';
import ModernInvoiceTemplate from './templates/ModernInvoiceTemplate';
import ElegantInvoiceTemplate from './templates/ElegantInvoiceTemplate';

interface InvoiceTemplateSelectorProps {
  order: any;
  storeSettings?: any;
  onClose?: () => void;
}

type TemplateType = 'classic' | 'modern' | 'elegant';

const InvoiceTemplateSelector: React.FC<InvoiceTemplateSelectorProps> = ({
  order,
  storeSettings,
  onClose
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('modern');
  const [previewMode, setPreviewMode] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
    documentTitle: `فاتورة-${order.serial}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 0;
      }
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
    const templates = {
      classic: <ClassicInvoiceTemplate order={order} storeSettings={storeSettings} />,
      modern: <ModernInvoiceTemplate order={order} storeSettings={storeSettings} />,
      elegant: <ElegantInvoiceTemplate order={order} storeSettings={storeSettings} />
    };
    return templates[selectedTemplate];
  };

  const templateDescriptions = {
    classic: 'تصميم تقليدي رسمي مناسب للأعمال التجارية',
    modern: 'تصميم عصري بألوان متدرجة وتأثيرات حديثة',
    elegant: 'تصميم أنيق راقي مع إطار ذهبي مميز'
  };

  if (previewMode) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2 print:hidden">
          <Button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Printer className="h-4 w-4" />
            طباعة الفاتورة
          </Button>
          <Button
            variant="outline"
            onClick={() => setPreviewMode(false)}
            className="flex items-center gap-2"
          >
            العودة لاختيار النموذج
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              إغلاق
            </Button>
          )}
        </div>

        <div ref={invoiceRef} className="overflow-auto">
          {renderTemplate()}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-6">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
            اختر نموذج الفاتورة
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            اختر التصميم المناسب لفاتورتك - جميع النماذج متوافقة مع الطباعة والموبايل
          </p>
        </div>

        <Tabs
          value={selectedTemplate}
          onValueChange={(value) => setSelectedTemplate(value as TemplateType)}
          className="w-full"
          dir="rtl"
        >
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="classic" className="text-xs sm:text-sm">
              الكلاسيكي
            </TabsTrigger>
            <TabsTrigger value="modern" className="text-xs sm:text-sm">
              العصري
            </TabsTrigger>
            <TabsTrigger value="elegant" className="text-xs sm:text-sm">
              الأنيق
            </TabsTrigger>
          </TabsList>

          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 text-center">
                {templateDescriptions[selectedTemplate]}
              </p>
            </div>
          </div>

          <TabsContent value="classic" className="mt-0">
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
              <div className={`${isMobile ? 'scale-50 origin-top-right' : 'scale-75 origin-top'} transform`}>
                <ClassicInvoiceTemplate order={order} storeSettings={storeSettings} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="modern" className="mt-0">
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
              <div className={`${isMobile ? 'scale-50 origin-top-right' : 'scale-75 origin-top'} transform`}>
                <ModernInvoiceTemplate order={order} storeSettings={storeSettings} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="elegant" className="mt-0">
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
              <div className={`${isMobile ? 'scale-50 origin-top-right' : 'scale-75 origin-top'} transform`}>
                <ElegantInvoiceTemplate order={order} storeSettings={storeSettings} />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button
            onClick={() => setPreviewMode(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white flex items-center justify-center gap-2"
          >
            <Eye className="h-4 w-4" />
            معاينة وطباعة
          </Button>
          {onClose && (
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              إلغاء
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default InvoiceTemplateSelector;
