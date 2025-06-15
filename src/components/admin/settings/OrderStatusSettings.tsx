
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { OrderStatus, OrderStatusConfig } from '@/types';

const OrderStatusSettings = () => {
  const { user } = useAuth();
  const [statusConfigs, setStatusConfigs] = useState<OrderStatusConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Initialize default status configs
  useEffect(() => {
    const loadConfigurations = () => {
      try {
        // Try to load from localStorage first
        const savedConfigs = user ? localStorage.getItem(`order_status_configs_${user.id}`) : null;
        
        if (savedConfigs) {
          const parsed = JSON.parse(savedConfigs);
          setStatusConfigs(parsed);
        } else {
          // Use default configurations
          const defaultConfigs: OrderStatusConfig[] = [
            { status: 'pending', label: 'قيد المراجعة', order: 1, enabled: true },
            { status: 'confirmed', label: 'تم التأكيد', order: 2, enabled: true },
            { status: 'processing', label: 'قيد التحضير', order: 3, enabled: true },
            { status: 'sentToPrinter', label: 'تم الإرسال للمطبعة', order: 4, enabled: true },
            { status: 'readyForDelivery', label: 'تحت التسليم', order: 5, enabled: true },
            { status: 'shipped', label: 'تم الشحن', order: 6, enabled: true },
            { status: 'delivered', label: 'تم التوصيل', order: 7, enabled: true },
            { status: 'cancelled', label: 'ملغي', order: 8, enabled: true }
          ];
          setStatusConfigs(defaultConfigs);
        }
      } catch (error) {
        console.error('Error loading status configurations:', error);
        toast.error('حدث خطأ في تحميل الإعدادات');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadConfigurations();
    } else {
      setLoading(false);
    }
  }, [user]);

  const moveStatusUp = (index: number) => {
    if (index === 0) return;
    
    const newConfigs = [...statusConfigs];
    [newConfigs[index], newConfigs[index - 1]] = [newConfigs[index - 1], newConfigs[index]];
    
    // Update order numbers
    const updatedConfigs = newConfigs.map((config, idx) => ({
      ...config,
      order: idx + 1
    }));
    
    setStatusConfigs(updatedConfigs);
  };

  const moveStatusDown = (index: number) => {
    if (index === statusConfigs.length - 1) return;
    
    const newConfigs = [...statusConfigs];
    [newConfigs[index], newConfigs[index + 1]] = [newConfigs[index + 1], newConfigs[index]];
    
    // Update order numbers
    const updatedConfigs = newConfigs.map((config, idx) => ({
      ...config,
      order: idx + 1
    }));
    
    setStatusConfigs(updatedConfigs);
  };

  const updateStatusLabel = (index: number, newLabel: string) => {
    const updated = [...statusConfigs];
    updated[index].label = newLabel;
    setStatusConfigs(updated);
  };

  const toggleStatusEnabled = (index: number) => {
    const updated = [...statusConfigs];
    updated[index].enabled = !updated[index].enabled;
    setStatusConfigs(updated);
  };

  const saveConfigurations = async () => {
    try {
      setSaving(true);
      
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return;
      }

      // Validate configurations
      if (statusConfigs.length === 0) {
        toast.error('يجب أن تحتوي على حالة واحدة على الأقل');
        return;
      }

      // Save to localStorage
      localStorage.setItem(`order_status_configs_${user.id}`, JSON.stringify(statusConfigs));
      
      toast.success('تم حفظ إعدادات حالات الطلبات بنجاح');
    } catch (error) {
      console.error('Error saving status configurations:', error);
      toast.error('حدث خطأ في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'processing': return 'bg-orange-500';
      case 'sentToPrinter': return 'bg-purple-500';
      case 'readyForDelivery': return 'bg-orange-600';
      case 'shipped': return 'bg-indigo-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>إعدادات حالات الطلبات</CardTitle>
          <Button 
            onClick={saveConfigurations} 
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-sm text-muted-foreground">
          يمكنك ترتيب حالات الطلبات وتخصيص أسمائها حسب احتياجاتك
        </div>

        <div className="space-y-4">
          {statusConfigs.map((config, index) => (
            <div
              key={config.status}
              className="flex items-center gap-4 p-4 border rounded-lg bg-background"
            >
              <div className="flex flex-col gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => moveStatusUp(index)}
                  disabled={index === 0}
                  className="h-8 w-8 p-0"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => moveStatusDown(index)}
                  disabled={index === statusConfigs.length - 1}
                  className="h-8 w-8 p-0"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>

              <Badge className={`${getStatusColor(config.status)} text-white min-w-[80px] justify-center`}>
                {config.status}
              </Badge>

              <div className="flex-1 space-y-2">
                <Label htmlFor={`label-${config.status}`}>
                  الاسم المعروض
                </Label>
                <Input
                  id={`label-${config.status}`}
                  value={config.label}
                  onChange={(e) => updateStatusLabel(index, e.target.value)}
                  placeholder="أدخل اسم الحالة"
                />
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  checked={config.enabled}
                  onCheckedChange={() => toggleStatusEnabled(index)}
                />
                <Label>مفعل</Label>
              </div>

              <div className="text-sm text-muted-foreground min-w-[60px]">
                الترتيب: {config.order}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">ملاحظات:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• يمكنك استخدام الأسهم لإعادة ترتيب الحالات</li>
            <li>• تأكد من تفعيل الحالات التي تريد استخدامها</li>
            <li>• الحالات المعطلة لن تظهر في قوائم الاختيار</li>
            <li>• حالة "ملغي" اختيارية ويمكن تعطيلها إذا لم تكن بحاجة إليها</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderStatusSettings;
