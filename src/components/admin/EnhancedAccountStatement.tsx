
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
import { Calendar, TrendingUp, TrendingDown, Wallet, Plus, ArrowRightLeft, DollarSign } from 'lucide-react';
import { useDateFilter } from '@/components/tabs/StyledIndexTabs';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  description?: string;
  order_serial: string;
  created_at: string;
}

const EnhancedAccountStatement = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { startDate, endDate } = useDateFilter();
  
  const [transferDialog, setTransferDialog] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDescription, setTransferDescription] = useState('');

  // Fetch transactions
  const { data: allTransactions = [], isLoading } = useQuery({
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

  // Filter transactions by date
  const transactions = useMemo(() => {
    return allTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.created_at);
      const matchesDateFrom = !startDate || transactionDate >= startDate;
      const matchesDateTo = !endDate || transactionDate <= endDate;
      return matchesDateFrom && matchesDateTo;
    });
  }, [allTransactions, startDate, endDate]);

  // Calculate balance
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

  // Transfer mutation
  const transferMutation = useMutation({
    mutationFn: async ({ amount, description }: { amount: number; description: string }) => {
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');
      
      // Create expense transaction for the transfer
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

  const handleTransfer = () => {
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }
    
    if (amount > balance) {
      toast.error('المبلغ المطلوب تحويله أكبر من الرصيد المتاح');
      return;
    }
    
    transferMutation.mutate({ amount, description: transferDescription });
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
      {/* Header Cards */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700 mb-2">إجمالي الإيرادات</p>
                <p className="text-3xl font-bold text-emerald-900">{formatCurrency(totalIncome)}</p>
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
                <p className="text-3xl font-bold text-rose-900">{formatCurrency(totalExpenses)}</p>
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
                <p className="text-3xl font-bold text-blue-900">{formatCurrency(balance)}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {balance >= 0 ? 'رصيد إيجابي' : 'رصيد سالب'}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Wallet className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transfer Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              إدارة الخزينة
            </CardTitle>
            <Dialog open={transferDialog} onOpenChange={setTransferDialog}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-sm"
                  disabled={balance <= 0}
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
                    <Label>المبلغ المتاح: {formatCurrency(balance)}</Label>
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
          </div>
        </CardHeader>
      </Card>

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
                  
                  <div className="text-left ml-4">
                    <p className={`text-xl font-bold ${
                      transaction.transaction_type === 'income' 
                        ? 'text-emerald-600' 
                        : 'text-rose-600'
                    }`}>
                      {transaction.transaction_type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedAccountStatement;
