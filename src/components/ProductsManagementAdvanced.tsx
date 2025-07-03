import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Trash, Pencil, Plus, Package, Image, Star, Eye, ShoppingCart, Upload, Save, X, ArrowUp, ArrowDown } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  category_id: string | null;
  is_active: boolean;
  featured: boolean;
  discount_percentage: number | null;
  sort_order: number | null;
  sizes: ProductSize[];
  images: ProductImage[];
}

interface ProductSize {
  id?: string;
  size: string;
  cost: number;
  price: number;
}

interface ProductImage {
  id?: string;
  image_url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number | null;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

const ProductsManagementAdvanced = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image_url: "",
    video_url: "",
    category_id: "",
    is_active: true,
    featured: false,
    discount_percentage: 0,
    sort_order: 0
  });
  
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadProducts(), loadCategories()]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error("خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_sizes (*),
        product_images (*),
        categories (id, name)
      `)
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error loading products:', error);
      return;
    }

    const formattedProducts = data?.map(product => ({
      ...product,
      sizes: (product.product_sizes || []).map((size: any) => ({
        id: size.id,
        size: size.size,
        cost: Number(size.cost),
        price: Number(size.price)
      })),
      images: (product.product_images || []).map((image: any) => ({
        id: image.id,
        image_url: image.image_url,
        alt_text: image.alt_text,
        is_primary: image.is_primary,
        sort_order: image.sort_order
      }))
    })) || [];

    setProducts(formattedProducts);
  };

  const loadCategories = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) {
      console.error('Error loading categories:', error);
      return;
    }

    setCategories(data || []);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      image_url: "",
      video_url: "",
      category_id: "",
      is_active: true,
      featured: false,
      discount_percentage: 0,
      sort_order: 0
    });
    setSizes([]);
    setImages([]);
    setEditingProduct(null);
    setShowProductForm(false);
  };

  const handleEditProduct = (product: Product) => {
    console.log('Editing product:', product);
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      image_url: product.image_url || "",
      video_url: product.video_url || "",
      category_id: product.category_id || "",
      is_active: product.is_active,
      featured: product.featured,
      discount_percentage: product.discount_percentage || 0,
      sort_order: product.sort_order || 0
    });
    setSizes(product.sizes || []);
    setImages(product.images || []);
    console.log('Set sizes:', product.sizes || []);
    console.log('Set images:', product.images || []);
    setShowProductForm(true);
  };

  const handleSaveProduct = async () => {
    console.log('Saving product, editingProduct:', editingProduct);
    console.log('Form data:', formData);
    console.log('Sizes:', sizes);
    console.log('Images:', images);
    
    if (!user || !formData.name.trim()) {
      toast.error("اسم المنتج مطلوب");
      return;
    }

    try {
      if (editingProduct) {
        // Update existing product
        const { error: productError } = await supabase
          .from('products')
          .update({
            name: formData.name,
            description: formData.description || null,
            image_url: formData.image_url || null,
            video_url: formData.video_url || null,
            category_id: formData.category_id || null,
            is_active: formData.is_active,
            featured: formData.featured,
            discount_percentage: formData.discount_percentage || null,
            sort_order: formData.sort_order || null
          })
          .eq('id', editingProduct.id)
          .eq('user_id', user.id);

        if (productError) throw productError;

        // Update sizes
        await supabase
          .from('product_sizes')
          .delete()
          .eq('product_id', editingProduct.id);

        if (sizes.length > 0) {
          const sizesData = sizes.map(size => ({
            product_id: editingProduct.id,
            size: size.size,
            cost: size.cost,
            price: size.price
          }));

          const { error: sizesError } = await supabase
            .from('product_sizes')
            .insert(sizesData);

          if (sizesError) throw sizesError;
        }

        // Update images
        await supabase
          .from('product_images')
          .delete()
          .eq('product_id', editingProduct.id);

        if (images.length > 0) {
          const imagesData = images.map((image, index) => ({
            product_id: editingProduct.id,
            image_url: image.image_url,
            alt_text: image.alt_text || null,
            is_primary: image.is_primary,
            sort_order: image.sort_order || index
          }));

          const { error: imagesError } = await supabase
            .from('product_images')
            .insert(imagesData);

          if (imagesError) throw imagesError;
        }

        toast.success("تم تحديث المنتج بنجاح");
      } else {
        // Create new product
        const { data: productData, error: productError } = await supabase
          .from('products')
          .insert({
            user_id: user.id,
            name: formData.name,
            description: formData.description || null,
            image_url: formData.image_url || null,
            video_url: formData.video_url || null,
            category_id: formData.category_id || null,
            is_active: formData.is_active,
            featured: formData.featured,
            discount_percentage: formData.discount_percentage || null,
            sort_order: formData.sort_order || null
          })
          .select()
          .single();

        if (productError) throw productError;

        // Add sizes
        if (sizes.length > 0) {
          const sizesData = sizes.map(size => ({
            product_id: productData.id,
            size: size.size,
            cost: size.cost,
            price: size.price
          }));

          const { error: sizesError } = await supabase
            .from('product_sizes')
            .insert(sizesData);

          if (sizesError) throw sizesError;
        }

        // Add images
        if (images.length > 0) {
          const imagesData = images.map((image, index) => ({
            product_id: productData.id,
            image_url: image.image_url,
            alt_text: image.alt_text || null,
            is_primary: image.is_primary,
            sort_order: image.sort_order || index
          }));

          const { error: imagesError } = await supabase
            .from('product_images')
            .insert(imagesData);

          if (imagesError) throw imagesError;
        }

        toast.success("تم إضافة المنتج بنجاح");
      }

      resetForm();
      await loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error("حدث خطأ في حفظ المنتج");
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast.success("تم حذف المنتج بنجاح");
      await loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error("حدث خطأ في حذف المنتج");
    }
  };

  const addSize = () => {
    setSizes([...sizes, { size: "", cost: 0, price: 0 }]);
  };

  const updateSize = (index: number, field: keyof ProductSize, value: any) => {
    const updatedSizes = [...sizes];
    updatedSizes[index] = { ...updatedSizes[index], [field]: value };
    setSizes(updatedSizes);
  };

  const removeSize = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  const addImage = () => {
    setImages([...images, { image_url: "", alt_text: "", is_primary: false, sort_order: images.length }]);
  };

  const updateImage = (index: number, field: keyof ProductImage, value: any) => {
    const updatedImages = [...images];
    updatedImages[index] = { ...updatedImages[index], [field]: value };
    setImages(updatedImages);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const moveProduct = async (productId: string, direction: 'up' | 'down') => {
    const currentIndex = products.findIndex(p => p.id === productId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= products.length) return;

    try {
      const currentProduct = products[currentIndex];
      const targetProduct = products[newIndex];

      await supabase
        .from('products')
        .update({ sort_order: targetProduct.sort_order })
        .eq('id', currentProduct.id);

      await supabase
        .from('products')
        .update({ sort_order: currentProduct.sort_order })
        .eq('id', targetProduct.id);

      await loadProducts();
      toast.success("تم تغيير ترتيب المنتج");
    } catch (error) {
      console.error('Error moving product:', error);
      toast.error("حدث خطأ في تغيير الترتيب");
    }
  };

  if (loading) {
    return (
      <Card className="mx-2 md:mx-0">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Package className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
            <p>جاري تحميل المنتجات...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 mx-2 md:mx-0">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-rose-900/20 border-l-4 border-l-purple-500">
        <CardHeader>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl shadow-lg">
                <Package className={`${isMobile ? "h-5 w-5" : "h-6 w-6"} text-white`} />
              </div>
              <div>
                <CardTitle className={`font-bold text-slate-800 dark:text-white ${isMobile ? "text-lg" : "text-2xl"}`}>
                  إدارة المنتجات المتقدمة
                </CardTitle>
                <p className={`text-slate-600 dark:text-slate-400 mt-1 ${isMobile ? "text-sm" : "text-base"}`}>
                  إدارة شاملة ومتطورة للمنتجات والتصنيفات
                </p>
              </div>
            </div>
            
            <Button 
              onClick={() => setShowProductForm(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة منتج جديد
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {products.map((product, index) => (
          <Card key={product.id} className="overflow-hidden">
            <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Image className="h-12 w-12 text-gray-400" />
                </div>
              )}
              
              <div className="absolute top-2 right-2 flex gap-1">
                {product.featured && (
                  <Badge className="bg-yellow-500 text-white">
                    <Star className="h-3 w-3 ml-1" />
                    مميز
                  </Badge>
                )}
                {!product.is_active && (
                  <Badge variant="secondary">غير نشط</Badge>
                )}
              </div>

              <div className="absolute bottom-2 left-2 flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0 bg-white/80"
                  onClick={() => moveProduct(product.id, 'up')}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0 bg-white/80"
                  onClick={() => moveProduct(product.id, 'down')}
                  disabled={index === products.length - 1}
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
              {product.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {product.description}
                </p>
              )}
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {product.sizes.length} مقاس
                  </Badge>
                  {product.images.length > 0 && (
                    <Badge variant="outline">
                      {product.images.length} صورة
                    </Badge>
                  )}
                </div>
                
                {product.discount_percentage && product.discount_percentage > 0 && (
                  <Badge className="bg-red-500 text-white">
                    خصم {product.discount_percentage}%
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditProduct(product)}
                  className="flex-1"
                >
                  <Pencil className="h-3 w-3 ml-1" />
                  تعديل
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash className="h-3 w-3 ml-1" />
                      حذف
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>تأكيد حذف المنتج</AlertDialogTitle>
                      <AlertDialogDescription>
                        هل أنت متأكد من حذف هذا المنتج؟ سيتم حذف جميع المقاسات والصور المرتبطة به.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDeleteProduct(product.id)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        حذف
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد منتجات</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              ابدأ بإضافة منتجك الأول
            </p>
            <Button onClick={() => setShowProductForm(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة منتج جديد
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Product Form Dialog */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetForm}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم المنتج *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="أدخل اسم المنتج"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">التصنيف</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({...formData, category_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">بدون تصنيف</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="أدخل وصف المنتج"
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="image_url">رابط الصورة الرئيسية</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="video_url">رابط الفيديو</Label>
                  <Input
                    id="video_url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                  />
                  <Label htmlFor="is_active">نشط</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData({...formData, featured: checked})}
                  />
                  <Label htmlFor="featured">مميز</Label>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="discount">نسبة الخصم %</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({...formData, discount_percentage: Number(e.target.value)})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sort_order">ترتيب العرض</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({...formData, sort_order: Number(e.target.value)})}
                  />
                </div>
              </div>

              <Separator />

              {/* Sizes Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">المقاسات والأسعار</h3>
                  <Button onClick={addSize} size="sm">
                    <Plus className="h-4 w-4 ml-1" />
                    إضافة مقاس
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {sizes.map((size, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border rounded-lg">
                      <Input
                        placeholder="المقاس"
                        value={size.size}
                        onChange={(e) => updateSize(index, 'size', e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="التكلفة"
                        value={size.cost}
                        onChange={(e) => updateSize(index, 'cost', Number(e.target.value))}
                      />
                      <Input
                        type="number"
                        placeholder="سعر البيع"
                        value={size.price}
                        onChange={(e) => updateSize(index, 'price', Number(e.target.value))}
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-green-600">
                          ربح: {formatCurrency(size.price - size.cost)}
                        </span>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeSize(index)}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Images Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">صور المنتج</h3>
                  <Button onClick={addImage} size="sm">
                    <Plus className="h-4 w-4 ml-1" />
                    إضافة صورة
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {images.map((image, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border rounded-lg">
                      <Input
                        placeholder="رابط الصورة"
                        value={image.image_url}
                        onChange={(e) => updateImage(index, 'image_url', e.target.value)}
                      />
                      <Input
                        placeholder="النص البديل"
                        value={image.alt_text || ''}
                        onChange={(e) => updateImage(index, 'alt_text', e.target.value)}
                      />
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={image.is_primary}
                          onCheckedChange={(checked) => updateImage(index, 'is_primary', checked)}
                        />
                        <Label>صورة رئيسية</Label>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeImage(index)}
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={handleSaveProduct} className="flex-1">
                  <Save className="h-4 w-4 ml-2" />
                  {editingProduct ? "تحديث المنتج" : "حفظ المنتج"}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  إلغاء
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProductsManagementAdvanced;