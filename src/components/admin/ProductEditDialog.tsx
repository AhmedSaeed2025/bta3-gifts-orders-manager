
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, X, Eye, EyeOff, Star, Globe, Image, Video, Tag } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  category_id?: string;
  is_active: boolean;
  featured: boolean;
  discount_percentage?: number;
  product_sizes: ProductSize[];
  product_images?: ProductImage[];
  categories?: { name: string };
}

interface ProductSize {
  id: string;
  size: string;
  cost: number;
  price: number;
}

interface ProductImage {
  id: string;
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
}

interface Category {
  id: string;
  name: string;
}

interface ProductEditDialogProps {
  product: Product | null;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const ProductEditDialog = ({ product, categories, isOpen, onClose, onUpdate }: ProductEditDialogProps) => {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    video_url: '',
    category_id: '',
    is_active: true,
    featured: false,
    discount_percentage: 0,
    sizes: [{ id: '', size: '', cost: 0, price: 0 }],
    images: [{ id: '', image_url: '', alt_text: '', is_primary: true, sort_order: 0 }]
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        image_url: product.image_url || '',
        video_url: product.video_url || '',
        category_id: product.category_id || '',
        is_active: product.is_active,
        featured: product.featured,
        discount_percentage: product.discount_percentage || 0,
        sizes: product.product_sizes?.length > 0 
          ? product.product_sizes.map(size => ({
              id: size.id,
              size: size.size,
              cost: size.cost,
              price: size.price
            }))
          : [{ id: '', size: '', cost: 0, price: 0 }],
        images: product.product_images?.length > 0
          ? product.product_images.map(img => ({
              id: img.id,
              image_url: img.image_url,
              alt_text: img.alt_text || '',
              is_primary: img.is_primary,
              sort_order: img.sort_order
            }))
          : [{ id: '', image_url: '', alt_text: '', is_primary: true, sort_order: 0 }]
      });
    }
  }, [product]);

  const updateProductMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!product) return;
      
      // Update product basic info
      const { error: productError } = await supabase
        .from('products')
        .update({
          name: data.name,
          description: data.description,
          image_url: data.image_url,
          video_url: data.video_url,
          category_id: data.category_id || null,
          is_active: data.is_active,
          featured: data.featured,
          discount_percentage: data.discount_percentage
        })
        .eq('id', product.id);

      if (productError) throw productError;

      // Delete existing sizes and images
      await supabase.from('product_sizes').delete().eq('product_id', product.id);
      await supabase.from('product_images').delete().eq('product_id', product.id);

      // Insert new sizes
      const sizesToInsert = data.sizes
        .filter(size => size.size.trim() !== '')
        .map(size => ({
          product_id: product.id,
          size: size.size,
          cost: size.cost,
          price: size.price
        }));

      if (sizesToInsert.length > 0) {
        const { error: sizesError } = await supabase
          .from('product_sizes')
          .insert(sizesToInsert);
        if (sizesError) throw sizesError;
      }

      // Insert new images
      const imagesToInsert = data.images
        .filter(img => img.image_url.trim() !== '')
        .map((img, index) => ({
          product_id: product.id,
          image_url: img.image_url,
          alt_text: img.alt_text,
          is_primary: index === 0,
          sort_order: index
        }));

      if (imagesToInsert.length > 0) {
        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(imagesToInsert);
        if (imagesError) throw imagesError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('تم تحديث المنتج بنجاح');
      onUpdate();
      onClose();
    },
    onError: (error: any) => {
      console.error('Error updating product:', error);
      toast.error('حدث خطأ في تحديث المنتج');
    }
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      if (!product) return;
      
      const { error } = await supabase
        .from('products')
        .update({ is_active: isActive })
        .eq('id', product.id);
      
      if (error) throw error;
    },
    onSuccess: (_, isActive) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(isActive ? 'تم إظهار المنتج في المتجر' : 'تم إخفاء المنتج من المتجر');
      onUpdate();
    },
    onError: (error: any) => {
      console.error('Error toggling visibility:', error);
      toast.error('حدث خطأ في تحديث حالة المنتج');
    }
  });

  const addSize = () => {
    setFormData(prev => ({
      ...prev,
      sizes: [...prev.sizes, { id: '', size: '', cost: 0, price: 0 }]
    }));
  };

  const removeSize = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index)
    }));
  };

  const updateSize = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.map((size, i) => 
        i === index ? { ...size, [field]: value } : size
      )
    }));
  };

  const addImage = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, { 
        id: '', 
        image_url: '', 
        alt_text: '', 
        is_primary: false, 
        sort_order: prev.images.length 
      }]
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const updateImage = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => 
        i === index ? { ...img, [field]: value } : img
      )
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('يرجى إدخال اسم المنتج');
      return;
    }
    updateProductMutation.mutate(formData);
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>تعديل المنتج: {product.name}</span>
            <div className="flex items-center gap-2">
              <Button
                variant={product.is_active ? "default" : "secondary"}
                size="sm"
                onClick={() => toggleVisibilityMutation.mutate(!product.is_active)}
                disabled={toggleVisibilityMutation.isPending}
              >
                {product.is_active ? (
                  <>
                    <Eye className="h-4 w-4 ml-1" />
                    ظاهر
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 ml-1" />
                    مخفي
                  </>
                )}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>اسم المنتج *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="اسم المنتج"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>الفئة</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
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
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="وصف المنتج"
              rows={3}
            />
          </div>

          {/* Media */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                رابط الصورة الرئيسية
              </Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                رابط الفيديو
              </Label>
              <Input
                value={formData.video_url}
                onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-50 to-yellow-100 p-3 rounded-lg border border-yellow-200">
              <Switch
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
              />
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-600" />
                <Label className="text-yellow-800 font-medium">منتج مميز</Label>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
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
                value={formData.discount_percentage}
                onChange={(e) => setFormData(prev => ({ ...prev, discount_percentage: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
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
              <Button type="button" variant="outline" size="sm" onClick={addImage}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {formData.images.map((image, index) => (
              <div key={index} className="grid grid-cols-5 gap-2 items-end">
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">رابط الصورة</Label>
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={image.image_url}
                    onChange={(e) => updateImage(index, 'image_url', e.target.value)}
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">وصف الصورة</Label>
                  <Input
                    placeholder="وصف الصورة"
                    value={image.alt_text}
                    onChange={(e) => updateImage(index, 'alt_text', e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeImage(index)}
                  disabled={formData.images.length === 1}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Sizes and Prices */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>المقاسات والأسعار</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSize}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {formData.sizes.map((size, index) => {
              const discountedPrice = size.price * (1 - (formData.discount_percentage / 100));
              const profit = discountedPrice - size.cost;
              
              return (
                <div key={index} className="grid grid-cols-6 gap-2 items-end">
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
                    <Label className="text-xs">السعر الأصلي</Label>
                    <Input
                      type="number"
                      value={size.price}
                      onChange={(e) => updateSize(index, 'price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">السعر بعد الخصم</Label>
                    <div className="p-2 bg-gray-50 rounded text-sm font-medium text-center">
                      {formatCurrency(discountedPrice)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">الربح المتوقع</Label>
                    <Badge variant={profit > 0 ? "default" : "destructive"} className="w-full justify-center">
                      {formatCurrency(profit)}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeSize(index)}
                    disabled={formData.sizes.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button 
              type="submit" 
              disabled={updateProductMutation.isPending}
              className="flex-1"
            >
              <Save className="h-4 w-4 ml-2" />
              {updateProductMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductEditDialog;
