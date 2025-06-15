
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Loader2 } from 'lucide-react';

const TermsPage = () => {
  const { data: storeSettings, isLoading } = useQuery({
    queryKey: ['store-settings-terms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('store_name, terms_conditions')
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching store settings:', error);
      }
      
      return data || {
        store_name: 'متجر بتاع هدايا الأصلى',
        terms_conditions: ''
      };
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">الشروط والأحكام</h1>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <div className="prose prose-lg max-w-none">
                {storeSettings?.terms_conditions ? (
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {storeSettings.terms_conditions}
                  </div>
                ) : (
                  <div className="space-y-6 text-gray-700">
                    <section>
                      <h3 className="text-xl font-semibold mb-3">1. شروط الاستخدام</h3>
                      <p>باستخدامك لهذا الموقع، فإنك توافق على الالتزام بهذه الشروط والأحكام.</p>
                    </section>
                    
                    <section>
                      <h3 className="text-xl font-semibold mb-3">2. المنتجات والخدمات</h3>
                      <p>نسعى لعرض المنتجات بأعلى دقة ممكنة، ولكن قد تختلف الألوان الفعلية قليلاً عن المعروضة.</p>
                    </section>
                    
                    <section>
                      <h3 className="text-xl font-semibold mb-3">3. الطلبات والدفع</h3>
                      <p>جميع الطلبات تخضع للمراجعة والتأكيد. نحتفظ بالحق في رفض أي طلب لأي سبب.</p>
                    </section>
                    
                    <section>
                      <h3 className="text-xl font-semibold mb-3">4. الشحن والتوصيل</h3>
                      <p>نلتزم بتوصيل الطلبات في المواعيد المحددة، وفي حالة التأخير سيتم إعلامكم.</p>
                    </section>
                    
                    <section>
                      <h3 className="text-xl font-semibold mb-3">5. سياسة الاسترجاع</h3>
                      <p>يمكن استرجاع المنتجات خلال فترة محددة وفقاً لسياسة الاسترجاع المعلنة.</p>
                    </section>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsPage;
