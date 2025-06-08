
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
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const formatAmountPreview = (value: string) => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return "0.00 ج.م";
    return formatCurrency(numericValue);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-2xl" dir="rtl">
        <DialogHeader className="text-center border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
          <DialogTitle className="text-right text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-600" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-right text-gray-600 dark:text-gray-400 mt-2">
            أدخل المبلغ المطلوب تسجيله في المعاملة المالية
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6" dir="rtl">
          {/* Current Order Amount Display */}
          {defaultAmount > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <div className="text-center">
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">المبلغ المسجل في الطلب</p>
                <div className="text-2xl font-bold text-blue-800 dark:text-blue-200" dir="ltr">
                  {formatCurrency(defaultAmount)}
                </div>
              </div>
            </div>
          )}

          {/* Amount Input Section */}
          <div className="space-y-3">
            <Label htmlFor="amount" className="text-right block text-base font-semibold text-gray-700 dark:text-gray-300">
              المبلغ المطلوب تسجيله
            </Label>
            
            <div className="relative">
              <Input
                id="amount"
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="أدخل المبلغ"
                className="text-center font-mono text-xl h-14 border-2 border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400 rounded-lg bg-white dark:bg-gray-700"
                dir="ltr"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-lg font-semibold">
                ج.م
              </div>
            </div>

            {/* Live Preview */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
              <div className="text-center">
                <p className="text-sm text-green-700 dark:text-green-300 mb-2">معاينة المبلغ</p>
                <div className="text-3xl font-bold text-green-800 dark:text-green-200" dir="ltr">
                  {formatAmountPreview(amount)}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700" dir="rtl">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="px-6 py-3 text-base border-2 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              إلغاء
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!amount || parseFloat(amount) <= 0}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <DollarSign className="h-5 w-5 mr-2" />
              تأكيد المعاملة
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomAmountDialog;
