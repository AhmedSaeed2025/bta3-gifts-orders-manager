
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

  // Calculate enhanced financial summary with new required fields
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

    // Fixed profit calculation: Revenue - Costs - Shipping
    const netProfit = totalRevenue - totalCosts - totalShipping;
    const cashFlow = totalCollections + totalDeposits - totalShippingPayments - totalCostPayments;

    // Calculate remaining amounts - هذا هو المطلوب الجديد
    const remainingCosts = totalCosts - totalCostPayments;
    const remainingShipping = totalShipping - totalShippingPayments;

    return {
      totalRevenue,
      totalCosts,
      totalShipping,
      totalDeposits,
      netProfit,
      totalCollections,
      totalShippingPayments,
      totalCostPayments,
      cashFlow,
      remainingCosts,
      remainingShipping
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
        return <Plus className={`${isMobile ? "h-2 w-2" : "h-3 w-3"} text-green-600`} />;
      case 'shipping_payment':
      case 'cost_payment':
        return <Minus className={`${isMobile ? "h-2 w-2" : "h-3 w-3"} text-red-600`} />;
      default:
        return <Receipt className={`${isMobile ? "h-2 w-2" : "h-3 w-3"} text-gray-600`} />;
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

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (ordersLoading || transactionsLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gift-primary border-t-transparent mx-auto"></div>
            <p className={`text-gray-600 dark:text-gray-400 ${isMobile ? "text-sm" : "text-lg"}`}>جاري تحميل كشف الحساب...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rtl space-y-4" style={{ direction: 'rtl' }}>
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-l-blue-500">
        <CardHeader className={`${isMobile ? "pb-2" : "pb-3"}`}>
          <div className="flex items-center gap-2">
            <div className="p-1 bg-blue-500 rounded-lg">
              <Receipt className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} text-white`} />
            </div>
            <div>
              <CardTitle className={`font-bold text-gray-800 dark:text-white ${isMobile ? "text-sm" : "text-base"}`}>
                كشف الحساب
              </CardTitle>
              {!isMobile && (
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-xs">
                  ملخص شامل للحالة المالية والمعاملات
                </p>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Enhanced Financial Summary - مع إضافة البطاقات الجديدة المطلوبة */}
      <div className={`grid gap-2 ${isMobile ? "grid-cols-1" : "grid-cols-2 md:grid-cols-7"}`}>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className={isMobile ? "p-2" : "p-2"}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-blue-100 font-medium ${isMobile ? "text-xs" : "text-xs"}`}>
                  {truncateText("إجمالي المبيعات", isMobile ? 8 : 15)}
                </p>
                <p className={`font-bold ltr-numbers ${isMobile ? "text-xs" : "text-sm"}`}>{formatCurrency(financialSummary.totalRevenue)}</p>
              </div>
              <TrendingUp className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} text-blue-200`} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className={isMobile ? "p-2" : "p-2"}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-red-100 font-medium ${isMobile ? "text-xs" : "text-xs"}`}>
                  {truncateText("إجمالي التكاليف", isMobile ? 8 : 15)}
                </p>
                <p className={`font-bold ltr-numbers ${isMobile ? "text-xs" : "text-sm"}`}>{formatCurrency(financialSummary.totalCosts)}</p>
              </div>
              <TrendingDown className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} text-red-200`} />
            </div>
          </CardContent>
        </Card>

        {/* بطاقة جديدة: التكاليف المدفوعة */}
        <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white">
          <CardContent className={isMobile ? "p-2" : "p-2"}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-pink-100 font-medium ${isMobile ? "text-xs" : "text-xs"}`}>
                  {truncateText("التكاليف المدفوعة", isMobile ? 8 : 15)}
                </p>
                <p className={`font-bold ltr-numbers ${isMobile ? "text-xs" : "text-sm"}`}>{formatCurrency(financialSummary.totalCostPayments)}</p>
              </div>
              <Minus className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} text-pink-200`} />
            </div>
          </CardContent>
        </Card>

        {/* بطاقة جديدة: التكاليف المتبقية */}
        <Card className="bg-gradient-to-br from-rose-500 to-rose-600 text-white">
          <CardContent className={isMobile ? "p-2" : "p-2"}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-rose-100 font-medium ${isMobile ? "text-xs" : "text-xs"}`}>
                  {truncateText("التكاليف المتبقية", isMobile ? 8 : 15)}
                </p>
                <p className={`font-bold ltr-numbers ${isMobile ? "text-xs" : "text-sm"}`}>{formatCurrency(financialSummary.remainingCosts)}</p>
              </div>
              <TrendingDown className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} text-rose-200`} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className={isMobile ? "p-2" : "p-2"}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-orange-100 font-medium ${isMobile ? "text-xs" : "text-xs"}`}>
                  {truncateText("إجمالي الشحن", isMobile ? 8 : 15)}
                </p>
                <p className={`font-bold ltr-numbers ${isMobile ? "text-xs" : "text-sm"}`}>{formatCurrency(financialSummary.totalShipping)}</p>
              </div>
              <TrendingDown className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} text-orange-200`} />
            </div>
          </CardContent>
        </Card>

        {/* بطاقة جديدة: الشحن المدفوع */}
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardContent className={isMobile ? "p-2" : "p-2"}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-amber-100 font-medium ${isMobile ? "text-xs" : "text-xs"}`}>
                  {truncateText("الشحن المدفوع", isMobile ? 8 : 15)}
                </p>
                <p className={`font-bold ltr-numbers ${isMobile ? "text-xs" : "text-sm"}`}>{formatCurrency(financialSummary.totalShippingPayments)}</p>
              </div>
              <Minus className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} text-amber-200`} />
            </div>
          </CardContent>
        </Card>

        {/* بطاقة جديدة: الشحن المتبقي */}
        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <CardContent className={isMobile ? "p-2" : "p-2"}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-yellow-100 font-medium ${isMobile ? "text-xs" : "text-xs"}`}>
                  {truncateText("الشحن المتبقي", isMobile ? 8 : 15)}
                </p>
                <p className={`font-bold ltr-numbers ${isMobile ? "text-xs" : "text-sm"}`}>{formatCurrency(financialSummary.remainingShipping)}</p>
              </div>
              <TrendingDown className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} text-yellow-200`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row - Main Metrics */}
      <div className={`grid gap-2 ${isMobile ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3"}`}>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className={isMobile ? "p-2" : "p-2"}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-green-100 font-medium ${isMobile ? "text-xs" : "text-xs"}`}>
                  {truncateText("صافي الربح", isMobile ? 8 : 15)}
                </p>
                <p className={`font-bold ltr-numbers ${isMobile ? "text-xs" : "text-sm"}`}>{formatCurrency(financialSummary.netProfit)}</p>
              </div>
              <TrendingUp className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} text-green-200`} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className={isMobile ? "p-2" : "p-2"}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-emerald-100 font-medium ${isMobile ? "text-xs" : "text-xs"}`}>
                  {truncateText("إجمالي المحصل", isMobile ? 8 : 15)}
                </p>
                <p className={`font-bold ltr-numbers ${isMobile ? "text-xs" : "text-sm"}`}>{formatCurrency(financialSummary.totalCollections)}</p>
              </div>
              <Plus className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} text-emerald-200`} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className={isMobile ? "p-2" : "p-2"}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-purple-100 font-medium ${isMobile ? "text-xs" : "text-xs"}`}>
                  {truncateText("التدفق النقدي", isMobile ? 8 : 15)}
                </p>
                <p className={`font-bold ltr-numbers ${isMobile ? "text-xs" : "text-sm"}`}>{formatCurrency(financialSummary.cashFlow)}</p>
              </div>
              <DollarSign className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} text-purple-200`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions History */}
      <Card>
        <CardHeader className={`${isMobile ? "pb-2" : "pb-3"}`}>
          <CardTitle className={`font-medium flex items-center gap-2 ${isMobile ? "text-sm" : "text-base"}`}>
            <Receipt className={`${isMobile ? "h-3 w-3" : "h-4 w-4"}`} />
            {truncateText("سجل المعاملات المالية", isMobile ? 15 : 30)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {safeTransactions.length > 0 ? (
              safeTransactions.map((transaction) => (
                <div key={transaction.id} className={`flex items-center justify-between ${isMobile ? "p-2" : "p-3"} bg-gray-50 dark:bg-gray-800 rounded-lg`}>
                  <div className="flex items-center gap-2">
                    {getTransactionIcon(transaction.transaction_type)}
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${getTransactionColor(transaction.transaction_type)} ${isMobile ? "text-xs" : "text-xs"}`}>
                          {getTransactionLabel(transaction.transaction_type)}
                        </Badge>
                      </div>
                      <p className={`text-gray-600 dark:text-gray-400 mt-1 ${isMobile ? "text-xs" : "text-xs"}`}>
                        {truncateText(transaction.description, isMobile ? 20 : 40)}
                      </p>
                      <p className={`text-gray-500 dark:text-gray-500 ${isMobile ? "text-xs" : "text-xs"}`}>
                        {new Date(transaction.created_at).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${isMobile ? "text-xs" : "text-sm"} ${
                      transaction.transaction_type === 'order_collection' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    } ltr-numbers`}>
                      {transaction.transaction_type === 'order_collection' ? '+' : '-'}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </span>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteTransaction(transaction.id)}
                      className={`flex items-center gap-1 ${isMobile ? "h-5 text-xs" : "h-6 text-xs"}`}
                    >
                      <Trash2 className={`${isMobile ? "h-2 w-2" : "h-3 w-3"}`} />
                      {!isMobile && "حذف"}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Receipt className={`${isMobile ? "h-8 w-8" : "h-12 w-12"} text-gray-400 mx-auto mb-2`} />
                <p className={`text-gray-500 ${isMobile ? "text-sm" : "text-base"}`}>لا توجد معاملات مسجلة</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImprovedAccountStatement;
