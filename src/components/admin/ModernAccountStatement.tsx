import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { useDateFilter } from '@/components/tabs/StyledIndexTabs';
import { 
  Plus, 
  Minus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calculator,
  Edit,
  Trash2,
  Filter,
  Save,
  X
} from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  description?: string;
  order_serial: string;
  created_at: string;
}

interface OrderData {
  id: string;
  total_amount: number;
  shipping_cost: number;
  profit: number;
  payments_received: number;
  remaining_amount: number;
  status: string;
  deposit: number;
  created_at: string;
}

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  shippingExpenses: number;
  costExpenses: number;
  otherExpenses: number;
  totalProductCosts: number;
  netProfit: number;
  currentBalance: number;
  totalOrderRevenue: number;
  // Income breakdown
  depositIncome: number;
  salesIncome: number;
  otherIncome: number;
}

const ModernAccountStatement = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { startDate, endDate } = useDateFilter();
  
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  // Fetch transactions
  const { data: allTransactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!user
  });

  // Fetch orders data
  const { data: allOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders-for-modern-statement'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('admin_orders')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching orders:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!user
  });

  // Filter by date
  const transactions = useMemo(() => {
    return allTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.created_at);
      const matchesDateFrom = !startDate || transactionDate >= startDate;
      const matchesDateTo = !endDate || transactionDate <= endDate;
      return matchesDateFrom && matchesDateTo;
    });
  }, [allTransactions, startDate, endDate]);

  const orders = useMemo(() => {
    return allOrders.filter(order => {
      const orderDate = new Date(order.created_at);
      const matchesDateFrom = !startDate || orderDate >= startDate;
      const matchesDateTo = !endDate || orderDate <= endDate;
      return matchesDateFrom && matchesDateTo;
    });
  }, [allOrders, startDate, endDate]);

  // Calculate financial summary with expense breakdown
  const financialSummary = useMemo(() => {
    // Calculate orders summary (for costs reference only)
    const ordersSummary = orders.reduce((acc, order: OrderData) => {
      const orderCost = order.total_amount - order.profit - order.shipping_cost;
      const collectedAmount = order.payments_received || 0;
      
      return {
        totalOrderRevenue: acc.totalOrderRevenue + collectedAmount,
        totalProductCosts: acc.totalProductCosts + orderCost,
        netProfit: acc.netProfit + order.profit
      };
    }, {
      totalOrderRevenue: 0,
      totalProductCosts: 0,
      netProfit: 0
    });

    // Calculate actual recorded transactions with expense breakdown AND income breakdown
    const transactionSummary = transactions.reduce((acc, transaction) => {
      const amount = Math.abs(transaction.amount);
      
      // تحديد نوع المعاملة بناءً على الوصف والنوع
      const isDepositPayment = transaction.description?.includes('عربون') ||
                              transaction.description?.includes('مقدم') ||
                              transaction.description?.includes('deposit');
      
      const isSalesPayment = transaction.description?.includes('تحصيل') || 
                            transaction.description?.includes('دفعة') ||
                            transaction.description?.includes('سداد من عميل') ||
                            transaction.description?.includes('باقي المبلغ') ||
                            transaction.transaction_type === 'order_collection';
      
      const isOrderPayment = isDepositPayment || isSalesPayment ||
                            (transaction.order_serial?.includes('INV-') && 
                             !transaction.description?.includes('تكلفة') && 
                             !transaction.description?.includes('شحن'));
      
      // تحديد نوع المصروف
      const isShippingExpense = transaction.description?.includes('شحن') ||
                               transaction.description?.includes('شحن للمنزل') ||
                               transaction.transaction_type === 'shipping_payment';
      
      const isCostExpense = transaction.description?.includes('تكلفة') ||
                           transaction.description?.includes('تكلفة إنتاج') ||
                           transaction.description?.includes('سداد تكلفة') ||
                           transaction.transaction_type === 'cost_payment';
      
      const isOtherExpense = (transaction.description?.includes('مصروف') ||
                             transaction.description?.includes('إعلان') ||
                             transaction.description?.includes('مصروفات') ||
                             transaction.transaction_type === 'expense') &&
                             !isShippingExpense && !isCostExpense;
      
      if (isShippingExpense) {
        acc.shippingExpenses += amount;
        acc.actualExpenses += amount;
      } else if (isCostExpense) {
        acc.costExpenses += amount;
        acc.actualExpenses += amount;
      } else if (isOtherExpense) {
        acc.otherExpenses += amount;
        acc.actualExpenses += amount;
      } else if (isOrderPayment || transaction.transaction_type === 'income' || transaction.transaction_type === 'other_income') {
        acc.totalIncome += amount;
        // تصنيف نوع الإيراد
        if (isDepositPayment) {
          acc.depositIncome += amount;
        } else if (isSalesPayment || transaction.transaction_type === 'order_collection') {
          acc.salesIncome += amount;
        } else {
          acc.otherIncome += amount;
        }
      } else if (transaction.transaction_type === 'expense') {
        acc.otherExpenses += amount;
        acc.actualExpenses += amount;
      }
      
      return acc;
    }, {
      totalIncome: 0,
      actualExpenses: 0,
      shippingExpenses: 0,
      costExpenses: 0,
      otherExpenses: 0,
      depositIncome: 0,
      salesIncome: 0,
      otherIncome: 0
    });

    // المصروفات الفعلية = المعاملات المسجلة فقط (ليس تكاليف الأوردرات)
    const actualExpenses = transactionSummary.actualExpenses;
    
    // إجمالي التحصيلات من المعاملات
    const totalIncome = transactionSummary.totalIncome;
    
    // الرصيد الحالي = التحصيلات - المصروفات الفعلية المسجلة
    const currentBalance = totalIncome - actualExpenses;
    
    return {
      totalIncome,
      totalExpenses: actualExpenses,
      shippingExpenses: transactionSummary.shippingExpenses,
      costExpenses: transactionSummary.costExpenses,
      otherExpenses: transactionSummary.otherExpenses,
      totalProductCosts: ordersSummary.totalProductCosts,
      netProfit: ordersSummary.netProfit,
      currentBalance,
      totalOrderRevenue: ordersSummary.totalOrderRevenue,
      depositIncome: transactionSummary.depositIncome,
      salesIncome: transactionSummary.salesIncome,
      otherIncome: transactionSummary.otherIncome
    };
  }, [transactions, orders]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (filterType === 'all') return transactions;
    return transactions.filter(t => {
      switch (filterType) {
        case 'income':
          return t.transaction_type === 'income';
        case 'expense':
          return t.transaction_type === 'expense';
        default:
          return true;
      }
    });
  }, [transactions, filterType]);

  // Edit transaction mutation
  const editTransactionMutation = useMutation({
    mutationFn: async (transaction: Transaction) => {
      if (!transaction.id) {
        throw new Error('Transaction ID is required');
      }
      
      // إصلاح المبلغ ليكون موجب دائماً والاتجاه يحدده نوع المعاملة
      const amount = Math.abs(transaction.amount);
      
      const { error } = await supabase
        .from('transactions')
        .update({
          amount: amount,
          transaction_type: transaction.transaction_type,
          description: transaction.description,
          created_at: transaction.created_at
        })
        .eq('id', transaction.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders-for-modern-statement'] });
      toast.success('تم تحديث المعاملة بنجاح');
      setEditingTransaction(null);
    },
    onError: (error: any) => {
      console.error('Edit error:', error);
      toast.error('حدث خطأ في تحديث المعاملة');
    }
  });

  // Delete transaction mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders-for-modern-statement'] });
      toast.success('تم حذف المعاملة بنجاح');
    },
    onError: (error: any) => {
      console.error('Delete error:', error);
      toast.error('حدث خطأ في حذف المعاملة');
    }
  });

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction({ ...transaction });
  };

  const handleSaveEdit = () => {
    if (editingTransaction) {
      editTransactionMutation.mutate(editingTransaction);
    }
  };

  const handleDeleteTransaction = (transactionId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه المعاملة؟')) {
      deleteTransactionMutation.mutate(transactionId);
    }
  };

  const getTransactionStyle = (transaction: Transaction) => {
    // تحديد نوع المعاملة بناءً على الوصف والنوع
    const isOrderPayment = transaction.description?.includes('تحصيل') || 
                          transaction.description?.includes('دفعة') ||
                          transaction.description?.includes('عربون') ||
                          transaction.description?.includes('سداد من عميل') ||
                          transaction.order_serial?.includes('INV-');
    
    // تحديد المصروفات بناءً على الوصف
    const isExpense = transaction.description?.includes('تكلفة إنتاج') ||
                     transaction.description?.includes('شحن للمنزل') ||
                     transaction.description?.includes('مصروفات إعلانات') ||
                     transaction.description?.includes('تكلفة') ||
                     transaction.description?.includes('مصروف') ||
                     transaction.description?.includes('شحن') ||
                     transaction.description?.includes('إعلان') ||
                     transaction.transaction_type === 'expense';
    
    const isIncome = (transaction.transaction_type === 'income' || isOrderPayment) && !isExpense;
    
    if (isIncome) {
      return {
        bgColor: 'bg-green-50 border-green-200',
        badgeStyle: 'bg-green-100 text-green-800',
        textColor: 'text-green-800',
        amountColor: 'text-green-600',
        icon: TrendingUp,
        label: isOrderPayment ? 'تحصيل' : 'إيراد',
        sign: '+'
      };
    } else {
      return {
        bgColor: 'bg-red-50 border-red-200',
        badgeStyle: 'bg-red-100 text-red-800',
        textColor: 'text-red-800',
        amountColor: 'text-red-600',
        icon: TrendingDown,
        label: 'مصروف',
        sign: '-'
      };
    }
  };

  if (transactionsLoading || ordersLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardTitle className="text-center text-xl font-bold flex items-center justify-center gap-2">
            <Calculator className="h-6 w-6" />
            كشف الحساب المحدث
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collections with Breakdown */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-6 w-6 text-green-600" />
              <Badge className="bg-green-100 text-green-800">التحصيلات</Badge>
            </div>
            <h3 className="text-sm font-medium text-green-700 mb-1">إجمالي التحصيلات</h3>
            <p className="text-xl font-bold text-green-800">{formatCurrency(financialSummary.totalIncome)}</p>
            
            {/* Income Breakdown */}
            <div className="mt-3 pt-3 border-t border-green-200 space-y-1.5">
              {financialSummary.depositIncome > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    العربون
                  </span>
                  <span className="font-semibold text-green-700">{formatCurrency(financialSummary.depositIncome)}</span>
                </div>
              )}
              {financialSummary.salesIncome > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    تحصيلات المبيعات
                  </span>
                  <span className="font-semibold text-green-700">{formatCurrency(financialSummary.salesIncome)}</span>
                </div>
              )}
              {financialSummary.otherIncome > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                    إيرادات أخرى
                  </span>
                  <span className="font-semibold text-green-700">{formatCurrency(financialSummary.otherIncome)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Total Expenses with Breakdown */}
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="h-6 w-6 text-red-600" />
              <Badge className="bg-red-100 text-red-800">المصروفات</Badge>
            </div>
            <h3 className="text-sm font-medium text-red-700 mb-1">المصروفات الفعلية</h3>
            <p className="text-xl font-bold text-red-800">{formatCurrency(financialSummary.totalExpenses)}</p>
            
            {/* Expense Breakdown */}
            <div className="mt-3 pt-3 border-t border-red-200 space-y-1.5">
              {financialSummary.costExpenses > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-red-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    تكاليف الإنتاج
                  </span>
                  <span className="font-semibold text-red-700">{formatCurrency(financialSummary.costExpenses)}</span>
                </div>
              )}
              {financialSummary.shippingExpenses > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-red-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    مصاريف الشحن
                  </span>
                  <span className="font-semibold text-red-700">{formatCurrency(financialSummary.shippingExpenses)}</span>
                </div>
              )}
              {financialSummary.otherExpenses > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-red-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                    مصروفات أخرى
                  </span>
                  <span className="font-semibold text-red-700">{formatCurrency(financialSummary.otherExpenses)}</span>
                </div>
              )}
            </div>
            
            {financialSummary.totalProductCosts > 0 && (
              <p className="text-xs text-red-500 mt-2 pt-2 border-t border-red-200">
                💡 تكاليف متوقعة من الطلبات: {formatCurrency(financialSummary.totalProductCosts)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-6 w-6 text-blue-600" />
              <Badge className="bg-blue-100 text-blue-800">الربح</Badge>
            </div>
            <h3 className="text-sm font-medium text-blue-700 mb-1">صافي الربح</h3>
            <p className="text-xl font-bold text-blue-800">{formatCurrency(financialSummary.netProfit)}</p>
          </CardContent>
        </Card>

        {/* Current Balance */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Calculator className="h-6 w-6 text-purple-600" />
              <Badge className="bg-purple-100 text-purple-800">الرصيد</Badge>
            </div>
            <h3 className="text-sm font-medium text-purple-700 mb-1">الرصيد الحالي</h3>
            <p className="text-xl font-bold text-purple-800">{formatCurrency(financialSummary.currentBalance)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <h3 className="text-lg font-semibold">قائمة المعاملات المالية</h3>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="فلترة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المعاملات</SelectItem>
                  <SelectItem value="income">الإيرادات فقط</SelectItem>
                  <SelectItem value="expense">المصروفات فقط</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-right p-3 font-semibold">التاريخ</th>
                  <th className="text-right p-3 font-semibold">رقم المرجع</th>
                  <th className="text-right p-3 font-semibold">نوع المعاملة</th>
                  <th className="text-right p-3 font-semibold">الوصف</th>
                  <th className="text-right p-3 font-semibold">المبلغ</th>
                  <th className="text-center p-3 font-semibold">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => {
                  const style = getTransactionStyle(transaction);
                  const IconComponent = style.icon;
                  
                  return (
                    <tr key={transaction.id} className={`border-b hover:bg-muted/50 ${style.bgColor}`}>
                      <td className="p-3 text-sm">
                        {editingTransaction?.id === transaction.id ? (
                          <Input
                            type="datetime-local"
                            value={editingTransaction.created_at.slice(0, 16)}
                            onChange={(e) => setEditingTransaction({
                              ...editingTransaction,
                              created_at: e.target.value + ':00.000Z'
                            })}
                            className="w-full"
                          />
                        ) : (
                          new Date(transaction.created_at).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        )}
                      </td>
                      <td className="p-3 text-sm font-mono">{transaction.order_serial}</td>
                      <td className="p-3">
                        {editingTransaction?.id === transaction.id ? (
                          <Select
                            value={editingTransaction.transaction_type}
                            onValueChange={(value) => setEditingTransaction({
                              ...editingTransaction,
                              transaction_type: value
                            })}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="income">إيراد</SelectItem>
                              <SelectItem value="expense">مصروف</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={style.badgeStyle}>
                            <IconComponent className="h-3 w-3 mr-1" />
                            {style.label}
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 text-sm">
                        {editingTransaction?.id === transaction.id ? (
                          <Textarea
                            value={editingTransaction.description || ''}
                            onChange={(e) => setEditingTransaction({
                              ...editingTransaction,
                              description: e.target.value
                            })}
                            className="w-full min-h-[60px]"
                          />
                        ) : (
                          transaction.description || 'بدون وصف'
                        )}
                      </td>
                      <td className={`p-3 font-bold ${style.amountColor}`}>
                        {editingTransaction?.id === transaction.id ? (
                          <Input
                            type="number"
                            value={Math.abs(editingTransaction.amount)}
                            onChange={(e) => setEditingTransaction({
                              ...editingTransaction,
                              amount: parseFloat(e.target.value) || 0
                            })}
                            className="w-full"
                          />
                        ) : (
                          `${style.sign}${formatCurrency(Math.abs(transaction.amount))}`
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-2">
                          {editingTransaction?.id === transaction.id ? (
                            <>
                              <Button
                                size="sm"
                                onClick={handleSaveEdit}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingTransaction(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditTransaction(transaction)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteTransaction(transaction.id)}
                              >
                                <Trash2 className="h-4 w-4" />
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
          
          {filteredTransactions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد معاملات مالية
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ModernAccountStatement;