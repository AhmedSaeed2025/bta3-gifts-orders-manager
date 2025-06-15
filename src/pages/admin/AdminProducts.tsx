
import React, { useState } from 'react';
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
import { Plus, Edit, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';

const AdminProducts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
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
    queryKey: ['admin-products'],
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
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('تم تحديث حالة المنتج');
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
    category_id: '',
    featured: false,
    is_active: true,
    sizes: [{ size: '', price: 0, cost: 0 }]
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
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
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
            category_id: data.category_id || null,
            featured: data.featured,
            is_active: data.is_active
          })
          .eq('id', productId);
        
        if (error) throw error;

        // Delete old sizes
        await supabase.from('product_sizes').delete().eq('product_id', productId);
      } else {
        // Create product
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert({
            user_id: user!.id,
            name: data.name,
            description: data.description,
            category_id: data.category_id || null,
            featured: data.featured,
            is_active: data.is_active
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsProductDialogOpen(false);
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        category_id: '',
        featured: false,
        is_active: true,
        sizes: [{ size: '', price: 0, cost: 0 }]
      });
      toast.success(editingProduct ? 'تم تحديث المنتج' : 'تم إضافة المنتج');
    }
  });

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      category_id: product.category_id || '',
      featured: product.featured,
      is_active: product.is_active,
      sizes: product.product_sizes?.length > 0 
        ? product.product_sizes.map((s: any) => ({
            size: s.size,
            price: s.price,
            cost: s.cost
          }))
        : [{ size: '', price: 0, cost: 0 }]
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة المنتجات والفئات</h1>
          <p className="text-muted-foreground">أضف وعدّل منتجات وفئات متجرك</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 ml-2" />
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
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'تعديل منتج' : 'إضافة منتج جديد'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
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
                        <SelectItem value="">بدون فئة</SelectItem>
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

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={productForm.featured}
                      onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, featured: checked }))}
                    />
                    <Label>منتج مميز</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={productForm.is_active}
                      onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label>نشط على الموقع</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>المقاسات والأسعار</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddSize}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {productForm.sizes.map((size, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 items-end">
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
                        <Label className="text-xs">سعر البيع</Label>
                        <Input
                          type="number"
                          value={size.price}
                          onChange={(e) => handleSizeChange(index, 'price', parseFloat(e.target.value) || 0)}
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

      {/* Categories Section */}
      <Card>
        <CardHeader>
          <CardTitle>الفئات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div key={category.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{category.name}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditCategory(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                {category.description && (
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Products Section */}
      <Card>
        <CardHeader>
          <CardTitle>المنتجات</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{product.name}</h3>
                        {product.featured && <Badge variant="secondary">مميز</Badge>}
                        {product.categories && (
                          <Badge variant="outline">{product.categories.name}</Badge>
                        )}
                      </div>
                      
                      {product.description && (
                        <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                      )}
                      
                      {product.product_sizes?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {product.product_sizes.map((size: any, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {size.size}: {size.price} ج.م
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
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
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditProduct(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {products.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد منتجات مضافة بعد
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProducts;
