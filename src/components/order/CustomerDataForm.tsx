
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CustomerData {
  paymentMethod: string;
  clientName: string;
  phone: string;
  deliveryMethod: string;
  address: string;
  governorate: string;
  shippingCost: number;
  discount: number;
  deposit: number;
}

interface CustomerDataFormProps {
  customerData: CustomerData;
  onCustomerDataChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: string) => void;
}

const CustomerDataForm: React.FC<CustomerDataFormProps> = ({
  customerData,
  onCustomerDataChange,
  onSelectChange,
}) => {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="paymentMethod">طريقة السداد</Label>
        <Select 
          value={customerData.paymentMethod}
          onValueChange={(value) => onSelectChange("paymentMethod", value)}
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
          onChange={onCustomerDataChange} 
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
          onChange={onCustomerDataChange} 
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="deliveryMethod">طريقة الاستلام</Label>
        <Select 
          value={customerData.deliveryMethod}
          onValueChange={(value) => onSelectChange("deliveryMethod", value)}
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
          onChange={onCustomerDataChange} 
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="governorate">المحافظة</Label>
        <Input 
          id="governorate" 
          name="governorate" 
          value={customerData.governorate}
          onChange={onCustomerDataChange} 
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
          onChange={onCustomerDataChange} 
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="discount">الخصم الإجمالي (إذا وجد)</Label>
        <Input 
          id="discount" 
          name="discount" 
          type="number" 
          min="0"
          step="0.01"
          value={customerData.discount}
          onChange={onCustomerDataChange} 
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
          onChange={onCustomerDataChange} 
        />
      </div>
    </div>
  );
};

export default CustomerDataForm;
