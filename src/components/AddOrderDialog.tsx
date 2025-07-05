
import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Trash2 } from "lucide-react";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { useProducts } from "@/context/ProductContext";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { OrderItem, OrderStatus } from "@/types";

interface AddOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderAdded?: () => void;
}

interface OrderItemWithDetails extends OrderItem {
  id: string;
  categoryName?: string;
}

const AddOrderDialog: React.FC<AddOrderDialogProps> = ({ isOpen, onClose, onOrderAdded }) => {
  const { addOrder } = useSupabaseOrders();
  const { products } = useProducts();

  // Mock categories for now
  const categories = [
    { id: "1", name: "ملابس رجالية", isVisible: true },
    { id: "2", name: "ملابس نسائية", isVisible: true },
    { id: "3", name: "أحذية", isVisible: true },
    { id: "4", name: "إكسسوارات", isVisible: true }
  ];

  const [orderData, setOrderData] = useState({
    clientName: "",
    phone: "",
    paymentMethod: "cash_on_delivery",
    deliveryMethod: "home_delivery",
    address: "",
    governorate: "",
    shippingCost: 0,
    discount: 0,
    deposit: 0,
    status: "pending" as OrderStatus
  });

  const [orderItems, setOrderItems] = useState<OrderItemWithDetails[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [customCost, setCustomCost] = useState<number | null>(null);

  // Get available products based on selected category
  const availableProducts = useMemo(() => {
    if (!selectedCategory) return [];
    return products.filter(product => 
      product.categoryId === selectedCategory && product.isVisible !== false
    );
  }, [products, selectedCategory]);

  // Get available sizes based on selected product
  const availableSizes = useMemo(() => {
    if (!selectedProduct) return [];
    const product = products.find(p => p.id === selectedProduct);
    return product?.sizes || [];
  }, [products, selectedProduct]);

  // Get selected size details
  const selectedSizeDetails = useMemo(() => {
    if (!selectedProduct || !selectedSize) return null;
    const product = products.find(p => p.id === selectedProduct);
    return product?.sizes.find(s => s.size === selectedSize) || null;
  }, [products, selectedProduct, selectedSize]);

  const addItemToOrder = () => {
    if (!selectedCategory || !selectedProduct || !selectedSize || quantity <= 0) {
      toast.error("يرجى إكمال جميع بيانات المنتج");
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    const sizeDetails = selectedSizeDetails;
    const category = categories.find(c => c.id === selectedCategory);

    if (!product || !sizeDetails) {
      toast.error("خطأ في بيانات المنتج");
      return;
    }

    const finalCost = customCost !== null ? customCost : sizeDetails.cost;
    const itemProfit = (sizeDetails.price - finalCost) * quantity;

    const newItem: OrderItemWithDetails = {
      id: Date.now().toString(),
      productType: product.name,
      size: selectedSize,
      quantity,
      cost: finalCost,
      price: sizeDetails.price,
      profit: itemProfit,
      itemDiscount: 0,
      categoryName: category?.name
    };

    setOrderItems([...orderItems, newItem]);
    
    // Reset selection
    setSelectedCategory("");
    setSelectedProduct("");
    setSelectedSize("");
    setQuantity(1);
    setCustomCost(null);
    
    toast.success("تم إضافة المنتج للطلب");
  };

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) return;
    
    setOrderItems(orderItems.map(item => {
      if (item.id === itemId) {
        const updatedProfit = (item.price - item.cost) * newQuantity;
        return { ...item, quantity: newQuantity, profit: updatedProfit };
      }
      return item;
    }));
  };

  const updateItemCost = (itemId: string, newCost: number) => {
    setOrderItems(orderItems.map(item => {
      if (item.id === itemId) {
        const updatedProfit = (item.price - newCost) * item.quantity;
        return { ...item, cost: newCost, profit: updatedProfit };
      }
      return item;
    }));
  };

  const removeItem = (itemId: string) => {
    setOrderItems(orderItems.filter(item => item.id !== itemId));
  };

  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalProfit = orderItems.reduce((sum, item) => sum + item.profit, 0);
  const total = subtotal + orderData.shippingCost - orderData.discount;

  const handleSubmit = async () => {
    if (!orderData.clientName.trim() || !orderData.phone.trim() || orderItems.length === 0) {
      toast.error("يرجى إكمال جميع البيانات المطلوبة");
      return;
    }

    try {
      await addOrder({
        clientName: orderData.clientName,
        phone: orderData.phone,
        paymentMethod: orderData.paymentMethod,
        deliveryMethod: orderData.deliveryMethod,
        address: orderData.address,
        governorate: orderData.governorate,
        items: orderItems.map(item => ({
          productType: item.productType,
          size: item.size,
          quantity: item.quantity,
          cost: item.cost,
          price: item.price,
          profit: item.profit,
          itemDiscount: item.itemDiscount
        })),
        shippingCost: orderData.shippingCost,
        discount: orderData.discount,
        deposit: orderData.deposit,
        total,
        profit: totalProfit,
        status: orderData.status
      });

      // Reset form
      setOrderData({
        clientName: "",
        phone: "",
        paymentMethod: "cash_on_delivery",
        deliveryMethod: "home_delivery",
        address: "",
        governorate: "",
        shippingCost: 0,
        discount: 0,
        deposit: 0,
        status: "pending"
      });
      setOrderItems([]);
      
      // Call onOrderAdded if provided
      if (onOrderAdded) {
        onOrderAdded();
      }
      
      onClose();
    } catch (error) {
      console.error("Error adding order:", error);
    }
  };

  const handleClose = () => {
    setOrderData({
      clientName: "",
      phone: "",
      paymentMethod: "cash_on_delivery",
      deliveryMethod: "home_delivery",
      address: "",
      governorate: "",
      shippingCost: 0,
      discount: 0,
      deposit: 0,
      status: "pending"
    });
    setOrderItems([]);
    setSelectedCategory("");
    setSelectedProduct("");
    setSelectedSize("");
    setQuantity(1);
    setCustomCost(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة طلب جديد</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">بيانات العميل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientName">اسم العميل *</Label>
                  <Input
                    id="clientName"
                    value={orderData.clientName}
                    onChange={(e) => setOrderData({...orderData, clientName: e.target.value})}
                    placeholder="اسم العميل"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">رقم الهاتف *</Label>
                  <Input
                    id="phone"
                    value={orderData.phone}
                    onChange={(e) => setOrderData({...orderData, phone: e.target.value})}
                    placeholder="رقم الهاتف"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentMethod">طريقة الدفع</Label>
                  <Select value={orderData.paymentMethod} onValueChange={(value) => setOrderData({...orderData, paymentMethod: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash_on_delivery">الدفع عند الاستلام</SelectItem>
                      <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                      <SelectItem value="mobile_wallet">محفظة إلكترونية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="deliveryMethod">طريقة التوصيل</Label>
                  <Select value={orderData.deliveryMethod} onValueChange={(value) => setOrderData({...orderData, deliveryMethod: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home_delivery">توصيل منزلي</SelectItem>
                      <SelectItem value="pickup">استلام من المتجر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="address">العنوان</Label>
                <Textarea
                  id="address"
                  value={orderData.address}
                  onChange={(e) => setOrderData({...orderData, address: e.target.value})}
                  placeholder="العنوان التفصيلي"
                />
              </div>

              <div>
                <Label htmlFor="governorate">المحافظة</Label>
                <Input
                  id="governorate"
                  value={orderData.governorate}
                  onChange={(e) => setOrderData({...orderData, governorate: e.target.value})}
                  placeholder="المحافظة"
                />
              </div>
            </CardContent>
          </Card>

          {/* Add Products */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">إضافة المنتجات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label>الفئة</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(cat => cat.isVisible).map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>المنتج</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct} disabled={!selectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المنتج" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>المقاس</Label>
                  <Select value={selectedSize} onValueChange={setSelectedSize} disabled={!selectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المقاس" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSizes.map((size) => (
                        <SelectItem key={size.size} value={size.size}>
                          {size.size} - {formatCurrency(size.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>الكمية</Label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>

                <div>
                  <Label>التكلفة (قابل للتعديل)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={customCost !== null ? customCost : (selectedSizeDetails?.cost || 0)}
                    onChange={(e) => setCustomCost(parseFloat(e.target.value) || 0)}
                    placeholder={selectedSizeDetails ? formatCurrency(selectedSizeDetails.cost) : "التكلفة"}
                  />
                </div>
              </div>

              {selectedSizeDetails && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">التكلفة الأصلية:</span>
                      <div>{formatCurrency(selectedSizeDetails.cost)}</div>
                    </div>
                    <div>
                      <span className="font-medium">السعر:</span>
                      <div>{formatCurrency(selectedSizeDetails.price)}</div>
                    </div>
                    <div>
                      <span className="font-medium">الربح المتوقع:</span>
                      <div className="text-green-600">
                        {formatCurrency((selectedSizeDetails.price - (customCost !== null ? customCost : selectedSizeDetails.cost)) * quantity)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                onClick={addItemToOrder}
                disabled={!selectedCategory || !selectedProduct || !selectedSize}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                إضافة للطلب
              </Button>
            </CardContent>
          </Card>

          {/* Order Items */}
          {orderItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">منتجات الطلب</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{item.productType}</h4>
                          <p className="text-sm text-gray-600">
                            {item.categoryName} - {item.size}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
                        <div>
                          <Label className="text-xs">الكمية</Label>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="mx-2 min-w-[2rem] text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs">التكلفة</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.cost}
                            onChange={(e) => updateItemCost(item.id, parseFloat(e.target.value) || 0)}
                            className="h-8"
                          />
                        </div>

                        <div>
                          <Label className="text-xs">السعر</Label>
                          <div className="text-sm">{formatCurrency(item.price)}</div>
                        </div>

                        <div>
                          <Label className="text-xs">الإجمالي</Label>
                          <div className="text-sm font-medium">
                            {formatCurrency(item.price * item.quantity)}
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs">الربح</Label>
                          <div className="text-sm font-medium text-green-600">
                            {formatCurrency(item.profit)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ملخص الطلب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="shippingCost">تكلفة الشحن</Label>
                  <Input
                    id="shippingCost"
                    type="number"
                    step="0.01"
                    value={orderData.shippingCost}
                    onChange={(e) => setOrderData({...orderData, shippingCost: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="discount">الخصم</Label>
                  <Input
                    id="discount"
                    type="number"
                    step="0.01"
                    value={orderData.discount}
                    onChange={(e) => setOrderData({...orderData, discount: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="deposit">العربون</Label>
                  <Input
                    id="deposit"
                    type="number"
                    step="0.01"
                    value={orderData.deposit}
                    onChange={(e) => setOrderData({...orderData, deposit: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>المجموع الفرعي:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>تكلفة الشحن:</span>
                    <span>{formatCurrency(orderData.shippingCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الخصم:</span>
                    <span>-{formatCurrency(orderData.discount)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>إجمالي الربح:</span>
                    <span className="text-green-600">{formatCurrency(totalProfit)}</span>
                  </div>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>الإجمالي:</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button onClick={handleSubmit} className="flex-1" disabled={orderItems.length === 0}>
              حفظ الطلب
            </Button>
            <Button onClick={handleClose} variant="outline">
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddOrderDialog;
