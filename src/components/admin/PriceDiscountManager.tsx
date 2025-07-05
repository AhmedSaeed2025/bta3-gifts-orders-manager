
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProducts } from "@/context/ProductContext";
import { formatCurrency } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types";

const PriceDiscountManager = () => {
  const { products, updateProduct } = useProducts();

  const handleDiscountChange = (productId: string, discount: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      updateProduct(productId, {
        ...product,
        discount_percentage: discount
      });
    }
  };

  return (
    <Card className="mx-2 md:mx-0">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <CardTitle className="text-lg md:text-xl">إدارة الخصومات على المنتجات</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="px-4 md:px-6">
        {/* Products Discount Section */}
        <div className="space-y-6 md:space-y-8">
          {products.map((product) => (
            <div key={product.id} className="border rounded-md p-3 md:p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-base md:text-lg font-medium">{product.name}</h3>
                  {(product.discount_percentage || 0) > 0 && (
                    <Badge className="bg-red-500 text-white">
                      خصم {product.discount_percentage}%
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Label htmlFor={`discount-${product.id}`} className="text-xs md:text-sm whitespace-nowrap">
                    نسبة الخصم %
                  </Label>
                  <Input
                    id={`discount-${product.id}`}
                    type="number"
                    min="0"
                    max="100"
                    value={product.discount_percentage || 0}
                    onChange={(e) => handleDiscountChange(product.id, parseFloat(e.target.value) || 0)}
                    className="w-20 text-xs md:text-sm"
                    size="sm"
                  />
                </div>
              </div>
              
              {/* Sizes Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs md:text-sm">المقاس</TableHead>
                      <TableHead className="text-xs md:text-sm">السعر الأصلي</TableHead>
                      <TableHead className="text-xs md:text-sm">نسبة الخصم</TableHead>
                      <TableHead className="text-xs md:text-sm">السعر بعد الخصم</TableHead>
                      <TableHead className="text-xs md:text-sm">الربح</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.sizes.length > 0 ? (
                      product.sizes.map((size, index) => {
                        const discountAmount = (size.price * ((product.discount_percentage || 0) / 100));
                        const finalPrice = size.price - discountAmount;
                        const profit = finalPrice - size.cost;
                        
                        return (
                          <TableRow key={`${product.id}-${size.size}-${index}`}>
                            <TableCell className="text-xs md:text-sm">{size.size}</TableCell>
                            <TableCell className="text-xs md:text-sm">{formatCurrency(size.price)}</TableCell>
                            <TableCell className="text-xs md:text-sm">{product.discount_percentage || 0}%</TableCell>
                            <TableCell className="text-xs md:text-sm font-medium text-green-600">
                              {formatCurrency(finalPrice)}
                            </TableCell>
                            <TableCell className="text-xs md:text-sm">{formatCurrency(profit)}</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-xs md:text-sm">
                          لا توجد مقاسات لهذا المنتج
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
          
          {products.length === 0 && (
            <div className="text-center py-8 border rounded-md">
              <p className="text-gray-500 dark:text-gray-400 text-sm">لا توجد منتجات مسجلة</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceDiscountManager;
