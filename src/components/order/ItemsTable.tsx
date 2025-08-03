
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderItem, Product } from "@/types";
import { Trash2, Edit, Save, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ItemsTableProps {
  items: OrderItem[];
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, item: OrderItem) => void;
  subtotal: number;
  shippingCost: number;
  discount: number;
  deposit: number;
  totalAmount: number;
  products: Product[];
  editMode?: boolean;
  totalCost?: number;
  netProfit?: number;
}

const ItemsTable = ({ 
  items, 
  onRemoveItem, 
  onUpdateItem, 
  subtotal, 
  shippingCost, 
  discount, 
  deposit, 
  totalAmount,
  products,
  editMode = false,
  totalCost = 0,
  netProfit = 0
}: ItemsTableProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const isMobile = useIsMobile();

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditingItem({ ...items[index] });
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditingItem(null);
  };

  const saveEdit = (index: number) => {
    if (editingItem) {
      onUpdateItem(index, editingItem);
      setEditingIndex(null);
      setEditingItem(null);
    }
  };

  const handleEditChange = (field: keyof OrderItem, value: string | number) => {
    if (editingItem) {
      setEditingItem(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const getAvailableSizes = (productType: string) => {
    const product = products.find(p => p.name === productType);
    return product?.sizes.map(s => s.size) || [];
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className={isMobile ? "text-sm" : "text-base"}>الأصناف المضافة</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-4 text-xs">لم يتم إضافة أي أصناف بعد</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className={isMobile ? "text-sm" : "text-base"}>الأصناف المضافة</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-right text-xs">نوع المنتج</th>
                <th className="border border-gray-300 p-2 text-right text-xs">المقاس</th>
                <th className="border border-gray-300 p-2 text-center text-xs">الكمية</th>
                <th className="border border-gray-300 p-2 text-right text-xs">التكلفة</th>
                <th className="border border-gray-300 p-2 text-right text-xs">السعر</th>
                <th className="border border-gray-300 p-2 text-right text-xs">خصم الصنف</th>
                <th className="border border-gray-300 p-2 text-right text-xs">الإجمالي</th>
                <th className="border border-gray-300 p-2 text-center text-xs">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  {editingIndex === index && editingItem ? (
                    <>
                      <td className="border border-gray-300 p-2">
                        <Select 
                          value={editingItem.productType} 
                          onValueChange={(value) => handleEditChange('productType', value)}
                        >
                          <SelectTrigger className="text-xs h-6">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[...new Set(products.map(p => p.name))].map(type => (
                              <SelectItem key={type} value={type} className="text-xs">{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="border border-gray-300 p-2">
                        <Select 
                          value={editingItem.size} 
                          onValueChange={(value) => handleEditChange('size', value)}
                        >
                          <SelectTrigger className="text-xs h-6">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableSizes(editingItem.productType).map(size => (
                              <SelectItem key={size} value={size} className="text-xs">{size}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="border border-gray-300 p-2">
                        <Input
                          type="number"
                          value={editingItem.quantity}
                          onChange={(e) => handleEditChange('quantity', parseInt(e.target.value) || 1)}
                          className="text-xs h-6 text-center"
                          min="1"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <Input
                          type="number"
                          value={editingItem.cost}
                          onChange={(e) => handleEditChange('cost', parseFloat(e.target.value) || 0)}
                          className="text-xs h-6"
                          step="0.01"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <Input
                          type="number"
                          value={editingItem.price}
                          onChange={(e) => handleEditChange('price', parseFloat(e.target.value) || 0)}
                          className="text-xs h-6"
                          step="0.01"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <Input
                          type="number"
                          value={editingItem.itemDiscount || 0}
                          onChange={(e) => handleEditChange('itemDiscount', parseFloat(e.target.value) || 0)}
                          className="text-xs h-6"
                          step="0.01"
                        />
                      </td>
                      <td className="border border-gray-300 p-2 text-xs">
                        {((editingItem.price - (editingItem.itemDiscount || 0)) * editingItem.quantity).toFixed(2)} ج.م
                      </td>
                      <td className="border border-gray-300 p-2">
                        <div className="flex gap-1 justify-center">
                          <Button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              saveEdit(index);
                            }}
                            size="sm"
                            className="h-6 w-6 p-0 bg-green-500 hover:bg-green-600"
                          >
                            <Save size={12} />
                          </Button>
                          <Button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              cancelEditing();
                            }}
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0"
                          >
                            <X size={12} />
                          </Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="border border-gray-300 p-2 text-xs">{item.productType}</td>
                      <td className="border border-gray-300 p-2 text-xs">{item.size}</td>
                      <td className="border border-gray-300 p-2 text-center text-xs">{item.quantity}</td>
                      <td className="border border-gray-300 p-2 text-xs">{item.cost.toFixed(2)} ج.م</td>
                      <td className="border border-gray-300 p-2 text-xs">{item.price.toFixed(2)} ج.م</td>
                      <td className="border border-gray-300 p-2 text-xs">{(item.itemDiscount || 0).toFixed(2)} ج.م</td>
                      <td className="border border-gray-300 p-2 text-xs">
                        {((item.price - (item.itemDiscount || 0)) * item.quantity).toFixed(2)} ج.م
                      </td>
                      <td className="border border-gray-300 p-2">
                        <div className="flex gap-1 justify-center">
                          <Button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              startEditing(index);
                            }}
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0"
                          >
                            <Edit size={12} />
                          </Button>
                          <Button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onRemoveItem(index);
                            }}
                            size="sm"
                            variant="destructive"
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 space-y-2 border-t pt-4">
          <div className="flex justify-between text-sm">
            <span>المجموع الفرعي:</span>
            <span className="text-green-600 font-bold">{subtotal.toFixed(2)} ج.م</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>إجمالي التكلفة:</span>
            <span className="text-red-600 font-bold">{totalCost.toFixed(2)} ج.م</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>مصاريف الشحن:</span>
            <span>{shippingCost.toFixed(2)} ج.م</span>
          </div>
          {deposit > 0 && (
            <div className="flex justify-between text-sm">
              <span>العربون:</span>
              <span>-{deposit.toFixed(2)} ج.م</span>
            </div>
          )}
          <div className="flex justify-between text-sm border-t pt-2">
            <span>صافي الربح:</span>
            <span className="text-green-600 font-bold">{netProfit.toFixed(2)} ج.م</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>الإجمالي:</span>
            <span>{totalAmount.toFixed(2)} ج.م</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ItemsTable;
