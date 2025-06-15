
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { Loader2, ArrowLeft, Heart, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import ProductImageGallery from '@/components/product/ProductImageGallery';
import RelatedProducts from '@/components/product/RelatedProducts';

const ProductPage = () => {
  const { id } = useParams();
  const { addToCart, loading: cartLoading } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Fetch store settings to check if prices should be shown
  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings-product-page'],
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

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_sizes (*),
          product_images (*),
          categories (id, name)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Apply custom colors to CSS variables
  React.useEffect(() => {
    const loadStoreColors = async () => {
      const { data: colorSettings } = await supabase
        .from('store_settings')
        .select('primary_color, secondary_color, accent_color, text_color')
        .eq('is_active', true)
        .single();

      if (colorSettings) {
        const root = document.documentElement;
        if (colorSettings.primary_color) {
          root.style.setProperty('--primary-color', colorSettings.primary_color);
        }
        if (colorSettings.secondary_color) {
          root.style.setProperty('--secondary-color', colorSettings.secondary_color);
        }
        if (colorSettings.accent_color) {
          root.style.setProperty('--accent-color', colorSettings.accent_color);
        }
        if (colorSettings.text_color) {
          root.style.setProperty('--text-color', colorSettings.text_color);
        }
      }
    };

    loadStoreColors();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">المنتج غير موجود</h1>
                <Link to="/">
                  <Button>العودة للمتجر</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const selectedSizeData = product.product_sizes?.find(size => size.size === selectedSize);
  const hasDiscount = (product.discount_percentage || 0) > 0;

  const calculateDiscountedPrice = (originalPrice: number) => {
    return originalPrice * (1 - (product.discount_percentage || 0) / 100);
  };

  const handleAddToCart = async () => {
    console.log('Add to cart clicked', { product: product.id, selectedSize, quantity });
    
    // Validation for size selection if sizes exist
    if (product.product_sizes && product.product_sizes.length > 0 && !selectedSize) {
      toast.error('يرجى اختيار المقاس');
      return;
    }

    if (!selectedSizeData && product.product_sizes && product.product_sizes.length > 0) {
      toast.error('المقاس المحدد غير متوفر');
      return;
    }

    // Prevent multiple simultaneous add to cart actions
    if (isAddingToCart || cartLoading) {
      return;
    }

    try {
      setIsAddingToCart(true);
      
      // Determine price to use
      let priceToUse = 0;
      if (selectedSizeData) {
        priceToUse = selectedSizeData.price;
      } else if (product.product_sizes && product.product_sizes.length > 0) {
        // If no size selected but sizes exist, use first size price
        priceToUse = product.product_sizes[0].price;
      }

      const finalPrice = hasDiscount ? calculateDiscountedPrice(priceToUse) : priceToUse;
      
      console.log('Adding to cart with data:', {
        productId: product.id,
        size: selectedSize || 'default',
        quantity,
        price: finalPrice
      });

      await addToCart(product.id, selectedSize || 'default', quantity, finalPrice);
      toast.success('تم إضافة المنتج إلى السلة بنجاح');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('حدث خطأ في إضافة المنتج للسلة');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Auto-select first size if only one size available
  React.useEffect(() => {
    if (product?.product_sizes && product.product_sizes.length === 1 && !selectedSize) {
      setSelectedSize(product.product_sizes[0].size);
    }
  }, [product?.product_sizes, selectedSize]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            العودة للمتجر
          </Link>
          {product.categories && (
            <>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">{product.categories.name}</span>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div>
            <ProductImageGallery
              images={product.product_images || []}
              videoUrl={product.video_url}
              productName={product.name}
            />
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold" style={{ color: 'var(--text-color, #1F2937)' }}>{product.name}</h1>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                {product.featured && (
                  <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
                    منتج مميز
                  </Badge>
                )}
                
                {hasDiscount && (
                  <Badge className="bg-red-500 text-white font-bold">
                    خصم {product.discount_percentage}%
                  </Badge>
                )}
              </div>

              {product.description && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2 text-lg" style={{ color: 'var(--text-color, #1F2937)' }}>وصف المنتج</h3>
                  <p className="text-muted-foreground leading-relaxed text-base whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>
              )}
            </div>

            {/* Size Selection */}
            {product.product_sizes && product.product_sizes.length > 0 && storeSettings?.show_product_sizes !== false && (
              <div>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--text-color, #1F2937)' }}>اختر المقاس</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {product.product_sizes.map((size) => {
                    const originalPrice = size.price;
                    const discountedPrice = hasDiscount ? calculateDiscountedPrice(originalPrice) : originalPrice;
                    
                    return (
                      <Button
                        key={size.id}
                        variant={selectedSize === size.size ? "default" : "outline"}
                        onClick={() => setSelectedSize(size.size)}
                        className="h-16 p-2"
                        style={selectedSize === size.size ? { backgroundColor: 'var(--primary-color, #10B981)' } : {}}
                      >
                        <div className="text-center w-full">
                          <div className="font-medium text-sm">{size.size}</div>
                          {storeSettings?.show_product_prices !== false && (
                            <div className="mt-1">
                              {hasDiscount ? (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-xs font-bold text-green-600">
                                    {discountedPrice.toFixed(0)} ج.م
                                  </span>
                                  <span className="text-xs text-gray-500 line-through">
                                    {originalPrice} ج.م
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs font-bold">
                                  {originalPrice} ج.م
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price Display */}
            {storeSettings?.show_product_prices !== false && selectedSizeData && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text-color, #1F2937)' }}>السعر</h3>
                {hasDiscount ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold" style={{ color: 'var(--accent-color, #F59E0B)' }}>
                        {calculateDiscountedPrice(selectedSizeData.price).toFixed(0)} ج.م
                      </span>
                      <span className="text-xl text-gray-500 line-through">
                        {selectedSizeData.price} ج.م
                      </span>
                    </div>
                    <div className="text-sm font-medium" style={{ color: 'var(--accent-color, #F59E0B)' }}>
                      وفّر {(selectedSizeData.price - calculateDiscountedPrice(selectedSizeData.price)).toFixed(0)} ج.م
                    </div>
                  </div>
                ) : (
                  <div className="text-3xl font-bold" style={{ color: 'var(--primary-color, #10B981)' }}>
                    {selectedSizeData.price} ج.م
                  </div>
                )}
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="font-semibold mb-3" style={{ color: 'var(--text-color, #1F2937)' }}>الكمية</h3>
              <div className="flex items-center gap-2 w-32">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <span className="flex-1 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="space-y-3">
              <Button
                className="w-full hover:opacity-90"
                style={{ backgroundColor: 'var(--primary-color, #10B981)' }}
                size="lg"
                onClick={handleAddToCart}
                disabled={
                  isAddingToCart || 
                  cartLoading || 
                  (product.product_sizes && product.product_sizes.length > 0 && !selectedSize)
                }
              >
                {isAddingToCart || cartLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    جاري الإضافة...
                  </>
                ) : (
                  'أضف إلى السلة'
                )}
              </Button>
              
              <Link to="/cart">
                <Button variant="outline" className="w-full" size="lg">
                  عرض السلة
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <RelatedProducts 
        currentProductId={product.id} 
        categoryId={product.category_id}
      />
    </div>
  );
};

export default ProductPage;
