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
  Eye
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
}

const AdvancedAccountStatement = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  
  const [transferDialog, setTransferDialog] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDescription, setTransferDescription] = useState('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [summaryViewOpen, setSummaryViewOpen] = useState(false);

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

  // Fetch order summary
  const { data: orderSummary } = useQuery({
    queryKey: ['order-summary'],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('admin_orders')
        .select('total_amount, shipping_cost, profit')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching order summary:', error);
        return null;
      }
      
      const summary = data.reduce((acc, order) => ({
        total_revenue: acc.total_revenue + order.total_amount,
        total_costs: acc.total_costs + (order.total_amount - order.profit - order.shipping_cost),
        total_shipping: acc.total_shipping + order.shipping_cost,
        net_profit: acc.net_profit + order.profit,
        total_orders: acc.total_orders + 1
      }), {
        total_revenue: 0,
        total_costs: 0,
        total_shipping: 0,
        net_profit: 0,
        total_orders: 0
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
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-4'}`}>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700 mb-2">إجمالي الإيرادات</p>
                <p className="text-3xl font-bold text-emerald-900">{formatCurrency(calculations.totalIncome)}</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-full">
                <TrendingUp className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-rose-700 mb-2">إجمالي المصروفات</p>
                <p className="text-3xl font-bold text-rose-900">{formatCurrency(calculations.totalExpenses)}</p>
              </div>
              <div className="bg-rose-100 p-3 rounded-full">
                <TrendingDown className="h-8 w-8 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-2">الرصيد الحالي</p>
                <p className="text-3xl font-bold text-blue-900">{formatCurrency(calculations.balance)}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {calculations.balance >= 0 ? 'رصيد إيجابي' : 'رصيد سالب'}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Wallet className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-violet-700 mb-2">صافي الربح</p>
                <p className="text-3xl font-bold text-violet-900">
                  {formatCurrency((orderSummary?.net_profit || 0))}
                </p>
              </div>
              <div className="bg-violet-100 p-3 rounded-full">
                <Calculator className="h-8 w-8 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 flex-wrap">
        <Dialog open={transferDialog} onOpenChange={setTransferDialog}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-sm"
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
              ملخص مفصل
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>ملخص مالي مفصل</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {orderSummary && (
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600">إجمالي المبيعات</p>
                      <p className="text-2xl font-bold">{formatCurrency(orderSummary.total_revenue)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600">التكاليف</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(orderSummary.total_costs)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600">تكاليف الشحن</p>
                      <p className="text-2xl font-bold">{formatCurrency(orderSummary.total_shipping)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600">عدد الطلبات</p>
                      <p className="text-2xl font-bold">{orderSummary.total_orders}</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            كشف حساب مفصل
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد معاملات مالية
              </div>
            ) : (
              transactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-5 border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge 
                        variant={transaction.transaction_type === 'income' ? 'default' : 'destructive'}
                        className={`px-3 py-1 text-sm font-medium ${
                          transaction.transaction_type === 'income' 
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                      >
                        {transaction.transaction_type === 'income' ? '💰 إيراد' : '📤 مصروف'}
                      </Badge>
                      <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                        {transaction.order_serial}
                      </span>
                    </div>
                    
                    {transaction.description && (
                      <p className="text-sm text-gray-700 mb-2 font-medium">
                        {transaction.description}
                      </p>
                    )}
                    
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
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
                    <div className="text-left">
                      <p className={`text-xl font-bold ${
                        transaction.transaction_type === 'income' 
                          ? 'text-emerald-600' 
                          : 'text-rose-600'
                      }`}>
                        {transaction.transaction_type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTransaction(transaction)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteTransaction(transaction.id)}
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

      {/* Edit Transaction Dialog */}
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

export default AdvancedAccountStatement;