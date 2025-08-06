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
import { formatCurrency, exportToExcel } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { 
  Plus, 
  Minus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calculator,
  Wallet,
  AlertTriangle,
  Clock,
  Edit,
  Trash2,
  Filter,
  Download,
  BarChart3,
  Calendar,
  Receipt,
  CreditCard,
  Truck,
  Target,
  PiggyBank,
  FileSpreadsheet
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
}

interface FinancialSummary {
  // المبيعات
  totalSales: number;
  collectedSales: number;
  
  // التكاليف
  totalProductCosts: number;
  paidProductCosts: number;
  
  // الشحن
  totalShippingCosts: number;
  collectedShipping: number;
  paidShipping: number;
  
  // أخرى
  otherIncome: number;
  otherExpenses: number;
  
  // الإجماليات
  totalCollections: number;
  totalPayments: number;
  netProfit: number;
  currentBalance: number;
}

const ImprovedComprehensiveAccountStatement = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  
  const [addTransactionDialog, setAddTransactionDialog] = useState(false);
  const [editTransactionDialog, setEditTransactionDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  
  // New transaction form
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    type: 'expense',
    description: ''
  });

  // Fetch transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
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
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders-for-financial-summary'],
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

  // Calculate comprehensive financial summary
  const financialSummary: FinancialSummary = useMemo(() => {
    // حساب بيانات الطلبات
    const ordersSummary = orders.reduce((acc, order: OrderData) => {
      const orderCost = order.total_amount - order.profit - order.shipping_cost;
      const collectedAmount = order.payments_received || 0; // فقط ما تم تحصيله فعلياً
      
      return {
        totalSales: acc.totalSales + order.total_amount,
        collectedSales: acc.collectedSales + collectedAmount,
        totalProductCosts: acc.totalProductCosts + orderCost,
        totalShippingCosts: acc.totalShippingCosts + order.shipping_cost,
        collectedShipping: acc.collectedShipping + (collectedAmount > 0 ? order.shipping_cost : 0),
        netProfit: acc.netProfit + order.profit
      };
    }, {
      totalSales: 0,
      collectedSales: 0,
      totalProductCosts: 0,
      totalShippingCosts: 0,
      collectedShipping: 0,
      netProfit: 0
    });

  // حساب المعاملات اليدوية وتوجيهها للأقسام المناسبة
    const manualTransactions = transactions.reduce((acc, transaction) => {
      const amount = Math.abs(transaction.amount);
      
      // تحديد نوع المعاملة بناءً على الوصف والنوع
      const isOrderPayment = transaction.description?.includes('تحصيل') || 
                            transaction.description?.includes('دفعة') ||
                            transaction.description?.includes('عربون') ||
                            transaction.description?.includes('سداد من عميل') ||
                            transaction.order_serial?.includes('INV-');
      
      const isProductCost = transaction.description?.includes('تكلفة') || 
                           transaction.description?.includes('سداد تكلفة') ||
                           transaction.description?.includes('شراء') ||
                           transaction.description?.includes('مواد خام') ||
                           transaction.description?.includes('إنتاج');
      
      const isShippingExpense = transaction.description?.includes('شحن') && !isOrderPayment;
      
      // التوجيه المحاسبي الصحيح
      if (transaction.transaction_type === 'income' || isOrderPayment) {
        // الإيرادات والتحصيلات
        if (isOrderPayment) {
          acc.collectedSales += amount;
        } else {
          acc.otherIncome += amount;
        }
        acc.totalCollections += amount;
      } else {
        // المصروفات
        if (isProductCost) {
          acc.paidProductCosts += amount;
        } else if (isShippingExpense) {
          acc.paidShipping += amount;
        } else {
          acc.otherExpenses += amount;
        }
        acc.totalPayments += amount;
      }
      
      return acc;
    }, {
      collectedSales: ordersSummary.collectedSales,
      otherIncome: 0,
      paidProductCosts: 0,
      otherExpenses: 0,
      paidShipping: 0,
      totalCollections: ordersSummary.collectedSales,
      totalPayments: 0
    });

    // الحسابات النهائية مع التأكد من التوجيه الصحيح
    const totalProductCostsIncludingManual = ordersSummary.totalProductCosts + manualTransactions.paidProductCosts;
    const totalCollections = manualTransactions.totalCollections;
    const totalPayments = manualTransactions.totalPayments;
    const currentBalance = totalCollections - totalPayments;
    
    return {
      ...ordersSummary,
      // تحديث القيم بالمعاملات اليدوية
      collectedSales: manualTransactions.collectedSales,
      totalProductCosts: totalProductCostsIncludingManual,
      paidProductCosts: manualTransactions.paidProductCosts,
      otherIncome: manualTransactions.otherIncome,
      otherExpenses: manualTransactions.otherExpenses,
      paidShipping: manualTransactions.paidShipping,
      currentBalance,
      totalCollections,
      totalPayments
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
        case 'shipping':
          return t.description?.includes('شحن');
        case 'advertising':
          return t.description?.includes('إعلان') || t.description?.includes('دعاية');
        default:
          return true;
      }
    });
  }, [transactions, filterType]);

  // Add transaction mutation
  const addTransactionMutation = useMutation({
    mutationFn: async (transaction: typeof newTransaction) => {
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');
      
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount: parseFloat(transaction.amount),
          transaction_type: transaction.type,
          description: transaction.description,
          order_serial: `MANUAL-${Date.now()}`
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('تم إضافة المعاملة بنجاح');
      setAddTransactionDialog(false);
      setNewTransaction({ amount: '', type: 'expense', description: '' });
    },
    onError: (error: any) => {
      console.error('Add transaction error:', error);
      toast.error('حدث خطأ في إضافة المعاملة');
    }
  });

  // Edit transaction mutation
  const editTransactionMutation = useMutation({
    mutationFn: async (transaction: Transaction) => {
      const { error } = await supabase
        .from('transactions')
        .update({
          amount: transaction.amount,
          description: transaction.description
        })
        .eq('id', transaction.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('تم تحديث المعاملة بنجاح');
      setEditTransactionDialog(false);
      setSelectedTransaction(null);
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
      toast.success('تم حذف المعاملة بنجاح');
    },
    onError: (error: any) => {
      console.error('Delete error:', error);
      toast.error('حدث خطأ في حذف المعاملة');
    }
  });

  // Helper function to determine transaction type and styling
  const getTransactionStyle = (transaction: Transaction) => {
    // تحديد نوع المعاملة بناءً على الوصف والنوع
    const isOrderPayment = transaction.description?.includes('تحصيل') || 
                          transaction.description?.includes('دفعة') ||
                          transaction.description?.includes('عربون') ||
                          transaction.description?.includes('سداد من عميل') ||
                          transaction.order_serial?.includes('INV-');
    
    const isIncome = transaction.transaction_type === 'income' || isOrderPayment;
    
    if (isIncome) {
      return {
        bgColor: 'bg-green-50 border-green-200',
        badgeStyle: 'bg-green-100 text-green-800',
        textColor: 'text-green-800',
        amountColor: 'text-green-600',
        icon: '💰',
        label: isOrderPayment ? 'تحصيل' : 'إيراد',
        sign: '+'
      };
    } else {
      return {
        bgColor: 'bg-red-50 border-red-200',
        badgeStyle: 'bg-red-100 text-red-800',
        textColor: 'text-red-800',
        amountColor: 'text-red-600',
        icon: '💸',
        label: 'مصروف',
        sign: '-'
      };
    }
  };

  const handleAddTransaction = () => {
    const amount = parseFloat(newTransaction.amount);
    if (!amount || amount <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }
    
    if (!newTransaction.description.trim()) {
      toast.error('يرجى إدخال وصف للمعاملة');
      return;
    }
    
    addTransactionMutation.mutate(newTransaction);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction({ ...transaction });
    setEditTransactionDialog(true);
  };

  const handleDeleteTransaction = (transactionId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه المعاملة؟')) {
      deleteTransactionMutation.mutate(transactionId);
    }
  };

  const handleSaveEdit = () => {
    if (selectedTransaction) {
      editTransactionMutation.mutate(selectedTransaction);
    }
  };

  const handleExportToExcel = () => {
    // تحضير البيانات للتصدير
    const exportData = [
      {
        'نوع المعاملة': 'إجمالي المبيعات',
        'المبلغ': financialSummary.totalSales,
        'التحصيل/الدفع': financialSummary.collectedSales,
        'المتبقي': financialSummary.totalSales - financialSummary.collectedSales
      },
      {
        'نوع المعاملة': 'تكلفة المنتجات',
        'المبلغ': financialSummary.totalProductCosts,
        'التحصيل/الدفع': financialSummary.paidProductCosts,
        'المتبقي': financialSummary.totalProductCosts - financialSummary.paidProductCosts
      },
      {
        'نوع المعاملة': 'مصاريف الشحن',
        'المبلغ': financialSummary.totalShippingCosts,
        'التحصيل/الدفع': financialSummary.paidShipping,
        'المتبقي': financialSummary.totalShippingCosts - financialSummary.paidShipping
      },
      {
        'نوع المعاملة': 'الإيرادات الأخرى',
        'المبلغ': financialSummary.otherIncome,
        'التحصيل/الدفع': financialSummary.otherIncome,
        'المتبقي': 0
      },
      {
        'نوع المعاملة': 'المصاريف الأخرى',
        'المبلغ': financialSummary.otherExpenses,
        'التحصيل/الدفع': financialSummary.otherExpenses,
        'المتبقي': 0
      }
    ];

    // تصدير البيانات
    toast.success('تم تصدير كشف الحساب بنجاح');
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
    <div className="space-y-6">
      {/* العنوان */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardTitle className="text-center text-xl font-bold flex items-center justify-center gap-2">
            <Calculator className="h-6 w-6" />
            كشف الحساب الشامل
          </CardTitle>
        </CardHeader>
      </Card>

      {/* الملخص المالي الشامل */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* إجمالي المبيعات */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Receipt className="h-6 w-6 text-green-600" />
              <Badge className="bg-green-100 text-green-800">مبيعات</Badge>
            </div>
            <h3 className="text-sm font-medium text-green-700 mb-1">إجمالي المبيعات</h3>
            <p className="text-xl font-bold text-green-800">{formatCurrency(financialSummary.totalSales)}</p>
            <p className="text-xs text-green-600">المحصل: {formatCurrency(financialSummary.collectedSales)}</p>
          </CardContent>
        </Card>

        {/* تكلفة المنتجات */}
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-6 w-6 text-red-600" />
              <Badge className="bg-red-100 text-red-800">تكاليف</Badge>
            </div>
            <h3 className="text-sm font-medium text-red-700 mb-1">تكلفة المنتجات</h3>
            <p className="text-xl font-bold text-red-800">{formatCurrency(financialSummary.totalProductCosts)}</p>
            <p className="text-xs text-red-600">المدفوع: {formatCurrency(financialSummary.paidProductCosts)}</p>
          </CardContent>
        </Card>

        {/* مصاريف الشحن */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Truck className="h-6 w-6 text-blue-600" />
              <Badge className="bg-blue-100 text-blue-800">شحن</Badge>
            </div>
            <h3 className="text-sm font-medium text-blue-700 mb-1">مصاريف الشحن</h3>
            <p className="text-xl font-bold text-blue-800">{formatCurrency(financialSummary.totalShippingCosts)}</p>
            <div className="text-xs text-blue-600 flex justify-between">
              <span>محصل: {formatCurrency(financialSummary.collectedShipping)}</span>
              <span>مدفوع: {formatCurrency(financialSummary.paidShipping)}</span>
            </div>
          </CardContent>
        </Card>

        {/* الرصيد الحالي */}
        <Card className={`bg-gradient-to-br ${financialSummary.currentBalance >= 0 ? 'from-purple-50 to-purple-100 border-purple-200' : 'from-orange-50 to-orange-100 border-orange-200'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Wallet className={`h-6 w-6 ${financialSummary.currentBalance >= 0 ? 'text-purple-600' : 'text-orange-600'}`} />
              <Badge className={`${financialSummary.currentBalance >= 0 ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'}`}>
                {financialSummary.currentBalance >= 0 ? 'موجب' : 'سالب'}
              </Badge>
            </div>
            <h3 className={`text-sm font-medium mb-1 ${financialSummary.currentBalance >= 0 ? 'text-purple-700' : 'text-orange-700'}`}>الرصيد الحالي</h3>
            <p className={`text-xl font-bold ${financialSummary.currentBalance >= 0 ? 'text-purple-800' : 'text-orange-800'}`}>
              {formatCurrency(financialSummary.currentBalance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* المؤشرات الإضافية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-yellow-700 mb-1">الإيرادات الأخرى</h3>
            <p className="text-lg font-bold text-yellow-800">{formatCurrency(financialSummary.otherIncome)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
          <CardContent className="p-4 text-center">
            <CreditCard className="h-6 w-6 text-pink-600 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-pink-700 mb-1">المصاريف الأخرى</h3>
            <p className="text-lg font-bold text-pink-800">{formatCurrency(financialSummary.otherExpenses)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-emerald-700 mb-1">إجمالي التحصيلات</h3>
            <p className="text-lg font-bold text-emerald-800">{formatCurrency(financialSummary.totalCollections)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
          <CardContent className="p-4 text-center">
            <TrendingDown className="h-6 w-6 text-rose-600 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-rose-700 mb-1">إجمالي المدفوعات</h3>
            <p className="text-lg font-bold text-rose-800">{formatCurrency(financialSummary.totalPayments)}</p>
          </CardContent>
        </Card>
      </div>

      {/* أزرار الإجراءات */}
      <div className="flex flex-wrap gap-3">
        <Dialog open={addTransactionDialog} onOpenChange={setAddTransactionDialog}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="h-4 w-4 ml-2" />
              إضافة معاملة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة معاملة جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">المبلغ</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="type">نوع المعاملة</Label>
                <Select value={newTransaction.type} onValueChange={(value) => setNewTransaction(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">إيراد</SelectItem>
                    <SelectItem value="expense">مصروف</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  placeholder="وصف المعاملة"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <Button 
                onClick={handleAddTransaction} 
                disabled={addTransactionMutation.isPending}
                className="w-full"
              >
                {addTransactionMutation.isPending ? 'جاري الإضافة...' : 'إضافة المعاملة'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button onClick={handleExportToExcel} variant="outline">
          <FileSpreadsheet className="h-4 w-4 ml-2" />
          تصدير Excel
        </Button>
      </div>

      {/* فلاتر وجدول المعاملات */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              كشف المعاملات المفصل
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المعاملات</SelectItem>
                  <SelectItem value="income">الإيرادات</SelectItem>
                  <SelectItem value="expense">المصروفات</SelectItem>
                  <SelectItem value="shipping">مصاريف الشحن</SelectItem>
                  <SelectItem value="advertising">الدعاية والإعلان</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد معاملات متطابقة مع الفلتر المحدد
              </div>
            ) : (
              filteredTransactions.map((transaction) => {
                const style = getTransactionStyle(transaction);
                
                return (
                  <div 
                    key={transaction.id} 
                    className={`flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-all ${style.bgColor}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={`px-3 py-1 text-sm font-medium ${style.badgeStyle}`}>
                          {style.icon} {style.label}
                        </Badge>
                        <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded border">
                          {transaction.order_serial}
                        </span>
                      </div>
                      
                      {transaction.description && (
                        <p className={`text-sm mb-1 font-medium ${style.textColor}`}>
                          {transaction.description}
                        </p>
                      )}
                      
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(transaction.created_at).toLocaleString('ar-EG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`text-xl font-bold ${style.amountColor}`}>
                          {style.sign}{formatCurrency(Math.abs(transaction.amount))}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditTransaction(transaction)}
                          className="h-8 w-8 p-0 hover:bg-blue-50"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Transaction Dialog */}
      <Dialog open={editTransactionDialog} onOpenChange={setEditTransactionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل المعاملة</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-amount">المبلغ</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  value={selectedTransaction.amount}
                  onChange={(e) => setSelectedTransaction(prev => 
                    prev ? { ...prev, amount: parseFloat(e.target.value) || 0 } : null
                  )}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-description">الوصف</Label>
                <Textarea
                  id="edit-description"
                  value={selectedTransaction.description || ''}
                  onChange={(e) => setSelectedTransaction(prev => 
                    prev ? { ...prev, description: e.target.value } : null
                  )}
                />
              </div>
              
              <Button 
                onClick={handleSaveEdit} 
                disabled={editTransactionMutation.isPending}
                className="w-full"
              >
                {editTransactionMutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImprovedComprehensiveAccountStatement;
