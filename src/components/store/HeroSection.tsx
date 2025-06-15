
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface HeroSectionProps {
  storeSettings: any;
}

const HeroSection = ({ storeSettings }: HeroSectionProps) => {
  const isMobile = useIsMobile();

  return (
    <section className={`relative overflow-hidden ${isMobile ? 'py-8 px-3' : 'py-16 px-4'}`}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10"></div>
      
      <div className="container mx-auto relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className={`font-bold mb-4 md:mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-tight ${
            isMobile ? 'text-2xl' : 'text-5xl md:text-6xl'
          }`}>
            {storeSettings?.store_name || 'متجر بتاع هدايا الأصلى'}
          </h1>
          
          {storeSettings?.store_tagline && (
            <p className={`text-gray-600 font-medium mb-4 ${isMobile ? 'text-lg' : 'text-xl md:text-2xl'}`}>
              {storeSettings.store_tagline}
            </p>
          )}
          
          <p className={`text-gray-700 max-w-3xl mx-auto leading-relaxed mb-8 ${
            isMobile ? 'text-sm px-2' : 'text-lg md:text-xl'
          }`}>
            {storeSettings?.about_us || 'اكتشف مجموعتنا المتميزة من الهدايا الأصلية عالية الجودة بأفضل الأسعار'}
          </p>
          
          {storeSettings?.hero_banner_url && (
            <div className={`relative group ${isMobile ? 'mt-6' : 'mt-12'}`}>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur-xl transform scale-105 opacity-50"></div>
              <img
                src={storeSettings.hero_banner_url}
                alt="بانر المتجر"
                className={`relative w-full max-w-5xl mx-auto rounded-2xl shadow-2xl transition-transform duration-300 group-hover:scale-105 ${
                  isMobile ? 'max-h-48 object-cover' : ''
                }`}
                loading="eager"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
