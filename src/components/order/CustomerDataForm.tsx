
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Phone, CreditCard, Truck } from "lucide-react";

interface CustomerDataFormProps {
  customerData: {
    paymentMethod: string;
    clientName: string;
    phone: string;
    deliveryMethod: string;
    address: string;
    governorate: string;
    shippingCost: number;
    deposit: number;
  };
  onCustomerDataChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string) => void;
}

const CustomerDataForm: React.FC<CustomerDataFormProps> = ({
  customerData,
  onCustomerDataChange,
  onSelectChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" />
          بيانات العميل
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="clientName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              اسم العميل *
            </Label>
            <Input
              type="text"
              id="clientName"
              name="clientName"
              value={customerData.clientName}
              onChange={onCustomerDataChange}
              placeholder="أدخل اسم العميل"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              رقم التليفون *
            </Label>
            <Input
              type="tel"
              id="phone"
              name="phone"
              value={customerData.phone}
              onChange={onCustomerDataChange}
              placeholder="01xxxxxxxxx"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="paymentMethod" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              طريقة الدفع *
            </Label>
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
                <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="deliveryMethod" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              طريقة التوصيل *
            </Label>
            <Select
              value={customerData.deliveryMethod}
              onValueChange={(value) => onSelectChange("deliveryMethod", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر طريقة التوصيل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="استلام من المعادي">استلام من المعادي</SelectItem>
                <SelectItem value="شحن للمنزل">شحن للمنزل</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {customerData.deliveryMethod === "شحن للمنزل" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="address">العنوان التفصيلي</Label>
              <Textarea
                id="address"
                name="address"
                value={customerData.address}
                onChange={onCustomerDataChange}
                placeholder="الشارع، المنطقة، المدينة..."
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
                placeholder="اختر المحافظة"
              />
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="shippingCost">مصاريف الشحن</Label>
            <div className="relative">
              <Input
                type="number"
                id="shippingCost"
                name="shippingCost"
                value={customerData.shippingCost}
                onChange={onCustomerDataChange}
                step={0.01}
                min={0}
                placeholder="0.00"
                className="text-right pr-12"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                ج.م
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="deposit">العربون المدفوع</Label>
            <div className="relative">
              <Input
                type="number"
                id="deposit"
                name="deposit"
                value={customerData.deposit}
                onChange={onCustomerDataChange}
                step={0.01}
                min={0}
                placeholder="0.00"
                className="text-right pr-12"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                ج.م
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerDataForm;
