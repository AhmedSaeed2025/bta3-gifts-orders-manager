import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Package,
  FolderOpen,
  Eye,
  EyeOff,
  FolderPlus,
  Settings,
  LayoutGrid,
  List as ListIcon,
  Layers,
  GripVertical,
  Copy,
  TrendingUp,
  X,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import SizesEditorTable, { SizeRow } from "./products/SizesEditorTable";
import ProductImportExport from "./products/ProductImportExport";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  category_id?: string | null;
  is_active: boolean;
  featured: boolean;
  sort_order?: number | null;
  product_sizes: SizeRow[] & { id?: string }[];
}
interface Category {
  id: string;
  name: string;
  description?: string | null;
}

type ViewMode = "grid" | "list" | "category";
type SortMode = "manual" | "newest" | "name" | "profit" | "price";

const VIEW_KEY = "products_view_mode";
const SORT_KEY = "products_sort_mode";

const ProductsManagementProV2 = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const qc = useQueryClient();

  // Filters / view
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>(
    (localStorage.getItem(VIEW_KEY) as ViewMode) || "category"
  );
  const [sortMode, setSortMode] = useState<SortMode>(
    (localStorage.getItem(SORT_KEY) as SortMode) || "manual"
  );

  useEffect(() => localStorage.setItem(VIEW_KEY, viewMode), [viewMode]);
  useEffect(() => localStorage.setItem(SORT_KEY, sortMode), [sortMode]);

  // Selection (bulk)
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Dialogs
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });

  // Form
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: "",
    is_active: true,
    sizes: [{ size: "", cost: 0, price: 0 }] as SizeRow[],
  });

  // Queries
  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ["products-management-v2", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("products")
        .select(`*, product_sizes(*)`)
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("name");
      if (error) throw error;
      return (data as any) || [];
    },
    enabled: !!user,
  });

  const { data: categories = [], refetch: refetchCategories } = useQuery({
    queryKey: ["categories-management-v2", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .order("name");
      if (error) throw error;
      return (data as Category[]) || [];
    },
    enabled: !!user,
  });

  // Stats
  const stats = useMemo(() => {
    const activeCount = products.filter((p: Product) => p.is_active).length;
    const hiddenCount = products.length - activeCount;
    const totalSizes = products.reduce((s: number, p: Product) => s + (p.product_sizes?.length || 0), 0);
    let marginSum = 0;
    let marginN = 0;
    products.forEach((p: Product) =>
      p.product_sizes?.forEach((s) => {
        if (s.cost > 0 && s.price > 0) {
          marginSum += ((s.price - s.cost) / s.cost) * 100;
          marginN++;
        }
      })
    );
    const avgMargin = marginN ? marginSum / marginN : 0;
    return {
      total: products.length,
      active: activeCount,
      hidden: hiddenCount,
      categories: categories.length,
      totalSizes,
      avgMargin,
    };
  }, [products, categories]);

  // Filter + sort
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    let list = products.filter((p: Product) => {
      const okSearch =
        !s ||
        p.name?.toLowerCase().includes(s) ||
        p.description?.toLowerCase().includes(s) ||
        p.product_sizes?.some((sz) => sz.size?.toLowerCase().includes(s));
      const okCat =
        categoryFilter === "all" ||
        (categoryFilter === "uncategorized" && !p.category_id) ||
        p.category_id === categoryFilter;
      const okStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && p.is_active) ||
        (statusFilter === "hidden" && !p.is_active);
      return okSearch && okCat && okStatus;
    });

    const productAvgMargin = (p: Product) => {
      const arr = p.product_sizes?.filter((s) => s.cost > 0) || [];
      if (!arr.length) return 0;
      return arr.reduce((sum, s) => sum + ((s.price - s.cost) / s.cost) * 100, 0) / arr.length;
    };
    const productMaxPrice = (p: Product) =>
      Math.max(0, ...(p.product_sizes?.map((s) => s.price) || [0]));

    if (sortMode === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name, "ar"));
    else if (sortMode === "profit")
      list = [...list].sort((a, b) => productAvgMargin(b) - productAvgMargin(a));
    else if (sortMode === "price")
      list = [...list].sort((a, b) => productMaxPrice(b) - productMaxPrice(a));
    // manual / newest stays in DB order

    return list;
  }, [products, search, categoryFilter, statusFilter, sortMode]);

  // Group by category for category view
  const grouped = useMemo(() => {
    const map: Record<string, { category: Category | null; products: Product[] }> = {
      uncategorized: { category: null, products: [] },
    };
    categories.forEach((c) => (map[c.id] = { category: c, products: [] }));
    filtered.forEach((p: Product) => {
      const k = p.category_id || "uncategorized";
      if (!map[k]) map["uncategorized"].products.push(p);
      else map[k].products.push(p);
    });
    return map;
  }, [filtered, categories]);

  // ----- Handlers -----
  const resetForm = () =>
    setFormData({
      name: "",
      description: "",
      category_id: "",
      is_active: true,
      sizes: [{ size: "", cost: 0, price: 0 }],
    });

  const openCreate = () => {
    setEditingProduct(null);
    resetForm();
    setProductDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      description: p.description || "",
      category_id: p.category_id || "",
      is_active: p.is_active,
      sizes:
        p.product_sizes?.length > 0
          ? p.product_sizes.map((s) => ({ size: s.size, cost: s.cost, price: s.price }))
          : [{ size: "", cost: 0, price: 0 }],
    });
    setProductDialogOpen(true);
  };

  const duplicateProduct = async (p: Product) => {
    if (!user) return;
    try {
      const { data: prod, error } = await supabase
        .from("products")
        .insert({
          name: `${p.name} (نسخة)`,
          description: p.description,
          category_id: p.category_id,
          is_active: p.is_active,
          user_id: user.id,
        })
        .select()
        .single();
      if (error || !prod) throw error;

      if (p.product_sizes?.length) {
        await supabase.from("product_sizes").insert(
          p.product_sizes.map((s) => ({
            product_id: prod.id,
            size: s.size,
            cost: s.cost,
            price: s.price,
          }))
        );
      }
      toast.success("تم نسخ المنتج");
      refetch();
    } catch {
      toast.error("فشل نسخ المنتج");
    }
  };

  const submitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("يرجى إدخال اسم المنتج");
      return;
    }
    try {
      const payload: any = {
        name: formData.name,
        description: formData.description || null,
        category_id:
          formData.category_id && formData.category_id !== "no-category"
            ? formData.category_id
            : null,
        is_active: formData.is_active,
        user_id: user?.id,
      };
      let productId: string;
      if (editingProduct) {
        const { data, error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editingProduct.id)
          .select()
          .single();
        if (error) throw error;
        productId = data.id;
        await supabase.from("product_sizes").delete().eq("product_id", productId);
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        productId = data.id;
      }

      const validSizes = formData.sizes.filter((s) => s.size.trim() && s.price > 0);
      if (validSizes.length) {
        const { error: sErr } = await supabase.from("product_sizes").insert(
          validSizes.map((s) => ({
            product_id: productId,
            size: s.size,
            cost: s.cost,
            price: s.price,
          }))
        );
        if (sErr) throw sErr;
      }

      toast.success(editingProduct ? "تم تحديث المنتج" : "تم إضافة المنتج");
      setProductDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      refetch();
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ في حفظ المنتج");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await supabase.from("product_sizes").delete().eq("product_id", deleteId);
      await supabase.from("products").delete().eq("id", deleteId);
      toast.success("تم حذف المنتج");
      setDeleteId(null);
      refetch();
    } catch {
      toast.error("فشل حذف المنتج");
    }
  };

  const toggleVisibility = async (p: Product) => {
    try {
      await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id);
      toast.success(p.is_active ? "تم إخفاء المنتج" : "تم إظهار المنتج");
      refetch();
    } catch {
      toast.error("فشل تحديث الحالة");
    }
  };

  const saveCategory = async () => {
    if (!categoryForm.name.trim()) return toast.error("اسم الفئة مطلوب");
    try {
      if (editingCategory) {
        await supabase
          .from("categories")
          .update({ name: categoryForm.name, description: categoryForm.description })
          .eq("id", editingCategory.id);
        toast.success("تم تحديث الفئة");
      } else {
        await supabase.from("categories").insert({
          name: categoryForm.name,
          description: categoryForm.description,
          user_id: user?.id,
        });
        toast.success("تم إضافة الفئة");
      }
      setCategoryForm({ name: "", description: "" });
      setEditingCategory(null);
      refetchCategories();
    } catch {
      toast.error("فشل حفظ الفئة");
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await supabase.from("categories").delete().eq("id", id);
      toast.success("تم حذف الفئة");
      refetchCategories();
      refetch();
    } catch {
      toast.error("فشل حذف الفئة");
    }
  };

  // Bulk actions
  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const selectAllVisible = () => setSelected(new Set(filtered.map((p: Product) => p.id)));
  const clearSelection = () => setSelected(new Set());

  const bulkSetStatus = async (active: boolean) => {
    if (!selected.size) return;
    try {
      await supabase
        .from("products")
        .update({ is_active: active })
        .in("id", Array.from(selected));
      toast.success(`تم ${active ? "إظهار" : "إخفاء"} ${selected.size} منتج`);
      clearSelection();
      refetch();
    } catch {
      toast.error("فشلت العملية");
    }
  };
  const bulkMoveCategory = async (categoryId: string) => {
    if (!selected.size) return;
    try {
      await supabase
        .from("products")
        .update({ category_id: categoryId === "no-category" ? null : categoryId })
        .in("id", Array.from(selected));
      toast.success(`تم نقل ${selected.size} منتج`);
      clearSelection();
      refetch();
    } catch {
      toast.error("فشل النقل");
    }
  };
  const bulkDelete = async () => {
    if (!selected.size) return;
    try {
      const ids = Array.from(selected);
      await supabase.from("product_sizes").delete().in("product_id", ids);
      await supabase.from("products").delete().in("id", ids);
      toast.success(`تم حذف ${ids.length} منتج`);
      clearSelection();
      setBulkDeleteOpen(false);
      refetch();
    } catch {
      toast.error("فشل الحذف الجماعي");
    }
  };

  // Drag and drop sorting (manual mode only)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = async (e: DragEndEvent, scopedItems: Product[]) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = scopedItems.findIndex((p) => p.id === active.id);
    const newIndex = scopedItems.findIndex((p) => p.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(scopedItems, oldIndex, newIndex);

    // Optimistic update via cache
    qc.setQueryData(["products-management-v2", user?.id], (old: any) => {
      if (!old) return old;
      const ids = new Set(reordered.map((p) => p.id));
      const others = old.filter((p: Product) => !ids.has(p.id));
      const ordered = reordered.map((p, i) => ({ ...p, sort_order: i }));
      return [...ordered, ...others];
    });

    // Persist
    await Promise.all(
      reordered.map((p, i) =>
        supabase.from("products").update({ sort_order: i }).eq("id", p.id)
      )
    );
  };

  // ----- Render helpers -----
  const renderProductCard = (p: Product, dragHandle?: React.ReactNode) => {
    const prices = p.product_sizes?.map((s) => s.price).filter((v) => v > 0) || [];
    const minP = prices.length ? Math.min(...prices) : 0;
    const maxP = prices.length ? Math.max(...prices) : 0;
    const margins = (p.product_sizes || [])
      .filter((s) => s.cost > 0 && s.price > 0)
      .map((s) => ((s.price - s.cost) / s.cost) * 100);
    const avgMargin = margins.length ? margins.reduce((a, b) => a + b, 0) / margins.length : 0;
    const isSel = selected.has(p.id);

    return (
      <div
        className={`group relative rounded-xl border bg-card transition-all hover:shadow-md ${
          isSel ? "ring-2 ring-primary border-primary" : "border-border/60"
        } ${!p.is_active ? "opacity-70" : ""}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-3 gap-2">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <Checkbox
              checked={isSel}
              onCheckedChange={() => toggleSelect(p.id)}
              className="mt-1"
            />
            {dragHandle}
            <div className="min-w-0">
              <h4 className="font-semibold text-sm truncate">{p.name}</h4>
              {p.description && (
                <p className="text-[11px] text-muted-foreground line-clamp-1">{p.description}</p>
              )}
              <div className="flex items-center gap-1 flex-wrap mt-1">
                {!p.is_active && (
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                    مخفي
                  </Badge>
                )}
                {p.featured && (
                  <Badge className="text-[9px] px-1.5 py-0 bg-amber-500 hover:bg-amber-500">
                    مميّز
                  </Badge>
                )}
                <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                  {p.product_sizes?.length || 0} مقاس
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => toggleVisibility(p)}
              title={p.is_active ? "إخفاء" : "إظهار"}
            >
              {p.is_active ? (
                <Eye className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => openEdit(p)}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => duplicateProduct(p)}
              title="نسخ"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => setDeleteId(p.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Price/Margin summary */}
        <div className="px-3 pb-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-[10px] text-muted-foreground">السعر</p>
            <p className="text-sm font-bold text-primary leading-tight">
              {prices.length === 0
                ? "—"
                : minP === maxP
                ? formatCurrency(minP)
                : `${formatCurrency(minP)} - ${formatCurrency(maxP)}`}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-[10px] text-muted-foreground">متوسط الهامش</p>
            <p
              className={`text-sm font-bold leading-tight ${
                avgMargin >= 30
                  ? "text-emerald-600"
                  : avgMargin >= 15
                  ? "text-amber-600"
                  : "text-red-600"
              }`}
            >
              {margins.length ? `${avgMargin.toFixed(0)}%` : "—"}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const SortableProductRow = ({ p }: { p: Product }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: p.id,
    });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };
    const handle = sortMode === "manual" ? (
      <button
        ref={setNodeRef as any}
        {...attributes}
        {...listeners}
        className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        title="اسحب لإعادة الترتيب"
      >
        <GripVertical className="h-4 w-4" />
      </button>
    ) : null;
    return (
      <div ref={setNodeRef} style={style}>
        {renderProductCard(p, handle)}
      </div>
    );
  };

  // ===== JSX =====
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4 md:space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
          <StatCard color="primary" label="إجمالي المنتجات" value={stats.total} icon={Package} />
          <StatCard color="emerald" label="نشطة" value={stats.active} icon={Eye} />
          <StatCard color="muted" label="مخفية" value={stats.hidden} icon={EyeOff} />
          <StatCard color="blue" label="الفئات" value={stats.categories} icon={FolderOpen} />
          <StatCard color="violet" label="إجمالي المقاسات" value={stats.totalSizes} icon={Layers} />
          <StatCard
            color={stats.avgMargin >= 30 ? "emerald" : stats.avgMargin >= 15 ? "amber" : "red"}
            label="متوسط الهامش"
            value={`${stats.avgMargin.toFixed(0)}%`}
            icon={TrendingUp}
          />
        </div>

        {/* Toolbar */}
        <Card className="border-border/60">
          <CardContent className="p-3 md:p-4 space-y-3">
            <div className="flex flex-col lg:flex-row gap-2 lg:items-center lg:justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">إدارة المنتجات</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <ProductImportExport
                  products={products}
                  categories={categories}
                  onImported={() => {
                    refetch();
                    refetchCategories();
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryForm({ name: "", description: "" });
                    setCategoryDialogOpen(true);
                  }}
                  className="gap-1.5"
                >
                  <FolderPlus className="h-4 w-4" />
                  إدارة الفئات
                </Button>
                <Button size="sm" onClick={openCreate} className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  منتج جديد
                </Button>
              </div>
            </div>

            <div className="grid gap-2 grid-cols-1 md:grid-cols-12">
              <div className="relative md:col-span-4">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث بالاسم أو الوصف أو المقاس..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="md:col-span-2"><SelectValue placeholder="الفئة" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفئات</SelectItem>
                  <SelectItem value="uncategorized">بدون فئة</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="md:col-span-2"><SelectValue placeholder="الحالة" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="hidden">مخفي</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
                <SelectTrigger className="md:col-span-2"><SelectValue placeholder="ترتيب" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">يدوي (Drag & Drop)</SelectItem>
                  <SelectItem value="name">أبجدي</SelectItem>
                  <SelectItem value="profit">الأعلى ربحية</SelectItem>
                  <SelectItem value="price">الأعلى سعراً</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-1 md:col-span-2 justify-end">
                <ViewToggle current={viewMode} mode="category" onClick={() => setViewMode("category")} icon={Layers} label="فئات" />
                <ViewToggle current={viewMode} mode="grid" onClick={() => setViewMode("grid")} icon={LayoutGrid} label="بطاقات" />
                <ViewToggle current={viewMode} mode="list" onClick={() => setViewMode("list")} icon={ListIcon} label="قائمة" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="sticky top-2 z-20 flex flex-wrap items-center gap-2 p-3 rounded-xl border border-primary/40 bg-primary/5 backdrop-blur shadow-sm">
            <Badge className="bg-primary text-primary-foreground">{selected.size} محدد</Badge>
            <Button size="sm" variant="outline" onClick={() => bulkSetStatus(true)}>
              <Eye className="h-3.5 w-3.5 ml-1" />إظهار
            </Button>
            <Button size="sm" variant="outline" onClick={() => bulkSetStatus(false)}>
              <EyeOff className="h-3.5 w-3.5 ml-1" />إخفاء
            </Button>
            <Select onValueChange={bulkMoveCategory}>
              <SelectTrigger className="h-9 w-40"><SelectValue placeholder="نقل لفئة..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="no-category">بدون فئة</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 className="h-3.5 w-3.5 ml-1" />حذف
            </Button>
            <Button size="sm" variant="ghost" onClick={selectAllVisible}>تحديد المعروضين</Button>
            <Button size="sm" variant="ghost" onClick={clearSelection} className="ml-auto">
              <X className="h-3.5 w-3.5 ml-1" />إلغاء التحديد
            </Button>
          </div>
        )}

        {/* Content by view mode */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center">
              <Package className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">لا توجد منتجات مطابقة</p>
              <Button onClick={openCreate} size="sm" className="mt-3">
                <Plus className="h-4 w-4 ml-1" />أضف أول منتج
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === "category" ? (
          <div className="space-y-3">
            {Object.entries(grouped).map(([key, { category, products: list }]) => {
              if (!list.length && key !== "uncategorized") return null;
              if (!list.length) return null;
              return (
                <Card key={key} className="overflow-hidden border-border/60">
                  <div className="flex items-center justify-between p-3 md:p-4 bg-muted/30 border-b">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg ${category ? "bg-primary/10" : "bg-muted"}`}>
                        <FolderOpen className={`h-4 w-4 ${category ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm md:text-base">{category?.name || "بدون فئة"}</h3>
                        {category?.description && (
                          <p className="text-xs text-muted-foreground">{category.description}</p>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs">{list.length} منتج</Badge>
                    </div>
                    {category && (
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => {
                          setEditingCategory(category);
                          setCategoryForm({ name: category.name, description: category.description || "" });
                          setCategoryDialogOpen(true);
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="p-3">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(e) => handleDragEnd(e, list)}
                    >
                      <SortableContext items={list.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                        <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"}`}>
                          {list.map((p) => <SortableProductRow key={p.id} p={p} />)}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : viewMode === "grid" ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, filtered)}>
            <SortableContext items={filtered.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"}`}>
                {filtered.map((p) => <SortableProductRow key={p.id} p={p} />)}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          // List / table view
          <Card className="border-border/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="p-3 text-right w-10"></th>
                    <th className="p-3 text-right">المنتج</th>
                    <th className="p-3 text-right">الفئة</th>
                    <th className="p-3 text-center">المقاسات</th>
                    <th className="p-3 text-center">نطاق السعر</th>
                    <th className="p-3 text-center">متوسط الهامش</th>
                    <th className="p-3 text-center">الحالة</th>
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p: Product) => {
                    const prices = p.product_sizes?.map((s) => s.price).filter(Boolean) || [];
                    const minP = prices.length ? Math.min(...prices) : 0;
                    const maxP = prices.length ? Math.max(...prices) : 0;
                    const margins = (p.product_sizes || [])
                      .filter((s) => s.cost > 0 && s.price > 0)
                      .map((s) => ((s.price - s.cost) / s.cost) * 100);
                    const avgMargin = margins.length ? margins.reduce((a, b) => a + b, 0) / margins.length : 0;
                    const cat = categories.find((c) => c.id === p.category_id)?.name || "—";
                    return (
                      <tr key={p.id} className="border-t hover:bg-muted/20">
                        <td className="p-3">
                          <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} />
                        </td>
                        <td className="p-3 font-medium">{p.name}</td>
                        <td className="p-3 text-muted-foreground">{cat}</td>
                        <td className="p-3 text-center">{p.product_sizes?.length || 0}</td>
                        <td className="p-3 text-center font-medium text-primary">
                          {prices.length === 0 ? "—" : minP === maxP ? formatCurrency(minP) : `${formatCurrency(minP)} - ${formatCurrency(maxP)}`}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`font-semibold ${avgMargin >= 30 ? "text-emerald-600" : avgMargin >= 15 ? "text-amber-600" : "text-red-600"}`}>
                            {margins.length ? `${avgMargin.toFixed(0)}%` : "—"}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant={p.is_active ? "default" : "secondary"} className="text-[10px]">
                            {p.is_active ? "نشط" : "مخفي"}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleVisibility(p)}>
                              {p.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateProduct(p)}>
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(p.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Product Dialog */}
        <Dialog
          open={productDialogOpen}
          onOpenChange={(o) => {
            // Memory rule: dialogs do not auto-close. Only allow open/explicit cancel.
            if (!o) return;
            setProductDialogOpen(true);
          }}
        >
          <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>{editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={submitProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>اسم المنتج *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label>الفئة</Label>
                  <Select
                    value={formData.category_id || undefined}
                    onValueChange={(v) => setFormData((p) => ({ ...p, category_id: v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-category">بدون فئة</SelectItem>
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>الوصف (اختياري)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData((p) => ({ ...p, is_active: !!v }))}
                />
                <Label htmlFor="is_active" className="cursor-pointer">المنتج نشط ويظهر في المتجر</Label>
              </div>

              <div className="border-t pt-4">
                <SizesEditorTable
                  sizes={formData.sizes}
                  onChange={(s) => setFormData((p) => ({ ...p, sizes: s }))}
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-2">
                <Button type="button" variant="outline" onClick={() => { setProductDialogOpen(false); setEditingProduct(null); resetForm(); }}>
                  إلغاء
                </Button>
                <Button type="submit">{editingProduct ? "تحديث المنتج" : "إضافة المنتج"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Category Dialog */}
        <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingCategory ? "تعديل فئة" : "إدارة الفئات"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>اسم الفئة</Label>
                <Input
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="ملابس، إلكترونيات، هدايا..."
                />
              </div>
              <div>
                <Label>وصف (اختياري)</Label>
                <Input
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveCategory} className="flex-1">
                  {editingCategory ? "تحديث" : "إضافة"}
                </Button>
                {editingCategory && (
                  <Button
                    variant="outline"
                    onClick={() => { setEditingCategory(null); setCategoryForm({ name: "", description: "" }); }}
                  >
                    إلغاء التعديل
                  </Button>
                )}
              </div>

              {categories.length > 0 && (
                <div className="border-t pt-3">
                  <h4 className="font-medium mb-2 text-sm">الفئات الحالية</h4>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {categories.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-2 bg-muted/40 rounded-lg">
                        <span className="text-sm">{c.name}</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => { setEditingCategory(c); setCategoryForm({ name: c.name, description: c.description || "" }); }}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                            onClick={() => deleteCategory(c.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>حذف المنتج</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم حذف المنتج وكل مقاساته بشكل نهائي. هل تريد المتابعة؟
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                حذف نهائي
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk delete confirmation */}
        <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>حذف {selected.size} منتج</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم حذف جميع المنتجات المحددة ومقاساتها نهائياً.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={bulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                حذف نهائي
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};

const ViewToggle = ({
  current, mode, onClick, icon: Icon, label,
}: {
  current: ViewMode; mode: ViewMode; onClick: () => void; icon: React.ElementType; label: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        type="button"
        size="icon"
        variant={current === mode ? "default" : "outline"}
        onClick={onClick}
        className="h-9 w-9"
      >
        <Icon className="h-4 w-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);

const STAT_COLORS: Record<string, string> = {
  primary: "from-primary/10 to-primary/5 border-primary/20 text-primary",
  emerald: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-600",
  blue: "from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-600",
  violet: "from-violet-500/10 to-violet-500/5 border-violet-500/20 text-violet-600",
  amber: "from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-600",
  red: "from-red-500/10 to-red-500/5 border-red-500/20 text-red-600",
  muted: "from-muted to-muted/40 border-border text-muted-foreground",
};

const StatCard = ({
  color, label, value, icon: Icon,
}: {
  color: keyof typeof STAT_COLORS; label: string; value: number | string; icon: React.ElementType;
}) => (
  <Card className={`bg-gradient-to-br border ${STAT_COLORS[color]}`}>
    <CardContent className="p-2.5 md:p-3 text-center">
      <Icon className="h-4 w-4 md:h-5 md:w-5 mx-auto mb-1 opacity-80" />
      <p className="text-base md:text-xl font-bold leading-tight">{value}</p>
      <p className="text-[10px] md:text-[11px] opacity-80 leading-tight">{label}</p>
    </CardContent>
  </Card>
);

export default ProductsManagementProV2;
