
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
import { DollarSign } from "lucide-react";

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
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const previewAmount = parseFloat(amount) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rtl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-right">
            أدخل المبلغ المطلوب تسجيله في المعاملة
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="amount" className="text-right block font-medium">
              المبلغ بالجنيه المصري
            </Label>
            
            <div className="relative">
              <Input
                id="amount"
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="text-right text-lg pr-16 font-mono"
                dir="rtl"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                ج.م
              </div>
            </div>
            
            {/* Preview of the amount */}
            {previewAmount > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-right text-sm text-blue-700 dark:text-blue-300">
                  المبلغ: <span className="font-bold text-lg">{formatCurrency(previewAmount)}</span>
                </p>
              </div>
            )}
            
            {defaultAmount > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-right">
                  المبلغ المسجل في الطلب: 
                  <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">
                    {formatCurrency(defaultAmount)}
                  </span>
                </p>
              </div>
            )}
          </div>
          
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!amount || parseFloat(amount) <= 0}
              className="bg-green-600 hover:bg-green-700 text-white"
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
