
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Settings, Palette, Truck, CreditCard, FileText, Save, Star, ImageIcon } from 'lucide-react';
import { Facebook } from 'lucide-react';

// Import the component modules
import GeneralSettings from '@/components/admin/settings/GeneralSettings';
import AppearanceSettings from '@/components/admin/settings/AppearanceSettings';
import BannerSettings from '@/components/admin/settings/BannerSettings';
import ShippingSettings from '@/components/admin/settings/ShippingSettings';
import PaymentSettings from '@/components/admin/settings/PaymentSettings';
import PolicySettings from '@/components/admin/settings/PolicySettings';
import SocialMediaSettings from '@/components/admin/settings/SocialMediaSettings';
import CustomerReviewsSettings from '@/components/admin/settings/CustomerReviewsSettings';

// Import the custom hooks
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useShippingRates } from '@/hooks/useShippingRates';
import { governorates } from '@/constants/adminSettings';

const AdminSettings = () => {
  const { user } = useAuth();
  const {
    formData,
    isLoading,
    updateSettingsMutation,
    handleInputChange,
    handleToggleChange,
    handleSubmit
  } = useAdminSettings();

  const {
    shippingRates,
    setShippingRates,
    newShippingRate,
    setNewShippingRate,
    addShippingRate,
    removeShippingRate
  } = useShippingRates();

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
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            عام
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            المظهر
          </TabsTrigger>
          <TabsTrigger value="banners" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            البانرات
          </TabsTrigger>
          <TabsTrigger value="shipping" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            الشحن
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            الدفع
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Facebook className="h-4 w-4" />
            السوشيال ميديا
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            آراء العملاء
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

        <TabsContent value="banners">
          <BannerSettings 
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

        <TabsContent value="social">
          <SocialMediaSettings 
            formData={formData}
            onInputChange={handleInputChange}
          />
        </TabsContent>

        <TabsContent value="reviews">
          <CustomerReviewsSettings 
            formData={formData}
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
