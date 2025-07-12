
import React, { useState } from 'react';
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
  
  const [transferDialog, setTransferDialog] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDescription, setTransferDescription] = useState('');

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
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(totalIncome)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">إجمالي المصروفات</p>
                <p className="text-2xl font-bold text-red-900">{formatCurrency(totalExpenses)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">الرصيد الحالي</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(balance)}</p>
              </div>
              <Wallet className="h-8 w-8 text-blue-600" />
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
                <Button className="bg-purple-600 hover:bg-purple-700">
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
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge 
                        variant={transaction.transaction_type === 'income' ? 'default' : 'destructive'}
                        className={`${
                          transaction.transaction_type === 'income' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {transaction.transaction_type === 'income' ? 'إيراد' : 'مصروف'}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {transaction.order_serial}
                      </span>
                    </div>
                    
                    {transaction.description && (
                      <p className="text-sm text-gray-600 mb-1">
                        {transaction.description}
                      </p>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.created_at).toLocaleString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  <div className="text-left">
                    <p className={`text-lg font-bold ${
                      transaction.transaction_type === 'income' 
                        ? 'text-green-600' 
                        : 'text-red-600'
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
