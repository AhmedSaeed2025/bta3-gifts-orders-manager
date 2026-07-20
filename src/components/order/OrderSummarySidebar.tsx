import React from "react";
import { Button } from "@/components/ui/button";
import { Receipt, CheckCircle2, AlertCircle, Loader2, Send, TrendingUp, Package2 } from "lucide-react";

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

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

const OrderSummarySidebar: React.FC<OrderSummarySidebarProps> = ({
  itemsCount, subtotal, shippingCost, discount, deposit,
  totalAmount, remainingAmount, netProfit,
  isSubmitting, isEditing, canSubmit, onMarkPaid,
}) => {
  const isFullyPaid = deposit > 0 && remainingAmount <= 0;
  const payProgress = totalAmount > 0 ? Math.min(100, Math.round((deposit / totalAmount) * 100)) : 0;

  return (
    <div className="lg:sticky lg:top-4 space-y-3">
      {/* Hero card */}
      <div className="relative overflow-hidden rounded-2xl text-primary-foreground shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-secondary" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.25),transparent_60%)]" />
        <div className="absolute -bottom-14 -left-14 w-48 h-48 rounded-full bg-white/15 blur-3xl pointer-events-none" />

        <div className="relative p-4">
          <div className="flex items-center gap-2 mb-1">
            <Receipt size={16} />
            <h3 className="font-bold text-sm">ملخص الفاتورة</h3>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] opacity-90">
            <Package2 size={12} />
            <span>
              {itemsCount === 0 ? "لا توجد أصناف بعد" : `${itemsCount} ${itemsCount === 1 ? "صنف" : "أصناف"}`}
            </span>
          </div>

          {/* Grand total */}
          <div className="mt-4 flex items-end justify-between">
            <span className="text-[11px] opacity-80">الإجمالي المستحق</span>
            <div className="text-left">
              <div className="text-2xl font-extrabold tracking-tight" dir="ltr">
                <span className="font-mono">{fmt(totalAmount)}</span>
                <span className="text-xs font-medium opacity-80 mr-1">EGP</span>
              </div>
            </div>
          </div>

          {/* Payment progress */}
          {totalAmount > 0 && (
            <div className="mt-3">
              <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-300 to-emerald-400 transition-all"
                  style={{ width: `${payProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5 text-[10px] opacity-90">
                <span>مدفوع {payProgress}%</span>
                <span dir="ltr" className="font-mono">{fmt(deposit)} / {fmt(totalAmount)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Breakdown */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-2.5 text-sm shadow-sm">
        <Row label="المجموع الفرعي" value={fmt(subtotal)} />
        <Row label="مصاريف الشحن" value={fmt(shippingCost)} />
        {discount > 0 && <Row label="خصم الفاتورة" value={`- ${fmt(discount)}`} className="text-orange-600" />}

        <div className="border-t border-dashed border-border my-2" />

        {/* Paid / Remaining */}
        {deposit > 0 && (
          <>
            <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl px-3 py-2">
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">المدفوع (عربون)</span>
              <span className="font-bold text-sm text-emerald-700 dark:text-emerald-400 font-mono" dir="ltr">{fmt(deposit)}</span>
            </div>

            {isFullyPaid ? (
              <div className="flex items-center justify-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl px-3 py-2">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">تم السداد بالكامل</span>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-destructive/10 border border-destructive/30 rounded-xl px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <AlertCircle size={14} className="text-destructive" />
                  <span className="text-xs font-medium text-destructive">المتبقي</span>
                </div>
                <span className="font-bold text-sm text-destructive font-mono" dir="ltr">{fmt(remainingAmount)}</span>
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
            className="w-full h-8 text-xs gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
          >
            <CheckCircle2 size={14} />
            تسجيل سداد كامل
          </Button>
        )}

        {/* Profit */}
        {itemsCount > 0 && (
          <div className="border-t border-dashed border-border pt-2.5 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp size={12} />
              صافي الربح المتوقع
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono" dir="ltr">{fmt(netProfit)}</span>
          </div>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        form="order-form"
        className="w-full h-12 text-sm font-bold gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-95 shadow-md rounded-2xl"
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

      {!canSubmit && (
        <p className="text-[11px] text-center text-muted-foreground px-2 leading-relaxed">
          أكمل بيانات العميل ورقم الموبايل، وأضف صنفاً واحداً على الأقل لتفعيل الحفظ.
        </p>
      )}
    </div>
  );
};

const Row = ({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className={`text-sm font-semibold font-mono ${className}`} dir="ltr">{value}</span>
  </div>
);

export default OrderSummarySidebar;
