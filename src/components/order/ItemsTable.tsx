
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderItem } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ItemsTableProps {
  items: OrderItem[];
  onRemoveItem: (index: number) => void;
  subtotal: number;
  shippingCost: number;
  discount: number;
  deposit: number;
  totalAmount: number;
}

const ItemsTable: React.FC<ItemsTableProps> = ({
  items,
  onRemoveItem,
  subtotal,
  shippingCost,
  deposit,
  totalAmount,
}) => {
  const isMobile = useIsMobile();

  if (items.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className={`${isMobile ? "text-lg" : "text-xl"}`}>
          الأصناف المضافة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="border p-3 text-right">نوع المنتج</th>
                <th className="border p-3 text-right">المقاس</th>
                <th className="border p-3 text-right">الكمية</th>
                <th className="border p-3 text-right">سعر الوحدة</th>
                <th className="border p-3 text-right">خصم الصنف</th>
                <th className="border p-3 text-right">الإجمالي</th>
                <th className="border p-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const discountedPrice = item.price - (item.itemDiscount || 0);
                const itemTotal = discountedPrice * item.quantity;
                
                return (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="border p-3">{item.productType}</td>
                    <td className="border p-3">{item.size}</td>
                    <td className="border p-3 text-center">{item.quantity}</td>
                    <td className="border p-3 text-right font-semibold text-green-600">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="border p-3 text-right text-red-600">
                      {formatCurrency(item.itemDiscount || 0)}
                    </td>
                    <td className="border p-3 text-right font-semibold">
                      {formatCurrency(itemTotal)}
                    </td>
                    <td className="border p-3 text-center">
                      <Button
                        onClick={() => onRemoveItem(index)}
                        variant="destructive"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
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
                      <span className="font-medium text-gray-800 dark:text-white">
                        {item.productType} - {item.size} (×{item.quantity})
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm">
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
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">المجموع الفرعي:</span>
                    <span className="font-semibold">{formatCurrency(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">مصاريف الشحن:</span>
                    <span className="font-semibold">{formatCurrency(shippingCost)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">العربون:</span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      {formatCurrency(deposit)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between pt-2 border-t border-gray-300 dark:border-gray-600">
                    <span className="text-lg font-bold text-gray-800 dark:text-white">الإجمالي:</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
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
