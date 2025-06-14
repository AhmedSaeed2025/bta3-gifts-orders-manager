
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { useTransactions } from "@/context/TransactionContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Receipt, Plus } from "lucide-react";
import AccountSummaryCards from "./account-statement/AccountSummaryCards";
import TransactionFilters from "./account-statement/TransactionFilters";
import TransactionsList from "./account-statement/TransactionsList";
import AddTransactionDialog from "./AddTransactionDialog";
import { Button } from "@/components/ui/button";

const ImprovedAccountStatement = () => {
  const { orders, loading: ordersLoading } = useSupabaseOrders();
  const { transactions, deleteTransaction, refreshTransactions, loading: transactionsLoading } = useTransactions();
  const isMobile = useIsMobile();

  // Filter states
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  // Get available years for filter
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    safeTransactions.forEach(transaction => {
      const year = new Date(transaction.created_at).getFullYear().toString();
      years.add(year);
    });
    return Array.from(years).sort().reverse();
  }, [safeTransactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return safeTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.created_at);
      const transactionYear = transactionDate.getFullYear().toString();
      const transactionMonth = (transactionDate.getMonth() + 1).toString().padStart(2, '0');
      
      if (filterYear !== "all" && transactionYear !== filterYear) return false;
      if (filterMonth !== "all" && transactionMonth !== filterMonth) return false;
      if (filterType !== "all" && transaction.transaction_type !== filterType) return false;
      if (searchTerm && !transaction.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      
      return true;
    });
  }, [safeTransactions, filterMonth, filterYear, filterType, searchTerm]);

  // Calculate enhanced financial summary
  const financialSummary = useMemo(() => {
    let totalRevenue = 0;
    let totalCosts = 0;
    let totalShipping = 0;
    let totalDeposits = 0;
    let totalCollections = 0;
    let totalShippingPayments = 0;
    let totalCostPayments = 0;
    let totalExpenses = 0;
    let totalOtherIncome = 0;

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
        case 'expense':
          totalExpenses += transaction.amount;
          break;
        case 'other_income':
          totalOtherIncome += transaction.amount;
          break;
      }
    });

    // Enhanced profit calculation including additional income and expenses
    const netProfit = totalRevenue - totalCosts - totalShipping + totalOtherIncome - totalExpenses;
    const cashFlow = totalCollections + totalDeposits + totalOtherIncome - totalShippingPayments - totalCostPayments - totalExpenses;

    // Calculate remaining amounts
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
      remainingShipping,
      totalExpenses,
      totalOtherIncome
    };
  }, [safeOrders, safeTransactions]);

  const handleDeleteTransaction = async (transactionId: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذه المعاملة؟")) {
      await deleteTransaction(transactionId);
    }
  };

  const clearFilters = () => {
    setFilterMonth("all");
    setFilterYear("all");
    setFilterType("all");
    setSearchTerm("");
  };

  if (ordersLoading || transactionsLoading) {
    return (
      <Card className="animate-pulse shadow-xl">
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center space-y-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
            <div className="space-y-2">
              <p className={`text-slate-600 dark:text-slate-400 font-medium ${isMobile ? "text-lg" : "text-xl"}`}>
                جاري تحميل كشف الحساب...
              </p>
              <p className={`text-slate-500 dark:text-slate-500 ${isMobile ? "text-sm" : "text-base"}`}>
                يرجى الانتظار قليلاً
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rtl space-y-6 max-w-7xl mx-auto" style={{ direction: 'rtl' }}>
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-l-4 border-l-blue-500 shadow-xl">
        <CardHeader className={`${isMobile ? "pb-3" : "pb-6"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Receipt className={`${isMobile ? "h-5 w-5" : "h-6 w-6"} text-white`} />
              </div>
              <div>
                <CardTitle className={`font-bold text-slate-800 dark:text-white ${isMobile ? "text-lg" : "text-2xl"}`}>
                  كشف الحساب المتطور
                </CardTitle>
                <p className={`text-slate-600 dark:text-slate-400 mt-1 ${isMobile ? "text-sm" : "text-base"}`}>
                  تحليل شامل ومفصل للوضع المالي
                </p>
              </div>
            </div>
            
            <AddTransactionDialog onTransactionAdded={refreshTransactions}>
              <Button 
                className={`bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg ${isMobile ? "text-sm" : "text-base"}`}
                size={isMobile ? "sm" : "default"}
              >
                <Plus className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} ml-2`} />
                إضافة معاملة
              </Button>
            </AddTransactionDialog>
          </div>
        </CardHeader>
      </Card>

      {/* Financial Summary Cards */}
      <AccountSummaryCards financialSummary={financialSummary} />

      {/* Transaction Filters */}
      <TransactionFilters
        filterMonth={filterMonth}
        setFilterMonth={setFilterMonth}
        filterYear={filterYear}
        setFilterYear={setFilterYear}
        filterType={filterType}
        setFilterType={setFilterType}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        availableYears={availableYears}
        onClearFilters={clearFilters}
      />

      {/* Transactions List */}
      <TransactionsList
        transactions={filteredTransactions}
        onDeleteTransaction={handleDeleteTransaction}
      />
    </div>
  );
};

export default ImprovedAccountStatement;
