
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Instagram, MessageCircle } from 'lucide-react';

const StoreFooter = () => {
  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings-footer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching store settings:', error);
        return null;
      }

      return data;
    }
  });

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* معلومات المتجر */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">{storeSettings?.store_name || 'متجري'}</h3>
            {storeSettings?.store_tagline && (
              <p className="text-gray-300">{storeSettings.store_tagline}</p>
            )}
            {storeSettings?.about_us && (
              <p className="text-gray-400 text-sm">{storeSettings.about_us}</p>
            )}
          </div>

          {/* روابط سريعة */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">روابط سريعة</h4>
            <ul className="space-y-2 text-gray-300">
              <li><Link to="/store" className="hover:text-white transition-colors">المتجر</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">من نحن</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">اتصل بنا</Link></li>
              <li><Link to="/track" className="hover:text-white transition-colors">تتبع الطلب</Link></li>
            </ul>
          </div>

          {/* السياسات */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">السياسات</h4>
            <ul className="space-y-2 text-gray-300">
              <li><Link to="/terms" className="hover:text-white transition-colors">الشروط والأحكام</Link></li>
              <li><Link to="/shipping" className="hover:text-white transition-colors">سياسة الشحن</Link></li>
              <li><Link to="/return-policy" className="hover:text-white transition-colors">سياسة الإرجاع</Link></li>
            </ul>
          </div>

          {/* معلومات الاتصال */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">تواصل معنا</h4>
            <div className="space-y-3 text-gray-300">
              {storeSettings?.contact_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{storeSettings.contact_phone}</span>
                </div>
              )}
              {storeSettings?.contact_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{storeSettings.contact_email}</span>
                </div>
              )}
              {storeSettings?.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{storeSettings.address}</span>
                </div>
              )}
            </div>

            {/* وسائل التواصل الاجتماعي */}
            <div className="flex gap-4 mt-4">
              {storeSettings?.facebook_url && (
                <a href={storeSettings.facebook_url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {storeSettings?.instagram_url && (
                <a href={storeSettings.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {storeSettings?.whatsapp_number && (
                <a href={`https://wa.me/${storeSettings.whatsapp_number}`} target="_blank" rel="noopener noreferrer" className="hover:text-green-400 transition-colors">
                  <MessageCircle className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* خط الفصل */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {currentYear} {storeSettings?.store_name || 'متجري'}. جميع الحقوق محفوظة.
            </p>
            <p className="text-green-400 text-sm font-medium mt-2 md:mt-0">
              {storeSettings?.footer_brand_text || 'بتاع هدايا الأصلى'}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default StoreFooter;
