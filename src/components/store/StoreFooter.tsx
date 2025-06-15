import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Youtube, Linkedin, Phone, Mail, MapPin } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface StoreFooterProps {
  storeSettings: any;
}

const StoreFooter = ({ storeSettings }: StoreFooterProps) => {
  const isMobile = useIsMobile();
  
  // Social media links array
  const socialLinks = [
    { url: storeSettings?.facebook_url, icon: Facebook, label: 'فيسبوك', color: 'text-blue-600 hover:text-blue-700' },
    { url: storeSettings?.instagram_url, icon: Instagram, label: 'انستجرام', color: 'text-pink-600 hover:text-pink-700' },
    { url: storeSettings?.twitter_url, icon: Twitter, label: 'تويتر', color: 'text-blue-400 hover:text-blue-500' },
    { url: storeSettings?.youtube_url, icon: Youtube, label: 'يوتيوب', color: 'text-red-600 hover:text-red-700' },
    { url: storeSettings?.linkedin_url, icon: Linkedin, label: 'لينكد إن', color: 'text-blue-700 hover:text-blue-800' },
  ].filter(link => link.url); // Only show links that have URLs

  return (
    <footer className={`border-t mt-8 md:mt-16 bg-gradient-to-br from-gray-900 to-gray-800 text-white ${isMobile ? 'mobile-professional-footer' : ''}`}>
      <div className={`container mx-auto px-3 md:px-4 py-8 md:py-16 ${isMobile ? 'max-w-full' : ''}`}>
        <div className={`grid gap-8 md:gap-12 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
          {/* Store Info */}
          <div className={`${isMobile ? 'text-center' : ''} lg:col-span-2`}>
            <h3 className={`font-bold mb-4 text-white ${isMobile ? 'text-lg' : 'text-2xl'}`}>
              {storeSettings?.store_name || 'متجري الإلكتروني'}
            </h3>
            <p className={`mb-6 text-gray-300 leading-relaxed ${isMobile ? 'text-sm' : 'text-base'}`}>
              {storeSettings?.about_us || 'متجرك الموثوق للتسوق الإلكتروني'}
            </p>
            
            {/* Social Media Links */}
            {socialLinks.length > 0 && (
              <div className={`flex gap-4 flex-wrap ${isMobile ? 'justify-center' : ''} mb-6`}>
                {socialLinks.map((social, index) => {
                  const IconComponent = social.icon;
                  return (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${social.color} transition-all duration-300 hover:scale-110 bg-white/10 hover:bg-white/20 p-3 rounded-full`}
                      aria-label={social.label}
                    >
                      <IconComponent className={isMobile ? "h-5 w-5" : "h-6 w-6"} />
                    </a>
                  );
                })}
                
                {/* Custom icons for TikTok and Snapchat */}
                {storeSettings?.tiktok_url && (
                  <a
                    href={storeSettings.tiktok_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:scale-110 transition-all duration-300 bg-white/10 hover:bg-white/20 p-3 rounded-full"
                    aria-label="تيك توك"
                  >
                    <div className={`bg-black rounded flex items-center justify-center ${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`}>
                      <span className={`text-white font-bold ${isMobile ? 'text-xs' : 'text-sm'}`}>T</span>
                    </div>
                  </a>
                )}
                
                {storeSettings?.snapchat_url && (
                  <a
                    href={storeSettings.snapchat_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:scale-110 transition-all duration-300 bg-white/10 hover:bg-white/20 p-3 rounded-full"
                    aria-label="سناب شات"
                  >
                    <div className={`bg-yellow-400 rounded flex items-center justify-center ${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`}>
                      <span className={`text-white font-bold ${isMobile ? 'text-xs' : 'text-sm'}`}>S</span>
                    </div>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Quick Links - مخفي على الموبايل */}
          {!isMobile && (
            <>
              <div>
                <h3 className="font-bold text-lg mb-4 text-white">روابط سريعة</h3>
                <ul className="space-y-3">
                  <li>
                    <Link to="/" className="text-gray-300 hover:text-white transition-colors duration-300">
                      الرئيسية
                    </Link>
                  </li>
                  <li>
                    <Link to="/products" className="text-gray-300 hover:text-white transition-colors duration-300">
                      المنتجات
                    </Link>
                  </li>
                  <li>
                    <Link to="/about" className="text-gray-300 hover:text-white transition-colors duration-300">
                      من نحن
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" className="text-gray-300 hover:text-white transition-colors duration-300">
                      اتصل بنا
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Customer Service */}
              <div>
                <h3 className="font-bold text-lg mb-4 text-white">خدمة العملاء</h3>
                <ul className="space-y-3">
                  <li>
                    <Link to="/track" className="text-gray-300 hover:text-white transition-colors duration-300">
                      تتبع الطلب
                    </Link>
                  </li>
                  <li>
                    <Link to="/return-policy" className="text-gray-300 hover:text-white transition-colors duration-300">
                      سياسة الاسترجاع والاستبدال
                    </Link>
                  </li>
                  <li>
                    <Link to="/shipping" className="text-gray-300 hover:text-white transition-colors duration-300">
                      سياسة الشحن
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms" className="text-gray-300 hover:text-white transition-colors duration-300">
                      الشروط والأحكام
                    </Link>
                  </li>
                </ul>
              </div>
            </>
          )}

          {/* Contact Info */}
          <div className={isMobile ? 'text-center' : ''}>
            <h3 className={`font-bold mb-4 text-white ${isMobile ? 'text-lg' : 'text-lg'}`}>معلومات التواصل</h3>
            <div className={`space-y-3 ${isMobile ? '' : ''}`}>
              {storeSettings?.contact_phone && (
                <div className={`flex items-center gap-3 ${isMobile ? 'justify-center text-sm' : ''}`}>
                  <Phone className={`text-gray-300 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                  <span className="text-gray-300">{storeSettings.contact_phone}</span>
                </div>
              )}
              {storeSettings?.contact_email && (
                <div className={`flex items-center gap-3 ${isMobile ? 'justify-center text-sm' : ''}`}>
                  <Mail className={`text-gray-300 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                  <span className="text-gray-300">{storeSettings.contact_email}</span>
                </div>
              )}
              {storeSettings?.address && (
                <div className={`flex items-center gap-3 ${isMobile ? 'justify-center text-sm' : ''}`}>
                  <MapPin className={`text-gray-300 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                  <span className="text-gray-300">{storeSettings.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Quick Links */}
        {isMobile && (
          <div className="mt-8 pt-6 border-t border-gray-600">
            <div className="grid grid-cols-2 gap-4 text-center text-sm">
              <Link to="/track" className="text-gray-300 hover:text-white transition-colors">
                تتبع الطلب
              </Link>
              <Link to="/return-policy" className="text-gray-300 hover:text-white transition-colors">
                سياسة الاسترجاع
              </Link>
              <Link to="/shipping" className="text-gray-300 hover:text-white transition-colors">
                سياسة الشحن
              </Link>
              <Link to="/terms" className="text-gray-300 hover:text-white transition-colors">
                الشروط والأحكام
              </Link>
            </div>
          </div>
        )}

        <div className={`border-t border-gray-600 pt-6 mt-8 text-center text-gray-400 ${isMobile ? 'text-sm' : ''}`}>
          <p>&copy; 2025 {storeSettings?.store_name || 'متجري الإلكتروني'}. جميع الحقوق محفوظة.</p>
          <p className="mt-2 text-xs">بواسطة #بتاع_هدايا_الأصلى</p>
        </div>
      </div>
    </footer>
  );
};

export default StoreFooter;
