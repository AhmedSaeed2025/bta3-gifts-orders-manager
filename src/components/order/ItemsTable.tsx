
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderItem, Product } from "@/types";
import { Trash2, Edit, Save, X, ShoppingBag } from "lucide-react";
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
  remainingAmount?: number;
  products: Product[];
  editMode?: boolean;
  totalCost?: number;
  netProfit?: number;
}

const ItemsTable = ({ 
  items, onRemoveItem, onUpdateItem, subtotal, shippingCost, discount, deposit, totalAmount,
  remainingAmount, products, editMode = false, totalCost = 0, netProfit = 0
}: ItemsTableProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const isMobile = useIsMobile();

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditingItem({ ...items[index] });
  };

  const cancelEditing = () => { setEditingIndex(null); setEditingItem(null); };

  const saveEdit = (index: number) => {
    if (editingItem) { onUpdateItem(index, editingItem); setEditingIndex(null); setEditingItem(null); }
  };

  const handleEditChange = (field: keyof OrderItem, value: string | number) => {
    if (editingItem) setEditingItem(prev => prev ? { ...prev, [field]: value } : null);
  };

  const getAvailableSizes = (productType: string) => {
    const product = products.find(p => p.name === productType);
    return product?.sizes.map(s => s.size) || [];
  };

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-xl p-8 text-center">
        <ShoppingBag size={32} className="mx-auto text-muted-foreground/40 mb-2" />
        <p className="text-muted-foreground text-sm">لم يتم إضافة أي أصناف بعد</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-primary">
        <ShoppingBag size={18} />
        <h3 className="font-semibold text-sm">الأصناف المضافة ({items.length})</h3>
      </div>

      {/* Mobile: Card layout */}
      {isMobile ? (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="bg-muted/30 rounded-lg p-3 space-y-2">
              {editingIndex === index && editingItem ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={editingItem.productType} onChange={(e) => handleEditChange('productType', e.target.value)} className="h-8 text-xs" placeholder="المنتج" />
                    <Input value={editingItem.size} onChange={(e) => handleEditChange('size', e.target.value)} className="h-8 text-xs" placeholder="المقاس" />
                    <Input type="number" value={editingItem.quantity} onChange={(e) => handleEditChange('quantity', parseInt(e.target.value) || 1)} className="h-8 text-xs text-center" min="1" />
                    <Input type="number" value={editingItem.price} onChange={(e) => handleEditChange('price', parseFloat(e.target.value) || 0)} className="h-8 text-xs text-center" step="0.01" />
                    <Input type="number" value={editingItem.cost} onChange={(e) => handleEditChange('cost', parseFloat(e.target.value) || 0)} className="h-8 text-xs text-center" step="0.01" />
                    <Input type="number" value={editingItem.itemDiscount || 0} onChange={(e) => handleEditChange('itemDiscount', parseFloat(e.target.value) || 0)} className="h-8 text-xs text-center" step="0.01" />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" onClick={(e) => { e.preventDefault(); saveEdit(index); }} size="sm" className="h-7 text-xs flex-1 bg-green-600 hover:bg-green-700">
                      <Save size={12} className="ml-1" /> حفظ
                    </Button>
                    <Button type="button" onClick={(e) => { e.preventDefault(); cancelEditing(); }} size="sm" variant="outline" className="h-7 text-xs flex-1">
                      <X size={12} className="ml-1" /> إلغاء
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm">{item.productType}</span>
                      <span className="text-muted-foreground text-xs mr-2">({item.size})</span>
                    </div>
                    <div className="flex gap-1">
                      <Button type="button" onClick={(e) => { e.preventDefault(); startEditing(index); }} size="sm" variant="ghost" className="h-7 w-7 p-0">
                        <Edit size={14} />
                      </Button>
                      <Button type="button" onClick={(e) => { e.preventDefault(); onRemoveItem(index); }} size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{item.quantity} × {item.price} ج.م {(item.itemDiscount || 0) > 0 && `(-${item.itemDiscount})`}</span>
                    <span className="font-bold text-foreground">
                      {((item.price - (item.itemDiscount || 0)) * item.quantity).toFixed(2)} ج.م
                    </span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Desktop: Table */
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="p-2.5 text-right text-xs font-medium text-muted-foreground">المنتج</th>
                <th className="p-2.5 text-right text-xs font-medium text-muted-foreground">المقاس</th>
                <th className="p-2.5 text-center text-xs font-medium text-muted-foreground">الكمية</th>
                <th className="p-2.5 text-right text-xs font-medium text-muted-foreground">التكلفة</th>
                <th className="p-2.5 text-right text-xs font-medium text-muted-foreground">السعر</th>
                <th className="p-2.5 text-right text-xs font-medium text-muted-foreground">خصم</th>
                <th className="p-2.5 text-right text-xs font-medium text-muted-foreground">الإجمالي</th>
                <th className="p-2.5 text-center text-xs font-medium text-muted-foreground w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item, index) => (
                <tr key={index} className="hover:bg-muted/30 transition-colors">
                  {editingIndex === index && editingItem ? (
                    <>
                      <td className="p-2">
                        <Input value={editingItem.productType} onChange={(e) => handleEditChange('productType', e.target.value)} className="h-7 text-xs" />
                      </td>
                      <td className="p-2">
                        <Input value={editingItem.size} onChange={(e) => handleEditChange('size', e.target.value)} className="h-7 text-xs" />
                      </td>
                      <td className="p-2">
                        <Input type="number" value={editingItem.quantity} onChange={(e) => handleEditChange('quantity', parseInt(e.target.value) || 1)} className="h-7 text-xs text-center" min="1" />
                      </td>
                      <td className="p-2">
                        <Input type="number" value={editingItem.cost} onChange={(e) => handleEditChange('cost', parseFloat(e.target.value) || 0)} className="h-7 text-xs" step="0.01" />
                      </td>
                      <td className="p-2">
                        <Input type="number" value={editingItem.price} onChange={(e) => handleEditChange('price', parseFloat(e.target.value) || 0)} className="h-7 text-xs" step="0.01" />
                      </td>
                      <td className="p-2">
                        <Input type="number" value={editingItem.itemDiscount || 0} onChange={(e) => handleEditChange('itemDiscount', parseFloat(e.target.value) || 0)} className="h-7 text-xs" step="0.01" />
                      </td>
                      <td className="p-2 text-xs">{((editingItem.price - (editingItem.itemDiscount || 0)) * editingItem.quantity).toFixed(2)}</td>
                      <td className="p-2">
                        <div className="flex gap-1 justify-center">
                          <Button type="button" onClick={(e) => { e.preventDefault(); saveEdit(index); }} size="sm" className="h-6 w-6 p-0 bg-green-600 hover:bg-green-700"><Save size={12} /></Button>
                          <Button type="button" onClick={(e) => { e.preventDefault(); cancelEditing(); }} size="sm" variant="outline" className="h-6 w-6 p-0"><X size={12} /></Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-2.5 text-xs font-medium">{item.productType}</td>
                      <td className="p-2.5 text-xs">{item.size}</td>
                      <td className="p-2.5 text-center text-xs">{item.quantity}</td>
                      <td className="p-2.5 text-xs">{item.cost.toFixed(2)}</td>
                      <td className="p-2.5 text-xs">{item.price.toFixed(2)}</td>
                      <td className="p-2.5 text-xs">{(item.itemDiscount || 0).toFixed(2)}</td>
                      <td className="p-2.5 text-xs font-semibold">{((item.price - (item.itemDiscount || 0)) * item.quantity).toFixed(2)}</td>
                      <td className="p-2.5">
                        <div className="flex gap-1 justify-center">
                          <Button type="button" onClick={(e) => { e.preventDefault(); startEditing(index); }} size="sm" variant="ghost" className="h-6 w-6 p-0"><Edit size={12} /></Button>
                          <Button type="button" onClick={(e) => { e.preventDefault(); onRemoveItem(index); }} size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive hover:text-destructive"><Trash2 size={12} /></Button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Financial Summary */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-2">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          <span className="text-muted-foreground">المجموع الفرعي</span>
          <span className="text-left font-medium text-green-600 dark:text-green-400">{subtotal.toFixed(2)} ج.م</span>
          
          <span className="text-muted-foreground">إجمالي التكلفة</span>
          <span className="text-left font-medium text-destructive">{totalCost.toFixed(2)} ج.م</span>
          
          <span className="text-muted-foreground">مصاريف الشحن</span>
          <span className="text-left font-medium">{shippingCost.toFixed(2)} ج.م</span>
          
          {discount > 0 && (
            <>
              <span className="text-muted-foreground">خصم الفاتورة</span>
              <span className="text-left font-medium text-orange-600">-{discount.toFixed(2)} ج.م</span>
            </>
          )}
          {deposit > 0 && (
            <>
              <span className="text-muted-foreground">العربون</span>
              <span className="text-left font-medium">-{deposit.toFixed(2)} ج.م</span>
            </>
          )}
        </div>
        
        <div className="border-t border-border pt-2 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">صافي الربح</span>
            <span className="font-bold text-green-600 dark:text-green-400">{netProfit.toFixed(2)} ج.م</span>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span>الإجمالي الكلي</span>
            <span className="text-primary">{totalAmount.toFixed(2)} ج.م</span>
          </div>
          {deposit > 0 && remainingAmount !== undefined && (
            <div className="flex justify-between text-base font-bold text-destructive">
              <span>المتبقي</span>
              <span>{remainingAmount.toFixed(2)} ج.م</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemsTable;
