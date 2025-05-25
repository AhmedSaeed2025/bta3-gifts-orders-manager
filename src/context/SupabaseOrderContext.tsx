
import React, { createContext, useContext, useState, useEffect } from "react";
import { Order, OrderStatus, OrderItem } from "@/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Omit<Order, "serial" | "dateCreated">) => Promise<void>;
  updateOrder: (index: number, order: Order) => Promise<void>;
  deleteOrder: (index: number) => Promise<void>;
  updateOrderStatus: (index: number, status: OrderStatus) => Promise<void>;
  getOrderBySerial: (serial: string) => Order | undefined;
  loading: boolean;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const SupabaseOrderProvider = ({ children }: { children: React.ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load orders from Supabase
  const loadOrders = async () => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('date_created', { ascending: false });

      if (error) throw error;

      const formattedOrders = ordersData?.map(order => ({
        serial: order.serial,
        paymentMethod: order.payment_method,
        clientName: order.client_name,
        phone: order.phone,
        deliveryMethod: order.delivery_method,
        address: order.address || "",
        governorate: order.governorate || "",
        items: order.order_items.map((item: any) => ({
          productType: item.product_type,
          size: item.size,
          quantity: item.quantity,
          cost: parseFloat(item.cost),
          price: parseFloat(item.price),
          profit: parseFloat(item.profit)
        })),
        shippingCost: parseFloat(order.shipping_cost),
        discount: parseFloat(order.discount),
        deposit: parseFloat(order.deposit),
        total: parseFloat(order.total),
        profit: parseFloat(order.profit),
        status: order.status as OrderStatus,
        dateCreated: order.date_created
      })) || [];

      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error("حدث خطأ في تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [user]);

  // Generate serial number
  const generateSerial = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${timestamp}${random}`;
  };

  const addOrder = async (newOrder: Omit<Order, "serial" | "dateCreated">) => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    try {
      const serial = generateSerial();
      
      // Insert order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          serial,
          payment_method: newOrder.paymentMethod,
          client_name: newOrder.clientName,
          phone: newOrder.phone,
          delivery_method: newOrder.deliveryMethod,
          address: newOrder.address,
          governorate: newOrder.governorate,
          shipping_cost: newOrder.shippingCost,
          discount: newOrder.discount,
          deposit: newOrder.deposit,
          total: newOrder.total,
          profit: newOrder.profit,
          status: newOrder.status
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      const orderItems = newOrder.items.map(item => ({
        order_id: orderData.id,
        product_type: item.productType,
        size: item.size,
        quantity: item.quantity,
        cost: item.cost,
        price: item.price,
        profit: item.profit
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast.success("تم إضافة الطلب بنجاح");
      await loadOrders();
    } catch (error) {
      console.error('Error adding order:', error);
      toast.error("حدث خطأ في إضافة الطلب");
    }
  };

  const updateOrder = async (index: number, updatedOrder: Order) => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    try {
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          payment_method: updatedOrder.paymentMethod,
          client_name: updatedOrder.clientName,
          phone: updatedOrder.phone,
          delivery_method: updatedOrder.deliveryMethod,
          address: updatedOrder.address,
          governorate: updatedOrder.governorate,
          shipping_cost: updatedOrder.shippingCost,
          discount: updatedOrder.discount,
          deposit: updatedOrder.deposit,
          total: updatedOrder.total,
          profit: updatedOrder.profit,
          status: updatedOrder.status
        })
        .eq('serial', updatedOrder.serial);

      if (orderError) throw orderError;

      toast.success("تم تحديث الطلب بنجاح");
      await loadOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error("حدث خطأ في تحديث الطلب");
    }
  };

  const deleteOrder = async (index: number) => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    try {
      const orderToDelete = orders[index];
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('serial', orderToDelete.serial);

      if (error) throw error;

      toast.success("تم حذف الطلب بنجاح");
      await loadOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error("حدث خطأ في حذف الطلب");
    }
  };

  const updateOrderStatus = async (index: number, status: OrderStatus) => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    try {
      const orderToUpdate = orders[index];
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('serial', orderToUpdate.serial);

      if (error) throw error;

      toast.success("تم تحديث حالة الطلب بنجاح");
      await loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error("حدث خطأ في تحديث حالة الطلب");
    }
  };

  const getOrderBySerial = (serial: string) => {
    return orders.find(order => order.serial === serial);
  };

  return (
    <OrderContext.Provider value={{ 
      orders, 
      addOrder, 
      updateOrder, 
      deleteOrder, 
      updateOrderStatus, 
      getOrderBySerial,
      loading
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useSupabaseOrders = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error("useSupabaseOrders must be used within a SupabaseOrderProvider");
  }
  return context;
};
