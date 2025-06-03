
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
}

const ItemAddForm: React.FC<ItemAddFormProps> = ({
  currentItem,
  availableProductTypes,
  availableSizes,
  onItemChange,
  onSelectChange,
  onAddItem,
}) => {
  const discountedPrice = currentItem.price - (currentItem.itemDiscount || 0);
  const totalItemPrice = discountedPrice * currentItem.quantity;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">إضافة منتج</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="productType">نوع المنتج</Label>
            <Select
              value={currentItem.productType}
              onValueChange={(value) => onSelectChange("productType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع المنتج" />
              </SelectTrigger>
              <SelectContent>
                {availableProductTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="size">المقاس</Label>
            <Select
              value={currentItem.size}
              onValueChange={(value) => onSelectChange("size", value)}
              disabled={!currentItem.productType}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر المقاس" />
              </SelectTrigger>
              <SelectContent>
                {availableSizes.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">الكمية</Label>
            <Input
              type="number"
              id="quantity"
              name="quantity"
              value={currentItem.quantity}
              onChange={onItemChange}
              min={1}
              className="text-center"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cost">التكلفة</Label>
            <Input
              type="number"
              id="cost"
              name="cost"
              value={currentItem.cost}
              onChange={onItemChange}
              step={0.01}
              min={0}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="price">السعر الأساسي</Label>
            <Input
              type="number"
              id="price"
              name="price"
              value={currentItem.price}
              onChange={onItemChange}
              step={0.01}
              min={0}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="itemDiscount">خصم القطعة</Label>
            <Input
              type="number"
              id="itemDiscount"
              name="itemDiscount"
              value={currentItem.itemDiscount || 0}
              onChange={onItemChange}
              step={0.01}
              min={0}
              max={currentItem.price}
            />
          </div>
        </div>

        {currentItem.price > 0 && (
          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
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
            <div className="flex justify-between text-lg border-t pt-2">
              <span>إجمالي المنتج ({currentItem.quantity} قطعة):</span>
              <span className="font-bold text-blue-600">{totalItemPrice} جنيه</span>
            </div>
          </div>
        )}
        
        <Button 
          type="button" 
          onClick={onAddItem}
          disabled={!currentItem.productType || !currentItem.size || currentItem.quantity < 1}
          className="w-full"
        >
          إضافة المنتج
        </Button>
      </CardContent>
    </Card>
  );
};

export default ItemAddForm;
