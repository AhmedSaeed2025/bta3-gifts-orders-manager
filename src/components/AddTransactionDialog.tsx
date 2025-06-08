
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      default: return type;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          إضافة معاملة
        </Button>
      </DialogTrigger>
      <DialogContent className="rtl max-w-md" style={{ direction: 'rtl' }}>
        <DialogHeader>
          <DialogTitle>إضافة معاملة جديدة</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">نوع المعاملة *</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع المعاملة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">مصروف</SelectItem>
                <SelectItem value="other_income">إيراد إضافي</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">المبلغ *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="أدخل المبلغ"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="وصف المعاملة (اختياري)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="orderSerial">مرجع المعاملة</Label>
            <Input
              id="orderSerial"
              value={formData.orderSerial}
              onChange={(e) => setFormData(prev => ({ ...prev, orderSerial: e.target.value }))}
              placeholder="مرجع أو رقم المعاملة (اختياري)"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "جاري الإضافة..." : "إضافة المعاملة"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionDialog;
