
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Heart, Eye, Play } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';

interface ProductGridProps {
  products: any[];
  isLoading?: boolean;
}

const ProductGrid = ({ products, isLoading }: ProductGridProps) => {
  const { addToCart } = useCart();

  const handleAddToCart = (product: any, size: any) => {
    const discountedPrice = size.price * (1 - (product.discount_percentage || 0) / 100);
    
    addToCart({
      id: `${product.id}-${size.id}`,
      productId: product.id,
      name: product.name,
      size: size.size,
      price: discountedPrice,
      originalPrice: size.price,
      discount: product.discount_percentage || 0,
      image: product.image_url,
      quantity: 1
    });
    
    toast.success('تم إضافة المنتج للسلة');
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4 w-2/3"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">لا توجد منتجات متاحة</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => {
        const minPrice = Math.min(...product.product_sizes.map((s: any) => 
          s.price * (1 - (product.discount_percentage || 0) / 100)
        ));
        const maxPrice = Math.max(...product.product_sizes.map((s: any) => 
          s.price * (1 - (product.discount_percentage || 0) / 100)
        ));
        const originalMinPrice = Math.min(...product.product_sizes.map((s: any) => s.price));
        const originalMaxPrice = Math.max(...product.product_sizes.map((s: any) => s.price));

        return (
          <Card key={product.id} className="group hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
            {/* Discount Badge */}
            {product.discount_percentage > 0 && (
              <div className="absolute top-2 right-2 z-10">
                <Badge className="bg-red-500 text-white animate-pulse">
                  خصم {product.discount_percentage}%
                </Badge>
              </div>
            )}

            {/* Featured Badge */}
            {product.featured && (
              <div className="absolute top-2 left-2 z-10">
                <Badge className="bg-yellow-500 text-white">
                  مميز
                </Badge>
              </div>
            )}

            <div className="relative">
              {/* Product Image */}
              <div className="aspect-square overflow-hidden bg-gray-100 rounded-t-lg">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    لا توجد صورة
                  </div>
                )}
                
                {/* Video indicator */}
                {product.video_url && (
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="secondary" className="bg-black/70 text-white">
                      <Play className="h-3 w-3 mr-1" />
                      فيديو
                    </Badge>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                <Link to={`/product/${product.id}`}>
                  <Button size="sm" variant="secondary">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                <Button size="sm" variant="secondary">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  {product.categories && (
                    <Badge variant="outline" className="text-xs">
                      {product.categories.name}
                    </Badge>
                  )}
                </div>

                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                )}

                {/* Price Range */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {product.discount_percentage > 0 ? (
                      <>
                        <span className="text-lg font-bold text-green-600">
                          {minPrice === maxPrice ? `${minPrice.toFixed(2)}` : `${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`} ج.م
                        </span>
                        <span className="text-sm line-through text-red-500">
                          {originalMinPrice === originalMaxPrice ? `${originalMinPrice}` : `${originalMinPrice} - ${originalMaxPrice}`} ج.م
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-primary">
                        {minPrice === maxPrice ? `${minPrice}` : `${minPrice} - ${maxPrice}`} ج.م
                      </span>
                    )}
                  </div>
                  
                  {product.discount_percentage > 0 && (
                    <div className="text-xs text-green-600 font-medium">
                      وفر {((originalMinPrice - minPrice) / originalMinPrice * 100).toFixed(0)}%
                    </div>
                  )}
                </div>

                {/* Sizes */}
                <div className="flex flex-wrap gap-1">
                  {product.product_sizes?.slice(0, 3).map((size: any) => (
                    <Button
                      key={size.id}
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleAddToCart(product, size)}
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      {size.size}
                    </Button>
                  ))}
                  {product.product_sizes?.length > 3 && (
                    <Link to={`/product/${product.id}`}>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                        +{product.product_sizes.length - 3}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ProductGrid;
