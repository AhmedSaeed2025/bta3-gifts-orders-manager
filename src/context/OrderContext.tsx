
import React, { createContext, useContext, useState, useEffect } from "react";
import { Order, OrderStatus, OrderItem, ORDER_STATUS_LABELS } from "@/types";
import { toast } from "sonner";

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Omit<Order, "serial" | "dateCreated">) => void;
  updateOrder: (index: number, order: Order) => void;
  deleteOrder: (index: number) => void;
  updateOrderStatus: (index: number, status: OrderStatus) => void;
  getOrderBySerial: (serial: string) => Order | undefined;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: React.ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastSerialNumber, setLastSerialNumber] = useState<number>(1000);

  // Load orders from local storage
  useEffect(() => {
    const savedOrders = localStorage.getItem("orders");
    const savedLastSerial = localStorage.getItem("lastSerialNumber");
    
    if (savedOrders) {
      try {
        setOrders(JSON.parse(savedOrders));
      } catch (e) {
        console.error("Error parsing orders from localStorage", e);
        setOrders([]);
      }
    }
    
    if (savedLastSerial) {
      try {
        setLastSerialNumber(Number(savedLastSerial));
      } catch (e) {
        console.error("Error parsing lastSerialNumber from localStorage", e);
        setLastSerialNumber(1000);
      }
    }
  }, []);

  // Save orders to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem("orders", JSON.stringify(orders));
  }, [orders]);

  // Save last serial number to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem("lastSerialNumber", lastSerialNumber.toString());
  }, [lastSerialNumber]);

  const addOrder = (newOrder: Omit<Order, "serial" | "dateCreated">) => {
    // Generate new serial number
    const nextSerialNumber = lastSerialNumber + 1;
    setLastSerialNumber(nextSerialNumber);
    
    // Generate serial number string
    const serial = nextSerialNumber.toString();
    
    // Ensure deposit is set, even if not provided
    const orderWithDeposit = { ...newOrder, deposit: newOrder.deposit || 0 };
    
    const orderWithSerial = {
      ...orderWithDeposit,
      serial,
      dateCreated: new Date().toISOString(),
    };
    
    setOrders(prevOrders => [...prevOrders, orderWithSerial]);
    toast.success("تم إضافة الطلب بنجاح");
  };

  const updateOrder = (index: number, updatedOrder: Order) => {
    // Calculate new total based on updated fields
    const items = updatedOrder.items || [];
    let subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Recalculate total based on updated values
    const total = subtotal + (updatedOrder.shippingCost || 0) - (updatedOrder.discount || 0) - (updatedOrder.deposit || 0);
    
    // Create final updated order with recalculated total
    const finalUpdatedOrder = {
      ...updatedOrder,
      total: Math.max(0, total) // Ensure total is not negative
    };
    
    setOrders(prevOrders => {
      const newOrders = [...prevOrders];
      newOrders[index] = finalUpdatedOrder;
      return newOrders;
    });
    
    toast.success("تم تحديث الطلب بنجاح");
  };

  const deleteOrder = (index: number) => {
    setOrders(prevOrders => prevOrders.filter((_, i) => i !== index));
    toast.success("تم حذف الطلب بنجاح");
  };

  const updateOrderStatus = (index: number, status: OrderStatus) => {
    setOrders(prevOrders => {
      const newOrders = [...prevOrders];
      newOrders[index] = { ...newOrders[index], status };
      return newOrders;
    });
    
    const statusLabel = ORDER_STATUS_LABELS[status] || status;
    toast.success(`تم تحديث حالة الطلب إلى: ${statusLabel}`);
  };

  const getOrderBySerial = (serial: string) => {
    return orders.find(order => order.serial === serial);
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateOrder, deleteOrder, updateOrderStatus, getOrderBySerial }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error("useOrders must be used within an OrderProvider");
  }
  return context;
};
