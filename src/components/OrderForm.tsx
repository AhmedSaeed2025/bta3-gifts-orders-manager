
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { OrderItem, Order } from "@/types";
import CustomerDataForm from "./order/CustomerDataForm";
import ImprovedItemAddForm from "./order/ImprovedItemAddForm";
import ItemsTable from "./order/ItemsTable";
import NotesField from "./order/NotesField";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Send, Loader2 } from "lucide-react";

interface OrderFormProps {
  editingOrder?: Order;
}

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
  const remainingAmount = totalAmount - customerData.deposit;
  const netProfit = subtotal - totalCost - customerData.discount;

  const handleCustomerDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (items.length === 0) { alert("يجب إضافة منتج واحد على الأقل"); return; }
    setIsSubmitting(true);
    try {
      const orderData = {
        ...customerData,
        address: customerData.address || "-",
        governorate: customerData.governorate || "-",
        items, total: totalAmount, remaining_amount: remainingAmount,
        profit: netProfit, status: editingOrder?.status || "pending",
        discount: customerData.discount, notes: notes.trim() || undefined
      };

      if (editingOrder) {
        await updateOrder(editingOrder.serial, orderData);
        queryClient.invalidateQueries({ queryKey: ['detailed-orders-report'] });
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        const navigationState = location.state as { returnTo?: string; focusSerial?: string } | null;
        if (navigationState?.returnTo === 'orders-report') {
          const focusSerial = navigationState.focusSerial || editingOrder.serial;
          navigate(`/legacy-admin?tab=orders-report&focusSerial=${encodeURIComponent(focusSerial)}`, { replace: true });
        } else { navigate(-1); }
      } else {
        await addOrder(orderData);
        queryClient.invalidateQueries({ queryKey: ['detailed-orders-report'] });
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        setCustomerData({ paymentMethod: "", clientName: "", phone: "", phone2: "", deliveryMethod: "", address: "", governorate: "", shippingCost: 0, deposit: 0, discount: 0 });
        setItems([]);
        setNotes("");
      }
    } catch (error) {
      console.error('Error submitting order:', error);
    } finally { setIsSubmitting(false); }
  };

  return (
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Customer Data */}
          <div className="bg-card border border-border rounded-xl p-4">
            <CustomerDataForm
              customerData={customerData}
              onCustomerDataChange={handleCustomerDataChange}
              onSelectChange={handleCustomerSelectChange}
            />
          </div>
          
          {/* Step 2: Add Items */}
          <div className="bg-card border border-border rounded-xl p-4">
            <ImprovedItemAddForm
              currentItem={currentItem}
              onItemChange={handleItemChange}
              onProductSelectionChange={handleProductSelectionChange}
              onAddItem={addItem}
            />
          </div>
          
          {/* Step 3: Items List */}
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

          {/* Step 4: Notes */}
          <div className="bg-card border border-border rounded-xl p-4">
            <NotesField notes={notes} onNotesChange={setNotes} />
          </div>
          
          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full h-11 text-sm font-bold gap-2"
            disabled={items.length === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <><Loader2 size={18} className="animate-spin" /> {editingOrder ? "جاري التحديث..." : "جاري الإضافة..."}</>
            ) : (
              <><Send size={18} /> {editingOrder ? "تحديث الطلب" : "إضافة الطلب"}</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default OrderForm;
