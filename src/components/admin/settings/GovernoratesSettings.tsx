import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Pencil, Check, X, ChevronUp, ChevronDown, MapPin, Sparkles, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useGovernorates } from '@/hooks/useGovernorates';

const formatEGP = (v: number) => `${v.toLocaleString('en-EG', { maximumFractionDigits: 2 })} ج.م`;

const GovernoratesSettings = () => {
  const {
    governorates,
    loading,
    addGovernorate,
    updateGovernorate,
    removeGovernorate,
    moveGovernorate,
    seedEgyptianDefaults,
  } = useGovernorates();

  const [newName, setNewName] = useState('');
  const [newCost, setNewCost] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCost, setEditCost] = useState('');
  const [busy, setBusy] = useState(false);

  const handleAdd = async () => {
    if (busy) return;
    setBusy(true);
    const ok = await addGovernorate(newName, Number(newCost) || 0);
    setBusy(false);
    if (ok) {
      setNewName('');
      setNewCost('');
    }
  };

  const startEdit = (id: string, name: string, cost: number) => {
    setEditingId(id);
    setEditName(name);
    setEditCost(String(cost || 0));
  };

  const saveEdit = async () => {
    if (!editingId || busy) return;
    const trimmed = editName.trim();
    if (!trimmed) return;
    setBusy(true);
    const ok = await updateGovernorate(editingId, {
      name: trimmed,
      shipping_cost: Number(editCost) || 0,
    });
    setBusy(false);
    if (ok) setEditingId(null);
  };

  return (
    <Card className="shadow-lg border-border/60">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <MapPin className="h-5 w-5" />
          </span>
          <div>
            <span>المحافظات وقيم الشحن</span>
            <p className="text-xs font-normal text-muted-foreground mt-0.5">
              سجّل محافظاتك وقيمة الشحن الافتراضية لكل محافظة — تظهر تلقائيًا وتُملأ الشحنة تلقائيًا عند تسجيل طلب جديد
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Add governorate */}
        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-2 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">اسم المحافظة</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="مثال: القاهرة"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">قيمة الشحن الافتراضية</Label>
              <Input
                type="number"
                value={newCost}
                onChange={(e) => setNewCost(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="0"
                min={0}
                step={0.01}
                className="h-9 text-center"
              />
            </div>
            <Button onClick={handleAdd} disabled={busy} className="h-9 gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              إضافة
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={seedEgyptianDefaults} className="gap-2 text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              إضافة كل المحافظات المصرية (27)
            </Button>
            <p className="text-[11px] text-muted-foreground">
              الترتيب الظاهر هنا هو نفسه الترتيب في شاشة تسجيل الطلب
            </p>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : governorates.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border border-dashed rounded-xl">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">لا توجد محافظات محفوظة بعد</p>
            <p className="text-xs mt-1">أضف محافظة يدويًا أو حمّل كل المحافظات المصرية بضغطة واحدة</p>
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            <div className="grid grid-cols-[40px_1fr_140px_120px] sm:grid-cols-[40px_1fr_160px_140px] gap-2 px-3 py-2 bg-muted/50 text-[11px] font-medium text-muted-foreground">
              <span>#</span>
              <span>اسم المحافظة</span>
              <span className="text-center">قيمة الشحن</span>
              <span className="text-center">تحكم</span>
            </div>
            <div className="divide-y max-h-[420px] overflow-y-auto">
              {governorates.map((gov, index) => (
                <div
                  key={gov.id}
                  className="grid grid-cols-[40px_1fr_140px_120px] sm:grid-cols-[40px_1fr_160px_140px] gap-2 px-3 py-2 items-center hover:bg-muted/30 transition-colors"
                >
                  <span className="text-xs text-muted-foreground font-mono">{index + 1}</span>

                  {editingId === gov.id ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                    />
                  ) : (
                    <span className="text-sm font-semibold truncate flex items-center gap-2">
                      {gov.name}
                    </span>
                  )}

                  {editingId === gov.id ? (
                    <Input
                      type="number"
                      value={editCost}
                      onChange={(e) => setEditCost(e.target.value)}
                      min={0}
                      step={0.01}
                      className="h-8 text-sm text-center"
                    />
                  ) : (
                    <div className="text-center">
                      {gov.shipping_cost > 0 ? (
                        <Badge variant="secondary" className="font-mono tabular-nums text-[11px]">
                          {formatEGP(Number(gov.shipping_cost))}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">بدون تحديد</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-1">
                    {editingId === gov.id ? (
                      <>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={saveEdit} disabled={busy}>
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          title="تحريك لأعلى"
                          onClick={() => moveGovernorate(index, 'up')}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          title="تحريك لأسفل"
                          onClick={() => moveGovernorate(index, 'down')}
                          disabled={index === governorates.length - 1}
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          title="تعديل"
                          onClick={() => startEdit(gov.id!, gov.name, Number(gov.shipping_cost))}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 hover:text-destructive"
                          title="حذف"
                          onClick={() => removeGovernorate(gov.id!)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GovernoratesSettings;
