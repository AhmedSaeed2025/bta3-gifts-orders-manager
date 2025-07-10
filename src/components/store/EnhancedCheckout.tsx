
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  ShoppingCart, 
  User, 
  Phone, 
  MapPin, 
  CreditCard, 
  Truck, 
  FileText,
  CheckCircle,
  Loader2
} from 'lucide-react';

const egyptianGovernorates = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة',
  'الفيوم', 'الغربية', 'الإسماعيلية', 'المنيا', 'المنوفية', 'الوادي الجديد',
  'شمال سيناء', 'جنوب سيناء', 'بورسعيد', 'السويس', 'أسوان', 'أسيوط',
  'بني سويف', 'دمياط', 'قنا', 'كفر الشيخ', 'مطروح', 'الأقصر', 'سوهاج'
];

const EnhancedCheckout = () => {
  const { cartItems, clearCart, getTotalPrice } = useCart();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [orderSerial, setOrderSerial] = useState('');

  const [customerData, setCustomerData] = useState({
    customer_name: user?.user_metadata?.full_name || '',
    customer_phone: '',
    customer_email: user?.email || '',
    shipping_address: '',
    governorate: '',
    payment_method: '',
    delivery_method: '',
    notes: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setCustomerData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const required = ['customer_name', 'customer_phone', 'payment_method', 'delivery_method'];
    
    for (const field of required) {
      if (!customerData[field as keyof typeof customerData]) {
        toast.error(`يرجى ملء جميع الحقول المطلوبة`);
        return false;
      }
    }

    if (cartItems.length === 0) {
      toast.error('سلة التسوق فارغة');
      return false;
    }

    return true;
  };

  const submitOrder = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      // Calculate totals
      const subtotal = getTotalPrice();
      const shippingCost = customerData.delivery_method === 'home_delivery' ? 50 : 0;
      const totalAmount = subtotal + shippingCost;

      // Generate order serial
      const serialResponse = await supabase.rpc('generate_serial_number');
      const serial = serialResponse.data;

      // Create admin order
      const orderData = {
        user_id: user?.id || '00000000-0000-0000-0000-000000000000', // Default user for guest orders
        serial: serial,
        customer_name: customerData.customer_name,
        customer_phone: customerData.customer_phone,
        customer_email: customerData.customer_email || null,
        shipping_address: customerData.shipping_address || null,
        governorate: customerData.governorate || null,
        payment_method: customerData.payment_method,
        delivery_method: customerData.delivery_method,
        shipping_cost: shippingCost,
        discount: 0,
        deposit: 0,
        total_amount: totalAmount,
        profit: 0, // Will be calculated from items
        status: 'pending',
        notes: customerData.notes || null
      };

      const { data: order, error: orderError } = await supabase
        .from('admin_orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      let totalProfit = 0;
      const orderItems = cartItems.map(item => {
        const itemProfit = (item.price - (item.product?.product_sizes?.[0]?.cost || 0)) * item.quantity;
        totalProfit += itemProfit;
        
        return {
          order_id: order.id,
          product_name: item.product?.name || 'منتج',
          product_size: item.size,
          quantity: item.quantity,
          unit_cost: item.product?.product_sizes?.[0]?.cost || 0,
          unit_price: item.price,
          item_discount: 0,
          total_price: item.price * item.quantity,
          profit: itemProfit
        };
      });

      const { error: itemsError } = await supabase
        .from('admin_order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update order with total profit
      await supabase
        .from('admin_orders')
        .update({ profit: totalProfit })
        .eq('id', order.id);

      // Clear cart and show success
      clearCart();
      setOrderSerial(serial);
      setOrderSubmitted(true);
      toast.success('تم تسجيل طلبك بنجاح!');

    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error('حدث خطأ في تسجيل الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-600 mb-2">تم تسجيل طلبك بنجاح!</h2>
            <p className="text-gray-600 mb-4">رقم الطلب: <span className="font-mono font-bold">{orderSerial}</span></p>
            <p className="text-sm text-gray-500 mb-6">
              سيتم التواصل معك قريباً لتأكيد الطلب وتحديد موعد التسليم
            </p>
            <Button 
              onClick={() => window.location.href = '/store'} 
              className="w-full"
            >
              العودة للمتجر
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-600 mb-2">سلة التسوق فارغة</h2>
            <p className="text-gray-500 mb-6">أضف بعض المنتجات أولاً</p>
            <Button 
              onClick={() => window.location.href = '/store'} 
              className="w-full"
            >
              تصفح المنتجات
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const shippingCost = customerData.delivery_method === 'home_delivery' ? 50 : 0;
  const totalAmount = subtotal + shippingCost;

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">إتمام الطلب</h1>
          <p className="text-gray-600">املأ البيانات المطلوبة لإتمام طلبك</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  معلومات العميل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer_name">الاسم الكامل *</Label>
                    <Input
                      id="customer_name"
                      value={customerData.customer_name}
                      onChange={(e) => handleInputChange('customer_name', e.target.value)}
                      placeholder="أدخل اسمك الكامل"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_phone">رقم الهاتف *</Label>
                    <Input
                      id="customer_phone"
                      value={customerData.customer_phone}
                      onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                      placeholder="01xxxxxxxxx"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="customer_email">البريد الإلكتروني (اختياري)</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={customerData.customer_email}
                    onChange={(e) => handleInputChange('customer_email', e.target.value)}
                    placeholder="example@email.com"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  معلومات التوصيل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="delivery_method">طريقة التوصيل *</Label>
                  <Select
                    value={customerData.delivery_method}
                    onValueChange={(value) => handleInputChange('delivery_method', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر طريقة التوصيل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home_delivery">توصيل منزلي (+50 ج.م)</SelectItem>
                      <SelectItem value="pickup">استلام من المتجر (مجاني)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {customerData.delivery_method === 'home_delivery' && (
                  <>
                    <div>
                      <Label htmlFor="governorate">المحافظة</Label>
                      <Select
                        value={customerData.governorate}
                        onValueChange={(value) => handleInputChange('governorate', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المحافظة" />
                        </SelectTrigger>
                        <SelectContent>
                          {egyptianGovernorates.map((gov) => (
                            <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="shipping_address">العنوان التفصيلي</Label>
                      <Textarea
                        id="shipping_address"
                        value={customerData.shipping_address}
                        onChange={(e) => handleInputChange('shipping_address', e.target.value)}
                        placeholder="العنوان التفصيلي (الشارع، المنطقة، رقم المبنى...)"
                        rows={3}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  طريقة الدفع
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={customerData.payment_method}
                  onValueChange={(value) => handleInputChange('payment_method', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر طريقة الدفع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash_on_delivery">الدفع عند الاستلام</SelectItem>
                    <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                    <SelectItem value="vodafone_cash">فودافون كاش</SelectItem>
                    <SelectItem value="orange_money">أورانج موني</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  ملاحظات إضافية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={customerData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="أي ملاحظات أو طلبات خاصة..."
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  ملخص الطلب
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={`${item.product_id}-${item.size}`} className="flex justify-between items-center py-2 border-b">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.product?.name}</h4>
                      <div className="text-xs text-gray-500">
                        المقاس: {item.size} • الكمية: {item.quantity}
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
                
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between">
                    <span>المجموع الفرعي:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>الشحن:</span>
                    <span>{formatCurrency(shippingCost)}</span>
                  </div>
                  
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>المجموع الكلي:</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={submitOrder}
              disabled={isSubmitting}
              className="w-full h-12 text-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin ml-2" />
                  جاري تسجيل الطلب...
                </>
              ) : (
                'تأكيد الطلب'
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              بالضغط على "تأكيد الطلب" فإنك توافق على شروط وأحكام المتجر
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCheckout;
