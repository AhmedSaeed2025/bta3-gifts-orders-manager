
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import StoreHeader from '@/components/store/StoreHeader';
import ProductGrid from '@/components/store/ProductGrid';
import StoreFooter from '@/components/store/StoreFooter';
import HeroSection from '@/components/store/HeroSection';
import SocialMediaSection from '@/components/store/SocialMediaSection';
import CustomerReviews from '@/components/store/CustomerReviews';
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-6" />
            <div className="absolute inset-0 h-16 w-16 border-4 border-primary/20 rounded-full mx-auto animate-pulse"></div>
          </div>
          <p className="text-xl font-semibold text-gray-700 mb-2">جاري تحميل المتجر...</p>
          <p className="text-gray-500">من فضلك انتظر قليلاً</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <StoreHeader storeSettings={storeSettings} />
      
      <main className="relative">
        {/* Hero Section */}
        <HeroSection storeSettings={storeSettings} />
        
        {/* Products Section */}
        <section className={`relative ${isMobile ? 'py-8 px-3' : 'py-16 px-4'}`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10"></div>
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.1) 1px, transparent 0)`,
              backgroundSize: '20px 20px'
            }}></div>
          </div>
          
          <div className="container mx-auto relative z-10">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-4">
                <ShoppingBag className="h-8 w-8 text-primary" />
              </div>
              <h2 className={`font-bold text-gray-900 mb-4 ${isMobile ? 'text-2xl' : 'text-4xl'}`}>
                منتجاتنا المميزة
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto mb-4 rounded-full"></div>
              <p className={`text-gray-600 max-w-2xl mx-auto ${isMobile ? 'text-base' : 'text-lg'}`}>
                اكتشف مجموعتنا الحصرية من أفضل المنتجات بجودة عالية وأسعار تنافسية
              </p>
            </div>
            
            <ProductGrid 
              products={products || []} 
              isLoading={productsLoading}
            />

            {products && products.length === 0 && !productsLoading && (
              <div className="text-center py-20">
                <div className="max-w-md mx-auto">
                  <div className="relative mb-8">
                    <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6 relative overflow-hidden">
                      <ShoppingBag className="h-16 w-16 text-primary/60" />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-pulse"></div>
                    </div>
                  </div>
                  <h3 className={`font-bold text-gray-900 mb-4 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                    قريباً.. منتجات رائعة في الطريق إليكم
                  </h3>
                  <p className={`text-gray-600 leading-relaxed ${isMobile ? 'text-sm' : 'text-base'}`}>
                    نحن نعمل بجد لإضافة أفضل المنتجات لمتجرنا. تابعونا على وسائل التواصل الاجتماعي لمعرفة آخر التحديثات والعروض الحصرية
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
        
        {/* Customer Reviews Section */}
        <CustomerReviews />
        
        {/* Social Media Section */}
        <SocialMediaSection storeSettings={storeSettings} />
      </main>
      
      <StoreFooter storeSettings={storeSettings} />
      <BackToTop />
    </div>
  );
};

export default StorePage;
