import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
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
  Clock
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
  pending_costs: number;
  pending_collections: number;
}

const SimpleAccountStatement = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  
  const [addTransactionDialog, setAddTransactionDialog] = useState(false);
  
  // New transaction form
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    type: 'expense',
    description: ''
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

  // Fetch order summary
  const { data: orderSummary } = useQuery({
    queryKey: ['order-summary'],
    queryFn: async () => {
      if (!user) return null;
      
      const { data: orders, error } = await supabase
        .from('admin_orders')
        .select('total_amount, shipping_cost, profit, payments_received, remaining_amount, status')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching order summary:', error);
        return null;
      }
      
      const summary = orders.reduce((acc, order) => {
        const orderTotal = order.total_amount;
        const orderCost = orderTotal - order.profit - order.shipping_cost;
        const isPending = order.status === 'pending' || order.status === 'confirmed';
        
        return {
          total_revenue: acc.total_revenue + orderTotal,
          total_costs: acc.total_costs + orderCost,
          total_shipping: acc.total_shipping + order.shipping_cost,
          net_profit: acc.net_profit + order.profit,
          total_orders: acc.total_orders + 1,
          pending_costs: acc.pending_costs + (isPending ? orderCost : 0),
          pending_collections: acc.pending_collections + (order.remaining_amount || 0)
        };
      }, {
        total_revenue: 0,
        total_costs: 0,
        total_shipping: 0,
        net_profit: 0,
        total_orders: 0,
        pending_costs: 0,
        pending_collections: 0
      });

      return summary;
    },
    enabled: !!user
  });

  // Calculate balances
  const calculations = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Add collections (payments_received) and profits as income
    const totalCollections = orderSummary?.net_profit || 0;
    const totalAdjustedIncome = totalIncome + totalCollections + (orderSummary?.total_shipping || 0);

    // Add costs and shipping as expenses
    const totalAdjustedExpenses = totalExpenses + (orderSummary?.total_costs || 0);

    const balance = totalAdjustedIncome - totalAdjustedExpenses;

    return { 
      balance, 
      totalIncome: totalAdjustedIncome, 
      totalExpenses: totalAdjustedExpenses,
      collections: totalCollections,
      advertising: transactions.filter(t => t.transaction_type === 'expense' && t.description?.includes('إعلان')).reduce((sum, t) => sum + t.amount, 0)
    };
  }, [transactions, orderSummary]);

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
      {/* العنوان */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardTitle className="text-center text-xl font-bold">كشف الحساب</CardTitle>
        </CardHeader>
      </Card>

      {/* المؤشرات الرئيسية - صف واحد */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm text-green-700 mb-1">إجمالي الواردات</p>
            <p className="text-lg font-bold text-green-800">
              {formatCurrency(calculations.totalIncome)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <p className="text-sm text-red-700 mb-1">إجمالي المصروفات</p>
            <p className="text-lg font-bold text-red-800">
              {formatCurrency(calculations.totalExpenses)}
            </p>
          </CardContent>
        </Card>

        <Card className={`${calculations.balance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Wallet className={`h-6 w-6 ${calculations.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
            </div>
            <p className={`text-sm mb-1 ${calculations.balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>الرصيد الحالي</p>
            <p className={`text-lg font-bold ${calculations.balance >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
              {formatCurrency(calculations.balance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* المؤشرات الإضافية */}
      {orderSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Calculator className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-xs text-purple-700 mb-1">صافي الربح</p>
              <p className="text-sm font-bold text-purple-800">
                {formatCurrency(orderSummary.net_profit)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-xs text-orange-700 mb-1">تكاليف معلقة</p>
              <p className="text-sm font-bold text-orange-800">
                {formatCurrency(orderSummary.pending_costs)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <p className="text-xs text-amber-700 mb-1">تحصيلات منتظرة</p>
              <p className="text-sm font-bold text-amber-800">
                {formatCurrency(orderSummary.pending_collections)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-teal-50 border-teal-200">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="h-5 w-5 text-teal-600" />
              </div>
              <p className="text-xs text-teal-700 mb-1">تكاليف الشحن</p>
              <p className="text-sm font-bold text-teal-800">
                {formatCurrency(orderSummary.total_shipping)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* أزرار الإجراءات */}
      <div className="flex gap-3">
        <Dialog open={addTransactionDialog} onOpenChange={setAddTransactionDialog}>
          <DialogTrigger asChild>
            <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white">
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
                    <SelectItem value="expense">مصروف إعلانات</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="description">الوصف</Label>
                <Input
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
      </div>

      {/* قائمة المعاملات */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">آخر المعاملات</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              لا توجد معاملات
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      transaction.transaction_type === 'income' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.transaction_type === 'income' ? (
                        <Plus className="h-4 w-4 text-green-600" />
                      ) : (
                        <Minus className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${
                    transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.transaction_type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleAccountStatement;