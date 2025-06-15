
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Logo from "@/components/Logo";
import UserProfile from "@/components/UserProfile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Info } from "lucide-react";

interface FormData {
  clientName: string;
  phone: string;
  paymentMethod: string;
  deliveryMethod: string;
  address: string;
  governorate: string;
  discount: number;
  deposit: number;
}

const CheckoutPage = () => {
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    clientName: "",
    phone: "",
    paymentMethod: "",
    deliveryMethod: "",
    address: "",
    governorate: "",
    discount: 0,
    deposit: 0
  });

  const [shippingCost, setShippingCost] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shippingMessage, setShippingMessage] = useState("");

  const governorates = [
    "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر", "البحيرة",
    "الفيوم", "الغربية", "الإسماعيلية", "المنوفية", "المنيا", "القليوبية",
    "الوادي الجديد", "السويس", "أسوان", "أسيوط", "بني سويف", "بورسعيد",
    "دمياط", "الشرقية", "جنوب سيناء", "كفر الشيخ", "مطروح", "الأقصر",
    "قنا", "شمال سيناء", "سوهاج"
  ];

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + shippingCost - formData.discount - formData.deposit;

  useEffect(() => {
    if (formData.deliveryMethod === "شحن للمنزل" && formData.governorate) {
      // Check if shipping cost is available for this combination
      const hasShippingRate = false; // This would be a real check in production
      
      if (hasShippingRate) {
        setShippingCost(50); // This would be the actual shipping cost
        setShippingMessage("");
      } else {
        setShippingCost(0);
        setShippingMessage("سيتم تحديد تكلفة الشحن وإبلاغكم بها قبل التأكيد النهائي للطلب");
      }
    } else {
      setShippingCost(0);
      setShippingMessage("");
    }
  }, [formData.deliveryMethod, formData.governorate]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateSerial = async (): Promise<string> => {
    try {
      const { data, error } = await supabase.rpc('generate_serial_number');
      if (error) {
        console.error('Error generating serial:', error);
        // Fallback to manual generation
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
        return `INV-${year}${month}-${random}`;
      }
      return data;
    } catch (error) {
      console.error('Error in generateSerial:', error);
      // Fallback
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      return `INV-${year}${month}-${random}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientName || !formData.phone || !formData.paymentMethod || !formData.deliveryMethod) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (formData.deliveryMethod === "شحن للمنزل" && (!formData.address || !formData.governorate)) {
      toast.error("يرجى ملء عنوان الشحن والمحافظة");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("السلة فارغة");
      return;
    }

    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Starting order submission...');
      const serial = await generateSerial();
      console.log('Generated serial:', serial);
      
      // Save to orders table first
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          serial,
          payment_method: formData.paymentMethod,
          client_name: formData.clientName,
          phone: formData.phone,
          delivery_method: formData.deliveryMethod,
          address: formData.address,
          governorate: formData.governorate,
          shipping_cost: shippingCost,
          discount: formData.discount || 0,
          deposit: formData.deposit || 0,
          total,
          profit: 0, // Will be calculated later
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) {
        console.error('Error inserting order:', orderError);
        throw orderError;
      }

      console.log('Order inserted successfully:', orderData);

      // Insert order items
      const orderItems = cartItems.map(item => ({
        order_id: orderData.id,
        product_type: item.product?.name || 'Unknown Product',
        size: item.size,
        quantity: item.quantity,
        cost: 0,
        price: item.price,
        profit: 0,
        item_discount: 0
      }));

      console.log('Inserting order items:', orderItems);

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error inserting order items:', itemsError);
        throw itemsError;
      }

      console.log('Order items inserted successfully');

      // Save to admin orders table
      try {
        const { data: adminOrder, error: adminOrderError } = await supabase
          .from('admin_orders')
          .insert({
            user_id: user.id,
            serial: serial,
            customer_name: formData.clientName,
            customer_phone: formData.phone,
            customer_email: '',
            shipping_address: formData.address,
            governorate: formData.governorate,
            payment_method: formData.paymentMethod,
            delivery_method: formData.deliveryMethod,
            shipping_cost: shippingCost,
            discount: formData.discount,
            deposit: formData.deposit,
            total_amount: total,
            profit: 0,
            status: 'pending',
            order_date: new Date().toISOString()
          })
          .select()
          .single();

        if (adminOrderError) {
          console.error('Error saving admin order:', adminOrderError);
        } else if (adminOrder) {
          const adminOrderItems = cartItems.map(item => ({
            order_id: adminOrder.id,
            product_name: item.product?.name || 'Unknown Product',
            product_size: item.size,
            quantity: item.quantity,
            unit_cost: 0,
            unit_price: item.price,
            item_discount: 0,
            total_price: item.price * item.quantity,
            profit: 0
          }));

          const { error: adminItemsError } = await supabase
            .from('admin_order_items')
            .insert(adminOrderItems);

          if (adminItemsError) {
            console.error('Error saving admin order items:', adminItemsError);
          }
        }
      } catch (adminError) {
        console.error('Error saving to admin tables:', adminError);
        // Don't throw here, as main order was saved successfully
      }

      await clearCart();
      toast.success("تم إنشاء الطلب بنجاح!");
      navigate("/");
      
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("حدث خطأ في إنشاء الطلب. يرجى المحاولة مرة أخرى");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gift-accent dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-xl font-bold mb-4">السلة فارغة</h2>
          <Button onClick={() => navigate("/")} variant="outline">العودة للتسوق</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gift-accent dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="flex items-center justify-between mb-4">
          <Logo />
          <UserProfile />
        </div>
        
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Order Form */}
          <Card>
            <CardHeader>
              <CardTitle>بيانات الطلب</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Customer Information */}
                <div className="space-y-2">
                  <Label htmlFor="clientName">اسم العميل *</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">طريقة الدفع *</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => handleInputChange('paymentMethod', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر طريقة الدفع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="نقدي عند الاستلام">نقدي عند الاستلام</SelectItem>
                      <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
                      <SelectItem value="فودافون كاش">فودافون كاش</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryMethod">طريقة الاستلام *</Label>
                  <Select value={formData.deliveryMethod} onValueChange={(value) => handleInputChange('deliveryMethod', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر طريقة الاستلام" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="استلام من المحل">استلام من المحل</SelectItem>
                      <SelectItem value="شحن للمنزل">شحن للمنزل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.deliveryMethod === "شحن للمنزل" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="governorate">المحافظة *</Label>
                      <Select value={formData.governorate} onValueChange={(value) => handleInputChange('governorate', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المحافظة" />
                        </SelectTrigger>
                        <SelectContent>
                          {governorates.map((gov) => (
                            <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">العنوان التفصيلي *</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="الشارع، رقم المبنى، الدور..."
                      />
                    </div>

                    {shippingMessage && (
                      <Alert className="border-blue-200 bg-blue-50">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          {shippingMessage}
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discount">الخصم</Label>
                    <Input
                      id="discount"
                      type="number"
                      value={formData.discount}
                      onChange={(e) => handleInputChange('discount', Number(e.target.value))}
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deposit">العربون</Label>
                    <Input
                      id="deposit"
                      type="number"
                      value={formData.deposit}
                      onChange={(e) => handleInputChange('deposit', Number(e.target.value))}
                      min="0"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "جاري إنشاء الطلب..." : "تأكيد الطلب"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>ملخص الطلب</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <p className="font-medium">{item.product?.name || 'Unknown Product'}</p>
                      <p className="text-sm text-gray-600">المقاس: {item.size} | الكمية: {item.quantity}</p>
                    </div>
                    <p className="font-bold">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between">
                    <span>المجموع الفرعي:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  
                  {shippingCost > 0 && (
                    <div className="flex justify-between">
                      <span>مصاريف الشحن:</span>
                      <span>{formatCurrency(shippingCost)}</span>
                    </div>
                  )}
                  
                  {formData.discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>الخصم:</span>
                      <span>-{formatCurrency(formData.discount)}</span>
                    </div>
                  )}
                  
                  {formData.deposit > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span>العربون:</span>
                      <span>-{formatCurrency(formData.deposit)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>المجموع الكلي:</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
