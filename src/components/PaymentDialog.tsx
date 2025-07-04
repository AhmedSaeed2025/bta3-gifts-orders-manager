
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Order } from "@/context/SupabaseOrderContext";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onPaymentAdded: () => void;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  isOpen,
  onClose,
  order,
  onPaymentAdded
}) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState<string>("deposit");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  if (!order) return null;

  // حساب المبلغ المتبقي للسداد
  const remainingAmount = order.total - (order.deposit || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !amount || parseFloat(amount) <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح");
      return;
    }

    const paymentAmount = parseFloat(amount);
    
    // التحقق من أن المبلغ المدخل لا يتجاوز المتبقي
    if (paymentAmount > remainingAmount) {
      toast.error(`المبلغ المدخل أكبر من المتبقي (${formatCurrency(remainingAmount)})`);
      return;
    }

    setLoading(true);

    try {
      // تحديث العربون في الطلب
      const newDeposit = (order.deposit || 0) + paymentAmount;
      
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          deposit: newDeposit,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)
        .eq('user_id', user.id);

      if (orderError) throw orderError;

      // إضافة معاملة في كشف الحساب
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          order_serial: order.serial,
          transaction_type: paymentType,
          amount: paymentAmount,
          description: description || `سداد جزئي للطلب ${order.serial}`
        });

      if (transactionError) throw transactionError;

      toast.success("تم تسجيل السداد بنجاح");
      
      // إعادة تعيين النموذج
      setAmount("");
      setDescription("");
      onPaymentAdded();
      onClose();
      
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error("حدث خطأ في تسجيل السداد");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>تسجيل سداد للطلب {order.serial}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">إجمالي الطلب:</span>
                <div className="text-lg font-bold text-blue-600">
                  {formatCurrency(order.total)}
                </div>
              </div>
              <div>
                <span className="font-medium">المدفوع حالياً:</span>
                <div className="text-lg font-bold text-green-600">
                  {formatCurrency(order.deposit || 0)}
                </div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t">
              <span className="font-medium">المتبقي للسداد:</span>
              <div className="text-xl font-bold text-red-600">
                {formatCurrency(remainingAmount)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentType">نوع السداد</Label>
            <Select value={paymentType} onValueChange={setPaymentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deposit">عربون</SelectItem>
                <SelectItem value="order_collection">تحصيل طلب</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">مبلغ السداد</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={remainingAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">وصف السداد (اختياري)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="تفاصيل إضافية عن السداد..."
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1"
            >
              {loading ? "جاري التسجيل..." : "تسجيل السداد"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
