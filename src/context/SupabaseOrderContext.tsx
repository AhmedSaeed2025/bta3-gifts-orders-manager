
import React, { createContext, useContext, useState, useEffect } from "react";
import { Order, OrderStatus, OrderItem, ORDER_STATUS_LABELS } from "@/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Omit<Order, "serial" | "dateCreated">) => Promise<void>;
  updateOrder: (serial: string, order: Omit<Order, "serial" | "dateCreated">) => Promise<void>;
  deleteOrder: (index: number) => Promise<void>;
  updateOrderStatus: (index: number, status: OrderStatus) => Promise<void>;
  getOrderBySerial: (serial: string) => Order | undefined;
  reloadOrders: () => Promise<void>;
  loading: boolean;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const SupabaseOrderProvider = ({ children }: { children: React.ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadOrders = async () => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      console.log('Loading orders from Supabase...');
      
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('user_id', user.id)
        .order('date_created', { ascending: false });

      if (error) {
        console.error('Error loading orders:', error);
        setOrders([]);
        setLoading(false);
        return;
      }

      console.log('Loaded orders data:', ordersData);

      const formattedOrders = ordersData?.map(order => ({
        serial: order.serial,
        paymentMethod: order.payment_method,
        clientName: order.client_name,
        phone: order.phone,
        phone2: order.phone2 || "",
        deliveryMethod: order.delivery_method,
        address: order.address || "",
        governorate: order.governorate || "",
        items: order.order_items?.map((item: any) => ({
          productType: item.product_type,
          size: item.size,
          quantity: item.quantity,
          cost: Number(item.cost),
          price: Number(item.price),
          profit: Number(item.profit),
          itemDiscount: Number(item.item_discount || 0)
        })) || [],
        shippingCost: Number(order.shipping_cost),
        discount: Number(order.discount || 0),
        deposit: Number(order.deposit),
        total: Number(order.total),
        profit: Number(order.profit),
        status: order.status as OrderStatus,
        dateCreated: order.date_created,
        notes: order.notes || undefined,
      })) || [];

      console.log('Formatted orders:', formattedOrders);
      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (user && mounted) {
        await loadOrders();
      } else if (!user) {
        setOrders([]);
        setLoading(false);
      }
    };

    loadData();

    // Listen to real-time changes
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Real-time order change:', payload);
          loadData(); // Reload orders when changes occur
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const generateSerialNumber = async (): Promise<string> => {
    try {
      const { data, error } = await supabase.rpc('generate_serial_number');
      if (error) throw error;
      console.log('Generated serial number:', data);
      return data;
    } catch (error) {
      console.error('Error generating serial number:', error);
      // Fallback to client-side generation
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const currentPrefix = `INV-${year}${month}`;
      let maxSequence = 0;
      
      orders.forEach(order => {
        if (order.serial.startsWith(currentPrefix)) {
          const sequencePart = order.serial.split('-')[2];
          if (sequencePart) {
            const sequenceNum = parseInt(sequencePart);
            if (!isNaN(sequenceNum) && sequenceNum > maxSequence) {
              maxSequence = sequenceNum;
            }
          }
        }
      });
      
      const nextSequence = (maxSequence + 1).toString().padStart(4, '0');
      return `${currentPrefix}-${nextSequence}`;
    }
  };

  const addOrder = async (newOrder: Omit<Order, "serial" | "dateCreated">) => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    try {
      console.log('Adding new order:', newOrder);
      const serial = await generateSerialNumber();
      console.log('Generated serial for new order:', serial);
      
      // Calculate remaining amount properly
      const remainingAmount = (newOrder as any).remaining_amount ?? (newOrder.total - (newOrder.deposit || 0));
      
      // Insert order into the main orders table
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          serial,
          payment_method: newOrder.paymentMethod,
          client_name: newOrder.clientName,
          phone: newOrder.phone,
          phone2: (newOrder as any).phone2 || null,
          email: newOrder.clientName.includes('@') ? newOrder.clientName : null,
          delivery_method: newOrder.deliveryMethod,
          address: newOrder.address,
          governorate: newOrder.governorate,
          shipping_cost: newOrder.shippingCost,
          discount: newOrder.discount || 0,
          deposit: newOrder.deposit,
          total: newOrder.total,
          remaining_amount: remainingAmount,
          profit: newOrder.profit,
          status: newOrder.status,
          notes: typeof (newOrder as any).notes === 'string' ? ((newOrder as any).notes.trim() || null) : null,
        })
        .select()
        .single();

      if (orderError) {
        console.error('Error inserting order:', orderError);
        throw orderError;
      }

      console.log('Order inserted successfully:', orderData);

      // Insert order items
      const orderItems = newOrder.items.map(item => ({
        order_id: orderData.id,
        product_type: item.productType,
        size: item.size,
        quantity: item.quantity,
        cost: item.cost,
        price: item.price,
        profit: item.profit,
        item_discount: item.itemDiscount || 0
      }));

      console.log('Inserting order items:', orderItems);

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error inserting order items:', itemsError);
        throw itemsError;
      }

      // Also insert into admin_orders table for admin dashboard
      const adminRemainingAmount = (newOrder as any).remaining_amount ?? (newOrder.total - (newOrder.deposit || 0));
      
      const { data: adminOrderData, error: adminOrderError } = await supabase
        .from('admin_orders')
        .insert({
          user_id: user.id,
          serial,
          customer_name: newOrder.clientName,
          customer_phone: newOrder.phone,
          customer_phone2: (newOrder as any).phone2 || null,
          customer_email: newOrder.clientName.includes('@') ? newOrder.clientName : null,
          shipping_address: newOrder.address,
          governorate: newOrder.governorate,
          payment_method: newOrder.paymentMethod,
          delivery_method: newOrder.deliveryMethod,
          shipping_cost: newOrder.shippingCost,
          discount: newOrder.discount || 0,
          deposit: newOrder.deposit,
          total_amount: newOrder.total,
          remaining_amount: adminRemainingAmount,
          profit: newOrder.profit,
          status: newOrder.status,
          order_date: new Date().toISOString(),
          notes: typeof (newOrder as any).notes === 'string' ? ((newOrder as any).notes.trim() || null) : null,
        })
        .select()
        .single();

      if (adminOrderError) {
        console.error('Error inserting admin order:', adminOrderError);
        // Don't throw error here, main order is already created
      } else {
        console.log('Admin order inserted successfully:', adminOrderData);

        // Insert admin order items
        const adminOrderItems = newOrder.items.map(item => ({
          order_id: adminOrderData.id,
          product_name: item.productType,
          product_size: item.size,
          quantity: item.quantity,
          unit_cost: item.cost,
          unit_price: item.price,
          item_discount: item.itemDiscount || 0,
          total_price: (item.price - (item.itemDiscount || 0)) * item.quantity,
          profit: ((item.price - (item.itemDiscount || 0)) - item.cost) * item.quantity
        }));

        const { error: adminItemsError } = await supabase
          .from('admin_order_items')
          .insert(adminOrderItems);

        if (adminItemsError) {
          console.error('Error inserting admin order items:', adminItemsError);
        } else {
          console.log('Admin order items inserted successfully');
        }
      }

      // إضافة معاملة العربون إلى كشف الحساب إذا كان موجوداً
      if (newOrder.deposit && newOrder.deposit > 0) {
        const { error: depositTransactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            amount: newOrder.deposit,
            transaction_type: 'income',
            description: `عربون - طلب ${serial} - ${newOrder.clientName}`,
            order_serial: serial
          });

        if (depositTransactionError) {
          console.error('Error adding deposit transaction:', depositTransactionError);
        } else {
          console.log('Deposit transaction added successfully');
        }
      }

      console.log('Order items inserted successfully');
      toast.success("تم إضافة الطلب بنجاح");
      await loadOrders(); // Reload to get the updated list
    } catch (error) {
      console.error('Error adding order:', error);
      toast.error("حدث خطأ في إضافة الطلب");
    }
  };

  const updateOrder = async (serial: string, updatedOrder: Omit<Order, "serial" | "dateCreated">) => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    try {
      console.log('Updating order:', serial, updatedOrder);
      
      // First get the current order data to compare deposit
      const { data: currentOrder, error: fetchCurrentError } = await supabase
        .from('orders')
        .select('id, deposit')
        .eq('serial', serial)
        .eq('user_id', user.id)
        .single();

      if (fetchCurrentError) throw fetchCurrentError;

      const oldDeposit = Number(currentOrder.deposit) || 0;
      const newDeposit = updatedOrder.deposit || 0;

      // Calculate remaining amount properly
      const updateRemainingAmount = (updatedOrder as any).remaining_amount ?? (updatedOrder.total - (updatedOrder.deposit || 0));
      
      // Update the order
      const { data: updatedRow, error: orderError } = await supabase
        .from('orders')
        .update({
          payment_method: updatedOrder.paymentMethod,
          client_name: updatedOrder.clientName,
          phone: updatedOrder.phone,
          phone2: (updatedOrder as any).phone2 || null,
          delivery_method: updatedOrder.deliveryMethod,
          address: updatedOrder.address,
          governorate: updatedOrder.governorate,
          shipping_cost: updatedOrder.shippingCost,
          discount: updatedOrder.discount,
          deposit: updatedOrder.deposit,
          total: updatedOrder.total,
          remaining_amount: updateRemainingAmount,
          profit: updatedOrder.profit,
          status: updatedOrder.status,
          notes: typeof (updatedOrder as any).notes === 'string' ? ((updatedOrder as any).notes.trim() || null) : null,
          updated_at: new Date().toISOString()
        })
        .eq('serial', serial)
        .eq('user_id', user.id)
        .select('serial, notes')
        .single();

      console.log('Order updated row (notes):', updatedRow);

      if (orderError) throw orderError;

      // Delete existing order items
      const { error: deleteItemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', currentOrder.id);

      if (deleteItemsError) throw deleteItemsError;

      // Insert new order items
      const orderItems = updatedOrder.items.map(item => ({
        order_id: currentOrder.id,
        product_type: item.productType,
        size: item.size,
        quantity: item.quantity,
        cost: item.cost,
        price: item.price,
        profit: item.profit,
        item_discount: item.itemDiscount || 0
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Also update admin_orders if it exists
      const adminUpdateRemainingAmount = (updatedOrder as any).remaining_amount ?? (updatedOrder.total - (updatedOrder.deposit || 0));
      
      const { data: adminUpdatedRow, error: adminUpdateError } = await supabase
        .from('admin_orders')
        .update({
          customer_name: updatedOrder.clientName,
          customer_phone: updatedOrder.phone,
          customer_phone2: (updatedOrder as any).phone2 || null,
          shipping_address: updatedOrder.address,
          governorate: updatedOrder.governorate,
          payment_method: updatedOrder.paymentMethod,
          delivery_method: updatedOrder.deliveryMethod,
          shipping_cost: updatedOrder.shippingCost,
          discount: updatedOrder.discount,
          deposit: updatedOrder.deposit,
          total_amount: updatedOrder.total,
          remaining_amount: adminUpdateRemainingAmount,
          profit: updatedOrder.profit,
          status: updatedOrder.status,
          notes: typeof (updatedOrder as any).notes === 'string' ? ((updatedOrder as any).notes.trim() || null) : null,
          updated_at: new Date().toISOString()
        })
        .eq('serial', serial)
        .eq('user_id', user.id)
        .select('serial, notes')
        .single();

      console.log('Admin order updated row (notes):', adminUpdatedRow);

      if (adminUpdateError) {
        console.error('Error updating admin order:', adminUpdateError);
      }

      // تحديث/إضافة/حذف معاملة العربون في كشف الحساب
      if (newDeposit !== oldDeposit) {
        // أولاً: حذف معاملة العربون القديمة للطلب
        const { error: deleteDepositError } = await supabase
          .from('transactions')
          .delete()
          .eq('order_serial', serial)
          .eq('user_id', user.id)
          .ilike('description', '%عربون%');

        if (deleteDepositError) {
          console.error('Error deleting old deposit transaction:', deleteDepositError);
        }

        // إذا كان العربون الجديد أكبر من صفر، أضف معاملة جديدة
        if (newDeposit > 0) {
          const { error: addDepositError } = await supabase
            .from('transactions')
            .insert({
              user_id: user.id,
              amount: newDeposit,
              transaction_type: 'income',
              description: `عربون - طلب ${serial} - ${updatedOrder.clientName}`,
              order_serial: serial
            });

          if (addDepositError) {
            console.error('Error adding deposit transaction:', addDepositError);
          } else {
            console.log('Deposit transaction updated successfully');
          }
        }
      }

      console.log('Order updated successfully');
      toast.success("تم تحديث الطلب بنجاح");
      await loadOrders(); // Reload to get the updated list
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
      console.log('Deleting order:', orderToDelete.serial);
      
      // Delete related transactions first
      const { error: transactionError } = await supabase
        .from('transactions')
        .delete()
        .eq('order_serial', orderToDelete.serial)
        .eq('user_id', user.id);

      if (transactionError) {
        console.error('Error deleting transactions:', transactionError);
      }

      // Delete from orders table
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('serial', orderToDelete.serial)
        .eq('user_id', user.id);

      if (error) throw error;

      // Also delete from admin_orders
      const { error: adminDeleteError } = await supabase
        .from('admin_orders')
        .delete()
        .eq('serial', orderToDelete.serial)
        .eq('user_id', user.id);

      if (adminDeleteError) {
        console.error('Error deleting admin order:', adminDeleteError);
      }

      console.log('Order deleted successfully');
      toast.success("تم حذف الطلب بنجاح");
      await loadOrders(); // Reload to get the updated list
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
      console.log('Updating order status:', orderToUpdate.serial, 'to', status);
      
      // Update orders table
      const { error } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('serial', orderToUpdate.serial)
        .eq('user_id', user.id);

      if (error) throw error;

      // Also update admin_orders
      const { error: adminStatusError } = await supabase
        .from('admin_orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('serial', orderToUpdate.serial)
        .eq('user_id', user.id);

      if (adminStatusError) {
        console.error('Error updating admin order status:', adminStatusError);
      }

      console.log('Order status updated successfully');
      toast.success("تم تحديث حالة الطلب بنجاح");
      await loadOrders(); // Reload to get the updated list
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
      reloadOrders: loadOrders,
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
