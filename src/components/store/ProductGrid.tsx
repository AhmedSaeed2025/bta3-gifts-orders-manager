
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, Eye } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description?: string;
  featured: boolean;
  is_active: boolean;
  category_id?: string;
  product_sizes: Array<{
    size: string;
    price: number;
    cost: number;
  }>;
  product_images: Array<{
    image_url: string;
    alt_text?: string;
    is_primary: boolean;
  }>;
  categories?: {
    id: string;
    name: string;
  };
}

interface ProductGridProps {
  products: Product[];
  categories: Array<{
    id: string;
    name: string;
  }>;
}

const ProductGrid = ({ products, categories }: ProductGridProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter only active products
  const activeProducts = products.filter(product => product.is_active);
  
  const filteredProducts = selectedCategory 
    ? activeProducts.filter(product => product.category_id === selectedCategory)
    : activeProducts;

  // Group products by category
  const productsByCategory = categories.reduce((acc, category) => {
    const categoryProducts = activeProducts.filter(product => product.category_id === category.id);
    if (categoryProducts.length > 0) {
      acc[category.id] = {
        category,
        products: categoryProducts
      };
    }
    return acc;
  }, {} as Record<string, { category: any; products: Product[] }>);

  // Products without category
  const uncategorizedProducts = activeProducts.filter(product => !product.category_id);

  const getProductImage = (product: Product) => {
    const primaryImage = product.product_images?.find(img => img.is_primary);
    return primaryImage?.image_url || product.product_images?.[0]?.image_url || '/placeholder.svg';
  };

  const getProductPrice = (product: Product) => {
    if (!product.product_sizes || product.product_sizes.length === 0) {
      return { min: 0, max: 0 };
    }
    
    const prices = product.product_sizes.map(size => size.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  };

  return (
    <div className="space-y-12">
      {/* Categories Filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
          >
            جميع المنتجات
          </Button>
          {categories.map((category) => {
            const hasProducts = activeProducts.some(p => p.category_id === category.id);
            if (!hasProducts) return null;
            
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Button>
            );
          })}
        </div>
      )}

      {/* Featured Products */}
      {activeProducts.some(p => p.featured) && !selectedCategory && (
        <section>
          <h2 className="text-2xl font-bold mb-6 text-center">المنتجات المميزة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activeProducts
              .filter(product => product.featured)
              .slice(0, 4)
              .map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
          </div>
        </section>
      )}

      {/* Display by categories or filtered products */}
      {selectedCategory ? (
        <section>
          <h2 className="text-2xl font-bold mb-6 text-center">
            فئة: {categories.find(c => c.id === selectedCategory)?.name}
          </h2>
          
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">لا توجد منتجات في هذه الفئة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          {/* Products by category */}
          {Object.values(productsByCategory).map(({ category, products }) => (
            <section key={category.id}>
              <h2 className="text-2xl font-bold mb-6 text-center">{category.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          ))}

          {/* Uncategorized products */}
          {uncategorizedProducts.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6 text-center">منتجات أخرى</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {uncategorizedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}

          {/* No products message */}
          {activeProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">لا توجد منتجات متاحة حالياً</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const ProductCard = ({ product }: { product: Product }) => {
  const { min, max } = getProductPrice(product);
  const imageUrl = getProductImage(product);
  
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative overflow-hidden">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.featured && (
            <Badge className="bg-yellow-500">مميز</Badge>
          )}
          {product.categories && (
            <Badge variant="secondary">{product.categories.name}</Badge>
          )}
        </div>
        
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex gap-2">
            <Button size="icon" variant="secondary">
              <Heart className="h-4 w-4" />
            </Button>
            <Link to={`/product/${product.id}`}>
              <Button size="icon" variant="secondary">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Button size="icon" variant="secondary">
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <CardContent className="p-4">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        
        {product.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {product.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-primary">
            {min === max 
              ? `${min} ج.م`
              : `${min} - ${max} ج.م`
            }
          </div>
          <Button size="sm" className="mr-2">
            أضف للسلة
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper functions
const getProductPrice = (product: Product) => {
  if (!product.product_sizes || product.product_sizes.length === 0) {
    return { min: 0, max: 0 };
  }
  
  const prices = product.product_sizes.map(size => size.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
};

const getProductImage = (product: Product) => {
  const primaryImage = product.product_images?.find(img => img.is_primary);
  return primaryImage?.image_url || product.product_images?.[0]?.image_url || '/placeholder.svg';
};

export default ProductGrid;
