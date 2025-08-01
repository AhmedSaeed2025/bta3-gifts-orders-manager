import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { CreditCard, Plus, History } from 'lucide-react';

interface OrderPaymentManagementProps {
  orderId: string;
  orderSerial: string;
  totalAmount: number;
  paymentsReceived: number;
  remainingAmount: number;
  userId: string;
}

const OrderPaymentManagement = ({
  orderId,
  orderSerial,
  totalAmount,
  paymentsReceived,
  remainingAmount,
  userId
}: OrderPaymentManagementProps) => {
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const queryClient = useQueryClient();

  // Add payment mutation
  const addPaymentMutation = useMutation({
    mutationFn: async ({ amount, description }: { amount: number; description: string }) => {
      const newPaymentsReceived = paymentsReceived + amount;
      const newRemainingAmount = totalAmount - newPaymentsReceived;

      // Update order payments
      const { error: orderError } = await supabase
        .from('admin_orders')
        .update({
          payments_received: newPaymentsReceived,
          remaining_amount: newRemainingAmount
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Add transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          amount: amount,
          transaction_type: 'income',
          description: `دفعة من طلب ${orderSerial} - ${description}`,
          order_serial: orderSerial
        });

      if (transactionError) throw transactionError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['order-summary'] });
      toast.success('تم تسجيل الدفعة بنجاح');
      setPaymentDialog(false);
      setPaymentAmount('');
      setPaymentDescription('');
    },
    onError: (error: any) => {
      console.error('Payment error:', error);
      toast.error('حدث خطأ في تسجيل الدفعة');
    }
  });

  const handleAddPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }
    
    if (amount > remainingAmount) {
      toast.error('المبلغ المدخل أكبر من المبلغ المتبقي');
      return;
    }
    
    addPaymentMutation.mutate({ 
      amount, 
      description: paymentDescription || 'دفعة جزئية' 
    });
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-600" />
          حالة الدفع
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-3 rounded-lg border">
            <p className="text-sm text-gray-600">إجمالي الفاتورة</p>
            <p className="text-lg font-bold text-gray-800">
              {formatCurrency(totalAmount)}
            </p>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-sm text-green-700">المبلغ المسدد</p>
            <p className="text-lg font-bold text-green-800">
              {formatCurrency(paymentsReceived)}
            </p>
          </div>
          
          <div className={`p-3 rounded-lg border ${
            remainingAmount > 0 
              ? 'bg-red-50 border-red-200' 
              : 'bg-green-50 border-green-200'
          }`}>
            <p className={`text-sm ${
              remainingAmount > 0 ? 'text-red-700' : 'text-green-700'
            }`}>
              المبلغ المتبقي
            </p>
            <p className={`text-lg font-bold ${
              remainingAmount > 0 ? 'text-red-800' : 'text-green-800'
            }`}>
              {formatCurrency(remainingAmount)}
            </p>
          </div>
        </div>

        {remainingAmount > 0 && (
          <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
            <DialogTrigger asChild>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 ml-2" />
                تسجيل دفعة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>تسجيل دفعة جديدة - {orderSerial}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">المبلغ المتبقي للسداد:</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(remainingAmount)}
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="paymentAmount">مبلغ الدفعة</Label>
                  <Input
                    id="paymentAmount"
                    type="number"
                    step="0.01"
                    max={remainingAmount}
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="paymentDescription">وصف الدفعة (اختياري)</Label>
                  <Input
                    id="paymentDescription"
                    placeholder="مثال: دفعة نقدية، تحويل بنكي، إلخ"
                    value={paymentDescription}
                    onChange={(e) => setPaymentDescription(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={handleAddPayment} 
                  disabled={addPaymentMutation.isPending}
                  className="w-full"
                >
                  {addPaymentMutation.isPending ? 'جاري التسجيل...' : 'تسجيل الدفعة'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {remainingAmount === 0 && (
          <div className="bg-green-100 border border-green-300 rounded-lg p-3 text-center">
            <p className="text-green-800 font-bold">✅ تم السداد بالكامل</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderPaymentManagement;