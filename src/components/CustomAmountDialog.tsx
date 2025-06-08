
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

interface CustomAmountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  title: string;
  defaultAmount: number;
}

const CustomAmountDialog: React.FC<CustomAmountDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  defaultAmount,
}) => {
  const [amount, setAmount] = useState<string>(defaultAmount.toString());

  useEffect(() => {
    setAmount(defaultAmount.toString());
  }, [defaultAmount, isOpen]);

  const handleConfirm = () => {
    const numericAmount = parseFloat(amount);
    if (!isNaN(numericAmount) && numericAmount > 0) {
      onConfirm(numericAmount);
      onClose();
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">{title}</DialogTitle>
          <DialogDescription className="text-right">
            أدخل المبلغ المطلوب تسجيله في المعاملة
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4" dir="rtl">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-right block">
              المبلغ (بالجنيه المصري)
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="text-left font-mono text-lg"
                dir="ltr"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                ج.م
              </div>
            </div>
            {defaultAmount > 0 && (
              <p className="text-sm text-gray-600 text-right">
                المبلغ المسجل في الطلب: <span className="font-semibold" dir="ltr">{formatCurrency(defaultAmount)}</span>
              </p>
            )}
          </div>
          <div className="flex gap-3 justify-end" dir="rtl">
            <Button variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!amount || parseFloat(amount) <= 0}
              className="bg-green-600 hover:bg-green-700"
            >
              تأكيد المعاملة
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomAmountDialog;
