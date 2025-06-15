import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import {
  Home,
  User,
  Mail,
  Phone,
  MapPin,
  ShoppingCart,
  Loader2
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  governorate: string;
  paymentMethod: string;
}

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [formData, setFormData] = useState<FormData>({
    fullName: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    governorate: '',
    paymentMethod: 'cash'
  });

  const [shippingCost, setShippingCost] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateSerialNumber = async (): Promise<string> => {
    try {
      const { data, error } = await supabase.rpc('generate_serial_number');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating serial number:', error);
      // Fallback to client-side generation
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const timestamp = Date.now().toString().slice(-6);
      return `INV-${year}${month}-${timestamp}`;
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/auth');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('السلة فارغة');
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate serial number
      const serial = await generateSerialNumber();
      
      // Calculate totals
      const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const totalAmount = subtotal + shippingCost;

      // Create admin order
      const { data: adminOrder, error: adminOrderError } = await supabase
        .from('admin_orders')
        .insert({
          user_id: user.id,
          serial: serial,
          customer_name: formData.fullName,
          customer_phone: formData.phone,
          customer_email: formData.email || null,
          shipping_address: formData.address,
          governorate: formData.governorate,
          payment_method: formData.paymentMethod,
          delivery_method: 'home_delivery',
          shipping_cost: shippingCost,
          discount: 0,
          deposit: 0,
          total_amount: totalAmount,
          profit: 0, // Will be calculated from items
          status: 'pending'
        })
        .select()
        .single();

      if (adminOrderError) {
        console.error('Error creating admin order:', adminOrderError);
        throw adminOrderError;
      }

      // Create admin order items
      const orderItems = cartItems.map(item => ({
        order_id: adminOrder.id,
        product_name: item.product?.name || 'منتج غير محدد',
        product_size: item.size,
        quantity: item.quantity,
        unit_cost: 0, // You may want to add cost to cart items
        unit_price: item.price,
        item_discount: 0,
        total_price: item.price * item.quantity,
        profit: item.price * item.quantity // Adjust based on actual cost
      }));

      const { error: itemsError } = await supabase
        .from('admin_order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error creating admin order items:', itemsError);
        throw itemsError;
      }

      // Clear cart
      await clearCart();
      
      toast.success('تم إنشاء الطلب بنجاح!');
      navigate('/order-tracking', { 
        state: { 
          orderSerial: serial,
          orderDetails: {
            ...formData,
            serial,
            items: cartItems,
            total: totalAmount,
            status: 'pending'
          }
        }
      });

    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('حدث خطأ أثناء إنشاء الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            <ShoppingCart className="inline-block h-6 w-6 ml-2" />
            إتمام الطلب
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handlePlaceOrder} className="space-y-4">
            {/* Personal Information */}
            <div className="space-y-2">
              <Label htmlFor="fullName">
                <User className="inline-block h-4 w-4 ml-1" />
                الاسم الكامل
              </Label>
              <Input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="أدخل اسمك الكامل"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="inline-block h-4 w-4 ml-1" />
                البريد الإلكتروني
              </Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="أدخل بريدك الإلكتروني"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">
                <Phone className="inline-block h-4 w-4 ml-1" />
                رقم الهاتف
              </Label>
              <Input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="أدخل رقم هاتفك"
                required
              />
            </div>

            {/* Shipping Information */}
            <div className="space-y-2">
              <Label htmlFor="address">
                <Home className="inline-block h-4 w-4 ml-1" />
                العنوان
              </Label>
              <Input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="أدخل عنوان التوصيل"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="governorate">
                <MapPin className="inline-block h-4 w-4 ml-1" />
                المحافظة
              </Label>
              <Select
                name="governorate"
                onValueChange={(value) => setFormData(prev => ({ ...prev, governorate: value }))}
                defaultValue={formData.governorate}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر محافظتك" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cairo">القاهرة</SelectItem>
                  <SelectItem value="Giza">الجيزة</SelectItem>
                  {/* Add more governorates as needed */}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">طريقة الدفع</Label>
              <Select
                name="paymentMethod"
                onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                defaultValue={formData.paymentMethod}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر طريقة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">الدفع عند الاستلام</SelectItem>
                  {/* Add more payment methods as needed */}
                </SelectContent>
              </Select>
            </div>

            {/* Order Summary */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold">ملخص الطلب</h3>
              <ul className="space-y-2 mt-2">
                {cartItems.map(item => (
                  <li key={item.id} className="flex justify-between">
                    <span>
                      {item.product?.name} ({item.size}) × {item.quantity}
                    </span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between font-semibold mt-2">
                <span>المجموع الفرعي:</span>
                <span>{formatCurrency(cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0))}</span>
              </div>
              <div className="flex justify-between font-semibold mt-2">
                <span>تكلفة الشحن:</span>
                <span>{formatCurrency(shippingCost)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold mt-4">
                <span>الإجمالي:</span>
                <span>{formatCurrency(cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + shippingCost)}</span>
              </div>
            </div>

            {/* Place Order Button */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  جاري إنشاء الطلب...
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                </>
              ) : (
                "تأكيد الطلب"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutPage;
