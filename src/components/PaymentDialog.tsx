import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, paymentMethod: string, notes: string) => void;
  order: any;
  title: string;
  defaultAmount: number;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  order,
  title,
  defaultAmount
}) => {
  const [amount, setAmount] = useState(defaultAmount);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");

  const remainingAmount = order ? (order.total - (order.deposit || 0)) : 0;

  const handleConfirm = () => {
    if (amount <= 0) {
      return;
    }
    onConfirm(amount, paymentMethod, notes);
    setAmount(defaultAmount);
    setPaymentMethod("");
    setNotes("");
    onClose();
  };

  const handleAmountChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setAmount(numValue);
  };

  const handleQuickAmount = (percentage: number) => {
    const quickAmount = Math.round(remainingAmount * (percentage / 100));
    setAmount(quickAmount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-center flex items-center gap-2 justify-center">
            <CreditCard className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Order Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">رقم الطلب:</span>
                <span className="font-medium">{order?.serial}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">العميل:</span>
                <span className="font-medium">{order?.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">إجمالي الطلب:</span>
                <span className="font-bold text-green-600">{formatCurrency(order?.total || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">المدفوع سابقاً:</span>
                <span className="font-medium">{formatCurrency(order?.deposit || 0)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600">المتبقي:</span>
                <span className="font-bold text-red-600">{formatCurrency(remainingAmount)}</span>
              </div>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">اختيار سريع:</Label>
            <div className="grid grid-cols-4 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickAmount(25)}
                className="text-xs"
              >
                25%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickAmount(50)}
                className="text-xs"
              >
                50%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickAmount(75)}
                className="text-xs"
              >
                75%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(remainingAmount)}
                className="text-xs"
              >
                100%
              </Button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">
              المبلغ المدفوع *
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="أدخل المبلغ"
                className="pr-10"
                min="0"
                max={remainingAmount}
              />
              <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <div className="text-xs text-gray-500">
              الحد الأقصى: {formatCurrency(remainingAmount)}
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod" className="text-sm font-medium">
              طريقة الدفع *
            </Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="اختر طريقة الدفع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="نقدي">نقدي</SelectItem>
                <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
                <SelectItem value="فودافون كاش">فودافون كاش</SelectItem>
                <SelectItem value="أورانج موني">أورانج موني</SelectItem>
                <SelectItem value="إتصالات فليكس">إتصالات فليكس</SelectItem>
                <SelectItem value="كارت ائتماني">كارت ائتماني</SelectItem>
                <SelectItem value="شيك">شيك</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              ملاحظات (اختياري)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أدخل ملاحظات إضافية..."
              className="min-h-[60px] resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleConfirm}
              disabled={amount <= 0 || !paymentMethod || amount > remainingAmount}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              تأكيد السداد
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;