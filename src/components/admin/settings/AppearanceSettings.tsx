
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Palette, Image, Eye } from 'lucide-react';

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
          <div className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            <CardTitle>الشعار والصور</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logo_url">رابط صورة اللوجو</Label>
            <Input
              id="logo_url"
              value={formData.logo_url}
              onChange={(e) => onInputChange('logo_url', e.target.value)}
              placeholder="https://example.com/logo.png أو https://example.com/logo.gif"
            />
            <p className="text-sm text-muted-foreground">
              يمكنك استخدام رابط صورة ثابتة أو متحركة (GIF)
            </p>
            {formData.logo_url && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground mb-2">معاينة اللوجو:</p>
                <img 
                  src={formData.logo_url} 
                  alt="معاينة اللوجو" 
                  className="h-16 w-auto object-contain border rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="favicon_url">رابط الأيقونة المفضلة (Favicon)</Label>
            <Input
              id="favicon_url"
              value={formData.favicon_url}
              onChange={(e) => onInputChange('favicon_url', e.target.value)}
              placeholder="https://example.com/favicon.png"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hero_banner_url">صورة البانر الرئيسي</Label>
            <Input
              id="hero_banner_url"
              value={formData.hero_banner_url}
              onChange={(e) => onInputChange('hero_banner_url', e.target.value)}
              placeholder="https://example.com/banner.jpg"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <CardTitle>الألوان والتصميم</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary_color">اللون الأساسي</Label>
              <div className="flex gap-2">
                <Input
                  id="primary_color"
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => onInputChange('primary_color', e.target.value)}
                  className="w-20"
                />
                <Input
                  value={formData.primary_color}
                  onChange={(e) => onInputChange('primary_color', e.target.value)}
                  placeholder="#10B981"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondary_color">اللون الثانوي</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary_color"
                  type="color"
                  value={formData.secondary_color}
                  onChange={(e) => onInputChange('secondary_color', e.target.value)}
                  className="w-20"
                />
                <Input
                  value={formData.secondary_color}
                  onChange={(e) => onInputChange('secondary_color', e.target.value)}
                  placeholder="#059669"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accent_color">لون التمييز</Label>
              <div className="flex gap-2">
                <Input
                  id="accent_color"
                  type="color"
                  value={formData.accent_color}
                  onChange={(e) => onInputChange('accent_color', e.target.value)}
                  className="w-20"
                />
                <Input
                  value={formData.accent_color}
                  onChange={(e) => onInputChange('accent_color', e.target.value)}
                  placeholder="#F59E0B"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="text_color">لون النص</Label>
              <div className="flex gap-2">
                <Input
                  id="text_color"
                  type="color"
                  value={formData.text_color}
                  onChange={(e) => onInputChange('text_color', e.target.value)}
                  className="w-20"
                />
                <Input
                  value={formData.text_color}
                  onChange={(e) => onInputChange('text_color', e.target.value)}
                  placeholder="#1F2937"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            <CardTitle>إعدادات العرض</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>إظهار أسعار المنتجات</Label>
              <p className="text-sm text-muted-foreground">
                عرض الأسعار على صفحة المنتجات
              </p>
            </div>
            <Switch
              checked={formData.show_prices}
              onCheckedChange={(checked) => onToggleChange('show_prices', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>إظهار المنتجات النافدة</Label>
              <p className="text-sm text-muted-foreground">
                عرض المنتجات غير المتوفرة في المتجر
              </p>
            </div>
            <Switch
              checked={formData.show_out_of_stock}
              onCheckedChange={(checked) => onToggleChange('show_out_of_stock', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>تفعيل الوضع المظلم</Label>
              <p className="text-sm text-muted-foreground">
                السماح للعملاء بالتبديل للوضع المظلم
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
