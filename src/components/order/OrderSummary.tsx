
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { OrderItem } from "@/types";

interface OrderSummaryProps {
  items: OrderItem[];
  shippingCost: number;
  deposit: number;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  shippingCost,
  deposit,
}) => {
  const subtotal = items.reduce((sum, item) => {
    const discountedPrice = item.price - (item.itemDiscount || 0);
    return sum + discountedPrice * item.quantity;
  }, 0);

  const totalAmount = subtotal + shippingCost - deposit;
  
  const totalProfit = items.reduce((sum, item) => {
    const discountedPrice = item.price - (item.itemDiscount || 0);
    return sum + (discountedPrice - item.cost) * item.quantity;
  }, 0) - shippingCost;

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">ملخص الطلب</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">المجموع الفرعي:</span>
          <span className="font-semibold">{formatCurrency(subtotal)}</span>
        </div>
        
        {shippingCost > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">الشحن:</span>
            <span className="font-semibold text-orange-600">+{formatCurrency(shippingCost)}</span>
          </div>
        )}
        
        {deposit > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">العربون المدفوع:</span>
            <span className="font-semibold text-green-600">-{formatCurrency(deposit)}</span>
          </div>
        )}
        
        <hr className="border-gray-300" />
        
        <div className="flex justify-between items-center text-lg">
          <span className="font-bold">الإجمالي النهائي:</span>
          <span className="font-bold text-blue-600">{formatCurrency(totalAmount)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">الربح المتوقع:</span>
          <span className={`font-semibold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(totalProfit)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderSummary;
