
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/Logo";
import UserProfile from "@/components/UserProfile";
import { ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface AdminOrder {
  id: string;
  serial: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  shipping_address?: string;
  governorate?: string;
  payment_method: string;
  delivery_method: string;
  shipping_cost: number;
  discount: number;
  deposit: number;
  total_amount: number;
  profit: number;
  status: string;
  order_date: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  attached_image_url?: string;
  admin_order_items: AdminOrderItem[];
}

interface AdminOrderItem {
  id: string;
  product_name: string;
  product_size: string;
  quantity: number;
  unit_cost: number;
  unit_price: number;
  item_discount: number;
  total_price: number;
  profit: number;
}

const OrderDetails = () => {
  const { serial } = useParams<{ serial: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<AdminOrder | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      if (!user || !serial) {
        navigate("/legacy-admin");
        return;
      }

      try {
        const { data: orderData, error } = await supabase
          .from('admin_orders')
          .select(`
            *,
            admin_order_items (*)
          `)
          .eq('user_id', user.id)
          .eq('serial', serial)
          .single();

        if (error || !orderData) {
          console.error('Error loading order:', error);
          navigate("/legacy-admin");
          return;
        }

        setOrder(orderData);
      } catch (error) {
        console.error('Error loading order:', error);
        navigate("/legacy-admin");
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [user, serial, navigate]);

  const handleBackToAccounts = () => {
    navigate("/legacy-admin");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gift-accent dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gift-primary mx-auto"></div>
          <h2 className="text-xl font-bold mb-4 mt-4">جاري التحميل...</h2>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gift-accent dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-xl font-bold mb-4">الطلب غير موجود</h2>
          <Button onClick={handleBackToAccounts} variant="outline">العودة لبرنامج الحسابات</Button>
        </div>
      </div>
    );
  }

  const calculateOrderDetails = () => {
    const orderSubtotal = order.admin_order_items.reduce((sum, item) => {
      const discountedPrice = item.unit_price - (item.item_discount || 0);
      return sum + (discountedPrice * item.quantity);
    }, 0);

    const orderCost = order.admin_order_items.reduce((sum, item) => {
      return sum + (item.unit_cost * item.quantity);
    }, 0);

    const orderNetProfit = orderSubtotal - orderCost;
    const orderTotal = orderSubtotal + (order.shipping_cost || 0) - (order.deposit || 0);

    return { orderSubtotal, orderCost, orderNetProfit, orderTotal };
  };

  const { orderSubtotal, orderCost, orderNetProfit, orderTotal } = calculateOrderDetails();

  return (
    <div className="min-h-screen bg-gift-accent dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="flex items-center justify-between mb-4">
          <Logo />
          <UserProfile />
        </div>
        
        <div className="mb-4">
          <Button 
            onClick={handleBackToAccounts}
            variant="outline"
            className="flex items-center gap-2 text-xs md:text-sm h-8 md:h-10"
          >
            <ArrowRight size={16} />
            العودة لبرنامج الحسابات
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">تفاصيل الطلب - {order.serial}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Order Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(orderSubtotal)}
                    </div>
                    <p className="text-sm text-muted-foreground">المجموع الفرعي</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-lg font-bold text-red-600">
                      {formatCurrency(orderCost)}
                    </div>
                    <p className="text-sm text-muted-foreground">التكلفة</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-lg font-bold text-orange-600">
                      {formatCurrency(order.shipping_cost || 0)}
                    </div>
                    <p className="text-sm text-muted-foreground">مصاريف الشحن</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-lg font-bold text-blue-600">
                      {formatCurrency(order.deposit || 0)}
                    </div>
                    <p className="text-sm text-muted-foreground">العربون</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-lg font-bold text-purple-600">
                      {formatCurrency(orderTotal)}
                    </div>
                    <p className="text-sm text-muted-foreground">الصافي</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-xl font-bold text-emerald-600">
                      {formatCurrency(orderNetProfit)}
                    </div>
                    <p className="text-sm text-muted-foreground">صافي الربح</p>
                  </CardContent>
                </Card>
              </div>

              {/* Customer Information */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-3">معلومات العميل</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">اسم العميل</p>
                      <p className="font-medium">{order.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                      <p className="font-medium">{order.customer_phone}</p>
                    </div>
                    {order.customer_email && (
                      <div>
                        <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                        <p className="font-medium">{order.customer_email}</p>
                      </div>
                    )}
                    {order.shipping_address && (
                      <div>
                        <p className="text-sm text-muted-foreground">عنوان الشحن</p>
                        <p className="font-medium">{order.shipping_address}</p>
                      </div>
                    )}
                    {order.governorate && (
                      <div>
                        <p className="text-sm text-muted-foreground">المحافظة</p>
                        <p className="font-medium">{order.governorate}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-3">أصناف الطلب</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right p-2">الصنف</th>
                          <th className="text-right p-2">المقاس</th>
                          <th className="text-right p-2">الكمية</th>
                          <th className="text-right p-2">السعر</th>
                          <th className="text-right p-2">التكلفة</th>
                          <th className="text-right p-2">الخصم</th>
                          <th className="text-right p-2">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.admin_order_items.map((item) => (
                          <tr key={item.id} className="border-b">
                            <td className="p-2">{item.product_name}</td>
                            <td className="p-2">{item.product_size}</td>
                            <td className="p-2">{item.quantity}</td>
                            <td className="p-2">{formatCurrency(item.unit_price)}</td>
                            <td className="p-2">{formatCurrency(item.unit_cost)}</td>
                            <td className="p-2">{formatCurrency(item.item_discount || 0)}</td>
                            <td className="p-2 font-semibold">{formatCurrency(item.total_price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderDetails;
