
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Logo from "@/components/Logo";
import UserProfile from "@/components/UserProfile";
import { CheckCircle, ArrowRight, Phone, Mail } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";

const OrderConfirmationPage = () => {
  const { serial } = useParams<{ serial: string }>();
  const navigate = useNavigate();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-confirmation', serial],
    queryFn: async () => {
      if (!serial) return null;
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('serial', serial)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!serial
  });

  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings-contact'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching store settings:', error);
      }
      
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <h2 className="text-xl font-bold mb-4 mt-4">جاري التحميل...</h2>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-xl font-bold mb-4">الطلب غير موجود</h2>
          <Button onClick={() => navigate("/")} variant="outline">العودة للرئيسية</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="flex items-center justify-between mb-6">
          <Logo />
          <UserProfile />
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Success Message */}
          <Card className="mb-6">
            <CardContent className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-green-700 mb-2">تم إنشاء طلبك بنجاح!</h1>
              <p className="text-muted-foreground mb-4">
                رقم الطلب: <span className="font-bold text-primary">{order.serial}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                سيتم التواصل معك قريباً لتأكيد تفاصيل الطلب وموعد التسليم
              </p>
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>تفاصيل الطلب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">اسم العميل:</p>
                  <p className="text-muted-foreground">{order.client_name}</p>
                </div>
                <div>
                  <p className="font-medium">رقم الهاتف:</p>
                  <p className="text-muted-foreground">{order.phone}</p>
                </div>
                <div>
                  <p className="font-medium">طريقة الدفع:</p>
                  <p className="text-muted-foreground">{order.payment_method}</p>
                </div>
                <div>
                  <p className="font-medium">طريقة الاستلام:</p>
                  <p className="text-muted-foreground">{order.delivery_method}</p>
                </div>
                {order.delivery_method === "شحن للمنزل" && (
                  <>
                    <div className="col-span-2">
                      <p className="font-medium">العنوان:</p>
                      <p className="text-muted-foreground">{order.address}, {order.governorate}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Order Items */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">المنتجات المطلوبة:</h3>
                <div className="space-y-2">
                  {order.order_items?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b">
                      <div>
                        <p className="font-medium">{item.product_type}</p>
                        <p className="text-sm text-muted-foreground">المقاس: {item.size} | الكمية: {item.quantity}</p>
                      </div>
                      <p className="font-bold">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between text-lg font-bold pt-4 border-t">
                  <span>المجموع الكلي:</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>

              {order.notes && (
                <div className="border-t pt-4">
                  <p className="font-medium">ملاحظات:</p>
                  <p className="text-muted-foreground">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>معلومات التواصل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {storeSettings?.contact_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">اتصل بنا</p>
                      <p className="text-muted-foreground">{storeSettings.contact_phone}</p>
                    </div>
                  </div>
                )}
                
                {storeSettings?.whatsapp_number && (
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">W</span>
                    </div>
                    <div>
                      <p className="font-medium">واتساب</p>
                      <p className="text-muted-foreground">{storeSettings.whatsapp_number}</p>
                    </div>
                  </div>
                )}

                {storeSettings?.contact_email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">البريد الإلكتروني</p>
                      <p className="text-muted-foreground">{storeSettings.contact_email}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button onClick={() => navigate("/")} variant="outline" className="flex-1">
              <ArrowRight className="h-4 w-4 mr-2" />
              العودة للمتجر
            </Button>
            <Button 
              onClick={() => navigate(`/track/${order.serial}`)} 
              className="flex-1"
            >
              تتبع الطلب
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
