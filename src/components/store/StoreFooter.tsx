
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
    { url: storeSettings?.facebook_url, icon: Facebook, label: 'فيسبوك', color: 'text-blue-600' },
    { url: storeSettings?.instagram_url, icon: Instagram, label: 'انستجرام', color: 'text-pink-600' },
    { url: storeSettings?.twitter_url, icon: Twitter, label: 'تويتر', color: 'text-blue-400' },
    { url: storeSettings?.youtube_url, icon: Youtube, label: 'يوتيوب', color: 'text-red-600' },
    { url: storeSettings?.linkedin_url, icon: Linkedin, label: 'لينكد إن', color: 'text-blue-700' },
  ].filter(link => link.url); // Only show links that have URLs

  return (
    <footer className={`border-t mt-6 md:mt-16 ${isMobile ? 'mobile-warm-bg mobile-warm-border' : 'bg-muted/50'}`}>
      <div className={`container mx-auto px-2 md:px-4 py-4 md:py-12 ${isMobile ? 'max-w-full' : ''}`}>
        <div className={`grid gap-4 md:gap-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
          {/* Store Info */}
          <div className={isMobile ? 'text-center' : ''}>
            <h3 className={`font-bold mb-2 md:mb-4 ${isMobile ? 'text-sm mobile-warm-text' : 'text-lg'}`}>
              {storeSettings?.store_name || 'متجري الإلكتروني'}
            </h3>
            <p className={`text-muted-foreground mb-2 md:mb-4 ${isMobile ? 'text-xs mobile-warm-text leading-relaxed' : ''}`}>
              {storeSettings?.about_us || 'متجرك الموثوق للتسوق الإلكتروني'}
            </p>
            
            {/* Social Media Links */}
            {socialLinks.length > 0 && (
              <div className={`flex gap-2 flex-wrap ${isMobile ? 'justify-center' : ''}`}>
                {socialLinks.map((social, index) => {
                  const IconComponent = social.icon;
                  return (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${social.color} hover:opacity-75 transition-opacity`}
                      aria-label={social.label}
                    >
                      <IconComponent className={isMobile ? "h-4 w-4" : "h-6 w-6"} />
                    </a>
                  );
                })}
                
                {/* Custom icons for TikTok and Snapchat */}
                {storeSettings?.tiktok_url && (
                  <a
                    href={storeSettings.tiktok_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-black hover:opacity-75 transition-opacity"
                    aria-label="تيك توك"
                  >
                    <div className={`bg-black rounded flex items-center justify-center ${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`}>
                      <span className={`text-white font-bold ${isMobile ? 'text-xs' : 'text-sm'}`}>T</span>
                    </div>
                  </a>
                )}
                
                {storeSettings?.snapchat_url && (
                  <a
                    href={storeSettings.snapchat_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-yellow-400 hover:opacity-75 transition-opacity"
                    aria-label="سناب شات"
                  >
                    <div className={`bg-yellow-400 rounded flex items-center justify-center ${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`}>
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
                <h3 className="font-bold text-lg mb-4">روابط سريعة</h3>
                <ul className="space-y-2">
                  <li>
                    <Link to="/" className="text-muted-foreground hover:text-primary">
                      الرئيسية
                    </Link>
                  </li>
                  <li>
                    <Link to="/products" className="text-muted-foreground hover:text-primary">
                      المنتجات
                    </Link>
                  </li>
                  <li>
                    <Link to="/about" className="text-muted-foreground hover:text-primary">
                      من نحن
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" className="text-muted-foreground hover:text-primary">
                      اتصل بنا
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Customer Service */}
              <div>
                <h3 className="font-bold text-lg mb-4">خدمة العملاء</h3>
                <ul className="space-y-2">
                  <li>
                    <Link to="/track" className="text-muted-foreground hover:text-primary">
                      تتبع الطلب
                    </Link>
                  </li>
                  <li>
                    <Link to="/return-policy" className="text-muted-foreground hover:text-primary">
                      سياسة الاسترجاع والاستبدال
                    </Link>
                  </li>
                  <li>
                    <Link to="/shipping" className="text-muted-foreground hover:text-primary">
                      سياسة الشحن
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms" className="text-muted-foreground hover:text-primary">
                      الشروط والأحكام
                    </Link>
                  </li>
                </ul>
              </div>
            </>
          )}

          {/* Contact Info */}
          <div className={isMobile ? 'text-center' : ''}>
            <h3 className={`font-bold mb-2 md:mb-4 ${isMobile ? 'text-sm mobile-warm-text' : 'text-lg'}`}>معلومات التواصل</h3>
            <div className={`space-y-1 md:space-y-3 ${isMobile ? 'text-xs' : ''}`}>
              {storeSettings?.contact_phone && (
                <div className={`flex items-center gap-1 ${isMobile ? 'justify-center mobile-warm-text' : ''}`}>
                  <Phone className={`text-muted-foreground ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                  <span className="text-muted-foreground">{storeSettings.contact_phone}</span>
                </div>
              )}
              {storeSettings?.contact_email && (
                <div className={`flex items-center gap-1 ${isMobile ? 'justify-center mobile-warm-text' : ''}`}>
                  <Mail className={`text-muted-foreground ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                  <span className="text-muted-foreground">{storeSettings.contact_email}</span>
                </div>
              )}
              {storeSettings?.address && (
                <div className={`flex items-center gap-1 ${isMobile ? 'justify-center mobile-warm-text' : ''}`}>
                  <MapPin className={`text-muted-foreground ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                  <span className="text-muted-foreground">{storeSettings.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Quick Links */}
        {isMobile && (
          <div className="mt-4 pt-3 border-t mobile-warm-border">
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <Link to="/track" className="mobile-warm-text hover:text-primary">
                تتبع الطلب
              </Link>
              <Link to="/return-policy" className="mobile-warm-text hover:text-primary">
                سياسة الاسترجاع
              </Link>
              <Link to="/shipping" className="mobile-warm-text hover:text-primary">
                سياسة الشحن
              </Link>
              <Link to="/terms" className="mobile-warm-text hover:text-primary">
                الشروط والأحكام
              </Link>
            </div>
          </div>
        )}

        <div className={`border-t pt-3 md:pt-8 mt-3 md:mt-8 text-center text-muted-foreground ${isMobile ? 'mobile-warm-border text-xs mobile-warm-text' : ''}`}>
          <p>&copy; 2024 {storeSettings?.store_name || 'متجري الإلكتروني'}. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
};

export default StoreFooter;
