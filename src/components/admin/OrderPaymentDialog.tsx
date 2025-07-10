
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface OrderPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  paymentType: 'collection' | 'shipping' | 'cost';
  onConfirm: (amount: number, notes?: string) => void;
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

  React.useEffect(() => {
    if (order && paymentType === 'collection') {
      // Set default amount to remaining balance
      const remainingAmount = (order.total || 0) - (order.deposit || 0);
      setAmount(remainingAmount);
    } else if (order && paymentType === 'shipping') {
      setAmount(order.shipping_cost || 0);
    } else {
      setAmount(0);
    }
  }, [order, paymentType]);

  const handleConfirm = () => {
    if (amount > 0) {
      onConfirm(amount, notes);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
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
