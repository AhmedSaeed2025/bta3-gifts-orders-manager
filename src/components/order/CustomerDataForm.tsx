
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDeliveryMethods } from "@/components/admin/settings/DeliveryMethodsSettings";

interface CustomerDataFormProps {
  customerData: {
    paymentMethod: string;
    clientName: string;
    phone: string;
    phone2?: string;
    deliveryMethod: string;
    address: string;
    governorate: string;
    shippingCost: number;
    deposit: number;
    discount: number;
  };
  onCustomerDataChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string) => void;
}

const CustomerDataForm: React.FC<CustomerDataFormProps> = ({
  customerData,
  onCustomerDataChange,
  onSelectChange,
}) => {
  const { methods: deliveryMethods } = useDeliveryMethods();
  const selectedMethod = deliveryMethods.find(m => m.name === customerData.deliveryMethod);
  const showAddress = selectedMethod?.requiresAddress ?? false;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">بيانات العميل</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">اسم العميل</Label>
            <Input
              type="text"
              id="clientName"
              name="clientName"
              value={customerData.clientName}
              onChange={onCustomerDataChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">رقم التليفون</Label>
            <Input
              type="tel"
              id="phone"
              name="phone"
              value={customerData.phone}
              onChange={onCustomerDataChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone2">رقم إضافي (اختياري)</Label>
            <Input
              type="tel"
              id="phone2"
              name="phone2"
              value={customerData.phone2 || ""}
              onChange={onCustomerDataChange}
              placeholder="رقم تليفون إضافي"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">طريقة الدفع</Label>
            <Select
              value={customerData.paymentMethod}
              onValueChange={(value) => onSelectChange("paymentMethod", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر طريقة الدفع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="نقدي عند الاستلام">نقدي عند الاستلام</SelectItem>
                <SelectItem value="انستا باي">انستا باي</SelectItem>
                <SelectItem value="محفظة الكترونية">محفظة الكترونية</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="deliveryMethod">طريقة التوصيل</Label>
            <Select
              value={customerData.deliveryMethod}
              onValueChange={(value) => onSelectChange("deliveryMethod", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر طريقة التوصيل" />
              </SelectTrigger>
              <SelectContent>
                {deliveryMethods.map((method) => (
                  <SelectItem key={method.name} value={method.name}>{method.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {showAddress && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">العنوان</Label>
              <Textarea
                id="address"
                name="address"
                value={customerData.address}
                onChange={onCustomerDataChange}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="governorate">المحافظة</Label>
              <Input
                type="text"
                id="governorate"
                name="governorate"
                value={customerData.governorate}
                onChange={onCustomerDataChange}
              />
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="shippingCost">مصاريف الشحن</Label>
            <Input
              type="number"
              id="shippingCost"
              name="shippingCost"
              value={customerData.shippingCost}
              onChange={onCustomerDataChange}
              step={0.01}
              min={0}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="discount">خصم على الفاتورة</Label>
            <Input
              type="number"
              id="discount"
              name="discount"
              value={customerData.discount}
              onChange={onCustomerDataChange}
              step={0.01}
              min={0}
              placeholder="0"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="deposit">العربون المدفوع</Label>
            <Input
              type="number"
              id="deposit"
              name="deposit"
              value={customerData.deposit}
              onChange={onCustomerDataChange}
              step={0.01}
              min={0}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerDataForm;
