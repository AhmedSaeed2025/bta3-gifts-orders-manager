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

      if (editingOrder) {
        await updateOrder(editingOrder.serial, orderData);
        queryClient.invalidateQueries({ queryKey: ['detailed-orders-report'] });
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        queryClient.invalidateQueries({ queryKey: ['invoice-data'] });
        toast.success("تم تحديث الطلب بنجاح");
        const navigationState = location.state as { returnTo?: string; focusSerial?: string } | null;
        if (navigationState?.returnTo === 'orders-report') {
          const focusSerial = navigationState.focusSerial || editingOrder.serial;
          navigate(`/legacy-admin?tab=orders-report&focusSerial=${encodeURIComponent(focusSerial)}`, { replace: true });
        } else { navigate(-1); }
      } else {
        await addOrder(orderData);
        queryClient.invalidateQueries({ queryKey: ['detailed-orders-report'] });
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        queryClient.invalidateQueries({ queryKey: ['invoice-data'] });
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
      {/* Main form column */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg">
                {editingOrder ? `تعديل الطلب - ${editingOrder.serial}` : "طلب جديد"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {editingOrder ? "قم بتعديل بيانات الطلب" : "أدخل بيانات الطلب الجديد"}
              </p>
            </div>
          </div>

          <form id="order-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Step 1: Customer */}
            <SectionWrapper step={1} title="بيانات العميل والتوصيل">
              <CustomerDataForm
                customerData={customerData}
                onCustomerDataChange={handleCustomerDataChange}
                onSelectChange={handleCustomerSelectChange}
              />
            </SectionWrapper>

            {/* Step 2: Add items */}
            <SectionWrapper step={2} title="إضافة الأصناف">
              <ImprovedItemAddForm
                currentItem={currentItem}
                onItemChange={handleItemChange}
                onProductSelectionChange={handleProductSelectionChange}
                onAddItem={addItem}
              />
            </SectionWrapper>

            {/* Step 3: Items list */}
            <SectionWrapper step={3} title="الأصناف المضافة">
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

            {/* Step 4: Notes */}
            <SectionWrapper step={4} title="ملاحظات">
              <NotesField notes={notes} onNotesChange={setNotes} />
            </SectionWrapper>
          </form>
        </CardContent>
      </Card>

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
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-card border border-border rounded-xl p-4">
    <div className="flex items-center gap-2 mb-4">
      <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
        {step}
      </div>
      <h3 className="font-bold text-sm">{title}</h3>
    </div>
    {children}
  </div>
);

export default OrderForm;
