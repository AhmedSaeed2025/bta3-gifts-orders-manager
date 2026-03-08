
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, Check, X, Truck, MapPin } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface DeliveryMethod {
  name: string;
  requiresAddress: boolean;
  defaultGovernorate?: string;
  defaultAddress?: string;
}

const defaultMethods: DeliveryMethod[] = [
  { name: 'استلام من المعادي', requiresAddress: false, defaultGovernorate: '', defaultAddress: '' },
  { name: 'شحن للمنزل', requiresAddress: true, defaultGovernorate: '', defaultAddress: '' },
];

export const useDeliveryMethods = () => {
  let user: any = null;
  try {
    const auth = useAuth();
    user = auth?.user;
  } catch {
    // useAuth may not be available in all contexts
  }
  const [methods, setMethods] = useState<DeliveryMethod[]>(defaultMethods);

  useEffect(() => {
    if (user) {
      try {
        const saved = localStorage.getItem(`delivery_methods_${user.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          // migrate old string[] format
          if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
            const migrated: DeliveryMethod[] = parsed.map((m: string) => ({ name: m, requiresAddress: false }));
            setMethods(migrated);
          } else if (Array.isArray(parsed)) {
            setMethods(parsed);
          }
        }
      } catch {
        setMethods(defaultMethods);
      }
    }
  }, [user]);

  const saveMethods = (newMethods: DeliveryMethod[]) => {
    setMethods(newMethods);
    if (user) {
      localStorage.setItem(`delivery_methods_${user.id}`, JSON.stringify(newMethods));
    }
  };

  return { methods, saveMethods };
};

const DeliveryMethodsSettings = () => {
  const { methods, saveMethods } = useDeliveryMethods();
  const [newMethod, setNewMethod] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const addMethod = () => {
    const trimmed = newMethod.trim();
    if (!trimmed) return;
    if (methods.some(m => m.name === trimmed)) {
      toast.error('طريقة التوصيل موجودة بالفعل');
      return;
    }
    saveMethods([...methods, { name: trimmed, requiresAddress: false }]);
    setNewMethod('');
    toast.success('تم إضافة طريقة التوصيل');
  };

  const removeMethod = (index: number) => {
    if (methods.length <= 1) {
      toast.error('يجب أن تبقى طريقة توصيل واحدة على الأقل');
      return;
    }
    const updated = methods.filter((_, i) => i !== index);
    saveMethods(updated);
    toast.success('تم حذف طريقة التوصيل');
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(methods[index].name);
  };

  const confirmEdit = () => {
    if (editingIndex === null) return;
    const trimmed = editValue.trim();
    if (!trimmed) return;
    if (methods.some((m, i) => m.name === trimmed && i !== editingIndex)) {
      toast.error('طريقة التوصيل موجودة بالفعل');
      return;
    }
    const updated = [...methods];
    updated[editingIndex] = { ...updated[editingIndex], name: trimmed };
    saveMethods(updated);
    setEditingIndex(null);
    toast.success('تم تعديل طريقة التوصيل');
  };

  const toggleRequiresAddress = (index: number) => {
    const updated = [...methods];
    updated[index] = { ...updated[index], requiresAddress: !updated[index].requiresAddress };
    saveMethods(updated);
  };

  const updateDefaultGovernorate = (index: number, value: string) => {
    const updated = [...methods];
    updated[index] = { ...updated[index], defaultGovernorate: value };
    saveMethods(updated);
  };

  const updateDefaultAddress = (index: number, value: string) => {
    const updated = [...methods];
    updated[index] = { ...updated[index], defaultAddress: value };
    saveMethods(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          طرق التوصيل
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="أضف طريقة توصيل جديدة..."
            value={newMethod}
            onChange={(e) => setNewMethod(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addMethod()}
          />
          <Button onClick={addMethod} size="sm" className="shrink-0 gap-1">
            <Plus className="h-4 w-4" />
            إضافة
          </Button>
        </div>

        <div className="space-y-2">
          {methods.map((method, index) => (
            <div key={index} className="flex flex-col p-3 bg-muted/30 rounded-lg border border-border/40 gap-2">
              <div className="flex items-center justify-between">
                {editingIndex === index ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && confirmEdit()}
                      className="h-8"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={confirmEdit}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingIndex(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{method.name}</span>
                      <Badge variant="secondary" className="text-[10px]">#{index + 1}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(index)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removeMethod(index)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
              {editingIndex !== index && (
                <div className="flex items-center gap-2 pr-6">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <Label htmlFor={`addr-${index}`} className="text-xs text-muted-foreground cursor-pointer">
                    يتطلب عنوان
                  </Label>
                  <Switch
                    id={`addr-${index}`}
                    checked={method.requiresAddress}
                    onCheckedChange={() => toggleRequiresAddress(index)}
                    className="scale-75"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliveryMethodsSettings;
