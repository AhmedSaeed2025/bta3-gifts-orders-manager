
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { usePrices } from "@/context/PriceContext";
import { useProducts } from "@/context/ProductContext";
import { OrderItem, Order } from "@/types";
import CustomerDataForm from "./order/CustomerDataForm";
import ItemAddForm from "./order/ItemAddForm";
import ItemsTable from "./order/ItemsTable";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

interface OrderFormProps {
  editingOrder?: Order;
}

const OrderForm = ({ editingOrder }: OrderFormProps) => {
  const { addOrder, updateOrder } = useSupabaseOrders();
  const { getProposedPrice } = usePrices();
  const { products } = useProducts();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const availableProductTypes = [...new Set(products.map(p => p.name))];
  
  const availableSizes = currentItem.productType ? 
    products
      .find(p => p.name === currentItem.productType)?.sizes
      .map(s => s.size) || [] 
    : [];

  const subtotal = items.reduce((sum, item) => {
    const discountedPrice = item.price - (item.itemDiscount || 0);
    return sum + discountedPrice * item.quantity;
  }, 0);
  
  const totalAmount = subtotal + customerData.shippingCost - customerData.deposit;
  
  // Fixed profit calculation: Revenue - Cost - Shipping (العربون لا يؤثر على الربح)
  const totalProfit = items.reduce((sum, item) => {
    const discountedPrice = item.price - (item.itemDiscount || 0);
    return sum + (discountedPrice - item.cost) * item.quantity;
  }, 0) - customerData.shippingCost;

  useEffect(() => {
    if (currentItem.productType && currentItem.size) {
      const selectedProduct = products.find(p => p.name === currentItem.productType);
      const selectedSize = selectedProduct?.sizes.find(s => s.size === currentItem.size);
      
      if (selectedSize) {
        setCurrentItem(prev => ({
          ...prev,
          cost: selectedSize.cost,
          price: selectedSize.price
        }));
      } else {
        const proposedPrice = getProposedPrice(currentItem.productType, currentItem.size);
        
        if (proposedPrice) {
          setCurrentItem(prev => ({
            ...prev,
            cost: proposedPrice.cost,
            price: proposedPrice.price
          }));
        }
      }
    }
  }, [currentItem.productType, currentItem.size, products, getProposedPrice]);

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

  const handleItemSelectChange = (name: string, value: string) => {
    setCurrentItem(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Function to update item in the list
  const updateItem = (index: number, updatedItem: OrderItem) => {
    const discountedPrice = updatedItem.price - (updatedItem.itemDiscount || 0);
    const profit = (discountedPrice - updatedItem.cost) * updatedItem.quantity;
    
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...updatedItem, profit } : item
    ));
  };
  
  const addItem = () => {
    if (!currentItem.productType || !currentItem.size || currentItem.quantity < 1) {
      toast.error("يرجى إكمال بيانات المنتج");
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
      toast.error("يجب إضافة منتج واحد على الأقل");
      return;
    }
    
    if (!customerData.clientName || !customerData.phone) {
      toast.error("يرجى إكمال بيانات العميل");
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
        profit: totalProfit, // Fixed profit calculation
        status: editingOrder?.status || "pending",
        discount: 0 // Always 0 since we removed global discount
      };

      if (editingOrder) {
        await updateOrder(editingOrder.serial, orderData);
        toast.success("تم تحديث الطلب بنجاح");
        navigate("/");
      } else {
        await addOrder(orderData);
        toast.success("تم إضافة الطلب بنجاح");
        
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
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error("حدث خطأ في حفظ الطلب");
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
          
          <ItemAddForm
            currentItem={currentItem}
            availableProductTypes={availableProductTypes}
            availableSizes={availableSizes}
            onItemChange={handleItemChange}
            onSelectChange={handleItemSelectChange}
            onAddItem={addItem}
            products={products}
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
            products={products}
            editMode={!!editingOrder}
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
