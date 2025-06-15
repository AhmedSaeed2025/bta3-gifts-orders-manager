
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Truck, Loader2, Clock, MapPin } from 'lucide-react';

const ShippingPolicyPage = () => {
  const { data: storeSettings, isLoading } = useQuery({
    queryKey: ['store-settings-shipping'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('store_name, shipping_policy, default_shipping_cost, free_shipping_threshold, estimated_delivery_time, free_shipping_enabled')
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching store settings:', error);
      }
      
      return data || {
        store_name: 'متجر بتاع هدايا الأصلى',
        shipping_policy: '',
        default_shipping_cost: 0,
        free_shipping_threshold: null,
        estimated_delivery_time: '',
        free_shipping_enabled: false
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
              <Truck className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">سياسة الشحن والتوصيل</h1>
            </div>
            
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Shipping Info Cards */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <MapPin className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">تكلفة الشحن</h3>
                  <p className="text-sm text-gray-600">
                    {storeSettings?.default_shipping_cost 
                      ? `${storeSettings.default_shipping_cost} جنيه` 
                      : 'يتم تحديدها حسب المنطقة'}
                  </p>
                </div>

                {storeSettings?.free_shipping_enabled && storeSettings?.free_shipping_threshold && (
                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <Truck className="h-8 w-8 text-green-600 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">الشحن المجاني</h3>
                    <p className="text-sm text-gray-600">
                      للطلبات أكثر من {storeSettings.free_shipping_threshold} جنيه
                    </p>
                  </div>
                )}

                {storeSettings?.estimated_delivery_time && (
                  <div className="text-center p-6 bg-orange-50 rounded-lg">
                    <Clock className="h-8 w-8 text-orange-600 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">مدة التوصيل</h3>
                    <p className="text-sm text-gray-600">{storeSettings.estimated_delivery_time}</p>
                  </div>
                )}
              </div>

              {/* Shipping Policy Content */}
              <div className="prose prose-lg max-w-none">
                {storeSettings?.shipping_policy ? (
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-lg">
                    {storeSettings.shipping_policy}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-4">معلومات الشحن والتوصيل</h3>
                    <ul className="space-y-3 text-gray-700">
                      <li>• نقوم بالشحن إلى جميع محافظات جمهورية مصر العربية</li>
                      <li>• يتم تأكيد الطلب خلال 24 ساعة من تقديمه</li>
                      <li>• مدة التوصيل تتراوح من 2-5 أيام عمل حسب المنطقة</li>
                      <li>• يمكنك تتبع حالة طلبك من خلال رقم الطلب</li>
                      <li>• نتواصل معك هاتفياً قبل التوصيل بـ 24 ساعة</li>
                    </ul>
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

export default ShippingPolicyPage;
