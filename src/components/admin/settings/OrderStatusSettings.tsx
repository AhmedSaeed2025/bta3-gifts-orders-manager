
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { GripVertical, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { OrderStatus, OrderStatusConfig, ORDER_STATUS_LABELS } from '@/types';

const OrderStatusSettings = () => {
  const { user } = useAuth();
  const [statusConfigs, setStatusConfigs] = useState<OrderStatusConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize default status configs
  useEffect(() => {
    const defaultConfigs: OrderStatusConfig[] = [
      { status: 'pending', label: 'قيد المراجعة', order: 1, enabled: true },
      { status: 'confirmed', label: 'تم التأكيد', order: 2, enabled: true },
      { status: 'processing', label: 'قيد التحضير', order: 3, enabled: true },
      { status: 'shipped', label: 'تم الشحن', order: 4, enabled: true },
      { status: 'delivered', label: 'تم التوصيل', order: 5, enabled: true },
      { status: 'cancelled', label: 'ملغي', order: 6, enabled: true }
    ];
    
    setStatusConfigs(defaultConfigs);
    setLoading(false);
  }, []);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(statusConfigs);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order numbers
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index + 1
    }));

    setStatusConfigs(updatedItems);
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
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return;
      }

      // For now, we'll save to localStorage since we don't have a dedicated table
      // In production, you might want to create an order_status_configs table
      localStorage.setItem(`order_status_configs_${user.id}`, JSON.stringify(statusConfigs));
      
      toast.success('تم حفظ إعدادات حالات الطلبات بنجاح');
    } catch (error) {
      console.error('Error saving status configurations:', error);
      toast.error('حدث خطأ في حفظ الإعدادات');
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'processing': return 'bg-orange-500';
      case 'shipped': return 'bg-purple-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>إعدادات حالات الطلبات</CardTitle>
          <Button onClick={saveConfigurations} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            حفظ الإعدادات
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-sm text-muted-foreground">
          يمكنك ترتيب حالات الطلبات وتخصيص أسمائها حسب احتياجاتك
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="status-configs">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {statusConfigs.map((config, index) => (
                  <Draggable
                    key={config.status}
                    draggableId={config.status}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex items-center gap-4 p-4 border rounded-lg bg-background"
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <GripVertical className="h-5 w-5" />
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

                        <div className="flex items-center space-x-2">
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
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">ملاحظات:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• يمكنك سحب وإفلات الحالات لإعادة ترتيبها</li>
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
