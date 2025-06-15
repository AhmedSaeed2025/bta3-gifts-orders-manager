
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

const ProductPage = () => {
  const { id } = useParams();
  const { addToCart, loading: cartLoading } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_sizes (*),
          product_images (*),
          categories (name)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

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

  const primaryImage = product.product_images?.find(img => img.is_primary);
  const mainImage = primaryImage?.image_url || product.product_images?.[0]?.image_url;

  const selectedSizeData = product.product_sizes?.find(size => size.size === selectedSize);

  const handleAddToCart = async () => {
    if (!selectedSize) {
      toast.error('يرجى اختيار المقاس');
      return;
    }

    if (!selectedSizeData) {
      toast.error('المقاس المحدد غير متوفر');
      return;
    }

    await addToCart(product.id, selectedSize, quantity, selectedSizeData.price);
  };

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
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-muted-foreground">لا توجد صورة</span>
                </div>
              )}
            </div>
            
            {/* Thumbnail Images */}
            {product.product_images && product.product_images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.product_images.map((image, index) => (
                  <div key={index} className="aspect-square bg-muted rounded-md overflow-hidden">
                    <img
                      src={image.image_url}
                      alt={image.alt_text || `${product.name} ${index + 1}`}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-80"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold">{product.name}</h1>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {product.featured && (
                <Badge className="mb-4">منتج مميز</Badge>
              )}

              {product.description && (
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>

            {/* Size Selection */}
            {product.product_sizes && product.product_sizes.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">اختر المقاس</h3>
                <div className="grid grid-cols-3 gap-2">
                  {product.product_sizes.map((size) => (
                    <Button
                      key={size.id}
                      variant={selectedSize === size.size ? "default" : "outline"}
                      onClick={() => setSelectedSize(size.size)}
                      className="h-12"
                    >
                      <div className="text-center">
                        <div className="font-medium">{size.size}</div>
                        <div className="text-xs">{size.price} ج.م</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            {selectedSizeData && (
              <div className="text-3xl font-bold text-primary">
                {selectedSizeData.price} ج.م
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="font-semibold mb-3">الكمية</h3>
              <div className="flex items-center gap-2 w-32">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <span className="flex-1 text-center">{quantity}</span>
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
                className="w-full"
                size="lg"
                onClick={handleAddToCart}
                disabled={cartLoading || !selectedSize}
              >
                {cartLoading ? (
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
    </div>
  );
};

export default ProductPage;
