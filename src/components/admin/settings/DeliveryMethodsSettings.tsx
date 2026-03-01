
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, Check, X, Truck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const defaultMethods = ['استلام من المعادي', 'شحن للمنزل'];

export const useDeliveryMethods = () => {
  const { user } = useAuth();
  const [methods, setMethods] = useState<string[]>(defaultMethods);

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`delivery_methods_${user.id}`);
      if (saved) {
        try {
          setMethods(JSON.parse(saved));
        } catch {
          setMethods(defaultMethods);
        }
      }
    }
  }, [user]);

  const saveMethods = (newMethods: string[]) => {
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
    if (methods.includes(trimmed)) {
      toast.error('طريقة التوصيل موجودة بالفعل');
      return;
    }
    saveMethods([...methods, trimmed]);
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
    setEditValue(methods[index]);
  };

  const confirmEdit = () => {
    if (editingIndex === null) return;
    const trimmed = editValue.trim();
    if (!trimmed) return;
    if (methods.some((m, i) => m === trimmed && i !== editingIndex)) {
      toast.error('طريقة التوصيل موجودة بالفعل');
      return;
    }
    const updated = [...methods];
    updated[editingIndex] = trimmed;
    saveMethods(updated);
    setEditingIndex(null);
    toast.success('تم تعديل طريقة التوصيل');
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
            <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/40">
              {editingIndex === index ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && confirmEdit()}
                    className="h-8"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={confirmEdit}>
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
                    <span className="font-medium text-sm">{method}</span>
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliveryMethodsSettings;
