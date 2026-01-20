
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface OrderPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  paymentType: 'collection' | 'shipping' | 'cost';
  onConfirm: (amount: number, notes?: string, updateOrderCost?: boolean) => void;
}

const OrderPaymentDialog = ({ 
  open, 
  onOpenChange, 
  order, 
  paymentType, 
  onConfirm 
}: OrderPaymentDialogProps) => {
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [originalCost, setOriginalCost] = useState<number>(0);

  useEffect(() => {
    if (order) {
      if (paymentType === 'collection') {
        // Set default amount to remaining balance
        const remainingAmount = (order.total || 0) - (order.deposit || 0);
        setAmount(remainingAmount);
        setOriginalCost(0);
      } else if (paymentType === 'shipping') {
        setAmount(order.shipping_cost || 0);
        setOriginalCost(0);
      } else if (paymentType === 'cost') {
        // حساب التكلفة المسجلة مسبقاً في الأوردر
        // التكلفة = إجمالي المبلغ - الربح - الشحن
        const orderCost = (order.total || 0) - (order.profit || 0) - (order.shipping_cost || 0);
        setAmount(orderCost > 0 ? orderCost : 0);
        setOriginalCost(orderCost > 0 ? orderCost : 0);
      } else {
        setAmount(0);
        setOriginalCost(0);
      }
    }
  }, [order, paymentType, open]);

  const handleConfirm = () => {
    if (amount > 0) {
      // إذا كان نوع الدفع هو تكلفة وتم تعديل المبلغ، نُعلم المكون الأب
      const costWasModified = paymentType === 'cost' && amount !== originalCost;
      onConfirm(amount, notes, costWasModified);
      setAmount(0);
      setNotes('');
      onOpenChange(false);
    }
  };

  const getTitle = () => {
    switch (paymentType) {
      case 'collection': return 'تحصيل مبلغ من الطلب';
      case 'shipping': return 'سداد مصاريف الشحن';
      case 'cost': return 'سداد التكلفة';
      default: return 'تسجيل دفعة';
    }
  };

  const isCostModified = paymentType === 'cost' && amount !== originalCost && originalCost > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {paymentType === 'cost' && originalCost > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <p className="text-blue-700">
                التكلفة المسجلة في الطلب: <span className="font-bold">{formatCurrency(originalCost)}</span>
              </p>
              <p className="text-blue-600 text-xs mt-1">
                يمكنك تعديل المبلغ وسيتم تحديث تكلفة الطلب تلقائياً
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="amount">المبلغ</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              placeholder="أدخل المبلغ"
            />
          </div>

          {isCostModified && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-amber-700 font-medium">سيتم تحديث تكلفة الطلب</p>
                <p className="text-amber-600 text-xs mt-1">
                  سيتم تعديل التكلفة من {formatCurrency(originalCost)} إلى {formatCurrency(amount)} وإعادة حساب الربح
                </p>
              </div>
            </div>
          )}
          
          <div>
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أدخل ملاحظات إضافية"
              rows={3}
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button onClick={handleConfirm} className="flex-1">
              تأكيد
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderPaymentDialog;
