
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';
import { ShoppingCart, Eye, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProductGridProps {
  products: any[];
  isLoading: boolean;
}

const ProductGrid = ({ products, isLoading }: ProductGridProps) => {
  const { addToCart, clearCart } = useCart();
  const [selectedSizes, setSelectedSizes] = useState<{ [productId: string]: string }>({});
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Fetch store settings to check display preferences
  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings-display'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('show_product_prices, show_product_sizes')
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching store settings:', error);
      }
      
      return data || { show_product_prices: true, show_product_sizes: true };
    }
  });

  const handleSizeChange = (productId: string, size: string) => {
    setSelectedSizes(prev => ({
      ...prev,
      [productId]: size
    }));
  };

  const handleAddToCart = async (product: any, selectedSize: string, selectedPrice: number) => {
    try {
      await addToCart(product.id, selectedSize, 1, selectedPrice);
      toast.success("تم إضافة المنتج إلى السلة");
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error("حدث خطأ في إضافة المنتج إلى السلة");
    }
  };

  const handleOrderNow = async (product: any, selectedSize: string, selectedPrice: number) => {
    try {
      // Clear cart and add only this item
      await clearCart();
      await addToCart(product.id, selectedSize, 1, selectedPrice);
      
      // Navigate to order page
      navigate('/order');
    } catch (error) {
      console.error('Error processing order:', error);
      toast.error("حدث خطأ في معالجة الطلب");
    }
  };

  const calculateDiscountedPrice = (originalPrice: number, discountPercentage: number) => {
    return originalPrice * (1 - discountPercentage / 100);
  };

  if (isLoading) {
    return (
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-2 px-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'}`}>
        {[...Array(8)].map((_, i) => (
          <Card key={i} className={`animate-pulse ${isMobile ? 'mobile-warm-card' : ''}`}>
            <div className={`bg-gray-200 rounded-t-md ${isMobile ? 'h-40' : 'h-64'}`}></div>
            <CardContent className={isMobile ? 'p-2' : 'p-4'}>
              <div className={`h-4 bg-gray-200 rounded ${isMobile ? 'mb-1' : 'mb-2'}`}></div>
              <div className={`h-3 bg-gray-200 rounded ${isMobile ? 'mb-2' : 'mb-4'}`}></div>
              <div className={`bg-gray-200 rounded ${isMobile ? 'h-8' : 'h-10'}`}></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${isMobile ? 'grid-cols-2 px-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'}`}>
      {products.map((product) => {
        const hasDiscount = (product.discount_percentage || 0) > 0;
        const firstSize = product.product_sizes?.[0];
        const originalPrice = firstSize?.price || 0;
        const discountedPrice = hasDiscount ? calculateDiscountedPrice(originalPrice, product.discount_percentage) : originalPrice;

        return (
          <Card key={product.id} className={`group hover:shadow-xl transition-all duration-300 overflow-hidden border-0 shadow-md ${isMobile ? 'mobile-warm-card' : ''}`}>
            <div className="relative">
              <Link to={`/product/${product.id}`}>
                <img
                  src={product.product_images?.[0]?.image_url || product.image_url || '/placeholder.svg'}
                  alt={product.name}
                  className={`w-full object-cover transition-transform duration-300 group-hover:scale-105 ${isMobile ? 'h-40' : 'h-64'}`}
                />
                
                {/* Overlay for better visibility */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
                  <div className="bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100">
                    <Eye className={isMobile ? "h-4 w-4 text-gray-700" : "h-5 w-5 text-gray-700"} />
                  </div>
                </div>
              </Link>

              {/* Badges */}
              <div className={`absolute flex flex-col gap-1 ${isMobile ? 'top-1 left-1' : 'top-3 left-3 gap-2'}`}>
                {product.categories?.name && (
                  <Badge className={`bg-white/90 text-gray-800 hover:bg-white ${isMobile ? 'text-xs px-1 py-0' : ''}`}>
                    {product.categories.name}
                  </Badge>
                )}
                {product.featured && (
                  <Badge className={`bg-gradient-to-r from-yellow-400 to-yellow-600 text-white ${isMobile ? 'text-xs px-1 py-0' : ''}`}>
                    <Star className={isMobile ? "h-2 w-2 mr-1" : "h-3 w-3 mr-1"} />
                    {isMobile ? 'مميز' : 'مميز'}
                  </Badge>
                )}
              </div>

              {/* Discount Badge */}
              {hasDiscount && (
                <div className={`absolute ${isMobile ? 'top-1 right-1' : 'top-3 right-3'}`}>
                  <Badge className={`bg-red-500 text-white font-bold ${isMobile ? 'text-xs px-1 py-0' : ''}`}>
                    خصم {product.discount_percentage}%
                  </Badge>
                </div>
              )}
            </div>
            
            <CardContent className={`space-y-2 ${isMobile ? 'p-2' : 'p-4 space-y-4'}`}>
              <div>
                <Link to={`/product/${product.id}`}>
                  <h3 className={`font-bold mb-1 hover:text-primary transition-colors cursor-pointer line-clamp-1 ${isMobile ? 'text-sm' : 'text-lg mb-2'}`}>
                    {product.name}
                  </h3>
                </Link>
                {product.description && !isMobile && (
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Price Display */}
              {storeSettings?.show_product_prices !== false && firstSize && (
                <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
                  <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-2'}`}>
                    {hasDiscount ? (
                      <>
                        <span className={`font-bold text-green-600 ${isMobile ? 'text-sm' : 'text-2xl'}`}>
                          {formatCurrency(discountedPrice)}
                        </span>
                        <span className={`text-gray-500 line-through ${isMobile ? 'text-xs' : 'text-lg'}`}>
                          {formatCurrency(originalPrice)}
                        </span>
                      </>
                    ) : (
                      <span className={`font-bold text-primary ${isMobile ? 'text-sm' : 'text-2xl'}`}>
                        {formatCurrency(originalPrice)}
                      </span>
                    )}
                  </div>
                  
                  {hasDiscount && !isMobile && (
                    <div className="text-sm text-green-600 font-medium">
                      وفّر {formatCurrency(originalPrice - discountedPrice)}
                    </div>
                  )}
                </div>
              )}

              {/* Size Selection - مبسط للموبايل */}
              {product.product_sizes && product.product_sizes.length > 1 && storeSettings?.show_product_sizes !== false && (
                <div className={isMobile ? 'space-y-1' : 'space-y-3'}>
                  <div>
                    <Label className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>المقاس:</Label>
                    <Select
                      value={selectedSizes[product.id] || ''}
                      onValueChange={(size) => handleSizeChange(product.id, size)}
                    >
                      <SelectTrigger className={`w-full mt-1 ${isMobile ? 'h-8 text-xs' : ''}`}>
                        <SelectValue placeholder="اختر المقاس" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border mobile-warm-border z-50">
                        {product.product_sizes.map((sizeOption: any) => {
                          const sizeOriginalPrice = sizeOption.price;
                          const sizeDiscountedPrice = hasDiscount ? calculateDiscountedPrice(sizeOriginalPrice, product.discount_percentage) : sizeOriginalPrice;
                          
                          return (
                            <SelectItem key={sizeOption.id} value={sizeOption.size} className="hover:mobile-warm-button">
                              <div className="flex items-center justify-between w-full">
                                <span className={isMobile ? 'text-xs' : ''}>{sizeOption.size}</span>
                                {storeSettings?.show_product_prices !== false && (
                                  <div className={`flex items-center gap-1 mr-2 ${isMobile ? 'gap-1' : 'gap-2 mr-3'}`}>
                                    {hasDiscount ? (
                                      <>
                                        <span className={`font-bold text-green-600 ${isMobile ? 'text-xs' : ''}`}>
                                          {formatCurrency(sizeDiscountedPrice)}
                                        </span>
                                        <span className={`text-gray-500 line-through ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                          {formatCurrency(sizeOriginalPrice)}
                                        </span>
                                      </>
                                    ) : (
                                      <span className={`font-bold ${isMobile ? 'text-xs' : ''}`}>
                                        {formatCurrency(sizeOriginalPrice)}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className={`pt-1 ${isMobile ? 'space-y-1' : 'space-y-2 pt-2'}`}>
                {product.product_sizes?.length > 0 ? (
                  selectedSizes[product.id] || product.product_sizes.length === 1 ? (
                    <div className={isMobile ? 'flex gap-1' : 'flex flex-col gap-2'}>
                      <Button
                        onClick={() => {
                          const selectedSize = selectedSizes[product.id] || product.product_sizes[0].size;
                          const sizeData = product.product_sizes.find((s: any) => s.size === selectedSize);
                          if (sizeData) {
                            const finalPrice = hasDiscount ? calculateDiscountedPrice(sizeData.price, product.discount_percentage) : sizeData.price;
                            handleOrderNow(product, selectedSize, finalPrice);
                          }
                        }}
                        className={`bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 ${isMobile ? 'flex-1 h-8 text-xs px-2' : 'w-full'}`}
                      >
                        {isMobile ? 'اطلب' : 'اطلب الآن'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const selectedSize = selectedSizes[product.id] || product.product_sizes[0].size;
                          const sizeData = product.product_sizes.find((s: any) => s.size === selectedSize);
                          if (sizeData) {
                            const finalPrice = hasDiscount ? calculateDiscountedPrice(sizeData.price, product.discount_percentage) : sizeData.price;
                            handleAddToCart(product, selectedSize, finalPrice);
                          }
                        }}
                        className={`border-2 hover:bg-gray-50 ${isMobile ? 'flex-1 h-8 text-xs px-1 mobile-warm-border' : 'w-full'}`}
                      >
                        <ShoppingCart className={isMobile ? "h-3 w-3" : "h-4 w-4 mr-2"} />
                        {isMobile ? '' : 'أضف للسلة'}
                      </Button>
                    </div>
                  ) : (
                    <Link to={`/product/${product.id}`}>
                      <Button variant="outline" className={`mobile-warm-border hover:mobile-warm-button ${isMobile ? 'w-full h-8 text-xs' : 'w-full'}`}>
                        <Eye className={isMobile ? "h-3 w-3 mr-1" : "h-4 w-4 mr-2"} />
                        {isMobile ? 'التفاصيل' : 'عرض التفاصيل'}
                      </Button>
                    </Link>
                  )
                ) : (
                  <Link to={`/product/${product.id}`}>
                    <Button variant="outline" className={`mobile-warm-border hover:mobile-warm-button ${isMobile ? 'w-full h-8 text-xs' : 'w-full'}`}>
                      <Eye className={isMobile ? "h-3 w-3 mr-1" : "h-4 w-4 mr-2"} />
                      {isMobile ? 'التفاصيل' : 'عرض التفاصيل'}
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ProductGrid;
