import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface OrderStatsCardsProps {
  totalOrders: number;
  pendingOrders: number;
  totalOrdersValue: number;
  totalOrderCost: number;
  totalShipping: number;
  totalDeposit: number;
  totalNetProfit: number;
}

const OrderStatsCards = ({
  totalOrders,
  pendingOrders,
  totalOrdersValue,
  totalOrderCost,
  totalShipping,
  totalDeposit,
  totalNetProfit
}: OrderStatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {totalOrders}
          </div>
          <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {pendingOrders}
          </div>
          <p className="text-sm text-muted-foreground">طلبات في الانتظار</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalOrdersValue)}
          </div>
          <p className="text-sm text-muted-foreground">المجموع الفرعي</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(totalOrderCost)}
          </div>
          <p className="text-sm text-muted-foreground">إجمالي التكلفة</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(totalShipping)}
          </div>
          <p className="text-sm text-muted-foreground">مصاريف الشحن</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-blue-500">
            {formatCurrency(totalDeposit)}
          </div>
          <p className="text-sm text-muted-foreground">العربون</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(totalNetProfit)}
          </div>
          <p className="text-sm text-muted-foreground">صافي الربح</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderStatsCards;