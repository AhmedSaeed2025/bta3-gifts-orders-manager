
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderItem, Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Trash2, Edit, Check, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ItemsTableProps {
  items: OrderItem[];
  onRemoveItem: (index: number) => void;
  onUpdateItem?: (index: number, updatedItem: OrderItem) => void;
  subtotal: number;
  shippingCost: number;
  discount: number;
  deposit: number;
  totalAmount: number;
  products?: Product[];
  editMode?: boolean;
}

const ItemsTable: React.FC<ItemsTableProps> = ({
  items,
  onRemoveItem,
  onUpdateItem,
  subtotal,
  shippingCost,
  discount,
  deposit,
  totalAmount,
  products = [],
  editMode = false,
}) => {
  const isMobile = useIsMobile();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);

  if (items.length === 0) {
    return null;
  }

  const startEditing = (index: number) => {
    console.log('Starting edit for index:', index);
    console.log('Item to edit:', items[index]);
    
    try {
      setEditingIndex(index);
      // تأكد من نسخ كامل للعنصر مع جميع الخصائص
      const itemToEdit = {
        productType: items[index].productType || "",
        size: items[index].size || "",
        quantity: items[index].quantity || 1,
        cost: items[index].cost || 0,
        price: items[index].price || 0,
        profit: items[index].profit || 0,
        itemDiscount: items[index].itemDiscount || 0
      };
      
      console.log('Editing item:', itemToEdit);
      setEditingItem(itemToEdit);
    } catch (error) {
      console.error('Error starting edit:', error);
    }
  };

  const cancelEditing = () => {
    console.log('Canceling edit');
    setEditingIndex(null);
    setEditingItem(null);
  };

  const saveEdit = () => {
    console.log('Saving edit for index:', editingIndex);
    console.log('Editing item:', editingItem);
    
    try {
      if (editingIndex !== null && editingItem && onUpdateItem) {
        // التأكد من صحة البيانات قبل الحفظ
        if (!editingItem.productType || !editingItem.size || editingItem.quantity < 1) {
          console.error('Invalid item data:', editingItem);
          return;
        }

        // حساب السعر بعد الخصم والربح
        const discountedPrice = (editingItem.price || 0) - (editingItem.itemDiscount || 0);
        const calculatedProfit = (discountedPrice - (editingItem.cost || 0)) * (editingItem.quantity || 1);
        
        const updatedItem: OrderItem = {
          ...editingItem,
          profit: calculatedProfit
        };
        
        console.log('Final updated item:', updatedItem);
        onUpdateItem(editingIndex, updatedItem);
        
        setEditingIndex(null);
        setEditingItem(null);
      }
    } catch (error) {
      console.error('Error saving edit:', error);
    }
  };

  const updateEditingItem = (field: string, value: any) => {
    console.log('Updating field:', field, 'with value:', value);
    
    try {
      if (!editingItem) return;
      
      const newItem = { ...editingItem, [field]: value };
      
      // التحديث التلقائي للتكلفة والسعر عند تغيير المنتج أو المقاس
      if ((field === "productType" || field === "size") && products && products.length > 0) {
        const selectedProduct = products.find(p => p.name === (field === "productType" ? value : newItem.productType));
        if (selectedProduct && newItem.size) {
          const selectedSize = selectedProduct.sizes?.find(s => s.size === (field === "size" ? value : newItem.size));
          if (selectedSize) {
            newItem.cost = selectedSize.cost || 0;
            newItem.price = selectedSize.price || 0;
          }
        }
      }
      
      console.log('Updated editing item:', newItem);
      setEditingItem(newItem);
    } catch (error) {
      console.error('Error updating editing item:', error);
    }
  };

  const availableProductTypes = products && products.length > 0 
    ? [...new Set(products.map(p => p.name))] 
    : [];
  
  const getAvailableSizes = (productType: string) => {
    if (!products || products.length === 0) return [];
    const product = products.find(p => p.name === productType);
    return product && product.sizes ? product.sizes.map(s => s.size) : [];
  };

  return (
    <Card className={`mt-6 ${isMobile ? "text-xs" : ""}`}>
      <CardHeader>
        <CardTitle className={`${isMobile ? "text-sm" : "text-xl"}`}>
          الأصناف المضافة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className={`w-full border-collapse ${isMobile ? "text-xs" : ""}`}>
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className={`border p-2 text-right ${isMobile ? "text-xs" : ""}`}>نوع المنتج</th>
                <th className={`border p-2 text-right ${isMobile ? "text-xs" : ""}`}>المقاس</th>
                <th className={`border p-2 text-right ${isMobile ? "text-xs" : ""}`}>الكمية</th>
                <th className={`border p-2 text-right ${isMobile ? "text-xs" : ""}`}>سعر الوحدة</th>
                <th className={`border p-2 text-right ${isMobile ? "text-xs" : ""}`}>خصم الصنف</th>
                <th className={`border p-2 text-right ${isMobile ? "text-xs" : ""}`}>الإجمالي</th>
                <th className={`border p-2 text-center ${isMobile ? "text-xs" : ""}`}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const isEditing = editingIndex === index;
                const currentItem = isEditing ? editingItem : item;
                const discountedPrice = (currentItem?.price || 0) - (currentItem?.itemDiscount || 0);
                const itemTotal = discountedPrice * (currentItem?.quantity || 0);
                
                return (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className={`border p-2 ${isMobile ? "text-xs" : ""}`}>
                      {isEditing && editMode ? (
                        <Select
                          value={editingItem?.productType || ""}
                          onValueChange={(value) => updateEditingItem("productType", value)}
                        >
                          <SelectTrigger className={isMobile ? "text-xs h-6" : "h-8"}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableProductTypes.map((type) => (
                              <SelectItem key={type} value={type} className={isMobile ? "text-xs" : ""}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={isMobile ? "text-xs" : ""}>{item.productType}</span>
                      )}
                    </td>
                    <td className={`border p-2 ${isMobile ? "text-xs" : ""}`}>
                      {isEditing && editMode ? (
                        <Select
                          value={editingItem?.size || ""}
                          onValueChange={(value) => updateEditingItem("size", value)}
                        >
                          <SelectTrigger className={isMobile ? "text-xs h-6" : "h-8"}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableSizes(editingItem?.productType || "").map((size) => (
                              <SelectItem key={size} value={size} className={isMobile ? "text-xs" : ""}>
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={isMobile ? "text-xs" : ""}>{item.size}</span>
                      )}
                    </td>
                    <td className={`border p-2 text-center ${isMobile ? "text-xs" : ""}`}>
                      {isEditing && editMode ? (
                        <Input
                          type="number"
                          value={editingItem?.quantity || 0}
                          onChange={(e) => updateEditingItem("quantity", parseInt(e.target.value) || 0)}
                          className={`text-center ${isMobile ? "text-xs h-6" : "h-8"}`}
                          min={1}
                        />
                      ) : (
                        <span>{item.quantity}</span>
                      )}
                    </td>
                    <td className={`border p-2 text-right font-semibold text-green-600 ${isMobile ? "text-xs" : ""}`}>
                      {isEditing && editMode ? (
                        <Input
                          type="number"
                          value={editingItem?.price || 0}
                          onChange={(e) => updateEditingItem("price", parseFloat(e.target.value) || 0)}
                          className={`text-right ${isMobile ? "text-xs h-6" : "h-8"}`}
                          step={0.01}
                          min={0}
                        />
                      ) : (
                        formatCurrency(item.price)
                      )}
                    </td>
                    <td className={`border p-2 text-right text-red-600 ${isMobile ? "text-xs" : ""}`}>
                      {isEditing && editMode ? (
                        <Input
                          type="number"
                          value={editingItem?.itemDiscount || 0}
                          onChange={(e) => updateEditingItem("itemDiscount", parseFloat(e.target.value) || 0)}
                          className={`text-right ${isMobile ? "text-xs h-6" : "h-8"}`}
                          step={0.01}
                          min={0}
                          max={editingItem?.price || 0}
                        />
                      ) : (
                        formatCurrency(item.itemDiscount || 0)
                      )}
                    </td>
                    <td className={`border p-2 text-right font-semibold ${isMobile ? "text-xs" : ""}`}>
                      {formatCurrency(itemTotal)}
                    </td>
                    <td className={`border p-2 text-center ${isMobile ? "text-xs" : ""}`}>
                      <div className="flex gap-1 justify-center">
                        {isEditing && editMode ? (
                          <>
                            <Button
                              onClick={saveEdit}
                              variant="default"
                              size="sm"
                              className={`${isMobile ? "h-6 w-6 p-0" : "h-8 w-8 p-0"}`}
                            >
                              <Check className={isMobile ? "h-2 w-2" : "h-4 w-4"} />
                            </Button>
                            <Button
                              onClick={cancelEditing}
                              variant="outline"
                              size="sm"
                              className={`${isMobile ? "h-6 w-6 p-0" : "h-8 w-8 p-0"}`}
                            >
                              <X className={isMobile ? "h-2 w-2" : "h-4 w-4"} />
                            </Button>
                          </>
                        ) : (
                          <>
                            {editMode && onUpdateItem && (
                              <Button
                                onClick={() => startEditing(index)}
                                variant="outline"
                                size="sm"
                                className={`${isMobile ? "h-6 w-6 p-0" : "h-8 w-8 p-0"}`}
                              >
                                <Edit className={isMobile ? "h-2 w-2" : "h-4 w-4"} />
                              </Button>
                            )}
                            <Button
                              onClick={() => onRemoveItem(index)}
                              variant="destructive"
                              size="sm"
                              className={`${isMobile ? "h-6 w-6 p-0" : "h-8 w-8 p-0"}`}
                            >
                              <Trash2 className={isMobile ? "h-2 w-2" : "h-4 w-4"} />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Order Summary */}
        <div className="mt-6 border-t pt-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
            <h3 className={`font-semibold mb-4 text-gray-800 dark:text-white ${isMobile ? "text-sm" : "text-lg"}`}>
              ملخص الطلب
            </h3>
            
            <div className="space-y-3">
              {/* Item Details */}
              {items.map((item, index) => {
                const discountedPrice = item.price - (item.itemDiscount || 0);
                const itemTotal = discountedPrice * item.quantity;
                
                return (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`font-medium text-gray-800 dark:text-white ${isMobile ? "text-xs" : ""}`}>
                        {item.productType} - {item.size} (×{item.quantity})
                      </span>
                    </div>
                    
                    <div className={`space-y-1 ${isMobile ? "text-xs" : "text-sm"}`}>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">سعر المنتج:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(item.price)} × {item.quantity} = {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                      
                      {item.itemDiscount && item.itemDiscount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">خصم الصنف:</span>
                          <span className="font-semibold text-red-600 dark:text-red-400">
                            - {formatCurrency(item.itemDiscount * item.quantity)}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                        <span className="font-medium text-gray-800 dark:text-white">المجموع:</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(itemTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Totals */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className={`space-y-2 ${isMobile ? "text-xs" : ""}`}>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">المجموع الفرعي:</span>
                    <span className="font-semibold">{formatCurrency(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">مصاريف الشحن:</span>
                    <span className="font-semibold">{formatCurrency(shippingCost)}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">الخصم:</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        - {formatCurrency(discount)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">العربون:</span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      {formatCurrency(deposit)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between pt-2 border-t border-gray-300 dark:border-gray-600">
                    <span className={`font-bold text-gray-800 dark:text-white ${isMobile ? "text-sm" : "text-lg"}`}>الإجمالي:</span>
                    <span className={`font-bold text-green-600 dark:text-green-400 ${isMobile ? "text-sm" : "text-lg"}`}>
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ItemsTable;
