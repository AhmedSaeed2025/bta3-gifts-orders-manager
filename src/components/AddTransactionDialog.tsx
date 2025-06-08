
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, DollarSign, FileText, Tag } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface AddTransactionDialogProps {
  onTransactionAdded: () => void;
}

const AddTransactionDialog = ({ onTransactionAdded }: AddTransactionDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: "",
    amount: "",
    description: "",
    orderSerial: ""
  });
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    if (!formData.type || !formData.amount) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          transaction_type: formData.type,
          amount: parseFloat(formData.amount),
          description: formData.description || null,
          order_serial: formData.orderSerial || `MISC-${Date.now()}`
        });

      if (error) throw error;

      toast.success("تم إضافة المعاملة بنجاح");
      setFormData({ type: "", amount: "", description: "", orderSerial: "" });
      setIsOpen(false);
      onTransactionAdded();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error("حدث خطأ في إضافة المعاملة");
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'expense': return 'مصروف';
      case 'other_income': return 'إيراد إضافي';
      case 'order_collection': return 'تحصيل طلب';
      case 'shipping_payment': return 'دفع شحن';
      case 'cost_payment': return 'دفع تكلفة';
      default: return type;
    }
  };

  const previewAmount = parseFloat(formData.amount) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          إضافة معاملة
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            إضافة معاملة مالية جديدة
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="type" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              نوع المعاملة *
            </Label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع المعاملة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">مصروف</SelectItem>
                <SelectItem value="other_income">إيراد إضافي</SelectItem>
                <SelectItem value="order_collection">تحصيل طلب</SelectItem>
                <SelectItem value="shipping_payment">دفع شحن</SelectItem>
                <SelectItem value="cost_payment">دفع تكلفة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              المبلغ *
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="text"
                value={formData.amount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setFormData(prev => ({ ...prev, amount: value }));
                  }
                }}
                placeholder="أدخل المبلغ"
                className="text-right pr-16 font-mono text-lg"
                dir="rtl"
                required
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
          </div>

          <div className="space-y-3">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              الوصف
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="وصف المعاملة (اختياري)"
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="orderSerial">مرجع المعاملة</Label>
            <Input
              id="orderSerial"
              value={formData.orderSerial}
              onChange={(e) => setFormData(prev => ({ ...prev, orderSerial: e.target.value }))}
              placeholder="مرجع أو رقم المعاملة (اختياري)"
            />
          </div>

          <div className="flex gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              إلغاء
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.type || !formData.amount} 
              className="flex-1"
            >
              {loading ? "جاري الإضافة..." : "إضافة المعاملة"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionDialog;
