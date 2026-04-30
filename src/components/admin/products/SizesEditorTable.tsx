import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Copy, Wand2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface SizeRow {
  size: string;
  cost: number;
  price: number;
}

interface Props {
  sizes: SizeRow[];
  onChange: (sizes: SizeRow[]) => void;
}

const marginColor = (margin: number) => {
  if (margin >= 30) return "text-emerald-600 bg-emerald-500/10 border-emerald-500/30";
  if (margin >= 15) return "text-amber-600 bg-amber-500/10 border-amber-500/30";
  return "text-red-600 bg-red-500/10 border-red-500/30";
};

const SizesEditorTable = ({ sizes, onChange }: Props) => {
  const [bulkMargin, setBulkMargin] = React.useState<number>(40);

  const update = (i: number, field: keyof SizeRow, value: string | number) => {
    const next = sizes.map((s, idx) => (idx === i ? { ...s, [field]: value } : s));
    onChange(next);
  };

  const add = () => onChange([...sizes, { size: "", cost: 0, price: 0 }]);
  const remove = (i: number) =>
    onChange(sizes.length > 1 ? sizes.filter((_, idx) => idx !== i) : sizes);
  const duplicate = (i: number) => {
    const copy = { ...sizes[i] };
    onChange([...sizes.slice(0, i + 1), copy, ...sizes.slice(i + 1)]);
  };

  const applyMargin = () => {
    const next = sizes.map((s) => ({
      ...s,
      price: s.cost > 0 ? Math.round(s.cost * (1 + bulkMargin / 100)) : s.price,
    }));
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label className="text-sm font-semibold">المقاسات والأسعار</Label>
        <div className="flex flex-wrap gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="gap-1">
                <Wand2 className="h-3.5 w-3.5" />
                هامش موحّد
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">نسبة الربح % (مقارنة بالتكلفة)</Label>
                  <Input
                    type="number"
                    value={bulkMargin}
                    onChange={(e) => setBulkMargin(Number(e.target.value) || 0)}
                    className="text-center mt-1"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  سيتم حساب السعر = التكلفة × (1 + النسبة/100) لكل مقاس له تكلفة.
                </p>
                <Button type="button" size="sm" onClick={applyMargin} className="w-full">
                  تطبيق على جميع المقاسات
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            مقاس جديد
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="hidden md:grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr_auto] gap-2 px-3 text-[11px] font-semibold text-muted-foreground">
        <span>المقاس</span>
        <span className="text-center">التكلفة</span>
        <span className="text-center">السعر</span>
        <span className="text-center">الربح</span>
        <span className="text-center">الهامش</span>
        <span className="w-16" />
      </div>

      <div className="space-y-2">
        {sizes.map((s, i) => {
          const profit = (s.price || 0) - (s.cost || 0);
          const margin = s.cost > 0 ? (profit / s.cost) * 100 : 0;
          const lossWarning = s.price > 0 && s.cost > 0 && s.price < s.cost;

          return (
            <div
              key={i}
              className={`grid grid-cols-2 md:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_auto] gap-2 items-center p-2.5 rounded-lg border ${
                lossWarning ? "border-red-500/40 bg-red-500/5" : "border-border bg-muted/30"
              }`}
            >
              <Input
                value={s.size}
                onChange={(e) => update(i, "size", e.target.value)}
                placeholder="مثال: M"
                className="text-center font-medium h-9"
              />
              <Input
                type="number"
                value={s.cost || ""}
                onChange={(e) => update(i, "cost", parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="text-center h-9"
              />
              <Input
                type="number"
                value={s.price || ""}
                onChange={(e) => update(i, "price", parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="text-center h-9 font-semibold"
              />
              <div className="text-center text-sm font-semibold">
                <span className={profit >= 0 ? "text-emerald-600" : "text-red-600"}>
                  {profit.toLocaleString()}
                </span>
              </div>
              <div className="text-center">
                <Badge variant="outline" className={`text-[10px] border ${marginColor(margin)}`}>
                  {margin.toFixed(0)}%
                </Badge>
              </div>
              <div className="flex gap-1 justify-end col-span-2 md:col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => duplicate(i)}
                  title="نسخ المقاس"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => remove(i)}
                  disabled={sizes.length === 1}
                  title="حذف"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {lossWarning && (
                <p className="col-span-full text-[11px] text-red-600 px-1">
                  ⚠ السعر أقل من التكلفة — ستحقق خسارة على هذا المقاس.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SizesEditorTable;
