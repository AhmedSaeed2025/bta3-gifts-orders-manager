import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Calendar, Truck, DollarSign, Package, Phone, Mail } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DOMPurify from 'dompurify';

const ReturnPolicy = () => {
  // Fetch store settings to get custom return policy if available
  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings-return-policy'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('return_policy, store_name, contact_phone, contact_email')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    }
  });

  // Use custom return policy if available, otherwise use default
  const returnPolicyContent = storeSettings?.return_policy;
  const storeName = storeSettings?.store_name || '#بتاع_هدايا_الأصلي';

  if (returnPolicyContent) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl" dir="rtl">
        <Card className="shadow-lg">
          <CardHeader className="text-center bg-gradient-to-r from-primary/10 to-secondary/10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Package className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl font-bold text-primary">
                سياسة الاستبدال والاسترجاع
              </CardTitle>
            </div>
            <p className="text-muted-foreground">
              في {storeName}، رضاك عن تجربتك معنا هو أولويتنا
            </p>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="prose prose-lg max-w-none text-right" dir="rtl">
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(returnPolicyContent.replace(/\n/g, '<br />')) }} />
            </div>
            
            {/* Contact Info */}
            <div className="text-center pt-6 border-t mt-6">
              <p className="text-sm text-muted-foreground mb-4">
                لأي استفسارات إضافية حول سياسة الاسترجاع، يرجى التواصل معنا
              </p>
              <div className="flex justify-center gap-6">
                {storeSettings?.contact_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="text-sm">{storeSettings.contact_phone}</span>
                  </div>
                )}
                {storeSettings?.contact_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="text-sm">{storeSettings.contact_email}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default return policy content
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl" dir="rtl">
      <Card className="shadow-lg">
        <CardHeader className="text-center bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Package className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl font-bold text-primary">
              سياسة الاستبدال والاسترجاع
            </CardTitle>
          </div>
          <p className="text-muted-foreground">
            في {storeName}، رضاك عن تجربتك معنا هو أولويتنا
          </p>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* القابلة للاسترجاع */}
          <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
                المنتجات القابلة للاسترجاع أو الاستبدال
              </h3>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>المنتجات غير المخصصة (أي الجاهزة وليست حسب الطلب أو مصممة خصيصًا باسم أو صورة العميل)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>يجب أن تكون في نفس حالتها الأصلية دون استخدام</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>يجب أن تكون في نفس التغليف والتعبئة الأصلية كما تم استلامها</span>
              </li>
            </ul>
          </div>

          {/* المدة الزمنية */}
          <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                المدة الزمنية
              </h3>
            </div>
            <p className="text-sm">
              يُمكنك طلب الاسترجاع أو الاستبدال خلال <span className="font-bold text-blue-600">3 أيام</span> من تاريخ الاستلام
            </p>
          </div>

          {/* تكاليف الشحن */}
          <div className="border rounded-lg p-4 bg-orange-50 dark:bg-orange-900/20">
            <div className="flex items-center gap-2 mb-3">
              <Truck className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-orange-700 dark:text-orange-400">
                تكاليف الشحن
              </h3>
            </div>
            <p className="text-sm">
              يتحمّل العميل تكلفة الشحن بالكامل في حالة الاسترجاع أو الاستبدال
            </p>
          </div>

          {/* استرداد المبلغ */}
          <div className="border rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-400">
                استرداد المبلغ
              </h3>
            </div>
            <div className="text-sm space-y-2">
              <p className="font-medium">يتم استرداد قيمة المنتج بعد:</p>
              <ul className="space-y-1 mr-4">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  <span>استلام المرتجع</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  <span>فحص حالته والتأكد من مطابقته للشروط</span>
                </li>
              </ul>
              <p className="pt-2">
                يتم التحويل خلال <span className="font-bold">3 إلى 7 أيام عمل</span> عبر نفس وسيلة الدفع المستخدمة أو حسب الاتفاق
              </p>
            </div>
          </div>

          {/* غير القابلة للاسترجاع */}
          <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="h-5 w-5 text-red-600" />
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">
                المنتجات غير القابلة للاسترجاع أو الاستبدال
              </h3>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">•</span>
                <span>أي منتج مصمم خصيصًا للعميل (مثل التابلوهات أو الماكيتات الكاريكاتير أو الميداليات بأسماء أو صور)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">•</span>
                <span>المنتجات التي تم استخدامها أو فتحها بشكل يخل بتغليفها الأصلي</span>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="text-center pt-6 border-t">
            <p className="text-sm text-muted-foreground mb-4">
              لأي استفسارات إضافية حول سياسة الاسترجاع، يرجى التواصل معنا
            </p>
            <div className="flex justify-center gap-6">
              {storeSettings?.contact_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="text-sm">{storeSettings.contact_phone}</span>
                </div>
              )}
              {storeSettings?.contact_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="text-sm">{storeSettings.contact_email}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReturnPolicy;
