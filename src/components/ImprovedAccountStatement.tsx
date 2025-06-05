
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { useTransactions } from "@/context/TransactionContext";
import { formatCurrency } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Receipt,
  Plus,
  Minus
} from "lucide-react";

const ImprovedAccountStatement = () => {
  const { orders, loading: ordersLoading } = useSupabaseOrders();
  const { transactions, deleteTransaction, loading: transactionsLoading } = useTransactions();
  const isMobile = useIsMobile();

  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  // Calculate correct profits and financial summary
  const financialSummary = useMemo(() => {
    let totalRevenue = 0;
    let totalCosts = 0;
    let totalShipping = 0;
    let totalDeposits = 0;
    let totalCollections = 0;
    let totalShippingPayments = 0;
    let totalCostPayments = 0;

    // Calculate from orders
    safeOrders.forEach(order => {
      totalRevenue += order.total;
      totalDeposits += order.deposit || 0;
      totalShipping += order.shippingCost || 0;
      
      // Calculate actual costs from items
      const orderCosts = order.items?.reduce((sum, item) => sum + (item.cost * item.quantity), 0) || 0;
      totalCosts += orderCosts;
    });

    // Calculate from transactions
    safeTransactions.forEach(transaction => {
      switch (transaction.transaction_type) {
        case 'order_collection':
          totalCollections += transaction.amount;
          break;
        case 'shipping_payment':
          totalShippingPayments += transaction.amount;
          break;
        case 'cost_payment':
          totalCostPayments += transaction.amount;
          break;
      }
    });

    // Fixed profit calculation: Revenue - Costs - Shipping (العربون لا يؤثر على الربح)
    const netProfit = totalRevenue - totalCosts - totalShipping;
    const cashFlow = totalCollections + totalDeposits - totalShippingPayments - totalCostPayments;

    return {
      totalRevenue,
      totalCosts,
      totalShipping,
      totalDeposits,
      netProfit,
      totalCollections,
      totalShippingPayments,
      totalCostPayments,
      cashFlow
    };
  }, [safeOrders, safeTransactions]);

  const handleDeleteTransaction = async (transactionId: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذه المعاملة؟")) {
      await deleteTransaction(transactionId);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'order_collection':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'shipping_payment':
      case 'cost_payment':
        return <Minus className="h-4 w-4 text-red-600" />;
      default:
        return <Receipt className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'order_collection':
        return 'تحصيل طلب';
      case 'shipping_payment':
        return 'دفع شحن';
      case 'cost_payment':
        return 'دفع تكلفة';
      default:
        return type;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'order_collection':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'shipping_payment':
      case 'cost_payment':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (ordersLoading || transactionsLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gift-primary border-t-transparent mx-auto"></div>
            <p className="text-lg text-gray-600 dark:text-gray-400">جاري تحميل كشف الحساب...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rtl space-y-6" style={{ direction: 'rtl' }}>
      {/* Financial Summary */}
      <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2 md:grid-cols-5"}`}>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium">إجمالي المبيعات</p>
                <p className={`${isMobile ? "text-sm" : "text-lg"} font-bold`}>{formatCurrency(financialSummary.totalRevenue)}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-xs font-medium">إجمالي التكاليف</p>
                <p className={`${isMobile ? "text-sm" : "text-lg"} font-bold`}>{formatCurrency(financialSummary.totalCosts)}</p>
              </div>
              <TrendingDown className="h-6 w-6 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-xs font-medium">إجمالي الشحن</p>
                <p className={`${isMobile ? "text-sm" : "text-lg"} font-bold`}>{formatCurrency(financialSummary.totalShipping)}</p>
              </div>
              <TrendingDown className="h-6 w-6 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs font-medium">صافي الربح</p>
                <p className={`${isMobile ? "text-sm" : "text-lg"} font-bold`}>{formatCurrency(financialSummary.netProfit)}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs font-medium">التدفق النقدي</p>
                <p className={`${isMobile ? "text-sm" : "text-lg"} font-bold`}>{formatCurrency(financialSummary.cashFlow)}</p>
              </div>
              <DollarSign className="h-6 w-6 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            سجل المعاملات المالية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {safeTransactions.length > 0 ? (
              safeTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.transaction_type)}
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getTransactionColor(transaction.transaction_type)}>
                          {getTransactionLabel(transaction.transaction_type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-semibold ${
                      transaction.transaction_type === 'order_collection' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {transaction.transaction_type === 'order_collection' ? '+' : '-'}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </span>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteTransaction(transaction.id)}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      {!isMobile && "حذف"}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-lg">لا توجد معاملات مسجلة</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImprovedAccountStatement;
