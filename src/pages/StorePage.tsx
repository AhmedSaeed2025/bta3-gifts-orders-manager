
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import StoreHeader from '@/components/store/StoreHeader';
import ProductGrid from '@/components/store/ProductGrid';
import StoreFooter from '@/components/store/StoreFooter';
import HeroSection from '@/components/store/HeroSection';
import CustomerReviews from '@/components/store/CustomerReviews';
import SocialMediaSection from '@/components/store/SocialMediaSection';
import BackToTop from '@/components/store/BackToTop';
import { Loader2, ShoppingBag } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const StorePage = () => {
  const isMobile = useIsMobile();
  
  const { data: storeSettings, isLoading: storeLoading } = useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching store settings:', error);
      }
      
      return data || {
        store_name: 'متجر بتاع هدايا الأصلى',
        primary_color: '#10B981',
        secondary_color: '#059669',
        show_product_prices: true,
        show_product_sizes: true,
        hero_banner_url: null,
        customer_reviews_enabled: true,
        show_back_to_top: true
      };
    }
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (id, name),
          product_sizes (*),
          product_images (*)
        `)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) {
        console.error('Error fetching products:', error);
        return [];
      }
      
      return data || [];
    }
  });

  if (storeLoading || productsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">جاري تحميل المتجر...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <StoreHeader storeSettings={storeSettings} />
      
      <main>
        {/* Hero Section */}
        <HeroSection storeSettings={storeSettings} />
        
        {/* Products Section */}
        <section className={`${isMobile ? 'py-6 px-3' : 'py-12 px-4'}`}>
          <div className="container mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <h2 className={`font-bold text-gray-900 mb-4 ${isMobile ? 'text-xl' : 'text-3xl'}`}>
                منتجاتنا المميزة
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto mb-4"></div>
              <p className={`text-gray-600 max-w-2xl mx-auto ${isMobile ? 'text-sm' : 'text-lg'}`}>
                اختر من بين مجموعتنا الواسعة من المنتجات عالية الجودة
              </p>
            </div>
            
            <ProductGrid 
              products={products || []} 
              isLoading={productsLoading}
            />

            {products && products.length === 0 && !productsLoading && (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="mb-6">
                    <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag className="h-12 w-12 text-gray-400" />
                    </div>
                  </div>
                  <h3 className={`font-semibold text-gray-900 mb-3 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                    لا توجد منتجات متاحة حالياً
                  </h3>
                  <p className={`text-gray-600 ${isMobile ? 'text-sm' : 'text-base'}`}>
                    سيتم إضافة منتجات جديدة قريباً. تابعونا لمعرفة آخر التحديثات
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Customer Reviews Section */}
        <CustomerReviews storeSettings={storeSettings} />
        
        {/* Social Media Section */}
        <SocialMediaSection storeSettings={storeSettings} />
      </main>
      
      <StoreFooter storeSettings={storeSettings} />
      
      {/* Back to Top Button */}
      {storeSettings?.show_back_to_top && <BackToTop />}
    </div>
  );
};

export default StorePage;
