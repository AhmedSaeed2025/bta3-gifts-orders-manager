
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import StoreHeader from '@/components/store/StoreHeader';
import ProductGrid from '@/components/store/ProductGrid';
import StoreFooter from '@/components/store/StoreFooter';
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">جاري تحميل المتجر...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <StoreHeader storeSettings={storeSettings} />
      
      <main>
        {/* Simple Hero Section */}
        <section className="py-8 px-4 text-center bg-gray-50">
          <div className="container mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {storeSettings?.store_name || 'متجر بتاع هدايا الأصلى'}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              اكتشف مجموعتنا المتميزة من المنتجات عالية الجودة
            </p>
          </div>
        </section>
        
        {/* Products Section */}
        <section className="py-8 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                منتجاتنا
              </h2>
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
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    لا توجد منتجات متاحة حالياً
                  </h3>
                  <p className="text-gray-600">
                    سيتم إضافة منتجات جديدة قريباً. تابعونا لمعرفة آخر التحديثات
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      
      <StoreFooter storeSettings={storeSettings} />
    </div>
  );
};

export default StorePage;
