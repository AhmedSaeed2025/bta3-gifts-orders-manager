
import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderItem } from "@/types";

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
  discount,
  deposit,
  totalAmount,
}) => {
  if (items.length === 0) return null;

  return (
    <div className="mt-4">
      <h4 className="font-medium mb-2">المنتجات المضافة:</h4>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">نوع المنتج</TableHead>
              <TableHead className="text-xs">المقاس</TableHead>
              <TableHead className="text-xs">الكمية</TableHead>
              <TableHead className="text-xs">السعر الأساسي</TableHead>
              <TableHead className="text-xs">خصم القطعة</TableHead>
              <TableHead className="text-xs">السعر بعد الخصم</TableHead>
              <TableHead className="text-xs">الإجمالي</TableHead>
              <TableHead className="text-xs">إجراء</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => {
              const discountedPrice = item.price - (item.itemDiscount || 0);
              const totalItemDiscount = (item.itemDiscount || 0) * item.quantity;
              return (
                <TableRow key={idx}>
                  <TableCell className="text-xs">{item.productType}</TableCell>
                  <TableCell className="text-xs">{item.size}</TableCell>
                  <TableCell className="text-xs text-center">{item.quantity}</TableCell>
                  <TableCell className="text-xs">{item.price} جنيه</TableCell>
                  <TableCell className="text-xs text-red-600">{item.itemDiscount || 0} جنيه</TableCell>
                  <TableCell className="text-xs text-green-600">{discountedPrice} جنيه</TableCell>
                  <TableCell className="text-xs font-bold">{discountedPrice * item.quantity} جنيه</TableCell>
                  <TableCell>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => onRemoveItem(idx)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      <div className="mt-4 border-t pt-4">
        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span>إجمالي سعر المنتجات (بعد خصم الأصناف):</span>
            <span className="font-bold">{subtotal} جنيه</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>إجمالي خصومات الأصناف:</span>
            <span className="font-bold text-red-600">
              {items.reduce((sum, item) => sum + ((item.itemDiscount || 0) * item.quantity), 0)} جنيه
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>+ مصاريف الشحن:</span>
            <span className="font-bold">{shippingCost} جنيه</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>- الخصم الإجمالي:</span>
            <span className="font-bold text-red-600">{discount} جنيه</span>
          </div>
          {deposit > 0 && (
            <div className="flex justify-between text-sm">
              <span>- العربون المدفوع:</span>
              <span className="font-bold text-red-600">{deposit} جنيه</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>الإجمالي الكلي:</span>
            <span className="text-green-600">{totalAmount} جنيه</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemsTable;
