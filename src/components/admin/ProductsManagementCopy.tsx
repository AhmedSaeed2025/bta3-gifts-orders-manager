import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Loader2, 
  Image, 
  Video, 
  Tag, 
  Star, 
  Globe, 
  X, 
  Folder,
  FolderPlus,
  Package
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const ProductsManagementCopy = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories-copy'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user!.id)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products-copy'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name),
          product_sizes (*),
          product_images (*)
        `)
        .eq('user_id', user!.id)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Toggle product visibility
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ productId, isActive }: { productId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('products')
        .update({ is_active: isActive })
        .eq('id', productId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products-copy'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('تم تحديث حالة المنتج');
    }
  });

  // Delete product
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      // First delete related data
      await supabase.from('product_sizes').delete().eq('product_id', productId);
      await supabase.from('product_images').delete().eq('product_id', productId);
      
      // Then delete the product
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products-copy'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('تم حذف المنتج بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ في حذف المنتج');
    }
  });

  // Delete category
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      // First update products to remove category reference
      await supabase
        .from('products')
        .update({ category_id: null })
        .eq('category_id', categoryId);
      
      // Then delete the category
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories-copy'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products-copy'] });
      toast.success('تم حذف الفئة بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ في حذف الفئة');
    }
  });

  // Category form
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  });

  // Product form
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category_id: 'no-category',
    featured: false,
    is_active: true,
    image_url: '',
    video_url: '',
    discount_percentage: 0,
    sizes: [{ size: '', price: 0, cost: 0 }],
    images: [{ url: '', alt: '' }]
  });

  const handleAddSize = () => {
    setProductForm(prev => ({
      ...prev,
      sizes: [...prev.sizes, { size: '', price: 0, cost: 0 }]
    }));
  };

  const handleRemoveSize = (index: number) => {
    setProductForm(prev => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index)
    }));
  };

  const handleSizeChange = (index: number, field: string, value: any) => {
    setProductForm(prev => ({
      ...prev,
      sizes: prev.sizes.map((size, i) => 
        i === index ? { ...size, [field]: value } : size
      )
    }));
  };

  const handleAddImage = () => {
    setProductForm(prev => ({
      ...prev,
      images: [...prev.images, { url: '', alt: '' }]
    }));
  };

  const handleRemoveImage = (index: number) => {
    setProductForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleImageChange = (index: number, field: string, value: string) => {
    setProductForm(prev => ({
      ...prev,
      images: prev.images.map((img, i) => 
        i === index ? { ...img, [field]: value } : img
      )
    }));
  };

  // Create/Update category
  const categoryMutation = useMutation({
    mutationFn: async (data: typeof categoryForm) => {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(data)
          .eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories')
          .insert({ ...data, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories-copy'] });
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '' });
      toast.success(editingCategory ? 'تم تحديث الفئة' : 'تم إضافة الفئة');
    }
  });

  // Create/Update product
  const productMutation = useMutation({
    mutationFn: async (data: typeof productForm) => {
      let productId = editingProduct?.id;
      
      if (editingProduct) {
        // Update product
        const { error } = await supabase
          .from('products')
          .update({
            name: data.name,
            description: data.description,
            category_id: data.category_id === 'no-category' ? null : data.category_id,
            featured: data.featured,
            is_active: data.is_active,
            image_url: data.image_url,
            video_url: data.video_url,
            discount_percentage: data.discount_percentage
          })
          .eq('id', productId);
        
        if (error) throw error;

        // Delete old sizes and images
        await supabase.from('product_sizes').delete().eq('product_id', productId);
        await supabase.from('product_images').delete().eq('product_id', productId);
      } else {
        // Create product
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert({
            user_id: user!.id,
            name: data.name,
            description: data.description,
            category_id: data.category_id === 'no-category' ? null : data.category_id,
            featured: data.featured,
            is_active: data.is_active,
            image_url: data.image_url,
            video_url: data.video_url,
            discount_percentage: data.discount_percentage
          })
          .select()
          .single();
        
        if (error) throw error;
        productId = newProduct.id;
      }

      // Add sizes
      if (data.sizes.length > 0) {
        const sizesToInsert = data.sizes
          .filter(size => size.size.trim() !== '')
          .map(size => ({
            product_id: productId,
            size: size.size,
            price: size.price,
            cost: size.cost
          }));

        if (sizesToInsert.length > 0) {
          const { error } = await supabase
            .from('product_sizes')
            .insert(sizesToInsert);
          
          if (error) throw error;
        }
      }

      // Add images
      if (data.images.length > 0) {
        const imagesToInsert = data.images
          .filter(img => img.url.trim() !== '')
          .map((img, index) => ({
            product_id: productId,
            image_url: img.url,
            alt_text: img.alt,
            is_primary: index === 0,
            sort_order: index
          }));

        if (imagesToInsert.length > 0) {
          const { error } = await supabase
            .from('product_images')
            .insert(imagesToInsert);
          
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products-copy'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsProductDialogOpen(false);
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        category_id: 'no-category',
        featured: false,
        is_active: true,
        image_url: '',
        video_url: '',
        discount_percentage: 0,
        sizes: [{ size: '', price: 0, cost: 0 }],
        images: [{ url: '', alt: '' }]
      });
      toast.success(editingProduct ? 'تم تحديث المنتج' : 'تم إضافة المنتج');
    },
    onError: (error) => {
      console.error('Error saving product:', error);
      toast.error('حدث خطأ في حفظ المنتج');
    }
  });

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      category_id: product.category_id || 'no-category',
      featured: product.featured,
      is_active: product.is_active,
      image_url: product.image_url || '',
      video_url: product.video_url || '',
      discount_percentage: product.discount_percentage || 0,
      sizes: product.product_sizes?.length > 0 
        ? product.product_sizes.map((s: any) => ({
            size: s.size,
            price: s.price,
            cost: s.cost
          }))
        : [{ size: '', price: 0, cost: 0 }],
      images: product.product_images?.length > 0
        ? product.product_images.map((img: any) => ({
            url: img.image_url,
            alt: img.alt_text || ''
          }))
        : [{ url: '', alt: '' }]
    });
    setIsProductDialogOpen(true);
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || ''
    });
    setIsCategoryDialogOpen(true);
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Group products by category
  const productsByCategory = useMemo(() => {
    const grouped = new Map();
    
    // Add "بدون فئة" category for uncategorized products
    grouped.set('uncategorized', {
      id: 'uncategorized',
      name: 'بدون فئة',
      products: products.filter(p => !p.category_id)
    });
    
    // Add products to their respective categories
    categories.forEach(category => {
      grouped.set(category.id, {
        ...category,
        products: products.filter(p => p.category_id === category.id)
      });
    });
    
    return grouped;
  }, [products, categories]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة المنتجات والفئات المطورة</h1>
          <p className="text-muted-foreground">نظام متقدم لإدارة منتجات وفئات متجرك بشكل منظم</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderPlus className="h-4 w-4 ml-2" />
                إضافة فئة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCategory ? 'تعديل فئة' : 'إضافة فئة جديدة'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>اسم الفئة</Label>
                  <Input
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="مثال: ملابس، إلكترونيات"
                  />
                </div>
                <div className="space-y-2">
                  <Label>وصف الفئة</Label>
                  <Textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="وصف مختصر للفئة"
                  />
                </div>
                <Button 
                  onClick={() => categoryMutation.mutate(categoryForm)}
                  disabled={categoryMutation.isPending}
                  className="w-full"
                >
                  {categoryMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                  {editingCategory ? 'تحديث الفئة' : 'إضافة الفئة'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة منتج
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'تعديل منتج' : 'إضافة منتج جديد'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اسم المنتج</Label>
                    <Input
                      value={productForm.name}
                      onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="اسم المنتج"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الفئة</Label>
                    <Select
                      value={productForm.category_id}
                      onValueChange={(value) => setProductForm(prev => ({ ...prev, category_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر فئة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-category">بدون فئة</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>وصف المنتج</Label>
                  <Textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="وصف المنتج"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      رابط الصورة الرئيسية
                    </Label>
                    <Input
                      value={productForm.image_url}
                      onChange={(e) => setProductForm(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      رابط الفيديو
                    </Label>
                    <Input
                      value={productForm.video_url}
                      onChange={(e) => setProductForm(prev => ({ ...prev, video_url: e.target.value }))}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>
                </div>

                {/* Additional Images */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      صور إضافية
                    </Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddImage}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {productForm.images.map((image, index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 items-end">
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">رابط الصورة</Label>
                        <Input
                          placeholder="https://example.com/image.jpg"
                          value={image.url}
                          onChange={(e) => handleImageChange(index, 'url', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">وصف الصورة</Label>
                        <Input
                          placeholder="وصف الصورة"
                          value={image.alt}
                          onChange={(e) => handleImageChange(index, 'alt', e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveImage(index)}
                        disabled={productForm.images.length === 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-50 to-yellow-100 p-3 rounded-lg border border-yellow-200">
                    <Switch
                      checked={productForm.featured}
                      onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, featured: checked }))}
                    />
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-600" />
                      <Label className="text-yellow-800 font-medium">منتج مميز</Label>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                    <Switch
                      checked={productForm.is_active}
                      onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, is_active: checked }))}
                    />
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-green-600" />
                      <Label className="text-green-800 font-medium">ظاهر في المتجر</Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      نسبة الخصم %
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={productForm.discount_percentage}
                      onChange={(e) => setProductForm(prev => ({ ...prev, discount_percentage: parseFloat(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>المقاسات والأسعار</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddSize}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {productForm.sizes.map((size, index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 items-end">
                      <div className="space-y-1">
                        <Label className="text-xs">المقاس</Label>
                        <Input
                          placeholder="S, M, L"
                          value={size.size}
                          onChange={(e) => handleSizeChange(index, 'size', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">التكلفة</Label>
                        <Input
                          type="number"
                          value={size.cost}
                          onChange={(e) => handleSizeChange(index, 'cost', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">السعر الأصلي</Label>
                        <Input
                          type="number"
                          value={size.price}
                          onChange={(e) => handleSizeChange(index, 'price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">السعر بعد الخصم</Label>
                        <Input
                          type="number"
                          value={size.price * (1 - productForm.discount_percentage / 100)}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveSize(index)}
                        disabled={productForm.sizes.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={() => productMutation.mutate(productForm)}
                  disabled={productMutation.isPending}
                  className="w-full"
                >
                  {productMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                  {editingProduct ? 'تحديث المنتج' : 'إضافة المنتج'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Categories and Products Organized View */}
      <div className="space-y-6">
        {Array.from(productsByCategory.entries()).map(([categoryId, categoryData]) => (
          <Card key={categoryId} className="border-2">
            <Collapsible
              open={expandedCategories.has(categoryId)}
              onOpenChange={() => toggleCategoryExpansion(categoryId)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      <Folder className="h-6 w-6 text-blue-600" />
                      <span>{categoryData.name}</span>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {categoryData.products.length} منتج
                      </Badge>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {categoryId !== 'uncategorized' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCategory(categoryData);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('هل أنت متأكد من حذف هذه الفئة؟ سيتم نقل المنتجات إلى "بدون فئة"')) {
                                deleteCategoryMutation.mutate(categoryId);
                              }
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {expandedCategories.has(categoryId) ? '▼' : '▶'}
                    </div>
                  </div>
                  {categoryData.description && (
                    <p className="text-sm text-muted-foreground text-right">
                      {categoryData.description}
                    </p>
                  )}
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0">
                  {categoryData.products.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>لا توجد منتجات في هذه الفئة</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryData.products.map((product: any) => (
                        <Card key={product.id} className="border">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              {/* Product Image */}
                              {product.image_url && (
                                <div className="relative">
                                  <img 
                                    src={product.image_url} 
                                    alt={product.name}
                                    className="w-full h-32 object-cover rounded"
                                  />
                                  {(product.discount_percentage || 0) > 0 && (
                                    <Badge className="absolute -top-2 -right-2 bg-red-500">
                                      -{product.discount_percentage}%
                                    </Badge>
                                  )}
                                </div>
                              )}
                              
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-sm">{product.name}</h3>
                                  {product.featured && (
                                    <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs">
                                      <Star className="h-2 w-2 mr-1" />
                                      مميز
                                    </Badge>
                                  )}
                                </div>
                                
                                {product.description && (
                                  <p className="text-xs text-muted-foreground mb-2">{product.description}</p>
                                )}
                                
                                {/* Product Sizes and Prices */}
                                {product.product_sizes?.length > 0 && (
                                  <div className="space-y-1">
                                    {product.product_sizes.map((size: any, index: number) => {
                                      const discountedPrice = size.price * (1 - ((product.discount_percentage || 0) / 100));
                                      const profit = discountedPrice - size.cost;
                                      return (
                                        <div key={index} className="bg-gray-50 p-2 rounded text-xs">
                                          <div className="flex justify-between items-center">
                                            <span className="font-medium">{size.size}</span>
                                            <div className="text-left">
                                              <div>
                                                {(product.discount_percentage || 0) > 0 ? (
                                                  <>
                                                    <span className="line-through text-red-500 text-xs">{size.price}</span>
                                                    <span className="text-green-600 font-bold mr-1">{discountedPrice.toFixed(2)}</span>
                                                  </>
                                                ) : (
                                                  <span className="font-bold">{size.price}</span>
                                                )}
                                                <span className="text-xs">ج.م</span>
                                              </div>
                                              <div className="text-xs text-muted-foreground">
                                                التكلفة: {size.cost} | الربح: {profit.toFixed(2)}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Product Status and Actions */}
                                <div className="flex items-center justify-between pt-2">
                                  <div className="flex items-center gap-1">
                                    {product.is_active ? (
                                      <Badge className="bg-gradient-to-r from-green-400 to-green-600 text-white text-xs">
                                        <Globe className="h-2 w-2 mr-1" />
                                        ظاهر
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="text-xs">مخفي</Badge>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleVisibilityMutation.mutate({
                                        productId: product.id,
                                        isActive: !product.is_active
                                      })}
                                      disabled={toggleVisibilityMutation.isPending}
                                    >
                                      {product.is_active ? (
                                        <Eye className="h-3 w-3 text-green-600" />
                                      ) : (
                                        <EyeOff className="h-3 w-3 text-gray-400" />
                                      )}
                                    </Button>
                                    
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditProduct(product)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
                                          deleteProductMutation.mutate(product.id);
                                        }
                                      }}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}
    </div>
  );
};

export default ProductsManagementCopy;
