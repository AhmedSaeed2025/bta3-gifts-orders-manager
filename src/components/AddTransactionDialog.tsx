
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Plus, DollarSign, TrendingDown, TrendingUp, Save, X } from "lucide-react";

interface AddTransactionDialogProps {
  onTransactionAdded: () => void;
  children?: React.ReactNode;
}

const AddTransactionDialog = ({ onTransactionAdded, children }: AddTransactionDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: "",
    amount: "",
    description: "",
    orderSerial: ""
  });
  const { user } = useAuth();
  const isMobile = useIsMobile();

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'expense': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'other_income': return <TrendingUp className="h-4 w-4 text-green-500" />;
      default: return <DollarSign className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'expense': return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      case 'other_income': return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
      default: return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
    }
  };

  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'expense': return 'تسجيل مصروف أو نفقة خارجية';
      case 'other_income': return 'تسجيل إيراد إضافي خارج الطلبات';
      default: return 'اختر نوع المعاملة';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
            <Plus className="h-4 w-4" />
            إضافة معاملة
          </Button>
        )}
      </DialogTrigger>
      <DialogContent 
        className={`rtl ${isMobile ? "max-w-sm mx-4" : "max-w-lg"} max-h-[90vh] overflow-y-auto`} 
        style={{ direction: 'rtl' }}
      >
        <DialogHeader className="text-center pb-4 border-b border-slate-200 dark:border-slate-700">
          <DialogTitle className={`flex items-center justify-center gap-3 ${isMobile ? "text-lg" : "text-xl"} font-bold text-slate-800 dark:text-white`}>
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
              <Plus className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} text-white`} />
            </div>
            إضافة معاملة مالية جديدة
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* نوع المعاملة */}
          <div className="space-y-3">
            <Label htmlFor="type" className={`${isMobile ? "text-sm" : "text-base"} font-semibold text-slate-700 dark:text-slate-300`}>
              نوع المعاملة *
            </Label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger className={`${isMobile ? "h-10" : "h-12"} border-2 focus:border-blue-500`}>
                <SelectValue placeholder="اختر نوع المعاملة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <span>مصروف</span>
                  </div>
                </SelectItem>
                <SelectItem value="other_income" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span>إيراد إضافي</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {formData.type && (
              <Card className={`${getTypeColor(formData.type)} border-2`}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(formData.type)}
                    <span className={`${isMobile ? "text-sm" : "text-base"} font-medium text-slate-700 dark:text-slate-300`}>
                      {getTypeDescription(formData.type)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* المبلغ */}
          <div className="space-y-3">
            <Label htmlFor="amount" className={`${isMobile ? "text-sm" : "text-base"} font-semibold text-slate-700 dark:text-slate-300`}>
              المبلغ (ج.م) *
            </Label>
            <div className="relative">
              <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="أدخل المبلغ"
                className={`${isMobile ? "h-10" : "h-12"} pr-10 border-2 focus:border-blue-500 text-right ltr-numbers`}
                required
              />
            </div>
          </div>

          {/* الوصف */}
          <div className="space-y-3">
            <Label htmlFor="description" className={`${isMobile ? "text-sm" : "text-base"} font-semibold text-slate-700 dark:text-slate-300`}>
              وصف المعاملة
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="اكتب وصفاً تفصيلياً للمعاملة..."
              className="border-2 focus:border-blue-500 min-h-[80px] resize-none"
              rows={3}
            />
          </div>

          {/* مرجع المعاملة */}
          <div className="space-y-3">
            <Label htmlFor="orderSerial" className={`${isMobile ? "text-sm" : "text-base"} font-semibold text-slate-700 dark:text-slate-300`}>
              مرجع أو رقم المعاملة
            </Label>
            <Input
              id="orderSerial"
              value={formData.orderSerial}
              onChange={(e) => setFormData(prev => ({ ...prev, orderSerial: e.target.value }))}
              placeholder="رقم فاتورة، مرجع، أو معرف المعاملة (اختياري)"
              className={`${isMobile ? "h-10" : "h-12"} border-2 focus:border-blue-500`}
            />
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
            <Button 
              type="submit" 
              disabled={loading} 
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 rounded-lg transition-all duration-200"
            >
              <Save className="h-4 w-4 ml-2" />
              {loading ? "جاري الحفظ..." : "حفظ المعاملة"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="flex-1 border-2 border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800 font-semibold py-3 rounded-lg transition-all duration-200"
            >
              <X className="h-4 w-4 ml-2" />
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionDialog;
