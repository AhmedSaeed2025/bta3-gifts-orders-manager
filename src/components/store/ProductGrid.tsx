
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';
import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProductGridProps {
  products: any[];
  isLoading: boolean;
}

const ProductGrid = ({ products, isLoading }: ProductGridProps) => {
  const { addToCart, clearCart } = useCart();
  const [selectedSizes, setSelectedSizes] = useState<{ [productId: string]: string }>({});
  const navigate = useNavigate();

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

  if (isLoading) {
    return <p>Loading products...</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <Card key={product.id} className="group hover:shadow-lg transition-shadow">
          <div className="relative">
            <img
              src={product.product_images?.[0]?.url}
              alt={product.name}
              className="w-full h-64 object-cover rounded-t-md"
            />
            <div className="absolute top-2 left-2 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">
              {product.categories?.name}
            </div>
          </div>
          
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>

            {/* Size and Price Selection */}
            {product.product_sizes && product.product_sizes.length > 0 && (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">المقاس:</Label>
                  <Select
                    value={selectedSizes[product.id] || ''}
                    onValueChange={(size) => handleSizeChange(product.id, size)}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="اختر المقاس" />
                    </SelectTrigger>
                    <SelectContent>
                      {product.product_sizes.map((sizeOption: any) => (
                        <SelectItem key={sizeOption.id} value={sizeOption.size}>
                          {sizeOption.size} - {formatCurrency(sizeOption.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedSizes[product.id] && (
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => {
                        const selectedSize = selectedSizes[product.id];
                        const sizeData = product.product_sizes.find((s: any) => s.size === selectedSize);
                        if (sizeData) {
                          handleOrderNow(product, selectedSize, sizeData.price);
                        }
                      }}
                      className="w-full"
                    >
                      اطلب الآن
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const selectedSize = selectedSizes[product.id];
                        const sizeData = product.product_sizes.find((s: any) => s.size === selectedSize);
                        if (sizeData) {
                          handleAddToCart(product, selectedSize, sizeData.price);
                        }
                      }}
                      className="w-full"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      أضف للسلة
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProductGrid;
