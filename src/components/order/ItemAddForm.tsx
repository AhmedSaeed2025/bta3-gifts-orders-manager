
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

interface CurrentItem {
  productType: string;
  size: string;
  quantity: number;
  cost: number;
  price: number;
  itemDiscount: number;
}

interface ItemAddFormProps {
  currentItem: CurrentItem;
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
  return (
    <div className="border-t pt-4">
      <h3 className="text-lg font-medium mb-4">إضافة المنتجات</h3>
      
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor="productType">نوع المنتج</Label>
          <Select 
            value={currentItem.productType}
            onValueChange={(value) => onSelectChange("productType", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر النوع" />
            </SelectTrigger>
            <SelectContent>
              {availableProductTypes.length > 0 ? (
                availableProductTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))
              ) : (
                <>
                  <SelectItem value="تابلوه">تابلوه</SelectItem>
                  <SelectItem value="ماكيت">ماكيت</SelectItem>
                  <SelectItem value="ميدالية اكليريك">ميدالية اكليريك</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="size">المقاس</Label>
          <Select 
            value={currentItem.size}
            onValueChange={(value) => onSelectChange("size", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر المقاس" />
            </SelectTrigger>
            <SelectContent>
              {availableSizes.length > 0 ? (
                availableSizes.map(size => (
                  <SelectItem key={size} value={size}>{size}</SelectItem>
                ))
              ) : (
                <>
                  <SelectItem value="15*20 سم">15*20 سم</SelectItem>
                  <SelectItem value="20*30 سم">20*30 سم</SelectItem>
                  <SelectItem value="30*40 سم">30*40 سم</SelectItem>
                  <SelectItem value="40*50 سم">40*50 سم</SelectItem>
                  <SelectItem value="50*60 سم">50*60 سم</SelectItem>
                  <SelectItem value="50*70 سم">50*70 سم</SelectItem>
                  <SelectItem value="100*60 سم">100*60 سم</SelectItem>
                  <SelectItem value="ميدالية أكليريك مستطيلة">ميدالية أكليريك مستطيلة</SelectItem>
                  <SelectItem value="ميدالية اكليريك مجسمة">ميدالية اكليريك مجسمة</SelectItem>
                  <SelectItem value="دلاية عربية اكليريك ( قطعة )">دلاية عربية اكليريك ( قطعة )</SelectItem>
                  <SelectItem value="دلاية عربية أكليريك ( قطعتين )">دلاية عربية أكليريك ( قطعتين )</SelectItem>
                  <SelectItem value="أخرى">أخرى</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="quantity">الكمية</Label>
          <Input 
            id="quantity" 
            name="quantity" 
            type="number" 
            min="1"
            value={currentItem.quantity}
            onChange={onItemChange} 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="cost">تكلفة الصنف</Label>
          <Input 
            id="cost" 
            name="cost" 
            type="number" 
            min="0"
            step="0.01"
            value={currentItem.cost}
            onChange={onItemChange} 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="price">سعر البيع</Label>
          <Input 
            id="price" 
            name="price" 
            type="number" 
            min="0"
            step="0.01"
            value={currentItem.price}
            onChange={onItemChange} 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="itemDiscount">خصم الصنف (لكل قطعة)</Label>
          <Input 
            id="itemDiscount" 
            name="itemDiscount" 
            type="number" 
            min="0"
            step="0.01"
            value={currentItem.itemDiscount}
            onChange={onItemChange} 
            placeholder="0.00"
          />
        </div>
        
        <div className="flex items-end col-span-full md:col-span-1">
          <Button 
            type="button" 
            className="bg-green-600 hover:bg-green-700 w-full"
            onClick={onAddItem}
          >
            <Plus className="ms-1" size={16} />
            إضافة منتج
          </Button>
        </div>
      </div>

      {/* عرض تفاصيل السعر والخصم */}
      {currentItem.productType && currentItem.size && currentItem.price > 0 && (
        <div className="bg-blue-50 p-3 rounded-lg mb-4">
          <h4 className="font-medium mb-2 text-blue-800">تفاصيل السعر:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div>
              <span className="text-gray-600">السعر الأساسي:</span>
              <div className="font-bold text-blue-600">{currentItem.price} جنيه</div>
            </div>
            <div>
              <span className="text-gray-600">خصم القطعة:</span>
              <div className="font-bold text-red-600">{currentItem.itemDiscount || 0} جنيه</div>
            </div>
            <div>
              <span className="text-gray-600">السعر بعد الخصم:</span>
              <div className="font-bold text-green-600">{(currentItem.price - (currentItem.itemDiscount || 0))} جنيه</div>
            </div>
            <div>
              <span className="text-gray-600">إجمالي الكمية:</span>
              <div className="font-bold text-purple-600">{((currentItem.price - (currentItem.itemDiscount || 0)) * currentItem.quantity)} جنيه</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemAddForm;
