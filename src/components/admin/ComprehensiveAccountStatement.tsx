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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Plus, 
  ArrowRightLeft, 
  DollarSign,
  Edit,
  Trash2,
  Save,
  X,
  BarChart3,
  PieChart,
  Calculator,
  Eye,
  CreditCard,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Banknote
} from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  description?: string;
  order_serial: string;
  created_at: string;
}

interface OrderSummary {
  total_revenue: number;
  total_costs: number;
  total_shipping: number;
  net_profit: number;
  total_orders: number;
  pending_payments: number;
  uncollected_amounts: number;
}

const ComprehensiveAccountStatement = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  
  const [transferDialog, setTransferDialog] = useState(false);
  const [addTransactionDialog, setAddTransactionDialog] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDescription, setTransferDescription] = useState('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [summaryViewOpen, setSummaryViewOpen] = useState(false);
  
  // New transaction form
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    type: 'expense',
    description: '',
    category: 'other'
  });

  // Fetch transactions
  const { data: transactions = [], isLoading } = useQuery({
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

  // Fetch comprehensive order summary
  const { data: orderSummary } = useQuery({
    queryKey: ['comprehensive-order-summary'],
    queryFn: async () => {
      if (!user) return null;
      
      const { data: orders, error } = await supabase
        .from('admin_orders')
        .select('total_amount, shipping_cost, profit, deposit, status')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching order summary:', error);
        return null;
      }
      
      const summary = orders.reduce((acc, order) => {
        const orderTotal = order.total_amount;
        const orderCost = orderTotal - order.profit - order.shipping_cost;
        const isPending = order.status === 'pending' || order.status === 'confirmed';
        const deposit = order.deposit || 0;
        const remaining = orderTotal - deposit;
        
        return {
          total_revenue: acc.total_revenue + orderTotal,
          total_costs: acc.total_costs + orderCost,
          total_shipping: acc.total_shipping + order.shipping_cost,
          net_profit: acc.net_profit + order.profit,
          total_orders: acc.total_orders + 1,
          pending_payments: acc.pending_payments + (isPending ? orderCost : 0),
          uncollected_amounts: acc.uncollected_amounts + (isPending ? remaining : 0)
        };
      }, {
        total_revenue: 0,
        total_costs: 0,
        total_shipping: 0,
        net_profit: 0,
        total_orders: 0,
        pending_payments: 0,
        uncollected_amounts: 0
      });

      return summary;
    },
    enabled: !!user
  });

  // Calculate balances
  const calculations = useMemo(() => {
    const balance = transactions.reduce((total, transaction) => {
      return transaction.transaction_type === 'income' 
        ? total + transaction.amount 
        : total - transaction.amount;
    }, 0);

    const totalIncome = transactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return { balance, totalIncome, totalExpenses };
  }, [transactions]);

  // Add new transaction mutation
  const addTransactionMutation = useMutation({
    mutationFn: async (transaction: typeof newTransaction) => {
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');
      
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount: parseFloat(transaction.amount),
          transaction_type: transaction.type,
          description: `${transaction.category === 'other' ? '' : `${getCategoryName(transaction.category)}: `}${transaction.description}`,
          order_serial: `MANUAL-${Date.now()}`
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('تم إضافة المعاملة بنجاح');
      setAddTransactionDialog(false);
      setNewTransaction({ amount: '', type: 'expense', description: '', category: 'other' });
    },
    onError: (error: any) => {
      console.error('Add transaction error:', error);
      toast.error('حدث خطأ في إضافة المعاملة');
    }
  });

  // Transfer mutation
  const transferMutation = useMutation({
    mutationFn: async ({ amount, description }: { amount: number; description: string }) => {
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');
      
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount: amount,
          transaction_type: 'expense',
          description: `تحويل إلى خزينة أخرى: ${description}`,
          order_serial: `TRANSFER-${Date.now()}`
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('تم تحويل المبلغ بنجاح');
      setTransferDialog(false);
      setTransferAmount('');
      setTransferDescription('');
    },
    onError: (error: any) => {
      console.error('Transfer error:', error);
      toast.error('حدث خطأ في تحويل المبلغ');
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
      setEditDialogOpen(false);
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
      toast.success('تم حذف المعاملة بنجاح');
    },
    onError: (error: any) => {
      console.error('Delete error:', error);
      toast.error('حدث خطأ في حذف المعاملة');
    }
  });

  const getCategoryName = (category: string) => {
    const categories = {
      'office': 'مصروفات مكتبية',
      'marketing': 'تسويق وإعلان',
      'transport': 'مواصلات',
      'maintenance': 'صيانة',
      'supplies': 'مستلزمات',
      'other': 'أخرى'
    };
    return categories[category as keyof typeof categories] || category;
  };

  const handleTransfer = () => {
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }
    
    if (amount > calculations.balance) {
      toast.error('المبلغ المطلوب تحويله أكبر من الرصيد المتاح');
      return;
    }
    
    transferMutation.mutate({ amount, description: transferDescription });
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
    setEditingTransaction({ ...transaction });
    setEditDialogOpen(true);
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* المؤشرات الرئيسية */}
      <div className={`grid gap-3 md:gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`font-medium text-emerald-700 mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>إجمالي الإيرادات</p>
                <p className={`font-bold text-emerald-900 ${isMobile ? 'text-lg' : 'text-3xl'}`}>
                  {formatCurrency(calculations.totalIncome)}
                </p>
              </div>
              <div className={`bg-emerald-100 p-2 md:p-3 rounded-full`}>
                <TrendingUp className={`text-emerald-600 ${isMobile ? 'h-5 w-5' : 'h-8 w-8'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`font-medium text-rose-700 mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>إجمالي المصروفات</p>
                <p className={`font-bold text-rose-900 ${isMobile ? 'text-lg' : 'text-3xl'}`}>
                  {formatCurrency(calculations.totalExpenses)}
                </p>
              </div>
              <div className={`bg-rose-100 p-2 md:p-3 rounded-full`}>
                <TrendingDown className={`text-rose-600 ${isMobile ? 'h-5 w-5' : 'h-8 w-8'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`font-medium text-blue-700 mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>الرصيد الحالي</p>
                <p className={`font-bold text-blue-900 ${isMobile ? 'text-lg' : 'text-3xl'}`}>
                  {formatCurrency(calculations.balance)}
                </p>
                <p className={`text-blue-600 mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                  {calculations.balance >= 0 ? 'رصيد إيجابي' : 'رصيد سالب'}
                </p>
              </div>
              <div className={`bg-blue-100 p-2 md:p-3 rounded-full`}>
                <Wallet className={`text-blue-600 ${isMobile ? 'h-5 w-5' : 'h-8 w-8'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`font-medium text-violet-700 mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>صافي الربح</p>
                <p className={`font-bold text-violet-900 ${isMobile ? 'text-lg' : 'text-3xl'}`}>
                  {formatCurrency((orderSummary?.net_profit || 0))}
                </p>
              </div>
              <div className={`bg-violet-100 p-2 md:p-3 rounded-full`}>
                <Calculator className={`text-violet-600 ${isMobile ? 'h-5 w-5' : 'h-8 w-8'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* المؤشرات الإضافية */}
      {orderSummary && (
        <div className={`grid gap-3 md:gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium text-orange-700 mb-2 ${isMobile ? 'text-sm' : 'text-sm'}`}>
                    التكاليف غير المسددة
                  </p>
                  <p className={`font-bold text-orange-900 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                    {formatCurrency(orderSummary.pending_payments)}
                  </p>
                </div>
                <AlertTriangle className={`text-orange-600 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium text-amber-700 mb-2 ${isMobile ? 'text-sm' : 'text-sm'}`}>
                    التحصيلات المعلقة
                  </p>
                  <p className={`font-bold text-amber-900 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                    {formatCurrency(orderSummary.uncollected_amounts)}
                  </p>
                </div>
                <Clock className={`text-amber-600 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
            <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium text-teal-700 mb-2 ${isMobile ? 'text-sm' : 'text-sm'}`}>
                    تكاليف الشحن
                  </p>
                  <p className={`font-bold text-teal-900 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                    {formatCurrency(orderSummary.total_shipping)}
                  </p>
                </div>
                <Banknote className={`text-teal-600 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* أزرار الإجراءات */}
      <div className={`flex gap-2 md:gap-4 ${isMobile ? 'flex-col' : 'flex-row flex-wrap'}`}>
        <Dialog open={addTransactionDialog} onOpenChange={setAddTransactionDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-sm">
              <Plus className="h-4 w-4 ml-2" />
              إضافة معاملة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة معاملة جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نوع المعاملة</Label>
                  <Select 
                    value={newTransaction.type} 
                    onValueChange={(value) => setNewTransaction(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">إيراد</SelectItem>
                      <SelectItem value="expense">مصروف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>التصنيف</Label>
                  <Select 
                    value={newTransaction.category} 
                    onValueChange={(value) => setNewTransaction(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="office">مصروفات مكتبية</SelectItem>
                      <SelectItem value="marketing">تسويق وإعلان</SelectItem>
                      <SelectItem value="transport">مواصلات</SelectItem>
                      <SelectItem value="maintenance">صيانة</SelectItem>
                      <SelectItem value="supplies">مستلزمات</SelectItem>
                      <SelectItem value="other">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>المبلغ</Label>
                <Input
                  type="number"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="أدخل المبلغ"
                />
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="وصف المعاملة"
                  rows={3}
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

        <Dialog open={transferDialog} onOpenChange={setTransferDialog}>
          <DialogTrigger asChild>
            <Button 
              variant="outline"
              disabled={calculations.balance <= 0}
            >
              <ArrowRightLeft className="h-4 w-4 ml-2" />
              تحويل مبلغ
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تحويل مبلغ إلى خزينة أخرى</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>المبلغ المتاح: {formatCurrency(calculations.balance)}</Label>
              </div>
              <div className="space-y-2">
                <Label>المبلغ المراد تحويله</Label>
                <Input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="أدخل المبلغ"
                />
              </div>
              <div className="space-y-2">
                <Label>وصف التحويل</Label>
                <Textarea
                  value={transferDescription}
                  onChange={(e) => setTransferDescription(e.target.value)}
                  placeholder="وصف التحويل (اختياري)"
                  rows={3}
                />
              </div>
              <Button 
                onClick={handleTransfer}
                disabled={transferMutation.isPending}
                className="w-full"
              >
                {transferMutation.isPending ? 'جاري التحويل...' : 'تأكيد التحويل'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={summaryViewOpen} onOpenChange={setSummaryViewOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 ml-2" />
              تقرير شامل
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>تقرير مالي شامل</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {orderSummary && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-gray-600 mb-1">إجمالي المبيعات</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(orderSummary.total_revenue)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-gray-600 mb-1">التكاليف الإجمالية</p>
                        <p className="text-2xl font-bold text-red-600">{formatCurrency(orderSummary.total_costs)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-gray-600 mb-1">عدد الطلبات</p>
                        <p className="text-2xl font-bold text-blue-600">{orderSummary.total_orders}</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-bold text-lg mb-3">ملخص الوضع المالي</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>الإيرادات:</span>
                          <span className="font-bold text-green-600">+{formatCurrency(calculations.totalIncome)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>المصروفات:</span>
                          <span className="font-bold text-red-600">-{formatCurrency(calculations.totalExpenses)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-bold">الرصيد النهائي:</span>
                          <span className={`font-bold ${calculations.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(calculations.balance)}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>صافي الربح:</span>
                          <span className="font-bold text-purple-600">{formatCurrency(orderSummary.net_profit)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>التكاليف المعلقة:</span>
                          <span className="font-bold text-orange-600">{formatCurrency(orderSummary.pending_payments)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>التحصيلات المعلقة:</span>
                          <span className="font-bold text-amber-600">{formatCurrency(orderSummary.uncollected_amounts)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* قائمة المعاملات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            سجل المعاملات المالية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:space-y-4">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد معاملات مالية
              </div>
            ) : (
              transactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className={`flex items-center justify-between border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all duration-200 ${isMobile ? 'p-3' : 'p-5'}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className={`flex items-center gap-2 mb-2 ${isMobile ? 'flex-wrap' : ''}`}>
                      <Badge 
                        variant={transaction.transaction_type === 'income' ? 'default' : 'destructive'}
                        className={`text-xs font-medium ${
                          transaction.transaction_type === 'income' 
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                      >
                        {transaction.transaction_type === 'income' ? '💰 إيراد' : '📤 مصروف'}
                      </Badge>
                      <span className={`font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        {transaction.order_serial}
                      </span>
                    </div>
                    
                    {transaction.description && (
                      <p className={`text-gray-700 mb-1 font-medium ${isMobile ? 'text-sm' : 'text-sm'} truncate`}>
                        {transaction.description}
                      </p>
                    )}
                    
                    <p className={`text-gray-500 flex items-center gap-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                      <Calendar className="h-3 w-3" />
                      {new Date(transaction.created_at).toLocaleString('ar-EG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  <div className={`flex items-center gap-2 ${isMobile ? 'flex-col' : 'flex-row'}`}>
                    <div className="text-left">
                      <p className={`font-bold ${
                        transaction.transaction_type === 'income' 
                          ? 'text-emerald-600' 
                          : 'text-rose-600'
                      } ${isMobile ? 'text-base' : 'text-xl'}`}>
                        {transaction.transaction_type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                    
                    <div className={`flex gap-1 ${isMobile ? 'w-full' : ''}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTransaction(transaction)}
                        className={isMobile ? 'flex-1' : ''}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        className={isMobile ? 'flex-1' : ''}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* نافذة تعديل المعاملة */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل المعاملة</DialogTitle>
          </DialogHeader>
          {editingTransaction && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>المبلغ</Label>
                <Input
                  type="number"
                  value={editingTransaction.amount}
                  onChange={(e) => setEditingTransaction({
                    ...editingTransaction,
                    amount: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea
                  value={editingTransaction.description || ''}
                  onChange={(e) => setEditingTransaction({
                    ...editingTransaction,
                    description: e.target.value
                  })}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveEdit} disabled={editTransactionMutation.isPending}>
                  <Save className="h-4 w-4 ml-2" />
                  {editTransactionMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
                </Button>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  <X className="h-4 w-4 ml-2" />
                  إلغاء
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComprehensiveAccountStatement;