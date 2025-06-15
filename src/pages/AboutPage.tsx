
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const AboutPage = () => {
  const { data: storeSettings, isLoading } = useQuery({
    queryKey: ['store-settings-about'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('store_name, about_us')
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching store settings:', error);
      }
      
      return data || {
        store_name: 'متجر بتاع هدايا الأصلى',
        about_us: 'متجرك الموثوق للتسوق الإلكتروني'
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
            <h1 className="text-3xl font-bold text-center mb-8">من نحن</h1>
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-semibold mb-4">{storeSettings?.store_name}</h2>
              <div className="prose prose-lg max-w-none">
                {storeSettings?.about_us ? (
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {storeSettings.about_us}
                  </div>
                ) : (
                  <p className="text-gray-600">
                    مرحباً بكم في متجرنا الإلكتروني. نحن نسعى لتقديم أفضل المنتجات وأعلى مستوى من الخدمة لعملائنا الكرام.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AboutPage;
