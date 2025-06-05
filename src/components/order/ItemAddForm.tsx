
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { Product } from "@/types";

interface ItemAddFormProps {
  currentItem: {
    productType: string;
    size: string;
    quantity: number;
    cost: number;
    price: number;
    itemDiscount: number;
  };
  availableProductTypes: string[];
  availableSizes: string[];
  onItemChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  onAddItem: () => void;
  products: Product[];
}

const ItemAddForm: React.FC<ItemAddFormProps> = ({
  currentItem,
  availableProductTypes,
  availableSizes,
  onItemChange,
  onSelectChange,
  onAddItem,
  products,
}) => {
  const isMobile = useIsMobile();
  const discountedPrice = currentItem.price - (currentItem.itemDiscount || 0);
  const totalItemPrice = discountedPrice * currentItem.quantity;

  return (
    <Card className={isMobile ? "text-sm" : ""}>
      <CardHeader>
        <CardTitle className={`${isMobile ? "text-base" : "text-lg"}`}>إضافة منتج</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
          <div className="space-y-2">
            <Label htmlFor="productType" className={isMobile ? "text-xs" : ""}>نوع المنتج</Label>
            <Select
              value={currentItem.productType}
              onValueChange={(value) => onSelectChange("productType", value)}
            >
              <SelectTrigger className={isMobile ? "text-xs h-8" : ""}>
                <SelectValue placeholder="اختر نوع المنتج" />
              </SelectTrigger>
              <SelectContent>
                {availableProductTypes.map((type) => (
                  <SelectItem key={type} value={type} className={isMobile ? "text-xs" : ""}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="size" className={isMobile ? "text-xs" : ""}>المقاس</Label>
            <Select
              value={currentItem.size}
              onValueChange={(value) => onSelectChange("size", value)}
              disabled={!currentItem.productType}
            >
              <SelectTrigger className={isMobile ? "text-xs h-8" : ""}>
                <SelectValue placeholder="اختر المقاس" />
              </SelectTrigger>
              <SelectContent>
                {availableSizes.map((size) => (
                  <SelectItem key={size} value={size} className={isMobile ? "text-xs" : ""}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className={`grid gap-4 ${isMobile ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"}`}>
          <div className="space-y-2">
            <Label htmlFor="quantity" className={isMobile ? "text-xs" : ""}>الكمية</Label>
            <Input
              type="number"
              id="quantity"
              name="quantity"
              value={currentItem.quantity}
              onChange={onItemChange}
              min={1}
              className={`text-center ${isMobile ? "text-xs h-8" : ""}`}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cost" className={isMobile ? "text-xs" : ""}>التكلفة</Label>
            <Input
              type="number"
              id="cost"
              name="cost"
              value={currentItem.cost}
              onChange={onItemChange}
              step={0.01}
              min={0}
              className={isMobile ? "text-xs h-8" : ""}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="price" className={isMobile ? "text-xs" : ""}>السعر الأساسي</Label>
            <Input
              type="number"
              id="price"
              name="price"
              value={currentItem.price}
              onChange={onItemChange}
              step={0.01}
              min={0}
              className={isMobile ? "text-xs h-8" : ""}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="itemDiscount" className={isMobile ? "text-xs" : ""}>خصم القطعة</Label>
            <Input
              type="number"
              id="itemDiscount"
              name="itemDiscount"
              value={currentItem.itemDiscount || 0}
              onChange={onItemChange}
              step={0.01}
              min={0}
              max={currentItem.price}
              className={isMobile ? "text-xs h-8" : ""}
            />
          </div>
        </div>

        {currentItem.price > 0 && (
          <div className={`bg-gray-50 p-3 rounded-lg space-y-2 ${isMobile ? "text-xs" : ""}`}>
            <div className="flex justify-between text-sm">
              <span>السعر الأساسي للقطعة:</span>
              <span className="font-bold">{currentItem.price} جنيه</span>
            </div>
            {currentItem.itemDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span>خصم القطعة:</span>
                <span className="font-bold text-red-600">-{currentItem.itemDiscount} جنيه</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>السعر بعد الخصم للقطعة:</span>
              <span className="font-bold text-green-600">{discountedPrice} جنيه</span>
            </div>
            <div className={`flex justify-between border-t pt-2 ${isMobile ? "text-sm" : "text-lg"}`}>
              <span>إجمالي المنتج ({currentItem.quantity} قطعة):</span>
              <span className="font-bold text-blue-600">{totalItemPrice} جنيه</span>
            </div>
          </div>
        )}
        
        <Button 
          type="button" 
          onClick={onAddItem}
          disabled={!currentItem.productType || !currentItem.size || currentItem.quantity < 1}
          className={`w-full ${isMobile ? "text-xs h-8" : ""}`}
        >
          إضافة المنتج
        </Button>
      </CardContent>
    </Card>
  );
};

export default ItemAddForm;
