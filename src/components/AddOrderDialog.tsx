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
  
  const [items, setItems] = useState<OrderItem[]>([
    {
      productType: "",
      size: "",
      quantity: 1,
      cost: 0,
      price: 0,
      profit: 0,
      itemDiscount: 0
    }
  ]);

  const addItem = () => {
    setItems([...items, {
      productType: "",
      size: "",
      quantity: 1,
      cost: 0,
      price: 0,
      profit: 0,
      itemDiscount: 0
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = items.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };
        
        // Auto-calculate profit when cost or price changes
        if (field === 'cost' || field === 'price' || field === 'quantity' || field === 'itemDiscount') {
          const cost = field === 'cost' ? parseFloat(value) : updatedItem.cost;
          const price = field === 'price' ? parseFloat(value) : updatedItem.price;
          const quantity = field === 'quantity' ? parseInt(value) : updatedItem.quantity;
          const discount = field === 'itemDiscount' ? parseFloat(value) : (updatedItem.itemDiscount || 0);
          
          updatedItem.profit = ((price - discount) - cost) * quantity;
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
    
    if (items.some(item => !item.productType.trim() || !item.size.trim())) {
      toast.error("يرجى إدخال جميع بيانات الأصناف");
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
      
      setItems([{
        productType: "",
        size: "",
        quantity: 1,
        cost: 0,
        price: 0,
        profit: 0,
        itemDiscount: 0
      }]);
      
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

          {/* Order Items */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">أصناف الطلب</h3>
                <Button type="button" onClick={addItem} size="sm">
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة صنف
                </Button>
              </div>
              
              {items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">الصنف {index + 1}</span>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label>نوع المنتج *</Label>
                      <Input
                        value={item.productType}
                        onChange={(e) => updateItem(index, 'productType', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>المقاس *</Label>
                      <Input
                        value={item.size}
                        onChange={(e) => updateItem(index, 'size', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>الكمية</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div>
                      <Label>التكلفة</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.cost}
                        onChange={(e) => updateItem(index, 'cost', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>السعر</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>خصم الصنف</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.itemDiscount || 0}
                        onChange={(e) => updateItem(index, 'itemDiscount', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>الربح</Label>
                      <Input
                        value={formatCurrency(item.profit)}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

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
            <Button type="submit" disabled={loading} className="flex-1">
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