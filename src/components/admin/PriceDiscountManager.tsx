
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/context/ProductContext';
import { formatCurrency } from '@/lib/utils';
import { Edit, Save, X, Percent, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const PriceDiscountManager = () => {
  const { products, updateProduct } = useProducts();
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editingSize, setEditingSize] = useState<string | null>(null);
  const [priceData, setPriceData] = useState({
    originalPrice: 0,
    discountedPrice: 0,
    discountPercentage: 0
  });

  const handleEditPrice = (productId: string, size: string, currentPrice: number) => {
    setEditingProduct(productId);
    setEditingSize(size);
    setPriceData({
      originalPrice: currentPrice,
      discountedPrice: currentPrice,
      discountPercentage: 0
    });
  };

  const handlePriceChange = (field: string, value: number) => {
    if (field === 'originalPrice') {
      const discountAmount = priceData.discountedPrice > 0 ? value - priceData.discountedPrice : 0;
      const discountPercentage = value > 0 ? (discountAmount / value) * 100 : 0;
      setPriceData(prev => ({
        ...prev,
        originalPrice: value,
        discountPercentage: Math.round(discountPercentage * 100) / 100
      }));
    } else if (field === 'discountedPrice') {
      const discountAmount = priceData.originalPrice - value;
      const discountPercentage = priceData.originalPrice > 0 ? (discountAmount / priceData.originalPrice) * 100 : 0;
      setPriceData(prev => ({
        ...prev,
        discountedPrice: value,
        discountPercentage: Math.round(discountPercentage * 100) / 100
      }));
    } else if (field === 'discountPercentage') {
      const discountAmount = (priceData.originalPrice * value) / 100;
      const discountedPrice = priceData.originalPrice - discountAmount;
      setPriceData(prev => ({
        ...prev,
        discountPercentage: value,
        discountedPrice: Math.round(discountedPrice * 100) / 100
      }));
    }
  };

  const handleSavePrice = async () => {
    if (!editingProduct || !editingSize) return;

    try {
      const product = products.find(p => p.id === editingProduct);
      if (!product) return;

      // Update the specific size price
      const updatedSizes = product.sizes.map(size => {
        if (size.size === editingSize) {
          return {
            ...size,
            price: priceData.discountedPrice > 0 && priceData.discountPercentage > 0 
              ? priceData.discountedPrice 
              : priceData.originalPrice
          };
        }
        return size;
      });

      // Create updated product with new sizes and discount percentage
      const updatedProduct = {
        ...product,
        sizes: updatedSizes,
        discount_percentage: priceData.discountPercentage > 0 ? priceData.discountPercentage : undefined
      };

      console.log('Updating product with:', updatedProduct);

      await updateProduct(editingProduct, updatedProduct);

      toast.success('تم تحديث السعر بنجاح');
      setEditingProduct(null);
      setEditingSize(null);
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error('حدث خطأ في تحديث السعر');
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditingSize(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            إدارة الأسعار والخصومات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {products.map(product => (
              <Card key={product.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{product.name}</h3>
                    {product.discount_percentage && product.discount_percentage > 0 && (
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        <Percent className="h-3 w-3 mr-1" />
                        خصم {product.discount_percentage}%
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid gap-3">
                    {product.sizes.map((size, index) => (
                      <div key={`${product.id}-${size.size}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{size.size}</span>
                          <span className="text-sm text-gray-600">
                            التكلفة: {formatCurrency(size.cost)}
                          </span>
                        </div>
                        
                        {editingProduct === product.id && editingSize === size.size ? (
                          <div className="flex items-center gap-2">
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div>
                                <Label htmlFor="originalPrice">السعر الأصلي</Label>
                                <Input
                                  id="originalPrice"
                                  type="number"
                                  value={priceData.originalPrice}
                                  onChange={(e) => handlePriceChange('originalPrice', parseFloat(e.target.value) || 0)}
                                  className="h-8"
                                />
                              </div>
                              <div>
                                <Label htmlFor="discountedPrice">السعر بعد الخصم</Label>
                                <Input
                                  id="discountedPrice"
                                  type="number"
                                  value={priceData.discountedPrice}
                                  onChange={(e) => handlePriceChange('discountedPrice', parseFloat(e.target.value) || 0)}
                                  className="h-8"
                                />
                              </div>
                              <div>
                                <Label htmlFor="discountPercentage">نسبة الخصم %</Label>
                                <Input
                                  id="discountPercentage"
                                  type="number"
                                  value={priceData.discountPercentage}
                                  onChange={(e) => handlePriceChange('discountPercentage', parseFloat(e.target.value) || 0)}
                                  className="h-8"
                                />
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" onClick={handleSavePrice} className="h-8 w-8 p-0">
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-8 w-8 p-0">
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="font-semibold">{formatCurrency(size.price)}</div>
                              {product.discount_percentage && product.discount_percentage > 0 && (
                                <div className="text-sm text-gray-500">
                                  الربح: {formatCurrency(size.price - size.cost)}
                                </div>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditPrice(product.id, size.size, size.price)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PriceDiscountManager;
