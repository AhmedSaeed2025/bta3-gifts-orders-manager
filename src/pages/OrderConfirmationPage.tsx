
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Logo from "@/components/Logo";
import UserProfile from "@/components/UserProfile";
import { CheckCircle, ArrowRight, Phone, Mail, Download, Calendar, MapPin, CreditCard, Truck } from "lucide-react";
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Logo />
          <UserProfile />
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Success Message - Hidden on print */}
          <Card className="mb-6 print:hidden">
            <CardContent className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-green-700 mb-2">تم إنشاء طلبك بنجاح!</h1>
              <p className="text-muted-foreground mb-4">
                رقم الطلب: <span className="font-bold text-primary text-lg">{order.serial}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                سيتم التواصل معك قريباً لتأكيد تفاصيل الطلب وموعد التسليم
              </p>
            </CardContent>
          </Card>

          {/* Invoice */}
          <Card className="print:shadow-none print:border-0">
            <CardHeader className="border-b bg-gray-50 print:bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">فاتورة</CardTitle>
                  <div className="text-lg font-bold text-primary">
                    رقم الطلب: {order.serial}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">تاريخ الطلب</div>
                  <div className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(order.date_created).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="font-bold text-lg mb-4">بيانات العميل</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">الاسم:</span>
                      <span>{order.client_name}</span>
                    </div>
                    {order.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">الهاتف:</span>
                        <span>{order.phone}</span>
                      </div>
                    )}
                    {order.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">البريد الإلكتروني:</span>
                        <span>{order.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-4">تفاصيل التوصيل</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">طريقة الدفع:</span>
                      <span>{order.payment_method}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">طريقة الاستلام:</span>
                      <span>{order.delivery_method}</span>
                    </div>
                    {order.delivery_method === "شحن للمنزل" && order.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                        <div>
                          <div className="font-medium">العنوان:</div>
                          <div className="text-sm text-muted-foreground">
                            {order.address}
                            {order.governorate && `, ${order.governorate}`}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items Table */}
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-4">المنتجات المطلوبة</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-3 text-right">المنتج</th>
                        <th className="border border-gray-300 p-3 text-center">المقاس</th>
                        <th className="border border-gray-300 p-3 text-center">الكمية</th>
                        <th className="border border-gray-300 p-3 text-right">سعر الوحدة</th>
                        <th className="border border-gray-300 p-3 text-right">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.order_items?.map((item: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-3">{item.product_type}</td>
                          <td className="border border-gray-300 p-3 text-center">{item.size}</td>
                          <td className="border border-gray-300 p-3 text-center">{item.quantity}</td>
                          <td className="border border-gray-300 p-3 text-right">{formatCurrency(item.price)}</td>
                          <td className="border border-gray-300 p-3 text-right font-medium">
                            {formatCurrency(item.price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-6">
                <div className="flex justify-end">
                  <div className="w-full max-w-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">المجموع الفرعي:</span>
                      <span>{formatCurrency(order.order_items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0)}</span>
                    </div>
                    
                    {order.shipping_cost > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium">مصاريف الشحن:</span>
                        <span>{formatCurrency(order.shipping_cost)}</span>
                      </div>
                    )}

                    {order.discount > 0 && (
                      <div className="flex justify-between items-center text-green-600">
                        <span className="font-medium">الخصم:</span>
                        <span>- {formatCurrency(order.discount)}</span>
                      </div>
                    )}

                    {order.deposit > 0 && (
                      <div className="flex justify-between items-center text-blue-600">
                        <span className="font-medium">العربون المدفوع:</span>
                        <span>- {formatCurrency(order.deposit)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center text-lg font-bold pt-3 border-t">
                      <span>المجموع الكلي:</span>
                      <span className="text-primary">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {order.notes && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-bold text-lg mb-2">ملاحظات:</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
                  </div>
                </div>
              )}

              {/* Store Contact Information */}
              {(storeSettings?.contact_phone || storeSettings?.whatsapp_number || storeSettings?.contact_email) && (
                <div className="mt-8 pt-6 border-t">
                  <h3 className="font-bold text-lg mb-4">معلومات التواصل</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {storeSettings?.contact_phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">هاتف</p>
                          <p className="text-sm text-muted-foreground">{storeSettings.contact_phone}</p>
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
                          <p className="text-sm text-muted-foreground">{storeSettings.whatsapp_number}</p>
                        </div>
                      </div>
                    )}

                    {storeSettings?.contact_email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">البريد الإلكتروني</p>
                          <p className="text-sm text-muted-foreground">{storeSettings.contact_email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons - Hidden on print */}
          <div className="flex gap-4 mt-6 print:hidden">
            <Button onClick={() => navigate("/")} variant="outline" className="flex-1">
              <ArrowRight className="h-4 w-4 mr-2" />
              العودة للمتجر
            </Button>
            <Button onClick={handlePrint} variant="secondary" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              طباعة الفاتورة
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

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-0 {
            border: 0 !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          @page {
            margin: 1cm;
            size: A4;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderConfirmationPage;
