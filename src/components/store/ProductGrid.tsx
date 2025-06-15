
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';
import { ShoppingCart, Eye } from 'lucide-react';
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="bg-gray-200 h-64 rounded-t-md"></div>
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => {
        const hasDiscount = (product.discount_percentage || 0) > 0;
        const firstSize = product.product_sizes?.[0];
        const originalPrice = firstSize?.price || 0;
        const discountedPrice = hasDiscount ? calculateDiscountedPrice(originalPrice, product.discount_percentage) : originalPrice;

        return (
          <Card key={product.id} className="group hover:shadow-lg transition-shadow duration-300">
            <div className="relative">
              <Link to={`/product/${product.id}`}>
                <img
                  src={product.product_images?.[0]?.image_url || product.image_url || '/placeholder.svg'}
                  alt={product.name}
                  className="w-full h-64 object-cover"
                />
              </Link>

              {/* Category Badge */}
              {product.categories?.name && (
                <div className="absolute top-3 left-3">
                  <Badge className="bg-white/90 text-gray-800">
                    {product.categories.name}
                  </Badge>
                </div>
              )}

              {/* Discount Badge */}
              {hasDiscount && (
                <div className="absolute top-3 right-3">
                  <Badge className="bg-red-500 text-white font-bold">
                    خصم {product.discount_percentage}%
                  </Badge>
                </div>
              )}
            </div>
            
            <CardContent className="p-4 space-y-4">
              <div>
                <Link to={`/product/${product.id}`}>
                  <h3 className="text-lg font-bold mb-2 hover:text-primary transition-colors cursor-pointer">
                    {product.name}
                  </h3>
                </Link>
                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Price Display */}
              {storeSettings?.show_product_prices !== false && firstSize && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {hasDiscount ? (
                      <>
                        <span className="text-2xl font-bold text-green-600">
                          {formatCurrency(discountedPrice)}
                        </span>
                        <span className="text-lg text-gray-500 line-through">
                          {formatCurrency(originalPrice)}
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(originalPrice)}
                      </span>
                    )}
                  </div>
                  
                  {hasDiscount && (
                    <div className="text-sm text-green-600 font-medium">
                      وفّر {formatCurrency(originalPrice - discountedPrice)}
                    </div>
                  )}
                </div>
              )}

              {/* Size Selection */}
              {product.product_sizes && product.product_sizes.length > 1 && storeSettings?.show_product_sizes !== false && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">المقاس:</Label>
                  <Select
                    value={selectedSizes[product.id] || ''}
                    onValueChange={(size) => handleSizeChange(product.id, size)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="اختر المقاس" />
                    </SelectTrigger>
                    <SelectContent>
                      {product.product_sizes.map((sizeOption: any) => {
                        const sizeOriginalPrice = sizeOption.price;
                        const sizeDiscountedPrice = hasDiscount ? calculateDiscountedPrice(sizeOriginalPrice, product.discount_percentage) : sizeOriginalPrice;
                        
                        return (
                          <SelectItem key={sizeOption.id} value={sizeOption.size}>
                            <div className="flex items-center justify-between w-full">
                              <span>{sizeOption.size}</span>
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
                                    <span className="font-bold">
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
              <div className="pt-2 space-y-2">
                {product.product_sizes?.length > 0 ? (
                  selectedSizes[product.id] || product.product_sizes.length === 1 ? (
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => {
                          const selectedSize = selectedSizes[product.id] || product.product_sizes[0].size;
                          const sizeData = product.product_sizes.find((s: any) => s.size === selectedSize);
                          if (sizeData) {
                            const finalPrice = hasDiscount ? calculateDiscountedPrice(sizeData.price, product.discount_percentage) : sizeData.price;
                            handleOrderNow(product, selectedSize, finalPrice);
                          }
                        }}
                        className="w-full bg-green-600 hover:bg-green-700"
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
                        className="w-full"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        أضف للسلة
                      </Button>
                    </div>
                  ) : (
                    <Link to={`/product/${product.id}`}>
                      <Button variant="outline" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        عرض التفاصيل
                      </Button>
                    </Link>
                  )
                ) : (
                  <Link to={`/product/${product.id}`}>
                    <Button variant="outline" className="w-full">
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
