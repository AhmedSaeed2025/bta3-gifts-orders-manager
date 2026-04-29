
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Package } from "lucide-react";
import ProductQuickSearch from "./ProductQuickSearch";

interface ImprovedItemAddFormProps {
  currentItem: {
    productType: string;
    size: string;
    quantity: number;
    cost: number;
    price: number;
    itemDiscount: number;
  };
  onItemChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onProductSelectionChange: (selection: {
    categoryId: string;
    productId: string;
    productName: string;
    size: string;
    cost: number;
    price: number;
  } | null) => void;
  onAddItem: () => void;
}

const ImprovedItemAddForm: React.FC<ImprovedItemAddFormProps> = ({
  currentItem,
  onItemChange,
  onProductSelectionChange,
  onAddItem,
}) => {
  const discountedPrice = currentItem.price - (currentItem.itemDiscount || 0);
  const totalItemPrice = discountedPrice * currentItem.quantity;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <Package size={18} />
        <h3 className="font-semibold text-sm">إضافة منتج</h3>
      </div>

      <CategoryProductSizeSelector onSelectionChange={onProductSelectionChange} />
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="quantity" className="text-xs text-muted-foreground">الكمية</Label>
          <Input
            type="number"
            id="quantity"
            name="quantity"
            value={currentItem.quantity}
            onChange={onItemChange}
            min={1}
            className="h-9 text-sm text-center"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cost" className="text-xs text-muted-foreground">التكلفة</Label>
          <Input
            type="number"
            id="cost"
            name="cost"
            value={currentItem.cost}
            onChange={onItemChange}
            step={0.01}
            min={0}
            className="h-9 text-sm text-center"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price" className="text-xs text-muted-foreground">السعر</Label>
          <Input
            type="number"
            id="price"
            name="price"
            value={currentItem.price}
            onChange={onItemChange}
            step={0.01}
            min={0}
            className="h-9 text-sm text-center"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="itemDiscount" className="text-xs text-muted-foreground">خصم القطعة</Label>
          <Input
            type="number"
            id="itemDiscount"
            name="itemDiscount"
            value={currentItem.itemDiscount || 0}
            onChange={onItemChange}
            step={0.01}
            min={0}
            max={currentItem.price}
            className="h-9 text-sm text-center"
          />
        </div>
      </div>

      {currentItem.price > 0 && (
        <div className="bg-muted/50 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-4">
            <span>السعر: <strong>{currentItem.price} ج.م</strong></span>
            {currentItem.itemDiscount > 0 && (
              <span className="text-destructive">خصم: <strong>-{currentItem.itemDiscount}</strong></span>
            )}
            <span className="text-green-600 dark:text-green-400">بعد الخصم: <strong>{discountedPrice} ج.م</strong></span>
          </div>
          <div className="font-bold text-primary text-sm">
            الإجمالي: {totalItemPrice} ج.م
          </div>
        </div>
      )}
      
      <Button 
        type="button" 
        onClick={onAddItem}
        disabled={!currentItem.productType || !currentItem.size || currentItem.quantity < 1}
        className="w-full h-9 text-sm gap-2"
      >
        <Plus size={16} />
        إضافة المنتج
      </Button>
    </div>
  );
};

export default ImprovedItemAddForm;
