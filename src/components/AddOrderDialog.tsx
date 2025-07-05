
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { useProducts } from "@/context/ProductContext";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface OrderItem {
  productType: string;
  size: string;
  quantity: number;
  cost: number;
  price: number;
  profit: number;
  itemDiscount?: number;
}

interface AddOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderAdded: () => void;
}

const AddOrderDialog: React.FC<AddOrderDialogProps> = ({ isOpen, onClose, onOrderAdded }) => {
  const { addOrder } = useSupabaseOrders();
  const { products } = useProducts();
  
  // Mock categories for now
  const categories = [
    { id: "1", name: "ملابس رجالية" },
    { id: "2", name: "ملابس نسائية" },
    { id: "3", name: "أحذية" },
    { id: "4", name: "إكسسوارات" }
  ];
  
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState({
    clientName: "",
    phone: "",
    address: "",
    governorate: "",
    paymentMethod: "cash",
    deliveryMethod: "delivery",
    shippingCost: 0,
    discount: 0,
    deposit: 0
  });
  
  const [items, setItems] = useState<OrderItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    categoryId: "",
    productType: "",
    size: "",
    quantity: 1,
    itemDiscount: 0
  });

  // Get products for selected category
  const getProductsForCategory = (categoryId: string) => {
    // For now, return all products since we don't have category mapping yet
    return products;
  };

  // Get available sizes for selected product
  const getAvailableSizes = (productName: string) => {
    const product = products.find(p => p.name === productName);
    return product ? product.sizes : [];
  };

  // Get cost and price for selected product and size
  const getProductPricing = (productName: string, size: string) => {
    const product = products.find(p => p.name === productName);
    if (!product) return { cost: 0, price: 0 };
    
    const sizeInfo = product.sizes.find(s => s.size === size);
    return sizeInfo ? { cost: sizeInfo.cost, price: sizeInfo.price } : { cost: 0, price: 0 };
  };

  const addItem = () => {
    if (!currentItem.categoryId || !currentItem.productType || !currentItem.size || currentItem.quantity < 1) {
      toast.error("يرجى اختيار الفئة والمنتج والمقاس والكمية");
      return;
    }

    const pricing = getProductPricing(currentItem.productType, currentItem.size);
    const discountedPrice = pricing.price - (currentItem.itemDiscount || 0);
    const profit = (discountedPrice - pricing.cost) * currentItem.quantity;

    const newItem: OrderItem = {
      productType: currentItem.productType,
      size: currentItem.size,
      quantity: currentItem.quantity,
      cost: pricing.cost,
      price: pricing.price,
      profit: profit,
      itemDiscount: currentItem.itemDiscount || 0
    };

    setItems([...items, newItem]);
    setCurrentItem({
      categoryId: "",
      productType: "",
      size: "",
      quantity: 1,
      itemDiscount: 0
    });
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = items.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalculate profit when quantity or discount changes
        if (field === 'quantity' || field === 'itemDiscount') {
          const discountedPrice = updatedItem.price - (updatedItem.itemDiscount || 0);
          updatedItem.profit = (discountedPrice - updatedItem.cost) * updatedItem.quantity;
        }
        
        return updatedItem;
      }
      return item;
    });
    setItems(updatedItems);
  };

  const calculateTotals = () => {
    const itemsTotal = items.reduce((sum, item) => 
      sum + ((item.price - (item.itemDiscount || 0)) * item.quantity), 0
    );
    const totalProfit = items.reduce((sum, item) => sum + item.profit, 0);
    const total = itemsTotal + orderData.shippingCost - orderData.discount;
    
    return { itemsTotal, totalProfit, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderData.clientName.trim() || !orderData.phone.trim()) {
      toast.error("يرجى إدخال اسم العميل ورقم الهاتف");
      return;
    }
    
    if (items.length === 0) {
      toast.error("يرجى إضافة منتج واحد على الأقل");
      return;
    }
    
    setLoading(true);
    
    try {
      const { total, totalProfit } = calculateTotals();
      
      await addOrder({
        ...orderData,
        items,
        total,
        profit: totalProfit,
        status: "pending"
      });
      
      // Reset form
      setOrderData({
        clientName: "",
        phone: "",
        address: "",
        governorate: "",
        paymentMethod: "cash",
        deliveryMethod: "delivery",
        shippingCost: 0,
        discount: 0,
        deposit: 0
      });
      
      setItems([]);
      setCurrentItem({
        categoryId: "",
        productType: "",
        size: "",
        quantity: 1,
        itemDiscount: 0
      });
      
      onOrderAdded();
      onClose();
    } catch (error) {
      console.error("Error adding order:", error);
    } finally {
      setLoading(false);
    }
  };

  const { total } = calculateTotals();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة طلب جديد</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Data */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-lg">بيانات العميل</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientName">اسم العميل *</Label>
                  <Input
                    id="clientName"
                    value={orderData.clientName}
                    onChange={(e) => setOrderData({...orderData, clientName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">رقم الهاتف *</Label>
                  <Input
                    id="phone"
                    value={orderData.phone}
                    onChange={(e) => setOrderData({...orderData, phone: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="governorate">المحافظة</Label>
                  <Input
                    id="governorate"
                    value={orderData.governorate}
                    onChange={(e) => setOrderData({...orderData, governorate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="address">العنوان</Label>
                  <Textarea
                    id="address"
                    value={orderData.address}
                    onChange={(e) => setOrderData({...orderData, address: e.target.value})}
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Items */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-lg">إضافة منتج</h3>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                  <Label>الفئة</Label>
                  <Select 
                    value={currentItem.categoryId} 
                    onValueChange={(value) => setCurrentItem({...currentItem, categoryId: value, productType: "", size: ""})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>المنتج</Label>
                  <Select 
                    value={currentItem.productType} 
                    onValueChange={(value) => setCurrentItem({...currentItem, productType: value, size: ""})}
                    disabled={!currentItem.categoryId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المنتج" />
                    </SelectTrigger>
                    <SelectContent>
                      {getProductsForCategory(currentItem.categoryId).map((product) => (
                        <SelectItem key={product.id} value={product.name}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>المقاس</Label>
                  <Select 
                    value={currentItem.size} 
                    onValueChange={(value) => setCurrentItem({...currentItem, size: value})}
                    disabled={!currentItem.productType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المقاس" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableSizes(currentItem.productType).map((size) => (
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
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem({...currentItem, quantity: parseInt(e.target.value) || 1})}
                  />
                </div>
                
                <div>
                  <Label>خصم المنتج</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={currentItem.itemDiscount}
                    onChange={(e) => setCurrentItem({...currentItem, itemDiscount: parseFloat(e.target.value) || 0})}
                  />
                </div>
                
                <div className="flex items-end">
                  <Button type="button" onClick={addItem} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    إضافة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items List */}
          {items.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-4">المنتجات المضافة</h3>
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-6 gap-4 items-center">
                        <div>
                          <span className="text-sm font-medium">{item.productType}</span>
                        </div>
                        <div>
                          <span className="text-sm">{item.size}</span>
                        </div>
                        <div>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.itemDiscount || 0}
                            onChange={(e) => updateItem(index, 'itemDiscount', parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm"
                            placeholder="خصم"
                          />
                        </div>
                        <div>
                          <span className="text-sm font-medium">
                            {formatCurrency((item.price - (item.itemDiscount || 0)) * item.quantity)}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-green-600 font-medium">
                            {formatCurrency(item.profit)}
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Details */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-lg">تفاصيل الطلب</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="paymentMethod">طريقة الدفع</Label>
                  <Select value={orderData.paymentMethod} onValueChange={(value) => setOrderData({...orderData, paymentMethod: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">نقدي</SelectItem>
                      <SelectItem value="installment">تقسيط</SelectItem>
                      <SelectItem value="bank_transfer">حوالة بنكية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="deliveryMethod">طريقة التسليم</Label>
                  <Select value={orderData.deliveryMethod} onValueChange={(value) => setOrderData({...orderData, deliveryMethod: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delivery">توصيل</SelectItem>
                      <SelectItem value="pickup">استلام</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                <div>
                  <Label>إجمالي الطلب</Label>
                  <Input
                    value={formatCurrency(total)}
                    disabled
                    className="bg-gray-50 font-bold text-lg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading || items.length === 0} className="flex-1">
              {loading ? "جاري الحفظ..." : "حفظ الطلب"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddOrderDialog;
