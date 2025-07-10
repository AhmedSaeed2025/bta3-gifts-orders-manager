
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
import { Plus, Edit, Trash2, Eye, EyeOff, Loader2, Package, Tag, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const ImprovedProductManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State management
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

  // Fetch products with related data
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

  // Category form state
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  });

  // Product form state
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category_id: '',
    is_active: true,
    image_url: '',
    sizes: [{ size: '', price: 0, cost: 0 }]
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
      toast.success('تم تحديث حالة المنتج');
    }
  });

  // Category mutations
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

  // Delete category
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('تم حذف الفئة');
    }
  });

  // Product mutations
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
            is_active: data.is_active,
            image_url: data.image_url
          })
          .eq('id', productId);
        
        if (error) throw error;

        // Delete old sizes and add new ones
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
            is_active: data.is_active,
            image_url: data.image_url
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
      setIsProductDialogOpen(false);
      setEditingProduct(null);
      resetProductForm();
      toast.success(editingProduct ? 'تم تحديث المنتج' : 'تم إضافة المنتج');
    }
  });

  // Delete product
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('تم حذف المنتج');
    }
  });

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      category_id: '',
      is_active: true,
      image_url: '',
      sizes: [{ size: '', price: 0, cost: 0 }]
    });
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      category_id: product.category_id || '',
      is_active: product.is_active,
      image_url: product.image_url || '',
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

  const addSize = () => {
    setProductForm(prev => ({
      ...prev,
      sizes: [...prev.sizes, { size: '', price: 0, cost: 0 }]
    }));
  };

  const removeSize = (index: number) => {
    setProductForm(prev => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index)
    }));
  };

  const updateSize = (index: number, field: string, value: any) => {
    setProductForm(prev => ({
      ...prev,
      sizes: prev.sizes.map((size, i) => 
        i === index ? { ...size, [field]: value } : size
      )
    }));
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة المنتجات والفئات</h1>
          <p className="text-muted-foreground">أضف وعدّل منتجات وفئات متجرك</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => {
                setEditingCategory(null);
                setCategoryForm({ name: '', description: '' });
              }}>
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
                  disabled={categoryMutation.isPending || !categoryForm.name.trim()}
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
              <Button onClick={() => {
                setEditingProduct(null);
                resetProductForm();
              }}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة منتج
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

                <div className="space-y-2">
                  <Label>رابط الصورة</Label>
                  <Input
                    value={productForm.image_url}
                    onChange={(e) => setProductForm(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={productForm.is_active}
                    onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label>ظاهر في المتجر</Label>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>المقاسات والأسعار</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addSize}>
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
                          onChange={(e) => updateSize(index, 'size', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">التكلفة</Label>
                        <Input
                          type="number"
                          value={size.cost}
                          onChange={(e) => updateSize(index, 'cost', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">السعر</Label>
                        <Input
                          type="number"
                          value={size.price}
                          onChange={(e) => updateSize(index, 'price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">الربح</Label>
                        <div className="text-sm text-green-600 font-medium p-2 bg-green-50 rounded">
                          {formatCurrency(size.price - size.cost)}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeSize(index)}
                        disabled={productForm.sizes.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={() => productMutation.mutate(productForm)}
                  disabled={productMutation.isPending || !productForm.name.trim()}
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
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            الفئات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div key={category.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{category.name}</h3>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditCategory(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCategoryMutation.mutate(category.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            المنتجات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4">
              {products.map((product) => (
                <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    {/* Product Image */}
                    {product.image_url && (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        {product.categories && (
                          <Badge variant="outline" className="text-xs">
                            <Tag className="h-3 w-3 ml-1" />
                            {product.categories.name}
                          </Badge>
                        )}
                        <Badge variant={product.is_active ? "default" : "secondary"} className="text-xs">
                          {product.is_active ? (
                            <>
                              <Eye className="h-3 w-3 ml-1" />
                              ظاهر
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 ml-1" />
                              مخفي
                            </>
                          )}
                        </Badge>
                      </div>
                      
                      {product.description && (
                        <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
                      )}
                      
                      {/* Product Sizes */}
                      {product.product_sizes?.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">المقاسات والأسعار:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {product.product_sizes.map((size: any, index: number) => (
                              <div key={index} className="bg-gray-50 rounded p-2 text-xs">
                                <div className="font-medium">{size.size}</div>
                                <div className="flex justify-between text-gray-600">
                                  <span>التكلفة: {formatCurrency(size.cost)}</span>
                                  <span>السعر: {formatCurrency(size.price)}</span>
                                </div>
                                <div className="text-green-600 font-medium">
                                  الربح: {formatCurrency(size.price - size.cost)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
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
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditProduct(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteProductMutation.mutate(product.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {products.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد منتجات مضافة بعد</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImprovedProductManagement;
