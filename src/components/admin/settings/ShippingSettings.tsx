
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Truck, Plus, Trash2 } from 'lucide-react';

interface ShippingSettingsProps {
  formData: any;
  onInputChange: (field: string, value: string) => void;
  onToggleChange: (field: string, value: boolean) => void;
  shippingRates: any[];
  setShippingRates: (rates: any[]) => void;
  newShippingRate: any;
  setNewShippingRate: (rate: any) => void;
  addShippingRate: () => void;
  removeShippingRate: (index: number) => void;
  products: any[];
  governorates: string[];
}

const ShippingSettings = ({ 
  formData, 
  onInputChange, 
  onToggleChange,
  shippingRates,
  setShippingRates,
  newShippingRate,
  setNewShippingRate,
  addShippingRate,
  removeShippingRate,
  products,
  governorates
}: ShippingSettingsProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            <CardTitle>إعدادات الشحن العامة</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>تفعيل الشحن المجاني</Label>
              <p className="text-sm text-muted-foreground">
                تفعيل الشحن المجاني لجميع الطلبات
              </p>
            </div>
            <Switch
              checked={formData.free_shipping_enabled}
              onCheckedChange={(checked) => onToggleChange('free_shipping_enabled', checked)}
            />
          </div>

          {!formData.free_shipping_enabled && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default_shipping_cost">تكلفة الشحن الافتراضية</Label>
                  <Input
                    id="default_shipping_cost"
                    type="number"
                    value={formData.default_shipping_cost}
                    onChange={(e) => onInputChange('default_shipping_cost', e.target.value)}
                    placeholder="50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="free_shipping_threshold">الحد الأدنى للشحن المجاني</Label>
                  <Input
                    id="free_shipping_threshold"
                    type="number"
                    value={formData.free_shipping_threshold}
                    onChange={(e) => onInputChange('free_shipping_threshold', e.target.value)}
                    placeholder="500"
                  />
                  <p className="text-xs text-muted-foreground">
                    اتركه فارغاً لإلغاء الشحن المجاني حسب المبلغ
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="estimated_delivery_time">مدة التوصيل المتوقعة</Label>
            <Input
              id="estimated_delivery_time"
              value={formData.estimated_delivery_time}
              onChange={(e) => onInputChange('estimated_delivery_time', e.target.value)}
              placeholder="من 2-5 أيام عمل"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipping_policy">سياسة الشحن والتوصيل</Label>
            <Textarea
              id="shipping_policy"
              value={formData.shipping_policy}
              onChange={(e) => onInputChange('shipping_policy', e.target.value)}
              placeholder="اكتب سياسة الشحن والتوصيل..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* تكاليف الشحن المخصصة */}
      <Card>
        <CardHeader>
          <CardTitle>تكاليف الشحن المخصصة</CardTitle>
          <p className="text-sm text-muted-foreground">
            قم بتحديد تكلفة الشحن لكل منتج ومقاس ومحافظة
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* إضافة تكلفة شحن جديدة */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">إضافة تكلفة شحن جديدة</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>نوع المنتج</Label>
                <Select 
                  value={newShippingRate.product_type} 
                  onValueChange={(value) => setNewShippingRate(prev => ({ ...prev, product_type: value, product_size: '' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المنتج" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((product) => (
                      <SelectItem key={product.id} value={product.name}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>المقاس</Label>
                <Select 
                  value={newShippingRate.product_size} 
                  onValueChange={(value) => setNewShippingRate(prev => ({ ...prev, product_size: value }))}
                  disabled={!newShippingRate.product_type}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المقاس" />
                  </SelectTrigger>
                  <SelectContent>
                    {products
                      ?.find(p => p.name === newShippingRate.product_type)
                      ?.product_sizes?.map((size) => (
                        <SelectItem key={size.id} value={size.size}>
                          {size.size}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>المحافظة</Label>
                <Select 
                  value={newShippingRate.governorate} 
                  onValueChange={(value) => setNewShippingRate(prev => ({ ...prev, governorate: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المحافظة" />
                  </SelectTrigger>
                  <SelectContent>
                    {governorates.map((gov) => (
                      <SelectItem key={gov} value={gov}>
                        {gov}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>تكلفة الشحن</Label>
                <Input
                  type="number"
                  value={newShippingRate.shipping_cost}
                  onChange={(e) => setNewShippingRate(prev => ({ ...prev, shipping_cost: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
            </div>
            <Button onClick={addShippingRate} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              إضافة تكلفة الشحن
            </Button>
          </div>

          {/* تكاليف الشحن الحالية */}
          <div className="space-y-4">
            <h3 className="font-semibold">تكاليف الشحن الحالية</h3>
            {shippingRates.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                لم يتم إضافة أي تكاليف شحن بعد
              </p>
            ) : (
              <div className="space-y-2">
                {shippingRates.map((rate, index) => (
                  <div key={rate.id || index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                      <span><strong>المنتج:</strong> {rate.product_type}</span>
                      <span><strong>المقاس:</strong> {rate.product_size}</span>
                      <span><strong>المحافظة:</strong> {rate.governorate}</span>
                      <span><strong>التكلفة:</strong> {rate.shipping_cost} جنيه</span>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeShippingRate(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShippingSettings;
