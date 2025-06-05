
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CustomAmountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  title: string;
  defaultAmount: number;
  description?: string;
}

const CustomAmountDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  defaultAmount,
  description 
}: CustomAmountDialogProps) => {
  const [amount, setAmount] = useState(defaultAmount);

  const handleConfirm = () => {
    onConfirm(amount);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="amount">المبلغ</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={0}
              step={0.01}
              className="text-left"
              style={{ direction: 'ltr' }}
            />
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button onClick={handleConfirm}>
              تأكيد
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomAmountDialog;
