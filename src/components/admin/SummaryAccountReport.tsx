import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useDateFilter } from '@/components/tabs/StyledIndexTabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { calculateOrderFinancials } from '@/lib/orderFinancials';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Plus, 
  Trash2, 
  Package,
  Truck,
  Wrench,
  ShoppingBag,
  ArrowUpRight,
  Calculator,
  Wallet,
  FileText,
  Calendar,
  Edit2,
  ArrowDownLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const EXPENSE_CATEGORIES = {
  cost: { label: 'تكلفة إنتاج', icon: Wrench, color: 'text-orange-600 bg-orange-100 dark:bg-orange-950/50 dark:text-orange-400' },
  shipping: { label: 'مصاريف شحن', icon: Truck, color: 'text-blue-600 bg-blue-100 dark:bg-blue-950/50 dark:text-blue-400' },
  materials: { label: 'خامات', icon: Package, color: 'text-purple-600 bg-purple-100 dark:bg-purple-950/50 dark:text-purple-400' },
  other: { label: 'مصروفات أخرى', icon: FileText, color: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400' }
};

const INCOME_CATEGORIES = {
  sales: { label: 'مبيعات', icon: ShoppingBag, color: 'text-green-600 bg-green-100 dark:bg-green-950/50 dark:text-green-400' },
  other: { label: 'إيرادات أخرى', icon: ArrowDownLeft, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400' }
};

const SummaryAccountReport = () => {
  const { startDate, endDate } = useDateFilter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  
  const [newExpense, setNewExpense] = useState({
    category: 'cost' as keyof typeof EXPENSE_CATEGORIES,
    description: '',
    amount: ''
  });

  const [newIncome, setNewIncome] = useState({
    category: 'other' as keyof typeof INCOME_CATEGORIES,
    description: '',
    amount: ''
  });

  // Fetch orders for sales calculation - includes full order total (shipping + discount)
  const { data: orders = [] } = useQuery({
    queryKey: ['summary-orders', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', user.id)
        .neq('status', 'cancelled');

      if (startDate) {
        query = query.gte('date_created', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('date_created', endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch all transactions (expenses and income)
  const { data: transactions = [] } = useQuery({
    queryKey: ['summary-transactions', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  // Add expense mutation
  const addExpenseMutation = useMutation({
    mutationFn: async (expense: { category: string; description: string; amount: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        order_serial: `EXP-${Date.now()}`,
        transaction_type: 'expense',
        amount: expense.amount,
        description: `[${expense.category}] ${expense.description}`
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summary-transactions'] });
      toast.success('تم إضافة المصروف بنجاح');
      setIsAddExpenseOpen(false);
      setNewExpense({ category: 'cost', description: '', amount: '' });
    },
    onError: () => {
      toast.error('حدث خطأ أثناء إضافة المصروف');
    }
  });

  // Add income mutation
  const addIncomeMutation = useMutation({
    mutationFn: async (income: { category: string; description: string; amount: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        order_serial: `INC-${Date.now()}`,
        transaction_type: 'income',
        amount: income.amount,
        description: `[${income.category}] ${income.description}`
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summary-transactions'] });
      toast.success('تم إضافة الإيراد بنجاح');
      setIsAddIncomeOpen(false);
      setNewIncome({ category: 'other', description: '', amount: '' });
    },
    onError: () => {
      toast.error('حدث خطأ أثناء إضافة الإيراد');
    }
  });

  // Update transaction mutation
  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, amount, description }: { id: string; amount: number; description: string }) => {
      const { error } = await supabase
        .from('transactions')
        .update({ amount, description })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summary-transactions'] });
      toast.success('تم تحديث المعاملة بنجاح');
      setIsEditOpen(false);
      setEditingTransaction(null);
    },
    onError: () => {
      toast.error('حدث خطأ أثناء تحديث المعاملة');
    }
  });

  // Delete transaction mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summary-transactions'] });
      toast.success('تم حذف المعاملة');
    }
  });

  // Carry forward profit mutation
  const carryForwardMutation = useMutation({
    mutationFn: async (profit: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const periodLabel = startDate && endDate 
        ? `${format(startDate, 'yyyy/MM/dd')} - ${format(endDate, 'yyyy/MM/dd')}`
        : 'الفترة الحالية';

      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        order_serial: `PROFIT-${Date.now()}`,
        transaction_type: 'income',
        amount: profit,
        description: `[sales] ترحيل أرباح ${periodLabel}`
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summary-transactions'] });
      toast.success('تم ترحيل الأرباح بنجاح إلى حسابك');
    }
  });

  // Calculate financial summary
  const summary = useMemo(() => {
    // حساب المبيعات من تقرير الطلبات - الإجمالي الكامل شامل الشحن والخصم
    let totalSales = 0;
    let expectedProductionCost = 0;
    let expectedShippingCost = 0;

    orders.forEach(order => {
      const financials = calculateOrderFinancials(order);
      totalSales += financials.total;
      expectedShippingCost += financials.shipping;
      // Calculate expected production cost from items
      const items = order.order_items || [];
      items.forEach((item: any) => {
        expectedProductionCost += (Number(item.cost ?? 0)) * (Number(item.quantity ?? 1));
      });
    });
    
    const orderCount = orders.length;

    // Parse transactions by type and category
    const expensesByCategory = {
      cost: 0,
      shipping: 0,
      materials: 0,
      other: 0
    };

    const incomesByCategory = {
      sales: 0,
      other: 0
    };

    let totalManualExpenses = 0;
    let totalManualIncome = 0;

    transactions.forEach(t => {
      const desc = t.description || '';
      
      if (t.transaction_type === 'expense') {
        totalManualExpenses += t.amount;
        if (desc.includes('[cost]')) {
          expensesByCategory.cost += t.amount;
        } else if (desc.includes('[shipping]')) {
          expensesByCategory.shipping += t.amount;
        } else if (desc.includes('[materials]')) {
          expensesByCategory.materials += t.amount;
        } else {
          expensesByCategory.other += t.amount;
        }
      } else if (t.transaction_type === 'income') {
        totalManualIncome += t.amount;
        if (desc.includes('[sales]')) {
          incomesByCategory.sales += t.amount;
        } else {
          incomesByCategory.other += t.amount;
        }
      }
    });

    const totalExpenses = totalManualExpenses;
    const totalIncome = totalSales + totalManualIncome;
    const netProfit = totalIncome - totalExpenses;

    return {
      totalSales,
      orderCount,
      expensesByCategory,
      incomesByCategory,
      totalManualExpenses,
      totalManualIncome,
      totalExpenses,
      totalIncome,
      netProfit,
      expectedProductionCost,
      expectedShippingCost
    };
  }, [orders, transactions]);

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }
    addExpenseMutation.mutate({
      category: newExpense.category,
      description: newExpense.description,
      amount: parseFloat(newExpense.amount)
    });
  };

  const handleAddIncome = () => {
    if (!newIncome.description || !newIncome.amount) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }
    addIncomeMutation.mutate({
      category: newIncome.category,
      description: newIncome.description,
      amount: parseFloat(newIncome.amount)
    });
  };

  const handleEditTransaction = () => {
    if (!editingTransaction) return;
    updateTransactionMutation.mutate({
      id: editingTransaction.id,
      amount: parseFloat(editingTransaction.amount),
      description: editingTransaction.description
    });
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المعاملة؟')) {
      deleteTransactionMutation.mutate(id);
    }
  };

  const openEditDialog = (transaction: any) => {
    setEditingTransaction({
      ...transaction,
      amount: transaction.amount.toString()
    });
    setIsEditOpen(true);
  };

  const parseTransactionCategory = (description: string, type: string) => {
    if (type === 'expense') {
      if (description.includes('[cost]')) return 'cost';
      if (description.includes('[shipping]')) return 'shipping';
      if (description.includes('[materials]')) return 'materials';
      return 'other';
    }
    if (description.includes('[sales]')) return 'sales';
    return 'other';
  };

  const getCleanDescription = (description: string) => {
    return description.replace(/\[(cost|shipping|materials|other|sales)\]\s*/g, '');
  };

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} ج.م`;

  // Separate transactions by type
  const expenseTransactions = transactions.filter(t => t.transaction_type === 'expense');
  const incomeTransactions = transactions.filter(t => t.transaction_type === 'income');

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header with Period Info */}
      <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'}`}>
        <div>
          <h2 className={`font-bold text-foreground ${isMobile ? 'text-xl' : 'text-2xl'}`}>كشف حساب ملخص</h2>
          <div className="flex items-center gap-2 mt-1 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">
              {startDate && endDate 
                ? `${format(startDate, 'dd MMMM yyyy', { locale: ar })} - ${format(endDate, 'dd MMMM yyyy', { locale: ar })}`
                : 'جميع الفترات'}
            </span>
          </div>
        </div>
        
        <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'flex-row'}`}>
          {/* Add Income Dialog */}
          <Dialog open={isAddIncomeOpen} onOpenChange={setIsAddIncomeOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-green-300 text-green-600 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950/30">
                <ArrowDownLeft className="h-4 w-4" />
                إضافة إيراد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة إيراد جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>نوع الإيراد</Label>
                  <Select 
                    value={newIncome.category} 
                    onValueChange={(v) => setNewIncome(prev => ({ ...prev, category: v as keyof typeof INCOME_CATEGORIES }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(INCOME_CATEGORIES).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الوصف</Label>
                  <Input 
                    placeholder="مثال: بيع مباشر"
                    value={newIncome.description}
                    onChange={(e) => setNewIncome(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>المبلغ (ج.م)</Label>
                  <Input 
                    type="number"
                    placeholder="0"
                    value={newIncome.amount}
                    onChange={(e) => setNewIncome(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
                <Button 
                  onClick={handleAddIncome} 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={addIncomeMutation.isPending}
                >
                  {addIncomeMutation.isPending ? 'جاري الإضافة...' : 'إضافة'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Expense Dialog */}
          <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4" />
                إضافة مصروف
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة مصروف جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>نوع المصروف</Label>
                  <Select 
                    value={newExpense.category} 
                    onValueChange={(v) => setNewExpense(prev => ({ ...prev, category: v as keyof typeof EXPENSE_CATEGORIES }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EXPENSE_CATEGORIES).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الوصف</Label>
                  <Input 
                    placeholder="مثال: طباعة 50 قميص"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>المبلغ (ج.م)</Label>
                  <Input 
                    type="number"
                    placeholder="0"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
                <Button 
                  onClick={handleAddExpense} 
                  className="w-full"
                  disabled={addExpenseMutation.isPending}
                >
                  {addExpenseMutation.isPending ? 'جاري الإضافة...' : 'إضافة'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Summary Cards */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
        {/* Sales Card - From Orders Report */}
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">إجمالي المبيعات (من الطلبات)</p>
                <p className={`font-bold mt-1 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>{formatCurrency(summary.totalSales)}</p>
                <p className="text-emerald-100 text-xs mt-2">{summary.orderCount} طلب (شامل الشحن والخصم)</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <ShoppingBag className="h-8 w-8" />
              </div>
            </div>
            {summary.totalManualIncome > 0 && (
              <>
                <Separator className="my-4 bg-white/20" />
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-emerald-100">إيرادات أخرى مسجلة</span>
                    <span>+ {formatCurrency(summary.totalManualIncome)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-emerald-100">إجمالي الإيرادات</span>
                    <span>{formatCurrency(summary.totalIncome)}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Expenses Card */}
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">إجمالي المصروفات</p>
                <p className={`font-bold mt-1 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>{formatCurrency(summary.totalExpenses)}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <TrendingDown className="h-8 w-8" />
              </div>
            </div>
            <Separator className="my-4 bg-white/20" />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-red-100 flex items-center gap-1">
                  <Wrench className="h-3 w-3" /> تكلفة إنتاج
                </span>
                <span>{formatCurrency(summary.expensesByCategory.cost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-100 flex items-center gap-1">
                  <Truck className="h-3 w-3" /> شحن
                </span>
                <span>{formatCurrency(summary.expensesByCategory.shipping)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-100 flex items-center gap-1">
                  <Package className="h-3 w-3" /> خامات
                </span>
                <span>{formatCurrency(summary.expensesByCategory.materials)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-100 flex items-center gap-1">
                  <FileText className="h-3 w-3" /> أخرى
                </span>
                <span>{formatCurrency(summary.expensesByCategory.other)}</span>
              </div>
            </div>
            {(summary.expectedProductionCost > 0 || summary.expectedShippingCost > 0) && (
              <div className="mt-3 pt-3 border-t border-white/20 space-y-1">
                <p className="text-red-200 text-[10px] font-medium mb-1">المتوقع من الطلبات (للمقارنة):</p>
                {summary.expectedProductionCost > 0 && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-red-200/80 flex items-center gap-1">
                      <Wrench className="h-2.5 w-2.5" /> تكلفة إنتاج متوقعة
                    </span>
                    <span className="text-red-200/80">{formatCurrency(summary.expectedProductionCost)}</span>
                  </div>
                )}
                {summary.expectedShippingCost > 0 && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-red-200/80 flex items-center gap-1">
                      <Truck className="h-2.5 w-2.5" /> تكلفة شحن متوقعة
                    </span>
                    <span className="text-red-200/80">{formatCurrency(summary.expectedShippingCost)}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Net Profit Card */}
        <Card className={`border-0 shadow-lg ${summary.netProfit >= 0 
          ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
          : 'bg-gradient-to-br from-amber-500 to-orange-600'} text-white`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">صافي الربح</p>
                <p className={`font-bold mt-1 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>{formatCurrency(summary.netProfit)}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                {summary.netProfit >= 0 ? <TrendingUp className="h-8 w-8" /> : <TrendingDown className="h-8 w-8" />}
              </div>
            </div>
            <Separator className="my-4 bg-white/20" />
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm">الإيرادات - المصروفات</span>
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                {summary.totalIncome > 0 
                  ? `${((summary.netProfit / summary.totalIncome) * 100).toFixed(1)}%` 
                  : '0%'}
              </Badge>
            </div>
            <Button 
              variant="secondary" 
              className="w-full mt-4 bg-white/20 hover:bg-white/30 text-white border-0"
              onClick={() => summary.netProfit > 0 && carryForwardMutation.mutate(summary.netProfit)}
              disabled={summary.netProfit <= 0 || carryForwardMutation.isPending}
            >
              <Wallet className="h-4 w-4 ml-2" />
              ترحيل الأرباح إلى الحساب
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Calculation Summary */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5 text-primary" />
            ملخص الحساب
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center text-lg">
              <span className="text-muted-foreground">إجمالي المبيعات (من الطلبات)</span>
              <span className="font-semibold text-emerald-600">+ {formatCurrency(summary.totalSales)}</span>
            </div>
            {summary.totalManualIncome > 0 && (
              <div className="flex justify-between items-center text-lg">
                <span className="text-muted-foreground">إيرادات أخرى مسجلة</span>
                <span className="font-semibold text-green-600">+ {formatCurrency(summary.totalManualIncome)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-lg border-t pt-2">
              <span className="text-muted-foreground font-medium">إجمالي الإيرادات</span>
              <span className="font-bold text-emerald-600">{formatCurrency(summary.totalIncome)}</span>
            </div>
            <div className="flex justify-between items-center text-lg">
              <span className="text-muted-foreground">إجمالي المصروفات</span>
              <span className="font-semibold text-red-600">- {formatCurrency(summary.totalExpenses)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center text-xl">
              <span className="font-bold">صافي الربح</span>
              <span className={`font-bold ${summary.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(summary.netProfit)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Lists */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {/* Expenses List */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-lg text-red-600">
                <TrendingDown className="h-5 w-5" />
                سجل المصروفات
              </span>
              <Badge variant="outline" className="text-red-600 border-red-300">
                {expenseTransactions.length} معاملة
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expenseTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد مصروفات مسجلة</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsAddExpenseOpen(true)}
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة مصروف
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {expenseTransactions.map((t) => {
                  const category = parseTransactionCategory(t.description || '', 'expense') as keyof typeof EXPENSE_CATEGORIES;
                  const CategoryIcon = EXPENSE_CATEGORIES[category]?.icon || FileText;
                  const cleanDescription = getCleanDescription(t.description || '');
                  
                  return (
                    <div 
                      key={t.id} 
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${EXPENSE_CATEGORIES[category]?.color || 'bg-gray-100'}`}>
                          <CategoryIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{cleanDescription || EXPENSE_CATEGORIES[category]?.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(t.created_at), 'dd/MM/yyyy', { locale: ar })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-red-600">{formatCurrency(t.amount)}</span>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                          onClick={() => openEditDialog(t)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-600"
                          onClick={() => handleDeleteTransaction(t.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Income List */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-lg text-green-600">
                <TrendingUp className="h-5 w-5" />
                سجل الإيرادات الإضافية
              </span>
              <Badge variant="outline" className="text-green-600 border-green-300">
                {incomeTransactions.length} معاملة
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {incomeTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ArrowDownLeft className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد إيرادات إضافية مسجلة</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsAddIncomeOpen(true)}
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة إيراد
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {incomeTransactions.map((t) => {
                  const category = parseTransactionCategory(t.description || '', 'income') as keyof typeof INCOME_CATEGORIES;
                  const CategoryIcon = INCOME_CATEGORIES[category]?.icon || ArrowDownLeft;
                  const cleanDescription = getCleanDescription(t.description || '');
                  
                  return (
                    <div 
                      key={t.id} 
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${INCOME_CATEGORIES[category]?.color || 'bg-green-100'}`}>
                          <CategoryIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{cleanDescription || INCOME_CATEGORIES[category]?.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(t.created_at), 'dd/MM/yyyy', { locale: ar })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-green-600">{formatCurrency(t.amount)}</span>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                          onClick={() => openEditDialog(t)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-600"
                          onClick={() => handleDeleteTransaction(t.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Transaction Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل المعاملة</DialogTitle>
          </DialogHeader>
          {editingTransaction && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Input 
                  value={getCleanDescription(editingTransaction.description)}
                  onChange={(e) => {
                    const category = parseTransactionCategory(editingTransaction.description, editingTransaction.transaction_type);
                    setEditingTransaction((prev: any) => ({ 
                      ...prev, 
                      description: `[${category}] ${e.target.value}`
                    }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>المبلغ (ج.م)</Label>
                <Input 
                  type="number"
                  value={editingTransaction.amount}
                  onChange={(e) => setEditingTransaction((prev: any) => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  إلغاء
                </Button>
                <Button 
                  onClick={handleEditTransaction}
                  disabled={updateTransactionMutation.isPending}
                >
                  {updateTransactionMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SummaryAccountReport;
