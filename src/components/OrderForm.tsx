import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { OrderItem, Order } from "@/types";
import CustomerDataForm from "./order/CustomerDataForm";
import ImprovedItemAddForm from "./order/ImprovedItemAddForm";
import ItemsTable from "./order/ItemsTable";
import NotesField from "./order/NotesField";
import OrderSummarySidebar from "./order/OrderSummarySidebar";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { toast } from "sonner";

interface OrderFormProps {
  editingOrder?: Order;
}

const phoneRegex = /^01[0-2,5]\d{8}$/;

const OrderForm = ({ editingOrder }: OrderFormProps) => {
  const { addOrder, updateOrder } = useSupabaseOrders();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [customerData, setCustomerData] = useState({
    paymentMethod: editingOrder?.paymentMethod || "",
    clientName: editingOrder?.clientName || "",
    phone: editingOrder?.phone || "",
    phone2: editingOrder?.phone2 || "",
    deliveryMethod: editingOrder?.deliveryMethod || "",
    address: editingOrder?.address || "",
    governorate: editingOrder?.governorate || "",
    shippingCost: editingOrder?.shippingCost || 0,
    deposit: editingOrder?.deposit || 0,
    discount: editingOrder?.discount || 0,
  });

  const [currentItem, setCurrentItem] = useState({
    productType: "",
    size: "",
    quantity: 1,
    cost: 0,
    price: 0,
    itemDiscount: 0,
  });

  const [items, setItems] = useState<OrderItem[]>(editingOrder?.items || []);
  const [notes, setNotes] = useState<string>(editingOrder?.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = items.reduce((sum, item) => {
    const discountedPrice = item.price - (item.itemDiscount || 0);
    return sum + discountedPrice * item.quantity;
  }, 0);

  const totalCost = items.reduce((sum, item) => sum + item.cost * item.quantity, 0);
  const totalAmount = subtotal + customerData.shippingCost - customerData.discount;
  const remainingAmount = Math.max(0, totalAmount - customerData.deposit);
  const netProfit = subtotal - totalCost - customerData.discount;

  const handleCustomerDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setCustomerData(prev => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setCurrentItem(prev => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleCustomerSelectChange = (name: string, value: string) => {
    setCustomerData(prev => ({ ...prev, [name]: value }));
  };

  const handleProductSelectionChange = (selection: {
    categoryId: string; productId: string; productName: string; size: string; cost: number; price: number;
  } | null) => {
    if (selection) {
      setCurrentItem(prev => ({ ...prev, productType: selection.productName, size: selection.size, cost: selection.cost, price: selection.price }));
    } else {
      setCurrentItem(prev => ({ ...prev, productType: "", size: "", cost: 0, price: 0 }));
    }
  };

  const updateItem = (index: number, updatedItem: OrderItem) => {
    const discountedPrice = updatedItem.price - (updatedItem.itemDiscount || 0);
    const profit = (discountedPrice - updatedItem.cost) * updatedItem.quantity;
    setItems(prev => prev.map((item, i) => i === index ? { ...updatedItem, profit } : item));
  };

  const addItem = () => {
    if (!currentItem.productType || !currentItem.size || currentItem.quantity < 1) return;
    const discountedPrice = currentItem.price - (currentItem.itemDiscount || 0);
    const profit = (discountedPrice - currentItem.cost) * currentItem.quantity;
    setItems(prev => [...prev, { ...currentItem, profit, itemDiscount: currentItem.itemDiscount || 0 }]);
    setCurrentItem({ productType: "", size: "", quantity: 1, cost: 0, price: 0, itemDiscount: 0 });
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleMarkPaid = () => {
    setCustomerData(prev => ({ ...prev, deposit: totalAmount }));
    toast.success("تم تسجيل سداد كامل قيمة الفاتورة");
  };

  const canSubmit =
    items.length > 0 &&
    customerData.clientName.trim().length > 0 &&
    phoneRegex.test(customerData.phone);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (items.length === 0) { toast.error("يجب إضافة منتج واحد على الأقل"); return; }
    if (!phoneRegex.test(customerData.phone)) { toast.error("رقم الموبايل غير صحيح"); return; }
    if (customerData.phone2 && !phoneRegex.test(customerData.phone2)) {
      toast.error("الرقم الإضافي غير صحيح");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        ...customerData,
        address: customerData.address || "-",
        governorate: customerData.governorate || "-",
        items, total: totalAmount, remaining_amount: remainingAmount,
        profit: netProfit, status: editingOrder?.status || "pending",
        discount: customerData.discount, notes: notes.trim() || undefined,
      };

      const invalidateAll = () => {
        ['detailed-orders-report','admin-orders','admin-orders-enhanced','orders','orders-invoice','printing-orders','invoice-data','transactions','summary-orders','comprehensive-orders']
          .forEach(k => queryClient.invalidateQueries({ queryKey: [k] }));
      };

      if (editingOrder) {
        await updateOrder(editingOrder.serial, orderData);
        invalidateAll();
        toast.success("تم تحديث الطلب بنجاح");
        const navigationState = location.state as { returnTo?: string; focusSerial?: string } | null;
        if (navigationState?.returnTo === 'orders-report') {
          const focusSerial = navigationState.focusSerial || editingOrder.serial;
          navigate(`/legacy-admin?tab=orders-report&focusSerial=${encodeURIComponent(focusSerial)}`, { replace: true });
        } else { navigate(-1); }
      } else {
        await addOrder(orderData);
        invalidateAll();
        toast.success("تم إضافة الطلب بنجاح");
        setCustomerData({ paymentMethod: "", clientName: "", phone: "", phone2: "", deliveryMethod: "", address: "", governorate: "", shippingCost: 0, deposit: 0, discount: 0 });
        setItems([]);
        setNotes("");
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error("حدث خطأ أثناء حفظ الطلب");
    } finally { setIsSubmitting(false); }
  };

  const steps = [
    { n: 1, label: "بيانات العميل", done: customerData.clientName.trim().length > 0 && phoneRegex.test(customerData.phone) },
    { n: 2, label: "الأصناف", done: items.length > 0 },
    { n: 3, label: "المراجعة", done: items.length > 0 && canSubmit },
    { n: 4, label: "الحفظ", done: false },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
      {/* Main form column */}
      <div className="space-y-4">
        {/* Hero header */}
        <div className="relative overflow-hidden rounded-2xl text-primary-foreground shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-tl from-primary via-primary to-secondary" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.22),transparent_55%)]" />
          <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-white/15 blur-3xl pointer-events-none" />
          <div className="relative p-5 sm:p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-md flex items-center justify-center shadow-sm">
              <FileText size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-extrabold text-lg sm:text-xl tracking-tight">
                {editingOrder ? `تعديل الطلب` : "إنشاء طلب جديد"}
              </h2>
              <p className="text-xs sm:text-sm opacity-90">
                {editingOrder
                  ? <>رقم الفاتورة: <span dir="ltr" className="font-mono">{editingOrder.serial}</span></>
                  : "املأ بيانات العميل والأصناف لإتمام الطلب"}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/25 backdrop-blur-md text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
              مسودة مباشرة
            </div>
          </div>

          {/* Steps bar */}
          <div className="relative px-5 sm:px-6 pb-5 flex items-center gap-2">
            {steps.map((s, idx) => (
              <React.Fragment key={s.n}>
                <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                  s.done
                    ? "bg-white/20 border-white/30"
                    : "bg-white/5 border-white/15 opacity-80"
                }`}>
                  <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    s.done ? "bg-emerald-400 text-emerald-950" : "bg-white/25"
                  }`}>{s.done ? "✓" : s.n}</span>
                  <span>{s.label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex-1 h-px bg-white/20" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 sm:p-6">
            <form id="order-form" onSubmit={handleSubmit} className="space-y-4">
              <SectionWrapper step={1} title="بيانات العميل والتوصيل" subtitle="اسم العميل، رقم التليفون، وطريقة التوصيل">
                <CustomerDataForm
                  customerData={customerData}
                  onCustomerDataChange={handleCustomerDataChange}
                  onSelectChange={handleCustomerSelectChange}
                />
              </SectionWrapper>

              <SectionWrapper step={2} title="إضافة الأصناف" subtitle="ابحث عن المنتج واختر المقاس والكمية">
                <ImprovedItemAddForm
                  currentItem={currentItem}
                  onItemChange={handleItemChange}
                  onProductSelectionChange={handleProductSelectionChange}
                  onAddItem={addItem}
                />
              </SectionWrapper>

              <SectionWrapper step={3} title="الأصناف المضافة" subtitle="راجع الأسعار والكميات قبل الحفظ">
                <ItemsTable
                  items={items}
                  onRemoveItem={removeItem}
                  onUpdateItem={updateItem}
                  subtotal={subtotal}
                  shippingCost={customerData.shippingCost}
                  discount={customerData.discount}
                  deposit={customerData.deposit}
                  totalAmount={totalAmount}
                  remainingAmount={remainingAmount}
                  products={[]}
                  editMode={!!editingOrder}
                  totalCost={totalCost}
                  netProfit={netProfit}
                />
              </SectionWrapper>

              <SectionWrapper step={4} title="ملاحظات" subtitle="أي ملاحظة داخلية أو تعليمات خاصة بالطلب">
                <NotesField notes={notes} onNotesChange={setNotes} />
              </SectionWrapper>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar column */}
      <OrderSummarySidebar
        itemsCount={items.length}
        subtotal={subtotal}
        shippingCost={customerData.shippingCost}
        discount={customerData.discount}
        deposit={customerData.deposit}
        totalAmount={totalAmount}
        remainingAmount={remainingAmount}
        netProfit={netProfit}
        isSubmitting={isSubmitting}
        isEditing={!!editingOrder}
        canSubmit={canSubmit}
        onMarkPaid={handleMarkPaid}
      />
    </div>
  );
};

const SectionWrapper = ({
  step,
  title,
  subtitle,
  children,
}: {
  step: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <div className="group relative bg-gradient-to-br from-card to-muted/20 border border-border/70 rounded-2xl p-4 sm:p-5 hover:border-primary/30 hover:shadow-sm transition-all">
    <div className="flex items-start gap-3 mb-4 pb-3 border-b border-dashed border-border">
      <div className="relative flex-shrink-0">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground flex items-center justify-center text-sm font-extrabold shadow-md">
          {step}
        </div>
        <span className="absolute -inset-1 rounded-2xl bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
      </div>
      <div className="min-w-0">
        <h3 className="font-bold text-sm sm:text-base leading-tight">{title}</h3>
        {subtitle && <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

export default OrderForm;
