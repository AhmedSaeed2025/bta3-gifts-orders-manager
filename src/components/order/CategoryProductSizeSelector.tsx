
import React, { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CategoryProductSizeSelectorProps {
  onSelectionChange: (selection: {
    categoryId: string;
    productId: string;
    productName: string;
    size: string;
    cost: number;
    price: number;
  } | null) => void;
  currentSelection?: {
    categoryId: string;
    productId: string;
    size: string;
  };
}

const CategoryProductSizeSelector: React.FC<CategoryProductSizeSelectorProps> = ({
  onSelectionChange,
  currentSelection
}) => {
  const { user } = useAuth();
  const [selectedCategoryId, setSelectedCategoryId] = useState(currentSelection?.categoryId || "");
  const [selectedProductId, setSelectedProductId] = useState(currentSelection?.productId || "");
  const [selectedSize, setSelectedSize] = useState(currentSelection?.size || "");

  const { data: categories = [] } = useQuery({
    queryKey: ['categories-for-orders'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products-for-category', selectedCategoryId],
    queryFn: async () => {
      if (!user || !selectedCategoryId) return [];
      let query = supabase
        .from('products')
        .select(`*, product_sizes (*)`)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (selectedCategoryId !== 'no-category') {
        query = query.eq('category_id', selectedCategoryId);
      } else {
        query = query.is('category_id', null);
      }

      const { data, error } = await query.order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!selectedCategoryId
  });

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const availableSizes = selectedProduct?.product_sizes || [];

  useEffect(() => {
    if (selectedCategoryId && selectedCategoryId !== currentSelection?.categoryId) {
      setSelectedProductId("");
      setSelectedSize("");
      onSelectionChange(null);
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    if (selectedProductId && selectedProductId !== currentSelection?.productId) {
      setSelectedSize("");
      onSelectionChange(null);
    }
  }, [selectedProductId]);

  useEffect(() => {
    if (selectedCategoryId && selectedProductId && selectedSize && selectedProduct) {
      const sizeData = availableSizes.find(s => s.size === selectedSize);
      if (sizeData) {
        onSelectionChange({
          categoryId: selectedCategoryId,
          productId: selectedProductId,
          productName: selectedProduct.name,
          size: selectedSize,
          cost: sizeData.cost,
          price: sizeData.price
        });
      }
    }
  }, [selectedCategoryId, selectedProductId, selectedSize, selectedProduct, availableSizes]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">الفئة</Label>
        <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="اختر الفئة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-category">بدون فئة</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">المنتج</Label>
        <Select 
          value={selectedProductId} 
          onValueChange={setSelectedProductId}
          disabled={!selectedCategoryId}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="اختر المنتج" />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">المقاس</Label>
        <Select 
          value={selectedSize} 
          onValueChange={setSelectedSize}
          disabled={!selectedProductId || availableSizes.length === 0}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="اختر المقاس" />
          </SelectTrigger>
          <SelectContent>
            {availableSizes.map((size) => (
              <SelectItem key={size.size} value={size.size}>
                {size.size} - {size.price} جنيه
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default CategoryProductSizeSelector;
