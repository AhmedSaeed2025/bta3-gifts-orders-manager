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
import { Plus, Edit, Trash2, Eye, EyeOff, Loader2, Image, Video, Tag, Star, Globe, X, FolderPlus } from 'lucide-react';
import ProductEditDialog from '@/components/admin/ProductEditDialog';

const AdminProducts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  
  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!user
  });

  // Fetch products
  const { data: products = [], isLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name),
          product_sizes (*),
          product_images (*)
        `)
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });
      
      if (error) {
        console.error('Error fetching products:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!user
  });

  
  // Category form
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  });

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
    },
    onError: (error: any) => {
      console.error('Category mutation error:', error);
      toast.error('حدث خطأ في حفظ الفئة');
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
    },
    onError: (error: any) => {
      console.error('Delete category error:', error);
      toast.error('حدث خطأ في حذف الفئة');
    }
  });

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || ''
    });
    setIsCategoryDialogOpen(true);
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الفئة؟')) {
      deleteCategoryMutation.mutate(categoryId);
    }
  };

  // Product form
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category_id: '',
    featured: false,
    is_active: true,
    image_url: '',
    video_url: '',
    discount_percentage: 0,
    sizes: [{ size: '', price: 0, cost: 0 }],
    images: [{ url: '', alt: '' }]
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
            category_id: data.category_id || null,
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

      // Add sizes and images
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
          await supabase.from('product_sizes').insert(sizesToInsert);
        }
      }

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
          await supabase.from('product_images').insert(imagesToInsert);
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
        image_url: '',
        video_url: '',
        discount_percentage: 0,
        sizes: [{ size: '', price: 0, cost: 0 }],
        images: [{ url: '', alt: '' }]
      });
      toast.success(editingProduct ? 'تم تحديث المنتج' : 'تم إضافة المنتج');
    },
    onError: (error: any) => {
      console.error('Product mutation error:', error);
      toast.error('حدث خطأ في حفظ المنتج');
    }
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
              <Button variant="outline" onClick={() => {
                setEditingCategory(null);
                setCategoryForm({ name: '', description: '' });
              }}>
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
                  <div className="flex gap-2">
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
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-red-600 hover:text-red-700"
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
                  <div className="flex items-start gap-4">
                    {/* Product Image */}
                    {product.image_url && (
                      <div className="relative">
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded"
                        />
                        {(product.discount_percentage || 0) > 0 && (
                          <Badge className="absolute -top-2 -right-2 bg-red-500">
                            -{product.discount_percentage}%
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{product.name}</h3>
                        {product.featured && (
                          <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
                            <Star className="h-3 w-3 mr-1" />
                            مميز
                          </Badge>
                        )}
                        {product.categories && (
                          <Badge variant="outline">{product.categories.name}</Badge>
                        )}
                        {(product.discount_percentage || 0) > 0 && (
                          <Badge className="bg-red-500">خصم {product.discount_percentage}%</Badge>
                        )}
                        {product.is_active ? (
                          <Badge className="bg-gradient-to-r from-green-400 to-green-600 text-white">
                            <Globe className="h-3 w-3 mr-1" />
                            ظاهر
                          </Badge>
                        ) : (
                          <Badge variant="secondary">مخفي</Badge>
                        )}
                      </div>
                      
                      {product.description && (
                        <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                      )}
                      
                      {product.product_sizes?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {product.product_sizes.map((size: any, index: number) => {
                            const discountedPrice = size.price * (1 - ((product.discount_percentage || 0) / 100));
                            const profit = discountedPrice - size.cost;
                            return (
                              <Badge key={index} variant="outline" className="text-xs">
                                {size.size}: 
                                {(product.discount_percentage || 0) > 0 ? (
                                  <>
                                    <span className="line-through text-red-500 ml-1">{size.price} ج.م</span>
                                    <span className="text-green-600 mr-1">{discountedPrice.toFixed(2)} ج.م</span>
                                  </>
                                ) : (
                                  <span className="mr-1">{size.price} ج.م</span>
                                )}
                                | الربح: {profit.toFixed(2)} ج.م
                              </Badge>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex gap-2 text-xs text-muted-foreground">
                        {product.image_url && <span>🖼️ صورة</span>}
                        {product.video_url && <span>🎥 فيديو</span>}
                        {product.product_images?.length > 0 && (
                          <span>📷 {product.product_images.length} صور</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
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

      {/* Product Edit Dialog */}
      <ProductEditDialog
        product={editingProduct}
        categories={categories}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingProduct(null);
        }}
        onUpdate={refetchProducts}
      />
    </div>
  );
};

export default AdminProducts;
