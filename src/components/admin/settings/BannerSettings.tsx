
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ImageIcon } from 'lucide-react';

interface BannerSettingsProps {
  formData: any;
  onInputChange: (field: string, value: string) => void;
  onToggleChange: (field: string, value: boolean) => void;
}

const BannerSettings = ({ formData, onInputChange, onToggleChange }: BannerSettingsProps) => {
  const bannerSizes = {
    hero_banner: { width: '1920x600', description: 'البانر الرئيسي في أعلى الصفحة' },
    promo_banner_1: { width: '800x400', description: 'بانر ترويجي كبير' },
    promo_banner_2: { width: '800x400', description: 'بانر ترويجي ثاني' },
    side_banner_1: { width: '400x600', description: 'بانر جانبي طويل' },
    side_banner_2: { width: '400x600', description: 'بانر جانبي ثاني' },
    footer_banner: { width: '1200x300', description: 'بانر في أسفل الصفحة' }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            إعدادات البانرات والصور الترويجية
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            تحكم في جميع البانرات والصور الترويجية في المتجر
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Banners Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="space-y-1">
              <Label className="text-base font-semibold text-blue-900">تفعيل نظام البانرات</Label>
              <p className="text-sm text-blue-700">
                تفعيل أو إلغاء تفعيل عرض البانرات في المتجر
              </p>
            </div>
            <Switch
              checked={formData.enable_banners !== false}
              onCheckedChange={(checked) => onToggleChange('enable_banners', checked)}
            />
          </div>

          {/* Banner URLs */}
          {Object.entries(bannerSizes).map(([key, info]) => (
            <div key={key} className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor={`${key}_url`} className="text-base font-semibold">
                  {info.description}
                </Label>
                <Badge variant="outline" className="text-xs">
                  {info.width} بكسل
                </Badge>
              </div>
              
              {/* Banner Preview */}
              {formData[`${key}_url`] && (
                <div className="border rounded-lg overflow-hidden bg-gray-50">
                  <img
                    src={formData[`${key}_url`]}
                    alt={`معاينة ${info.description}`}
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <Input
                id={`${key}_url`}
                value={formData[`${key}_url`] || ''}
                onChange={(e) => onInputChange(`${key}_url`, e.target.value)}
                placeholder={`https://example.com/${key.replace('_', '-')}.jpg`}
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground">
                المقاس المقترح: {info.width} بكسل - {info.description}
              </p>
            </div>
          ))}

          {/* Banner Links */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">روابط البانرات (اختياري)</h3>
            <p className="text-sm text-muted-foreground mb-4">
              أضف روابط للبانرات لتوجيه العملاء عند النقر عليها
            </p>
            
            {Object.keys(bannerSizes).map((key) => (
              <div key={`${key}_link`} className="space-y-2 mb-4">
                <Label htmlFor={`${key}_link`} className="text-sm font-medium">
                  رابط {bannerSizes[key as keyof typeof bannerSizes].description}
                </Label>
                <Input
                  id={`${key}_link`}
                  value={formData[`${key}_link`] || ''}
                  onChange={(e) => onInputChange(`${key}_link`, e.target.value)}
                  placeholder="https://example.com/page"
                  dir="ltr"
                />
              </div>
            ))}
          </div>

          {/* Banner Guidelines */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">إرشادات الصور والمقاسات:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• استخدم صور عالية الجودة (JPG أو PNG)</li>
              <li>• التزم بالمقاسات المقترحة للحصول على أفضل النتائج</li>
              <li>• تأكد من أن النصوص في الصور واضحة ومقروءة</li>
              <li>• استخدم ألوان متناسقة مع هوية المتجر</li>
              <li>• تجنب الصور الثقيلة التي تبطئ تحميل الموقع</li>
              <li>• يمكن ترك البانرات فارغة إذا لم تكن هناك حاجة إليها</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BannerSettings;
