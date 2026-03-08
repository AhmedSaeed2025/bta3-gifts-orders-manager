
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDeliveryMethods } from "@/components/admin/settings/DeliveryMethodsSettings";
import { User, Phone, CreditCard, Truck, MapPin, DollarSign } from "lucide-react";

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

const arabicToEnglishDigits = (str: string) => {
  return str.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
            .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1728));
};

const CustomerDataForm: React.FC<CustomerDataFormProps> = ({
  customerData,
  onCustomerDataChange,
  onSelectChange,
}) => {
  const { methods: deliveryMethods } = useDeliveryMethods();
  const selectedMethod = deliveryMethods.find(m => m.name === customerData.deliveryMethod);
  const showAddress = selectedMethod?.requiresAddress ?? false;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const converted = arabicToEnglishDigits(e.target.value);
    const syntheticEvent = { ...e, target: { ...e.target, name: e.target.name, value: converted, type: e.target.type } } as React.ChangeEvent<HTMLInputElement>;
    onCustomerDataChange(syntheticEvent);
  };

  return (
    <div className="space-y-5">
      {/* Customer Info Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <User size={18} />
          <h3 className="font-semibold text-sm">بيانات العميل</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="clientName" className="text-xs text-muted-foreground">اسم العميل *</Label>
            <Input
              type="text"
              id="clientName"
              name="clientName"
              value={customerData.clientName}
              onChange={onCustomerDataChange}
              required
              className="h-9 text-sm"
              placeholder="أدخل اسم العميل"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs text-muted-foreground">رقم التليفون *</Label>
            <div className="relative">
              <Phone size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="tel"
                id="phone"
                name="phone"
                value={customerData.phone}
                onChange={onCustomerDataChange}
                required
                className="h-9 text-sm pr-9"
                placeholder="01xxxxxxxxx"
              />
            </div>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="phone2" className="text-xs text-muted-foreground">رقم إضافي (اختياري)</Label>
            <div className="relative">
              <Phone size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="tel"
                id="phone2"
                name="phone2"
                value={customerData.phone2 || ""}
                onChange={onCustomerDataChange}
                className="h-9 text-sm pr-9"
                placeholder="رقم تليفون إضافي"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Payment & Delivery Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <Truck size={18} />
          <h3 className="font-semibold text-sm">الدفع والتوصيل</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">طريقة الدفع</Label>
            <Select
              value={customerData.paymentMethod}
              onValueChange={(value) => onSelectChange("paymentMethod", value)}
            >
              <SelectTrigger className="h-9 text-sm">
                <div className="flex items-center gap-2">
                  <CreditCard size={14} className="text-muted-foreground" />
                  <SelectValue placeholder="اختر طريقة الدفع" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="نقدي عند الاستلام">نقدي عند الاستلام</SelectItem>
                <SelectItem value="انستا باي">انستا باي</SelectItem>
                <SelectItem value="محفظة الكترونية">محفظة الكترونية</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">طريقة التوصيل</Label>
            <Select
              value={customerData.deliveryMethod}
              onValueChange={(value) => onSelectChange("deliveryMethod", value)}
            >
              <SelectTrigger className="h-9 text-sm">
                <div className="flex items-center gap-2">
                  <Truck size={14} className="text-muted-foreground" />
                  <SelectValue placeholder="اختر طريقة التوصيل" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {deliveryMethods.map((method) => (
                  <SelectItem key={method.name} value={method.name}>{method.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Address Section */}
      {showAddress && (
        <>
          <div className="border-t border-border" />
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <MapPin size={18} />
              <h3 className="font-semibold text-sm">العنوان</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="address" className="text-xs text-muted-foreground">العنوان التفصيلي</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={customerData.address}
                  onChange={onCustomerDataChange}
                  rows={2}
                  className="text-sm resize-none"
                  placeholder="أدخل العنوان بالتفصيل"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="governorate" className="text-xs text-muted-foreground">المحافظة</Label>
                <Input
                  type="text"
                  id="governorate"
                  name="governorate"
                  value={customerData.governorate}
                  onChange={onCustomerDataChange}
                  className="h-9 text-sm"
                  placeholder="المحافظة"
                />
              </div>
            </div>
          </div>
        </>
      )}

      <div className="border-t border-border" />

      {/* Financial Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <DollarSign size={18} />
          <h3 className="font-semibold text-sm">البيانات المالية</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="shippingCost" className="text-xs text-muted-foreground">الشحن</Label>
            <Input
              type="number"
              id="shippingCost"
              name="shippingCost"
              value={customerData.shippingCost}
              onChange={onCustomerDataChange}
              step={0.01}
              min={0}
              className="h-9 text-sm text-center"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="discount" className="text-xs text-muted-foreground">الخصم</Label>
            <Input
              type="number"
              id="discount"
              name="discount"
              value={customerData.discount}
              onChange={onCustomerDataChange}
              step={0.01}
              min={0}
              className="h-9 text-sm text-center"
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deposit" className="text-xs text-muted-foreground">العربون</Label>
            <Input
              type="number"
              id="deposit"
              name="deposit"
              value={customerData.deposit}
              onChange={onCustomerDataChange}
              step={0.01}
              min={0}
              className="h-9 text-sm text-center"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDataForm;
