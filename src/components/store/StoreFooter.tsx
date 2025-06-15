
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
    <footer className="border-t mt-16 bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className={`grid gap-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
          {/* Store Info */}
          <div className={`${isMobile ? 'text-center' : ''} lg:col-span-2`}>
            <h3 className={`font-bold mb-4 text-gray-900 ${isMobile ? 'text-lg' : 'text-xl'}`}>
              {storeSettings?.store_name || 'متجري الإلكتروني'}
            </h3>
            <p className={`mb-6 text-gray-600 ${isMobile ? 'text-sm' : 'text-base'}`}>
              {storeSettings?.about_us || 'متجرك الموثوق للتسوق الإلكتروني'}
            </p>
            
            {/* Social Media Links */}
            {socialLinks.length > 0 && (
              <div className={`flex gap-4 ${isMobile ? 'justify-center' : ''} mb-6`}>
                {socialLinks.map((social, index) => {
                  const IconComponent = social.icon;
                  return (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${social.color} transition-colors`}
                      aria-label={social.label}
                    >
                      <IconComponent className={isMobile ? "h-5 w-5" : "h-6 w-6"} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Links */}
          {!isMobile && (
            <div>
              <h3 className="font-bold text-lg mb-4 text-gray-900">روابط سريعة</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                    الرئيسية
                  </Link>
                </li>
                <li>
                  <Link to="/products" className="text-gray-600 hover:text-gray-900 transition-colors">
                    المنتجات
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-gray-600 hover:text-gray-900 transition-colors">
                    من نحن
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">
                    اتصل بنا
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Contact Info */}
          <div className={isMobile ? 'text-center' : ''}>
            <h3 className={`font-bold mb-4 text-gray-900 ${isMobile ? 'text-lg' : 'text-lg'}`}>معلومات التواصل</h3>
            <div className="space-y-3">
              {storeSettings?.contact_phone && (
                <div className={`flex items-center gap-3 ${isMobile ? 'justify-center text-sm' : ''}`}>
                  <Phone className={`text-gray-600 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                  <span className="text-gray-600">{storeSettings.contact_phone}</span>
                </div>
              )}
              {storeSettings?.contact_email && (
                <div className={`flex items-center gap-3 ${isMobile ? 'justify-center text-sm' : ''}`}>
                  <Mail className={`text-gray-600 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                  <span className="text-gray-600">{storeSettings.contact_email}</span>
                </div>
              )}
              {storeSettings?.address && (
                <div className={`flex items-center gap-3 ${isMobile ? 'justify-center text-sm' : ''}`}>
                  <MapPin className={`text-gray-600 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                  <span className="text-gray-600">{storeSettings.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`border-t border-gray-200 pt-6 mt-8 text-center text-gray-500 ${isMobile ? 'text-sm' : ''}`}>
          <p>&copy; 2024 {storeSettings?.store_name || 'متجري الإلكتروني'}. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
};

export default StoreFooter;
