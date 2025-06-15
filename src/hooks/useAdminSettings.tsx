
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface AdminSettingsFormData {
  // General Settings
  store_name: string;
  store_tagline: string;
  store_description: string;
  about_us: string;
  main_text: string;
  contact_phone: string;
  contact_phone_2: string;
  contact_email: string;
  whatsapp_number: string;
  address: string;
  
  // Appearance Settings
  logo_url: string;
  favicon_url: string;
  hero_banner_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  show_product_prices: boolean;
  show_product_sizes: boolean;
  show_out_of_stock: boolean;
  enable_dark_mode: boolean;
  
  // Banner Settings
  enable_banners: boolean;
  hero_banner_link: string;
  promo_banner_1_url: string;
  promo_banner_1_link: string;
  promo_banner_2_url: string;
  promo_banner_2_link: string;
  side_banner_1_url: string;
  side_banner_1_link: string;
  side_banner_2_url: string;
  side_banner_2_link: string;
  footer_banner_url: string;
  footer_banner_link: string;
  
  // Shipping Settings
  free_shipping_enabled: boolean;
  default_shipping_cost: string;
  free_shipping_threshold: string;
  estimated_delivery_time: string;
  shipping_policy: string;
  
  // Payment Settings
  cash_on_delivery: boolean;
  bank_transfer: boolean;
  mobile_wallets: boolean;
  credit_cards: boolean;
  bank_name: string;
  account_holder: string;
  account_number: string;
  iban: string;
  vodafone_cash: string;
  orange_money: string;
  etisalat_flex: string;
  payment_instructions: string;
  
  // Policy Settings
  return_policy: string;
  terms_conditions: string;
  privacy_policy: string;
  cookie_policy: string;
  
  // Social Media Settings
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  youtube_url: string;
  linkedin_url: string;
  tiktok_url: string;
  snapchat_url: string;
}

const defaultFormData: AdminSettingsFormData = {
  // General Settings
  store_name: '',
  store_tagline: '',
  store_description: '',
  about_us: '',
  main_text: '',
  contact_phone: '',
  contact_phone_2: '',
  contact_email: '',
  whatsapp_number: '',
  address: '',
  
  // Appearance Settings
  logo_url: '',
  favicon_url: '',
  hero_banner_url: '',
  primary_color: '#10B981',
  secondary_color: '#059669',
  accent_color: '#F59E0B',
  text_color: '#1F2937',
  show_product_prices: true,
  show_product_sizes: true,
  show_out_of_stock: false,
  enable_dark_mode: true,
  
  // Banner Settings
  enable_banners: true,
  hero_banner_link: '',
  promo_banner_1_url: '',
  promo_banner_1_link: '',
  promo_banner_2_url: '',
  promo_banner_2_link: '',
  side_banner_1_url: '',
  side_banner_1_link: '',
  side_banner_2_url: '',
  side_banner_2_link: '',
  footer_banner_url: '',
  footer_banner_link: '',
  
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
  cookie_policy: '',
  
  // Social Media Settings
  facebook_url: '',
  instagram_url: '',
  twitter_url: '',
  youtube_url: '',
  linkedin_url: '',
  tiktok_url: '',
  snapchat_url: ''
};

export const useAdminSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<AdminSettingsFormData>(defaultFormData);

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

  // Update formData when storeSettings changes
  useEffect(() => {
    if (storeSettings) {
      setFormData({
        store_name: storeSettings.store_name || '',
        store_tagline: storeSettings.store_tagline || '',
        store_description: (storeSettings as any).store_description || '',
        about_us: storeSettings.about_us || '',
        main_text: (storeSettings as any).main_text || '',
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
        show_product_prices: storeSettings.show_product_prices !== false,
        show_product_sizes: storeSettings.show_product_sizes !== false,
        show_out_of_stock: storeSettings.show_out_of_stock || false,
        enable_dark_mode: storeSettings.enable_dark_mode !== false,
        
        // Banner fields
        enable_banners: storeSettings.enable_banners !== false,
        hero_banner_link: storeSettings.hero_banner_link || '',
        promo_banner_1_url: storeSettings.promo_banner_1_url || '',
        promo_banner_1_link: storeSettings.promo_banner_1_link || '',
        promo_banner_2_url: storeSettings.promo_banner_2_url || '',
        promo_banner_2_link: storeSettings.promo_banner_2_link || '',
        side_banner_1_url: storeSettings.side_banner_1_url || '',
        side_banner_1_link: storeSettings.side_banner_1_link || '',
        side_banner_2_url: storeSettings.side_banner_2_url || '',
        side_banner_2_link: storeSettings.side_banner_2_link || '',
        footer_banner_url: storeSettings.footer_banner_url || '',
        footer_banner_link: storeSettings.footer_banner_link || '',
        
        free_shipping_enabled: storeSettings.free_shipping_enabled || false,
        default_shipping_cost: storeSettings.default_shipping_cost?.toString() || '0',
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
        cookie_policy: storeSettings.cookie_policy || '',
        
        // Social media fields
        facebook_url: (storeSettings as any).facebook_url || '',
        instagram_url: (storeSettings as any).instagram_url || '',
        twitter_url: (storeSettings as any).twitter_url || '',
        youtube_url: (storeSettings as any).youtube_url || '',
        linkedin_url: (storeSettings as any).linkedin_url || '',
        tiktok_url: (storeSettings as any).tiktok_url || '',
        snapchat_url: (storeSettings as any).snapchat_url || ''
      });
    }
  }, [storeSettings]);

  // Apply colors to CSS variables when formData changes
  useEffect(() => {
    const root = document.documentElement;
    if (formData.primary_color) {
      root.style.setProperty('--primary-color', formData.primary_color);
    }
    if (formData.secondary_color) {
      root.style.setProperty('--secondary-color', formData.secondary_color);
    }
    if (formData.accent_color) {
      root.style.setProperty('--accent-color', formData.accent_color);
    }
    if (formData.text_color) {
      root.style.setProperty('--text-color', formData.text_color);
    }
  }, [formData]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: AdminSettingsFormData) => {
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
      queryClient.invalidateQueries({ queryKey: ['store-settings-display'] });
    },
    onError: (error) => {
      console.error('Error saving settings:', error);
      toast.error('حدث خطأ في حفظ الإعدادات');
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleChange = (field: string, value: boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(formData);
  };

  return {
    formData,
    isLoading,
    updateSettingsMutation,
    handleInputChange,
    handleToggleChange,
    handleSubmit
  };
};
