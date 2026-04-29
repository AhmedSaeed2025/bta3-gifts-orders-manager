import React from "react";
import { Button } from "@/components/ui/button";
import { Receipt, CheckCircle2, AlertCircle, Loader2, Send } from "lucide-react";

interface OrderSummarySidebarProps {
  itemsCount: number;
  subtotal: number;
  shippingCost: number;
  discount: number;
  deposit: number;
  totalAmount: number;
  remainingAmount: number;
  netProfit: number;
  isSubmitting: boolean;
  isEditing: boolean;
  canSubmit: boolean;
  onMarkPaid: () => void;
}

const fmt = (n: number) => `${(n || 0).toFixed(2)} ج.م`;

const OrderSummarySidebar: React.FC<OrderSummarySidebarProps> = ({
  itemsCount,
  subtotal,
  shippingCost,
  discount,
  deposit,
  totalAmount,
  remainingAmount,
  netProfit,
  isSubmitting,
  isEditing,
  canSubmit,
  onMarkPaid,
}) => {
  const isFullyPaid = deposit > 0 && remainingAmount <= 0;

  return (
    <div className="lg:sticky lg:top-4 space-y-3">
      {/* Header */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <div className="flex items-center gap-2 text-primary mb-1">
          <Receipt size={18} />
          <h3 className="font-bold text-sm">ملخص الفاتورة</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          {itemsCount === 0
            ? "أضف أصنافاً ليبدأ الحساب"
            : `${itemsCount} ${itemsCount === 1 ? "صنف" : "أصناف"} في الفاتورة`}
        </p>
      </div>

      {/* Breakdown */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-2.5 text-sm">
        <Row label="المجموع الفرعي" value={fmt(subtotal)} muted />
        <Row label="الشحن" value={fmt(shippingCost)} muted />
        {discount > 0 && (
          <Row label="الخصم" value={`- ${fmt(discount)}`} className="text-orange-600" />
        )}

        <div className="border-t border-border my-2" />

        {/* Total */}
        <div className="flex items-center justify-between bg-primary/10 rounded-lg px-3 py-2.5">
          <span className="font-bold text-sm">الإجمالي</span>
          <span className="font-bold text-base text-primary">{fmt(totalAmount)}</span>
        </div>

        {/* Paid / Remaining */}
        {deposit > 0 && (
          <>
            <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg px-3 py-2">
              <span className="text-xs font-medium text-green-700 dark:text-green-400">
                المدفوع (عربون)
              </span>
              <span className="font-bold text-sm text-green-700 dark:text-green-400">
                {fmt(deposit)}
              </span>
            </div>

            {isFullyPaid ? (
              <div className="flex items-center justify-center gap-1.5 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg px-3 py-2">
                <CheckCircle2 size={14} className="text-green-600" />
                <span className="text-xs font-bold text-green-700 dark:text-green-400">
                  تم السداد بالكامل
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <AlertCircle size={14} className="text-destructive" />
                  <span className="text-xs font-medium text-destructive">المتبقي</span>
                </div>
                <span className="font-bold text-sm text-destructive">{fmt(remainingAmount)}</span>
              </div>
            )}
          </>
        )}

        {/* Mark fully paid */}
        {totalAmount > 0 && !isFullyPaid && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onMarkPaid}
            className="w-full h-8 text-xs gap-1.5 border-green-300 text-green-700 hover:bg-green-50 dark:border-green-900 dark:text-green-400 dark:hover:bg-green-950/30"
          >
            <CheckCircle2 size={14} />
            تسجيل سداد كامل
          </Button>
        )}

        {/* Profit */}
        {itemsCount > 0 && (
          <div className="border-t border-border pt-2.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">صافي الربح المتوقع</span>
            <span className="font-bold text-green-600 dark:text-green-400">{fmt(netProfit)}</span>
          </div>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        form="order-form"
        className="w-full h-11 text-sm font-bold gap-2"
        disabled={!canSubmit || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            {isEditing ? "جاري التحديث..." : "جاري الحفظ..."}
          </>
        ) : (
          <>
            <Send size={18} />
            {isEditing ? "تحديث الطلب" : "حفظ الطلب"}
          </>
        )}
      </Button>
    </div>
  );
};

const Row = ({
  label,
  value,
  muted,
  className = "",
}: {
  label: string;
  value: string;
  muted?: boolean;
  className?: string;
}) => (
  <div className="flex items-center justify-between">
    <span className={`text-xs ${muted ? "text-muted-foreground" : ""}`}>{label}</span>
    <span className={`text-sm font-medium ${className}`}>{value}</span>
  </div>
);

export default OrderSummarySidebar;
