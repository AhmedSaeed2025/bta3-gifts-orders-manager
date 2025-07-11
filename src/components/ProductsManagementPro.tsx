
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";
import { Plus, Edit, Trash2, Search, Package } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import ProductVisibilityToggle from "./admin/ProductVisibilityToggle";

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
}

const ProductsManagementPro = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
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
      
      console.log('Fetching products for user:', user.id);
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_sizes (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
      
      console.log('Fetched products:', data);
      return data || [];
    },
    enabled: !!user
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user
  });

  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

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
        category_id: formData.category_id || null,
        user_id: user?.id
      };

      let productId: string;

      if (editingProduct) {
        console.log('Updating product:', editingProduct.id, productData);
        
        // Update existing product
        const { data, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating product:', error);
          throw error;
        }
        
        productId = data.id;

        // Delete existing sizes
        await supabase
          .from('product_sizes')
          .delete()
          .eq('product_id', productId);
      } else {
        // Create new product
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();

        if (error) {
          console.error('Error creating product:', error);
          throw error;
        }
        
        productId = data.id;
      }

      // Add sizes
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

        if (sizesError) {
          console.error('Error inserting sizes:', sizesError);
          throw sizesError;
        }
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
    console.log('Editing product:', product);
    
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
      // First delete product sizes
      const { error: sizesError } = await supabase
        .from('product_sizes')
        .delete()
        .eq('product_id', productId);

      if (sizesError) {
        console.error('Error deleting product sizes:', sizesError);
        throw sizesError;
      }

      // Then delete the product
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('Error deleting product:', error);
        throw error;
      }

      toast.success('تم حذف المنتج بنجاح');
      refetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('حدث خطأ في حذف المنتج');
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

  if (productsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Package className="h-6 w-6" />
                إدارة المنتجات
              </CardTitle>
              <p className="text-muted-foreground">إضافة وإدارة منتجات المتجر</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
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
                  <div>
                    <Label htmlFor="name">اسم المنتج</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">الوصف</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">الفئة</Label>
                    <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الفئة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">بدون فئة</SelectItem>
                        {categories.map((category: Category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>المقاسات والأسعار</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addSizeField}>
                        <Plus className="h-3 w-3 ml-1" />
                        إضافة مقاس
                      </Button>
                    </div>
                    
                    {formData.sizes.map((size, index) => (
                      <div key={index} className="grid grid-cols-4 gap-2 items-end">
                        <div>
                          <Label className="text-xs">المقاس</Label>
                          <Input
                            value={size.size}
                            onChange={(e) => updateSizeField(index, 'size', e.target.value)}
                            placeholder="مثال: M"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">التكلفة</Label>
                          <Input
                            type="number"
                            value={size.cost}
                            onChange={(e) => updateSizeField(index, 'cost', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">السعر</Label>
                          <Input
                            type="number"
                            value={size.price}
                            onChange={(e) => updateSizeField(index, 'price', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeSizeField(index)}
                          disabled={formData.sizes.length === 1}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
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
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div className="space-y-2">
              <Label>البحث</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="البحث في المنتجات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>الفئة</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفئات</SelectItem>
                  {categories.map((category: Category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <div className="grid gap-4">
        {filteredProducts.map((product: Product) => (
          <Card key={product.id}>
            <CardContent className="p-4">
              <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-12'}`}>
                {/* Product Info */}
                <div className={`${isMobile ? 'col-span-1' : 'col-span-6'} space-y-2`}>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{product.name}</h3>
                    <ProductVisibilityToggle
                      product={product}
                      categories={categories}
                      onUpdate={refetchProducts}
                    />
                  </div>
                  
                  {product.description && (
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                  )}
                </div>

                {/* Sizes and Prices */}
                <div className={`${isMobile ? 'col-span-1' : 'col-span-4'}`}>
                  <div className="space-y-1">
                    <Label className="text-xs">المقاسات والأسعار</Label>
                    <div className="space-y-1">
                      {product.product_sizes?.map((size, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline">{size.size}</Badge>
                          <span className="text-green-600">{formatCurrency(size.price)}</span>
                          <span className="text-red-600 text-xs">({formatCurrency(size.cost)})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className={`${isMobile ? 'col-span-1' : 'col-span-2'} flex gap-2`}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(product)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 ml-1" />
                    تعديل
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredProducts.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">لا توجد منتجات تطابق معايير البحث</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProductsManagementPro;
