
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { Loader2, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const CartPage = () => {
  const { cartItems, updateQuantity, removeFromCart, total, loading } = useCart();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h1 className="text-2xl font-bold mb-4">سلة التسوق فارغة</h1>
                <p className="text-muted-foreground mb-6">
                  لم تقم بإضافة أي منتجات إلى سلة التسوق بعد
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">سلة التسوق</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center">
                      {item.product?.product_images?.[0]?.image_url ? (
                        <img
                          src={item.product.product_images[0].image_url}
                          alt={item.product.name}
                          className="w-full h-full object-cover rounded-md"
                        />
                      ) : (
                        <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.product?.name || 'منتج'}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">المقاس: {item.size}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {item.price} ج.م للقطعة
                        </span>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={loading}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={loading}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Total Price */}
                    <div className="text-left">
                      <div className="font-semibold">{item.price * item.quantity} ج.م</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        disabled={loading}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">ملخص الطلب</h2>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>المجموع الفرعي</span>
                    <span>{total} ج.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الشحن</span>
                    <span>سيتم حسابه لاحقاً</span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>الإجمالي</span>
                    <span>{total} ج.م</span>
                  </div>
                </div>

                <Link to="/checkout">
                  <Button className="w-full" size="lg">
                    إتمام الطلب
                  </Button>
                </Link>
                
                <Link to="/">
                  <Button variant="outline" className="w-full mt-2">
                    متابعة التسوق
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
