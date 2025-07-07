
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/Logo";
import UserProfile from "@/components/UserProfile";
import { ArrowRight, Printer, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import AdminOrderInvoice from "@/components/admin/AdminOrderInvoice";

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
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      if (!user || !serial) {
        console.log('No user or serial, redirecting to legacy-admin');
        navigate("/legacy-admin");
        return;
      }

      try {
        console.log('Loading order with serial:', serial);
        
        // First load the order
        const { data: orderData, error: orderError } = await supabase
          .from('admin_orders')
          .select('*')
          .eq('user_id', user.id)
          .eq('serial', serial)
          .single();

        if (orderError) {
          console.error('Error loading order:', orderError);
          navigate("/legacy-admin");
          return;
        }

        if (!orderData) {
          console.log('No order data found');
          navigate("/legacy-admin");
          return;
        }

        console.log('Order loaded successfully:', orderData);

        // Then load the order items separately
        const { data: itemsData, error: itemsError } = await supabase
          .from('admin_order_items')
          .select('*')
          .eq('order_id', orderData.id)
          .order('created_at', { ascending: true });

        if (itemsError) {
          console.error('Error loading order items:', itemsError);
        }

        console.log('Order items loaded:', itemsData);
        console.log('Items count:', itemsData?.length || 0);

        // Combine order with items
        const completeOrder = {
          ...orderData,
          admin_order_items: itemsData || []
        };

        console.log('Complete order with items:', completeOrder);
        setOrder(completeOrder);
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

  const handleShowInvoice = () => {
    setShowInvoice(true);
  };

  const handleCloseInvoice = () => {
    setShowInvoice(false);
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

  if (showInvoice) {
    return <AdminOrderInvoice order={order} onClose={handleCloseInvoice} />;
  }

  const calculateOrderDetails = () => {
    if (!order.admin_order_items || order.admin_order_items.length === 0) {
      return { orderSubtotal: 0, orderCost: 0, orderNetProfit: 0, orderTotal: 0 };
    }

    const orderSubtotal = order.admin_order_items.reduce((sum, item) => {
      const discountedPrice = item.unit_price - (item.item_discount || 0);
      return sum + (discountedPrice * item.quantity);
    }, 0);

    const orderCost = order.admin_order_items.reduce((sum, item) => {
      return sum + (item.unit_cost * item.quantity);
    }, 0);

    const orderNetProfit = orderSubtotal - orderCost;
    const orderTotal = orderSubtotal + (order.shipping_cost || 0) - (order.discount || 0) - (order.deposit || 0);

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
        
        <div className="mb-4 flex gap-2">
          <Button 
            onClick={handleBackToAccounts}
            variant="outline"
            className="flex items-center gap-2 text-xs md:text-sm h-8 md:h-10"
          >
            <ArrowRight size={16} />
            العودة لبرنامج الحسابات
          </Button>
          <Button 
            onClick={handleShowInvoice}
            className="flex items-center gap-2 text-xs md:text-sm h-8 md:h-10"
          >
            <Eye size={16} />
            عرض الفاتورة
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

              {/* Order Details */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-3">تفاصيل الطلب</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">طريقة الدفع</p>
                      <p className="font-medium">{order.payment_method}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">طريقة التوصيل</p>
                      <p className="font-medium">{order.delivery_method}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">حالة الطلب</p>
                      <p className="font-medium">{order.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">تاريخ الطلب</p>
                      <p className="font-medium">{new Date(order.order_date).toLocaleDateString('ar-EG')}</p>
                    </div>
                  </div>
                  {order.notes && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">ملاحظات</p>
                      <p className="font-medium mt-1">{order.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-3">
                    أصناف الطلب ({order.admin_order_items?.length || 0} صنف)
                  </h3>
                  {!order.admin_order_items || order.admin_order_items.length === 0 ? (
                    <div className="text-center py-8 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-700 font-medium">لا توجد أصناف مسجلة في هذا الطلب</p>
                      <p className="text-yellow-600 text-sm mt-1">قد تحتاج إلى إضافة أصناف لهذا الطلب</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-blue-700 font-medium">تم العثور على {order.admin_order_items.length} صنف في هذا الطلب</p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border border-gray-200 rounded-lg">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-right p-3 border-b font-semibold">#</th>
                              <th className="text-right p-3 border-b font-semibold">الصنف</th>
                              <th className="text-right p-3 border-b font-semibold">المقاس</th>
                              <th className="text-right p-3 border-b font-semibold">الكمية</th>
                              <th className="text-right p-3 border-b font-semibold">السعر</th>
                              <th className="text-right p-3 border-b font-semibold">التكلفة</th>
                              <th className="text-right p-3 border-b font-semibold">الخصم</th>
                              <th className="text-right p-3 border-b font-semibold">الإجمالي</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.admin_order_items.map((item, index) => (
                              <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                <td className="p-3 border-b text-center font-medium">{index + 1}</td>
                                <td className="p-3 border-b font-medium">{item.product_name}</td>
                                <td className="p-3 border-b">{item.product_size}</td>
                                <td className="p-3 border-b text-center font-medium">{item.quantity}</td>
                                <td className="p-3 border-b">{formatCurrency(item.unit_price)}</td>
                                <td className="p-3 border-b">{formatCurrency(item.unit_cost)}</td>
                                <td className="p-3 border-b text-red-600">{formatCurrency(item.item_discount || 0)}</td>
                                <td className="p-3 border-b font-bold text-green-600">{formatCurrency(item.total_price)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Attached Image */}
              {order.attached_image_url && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-3">الصورة المرفقة</h3>
                    <div className="flex justify-center">
                      <img
                        src={order.attached_image_url}
                        alt="الصورة المرفقة مع الطلب"
                        className="max-w-full h-auto max-h-96 rounded-lg border"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderDetails;
