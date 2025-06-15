
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import StoreHeader from '@/components/store/StoreHeader';
import ProductGrid from '@/components/store/ProductGrid';
import StoreFooter from '@/components/store/StoreFooter';
import { Loader2 } from 'lucide-react';
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
        hero_banner_url: null
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

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
      
      return data || [];
    }
  });

  if (storeLoading || productsLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isMobile ? 'mobile-warm-bg' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className={`${isMobile ? 'mobile-warm-text text-sm' : 'text-gray-600'}`}>جاري تحميل المنتجات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isMobile ? 'mobile-warm-bg' : 'bg-gradient-to-br from-gray-50 to-white'}`}>
      <StoreHeader storeSettings={storeSettings} />
      <main className={`container mx-auto px-2 md:px-4 py-4 md:py-8 ${isMobile ? 'max-w-full' : ''}`}>
        <div className={`text-center mb-6 md:mb-12 ${isMobile ? 'px-2' : ''}`}>
          <h1 className={`font-bold text-foreground mb-3 md:mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent ${isMobile ? 'text-2xl' : 'text-5xl'}`}>
            {storeSettings?.store_name || 'متجر بتاع هدايا الأصلى'}
          </h1>
          <p className={`text-muted-foreground max-w-3xl mx-auto leading-relaxed ${isMobile ? 'text-sm px-2' : 'text-xl'}`}>
            اكتشف مجموعتنا المتميزة من الهدايا الأصلية عالية الجودة بأفضل الأسعار
          </p>
          
          {storeSettings?.hero_banner_url && (
            <div className={`mt-4 md:mt-8 mb-6 md:mb-12 ${isMobile ? 'px-2' : ''}`}>
              <img
                src={storeSettings.hero_banner_url}
                alt="بانر المتجر"
                className={`w-full max-w-4xl mx-auto rounded-xl md:rounded-2xl shadow-lg md:shadow-2xl ${isMobile ? 'max-h-48 object-cover' : ''}`}
                loading="lazy"
              />
            </div>
          )}
        </div>
        
        <div className={isMobile ? 'px-1' : ''}>
          <ProductGrid 
            products={products || []} 
            isLoading={productsLoading}
          />
        </div>

        {products && products.length === 0 && !productsLoading && (
          <div className={`text-center py-8 md:py-16 ${isMobile ? 'px-4' : ''}`}>
            <div className="max-w-md mx-auto">
              <div className="mb-4 md:mb-6">
                <div className={`bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 ${isMobile ? 'w-16 h-16' : 'w-24 h-24'}`}>
                  <Loader2 className={`text-gray-400 ${isMobile ? 'h-8 w-8' : 'h-12 w-12'}`} />
                </div>
              </div>
              <h3 className={`font-semibold text-gray-900 mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>لا توجد منتجات متاحة حالياً</h3>
              <p className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>سيتم إضافة منتجات جديدة قريباً</p>
            </div>
          </div>
        )}
      </main>
      <StoreFooter storeSettings={storeSettings} />
    </div>
  );
};

export default StorePage;
