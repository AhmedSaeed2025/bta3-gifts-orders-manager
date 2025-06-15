
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';
import { ShoppingCart, Eye, Heart, Star } from 'lucide-react';
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
      toast.success("تم إضافة المنتج إلى السلة بنجاح", {
        description: `تم إضافة ${product.name} إلى سلة التسوق`
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error("حدث خطأ في إضافة المنتج إلى السلة");
    }
  };

  const handleOrderNow = async (product: any, selectedSize: string, selectedPrice: number) => {
    try {
      await clearCart();
      await addToCart(product.id, selectedSize, 1, selectedPrice);
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
      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="group animate-pulse overflow-hidden">
            <div className="bg-gradient-to-br from-gray-200 to-gray-300 h-64 rounded-t-md"></div>
            <CardContent className="p-6">
              <div className="h-5 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
      {products.map((product) => {
        const hasDiscount = (product.discount_percentage || 0) > 0;
        const firstSize = product.product_sizes?.[0];
        const originalPrice = firstSize?.price || 0;
        const discountedPrice = hasDiscount ? calculateDiscountedPrice(originalPrice, product.discount_percentage) : originalPrice;

        return (
          <Card key={product.id} className="group hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-white/90 backdrop-blur-sm hover:bg-white">
            <div className="relative overflow-hidden">
              <Link to={`/product/${product.id}`}>
                <img
                  src={product.product_images?.[0]?.image_url || product.image_url || '/placeholder.svg'}
                  alt={product.name}
                  className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </Link>

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Category Badge */}
              {product.categories?.name && (
                <div className="absolute top-3 left-3">
                  <Badge className="bg-white/95 text-gray-800 border-0 shadow-lg backdrop-blur-sm">
                    {product.categories.name}
                  </Badge>
                </div>
              )}

              {/* Discount Badge */}
              {hasDiscount && (
                <div className="absolute top-3 right-3">
                  <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white font-bold border-0 shadow-lg">
                    خصم {product.discount_percentage}%
                  </Badge>
                </div>
              )}

              {/* Wishlist button */}
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button variant="ghost" size="icon" className="bg-white/90 backdrop-blur-sm hover:bg-white">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <CardContent className="p-6 space-y-4">
              <div>
                <Link to={`/product/${product.id}`}>
                  <h3 className="text-xl font-bold mb-2 hover:text-primary transition-colors cursor-pointer line-clamp-1">
                    {product.name}
                  </h3>
                </Link>
                {product.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                )}
                
                {/* Rating display */}
                <div className="flex items-center gap-1 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="text-sm text-gray-500 mr-2">(4.8)</span>
                </div>
              </div>

              {/* Price Display */}
              {storeSettings?.show_product_prices !== false && firstSize && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    {hasDiscount ? (
                      <>
                        <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          {formatCurrency(discountedPrice)}
                        </span>
                        <span className="text-lg text-gray-500 line-through">
                          {formatCurrency(originalPrice)}
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        {formatCurrency(originalPrice)}
                      </span>
                    )}
                  </div>
                  
                  {hasDiscount && (
                    <div className="text-sm text-green-600 font-medium bg-green-50 px-2 py-1 rounded-md inline-block">
                      وفّر {formatCurrency(originalPrice - discountedPrice)}
                    </div>
                  )}
                </div>
              )}

              {/* Size Selection */}
              {product.product_sizes && product.product_sizes.length > 1 && storeSettings?.show_product_sizes !== false && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">المقاس:</Label>
                  <Select
                    value={selectedSizes[product.id] || ''}
                    onValueChange={(size) => handleSizeChange(product.id, size)}
                  >
                    <SelectTrigger className="w-full border-gray-200 focus:border-primary">
                      <SelectValue placeholder="اختر المقاس" />
                    </SelectTrigger>
                    <SelectContent>
                      {product.product_sizes.map((sizeOption: any) => {
                        const sizeOriginalPrice = sizeOption.price;
                        const sizeDiscountedPrice = hasDiscount ? calculateDiscountedPrice(sizeOriginalPrice, product.discount_percentage) : sizeOriginalPrice;
                        
                        return (
                          <SelectItem key={sizeOption.id} value={sizeOption.size}>
                            <div className="flex items-center justify-between w-full">
                              <span className="font-medium">{sizeOption.size}</span>
                              {storeSettings?.show_product_prices !== false && (
                                <div className="flex items-center gap-2 mr-3">
                                  {hasDiscount ? (
                                    <>
                                      <span className="font-bold text-green-600">
                                        {formatCurrency(sizeDiscountedPrice)}
                                      </span>
                                      <span className="text-sm text-gray-500 line-through">
                                        {formatCurrency(sizeOriginalPrice)}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="font-bold text-primary">
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
              )}

              {/* Action Buttons */}
              <div className="pt-2 space-y-3">
                {product.product_sizes?.length > 0 ? (
                  selectedSizes[product.id] || product.product_sizes.length === 1 ? (
                    <div className="flex flex-col gap-3">
                      <Button
                        onClick={() => {
                          const selectedSize = selectedSizes[product.id] || product.product_sizes[0].size;
                          const sizeData = product.product_sizes.find((s: any) => s.size === selectedSize);
                          if (sizeData) {
                            const finalPrice = hasDiscount ? calculateDiscountedPrice(sizeData.price, product.discount_percentage) : sizeData.price;
                            handleOrderNow(product, selectedSize, finalPrice);
                          }
                        }}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        اطلب الآن
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
                        className="w-full border-2 border-primary/20 hover:border-primary hover:bg-primary/5 font-semibold py-3 rounded-lg transition-all duration-300"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        أضف للسلة
                      </Button>
                    </div>
                  ) : (
                    <Link to={`/product/${product.id}`}>
                      <Button variant="outline" className="w-full border-2 border-primary/20 hover:border-primary hover:bg-primary/5 font-semibold py-3 rounded-lg transition-all duration-300">
                        <Eye className="h-4 w-4 mr-2" />
                        عرض التفاصيل
                      </Button>
                    </Link>
                  )
                ) : (
                  <Link to={`/product/${product.id}`}>
                    <Button variant="outline" className="w-full border-2 border-primary/20 hover:border-primary hover:bg-primary/5 font-semibold py-3 rounded-lg transition-all duration-300">
                      <Eye className="h-4 w-4 mr-2" />
                      عرض التفاصيل
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
