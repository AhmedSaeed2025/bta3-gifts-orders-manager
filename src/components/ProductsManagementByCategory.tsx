
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Package, FolderPlus } from "lucide-react";
import { useProducts } from "@/context/ProductContext";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface ProductSize {
  size: string;
  cost: number;
  price: number;
}

interface Product {
  id: string;
  name: string;
  categoryId?: string;
  sizes: ProductSize[];
}

const ProductsManagementByCategory = () => {
  const { products, addProduct, updateProduct, deleteProduct, loading } = useProducts();
  const [categories, setCategories] = useState<Category[]>([
    { id: "1", name: "ملابس رجالية", description: "ملابس للرجال" },
    { id: "2", name: "ملابس نسائية", description: "ملابس للنساء" },
    { id: "3", name: "أحذية", description: "أحذية متنوعة" },
    { id: "4", name: "إكسسوارات", description: "إكسسوارات مختلفة" }
  ]);
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [editCategory, setEditCategory] = useState({ name: "", description: "" });
  const [newProduct, setNewProduct] = useState({
    name: "",
    categoryId: "",
    sizes: [{ size: "", cost: 0, price: 0 }]
  });

  // Category operations
  const handleAddCategory = () => {
    if (!newCategory.name.trim()) {
      toast.error("يرجى إدخال اسم الفئة");
      return;
    }

    const category: Category = {
      id: Date.now().toString(),
      name: newCategory.name,
      description: newCategory.description
    };

    setCategories([...categories, category]);
    setNewCategory({ name: "", description: "" });
    setIsAddCategoryOpen(false);
    toast.success("تم إضافة الفئة بنجاح");
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setEditCategory({ name: category.name, description: category.description || "" });
    setIsEditCategoryOpen(true);
  };

  const handleUpdateCategory = () => {
    if (!editCategory.name.trim() || !editingCategory) {
      toast.error("يرجى إدخال اسم الفئة");
      return;
    }

    setCategories(categories.map(cat => 
      cat.id === editingCategory.id 
        ? { ...cat, name: editCategory.name, description: editCategory.description }
        : cat
    ));
    
    setEditingCategory(null);
    setEditCategory({ name: "", description: "" });
    setIsEditCategoryOpen(false);
    toast.success("تم تحديث الفئة بنجاح");
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذه الفئة؟")) {
      setCategories(categories.filter(cat => cat.id !== categoryId));
      toast.success("تم حذف الفئة بنجاح");
    }
  };

  // Product operations
  const handleAddProduct = async () => {
    if (!newProduct.name.trim() || newProduct.sizes.some(s => !s.size.trim())) {
      toast.error("يرجى إكمال جميع بيانات المنتج");
      return;
    }

    try {
      await addProduct({
        name: newProduct.name,
        sizes: newProduct.sizes
      });
      
      setNewProduct({
        name: "",
        categoryId: "",
        sizes: [{ size: "", cost: 0, price: 0 }]
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
      categoryId === "all"
    );
  };

  const openEditProduct = (product: any) => {
    setEditingProduct({
      id: product.id,
      name: product.name,
      categoryId: product.categoryId || "",
      sizes: product.sizes || [{ size: "", cost: 0, price: 0 }]
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">جاري تحميل المنتجات...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">إدارة المنتجات والفئات</h2>
        <div className="flex gap-2">
          <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderPlus className="h-4 w-4 mr-2" />
                إضافة فئة
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة فئة جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="categoryName">اسم الفئة</Label>
                  <Input
                    id="categoryName"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="categoryDesc">وصف الفئة</Label>
                  <Textarea
                    id="categoryDesc"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                  />
                </div>
                <Button onClick={handleAddCategory} className="w-full">
                  إضافة الفئة
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                إضافة منتج
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة منتج جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="productName">اسم المنتج</Label>
                  <Input
                    id="productName"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  />
                </div>

                <div>
                  <Label>المقاسات والأسعار</Label>
                  {newProduct.sizes.map((size, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">المقاس {index + 1}</span>
                        {newProduct.sizes.length > 1 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeNewProductSize(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>المقاس</Label>
                          <Input
                            value={size.size}
                            onChange={(e) => updateNewProductSize(index, 'size', e.target.value)}
                            placeholder="مثل: M, L, XL"
                          />
                        </div>
                        <div>
                          <Label>التكلفة</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={size.cost}
                            onChange={(e) => updateNewProductSize(index, 'cost', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label>السعر</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={size.price}
                            onChange={(e) => updateNewProductSize(index, 'price', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button type="button" onClick={addSizeToNewProduct} variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    إضافة مقاس آخر
                  </Button>
                </div>

                <Button onClick={handleAddProduct} className="w-full">
                  حفظ المنتج
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((category) => (
          <Card 
            key={category.id} 
            className={`cursor-pointer transition-colors ${
              selectedCategory === category.id ? 'bg-primary/10 border-primary' : ''
            }`}
            onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {category.name}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCategory(category);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(category.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">{category.description}</p>
              <Badge variant="secondary">
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
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              جميع المنتجات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-2">عرض جميع المنتجات المسجلة</p>
            <Badge variant="secondary">
              {products.length} منتج
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Products List */}
      {(selectedCategory === "all" || selectedCategory) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedCategory === "all" 
                ? "جميع المنتجات" 
                : categories.find(c => c.id === selectedCategory)?.name
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(selectedCategory === "all" ? products : getProductsByCategory(selectedCategory || "")).map((product) => (
                <div key={product.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditProduct(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {product.sizes.map((size, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded">
                        <div className="font-medium text-center mb-2">{size.size}</div>
                        <div className="text-sm space-y-1">
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
                  لا توجد منتجات في هذه الفئة
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل الفئة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editCategoryName">اسم الفئة</Label>
              <Input
                id="editCategoryName"
                value={editCategory.name}
                onChange={(e) => setEditCategory({...editCategory, name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="editCategoryDesc">وصف الفئة</Label>
              <Textarea
                id="editCategoryDesc"
                value={editCategory.description}
                onChange={(e) => setEditCategory({...editCategory, description: e.target.value})}
              />
            </div>
            <Button onClick={handleUpdateCategory} className="w-full">
              تحديث الفئة
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      {editingProduct && (
        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>تعديل المنتج</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editProductName">اسم المنتج</Label>
                <Input
                  id="editProductName"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                />
              </div>

              <div>
                <Label>المقاسات والأسعار</Label>
                {editingProduct.sizes.map((size, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">المقاس {index + 1}</span>
                      {editingProduct.sizes.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeEditingProductSize(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>المقاس</Label>
                        <Input
                          value={size.size}
                          onChange={(e) => updateEditingProductSize(index, 'size', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>التكلفة</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={size.cost}
                          onChange={(e) => updateEditingProductSize(index, 'cost', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>السعر</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={size.price}
                          onChange={(e) => updateEditingProductSize(index, 'price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button type="button" onClick={addSizeToEditingProduct} variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة مقاس آخر
                </Button>
              </div>

              <Button onClick={handleEditProduct} className="w-full">
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
