import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Settings, Palette, Truck, CreditCard, FileText, Save } from 'lucide-react';

// Import the new component modules
import GeneralSettings from '@/components/admin/settings/GeneralSettings';
import AppearanceSettings from '@/components/admin/settings/AppearanceSettings';
import ShippingSettings from '@/components/admin/settings/ShippingSettings';
import PaymentSettings from '@/components/admin/settings/PaymentSettings';
import PolicySettings from '@/components/admin/settings/PolicySettings';

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
    // General Settings
    store_name: '',
    store_tagline: '',
    about_us: '',
    contact_phone: '',
    contact_phone_2: '',
    contact_email: '',
    whatsapp_number: '',
    address: '',
    
    // Appearance Settings
    logo_url: '',
    favicon_url: '',
    hero_banner_url: '',
    primary_color: '',
    secondary_color: '',
    accent_color: '',
    text_color: '',
    show_prices: true,
    show_out_of_stock: false,
    enable_dark_mode: true,
    
    // Shipping Settings
    free_shipping_enabled: false,
    default_shipping_cost: '',
    free_shipping_threshold: '',
    estimated_delivery_time: '',
    shipping_policy: '',
    
    // Payment Settings
    cash_on_delivery: true,
    bank_transfer: false,
    mobile_wallets: false,
    credit_cards: false,
    bank_name: '',
    account_holder: '',
    account_number: '',
    iban: '',
    vodafone_cash: '',
    orange_money: '',
    etisalat_flex: '',
    payment_instructions: '',
    
    // Policy Settings
    return_policy: '',
    terms_conditions: '',
    privacy_policy: '',
    cookie_policy: ''
  });

  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [newShippingRate, setNewShippingRate] = useState<ShippingRate>({
    product_type: '',
    product_size: '',
    governorate: '',
    shipping_cost: 0
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

  // Update formData when storeSettings changes
  useEffect(() => {
    if (storeSettings) {
      setFormData({
        store_name: storeSettings.store_name || '',
        store_tagline: storeSettings.store_tagline || '',
        about_us: storeSettings.about_us || '',
        contact_phone: storeSettings.contact_phone || '',
        contact_phone_2: storeSettings.contact_phone_2 || '',
        contact_email: storeSettings.contact_email || '',
        whatsapp_number: storeSettings.whatsapp_number || '',
        address: storeSettings.address || '',
        logo_url: storeSettings.logo_url || '',
        favicon_url: storeSettings.favicon_url || '',
        hero_banner_url: storeSettings.hero_banner_url || '',
        primary_color: storeSettings.primary_color || '#10B981',
        secondary_color: storeSettings.secondary_color || '#059669',
        accent_color: storeSettings.accent_color || '#F59E0B',
        text_color: storeSettings.text_color || '#1F2937',
        show_prices: storeSettings.show_prices !== false,
        show_out_of_stock: storeSettings.show_out_of_stock || false,
        enable_dark_mode: storeSettings.enable_dark_mode !== false,
        free_shipping_enabled: storeSettings.free_shipping_enabled || false,
        default_shipping_cost: storeSettings.default_shipping_cost?.toString() || '',
        free_shipping_threshold: storeSettings.free_shipping_threshold?.toString() || '',
        estimated_delivery_time: storeSettings.estimated_delivery_time || '',
        shipping_policy: storeSettings.shipping_policy || '',
        cash_on_delivery: storeSettings.cash_on_delivery !== false,
        bank_transfer: storeSettings.bank_transfer || false,
        mobile_wallets: storeSettings.mobile_wallets || false,
        credit_cards: storeSettings.credit_cards || false,
        bank_name: storeSettings.bank_name || '',
        account_holder: storeSettings.account_holder || '',
        account_number: storeSettings.account_number || '',
        iban: storeSettings.iban || '',
        vodafone_cash: storeSettings.vodafone_cash || '',
        orange_money: storeSettings.orange_money || '',
        etisalat_flex: storeSettings.etisalat_flex || '',
        payment_instructions: storeSettings.payment_instructions || '',
        return_policy: storeSettings.return_policy || '',
        terms_conditions: storeSettings.terms_conditions || '',
        privacy_policy: storeSettings.privacy_policy || '',
        cookie_policy: storeSettings.cookie_policy || ''
      });
    }
  }, [storeSettings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Convert string values to numbers where needed
      const processedData = {
        ...data,
        default_shipping_cost: data.default_shipping_cost ? parseFloat(data.default_shipping_cost) : 0,
        free_shipping_threshold: data.free_shipping_threshold ? parseFloat(data.free_shipping_threshold) : null,
      };

      if (storeSettings) {
        // Update existing settings
        const { error } = await supabase
          .from('store_settings')
          .update({
            ...processedData,
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
            ...processedData
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

  const handleToggleChange = (field: string, value: boolean) => {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إعدادات المتجر</h1>
          <p className="text-muted-foreground">تخصيص وإدارة جميع إعدادات متجرك</p>
        </div>
        <Button 
          onClick={handleSubmit}
          disabled={updateSettingsMutation.isPending}
          className="flex items-center gap-2"
        >
          {updateSettingsMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              حفظ جميع الإعدادات
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            عام
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            المظهر
          </TabsTrigger>
          <TabsTrigger value="shipping" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            الشحن
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            الدفع
          </TabsTrigger>
          <TabsTrigger value="policies" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            السياسات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettings 
            formData={formData}
            onInputChange={handleInputChange}
          />
        </TabsContent>

        <TabsContent value="appearance">
          <AppearanceSettings 
            formData={formData}
            onInputChange={handleInputChange}
            onToggleChange={handleToggleChange}
          />
        </TabsContent>

        <TabsContent value="shipping">
          <ShippingSettings 
            formData={formData}
            onInputChange={handleInputChange}
            onToggleChange={handleToggleChange}
            shippingRates={shippingRates}
            setShippingRates={setShippingRates}
            newShippingRate={newShippingRate}
            setNewShippingRate={setNewShippingRate}
            addShippingRate={addShippingRate}
            removeShippingRate={removeShippingRate}
            products={products || []}
            governorates={governorates}
          />
        </TabsContent>

        <TabsContent value="payment">
          <PaymentSettings 
            formData={formData}
            onInputChange={handleInputChange}
            onToggleChange={handleToggleChange}
          />
        </TabsContent>

        <TabsContent value="policies">
          <PolicySettings 
            formData={formData}
            onInputChange={handleInputChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
