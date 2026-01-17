import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import StoreHeader from '@/components/store/StoreHeader';
import ProductGrid from '@/components/store/ProductGrid';
import StoreFooter from '@/components/store/StoreFooter';
import HeroSection from '@/components/store/HeroSection';
import CustomerReviews from '@/components/store/CustomerReviews';
import SocialMediaSection from '@/components/store/SocialMediaSection';
import BannersSection from '@/components/store/BannersSection';
import BackToTop from '@/components/store/BackToTop';
import { Loader2, ShoppingBag } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const StorePage = () => {
  const isMobile = useIsMobile();
  
  const { data: storeSettings, isLoading: storeLoading, isError: storeError } = useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching store settings:', error);
        // Return default settings on error
        return null;
      }
      
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Default store settings
  const defaultSettings = {
    store_name: 'متجر بتاع هدايا الأصلى',
    primary_color: '#10B981',
    secondary_color: '#059669',
    accent_color: '#F59E0B',
    text_color: '#1F2937',
    show_product_prices: true,
    show_product_sizes: true,
    hero_banner_url: null,
    customer_reviews_enabled: true,
    show_back_to_top: true,
    enable_banners: true
  };

  const activeSettings = storeSettings || defaultSettings;

  const { data: categoriesWithProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['categories-with-products'],
    queryFn: async () => {
      // First get all active categories
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });
      
      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        return [];
      }

      // Get all active products with their relationships
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          categories (id, name),
          product_sizes (*),
          product_images (*)
        `)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (productsError) {
        console.error('Error fetching products:', productsError);
        return [];
      }

      // Group products by category
      const categorizedProducts = categories?.map(category => ({
        ...category,
        products: products?.filter(product => product.category_id === category.id) || []
      })) || [];

      // Add uncategorized products
      const uncategorizedProducts = products?.filter(product => !product.category_id) || [];
      if (uncategorizedProducts.length > 0) {
        categorizedProducts.push({
          id: 'uncategorized',
          name: 'منتجات أخرى',
          description: null,
          is_active: true,
          created_at: '',
          user_id: '',
          products: uncategorizedProducts
        });
      }

      return categorizedProducts.filter(category => category.products.length > 0);
    }
  });

  // Apply custom colors to CSS variables
  React.useEffect(() => {
    if (activeSettings) {
      const root = document.documentElement;
      if (activeSettings.primary_color) {
        root.style.setProperty('--primary-color', activeSettings.primary_color);
      }
      if (activeSettings.secondary_color) {
        root.style.setProperty('--secondary-color', activeSettings.secondary_color);
      }
      if (activeSettings.accent_color) {
        root.style.setProperty('--accent-color', activeSettings.accent_color);
      }
      if (activeSettings.text_color) {
        root.style.setProperty('--text-color', activeSettings.text_color);
      }
    }
  }, [activeSettings]);

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
      <StoreHeader storeSettings={activeSettings} />
      
      <main>
        {/* Hero Section */}
        <HeroSection storeSettings={activeSettings} />
        
        {/* Promotional Banners Section */}
        <BannersSection storeSettings={activeSettings} />
        
        {/* Products Section by Categories */}
        <section className={`${isMobile ? 'py-6 px-3' : 'py-12 px-4'}`}>
          <div className="container mx-auto">
            {categoriesWithProducts && categoriesWithProducts.length > 0 ? (
              <div className="space-y-12">
                {categoriesWithProducts.map((category) => (
                  <div key={category.id} className="space-y-6">
                    <div className="text-center">
                      <h2 className={`font-bold text-gray-900 mb-2 ${isMobile ? 'text-xl' : 'text-2xl'}`} style={{ color: 'var(--text-color, #1F2937)' }}>
                        {category.name}
                      </h2>
                      {category.description && (
                        <p className={`text-gray-600 max-w-2xl mx-auto mb-4 ${isMobile ? 'text-sm' : 'text-base'}`}>
                          {category.description}
                        </p>
                      )}
                      <div className="w-24 h-1 mx-auto mb-6" style={{ background: `linear-gradient(to right, var(--primary-color, #10B981), var(--secondary-color, #059669))` }}></div>
                    </div>
                    
                    <ProductGrid 
                      products={category.products} 
                      isLoading={false}
                    />
                  </div>
                ))}
              </div>
            ) : (
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
        <CustomerReviews storeSettings={activeSettings} />
        
        {/* Social Media Section */}
        <SocialMediaSection storeSettings={activeSettings} />
      </main>
      
      <StoreFooter />
      
      {/* Back to Top Button */}
      {activeSettings?.show_back_to_top && <BackToTop />}
    </div>
  );
};

export default StorePage;
