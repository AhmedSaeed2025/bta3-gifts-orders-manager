
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';
import { Star } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface RelatedProductsProps {
  currentProductId: string;
  categoryId: string | null;
}

const RelatedProducts = ({ currentProductId, categoryId }: RelatedProductsProps) => {
  const isMobile = useIsMobile();

  const { data: relatedProducts, isLoading } = useQuery({
    queryKey: ['related-products', currentProductId, categoryId],
    queryFn: async () => {
      if (!categoryId) return [];

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_sizes (*),
          product_images (*)
        `)
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .neq('id', currentProductId)
        .limit(4);
      
      if (error) {
        console.error('Error fetching related products:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!categoryId
  });

  // Fetch store settings for price display
  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings-related'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('show_product_prices')
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching store settings:', error);
      }
      
      return data || { show_product_prices: true };
    }
  });

  if (isLoading || !relatedProducts || relatedProducts.length === 0) {
    return null;
  }

  const calculateDiscountedPrice = (originalPrice: number, discountPercentage: number) => {
    return originalPrice * (1 - discountPercentage / 100);
  };

  return (
    <div className={`${isMobile ? 'py-6 px-3' : 'py-8 px-4'}`}>
      <div className="container mx-auto">
        <div className="text-center mb-6">
          <h2 className={`font-bold text-gray-900 mb-2 ${isMobile ? 'text-lg' : 'text-2xl'}`}>
            منتجات مشابهة
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-primary to-secondary mx-auto"></div>
        </div>

        <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
          {relatedProducts.map((product) => {
            const hasDiscount = (product.discount_percentage || 0) > 0;
            const firstSize = product.product_sizes?.[0];
            const originalPrice = firstSize?.price || 0;
            const discountedPrice = hasDiscount ? calculateDiscountedPrice(originalPrice, product.discount_percentage) : originalPrice;

            return (
              <Link key={product.id} to={`/product/${product.id}`}>
                <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-0 shadow-md">
                  <div className="relative">
                    <img
                      src={product.product_images?.[0]?.image_url || product.image_url || '/placeholder.svg'}
                      alt={product.name}
                      className={`w-full object-cover transition-transform duration-300 group-hover:scale-105 ${isMobile ? 'h-32' : 'h-48'}`}
                    />
                    
                    {/* Badges */}
                    <div className={`absolute flex flex-col gap-1 ${isMobile ? 'top-1 left-1' : 'top-2 left-2'}`}>
                      {product.featured && (
                        <Badge className={`bg-gradient-to-r from-yellow-400 to-yellow-600 text-white ${isMobile ? 'text-xs px-1 py-0.5' : 'text-xs px-2 py-1'}`}>
                          <Star className={isMobile ? "h-2 w-2 mr-0.5" : "h-3 w-3 mr-1"} />
                          مميز
                        </Badge>
                      )}
                    </div>

                    {/* Discount Badge */}
                    {hasDiscount && (
                      <div className={`absolute ${isMobile ? 'top-1 right-1' : 'top-2 right-2'}`}>
                        <Badge className={`bg-red-500 text-white font-bold ${isMobile ? 'text-xs px-1 py-0.5' : 'text-xs px-2 py-1'}`}>
                          خصم {product.discount_percentage}%
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <CardContent className={`space-y-2 ${isMobile ? 'p-2' : 'p-3'}`}>
                    <h3 className={`font-semibold line-clamp-2 hover:text-primary transition-colors ${isMobile ? 'text-sm' : 'text-base'}`}>
                      {product.name}
                    </h3>

                    {/* Price Display */}
                    {storeSettings?.show_product_prices !== false && firstSize && (
                      <div className="flex items-center gap-2">
                        {hasDiscount ? (
                          <>
                            <span className={`font-bold text-green-600 ${isMobile ? 'text-sm' : 'text-lg'}`}>
                              {formatCurrency(discountedPrice)}
                            </span>
                            <span className={`text-gray-500 line-through ${isMobile ? 'text-xs' : 'text-sm'}`}>
                              {formatCurrency(originalPrice)}
                            </span>
                          </>
                        ) : (
                          <span className={`font-bold text-primary ${isMobile ? 'text-sm' : 'text-lg'}`}>
                            {formatCurrency(originalPrice)}
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RelatedProducts;
