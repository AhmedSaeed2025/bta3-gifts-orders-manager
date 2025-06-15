
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface AppearanceSettingsProps {
  formData: any;
  onInputChange: (field: string, value: string) => void;
  onToggleChange: (field: string, value: boolean) => void;
}

const AppearanceSettings = ({ formData, onInputChange, onToggleChange }: AppearanceSettingsProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>صور وشعارات المتجر</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label htmlFor="logo_url">شعار المتجر</Label>
            
            {/* Logo Preview */}
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
              <div className="flex-shrink-0">
                <Avatar className="h-16 w-16">
                  <AvatarImage 
                    src={formData.logo_url} 
                    alt="شعار المتجر"
                    className="object-contain"
                  />
                  <AvatarFallback 
                    className="text-white font-bold text-lg"
                    style={{ backgroundColor: formData.primary_color || '#10B981' }}
                  >
                    {formData.store_name?.charAt(0) || 'م'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">معاينة الشعار</h4>
                <p className="text-xs text-muted-foreground">
                  {formData.logo_url ? 'شعار مخصص' : 'شعار افتراضي (الحرف الأول من اسم المتجر)'}
                </p>
              </div>
            </div>

            <Input
              id="logo_url"
              value={formData.logo_url || ''}
              onChange={(e) => onInputChange('logo_url', e.target.value)}
              placeholder="https://example.com/logo.png"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              أدخل رابط الشعار أو اتركه فارغاً لاستخدام الشعار الافتراضي
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="favicon_url">رابط الأيقونة المفضلة</Label>
            <Input
              id="favicon_url"
              value={formData.favicon_url || ''}
              onChange={(e) => onInputChange('favicon_url', e.target.value)}
              placeholder="https://example.com/favicon.ico"
              dir="ltr"
            />
          </div>

          <div className="space-y-4">
            <Label htmlFor="hero_banner_url">بانر الصفحة الرئيسية</Label>
            
            {/* Banner Preview */}
            {formData.hero_banner_url && (
              <div className="border rounded-lg overflow-hidden bg-gray-50">
                <img
                  src={formData.hero_banner_url}
                  alt="معاينة البانر"
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            <Input
              id="hero_banner_url"
              value={formData.hero_banner_url || ''}
              onChange={(e) => onInputChange('hero_banner_url', e.target.value)}
              placeholder="https://example.com/banner.jpg"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              البانر سيظهر في أعلى الصفحة الرئيسية للمتجر
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ألوان المتجر</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="primary_color">اللون الأساسي</Label>
            <div className="flex gap-2">
              <Input
                id="primary_color"
                type="color"
                value={formData.primary_color || '#10B981'}
                onChange={(e) => onInputChange('primary_color', e.target.value)}
                className="w-16 h-10"
              />
              <Input
                value={formData.primary_color || '#10B981'}
                onChange={(e) => onInputChange('primary_color', e.target.value)}
                placeholder="#10B981"
                className="flex-1"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary_color">اللون الثانوي</Label>
            <div className="flex gap-2">
              <Input
                id="secondary_color"
                type="color"
                value={formData.secondary_color || '#059669'}
                onChange={(e) => onInputChange('secondary_color', e.target.value)}
                className="w-16 h-10"
              />
              <Input
                value={formData.secondary_color || '#059669'}
                onChange={(e) => onInputChange('secondary_color', e.target.value)}
                placeholder="#059669"
                className="flex-1"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accent_color">لون التمييز</Label>
            <div className="flex gap-2">
              <Input
                id="accent_color"
                type="color"
                value={formData.accent_color || '#F59E0B'}
                onChange={(e) => onInputChange('accent_color', e.target.value)}
                className="w-16 h-10"
              />
              <Input
                value={formData.accent_color || '#F59E0B'}
                onChange={(e) => onInputChange('accent_color', e.target.value)}
                placeholder="#F59E0B"
                className="flex-1"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="text_color">لون النص</Label>
            <div className="flex gap-2">
              <Input
                id="text_color"
                type="color"
                value={formData.text_color || '#1F2937'}
                onChange={(e) => onInputChange('text_color', e.target.value)}
                className="w-16 h-10"
              />
              <Input
                value={formData.text_color || '#1F2937'}
                onChange={(e) => onInputChange('text_color', e.target.value)}
                placeholder="#1F2937"
                className="flex-1"
                dir="ltr"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>إعدادات عرض المنتجات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-red-50 to-pink-50">
            <div className="space-y-1">
              <Label className="text-base font-semibold text-red-900">إخفاء الأسعار نهائياً</Label>
              <p className="text-sm text-red-700">
                إخفاء جميع الأسعار في المتجر بالكامل. مفيد للمتاجر التي تعتمد على التواصل المباشر لمعرفة الأسعار
              </p>
            </div>
            <Switch
              checked={!formData.show_product_prices}
              onCheckedChange={(checked) => onToggleChange('show_product_prices', !checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="space-y-1">
              <Label className="text-base font-semibold text-purple-900">إظهار المقاسات</Label>
              <p className="text-sm text-purple-700">
                تحكم في إظهار أو إخفاء مقاسات المنتجات في المتجر. مفيد للمنتجات التي لا تحتاج مقاسات
              </p>
            </div>
            <Switch
              checked={formData.show_product_sizes}
              onCheckedChange={(checked) => onToggleChange('show_product_sizes', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="space-y-1">
              <Label className="text-base font-semibold text-green-900">إظهار المنتجات غير المتوفرة</Label>
              <p className="text-sm text-green-700">
                عرض المنتجات حتى لو كانت غير متوفرة في المخزون
              </p>
            </div>
            <Switch
              checked={formData.show_out_of_stock}
              onCheckedChange={(checked) => onToggleChange('show_out_of_stock', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-gray-50 to-slate-50">
            <div className="space-y-1">
              <Label className="text-base font-semibold text-gray-900">تفعيل الوضع الليلي</Label>
              <p className="text-sm text-gray-700">
                السماح للزوار بالتبديل إلى الوضع الليلي
              </p>
            </div>
            <Switch
              checked={formData.enable_dark_mode}
              onCheckedChange={(checked) => onToggleChange('enable_dark_mode', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppearanceSettings;
