
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface BannersSectionProps {
  storeSettings: any;
}

const BannersSection = ({ storeSettings }: BannersSectionProps) => {
  const isMobile = useIsMobile();

  if (!storeSettings?.enable_banners) {
    return null;
  }

  const BannerImage = ({ 
    src, 
    link, 
    alt, 
    className,
    priority = false
  }: { 
    src?: string; 
    link?: string; 
    alt: string; 
    className?: string;
    priority?: boolean;
  }) => {
    if (!src) return null;

    const imageElement = (
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-transform duration-300 hover:scale-105 ${className || ''}`}
        loading={priority ? "eager" : "lazy"}
      />
    );

    if (link) {
      return (
        <a 
          href={link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block w-full h-full overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
        >
          {imageElement}
        </a>
      );
    }

    return (
      <div className="w-full h-full overflow-hidden rounded-lg shadow-lg">
        {imageElement}
      </div>
    );
  };

  return (
    <section className={`${isMobile ? 'py-4 px-3' : 'py-8 px-4'} bg-gradient-to-br from-gray-50 to-white`}>
      <div className="container mx-auto space-y-6">
        
        {/* Main Promotional Banners */}
        {(storeSettings.promo_banner_1_url || storeSettings.promo_banner_2_url) && (
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            {storeSettings.promo_banner_1_url && (
              <div className={`${isMobile ? 'h-48' : 'h-64'} relative group`}>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg blur-xl transform scale-95 opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative z-10 h-full">
                  <BannerImage
                    src={storeSettings.promo_banner_1_url}
                    link={storeSettings.promo_banner_1_link}
                    alt="بانر ترويجي كبير"
                    priority={true}
                  />
                </div>
              </div>
            )}
            
            {storeSettings.promo_banner_2_url && (
              <div className={`${isMobile ? 'h-48' : 'h-64'} relative group`}>
                <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg blur-xl transform scale-95 opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative z-10 h-full">
                  <BannerImage
                    src={storeSettings.promo_banner_2_url}
                    link={storeSettings.promo_banner_2_link}
                    alt="بانر ترويجي ثاني"
                    priority={true}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Side Banners */}
        {!isMobile && (storeSettings.side_banner_1_url || storeSettings.side_banner_2_url) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              {/* Content placeholder or other components can go here */}
            </div>
            
            {storeSettings.side_banner_1_url && (
              <div className="h-80 relative group">
                <div className="absolute inset-0 bg-gradient-to-b from-secondary/10 to-accent/10 rounded-lg blur-xl transform scale-95 opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative z-10 h-full">
                  <BannerImage
                    src={storeSettings.side_banner_1_url}
                    link={storeSettings.side_banner_1_link}
                    alt="بانر جانبي طويل"
                  />
                </div>
              </div>
            )}
            
            {storeSettings.side_banner_2_url && (
              <div className="h-80 relative group">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-secondary/10 rounded-lg blur-xl transform scale-95 opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative z-10 h-full">
                  <BannerImage
                    src={storeSettings.side_banner_2_url}
                    link={storeSettings.side_banner_2_link}
                    alt="بانر جانبي ثاني"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mobile Side Banners */}
        {isMobile && (storeSettings.side_banner_1_url || storeSettings.side_banner_2_url) && (
          <div className="grid grid-cols-2 gap-3">
            {storeSettings.side_banner_1_url && (
              <div className="h-40 relative group">
                <BannerImage
                  src={storeSettings.side_banner_1_url}
                  link={storeSettings.side_banner_1_link}
                  alt="بانر جانبي"
                />
              </div>
            )}
            
            {storeSettings.side_banner_2_url && (
              <div className="h-40 relative group">
                <BannerImage
                  src={storeSettings.side_banner_2_url}
                  link={storeSettings.side_banner_2_link}
                  alt="بانر جانبي ثاني"
                />
              </div>
            )}
          </div>
        )}

        {/* Footer Banner */}
        {storeSettings.footer_banner_url && (
          <div className={`${isMobile ? 'h-32' : 'h-48'} relative group mt-8`}>
            <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-primary/10 to-secondary/10 rounded-lg blur-xl transform scale-95 opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div className="relative z-10 h-full">
              <BannerImage
                src={storeSettings.footer_banner_url}
                link={storeSettings.footer_banner_link}
                alt="بانر أسفل الصفحة"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default BannersSection;
