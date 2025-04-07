
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrders } from "@/context/OrderContext";
import { usePrices } from "@/context/PriceContext";
import { calculateTotal, calculateProfit } from "@/lib/utils";

const OrderForm = () => {
  const { addOrder } = useOrders();
  const { proposedPrices, getProposedPrice } = usePrices();
  
  const [formData, setFormData] = useState({
    paymentMethod: "",
    clientName: "",
    phone: "",
    deliveryMethod: "",
    address: "",
    governorate: "",
    productType: "",
    size: "",
    quantity: 1,
    cost: 0,
    price: 0,
    discount: 0,
  });

  // Check for proposed prices when product type or size changes
  useEffect(() => {
    const proposedPrice = getProposedPrice(formData.productType, formData.size);
    
    if (proposedPrice) {
      setFormData(prev => ({
        ...prev,
        cost: proposedPrice.cost,
        price: proposedPrice.price
      }));
    }
  }, [formData.productType, formData.size, getProposedPrice]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const total = calculateTotal(formData.price, formData.quantity, formData.discount);
    const profit = calculateProfit(formData.price, formData.cost, formData.quantity);
    
    addOrder({
      ...formData,
      address: formData.address || "-",
      governorate: formData.governorate || "-",
      quantity: Number(formData.quantity),
      cost: Number(formData.cost),
      price: Number(formData.price),
      discount: Number(formData.discount),
      total,
      profit,
      status: "pending"
    });
    
    // Reset form
    setFormData({
      paymentMethod: "",
      clientName: "",
      phone: "",
      deliveryMethod: "",
      address: "",
      governorate: "",
      productType: "",
      size: "",
      quantity: 1,
      cost: 0,
      price: 0,
      discount: 0,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">إضافة طلب جديد</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">طريقة السداد</Label>
              <Select 
                value={formData.paymentMethod}
                onValueChange={(value) => handleSelectChange("paymentMethod", value)}
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
                value={formData.clientName}
                onChange={handleChange} 
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">رقم التليفون</Label>
              <Input 
                id="phone" 
                name="phone" 
                type="tel" 
                value={formData.phone}
                onChange={handleChange} 
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deliveryMethod">طريقة الاستلام</Label>
              <Select 
                value={formData.deliveryMethod}
                onValueChange={(value) => handleSelectChange("deliveryMethod", value)}
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
                value={formData.address}
                onChange={handleChange} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="governorate">المحافظة</Label>
              <Input 
                id="governorate" 
                name="governorate" 
                value={formData.governorate}
                onChange={handleChange} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="productType">نوع المنتج</Label>
              <Select 
                value={formData.productType}
                onValueChange={(value) => handleSelectChange("productType", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="تابلوه">تابلوه</SelectItem>
                  <SelectItem value="ماكيت">ماكيت</SelectItem>
                  <SelectItem value="ميدالية اكليريك">ميدالية اكليريك</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="size">المقاس</Label>
              <Select 
                value={formData.size}
                onValueChange={(value) => handleSelectChange("size", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المقاس" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15*20 سم">15*20 سم</SelectItem>
                  <SelectItem value="20*30 سم">20*30 سم</SelectItem>
                  <SelectItem value="30*40 سم">30*40 سم</SelectItem>
                  <SelectItem value="40*50 سم">40*50 سم</SelectItem>
                  <SelectItem value="50*60 سم">50*60 سم</SelectItem>
                  <SelectItem value="50*70 سم">50*70 سم</SelectItem>
                  <SelectItem value="ميدالية أكليريك مستطيلة">ميدالية أكليريك مستطيلة</SelectItem>
                  <SelectItem value="ميدالية اكليريك مجسمة">ميدالية اكليريك مجسمة</SelectItem>
                  <SelectItem value="دلاية عربية اكليريك ( قطعة )">دلاية عربية اكليريك ( قطعة )</SelectItem>
                  <SelectItem value="دلاية عربية أكليريك ( قطعتين )">دلاية عربية أكليريك ( قطعتين )</SelectItem>
                  <SelectItem value="أخرى">أخرى</SelectItem>
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
                value={formData.quantity}
                onChange={handleChange} 
                required
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
                value={formData.cost}
                onChange={handleChange} 
                required
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
                value={formData.price}
                onChange={handleChange} 
                required
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
                value={formData.discount}
                onChange={handleChange} 
              />
            </div>
          </div>
          
          <Button type="submit" className="bg-gift-primary hover:bg-gift-primaryHover">
            إضافة الطلب
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default OrderForm;
