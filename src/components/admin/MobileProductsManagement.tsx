import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useProducts } from "@/context/ProductContext";
import { formatCurrency } from "@/lib/utils";
import { Product, ProductSize } from "@/types";
import { Trash, Edit, Plus, Cloud, CloudDownload, Loader2, FolderPlus, Package, DollarSign, Hash, Palette } from "lucide-react";
import { useProductSync } from "@/hooks/useProductSync";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  description?: string;
}

const MobileProductsManagement = () => {
  const { products, addProduct, updateProduct, deleteProduct, loading } = useProducts();
  const { syncStatus, syncToSupabase, syncFromSupabase } = useProductSync();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [editMode, setEditMode] = useState<"product" | "size" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editSizeProduct, setEditSizeProduct] = useState<string | null>(null);
  const [editSizeValue, setEditSizeValue] = useState<string | null>(null);
  
  const [productName, setProductName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("no-category");
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: ""
  });
  
  const [sizeForm, setSizeForm] = useState<{
    productId: string | null;
    size: string;
    cost: number;
    price: number;
  }>({
    productId: null,
    size: "",
    cost: 0,
    price: 0
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
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Create/Update category mutation
  const categoryMutation = useMutation({
    mutationFn: async (data: typeof categoryForm) => {
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');
      
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(data)
          .eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories')
          .insert({ ...data, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '' });
      toast.success(editingCategory ? 'تم تحديث الفئة' : 'تم إضافة الفئة');
    },
    onError: (error) => {
      console.error('Error saving category:', error);
      toast.error('حدث خطأ في حفظ الفئة');
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');
      
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('تم حذف الفئة');
    },
    onError: (error) => {
      console.error('Error deleting category:', error);
      toast.error('حدث خطأ في حذف الفئة');
    }
  });
  
  // Product form handling
  const handleSubmitProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (editMode === "product" && editId) {
      const product = products.find(p => p.id === editId);
      if (product) {
        await updateProduct(editId, { 
          ...product, 
          name: productName,
          category: selectedCategory !== "no-category" ? selectedCategory : undefined
        });
        setEditMode(null);
        setEditId(null);
      }
    } else {
      await addProduct({ 
        name: productName, 
        sizes: [],
        category: selectedCategory !== "no-category" ? selectedCategory : undefined
      });
    }
    
    setProductName("");
    setSelectedCategory("no-category");
  };
  
  const handleEditProduct = (product: Product) => {
    setProductName(product.name);
    setSelectedCategory(product.category || "no-category");
    setEditMode("product");
    setEditId(product.id);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || ''
    });
    setIsCategoryDialogOpen(true);
  };

  const handleDeleteCategory = (categoryId: string) => {
    deleteCategoryMutation.mutate(categoryId);
  };
  
  // Size form handling
  const handleSubmitSize = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!sizeForm.productId) return;
    
    const product = products.find(p => p.id === sizeForm.productId);
    if (!product) return;

    if (editMode === "size" && editSizeProduct && editSizeValue) {
      // Update existing size
      const updatedSizes = product.sizes.map(size => 
        size.size === editSizeValue 
          ? { size: sizeForm.size, cost: sizeForm.cost, price: sizeForm.price }
          : size
      );
      await updateProduct(editSizeProduct, { ...product, sizes: updatedSizes });
      setEditMode(null);
      setEditSizeProduct(null);
      setEditSizeValue(null);
    } else {
      // Add new size
      const newSize = {
        size: sizeForm.size,
        cost: sizeForm.cost,
        price: sizeForm.price
      };
      const updatedSizes = [...product.sizes, newSize];
      await updateProduct(sizeForm.productId, { ...product, sizes: updatedSizes });
    }
    
    setSizeForm({
      productId: null,
      size: "",
      cost: 0,
      price: 0
    });
  };
  
  const handleEditSize = (productId: string, size: ProductSize) => {
    setSizeForm({
      productId: productId,
      size: size.size,
      cost: size.cost,
      price: size.price
    });
    setEditMode("size");
    setEditSizeProduct(productId);
    setEditSizeValue(size.size);
  };
  
  const handleDeleteSize = async (productId: string, sizeToDelete: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const updatedSizes = product.sizes.filter(size => size.size !== sizeToDelete);
    await updateProduct(productId, { ...product, sizes: updatedSizes });
  };
  
  const handleAddSizeToProduct = (productId: string) => {
    setSizeForm({
      ...sizeForm,
      productId
    });
    setEditMode(null);
    setEditSizeProduct(null);
    setEditSizeValue(null);
  };
  
  const handleClearAllProducts = async () => {
    // Delete all products
    for (const product of products) {
      await deleteProduct(product.id);
    }
  };
  
  const cancelEdit = () => {
    setEditMode(null);
    setEditId(null);
    setEditSizeProduct(null);
    setEditSizeValue(null);
    setProductName("");
    setSelectedCategory("no-category");
    setSizeForm({
      productId: null,
      size: "",
      cost: 0,
      price: 0
    });
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'بدون فئة';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Actions */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">إدارة المنتجات والفئات</CardTitle>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {/* Category Management Dialog */}
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryForm({ name: '', description: '' });
                    }}
                  >
                    <FolderPlus className="h-3 w-3 ml-1" />
                    إدارة الفئات
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
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
                      <Input
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="وصف مختصر للفئة"
                      />
                    </div>
                    <Button 
                      onClick={() => categoryMutation.mutate(categoryForm)}
                      disabled={categoryMutation.isPending || !categoryForm.name.trim()}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      {categoryMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                      {editingCategory ? 'تحديث الفئة' : 'إضافة الفئة'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {user && (
                <>
                  <Button 
                    onClick={syncToSupabase}
                    disabled={syncStatus === 'syncing'}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-xs"
                  >
                    {syncStatus === 'syncing' ? (
                      <Loader2 className="h-3 w-3 ml-1 animate-spin" />
                    ) : (
                      <Cloud className="h-3 w-3 ml-1" />
                    )}
                    رفع للسيرفر
                  </Button>
                  <Button 
                    onClick={syncFromSupabase}
                    disabled={syncStatus === 'syncing'}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                  >
                    {syncStatus === 'syncing' ? (
                      <Loader2 className="h-3 w-3 ml-1 animate-spin" />
                    ) : (
                      <CloudDownload className="h-3 w-3 ml-1" />
                    )}
                    تحديث من السيرفر
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Categories Display */}
      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4" />
              الفئات المتاحة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {categories.map((category) => (
                <div key={category.id} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{category.name}</h4>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>تأكيد حذف الفئة</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف هذه الفئة؟ لا يمكن التراجع عن هذه العملية.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-red-500 hover:bg-red-600"
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  {category.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">{category.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">إدارة المنتجات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product Form */}
          <div className="border p-3 rounded-md bg-blue-50 dark:bg-blue-950/50">
            <h3 className="font-medium mb-3 text-sm">{editMode === "product" ? "تعديل منتج" : "إضافة منتج جديد"}</h3>
            <form onSubmit={handleSubmitProduct} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="productName" className="text-xs">اسم المنتج</Label>
                <Input
                  id="productName"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="أدخل اسم المنتج"
                  required
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs">الفئة</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="text-sm">
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
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary/90 text-xs px-3"
                  size="sm"
                >
                  {editMode === "product" ? "تعديل" : "إضافة"}
                </Button>
                {editMode === "product" && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={cancelEdit}
                    size="sm"
                    className="text-xs"
                  >
                    إلغاء
                  </Button>
                )}
              </div>
            </form>
          </div>
          
          {/* Size Form */}
          <div className="border p-3 rounded-md bg-green-50 dark:bg-green-950/50">
            <h3 className="font-medium mb-3 text-sm">{editMode === "size" ? "تعديل مقاس" : "إضافة مقاس جديد"}</h3>
            <form onSubmit={handleSubmitSize} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="size" className="text-xs">المقاس</Label>
                  <Input
                    id="size"
                    value={sizeForm.size}
                    onChange={(e) => setSizeForm({...sizeForm, size: e.target.value})}
                    placeholder="مقاس"
                    required
                    disabled={!sizeForm.productId}
                    className="text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cost" className="text-xs">التكلفة</Label>
                  <Input
                    id="cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={sizeForm.cost}
                    onChange={(e) => setSizeForm({...sizeForm, cost: parseFloat(e.target.value) || 0})}
                    required
                    disabled={!sizeForm.productId}
                    className="text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-xs">السعر</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={sizeForm.price}
                    onChange={(e) => setSizeForm({...sizeForm, price: parseFloat(e.target.value) || 0})}
                    required
                    disabled={!sizeForm.productId}
                    className="text-sm"
                  />
                </div>
              </div>
              
              {sizeForm.productId && (
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    className="bg-green-600 hover:bg-green-700 text-xs"
                    size="sm"
                  >
                    {editMode === "size" ? "تعديل المقاس" : "إضافة المقاس"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={cancelEdit}
                    size="sm"
                    className="text-xs"
                  >
                    إلغاء
                  </Button>
                </div>
              )}
            </form>
          </div>
        </CardContent>
      </Card>
      
      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            قائمة المنتجات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {products.map((product) => (
              <AccordionItem key={product.id} value={product.id}>
                <AccordionTrigger className="text-right">
                  <div className="flex items-center justify-between w-full ml-4">
                    <div className="text-left">
                      <h3 className="text-sm font-medium">{product.name}</h3>
                      {product.category && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {getCategoryName(product.category)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-6 text-xs px-2" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddSizeToProduct(product.id);
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-6 text-xs px-2" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditProduct(product);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-3">
                    {/* Product Actions */}
                    <div className="flex gap-2 pb-3 border-b">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs" 
                        onClick={() => handleAddSizeToProduct(product.id)}
                      >
                        <Plus className="h-3 w-3 ml-1" /> إضافة مقاس
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="text-xs"
                          >
                            <Trash className="h-3 w-3 ml-1" /> حذف المنتج
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>تأكيد حذف المنتج</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف هذا المنتج وجميع مقاساته؟ لا يمكن التراجع عن هذه العملية.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-red-500 hover:bg-red-600"
                              onClick={() => deleteProduct(product.id)}
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    {/* Sizes List */}
                    <div className="space-y-2">
                      {product.sizes.length > 0 ? (
                        product.sizes.map((size) => (
                          <div key={`${product.id}-${size.size}`} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <Badge variant="outline" className="text-xs">
                                    <Hash className="h-3 w-3 ml-1" />
                                    {size.size}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div className="text-center p-2 bg-red-100 dark:bg-red-900/50 rounded">
                                    <div className="text-red-600 dark:text-red-400 font-medium">التكلفة</div>
                                    <div className="font-bold">{formatCurrency(size.cost)}</div>
                                  </div>
                                  <div className="text-center p-2 bg-green-100 dark:bg-green-900/50 rounded">
                                    <div className="text-green-600 dark:text-green-400 font-medium">السعر</div>
                                    <div className="font-bold">{formatCurrency(size.price)}</div>
                                  </div>
                                  <div className="text-center p-2 bg-blue-100 dark:bg-blue-900/50 rounded">
                                    <div className="text-blue-600 dark:text-blue-400 font-medium">الربح</div>
                                    <div className="font-bold text-blue-600">{formatCurrency(size.price - size.cost)}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1 ml-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleEditSize(product.id, size)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                    >
                                      <Trash className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>تأكيد حذف المقاس</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        هل أنت متأكد من حذف هذا المقاس؟ لا يمكن التراجع عن هذه العملية.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                      <AlertDialogAction 
                                        className="bg-red-500 hover:bg-red-600"
                                        onClick={() => handleDeleteSize(product.id, size.size)}
                                      >
                                        حذف
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          لا توجد مقاسات مضافة لهذا المنتج
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          {products.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد منتجات مضافة بعد</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileProductsManagement;
