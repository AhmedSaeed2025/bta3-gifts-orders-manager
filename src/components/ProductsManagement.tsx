
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProducts } from "@/context/ProductContext";
import { formatCurrency } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Product, ProductSize } from "@/types";
import { Trash, Pencil, Plus, Cloud, CloudDownload, Loader2 } from "lucide-react";
import { useProductSync } from "@/hooks/useProductSync";
import { useAuth } from "@/hooks/useAuth";

const ProductsManagement = () => {
  const { products, addProduct, updateProduct, deleteProduct, loading } = useProducts();
  const { syncStatus, syncToSupabase, syncFromSupabase } = useProductSync();
  const { user } = useAuth();
  
  const [editMode, setEditMode] = useState<"product" | "size" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editSizeProduct, setEditSizeProduct] = useState<string | null>(null);
  const [editSizeValue, setEditSizeValue] = useState<string | null>(null);
  
  const [productName, setProductName] = useState("");
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
  
  // Product form handling
  const handleSubmitProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (editMode === "product" && editId) {
      const product = products.find(p => p.id === editId);
      if (product) {
        await updateProduct(editId, { ...product, name: productName });
        setEditMode(null);
        setEditId(null);
      }
    } else {
      await addProduct({ 
        name: productName, 
        sizes: [], 
        isVisible: true 
      });
    }
    
    setProductName("");
  };
  
  const handleEditProduct = (product: Product) => {
    setProductName(product.name);
    setEditMode("product");
    setEditId(product.id);
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
    setSizeForm({
      productId: null,
      size: "",
      cost: 0,
      price: 0
    });
  };

  if (loading) {
    return (
      <Card className="mx-2 md:mx-0">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-2 md:mx-0">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <CardTitle className="text-lg md:text-xl">إدارة المنتجات والمقاسات</CardTitle>
          
          {user && (
            <div className="flex flex-wrap gap-2">
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
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="px-4 md:px-6">
        {/* Product Form */}
        <div className="mb-6 border p-3 md:p-4 rounded-md">
          <h3 className="font-medium mb-3 text-sm md:text-base">{editMode === "product" ? "تعديل منتج" : "إضافة منتج جديد"}</h3>
          <form onSubmit={handleSubmitProduct} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productName" className="text-xs md:text-sm">اسم المنتج</Label>
              <div className="flex gap-2">
                <Input
                  id="productName"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="أدخل اسم المنتج"
                  required
                  className="text-sm"
                />
                <Button 
                  type="submit" 
                  className="bg-gift-primary hover:bg-gift-primaryHover text-xs md:text-sm px-3 md:px-4"
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
                    className="text-xs md:text-sm"
                  >
                    إلغاء
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
        
        {/* Size Form */}
        <div className="mb-6 border p-3 md:p-4 rounded-md">
          <h3 className="font-medium mb-3 text-sm md:text-base">{editMode === "size" ? "تعديل مقاس" : "إضافة مقاس جديد"}</h3>
          <form onSubmit={handleSubmitSize} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size" className="text-xs md:text-sm">المقاس</Label>
                <Input
                  id="size"
                  value={sizeForm.size}
                  onChange={(e) => setSizeForm({...sizeForm, size: e.target.value})}
                  placeholder="أدخل المقاس"
                  required
                  disabled={!sizeForm.productId}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cost" className="text-xs md:text-sm">التكلفة</Label>
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
                <Label htmlFor="price" className="text-xs md:text-sm">سعر البيع</Label>
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
                  className="bg-gift-primary hover:bg-gift-primaryHover text-xs md:text-sm"
                  size="sm"
                >
                  {editMode === "size" ? "تعديل المقاس" : "إضافة المقاس"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={cancelEdit}
                  size="sm"
                  className="text-xs md:text-sm"
                >
                  إلغاء
                </Button>
              </div>
            )}
          </form>
        </div>
        
        {/* Products List */}
        <div className="space-y-6 md:space-y-8">
          {products.map((product) => (
            <div key={product.id} className="border rounded-md p-3 md:p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3">
                <h3 className="text-base md:text-lg font-medium">{product.name}</h3>
                <div className="flex flex-wrap gap-1 md:gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 md:h-8 text-xs px-2" 
                    onClick={() => handleAddSizeToProduct(product.id)}
                  >
                    <Plus className="h-3 w-3 ml-1" /> إضافة مقاس
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 md:h-8 text-xs px-2" 
                    onClick={() => handleEditProduct(product)}
                  >
                    <Pencil className="h-3 w-3 ml-1" /> تعديل
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        className="h-7 md:h-8 text-xs px-2"
                      >
                        <Trash className="h-3 w-3 ml-1" /> حذف
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
              </div>
              
              {/* Sizes Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs md:text-sm">المقاس</TableHead>
                      <TableHead className="text-xs md:text-sm">التكلفة</TableHead>
                      <TableHead className="text-xs md:text-sm">سعر البيع</TableHead>
                      <TableHead className="text-xs md:text-sm">الربح</TableHead>
                      <TableHead className="text-left text-xs md:text-sm">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.sizes.length > 0 ? (
                      product.sizes.map((size) => (
                        <TableRow key={`${product.id}-${size.size}`}>
                          <TableCell className="text-xs md:text-sm">{size.size}</TableCell>
                          <TableCell className="text-xs md:text-sm">{formatCurrency(size.cost)}</TableCell>
                          <TableCell className="text-xs md:text-sm">{formatCurrency(size.price)}</TableCell>
                          <TableCell className="text-xs md:text-sm">{formatCurrency(size.price - size.cost)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 w-6 p-0" 
                                onClick={() => handleEditSize(product.id, size)}
                              >
                                <Pencil className="h-3 w-3" />
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
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-xs md:text-sm">
                          لا توجد مقاسات لهذا المنتج
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
          
          {products.length === 0 && (
            <div className="text-center py-8 border rounded-md">
              <p className="text-gray-500 dark:text-gray-400 text-sm">لا توجد منتجات مسجلة</p>
              <Button 
                className="mt-2 bg-gift-primary hover:bg-gift-primaryHover text-xs md:text-sm"
                onClick={() => setProductName("")}
                size="sm"
              >
                إضافة منتج جديد
              </Button>
            </div>
          )}
        </div>
        
        {/* Reset Products */}
        <div className="mt-8 border-t pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                className="w-full md:w-auto text-xs md:text-sm"
                size="sm"
              >
                إعادة تعيين جميع المنتجات
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>تأكيد إعادة التعيين</AlertDialogTitle>
                <AlertDialogDescription>
                  سيتم حذف جميع المنتجات والمقاسات وإعادة تعيينها إلى الإعدادات الافتراضية. هل أنت متأكد من المتابعة؟
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-red-500 hover:bg-red-600"
                  onClick={handleClearAllProducts}
                >
                  إعادة تعيين
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductsManagement;
