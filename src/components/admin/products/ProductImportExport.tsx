import React, { useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Download, Upload, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  category_id?: string | null;
  is_active: boolean;
  product_sizes?: { size: string; cost: number; price: number }[];
}
interface Category {
  id: string;
  name: string;
}

interface Props {
  products: Product[];
  categories: Category[];
  onImported: () => void;
}

const ProductImportExport = ({ products, categories, onImported }: Props) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ----------- Export -----------
  const exportToXlsx = () => {
    const rows: any[] = [];
    products.forEach((p) => {
      const catName = categories.find((c) => c.id === p.category_id)?.name || "";
      if (!p.product_sizes?.length) {
        rows.push({
          "اسم المنتج": p.name,
          الفئة: catName,
          الوصف: p.description || "",
          المقاس: "",
          التكلفة: "",
          السعر: "",
          الحالة: p.is_active ? "نشط" : "مخفي",
        });
      } else {
        p.product_sizes.forEach((s) => {
          rows.push({
            "اسم المنتج": p.name,
            الفئة: catName,
            الوصف: p.description || "",
            المقاس: s.size,
            التكلفة: s.cost,
            السعر: s.price,
            الحالة: p.is_active ? "نشط" : "مخفي",
          });
        });
      }
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 24 }, { wch: 16 }, { wch: 30 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المنتجات");
    XLSX.writeFile(wb, `products_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success(`تم تصدير ${rows.length} صف بنجاح`);
  };

  const downloadTemplate = () => {
    const sample = [
      { "اسم المنتج": "تيشيرت قطني", الفئة: "ملابس", الوصف: "قطن 100%", المقاس: "S", التكلفة: 80, السعر: 150, الحالة: "نشط" },
      { "اسم المنتج": "تيشيرت قطني", الفئة: "ملابس", الوصف: "قطن 100%", المقاس: "M", التكلفة: 80, السعر: 160, الحالة: "نشط" },
      { "اسم المنتج": "تيشيرت قطني", الفئة: "ملابس", الوصف: "قطن 100%", المقاس: "L", التكلفة: 90, السعر: 180, الحالة: "نشط" },
      { "اسم المنتج": "كوب سحري", الفئة: "هدايا", الوصف: "", المقاس: "افتراضي", التكلفة: 35, السعر: 90, الحالة: "نشط" },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    ws["!cols"] = [{ wch: 24 }, { wch: 16 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "products_import_template.xlsx");
    toast.success("تم تحميل النموذج");
  };

  // ----------- Import -----------
  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;

    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

      if (!rows.length) {
        toast.error("الملف فارغ");
        return;
      }

      // Group rows by product name
      const grouped = new Map<string, { meta: any; sizes: any[] }>();
      for (const r of rows) {
        const name = String(r["اسم المنتج"] || r["name"] || "").trim();
        if (!name) continue;
        const cat = String(r["الفئة"] || r["category"] || "").trim();
        const desc = String(r["الوصف"] || r["description"] || "").trim();
        const sizeName = String(r["المقاس"] || r["size"] || "").trim();
        const cost = Number(r["التكلفة"] ?? r["cost"] ?? 0) || 0;
        const price = Number(r["السعر"] ?? r["price"] ?? 0) || 0;
        const statusVal = String(r["الحالة"] || r["status"] || "نشط").trim();
        const isActive = !["مخفي", "غير نشط", "inactive", "hidden", "0", "false"].includes(statusVal);

        if (!grouped.has(name)) {
          grouped.set(name, { meta: { name, category: cat, description: desc, isActive }, sizes: [] });
        }
        if (sizeName || price > 0) {
          grouped.get(name)!.sizes.push({ size: sizeName || "افتراضي", cost, price });
        }
      }

      // Build category map (by name → id), creating missing ones
      const catMap = new Map<string, string>();
      categories.forEach((c) => catMap.set(c.name.toLowerCase(), c.id));
      const newCatNames = new Set<string>();
      grouped.forEach((g) => {
        if (g.meta.category && !catMap.has(g.meta.category.toLowerCase())) {
          newCatNames.add(g.meta.category);
        }
      });

      for (const cn of newCatNames) {
        const { data, error } = await supabase
          .from("categories")
          .insert({ name: cn, user_id: user.id })
          .select()
          .single();
        if (!error && data) catMap.set(cn.toLowerCase(), data.id);
      }

      let created = 0;
      let failed = 0;

      for (const [, g] of grouped) {
        try {
          const categoryId = g.meta.category ? catMap.get(g.meta.category.toLowerCase()) || null : null;
          const { data: prod, error: prodErr } = await supabase
            .from("products")
            .insert({
              name: g.meta.name,
              description: g.meta.description || null,
              category_id: categoryId,
              is_active: g.meta.isActive,
              user_id: user.id,
            })
            .select()
            .single();

          if (prodErr || !prod) {
            failed++;
            continue;
          }

          if (g.sizes.length) {
            const sizesPayload = g.sizes.map((s) => ({
              product_id: prod.id,
              size: s.size,
              cost: s.cost,
              price: s.price,
            }));
            await supabase.from("product_sizes").insert(sizesPayload);
          }
          created++;
        } catch {
          failed++;
        }
      }

      toast.success(
        `تم استيراد ${created} منتج${failed > 0 ? ` — فشل ${failed} منتج` : ""}`
      );
      onImported();
    } catch (err) {
      console.error(err);
      toast.error("فشل قراءة الملف. تأكد من صيغة Excel الصحيحة.");
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileChosen}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <FileSpreadsheet className="h-4 w-4" />
            استيراد / تصدير
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Excel</DropdownMenuLabel>
          <DropdownMenuItem onClick={exportToXlsx}>
            <Download className="h-4 w-4 ml-2" />
            تصدير المنتجات إلى Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 ml-2" />
            استيراد من ملف Excel
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={downloadTemplate}>
            <Download className="h-4 w-4 ml-2" />
            تنزيل نموذج Excel فارغ
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default ProductImportExport;
