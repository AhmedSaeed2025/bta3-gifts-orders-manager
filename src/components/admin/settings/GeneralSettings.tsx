
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Mail, Phone, MapPin } from 'lucide-react';

interface GeneralSettingsProps {
  formData: any;
  onInputChange: (field: string, value: string) => void;
}

const GeneralSettings = ({ formData, onInputChange }: GeneralSettingsProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <CardTitle>معلومات المتجر الأساسية</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="store_name">اسم المتجر</Label>
              <Input
                id="store_name"
                value={formData.store_name}
                onChange={(e) => onInputChange('store_name', e.target.value)}
                placeholder="اسم المتجر"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store_tagline">شعار المتجر</Label>
              <Input
                id="store_tagline"
                value={formData.store_tagline}
                onChange={(e) => onInputChange('store_tagline', e.target.value)}
                placeholder="شعار أو وصف مختصر للمتجر"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="about_us">نبذة عن المتجر</Label>
            <Textarea
              id="about_us"
              value={formData.about_us}
              onChange={(e) => onInputChange('about_us', e.target.value)}
              placeholder="نبذة مختصرة عن متجرك..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            <CardTitle>معلومات الاتصال</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_phone">رقم الهاتف الأساسي</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => onInputChange('contact_phone', e.target.value)}
                placeholder="+20 123 456 789"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_phone_2">رقم هاتف إضافي</Label>
              <Input
                id="contact_phone_2"
                value={formData.contact_phone_2}
                onChange={(e) => onInputChange('contact_phone_2', e.target.value)}
                placeholder="+20 123 456 789"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_email">البريد الإلكتروني</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => onInputChange('contact_email', e.target.value)}
                placeholder="info@store.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp_number">رقم الواتساب</Label>
              <Input
                id="whatsapp_number"
                value={formData.whatsapp_number}
                onChange={(e) => onInputChange('whatsapp_number', e.target.value)}
                placeholder="+20 123 456 789"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">العنوان</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => onInputChange('address', e.target.value)}
              placeholder="عنوان المتجر الكامل"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneralSettings;
