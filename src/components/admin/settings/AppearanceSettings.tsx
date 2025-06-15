
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AppearanceSettingsProps {
  formData: any;
  onInputChange: (field: string, value: string) => void;
  onToggleChange: (field: string, value: boolean) => void;
}

const AppearanceSettings = ({ formData, onInputChange, onToggleChange }: AppearanceSettingsProps) => {
  const colorPresets = [
    { name: 'أخضر كلاسيكي', primary: '#10B981', secondary: '#059669', accent: '#F59E0B', text: '#1F2937' },
    { name: 'أزرق احترافي', primary: '#3B82F6', secondary: '#1E40AF', accent: '#F59E0B', text: '#1F2937' },
    { name: 'بنفسجي عصري', primary: '#8B5CF6', secondary: '#7C3AED', accent: '#F59E0B', text: '#1F2937' },
    { name: 'وردي أنيق', primary: '#EC4899', secondary: '#DB2777', accent: '#F59E0B', text: '#1F2937' },
    { name: 'برتقالي دافئ', primary: '#F97316', secondary: '#EA580C', accent: '#EAB308', text: '#1F2937' },
    { name: 'رمادي احترافي', primary: '#6B7280', secondary: '#4B5563', accent: '#F59E0B', text: '#1F2937' },
  ];

  const applyColorPreset = (preset: any) => {
    onInputChange('primary_color', preset.primary);
    onInputChange('secondary_color', preset.secondary);
    onInputChange('accent_color', preset.accent);
    onInputChange('text_color', preset.text);
  };

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
          <CardTitle>قوالب الألوان الجاهزة</CardTitle>
          <p className="text-sm text-muted-foreground">اختر من القوالب الجاهزة أو قم بالتخصيص اليدوي</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {colorPresets.map((preset, index) => (
              <div key={index} className="border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer" onClick={() => applyColorPreset(preset)}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.primary }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.secondary }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.accent }}></div>
                  </div>
                  <span className="text-sm font-medium">{preset.name}</span>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  تطبيق هذا القالب
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ألوان المتجر الأساسية</CardTitle>
          <p className="text-sm text-muted-foreground">تحكم في الألوان الرئيسية للمتجر</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary Color */}
          <div className="space-y-3">
            <Label htmlFor="primary_color" className="text-base font-semibold">اللون الأساسي الرئيسي</Label>
            <p className="text-sm text-muted-foreground">يستخدم للأزرار الرئيسية وعناصر التفاعل المهمة</p>
            <div className="flex gap-3 items-center">
              <Input
                id="primary_color"
                type="color"
                value={formData.primary_color || '#10B981'}
                onChange={(e) => onInputChange('primary_color', e.target.value)}
                className="w-16 h-12"
              />
              <Input
                value={formData.primary_color || '#10B981'}
                onChange={(e) => onInputChange('primary_color', e.target.value)}
                placeholder="#10B981"
                className="flex-1"
                dir="ltr"
              />
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ backgroundColor: formData.primary_color || '#10B981' }}>
                <span className="text-white text-sm font-medium">معاينة</span>
              </div>
            </div>
          </div>

          {/* Secondary Color */}
          <div className="space-y-3">
            <Label htmlFor="secondary_color" className="text-base font-semibold">اللون الثانوي</Label>
            <p className="text-sm text-muted-foreground">يستخدم للعناصر الثانوية والنصوص المميزة</p>
            <div className="flex gap-3 items-center">
              <Input
                id="secondary_color"
                type="color"
                value={formData.secondary_color || '#059669'}
                onChange={(e) => onInputChange('secondary_color', e.target.value)}
                className="w-16 h-12"
              />
              <Input
                value={formData.secondary_color || '#059669'}
                onChange={(e) => onInputChange('secondary_color', e.target.value)}
                placeholder="#059669"
                className="flex-1"
                dir="ltr"
              />
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ backgroundColor: formData.secondary_color || '#059669' }}>
                <span className="text-white text-sm font-medium">معاينة</span>
              </div>
            </div>
          </div>

          {/* Accent Color */}
          <div className="space-y-3">
            <Label htmlFor="accent_color" className="text-base font-semibold">لون التمييز والتحديد</Label>
            <p className="text-sm text-muted-foreground">يستخدم للتمييز والعروض الخاصة والإشعارات</p>
            <div className="flex gap-3 items-center">
              <Input
                id="accent_color"
                type="color"
                value={formData.accent_color || '#F59E0B'}
                onChange={(e) => onInputChange('accent_color', e.target.value)}
                className="w-16 h-12"
              />
              <Input
                value={formData.accent_color || '#F59E0B'}
                onChange={(e) => onInputChange('accent_color', e.target.value)}
                placeholder="#F59E0B"
                className="flex-1"
                dir="ltr"
              />
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ backgroundColor: formData.accent_color || '#F59E0B' }}>
                <span className="text-white text-sm font-medium">معاينة</span>
              </div>
            </div>
          </div>

          {/* Text Color */}
          <div className="space-y-3">
            <Label htmlFor="text_color" className="text-base font-semibold">لون النص الأساسي</Label>
            <p className="text-sm text-muted-foreground">يستخدم للنصوص الرئيسية والعناوين</p>
            <div className="flex gap-3 items-center">
              <Input
                id="text_color"
                type="color"
                value={formData.text_color || '#1F2937'}
                onChange={(e) => onInputChange('text_color', e.target.value)}
                className="w-16 h-12"
              />
              <Input
                value={formData.text_color || '#1F2937'}
                onChange={(e) => onInputChange('text_color', e.target.value)}
                placeholder="#1F2937"
                className="flex-1"
                dir="ltr"
              />
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ color: formData.text_color || '#1F2937', borderColor: formData.text_color || '#1F2937' }}>
                <span className="text-sm font-medium">معاينة النص</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ألوان إضافية للتحكم المتقدم</CardTitle>
          <p className="text-sm text-muted-foreground">تحكم في المزيد من عناصر المتجر</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Success Color */}
          <div className="space-y-3">
            <Label htmlFor="success_color" className="text-base font-semibold">لون النجاح والتأكيد</Label>
            <p className="text-sm text-muted-foreground">يستخدم لرسائل النجاح والحالات الإيجابية</p>
            <div className="flex gap-3 items-center">
              <Input
                id="success_color"
                type="color"
                value={formData.success_color || '#22C55E'}
                onChange={(e) => onInputChange('success_color', e.target.value)}
                className="w-16 h-12"
              />
              <Input
                value={formData.success_color || '#22C55E'}
                onChange={(e) => onInputChange('success_color', e.target.value)}
                placeholder="#22C55E"
                className="flex-1"
                dir="ltr"
              />
              <Badge className="bg-green-500 text-white">تم بنجاح</Badge>
            </div>
          </div>

          {/* Warning Color */}
          <div className="space-y-3">
            <Label htmlFor="warning_color" className="text-base font-semibold">لون التحذير والتنبيه</Label>
            <p className="text-sm text-muted-foreground">يستخدم للتحذيرات والتنبيهات المهمة</p>
            <div className="flex gap-3 items-center">
              <Input
                id="warning_color"
                type="color"
                value={formData.warning_color || '#F59E0B'}
                onChange={(e) => onInputChange('warning_color', e.target.value)}
                className="w-16 h-12"
              />
              <Input
                value={formData.warning_color || '#F59E0B'}
                onChange={(e) => onInputChange('warning_color', e.target.value)}
                placeholder="#F59E0B"
                className="flex-1"
                dir="ltr"
              />
              <Badge className="bg-amber-500 text-white">تحذير</Badge>
            </div>
          </div>

          {/* Error Color */}
          <div className="space-y-3">
            <Label htmlFor="error_color" className="text-base font-semibold">لون الخطأ والرفض</Label>
            <p className="text-sm text-muted-foreground">يستخدم لرسائل الخطأ والحالات السلبية</p>
            <div className="flex gap-3 items-center">
              <Input
                id="error_color"
                type="color"
                value={formData.error_color || '#EF4444'}
                onChange={(e) => onInputChange('error_color', e.target.value)}
                className="w-16 h-12"
              />
              <Input
                value={formData.error_color || '#EF4444'}
                onChange={(e) => onInputChange('error_color', e.target.value)}
                placeholder="#EF4444"
                className="flex-1"
                dir="ltr"
              />
              <Badge className="bg-red-500 text-white">خطأ</Badge>
            </div>
          </div>

          {/* Background Color */}
          <div className="space-y-3">
            <Label htmlFor="background_color" className="text-base font-semibold">لون الخلفية الرئيسية</Label>
            <p className="text-sm text-muted-foreground">لون خلفية الصفحات في المتجر</p>
            <div className="flex gap-3 items-center">
              <Input
                id="background_color"
                type="color"
                value={formData.background_color || '#FFFFFF'}
                onChange={(e) => onInputChange('background_color', e.target.value)}
                className="w-16 h-12"
              />
              <Input
                value={formData.background_color || '#FFFFFF'}
                onChange={(e) => onInputChange('background_color', e.target.value)}
                placeholder="#FFFFFF"
                className="flex-1"
                dir="ltr"
              />
              <div className="w-8 h-8 rounded border" style={{ backgroundColor: formData.background_color || '#FFFFFF' }}></div>
            </div>
          </div>

          {/* Card Background */}
          <div className="space-y-3">
            <Label htmlFor="card_background_color" className="text-base font-semibold">لون خلفية البطاقات</Label>
            <p className="text-sm text-muted-foreground">لون خلفية بطاقات المنتجات والعناصر</p>
            <div className="flex gap-3 items-center">
              <Input
                id="card_background_color"
                type="color"
                value={formData.card_background_color || '#F9FAFB'}
                onChange={(e) => onInputChange('card_background_color', e.target.value)}
                className="w-16 h-12"
              />
              <Input
                value={formData.card_background_color || '#F9FAFB'}
                onChange={(e) => onInputChange('card_background_color', e.target.value)}
                placeholder="#F9FAFB"
                className="flex-1"
                dir="ltr"
              />
              <div className="w-8 h-8 rounded border" style={{ backgroundColor: formData.card_background_color || '#F9FAFB' }}></div>
            </div>
          </div>

          {/* Border Color */}
          <div className="space-y-3">
            <Label htmlFor="border_color" className="text-base font-semibold">لون الحدود والفواصل</Label>
            <p className="text-sm text-muted-foreground">لون الحدود والخطوط الفاصلة</p>
            <div className="flex gap-3 items-center">
              <Input
                id="border_color"
                type="color"
                value={formData.border_color || '#E5E7EB'}
                onChange={(e) => onInputChange('border_color', e.target.value)}
                className="w-16 h-12"
              />
              <Input
                value={formData.border_color || '#E5E7EB'}
                onChange={(e) => onInputChange('border_color', e.target.value)}
                placeholder="#E5E7EB"
                className="flex-1"
                dir="ltr"
              />
              <div className="w-8 h-8 rounded border-2" style={{ borderColor: formData.border_color || '#E5E7EB' }}></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>معاينة الألوان المطبقة</CardTitle>
          <p className="text-sm text-muted-foreground">شاهد كيف ستبدو الألوان في المتجر</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 p-4 rounded-lg border" style={{ backgroundColor: formData.background_color || '#FFFFFF' }}>
            <div className="p-4 rounded-lg" style={{ backgroundColor: formData.card_background_color || '#F9FAFB', borderColor: formData.border_color || '#E5E7EB' }}>
              <h3 className="text-lg font-bold mb-2" style={{ color: formData.text_color || '#1F2937' }}>
                عنوان المنتج
              </h3>
              <p className="text-sm mb-3" style={{ color: formData.secondary_color || '#059669' }}>
                وصف المنتج باللون الثانوي
              </p>
              <div className="flex gap-2 mb-3">
                <Button size="sm" style={{ backgroundColor: formData.primary_color || '#10B981', color: 'white' }}>
                  إضافة للسلة
                </Button>
                <Badge style={{ backgroundColor: formData.accent_color || '#F59E0B', color: 'white' }}>
                  عرض خاص
                </Badge>
              </div>
              <div className="flex gap-2">
                <Badge style={{ backgroundColor: formData.success_color || '#22C55E', color: 'white' }}>
                  متوفر
                </Badge>
                <Badge style={{ backgroundColor: formData.warning_color || '#F59E0B', color: 'white' }}>
                  كمية محدودة
                </Badge>
                <Badge style={{ backgroundColor: formData.error_color || '#EF4444', color: 'white' }}>
                  نفد المخزون
                </Badge>
              </div>
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
