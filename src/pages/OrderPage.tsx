
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Info, Upload, X, ShoppingCart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const OrderPage = () => {
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    clientName: "",
    phone: "",
    email: "",
    paymentMethod: "",
    deliveryMethod: "",
    address: "",
    governorate: "",
    notes: "",
    attachedImage: null as File | null
  });

  const [shippingCost, setShippingCost] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shippingMessage, setShippingMessage] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch store settings for payment and shipping options
  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings-order'],
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

  const governorates = [
    "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر", "البحيرة",
    "الفيوم", "الغربية", "الإسماعيلية", "المنوفية", "المنيا", "القليوبية",
    "الوادي الجديد", "السويس", "أسوان", "أسيوط", "بني سويف", "بورسعيد",
    "دمياط", "الشرقية", "جنوب سيناء", "كفر الشيخ", "مطروح", "الأقصر",
    "قنا", "شمال سيناء", "سوهاج"
  ];

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + shippingCost;

  // Auto-fill user data if logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        clientName: user.user_metadata?.full_name || "",
        email: user.email || ""
      }));
    }
  }, [user]);

  useEffect(() => {
    if (formData.deliveryMethod === "شحن للمنزل" && formData.governorate) {
      const defaultCost = storeSettings?.default_shipping_cost || 0;
      setShippingCost(defaultCost);
      
      if (storeSettings?.free_shipping_enabled && storeSettings?.free_shipping_threshold && subtotal >= storeSettings.free_shipping_threshold) {
        setShippingCost(0);
        setShippingMessage("شحن مجاني!");
      } else {
        setShippingMessage(`تكلفة الشحن: ${formatCurrency(defaultCost)}`);
      }
    } else {
      setShippingCost(0);
      setShippingMessage("");
    }
  }, [formData.deliveryMethod, formData.governorate, subtotal, storeSettings]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, attachedImage: file }));
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, attachedImage: null }));
    setImagePreview(null);
  };

  const generateSerial = async (): Promise<string> => {
    try {
      const { data, error } = await supabase.rpc('generate_serial_number');
      if (error) {
        console.error('Error generating serial:', error);
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
        return `INV-${year}${month}-${random}`;
      }
      return data;
    } catch (error) {
      console.error('Error in generateSerial:', error);
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      return `INV-${year}${month}-${random}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientName || (!formData.phone && !formData.email) || !formData.paymentMethod || !formData.deliveryMethod) {
      toast.error("يرجى ملء الاسم وطريقة التواصل (هاتف أو إيميل) وطريقة الدفع والاستلام");
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

    setIsSubmitting(true);

    try {
      console.log('Starting order submission...');
      const serial = await generateSerial();
      console.log('Generated serial:', serial);
      
      // Handle image upload if exists
      let attachedImageUrl = null;
      if (formData.attachedImage) {
        try {
          const fileExt = formData.attachedImage.name.split('.').pop();
          const fileName = `${user?.id || 'guest'}/${serial}-${Date.now()}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('order-attachments')
            .upload(fileName, formData.attachedImage);

          if (uploadError) {
            console.error('Error uploading image:', uploadError);
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('order-attachments')
              .getPublicUrl(fileName);
            attachedImageUrl = publicUrl;
          }
        } catch (uploadError) {
          console.error('Error handling image upload:', uploadError);
        }
      }
      
      // Save to orders table
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id,
          serial,
          payment_method: formData.paymentMethod,
          client_name: formData.clientName,
          phone: formData.phone || null,
          email: formData.email || null,
          delivery_method: formData.deliveryMethod,
          address: formData.address,
          governorate: formData.governorate,
          shipping_cost: shippingCost,
          discount: 0,
          deposit: 0,
          total,
          profit: 0,
          status: 'pending',
          notes: formData.notes || null,
          attached_image_url: attachedImageUrl
        })
        .select()
        .single();

      if (orderError) {
        console.error('Error inserting order:', orderError);
        throw orderError;
      }

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

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error inserting order items:', itemsError);
        throw itemsError;
      }

      await clearCart();
      toast.success("تم إنشاء الطلب بنجاح!");
      navigate(`/order-confirmation/${serial}`);
      
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("حدث خطأ في إنشاء الطلب. يرجى المحاولة مرة أخرى");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-4">السلة فارغة</h2>
          <p className="text-muted-foreground mb-6">أضف منتجات إلى السلة للمتابعة</p>
          <Button onClick={() => navigate("/")} variant="outline">العودة للتسوق</Button>
        </div>
      </div>
    );
  }

  // Available payment methods based on store settings
  const availablePaymentMethods = [];
  if (storeSettings?.cash_on_delivery) availablePaymentMethods.push({ value: "نقدي عند الاستلام", label: "نقدي عند الاستلام" });
  if (storeSettings?.bank_transfer) availablePaymentMethods.push({ value: "تحويل بنكي", label: "تحويل بنكي" });
  if (storeSettings?.mobile_wallets) {
    if (storeSettings?.vodafone_cash) availablePaymentMethods.push({ value: "فودافون كاش", label: "فودافون كاش" });
    if (storeSettings?.orange_money) availablePaymentMethods.push({ value: "أورنج موني", label: "أورنج موني" });
    if (storeSettings?.etisalat_flex) availablePaymentMethods.push({ value: "اتصالات فليكس", label: "اتصالات فليكس" });
  }
  if (storeSettings?.credit_cards) availablePaymentMethods.push({ value: "كارت ائتمان", label: "كارت ائتمان" });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="flex items-center justify-between mb-6">
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
                <div className="space-y-2">
                  <Label htmlFor="clientName">الاسم الكامل *</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="اختياري - يمكن استخدام الإيميل بدلاً منه"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="اختياري - يمكن استخدام الهاتف بدلاً منه"
                      disabled={!!user}
                    />
                  </div>
                </div>

                {!formData.phone && !formData.email && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <Info className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      يجب ملء رقم الهاتف أو البريد الإلكتروني على الأقل للتواصل معك
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">طريقة الدفع *</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => handleInputChange('paymentMethod', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر طريقة الدفع" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePaymentMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
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

                <div className="space-y-2">
                  <Label htmlFor="notes">ملاحظات إضافية</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="أي ملاحظات أو متطلبات خاصة..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">إرفاق صورة (اختياري)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('image')?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      اختر صورة
                    </Button>
                    {imagePreview && (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="معاينة الصورة"
                          className="w-16 h-16 object-cover rounded border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={removeImage}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting || availablePaymentMethods.length === 0}
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
                      <p className="text-sm text-muted-foreground">المقاس: {item.size} | الكمية: {item.quantity}</p>
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

export default OrderPage;
