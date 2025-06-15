
import React from 'react';
import { Facebook, Instagram, Twitter, Youtube, Linkedin, MessageCircle, Send } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface SocialMediaSectionProps {
  storeSettings: any;
}

const SocialMediaSection = ({ storeSettings }: SocialMediaSectionProps) => {
  const isMobile = useIsMobile();

  const socialLinks = [
    { 
      url: storeSettings?.facebook_url, 
      icon: Facebook, 
      label: 'فيسبوك', 
      color: 'hover:text-blue-600 hover:bg-blue-50',
      bgColor: 'bg-blue-100'
    },
    { 
      url: storeSettings?.instagram_url, 
      icon: Instagram, 
      label: 'انستجرام', 
      color: 'hover:text-pink-600 hover:bg-pink-50',
      bgColor: 'bg-pink-100'
    },
    { 
      url: storeSettings?.twitter_url, 
      icon: Twitter, 
      label: 'تويتر', 
      color: 'hover:text-blue-400 hover:bg-blue-50',
      bgColor: 'bg-blue-100'
    },
    { 
      url: storeSettings?.youtube_url, 
      icon: Youtube, 
      label: 'يوتيوب', 
      color: 'hover:text-red-600 hover:bg-red-50',
      bgColor: 'bg-red-100'
    },
    { 
      url: storeSettings?.linkedin_url, 
      icon: Linkedin, 
      label: 'لينكد إن', 
      color: 'hover:text-blue-700 hover:bg-blue-50',
      bgColor: 'bg-blue-100'
    },
    { 
      url: storeSettings?.whatsapp_catalog_url, 
      icon: MessageCircle, 
      label: 'كتالوج الواتساب', 
      color: 'hover:text-green-600 hover:bg-green-50',
      bgColor: 'bg-green-100'
    },
    { 
      url: storeSettings?.telegram_url, 
      icon: Send, 
      label: 'تلجرام', 
      color: 'hover:text-blue-500 hover:bg-blue-50',
      bgColor: 'bg-blue-100'
    },
  ].filter(link => link.url);

  // Add custom TikTok and Snapchat if URLs exist
  const customSocials = [];
  if (storeSettings?.tiktok_url) {
    customSocials.push({
      url: storeSettings.tiktok_url,
      label: 'تيك توك',
      color: 'hover:text-black hover:bg-gray-50',
      bgColor: 'bg-gray-100',
      custom: (
        <div className="bg-black rounded-full flex items-center justify-center w-6 h-6">
          <span className="text-white font-bold text-sm">T</span>
        </div>
      )
    });
  }

  if (storeSettings?.snapchat_url) {
    customSocials.push({
      url: storeSettings.snapchat_url,
      label: 'سناب شات',
      color: 'hover:text-yellow-500 hover:bg-yellow-50',
      bgColor: 'bg-yellow-100',
      custom: (
        <div className="bg-yellow-400 rounded-full flex items-center justify-center w-6 h-6">
          <span className="text-white font-bold text-sm">S</span>
        </div>
      )
    });
  }

  const allSocials = [...socialLinks, ...customSocials];

  if (allSocials.length === 0) {
    return null;
  }

  return (
    <section className={`py-8 md:py-12 bg-gradient-to-r from-primary/5 to-secondary/5 ${isMobile ? 'px-3' : 'px-4'}`}>
      <div className="container mx-auto text-center">
        <h3 className={`font-bold text-gray-900 mb-6 ${isMobile ? 'text-lg' : 'text-2xl'}`}>
          تابعنا على وسائل التواصل
        </h3>
        <div className="flex justify-center items-center gap-4 flex-wrap">
          {allSocials.map((social, index) => (
            <a
              key={index}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${social.bgColor} ${social.color} p-3 rounded-full transition-all duration-300 transform hover:scale-110 shadow-md hover:shadow-lg`}
              aria-label={social.label}
            >
              {social.custom ? (
                social.custom
              ) : (
                <social.icon className="w-6 h-6" />
              )}
            </a>
          ))}
        </div>
        <p className={`text-gray-600 mt-4 ${isMobile ? 'text-sm' : 'text-base'}`}>
          ابق على اطلاع دائم بأحدث منتجاتنا وعروضنا الحصرية
        </p>
      </div>
    </section>
  );
};

export default SocialMediaSection;
