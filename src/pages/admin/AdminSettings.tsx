
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const AdminSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    store_name: '',
    primary_color: '',
    secondary_color: '',
    contact_phone: '',
    contact_email: '',
    address: '',
    about_us: ''
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
    enabled: !!user,
    onSuccess: (data) => {
      if (data) {
        setFormData({
          store_name: data.store_name || '',
          primary_color: data.primary_color || '',
          secondary_color: data.secondary_color || '',
          contact_phone: data.contact_phone || '',
          contact_email: data.contact_email || '',
          address: data.address || '',
          about_us: data.about_us || ''
        });
      }
    }
  });

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

        <Card>
          <CardHeader>
            <CardTitle>الألوان والتصميم</CardTitle>
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
            'حفظ الإعدادات'
          )}
        </Button>
      </form>
    </div>
  );
};

export default AdminSettings;
