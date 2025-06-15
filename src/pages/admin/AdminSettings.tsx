import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, FileText } from 'lucide-react';

interface ShippingRate {
  id?: string;
  product_type: string;
  product_size: string;
  governorate: string;
  shipping_cost: number;
}

const AdminSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    store_name: '',
    logo_url: '',
    primary_color: '',
    secondary_color: '',
    contact_phone: '',
    contact_email: '',
    address: '',
    about_us: '',
    return_policy: '',
    terms_conditions: '',
    privacy_policy: '',
    shipping_policy: ''
  });

  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [newShippingRate, setNewShippingRate] = useState<ShippingRate>({
    product_type: '',
    product_size: '',
    governorate: '',
    shipping_cost: 0
  });

  const { data: storeSettings, isLoading } = useQuery({
    queryKey: ['store-settings-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    },
    enabled: !!user
  });

  // Fetch products for shipping rate configuration
  const { data: products } = useQuery({
    queryKey: ['products-for-shipping'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          product_sizes (
            id,
            size
          )
        `)
        .eq('user_id', user!.id)
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Egyptian governorates
  const governorates = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة',
    'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية', 'المنيا', 'القليوبية',
    'الوادي الجديد', 'السويس', 'أسوان', 'أسيوط', 'بني سويف', 'بورسعيد',
    'دمياط', 'الشرقية', 'جنوب سيناء', 'كفر الشيخ', 'مطروح', 'الأقصر',
    'قنا', 'شمال سيناء', 'سوهاج'
  ];

  // تحديث formData عند تغير storeSettings
  useEffect(() => {
    if (storeSettings) {
      setFormData({
        store_name: storeSettings.store_name || '',
        logo_url: storeSettings.logo_url || '',
        primary_color: storeSettings.primary_color || '',
        secondary_color: storeSettings.secondary_color || '',
        contact_phone: storeSettings.contact_phone || '',
        contact_email: storeSettings.contact_email || '',
        address: storeSettings.address || '',
        about_us: storeSettings.about_us || '',
        return_policy: storeSettings.return_policy || '',
        terms_conditions: storeSettings.terms_conditions || '',
        privacy_policy: storeSettings.privacy_policy || '',
        shipping_policy: storeSettings.shipping_policy || ''
      });
    }
  }, [storeSettings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (storeSettings) {
        // Update existing settings
        const { error } = await supabase
          .from('store_settings')
          .update({
            ...data,
            updated_at: new Date().toISOString()
          })
          .eq('id', storeSettings.id);

        if (error) throw error;
      } else {
        // Create new settings
        const { error } = await supabase
          .from('store_settings')
          .insert({
            user_id: user!.id,
            ...data
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('تم حفظ الإعدادات بنجاح');
      queryClient.invalidateQueries({ queryKey: ['store-settings-admin'] });
      queryClient.invalidateQueries({ queryKey: ['store-settings'] });
      queryClient.invalidateQueries({ queryKey: ['store-settings-return-policy'] });
    },
    onError: (error) => {
      console.error('Error saving settings:', error);
      toast.error('حدث خطأ في حفظ الإعدادات');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addShippingRate = () => {
    if (!newShippingRate.product_type || !newShippingRate.product_size || !newShippingRate.governorate) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setShippingRates(prev => [...prev, { ...newShippingRate, id: Date.now().toString() }]);
    setNewShippingRate({
      product_type: '',
      product_size: '',
      governorate: '',
      shipping_cost: 0
    });
    toast.success('تم إضافة تكلفة الشحن');
  };

  const removeShippingRate = (index: number) => {
    setShippingRates(prev => prev.filter((_, i) => i !== index));
    toast.success('تم حذف تكلفة الشحن');
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">إعدادات المتجر</h1>
        <p className="text-muted-foreground">تخصيص وإدارة إعدادات متجرك</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">الإعدادات العامة</TabsTrigger>
          <TabsTrigger value="policies">السياسات</TabsTrigger>
          <TabsTrigger value="shipping">إعدادات الشحن</TabsTrigger>
          <TabsTrigger value="appearance">المظهر</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>المعلومات العامة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="store_name">اسم المتجر</Label>
                    <Input
                      id="store_name"
                      value={formData.store_name}
                      onChange={(e) => handleInputChange('store_name', e.target.value)}
                      placeholder="اسم المتجر"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">البريد الإلكتروني</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => handleInputChange('contact_email', e.target.value)}
                      placeholder="info@store.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">رقم الهاتف</Label>
                    <Input
                      id="contact_phone"
                      value={formData.contact_phone}
                      onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                      placeholder="+20 123 456 789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">العنوان</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="عنوان المتجر"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="about_us">نبذة عن المتجر</Label>
                  <Textarea
                    id="about_us"
                    value={formData.about_us}
                    onChange={(e) => handleInputChange('about_us', e.target.value)}
                    placeholder="نبذة مختصرة عن متجرك..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              className="w-full"
              disabled={updateSettingsMutation.isPending}
            >
              {updateSettingsMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري الحفظ...
                </>
              ) : (
                'حفظ الإعدادات'
              )}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="policies">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <CardTitle>السياسات والشروط</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  يمكنك تخصيص السياسات المختلفة لمتجرك هنا
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="return_policy">سياسة الاستبدال والاسترجاع</Label>
                  <Textarea
                    id="return_policy"
                    value={formData.return_policy}
                    onChange={(e) => handleInputChange('return_policy', e.target.value)}
                    placeholder="اكتب سياسة الاستبدال والاسترجاع الخاصة بمتجرك..."
                    rows={8}
                    className="min-h-[200px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    إذا تركت هذا الحقل فارغاً، سيتم استخدام السياسة الافتراضية
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shipping_policy">سياسة الشحن والتوصيل</Label>
                  <Textarea
                    id="shipping_policy"
                    value={formData.shipping_policy}
                    onChange={(e) => handleInputChange('shipping_policy', e.target.value)}
                    placeholder="اكتب سياسة الشحن والتوصيل..."
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="terms_conditions">الشروط والأحكام</Label>
                  <Textarea
                    id="terms_conditions"
                    value={formData.terms_conditions}
                    onChange={(e) => handleInputChange('terms_conditions', e.target.value)}
                    placeholder="اكتب الشروط والأحكام..."
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="privacy_policy">سياسة الخصوصية</Label>
                  <Textarea
                    id="privacy_policy"
                    value={formData.privacy_policy}
                    onChange={(e) => handleInputChange('privacy_policy', e.target.value)}
                    placeholder="اكتب سياسة الخصوصية..."
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              className="w-full"
              disabled={updateSettingsMutation.isPending}
            >
              {updateSettingsMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري الحفظ...
                </>
              ) : (
                'حفظ السياسات'
              )}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="appearance">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>المظهر والتصميم</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logo_url">رابط صورة اللوجو</Label>
                  <Input
                    id="logo_url"
                    value={formData.logo_url}
                    onChange={(e) => handleInputChange('logo_url', e.target.value)}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary_color">اللون الأساسي</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primary_color"
                        type="color"
                        value={formData.primary_color}
                        onChange={(e) => handleInputChange('primary_color', e.target.value)}
                        className="w-20"
                      />
                      <Input
                        value={formData.primary_color}
                        onChange={(e) => handleInputChange('primary_color', e.target.value)}
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
                        onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                        className="w-20"
                      />
                      <Input
                        value={formData.secondary_color}
                        onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                        placeholder="#059669"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              className="w-full"
              disabled={updateSettingsMutation.isPending}
            >
              {updateSettingsMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري الحفظ...
                </>
              ) : (
                'حفظ إعدادات المظهر'
              )}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات تكلفة الشحن</CardTitle>
              <p className="text-sm text-muted-foreground">
                قم بتحديد تكلفة الشحن لكل منتج ومقاس ومحافظة
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Shipping Rate */}
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

              {/* Current Shipping Rates */}
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
