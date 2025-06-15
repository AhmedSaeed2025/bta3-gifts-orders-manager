
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, Mail, MapPin, MessageCircle, Loader2 } from 'lucide-react';

const ContactPage = () => {
  const { data: storeSettings, isLoading } = useQuery({
    queryKey: ['store-settings-contact'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('store_name, contact_phone, contact_phone_2, contact_email, address, whatsapp_number, whatsapp_chat_url')
        .eq('is_active', true)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching store settings:', error);
      }
      
      return data || {
        store_name: 'متجر بتاع هدايا الأصلى',
        contact_phone: '',
        contact_phone_2: '',
        contact_email: '',
        address: '',
        whatsapp_number: '',
        whatsapp_chat_url: ''
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
            <h1 className="text-3xl font-bold text-center mb-8">اتصل بنا</h1>
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold mb-2">{storeSettings?.store_name}</h2>
                <p className="text-gray-600">نحن هنا لخدمتكم، لا تترددوا في التواصل معنا</p>
              </div>

              <div className="grid gap-6">
                {storeSettings?.contact_phone && (
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <Phone className="h-6 w-6 text-primary" />
                    <div>
                      <h3 className="font-semibold">الهاتف الأساسي</h3>
                      <p className="text-gray-600">{storeSettings.contact_phone}</p>
                    </div>
                  </div>
                )}

                {storeSettings?.contact_phone_2 && (
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <Phone className="h-6 w-6 text-primary" />
                    <div>
                      <h3 className="font-semibold">الهاتف الثانوي</h3>
                      <p className="text-gray-600">{storeSettings.contact_phone_2}</p>
                    </div>
                  </div>
                )}

                {storeSettings?.contact_email && (
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <Mail className="h-6 w-6 text-primary" />
                    <div>
                      <h3 className="font-semibold">البريد الإلكتروني</h3>
                      <p className="text-gray-600">{storeSettings.contact_email}</p>
                    </div>
                  </div>
                )}

                {storeSettings?.address && (
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <MapPin className="h-6 w-6 text-primary" />
                    <div>
                      <h3 className="font-semibold">العنوان</h3>
                      <p className="text-gray-600">{storeSettings.address}</p>
                    </div>
                  </div>
                )}

                {(storeSettings?.whatsapp_chat_url || storeSettings?.whatsapp_number) && (
                  <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                    <MessageCircle className="h-6 w-6 text-green-600" />
                    <div className="flex-1">
                      <h3 className="font-semibold">واتساب</h3>
                      <p className="text-gray-600 mb-2">تواصل معنا مباشرة عبر الواتساب</p>
                      {storeSettings.whatsapp_chat_url && (
                        <a
                          href={storeSettings.whatsapp_chat_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          تواصل عبر الواتساب
                        </a>
                      )}
                    </div>
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

export default ContactPage;
