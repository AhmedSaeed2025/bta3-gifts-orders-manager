import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { usePrices } from "@/context/PriceContext";
import { useProducts } from "@/context/ProductContext";
import { Plus, Trash2 } from "lucide-react";
import { OrderItem } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const OrderForm = () => {
  const { addOrder } = useSupabaseOrders();
  const { proposedPrices, getProposedPrice } = usePrices();
  const { products } = useProducts();
  
  const [customerData, setCustomerData] = useState({
    paymentMethod: "",
    clientName: "",
    phone: "",
    deliveryMethod: "",
    address: "",
    governorate: "",
    shippingCost: 0,
    discount: 0,
    deposit: 0,
  });
  
  const [currentItem, setCurrentItem] = useState({
    productType: "",
    size: "",
    quantity: 1,
    cost: 0,
    price: 0,
  });
  
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const availableProductTypes = [...new Set(products.map(p => p.name))];
  
  const availableSizes = currentItem.productType ? 
    products
      .find(p => p.name === currentItem.productType)?.sizes
      .map(s => s.size) || [] 
    : [];

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalAmount = subtotal + customerData.shippingCost - customerData.discount - customerData.deposit;
  const totalProfit = items.reduce((sum, item) => sum + (item.price - item.cost) * item.quantity, 0);

  useEffect(() => {
    if (currentItem.productType && currentItem.size) {
      const selectedProduct = products.find(p => p.name === currentItem.productType);
      const selectedSize = selectedProduct?.sizes.find(s => s.size === currentItem.size);
      
      if (selectedSize) {
        setCurrentItem(prev => ({
          ...prev,
          cost: selectedSize.cost,
          price: selectedSize.price
        }));
      } else {
        const proposedPrice = getProposedPrice(currentItem.productType, currentItem.size);
        
        if (proposedPrice) {
          setCurrentItem(prev => ({
            ...prev,
            cost: proposedPrice.cost,
            price: proposedPrice.price
          }));
        }
      }
    }
  }, [currentItem.productType, currentItem.size, products, getProposedPrice]);

  const handleCustomerDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setCustomerData(prev => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setCurrentItem(prev => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSelectChange = (section: "customer" | "item", name: string, value: string) => {
    if (section === "customer") {
      setCustomerData(prev => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setCurrentItem(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  
  const addItem = () => {
    if (!currentItem.productType || !currentItem.size || currentItem.quantity < 1) {
      return;
    }
    
    const profit = (currentItem.price - currentItem.cost) * currentItem.quantity;
    
    setItems(prev => [...prev, { ...currentItem, profit }]);
    
    setCurrentItem({
      productType: "",
      size: "",
      quantity: 1,
      cost: 0,
      price: 0,
    });
  };
  
  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (items.length === 0) {
      alert("يجب إضافة منتج واحد على الأقل");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await addOrder({
        ...customerData,
        address: customerData.address || "-",
        governorate: customerData.governorate || "-",
        items,
        total: totalAmount,
        profit: totalProfit,
        status: "pending"
      });
      
      // Reset form
      setCustomerData({
        paymentMethod: "",
        clientName: "",
        phone: "",
        deliveryMethod: "",
        address: "",
        governorate: "",
        shippingCost: 0,
        discount: 0,
        deposit: 0,
      });
      setItems([]);
    } catch (error) {
      console.error('Error submitting order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">إضافة طلب جديد</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">طريقة السداد</Label>
              <Select 
                value={customerData.paymentMethod}
                onValueChange={(value) => handleSelectChange("customer", "paymentMethod", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الطريقة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="نقدي عند الاستلام">نقدي عند الاستلام</SelectItem>
                  <SelectItem value="انستا باي">انستا باي</SelectItem>
                  <SelectItem value="محفظة الكترونية">محفظة الكترونية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clientName">اسم العميل</Label>
              <Input 
                id="clientName" 
                name="clientName" 
                value={customerData.clientName}
                onChange={handleCustomerDataChange} 
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">رقم التليفون</Label>
              <Input 
                id="phone" 
                name="phone" 
                type="tel" 
                value={customerData.phone}
                onChange={handleCustomerDataChange} 
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deliveryMethod">طريقة الاستلام</Label>
              <Select 
                value={customerData.deliveryMethod}
                onValueChange={(value) => handleSelectChange("customer", "deliveryMethod", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الطريقة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="استلام من المعادي">استلام من المعادي</SelectItem>
                  <SelectItem value="شحن للمنزل">شحن للمنزل</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">العنوان (في حالة الشحن)</Label>
              <Input 
                id="address" 
                name="address" 
                value={customerData.address}
                onChange={handleCustomerDataChange} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="governorate">المحافظة</Label>
              <Input 
                id="governorate" 
                name="governorate" 
                value={customerData.governorate}
                onChange={handleCustomerDataChange} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="shippingCost">مصاريف الشحن</Label>
              <Input 
                id="shippingCost" 
                name="shippingCost" 
                type="number"
                min="0"
                step="0.01" 
                value={customerData.shippingCost}
                onChange={handleCustomerDataChange} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="discount">الخصم (إذا وجد)</Label>
              <Input 
                id="discount" 
                name="discount" 
                type="number" 
                min="0"
                step="0.01"
                value={customerData.discount}
                onChange={handleCustomerDataChange} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deposit">العربون (إذا وجد)</Label>
              <Input 
                id="deposit" 
                name="deposit" 
                type="number" 
                min="0"
                step="0.01"
                value={customerData.deposit}
                onChange={handleCustomerDataChange} 
              />
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-4">إضافة المنتجات</h3>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="productType">نوع المنتج</Label>
                <Select 
                  value={currentItem.productType}
                  onValueChange={(value) => handleSelectChange("item", "productType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProductTypes.length > 0 ? (
                      availableProductTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="تابلوه">تابلوه</SelectItem>
                        <SelectItem value="ماكيت">ماكيت</SelectItem>
                        <SelectItem value="ميدالية اكليريك">ميدالية اكليريك</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="size">المقاس</Label>
                <Select 
                  value={currentItem.size}
                  onValueChange={(value) => handleSelectChange("item", "size", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المقاس" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSizes.length > 0 ? (
                      availableSizes.map(size => (
                        <SelectItem key={size} value={size}>{size}</SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="15*20 سم">15*20 سم</SelectItem>
                        <SelectItem value="20*30 سم">20*30 سم</SelectItem>
                        <SelectItem value="30*40 سم">30*40 سم</SelectItem>
                        <SelectItem value="40*50 سم">40*50 سم</SelectItem>
                        <SelectItem value="50*60 سم">50*60 سم</SelectItem>
                        <SelectItem value="50*70 سم">50*70 سم</SelectItem>
                        <SelectItem value="100*60 سم">100*60 سم</SelectItem>
                        <SelectItem value="ميدالية أكليريك مستطيلة">ميدالية أكليريك مستطيلة</SelectItem>
                        <SelectItem value="ميدالية اكليريك مجسمة">ميدالية اكليريك مجسمة</SelectItem>
                        <SelectItem value="دلاية عربية اكليريك ( قطعة )">دلاية عربية اكليريك ( قطعة )</SelectItem>
                        <SelectItem value="دلاية عربية أكليريك ( قطعتين )">دلاية عربية أكليريك ( قطعتين )</SelectItem>
                        <SelectItem value="أخرى">أخرى</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantity">الكمية</Label>
                <Input 
                  id="quantity" 
                  name="quantity" 
                  type="number" 
                  min="1"
                  value={currentItem.quantity}
                  onChange={handleItemChange} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cost">تكلفة الصنف</Label>
                <Input 
                  id="cost" 
                  name="cost" 
                  type="number" 
                  min="0"
                  step="0.01"
                  value={currentItem.cost}
                  onChange={handleItemChange} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">سعر البيع</Label>
                <Input 
                  id="price" 
                  name="price" 
                  type="number" 
                  min="0"
                  step="0.01"
                  value={currentItem.price}
                  onChange={handleItemChange} 
                />
              </div>
              
              <div className="flex items-end">
                <Button 
                  type="button" 
                  className="bg-green-600 hover:bg-green-700 w-full"
                  onClick={addItem}
                >
                  <Plus className="ms-1" size={16} />
                  إضافة منتج
                </Button>
              </div>
            </div>
            
            {items.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">المنتجات المضافة:</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>نوع المنتج</TableHead>
                      <TableHead>المقاس</TableHead>
                      <TableHead>الكمية</TableHead>
                      <TableHead>سعر الوحدة</TableHead>
                      <TableHead>الإجمالي</TableHead>
                      <TableHead>إجراء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.productType}</TableCell>
                        <TableCell>{item.size}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.price} جنيه</TableCell>
                        <TableCell>{item.price * item.quantity} جنيه</TableCell>
                        <TableCell>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => removeItem(idx)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="mt-4 border-t pt-4">
                  <div className="flex justify-between">
                    <span>إجمالي سعر المنتجات:</span>
                    <span>{subtotal} جنيه</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>+ مصاريف الشحن:</span>
                    <span>{customerData.shippingCost} جنيه</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>- الخصم:</span>
                    <span>{customerData.discount} جنيه</span>
                  </div>
                  {customerData.deposit > 0 && (
                    <div className="flex justify-between mt-1">
                      <span>- العربون المدفوع:</span>
                      <span>{customerData.deposit} جنيه</span>
                    </div>
                  )}
                  <div className="flex justify-between mt-2 text-lg font-bold">
                    <span>الإجمالي الكلي:</span>
                    <span>{totalAmount} جنيه</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="bg-gift-primary hover:bg-gift-primaryHover" 
            disabled={items.length === 0 || isSubmitting}
          >
            {isSubmitting ? "جاري الإضافة..." : "إضافة الطلب"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default OrderForm;
