
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Building2, Mail, Phone, MapPin, Type, Store } from 'lucide-react';

interface GeneralSettingsProps {
  formData: any;
  onInputChange: (field: string, value: string) => void;
  onToggleChange?: (field: string, value: boolean) => void;
}

const GeneralSettings = ({ formData, onInputChange, onToggleChange }: GeneralSettingsProps) => {
  return (
    <div className="space-y-6">
      {/* Store Visibility Control */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <CardTitle>إعدادات المتجر</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
            <div className="space-y-1">
              <Label htmlFor="store_enabled" className="text-base font-medium">تفعيل المتجر</Label>
              <p className="text-sm text-muted-foreground">
                تحكم في إظهار أو إخفاء المتجر للعملاء
              </p>
            </div>
            <Switch
              id="store_enabled"
              checked={formData.store_enabled !== false}
              onCheckedChange={(checked) => onToggleChange?.('store_enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

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
            <Label htmlFor="store_description">وصف المتجر</Label>
            <Textarea
              id="store_description"
              value={formData.store_description}
              onChange={(e) => onInputChange('store_description', e.target.value)}
              placeholder="وصف مختصر يظهر في أعلى المتجر..."
              rows={3}
            />
            <p className="text-sm text-gray-500">
              هذا الوصف سيظهر في أعلى المتجر تحت اسم المتجر مباشرة.
            </p>
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

          <div className="space-y-2">
            <Label htmlFor="main_text">النص الرئيسي للمتجر</Label>
            <Textarea
              id="main_text"
              value={formData.main_text}
              onChange={(e) => onInputChange('main_text', e.target.value)}
              placeholder="النص الرئيسي الذي سيظهر في المتجر... اتركه فارغاً لإخفاء النص"
              rows={6}
            />
            <p className="text-sm text-gray-500">
              هذا النص سيظهر بدلاً من النص الافتراضي في المتجر. اتركه فارغاً لإخفاء النص تماماً.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="footer_brand_text">نص العلامة التجارية في الفوتر</Label>
            <Input
              id="footer_brand_text"
              value={formData.footer_brand_text}
              onChange={(e) => onInputChange('footer_brand_text', e.target.value)}
              placeholder="بتاع هدايا الأصلى"
            />
            <p className="text-sm text-gray-500">
              هذا النص سيظهر في أسفل المتجر كعلامة تجارية.
            </p>
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
