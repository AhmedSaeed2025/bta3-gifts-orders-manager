import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Search, ChevronsUpDown, Check, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductQuickSearchProps {
  onSelectionChange: (selection: {
    categoryId: string;
    productId: string;
    productName: string;
    size: string;
    cost: number;
    price: number;
  } | null) => void;
}

const ProductQuickSearch: React.FC<ProductQuickSearchProps> = ({ onSelectionChange }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");

  const { data: products = [] } = useQuery({
    queryKey: ['all-products-for-search', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('products')
        .select(`*, product_sizes (*), categories ( id, name )`)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  const selectedProduct = useMemo(
    () => products.find((p: any) => p.id === selectedProductId),
    [products, selectedProductId]
  );

  const availableSizes = selectedProduct?.product_sizes || [];

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    setSelectedSize("");
    setOpen(false);
    onSelectionChange(null);
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    if (selectedProduct) {
      const sizeData = availableSizes.find((s: any) => s.size === size);
      if (sizeData) {
        onSelectionChange({
          categoryId: selectedProduct.category_id || "no-category",
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          size,
          cost: Number(sizeData.cost),
          price: Number(sizeData.price),
        });
      }
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">المنتج</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between h-9 text-sm font-normal"
            >
              <div className="flex items-center gap-2 truncate">
                <Search size={14} className="text-muted-foreground shrink-0" />
                {selectedProduct ? (
                  <span className="truncate">
                    {selectedProduct.name}
                    {selectedProduct.categories?.name && (
                      <span className="text-muted-foreground text-xs mr-1">
                        ({selectedProduct.categories.name})
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-muted-foreground">ابحث عن منتج بالاسم...</span>
                )}
              </div>
              <ChevronsUpDown size={14} className="opacity-50 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50 bg-popover" align="start">
            <Command>
              <CommandInput placeholder="اكتب اسم المنتج..." className="h-9 text-sm" />
              <CommandList>
                <CommandEmpty>لا توجد منتجات مطابقة.</CommandEmpty>
                <CommandGroup>
                  {products.map((product: any) => (
                    <CommandItem
                      key={product.id}
                      value={`${product.name} ${product.categories?.name || ''}`}
                      onSelect={() => handleProductSelect(product.id)}
                      className="cursor-pointer"
                    >
                      <Check
                        size={14}
                        className={cn(
                          "ml-2",
                          selectedProductId === product.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <Package size={14} className="ml-2 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{product.name}</div>
                        {product.categories?.name && (
                          <div className="text-xs text-muted-foreground truncate">
                            {product.categories.name}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">المقاس</Label>
        <Select
          value={selectedSize}
          onValueChange={handleSizeSelect}
          disabled={!selectedProductId || availableSizes.length === 0}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder={selectedProductId ? "اختر المقاس" : "اختر منتج أولاً"} />
          </SelectTrigger>
          <SelectContent className="z-50 bg-popover">
            {availableSizes.map((size: any) => (
              <SelectItem key={size.size} value={size.size}>
                {size.size} — {Number(size.price).toFixed(2)} ج.م
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ProductQuickSearch;
