
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Package, FolderPlus, Eye, EyeOff, Loader2 } from "lucide-react";
import { useProducts } from "@/context/ProductContext";
import { useCategories } from "@/context/CategoryContext";
import { formatCurrency } from "@/lib/utils";

const ProductsManagementByCategory = () => {
  const { products, addProduct, updateProduct, deleteProduct, loading: productsLoading } = useProducts();
  const { categories, addCategory, updateCategory, deleteCategory, loading: categoriesLoading } = useCategories();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  
  const [newCategory, setNewCategory] = useState({ name: "", description: "", isVisible: true });
  const [editCategory, setEditCategory] = useState({ name: "", description: "", isVisible: true });
  const [newProduct, setNewProduct] = useState({
    name: "",
    categoryId: "",
    sizes: [{ size: "", cost: 0, price: 0 }],
    isVisible: true
  });

  // Category operations
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      return;
    }

    await addCategory({
      name: newCategory.name,
      description: newCategory.description,
      isVisible: newCategory.isVisible
    });
    
    setNewCategory({ name: "", description: "", isVisible: true });
    setIsAddCategoryOpen(false);
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setEditCategory({ 
      name: category.name, 
      description: category.description || "", 
      isVisible: category.isVisible 
    });
    setIsEditCategoryOpen(true);
  };

  const handleUpdateCategory = async () => {
    if (!editCategory.name.trim() || !editingCategory) {
      return;
    }

    await updateCategory(editingCategory.id, {
      name: editCategory.name,
      description: editCategory.description,
      isVisible: editCategory.isVisible
    });
    
    setEditingCategory(null);
    setEditCategory({ name: "", description: "", isVisible: true });
    setIsEditCategoryOpen(false);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذه الفئة؟")) {
      await deleteCategory(categoryId);
    }
  };

  // Product operations
  const handleAddProduct = async () => {
    if (!newProduct.name.trim() || newProduct.sizes.some(s => !s.size.trim())) {
      return;
    }

    try {
      await addProduct({
        name: newProduct.name,
        sizes: newProduct.sizes,
        categoryId: newProduct.categoryId || undefined,
        isVisible: newProduct.isVisible
      });
      
      setNewProduct({
        name: "",
        categoryId: "",
        sizes: [{ size: "", cost: 0, price: 0 }],
        isVisible: true
      });
      setIsAddProductOpen(false);
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct) return;

    try {
      await updateProduct(editingProduct.id, editingProduct);
      setEditingProduct(null);
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      try {
        await deleteProduct(productId);
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const toggleProductVisibility = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      try {
        await updateProduct(productId, { ...product, isVisible: !product.isVisible });
      } catch (error) {
        console.error("Error updating product visibility:", error);
      }
    }
  };

  // Size operations
  const addSizeToNewProduct = () => {
    setNewProduct({
      ...newProduct,
      sizes: [...newProduct.sizes, { size: "", cost: 0, price: 0 }]
    });
  };

  const updateNewProductSize = (index: number, field: string, value: any) => {
    const updatedSizes = newProduct.sizes.map((size, i) => 
      i === index ? { ...size, [field]: value } : size
    );
    setNewProduct({ ...newProduct, sizes: updatedSizes });
  };

  const removeNewProductSize = (index: number) => {
    if (newProduct.sizes.length > 1) {
      setNewProduct({
        ...newProduct,
        sizes: newProduct.sizes.filter((_, i) => i !== index)
      });
    }
  };

  const addSizeToEditingProduct = () => {
    if (editingProduct) {
      setEditingProduct({
        ...editingProduct,
        sizes: [...editingProduct.sizes, { size: "", cost: 0, price: 0 }]
      });
    }
  };

  const updateEditingProductSize = (index: number, field: string, value: any) => {
    if (editingProduct) {
      const updatedSizes = editingProduct.sizes.map((size, i) => 
        i === index ? { ...size, [field]: value } : size
      );
      setEditingProduct({ ...editingProduct, sizes: updatedSizes });
    }
  };

  const removeEditingProductSize = (index: number) => {
    if (editingProduct && editingProduct.sizes.length > 1) {
      setEditingProduct({
        ...editingProduct,
        sizes: editingProduct.sizes.filter((_, i) => i !== index)
      });
    }
  };

  const getProductsByCategory = (categoryId: string) => {
    return products.filter(product => 
      categoryId === "all" || product.categoryId === categoryId
    );
  };

  const openEditProduct = (product: any) => {
    setEditingProduct({
      id: product.id,
      name: product.name,
      categoryId: product.categoryId || "",
      sizes: product.sizes || [{ size: "", cost: 0, price: 0 }],
      isVisible: product.isVisible ?? true
    });
  };

  if (productsLoading || categoriesLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="mt-2 text-gray-600 text-sm">جاري تحميل المنتجات...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg md:text-2xl font-bold">إدارة المنتجات والفئات</h2>
          <p className="text-xs md:text-sm text-muted-foreground">إضافة وتعديل المنتجات والفئات</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs">
                <FolderPlus className="h-3 w-3 mr-1" />
                إضافة فئة
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="w-[95vw] max-w-md">
              <DialogHeader>
                <DialogTitle className="text-sm md:text-base">إضافة فئة جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="categoryName" className="text-xs">اسم الفئة</Label>
                  <Input
                    id="categoryName"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="categoryDesc" className="text-xs">وصف الفئة</Label>
                  <Textarea
                    id="categoryDesc"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                    className="text-sm"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newCategory.isVisible}
                    onCheckedChange={(checked) => setNewCategory({...newCategory, isVisible: checked})}
                  />
                  <Label className="text-xs">ظاهرة في المتجر</Label>
                </div>
                <Button onClick={handleAddCategory} className="w-full text-xs" size="sm">
                  إضافة الفئة
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="text-xs">
                <Plus className="h-3 w-3 mr-1" />
                إضافة منتج
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-sm md:text-base">إضافة منتج جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="productName" className="text-xs">اسم المنتج</Label>
                  <Input
                    id="productName"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="categorySelect" className="text-xs">الفئة</Label>
                  <Select value={newProduct.categoryId} onValueChange={(value) => setNewProduct({...newProduct, categoryId: value})}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="اختر الفئة" />
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

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newProduct.isVisible}
                    onCheckedChange={(checked) => setNewProduct({...newProduct, isVisible: checked})}
                  />
                  <Label className="text-xs">ظاهر في المتجر</Label>
                </div>

                <div>
                  <Label className="text-xs">المقاسات والأسعار</Label>
                  {newProduct.sizes.map((size, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-xs">المقاس {index + 1}</span>
                        {newProduct.sizes.length > 1 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeNewProductSize(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">المقاس</Label>
                          <Input
                            value={size.size}
                            onChange={(e) => updateNewProductSize(index, 'size', e.target.value)}
                            placeholder="مثل: M, L, XL"
                            className="text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">التكلفة</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={size.cost}
                            onChange={(e) => updateNewProductSize(index, 'cost', parseFloat(e.target.value) || 0)}
                            className="text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">السعر</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={size.price}
                            onChange={(e) => updateNewProductSize(index, 'price', parseFloat(e.target.value) || 0)}
                            className="text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button type="button" onClick={addSizeToNewProduct} variant="outline" className="w-full mt-2 text-xs" size="sm">
                    <Plus className="h-3 w-3 mr-1" />
                    إضافة مقاس آخر
                  </Button>
                </div>

                <Button onClick={handleAddProduct} className="w-full text-xs" size="sm">
                  حفظ المنتج
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {categories.map((category) => (
          <Card 
            key={category.id} 
            className={`cursor-pointer transition-colors ${
              selectedCategory === category.id ? 'bg-primary/10 border-primary' : ''
            } ${!category.isVisible ? 'opacity-60' : ''}`}
            onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
          >
            <CardHeader className="pb-2 p-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <div className="flex items-center gap-1 min-w-0">
                  <Package className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{category.name}</span>
                  {!category.isVisible && <EyeOff className="h-3 w-3 text-gray-400 flex-shrink-0" />}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCategory(category);
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(category.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <p className="text-xs text-gray-600 mb-2 truncate">{category.description}</p>
              <Badge variant="secondary" className="text-xs">
                {getProductsByCategory(category.id).length} منتج
              </Badge>
            </CardContent>
          </Card>
        ))}

        {/* عرض جميع المنتجات */}
        <Card 
          className={`cursor-pointer transition-colors ${
            selectedCategory === "all" ? 'bg-primary/10 border-primary' : ''
          }`}
          onClick={() => setSelectedCategory(selectedCategory === "all" ? null : "all")}
        >
          <CardHeader className="pb-2 p-3">
            <CardTitle className="text-sm flex items-center gap-1">
              <Package className="h-4 w-4" />
              <span className="truncate">جميع المنتجات</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-xs text-gray-600 mb-2">عرض جميع المنتجات المسجلة</p>
            <Badge variant="secondary" className="text-xs">
              {products.length} منتج
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Products List */}
      {(selectedCategory === "all" || selectedCategory) && (
        <Card>
          <CardHeader className="p-3 md:p-6">
            <CardTitle className="text-sm md:text-base">
              {selectedCategory === "all" 
                ? "جميع المنتجات" 
                : categories.find(c => c.id === selectedCategory)?.name
              }
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6">
            <div className="space-y-4">
              {(selectedCategory === "all" ? products : getProductsByCategory(selectedCategory || "")).map((product) => (
                <div key={product.id} className={`border rounded-lg p-3 ${!product.isVisible ? 'opacity-60' : ''}`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="font-semibold text-sm md:text-base truncate">{product.name}</h3>
                      {!product.isVisible && <EyeOff className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                    </div>
                    <div className="flex flex-wrap gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => toggleProductVisibility(product.id)}
                      >
                        {product.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={() => openEditProduct(product)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {product.sizes.map((size, index) => (
                      <div key={index} className="bg-gray-50 p-2 rounded text-xs">
                        <div className="font-medium text-center mb-1">{size.size}</div>
                        <div className="space-y-1">
                          <div>التكلفة: {formatCurrency(size.cost)}</div>
                          <div>السعر: {formatCurrency(size.price)}</div>
                          <div className="font-medium text-green-600">
                            الربح: {formatCurrency(size.price - size.cost)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {(selectedCategory === "all" ? products : getProductsByCategory(selectedCategory || "")).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">لا توجد منتجات في هذه الفئة</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
        <DialogContent dir="rtl" className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm md:text-base">تعديل الفئة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editCategoryName" className="text-xs">اسم الفئة</Label>
              <Input
                id="editCategoryName"
                value={editCategory.name}
                onChange={(e) => setEditCategory({...editCategory, name: e.target.value})}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="editCategoryDesc" className="text-xs">وصف الفئة</Label>
              <Textarea
                id="editCategoryDesc"
                value={editCategory.description}
                onChange={(e) => setEditCategory({...editCategory, description: e.target.value})}
                className="text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={editCategory.isVisible}
                onCheckedChange={(checked) => setEditCategory({...editCategory, isVisible: checked})}
              />
              <Label className="text-xs">ظاهرة في المتجر</Label>
            </div>
            <Button onClick={handleUpdateCategory} className="w-full text-xs" size="sm">
              تحديث الفئة
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      {editingProduct && (
        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-sm md:text-base">تعديل المنتج</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editProductName" className="text-xs">اسم المنتج</Label>
                <Input
                  id="editProductName"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor="editCategorySelect" className="text-xs">الفئة</Label>
                <Select value={editingProduct.categoryId} onValueChange={(value) => setEditingProduct({...editingProduct, categoryId: value})}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="اختر الفئة" />
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

              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingProduct.isVisible}
                  onCheckedChange={(checked) => setEditingProduct({...editingProduct, isVisible: checked})}
                />
                <Label className="text-xs">ظاهر في المتجر</Label>
              </div>

              <div>
                <Label className="text-xs">المقاسات والأسعار</Label>
                {editingProduct.sizes.map((size, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-xs">المقاس {index + 1}</span>
                      {editingProduct.sizes.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeEditingProductSize(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">المقاس</Label>
                        <Input
                          value={size.size}
                          onChange={(e) => updateEditingProductSize(index, 'size', e.target.value)}
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">التكلفة</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={size.cost}
                          onChange={(e) => updateEditingProductSize(index, 'cost', parseFloat(e.target.value) || 0)}
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">السعر</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={size.price}
                          onChange={(e) => updateEditingProductSize(index, 'price', parseFloat(e.target.value) || 0)}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button type="button" onClick={addSizeToEditingProduct} variant="outline" className="w-full mt-2 text-xs" size="sm">
                  <Plus className="h-3 w-3 mr-1" />
                  إضافة مقاس آخر
                </Button>
              </div>

              <Button onClick={handleEditProduct} className="w-full text-xs" size="sm">
                حفظ التعديلات
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ProductsManagementByCategory;
