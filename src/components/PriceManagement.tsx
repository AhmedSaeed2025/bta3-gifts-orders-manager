
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePrices } from "@/context/PriceContext";
import { formatCurrency } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const PriceManagement = () => {
  const { proposedPrices, addProposedPrice, deleteProposedPrice } = usePrices();
  
  const [formData, setFormData] = useState({
    productType: "",
    size: "",
    cost: 0,
    price: 0,
  });

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
    
    addProposedPrice(
      formData.productType,
      formData.size,
      formData.cost,
      formData.price
    );
    
    // Reset form
    setFormData({
      productType: "",
      size: "",
      cost: 0,
      price: 0,
    });
  };

  const handleEditPrice = (productType: string, size: string) => {
    if (proposedPrices[productType] && proposedPrices[productType][size]) {
      setFormData({
        productType,
        size,
        cost: proposedPrices[productType][size].cost,
        price: proposedPrices[productType][size].price,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">إدارة الأسعار المقترحة</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
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
              <Label htmlFor="cost">تكلفة الصنف المقترحة</Label>
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
              <Label htmlFor="price">سعر البيع المقترح</Label>
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
          </div>
          
          <Button type="submit" className="bg-gift-primary hover:bg-gift-primaryHover">
            حفظ السعر المقترح
          </Button>
        </form>
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">الأسعار المقترحة الحالية</h3>
          <div className="overflow-x-auto">
            <table className="gift-table">
              <thead>
                <tr>
                  <th>نوع المنتج</th>
                  <th>المقاس</th>
                  <th>تكلفة الصنف المقترحة</th>
                  <th>سعر البيع المقترح</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(proposedPrices).flatMap(([productType, sizes]) =>
                  Object.entries(sizes).map(([size, data]) => (
                    <tr key={`${productType}-${size}`}>
                      <td>{productType}</td>
                      <td>{size}</td>
                      <td>{formatCurrency(data.cost)}</td>
                      <td>{formatCurrency(data.price)}</td>
                      <td className="flex flex-wrap gap-1">
                        <Button 
                          className="h-7 text-xs bg-blue-500 hover:bg-blue-600"
                          onClick={() => handleEditPrice(productType, size)}
                        >
                          تعديل
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button className="h-7 text-xs bg-gift-primary hover:bg-gift-primaryHover">
                              حذف
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>تأكيد حذف السعر</AlertDialogTitle>
                              <AlertDialogDescription>
                                هل أنت متأكد من حذف هذا السعر المقترح؟
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-gift-primary hover:bg-gift-primaryHover"
                                onClick={() => deleteProposedPrice(productType, size)}
                              >
                                حذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  ))
                )}
                {Object.keys(proposedPrices).length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-4">لا توجد أسعار مقترحة متاحة</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceManagement;
