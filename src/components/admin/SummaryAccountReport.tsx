import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useDateFilter } from '@/components/tabs/StyledIndexTabs';
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
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ExpenseItem {
  id: string;
  category: 'cost' | 'shipping' | 'materials' | 'other';
  description: string;
  amount: number;
  date: string;
}

const EXPENSE_CATEGORIES = {
  cost: { label: 'تكلفة إنتاج', icon: Wrench, color: 'text-orange-600 bg-orange-100' },
  shipping: { label: 'مصاريف شحن', icon: Truck, color: 'text-blue-600 bg-blue-100' },
  materials: { label: 'خامات', icon: Package, color: 'text-purple-600 bg-purple-100' },
  other: { label: 'مصروفات أخرى', icon: FileText, color: 'text-gray-600 bg-gray-100' }
};

const SummaryAccountReport = () => {
  const { startDate, endDate } = useDateFilter();
  const queryClient = useQueryClient();
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: 'cost' as keyof typeof EXPENSE_CATEGORIES,
    description: '',
    amount: ''
  });

  // Fetch orders for sales calculation
  const { data: orders = [] } = useQuery({
    queryKey: ['summary-orders', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('orders')
        .select('*')
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

  // Fetch transactions for expenses
  const { data: transactions = [] } = useQuery({
    queryKey: ['summary-transactions', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('transaction_type', 'expense');

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

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summary-transactions'] });
      toast.success('تم حذف المصروف');
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
        description: `ترحيل أرباح ${periodLabel}`
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summary-transactions'] });
      toast.success('تم ترحيل الأرباح بنجاح');
    }
  });

  // Calculate financial summary
  const summary = useMemo(() => {
    const totalSales = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalDeposits = orders.reduce((sum, order) => sum + (order.deposit || 0), 0);
    const totalPayments = orders.reduce((sum, order) => sum + (order.payments_received || 0), 0);
    const totalCollected = totalDeposits + totalPayments;
    const orderCount = orders.length;

    // Parse expenses by category
    const expenses = {
      cost: 0,
      shipping: 0,
      materials: 0,
      other: 0
    };

    transactions.forEach(t => {
      const desc = t.description || '';
      if (desc.includes('[cost]')) {
        expenses.cost += t.amount;
      } else if (desc.includes('[shipping]')) {
        expenses.shipping += t.amount;
      } else if (desc.includes('[materials]')) {
        expenses.materials += t.amount;
      } else {
        expenses.other += t.amount;
      }
    });

    const totalExpenses = Object.values(expenses).reduce((a, b) => a + b, 0);
    const netProfit = totalSales - totalExpenses;

    return {
      totalSales,
      totalCollected,
      totalDeposits,
      totalPayments,
      orderCount,
      expenses,
      totalExpenses,
      netProfit
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

  const parseExpenseCategory = (description: string): keyof typeof EXPENSE_CATEGORIES => {
    if (description.includes('[cost]')) return 'cost';
    if (description.includes('[shipping]')) return 'shipping';
    if (description.includes('[materials]')) return 'materials';
    return 'other';
  };

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} ج.م`;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header with Period Info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">كشف حساب ملخص</h2>
          <div className="flex items-center gap-2 mt-1 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">
              {startDate && endDate 
                ? `${format(startDate, 'dd MMMM yyyy', { locale: ar })} - ${format(endDate, 'dd MMMM yyyy', { locale: ar })}`
                : 'جميع الفترات'}
            </span>
          </div>
        </div>
        
        <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
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

      {/* Main Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sales Card */}
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">إجمالي المبيعات</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(summary.totalSales)}</p>
                <p className="text-emerald-100 text-xs mt-2">{summary.orderCount} طلب</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <ShoppingBag className="h-8 w-8" />
              </div>
            </div>
            <Separator className="my-4 bg-white/20" />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-emerald-100">العربون المحصل</span>
                <span>{formatCurrency(summary.totalDeposits)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-100">الدفعات المحصلة</span>
                <span>{formatCurrency(summary.totalPayments)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Card */}
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">إجمالي المصروفات</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(summary.totalExpenses)}</p>
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
                <span>{formatCurrency(summary.expenses.cost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-100 flex items-center gap-1">
                  <Truck className="h-3 w-3" /> شحن
                </span>
                <span>{formatCurrency(summary.expenses.shipping)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-100 flex items-center gap-1">
                  <Package className="h-3 w-3" /> خامات
                </span>
                <span>{formatCurrency(summary.expenses.materials)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-100 flex items-center gap-1">
                  <FileText className="h-3 w-3" /> أخرى
                </span>
                <span>{formatCurrency(summary.expenses.other)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Profit Card */}
        <Card className={`border-0 ${summary.netProfit >= 0 
          ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
          : 'bg-gradient-to-br from-amber-500 to-orange-600'} text-white`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">صافي الربح</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(summary.netProfit)}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                {summary.netProfit >= 0 ? <TrendingUp className="h-8 w-8" /> : <TrendingDown className="h-8 w-8" />}
              </div>
            </div>
            <Separator className="my-4 bg-white/20" />
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm">المبيعات - المصروفات</span>
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                {summary.totalExpenses > 0 
                  ? `${((summary.netProfit / summary.totalSales) * 100).toFixed(1)}%` 
                  : '100%'}
              </Badge>
            </div>
            <Button 
              variant="secondary" 
              className="w-full mt-4 bg-white/20 hover:bg-white/30 text-white border-0"
              onClick={() => summary.netProfit > 0 && carryForwardMutation.mutate(summary.netProfit)}
              disabled={summary.netProfit <= 0 || carryForwardMutation.isPending}
            >
              <Wallet className="h-4 w-4 ml-2" />
              ترحيل الأرباح
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Calculation Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5 text-primary" />
            ملخص الحساب
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center text-lg">
              <span className="text-muted-foreground">إجمالي المبيعات</span>
              <span className="font-semibold text-emerald-600">+ {formatCurrency(summary.totalSales)}</span>
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

      {/* Expenses List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            سجل المصروفات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد مصروفات مسجلة في هذه الفترة</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsAddExpenseOpen(true)}
              >
                <Plus className="h-4 w-4 ml-2" />
                إضافة أول مصروف
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((t) => {
                const category = parseExpenseCategory(t.description || '');
                const CategoryIcon = EXPENSE_CATEGORIES[category].icon;
                const cleanDescription = (t.description || '').replace(/\[(cost|shipping|materials|other)\]\s*/g, '');
                
                return (
                  <div 
                    key={t.id} 
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${EXPENSE_CATEGORIES[category].color}`}>
                        <CategoryIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{cleanDescription || EXPENSE_CATEGORIES[category].label}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(t.created_at), 'dd/MM/yyyy', { locale: ar })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-red-600">{formatCurrency(t.amount)}</span>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-600"
                        onClick={() => deleteExpenseMutation.mutate(t.id)}
                      >
                        <Trash2 className="h-4 w-4" />
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
  );
};

export default SummaryAccountReport;
