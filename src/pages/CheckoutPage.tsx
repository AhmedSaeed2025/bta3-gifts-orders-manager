import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';

interface CheckoutForm {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  governorate: string;
  notes?: string;
}

const CheckoutPage = () => {
  const { cartItems, total, clearCart, loading: cartLoading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<CheckoutForm>();

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">السلة فارغة</h1>
                <p className="text-muted-foreground mb-6">
                  يجب إضافة منتجات إلى السلة أولاً
                </p>
                <Link to="/">
                  <Button>تصفح المنتجات</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: CheckoutForm) => {
    setSubmitting(true);
    try {
      console.log('Creating order with data:', { ...data, cartItems, total });

      // Create the order in database
      const orderData = {
        user_id: user?.id || null,
        client_name: data.fullName,
        phone: data.phone,
        address: data.address,
        governorate: data.governorate,
        payment_method: 'نقدي عند الاستلام',
        delivery_method: 'شحن للمنزل',
        shipping_cost: 30,
        discount: 0,
        deposit: 0,
        total: total + 30, // Add shipping cost
        profit: 0, // Will be calculated based on product costs
        status: 'pending'
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        throw orderError;
      }

      console.log('Order created successfully:', order);

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_type: item.product?.name || 'منتج',
        size: item.size,
        quantity: item.quantity,
        price: item.price,
        cost: 0, // Default cost, should be updated from product data
        profit: item.price, // Simplified profit calculation
        item_discount: 0
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        throw itemsError;
      }

      console.log('Order items created successfully');

      // Clear the cart
      await clearCart();
      
      toast.success(`تم إنشاء طلبك بنجاح! رقم الطلب: ${order.serial}`);
      navigate('/');
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error('حدث خطأ في إرسال الطلب. يرجى المحاولة مرة أخرى');
    } finally {
      setSubmitting(false);
    }
  };

  const shippingCost = 30; // رسوم شحن ثابتة
  const finalTotal = total + shippingCost;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link to="/cart" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            العودة للسلة
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8">إتمام الطلب</h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Customer Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>بيانات العميل</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">الاسم الكامل *</Label>
                      <Input
                        id="fullName"
                        {...register('fullName', { required: 'الاسم مطلوب' })}
                        defaultValue={user?.user_metadata?.full_name || ''}
                      />
                      {errors.fullName && (
                        <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="phone">رقم الهاتف *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        {...register('phone', { 
                          required: 'رقم الهاتف مطلوب',
                          pattern: {
                            value: /^[0-9+\-\s()]+$/,
                            message: 'رقم هاتف غير صحيح'
                          }
                        })}
                      />
                      {errors.phone && (
                        <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      defaultValue={user?.email || ''}
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">العنوان التفصيلي *</Label>
                    <Input
                      id="address"
                      {...register('address', { required: 'العنوان مطلوب' })}
                      placeholder="الشارع، رقم المبنى، الدور، الشقة"
                    />
                    {errors.address && (
                      <p className="text-sm text-destructive mt-1">{errors.address.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">المدينة *</Label>
                      <Input
                        id="city"
                        {...register('city', { required: 'المدينة مطلوبة' })}
                      />
                      {errors.city && (
                        <p className="text-sm text-destructive mt-1">{errors.city.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="governorate">المحافظة *</Label>
                      <Input
                        id="governorate"
                        {...register('governorate', { required: 'المحافظة مطلوبة' })}
                      />
                      {errors.governorate && (
                        <p className="text-sm text-destructive mt-1">{errors.governorate.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">ملاحظات إضافية</Label>
                    <Input
                      id="notes"
                      {...register('notes')}
                      placeholder="أي تعليقات أو طلبات خاصة"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>ملخص الطلب</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Cart Items */}
                    <div className="space-y-3">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-start text-sm">
                          <div className="flex-1">
                            <div className="font-medium">{item.product?.name || 'منتج'}</div>
                            <div className="text-muted-foreground">
                              {item.size} × {item.quantity}
                            </div>
                          </div>
                          <div className="font-medium">
                            {item.price * item.quantity} ج.م
                          </div>
                        </div>
                      ))}
                    </div>

                    <hr />

                    {/* Totals */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>المجموع الفرعي</span>
                        <span>{total} ج.م</span>
                      </div>
                      <div className="flex justify-between">
                        <span>رسوم الشحن</span>
                        <span>{shippingCost} ج.م</span>
                      </div>
                      <hr />
                      <div className="flex justify-between font-semibold text-lg">
                        <span>الإجمالي</span>
                        <span>{finalTotal} ج.م</span>
                      </div>
                    </div>

                    <Badge variant="outline" className="w-full justify-center">
                      الدفع عند الاستلام
                    </Badge>

                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={submitting || cartLoading}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          جاري إرسال الطلب...
                        </>
                      ) : (
                        'تأكيد الطلب'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;
