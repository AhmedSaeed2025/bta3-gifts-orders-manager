
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { OrderItem, Order } from "@/types";
import CustomerDataForm from "./order/CustomerDataForm";
import ImprovedItemAddForm from "./order/ImprovedItemAddForm";
import ItemsTable from "./order/ItemsTable";
import NotesField from "./order/NotesField";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQueryClient } from "@tanstack/react-query";

interface OrderFormProps {
  editingOrder?: Order;
}

const OrderForm = ({ editingOrder }: OrderFormProps) => {
  const { addOrder, updateOrder } = useSupabaseOrders();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  
  const [customerData, setCustomerData] = useState({
    paymentMethod: editingOrder?.paymentMethod || "",
    clientName: editingOrder?.clientName || "",
    phone: editingOrder?.phone || "",
    deliveryMethod: editingOrder?.deliveryMethod || "",
    address: editingOrder?.address || "",
    governorate: editingOrder?.governorate || "",
    shippingCost: editingOrder?.shippingCost || 0,
    deposit: editingOrder?.deposit || 0,
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
  
  // المجموع الفرعي = مجموع (السعر - الخصم) × الكمية لكل صنف
  const subtotal = items.reduce((sum, item) => {
    const discountedPrice = item.price - (item.itemDiscount || 0);
    return sum + discountedPrice * item.quantity;
  }, 0);
  
  const totalCost = items.reduce((sum, item) => sum + item.cost * item.quantity, 0);
  // الإجمالي الكلي = المجموع الفرعي + الشحن (بدون خصم العربون)
  const totalAmount = subtotal + customerData.shippingCost;
  // المبلغ المتبقي = الإجمالي - العربون
  const remainingAmount = totalAmount - customerData.deposit;
  const netProfit = subtotal - totalCost;

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
    setCustomerData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProductSelectionChange = (selection: {
    categoryId: string;
    productId: string;
    productName: string;
    size: string;
    cost: number;
    price: number;
  } | null) => {
    if (selection) {
      setCurrentItem(prev => ({
        ...prev,
        productType: selection.productName,
        size: selection.size,
        cost: selection.cost,
        price: selection.price
      }));
    } else {
      setCurrentItem(prev => ({
        ...prev,
        productType: "",
        size: "",
        cost: 0,
        price: 0
      }));
    }
  };

  const updateItem = (index: number, updatedItem: OrderItem) => {
    const discountedPrice = updatedItem.price - (updatedItem.itemDiscount || 0);
    const profit = (discountedPrice - updatedItem.cost) * updatedItem.quantity;
    
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...updatedItem, profit } : item
    ));
  };
  
  const addItem = () => {
    if (!currentItem.productType || !currentItem.size || currentItem.quantity < 1) {
      return;
    }
    
    const discountedPrice = currentItem.price - (currentItem.itemDiscount || 0);
    const profit = (discountedPrice - currentItem.cost) * currentItem.quantity;
    
    setItems(prev => [...prev, { 
      ...currentItem, 
      profit,
      itemDiscount: currentItem.itemDiscount || 0
    }]);
    
    setCurrentItem({
      productType: "",
      size: "",
      quantity: 1,
      cost: 0,
      price: 0,
      itemDiscount: 0,
    });
  };
  
  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (items.length === 0) {
      alert("يجب إضافة منتج واحد على الأقل");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const orderData = {
        ...customerData,
        address: customerData.address || "-",
        governorate: customerData.governorate || "-",
        items,
        total: totalAmount,
        remaining_amount: remainingAmount,
        profit: netProfit,
        status: editingOrder?.status || "pending",
        discount: 0,
        notes: notes.trim() || undefined
      };

      if (editingOrder) {
        await updateOrder(editingOrder.serial, orderData);
        queryClient.invalidateQueries({ queryKey: ['detailed-orders-report'] });
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        navigate("/legacy-admin");
      } else {
        await addOrder(orderData);
        queryClient.invalidateQueries({ queryKey: ['detailed-orders-report'] });
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        
        // Reset form
        setCustomerData({
          paymentMethod: "",
          clientName: "",
          phone: "",
          deliveryMethod: "",
          address: "",
          governorate: "",
          shippingCost: 0,
          deposit: 0,
        });
        setItems([]);
        setNotes("");
      }
    } catch (error) {
      console.error('Error submitting order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={isMobile ? "text-sm" : ""}>
      <CardHeader>
        <CardTitle className={`${isMobile ? "text-base" : "text-xl"}`}>
          {editingOrder ? `تعديل الطلب - ${editingOrder.serial}` : "إضافة طلب جديد"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <CustomerDataForm
            customerData={customerData}
            onCustomerDataChange={handleCustomerDataChange}
            onSelectChange={handleCustomerSelectChange}
          />
          
          <ImprovedItemAddForm
            currentItem={currentItem}
            onItemChange={handleItemChange}
            onProductSelectionChange={handleProductSelectionChange}
            onAddItem={addItem}
          />
          
          <ItemsTable
            items={items}
            onRemoveItem={removeItem}
            onUpdateItem={updateItem}
            subtotal={subtotal}
            shippingCost={customerData.shippingCost}
            discount={0}
            deposit={customerData.deposit}
            totalAmount={totalAmount}
            remainingAmount={remainingAmount}
            products={[]}
            editMode={!!editingOrder}
            totalCost={totalCost}
            netProfit={netProfit}
          />

          <NotesField
            notes={notes}
            onNotesChange={setNotes}
          />
          
          <Button 
            type="submit" 
            className={`bg-gift-primary hover:bg-gift-primaryHover ${isMobile ? "text-sm h-8" : ""}`}
            disabled={items.length === 0 || isSubmitting}
          >
            {isSubmitting ? 
              (editingOrder ? "جاري التحديث..." : "جاري الإضافة...") : 
              (editingOrder ? "تحديث الطلب" : "إضافة الطلب")
            }
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default OrderForm;
