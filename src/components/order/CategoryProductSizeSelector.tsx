
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

  // Fetch categories
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

  // Fetch products for selected category
  const { data: products = [] } = useQuery({
    queryKey: ['products-for-category', selectedCategoryId],
    queryFn: async () => {
      if (!user || !selectedCategoryId) return [];
      
      let query = supabase
        .from('products')
        .select(`
          *,
          product_sizes (*)
        `)
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

  // Get sizes for selected product
  const selectedProduct = products.find(p => p.id === selectedProductId);
  const availableSizes = selectedProduct?.product_sizes || [];

  // Reset selections when category changes
  useEffect(() => {
    if (selectedCategoryId && selectedCategoryId !== currentSelection?.categoryId) {
      setSelectedProductId("");
      setSelectedSize("");
      onSelectionChange(null);
    }
  }, [selectedCategoryId]);

  // Reset size when product changes
  useEffect(() => {
    if (selectedProductId && selectedProductId !== currentSelection?.productId) {
      setSelectedSize("");
      onSelectionChange(null);
    }
  }, [selectedProductId]);

  // Update selection when all values are selected
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
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>الفئة</Label>
        <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
          <SelectTrigger>
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

      <div className="space-y-2">
        <Label>المنتج</Label>
        <Select 
          value={selectedProductId} 
          onValueChange={setSelectedProductId}
          disabled={!selectedCategoryId}
        >
          <SelectTrigger>
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

      <div className="space-y-2">
        <Label>المقاس</Label>
        <Select 
          value={selectedSize} 
          onValueChange={setSelectedSize}
          disabled={!selectedProductId || availableSizes.length === 0}
        >
          <SelectTrigger>
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
