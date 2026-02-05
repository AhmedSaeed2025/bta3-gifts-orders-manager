
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";
import { Plus, Edit, Trash2, Search, Package, ChevronDown, ChevronUp, FolderOpen, Layers, Tag, DollarSign, TrendingUp, Eye, EyeOff, FolderPlus, Settings } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  category_id?: string;
  is_active: boolean;
  featured: boolean;
  product_sizes: ProductSize[];
}

interface ProductSize {
  id: string;
  size: string;
  cost: number;
  price: number;
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

const ProductsManagementPro = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['uncategorized']));
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    sizes: [{ size: '', cost: 0, price: 0 }]
  });

  // Fetch products
  const { data: products = [], isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['products-management'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_sizes (*)
        `)
        .eq('user_id', user.id)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Fetch categories
  const { data: categories = [], refetch: refetchCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Group products by category
  const groupedProducts = React.useMemo(() => {
    const groups: { [key: string]: { category: Category | null; products: Product[] } } = {};
    
    // Initialize with uncategorized
    groups['uncategorized'] = { category: null, products: [] };
    
    // Initialize categories
    categories.forEach((cat: Category) => {
      groups[cat.id] = { category: cat, products: [] };
    });
    
    // Filter and group products
    const filtered = products.filter((product: Product) => {
      const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || 
        (categoryFilter === 'uncategorized' && !product.category_id) ||
        product.category_id === categoryFilter;
      return matchesSearch && matchesCategory;
    });
    
    filtered.forEach((product: Product) => {
      const key = product.category_id || 'uncategorized';
      if (groups[key]) {
        groups[key].products.push(product);
      } else {
        groups['uncategorized'].products.push(product);
      }
    });
    
    return groups;
  }, [products, categories, searchTerm, categoryFilter]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const expandAllCategories = () => {
    const allIds = new Set(['uncategorized', ...categories.map((c: Category) => c.id)]);
    setExpandedCategories(allIds);
  };

  const collapseAllCategories = () => {
    setExpandedCategories(new Set());
  };

  // Category CRUD
  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error('يرجى إدخال اسم الفئة');
      return;
    }

    try {
      if (editingCategory) {
        await supabase
          .from('categories')
          .update({ name: categoryForm.name, description: categoryForm.description })
          .eq('id', editingCategory.id);
        toast.success('تم تحديث الفئة');
      } else {
        await supabase
          .from('categories')
          .insert({ name: categoryForm.name, description: categoryForm.description, user_id: user?.id });
        toast.success('تم إضافة الفئة');
      }
      
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '' });
      refetchCategories();
    } catch (error) {
      toast.error('حدث خطأ في حفظ الفئة');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الفئة؟')) return;
    
    try {
      await supabase.from('categories').delete().eq('id', categoryId);
      toast.success('تم حذف الفئة');
      refetchCategories();
      refetchProducts();
    } catch (error) {
      toast.error('حدث خطأ في حذف الفئة');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('يرجى إدخال اسم المنتج');
      return;
    }

    try {
      let productData: any = {
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id && formData.category_id !== 'no-category' ? formData.category_id : null,
        user_id: user?.id
      };

      let productId: string;

      if (editingProduct) {
        const { data, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)
          .select()
          .single();

        if (error) throw error;
        productId = data.id;

        await supabase
          .from('product_sizes')
          .delete()
          .eq('product_id', productId);
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();

        if (error) throw error;
        productId = data.id;
      }

      const sizesData = formData.sizes
        .filter(size => size.size.trim() && size.price > 0)
        .map(size => ({
          product_id: productId,
          size: size.size,
          cost: size.cost,
          price: size.price
        }));

      if (sizesData.length > 0) {
        const { error: sizesError } = await supabase
          .from('product_sizes')
          .insert(sizesData);

        if (sizesError) throw sizesError;
      }

      toast.success(editingProduct ? 'تم تحديث المنتج بنجاح' : 'تم إضافة المنتج بنجاح');
      
      setIsDialogOpen(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        category_id: '',
        sizes: [{ size: '', cost: 0, price: 0 }]
      });
      
      refetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('حدث خطأ في حفظ المنتج');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      category_id: product.category_id || '',
      sizes: product.product_sizes?.length > 0 
        ? product.product_sizes.map(size => ({
            size: size.size,
            cost: size.cost,
            price: size.price
          }))
        : [{ size: '', cost: 0, price: 0 }]
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

    try {
      await supabase
        .from('product_sizes')
        .delete()
        .eq('product_id', productId);

      await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      toast.success('تم حذف المنتج بنجاح');
      refetchProducts();
    } catch (error) {
      toast.error('حدث خطأ في حذف المنتج');
    }
  };

  const toggleProductVisibility = async (productId: string, isActive: boolean) => {
    try {
      await supabase
        .from('products')
        .update({ is_active: !isActive })
        .eq('id', productId);
      
      toast.success(isActive ? 'تم إخفاء المنتج' : 'تم إظهار المنتج');
      refetchProducts();
    } catch (error) {
      toast.error('حدث خطأ في تحديث حالة المنتج');
    }
  };

  const addSizeField = () => {
    setFormData(prev => ({
      ...prev,
      sizes: [...prev.sizes, { size: '', cost: 0, price: 0 }]
    }));
  };

  const removeSizeField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index)
    }));
  };

  const updateSizeField = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.map((size, i) => 
        i === index ? { ...size, [field]: value } : size
      )
    }));
  };

  // Stats
  const totalProducts = products.length;
  const totalCategories = categories.length;
  const activeProducts = products.filter((p: Product) => p.is_active).length;

  if (productsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats Cards */}
      <div className={`grid gap-3 ${isMobile ? 'grid-cols-3' : 'grid-cols-3 md:grid-cols-6'}`}>
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-3 md:p-4 text-center">
            <Package className="h-5 w-5 md:h-6 md:w-6 mx-auto mb-1 text-primary" />
            <p className="text-lg md:text-2xl font-bold text-primary">{totalProducts}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground">إجمالي المنتجات</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-3 md:p-4 text-center">
            <FolderOpen className="h-5 w-5 md:h-6 md:w-6 mx-auto mb-1 text-blue-500" />
            <p className="text-lg md:text-2xl font-bold text-blue-500">{totalCategories}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground">الفئات</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-3 md:p-4 text-center">
            <Eye className="h-5 w-5 md:h-6 md:w-6 mx-auto mb-1 text-green-500" />
            <p className="text-lg md:text-2xl font-bold text-green-500">{activeProducts}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground">منتجات نشطة</p>
          </CardContent>
        </Card>
      </div>

      {/* Header & Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              <CardTitle className="text-lg md:text-2xl">إدارة المنتجات</CardTitle>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {/* Category Dialog */}
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryForm({ name: '', description: '' });
                    }}
                  >
                    <FolderPlus className="h-4 w-4 ml-1" />
                    <span className={isMobile ? 'hidden' : ''}>إدارة الفئات</span>
                    <span className={isMobile ? '' : 'hidden'}>فئة</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingCategory ? 'تعديل فئة' : 'إضافة فئة جديدة'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>اسم الفئة</Label>
                      <Input
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="مثال: ملابس، إلكترونيات"
                      />
                    </div>
                    <div>
                      <Label>وصف الفئة (اختياري)</Label>
                      <Input
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="وصف مختصر للفئة"
                      />
                    </div>
                    <Button onClick={handleSaveCategory} className="w-full">
                      {editingCategory ? 'تحديث' : 'إضافة'}
                    </Button>
                    
                    {/* Categories List */}
                    {categories.length > 0 && (
                      <div className="border-t pt-4 mt-4">
                        <h4 className="font-medium mb-3 text-sm">الفئات الحالية</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {categories.map((cat: Category) => (
                            <div key={cat.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                              <span className="text-sm">{cat.name}</span>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => {
                                    setEditingCategory(cat);
                                    setCategoryForm({ name: cat.name, description: cat.description || '' });
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteCategory(cat.id)}
                                >
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

              {/* Add Product Dialog */}
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                if (!open) {
                  setEditingProduct(null);
                  setFormData({
                    name: '',
                    description: '',
                    category_id: '',
                    sizes: [{ size: '', cost: 0, price: 0 }]
                  });
                }
                setIsDialogOpen(open);
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => {
                    setEditingProduct(null);
                    setFormData({
                      name: '',
                      description: '',
                      category_id: '',
                      sizes: [{ size: '', cost: 0, price: 0 }]
                    });
                  }}>
                    <Plus className="h-4 w-4 ml-1" />
                    منتج جديد
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>اسم المنتج</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </div>

                      <div>
                        <Label>الفئة</Label>
                        <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الفئة" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-category">بدون فئة</SelectItem>
                            {categories.map((category: Category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>الوصف (اختياري)</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={2}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Layers className="h-4 w-4" />
                          المقاسات والأسعار
                        </Label>
                        <Button type="button" variant="outline" size="sm" onClick={addSizeField}>
                          <Plus className="h-3 w-3 ml-1" />
                          مقاس
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {formData.sizes.map((size, index) => (
                          <div key={index} className="grid grid-cols-4 gap-2 items-end p-3 bg-muted/30 rounded-lg">
                            <div>
                              <Label className="text-xs text-muted-foreground">المقاس</Label>
                              <Input
                                value={size.size}
                                onChange={(e) => updateSizeField(index, 'size', e.target.value)}
                                placeholder="M"
                                className="text-center"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">التكلفة</Label>
                              <Input
                                type="number"
                                value={size.cost}
                                onChange={(e) => updateSizeField(index, 'cost', parseFloat(e.target.value) || 0)}
                                className="text-center"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">السعر</Label>
                              <Input
                                type="number"
                                value={size.price}
                                onChange={(e) => updateSizeField(index, 'price', parseFloat(e.target.value) || 0)}
                                className="text-center"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeSizeField(index)}
                              disabled={formData.sizes.length === 1}
                              className="h-9"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1">
                        {editingProduct ? 'تحديث' : 'إضافة'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                        إلغاء
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        
        {/* Filters */}
        <CardContent className="pt-0">
          <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3'}`}>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في المنتجات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="جميع الفئات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                <SelectItem value="uncategorized">بدون فئة</SelectItem>
                {categories.map((category: Category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={expandAllCategories} className="flex-1 text-xs">
                <ChevronDown className="h-3 w-3 ml-1" />
                توسيع الكل
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAllCategories} className="flex-1 text-xs">
                <ChevronUp className="h-3 w-3 ml-1" />
                طي الكل
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories with Products */}
      <div className="space-y-3">
        {Object.entries(groupedProducts).map(([categoryId, { category, products: categoryProducts }]) => {
          if (categoryProducts.length === 0 && categoryId !== 'uncategorized') return null;
          
          const isExpanded = expandedCategories.has(categoryId);
          const categoryName = category?.name || 'بدون فئة';
          const productsCount = categoryProducts.length;
          
          return (
            <Card key={categoryId} className="overflow-hidden">
              <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(categoryId)}>
                <CollapsibleTrigger asChild>
                  <div className={`flex items-center justify-between p-3 md:p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                    isExpanded ? 'border-b bg-muted/30' : ''
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${category ? 'bg-primary/10' : 'bg-muted'}`}>
                        <FolderOpen className={`h-4 w-4 md:h-5 md:w-5 ${category ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm md:text-base">{categoryName}</h3>
                        {category?.description && (
                          <p className="text-xs text-muted-foreground">{category.description}</p>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {productsCount} منتج
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {category && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCategory(category);
                            setCategoryForm({ name: category.name, description: category.description || '' });
                            setIsCategoryDialogOpen(true);
                          }}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  {categoryProducts.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">لا توجد منتجات في هذه الفئة</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {categoryProducts.map((product) => (
                        <div key={product.id} className={`p-3 md:p-4 ${!product.is_active ? 'bg-muted/20 opacity-70' : ''}`}>
                          {/* Product Header */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`p-2 rounded-lg shrink-0 ${product.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                                <Tag className={`h-4 w-4 ${product.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-medium text-sm md:text-base truncate">{product.name}</h4>
                                {product.description && (
                                  <p className="text-xs text-muted-foreground truncate">{product.description}</p>
                                )}
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => toggleProductVisibility(product.id, product.is_active)}
                                title={product.is_active ? 'إخفاء المنتج' : 'إظهار المنتج'}
                              >
                                {product.is_active ? (
                                  <Eye className="h-4 w-4 text-green-500" />
                                ) : (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleEdit(product)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(product.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Sizes Table */}
                          {product.product_sizes && product.product_sizes.length > 0 && (
                            <div className="bg-muted/30 rounded-lg overflow-hidden">
                              <div className="grid grid-cols-4 gap-2 p-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                                <span className="text-center">المقاس</span>
                                <span className="text-center">التكلفة</span>
                                <span className="text-center">السعر</span>
                                <span className="text-center">الربح</span>
                              </div>
                              <div className="divide-y divide-muted/50">
                                {product.product_sizes.map((size, idx) => {
                                  const profit = size.price - size.cost;
                                  const profitPercent = size.cost > 0 ? ((profit / size.cost) * 100).toFixed(0) : 0;
                                  
                                  return (
                                    <div key={idx} className="grid grid-cols-4 gap-2 p-2 text-sm items-center">
                                      <span className="text-center font-medium">
                                        <Badge variant="outline" className="text-xs">{size.size}</Badge>
                                      </span>
                                      <span className="text-center text-muted-foreground">
                                        {formatCurrency(size.cost)}
                                      </span>
                                      <span className="text-center font-semibold text-primary">
                                        {formatCurrency(size.price)}
                                      </span>
                                      <span className={`text-center text-xs ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(profit)}
                                        <span className="text-muted-foreground mr-1">({profitPercent}%)</span>
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {(!product.product_sizes || product.product_sizes.length === 0) && (
                            <div className="bg-muted/30 rounded-lg p-3 text-center">
                              <p className="text-xs text-muted-foreground">لا توجد مقاسات محددة</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {products.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">لا توجد منتجات</h3>
            <p className="text-sm text-muted-foreground mb-4">ابدأ بإضافة منتجات جديدة لمتجرك</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-1" />
              إضافة منتج جديد
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductsManagementPro;
