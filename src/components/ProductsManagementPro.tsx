import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProducts } from "@/context/ProductContext";
import { formatCurrency } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Product, ProductSize } from "@/types";
import { Trash, Pencil, Plus, Cloud, CloudDownload, Loader2, Package, TrendingUp, DollarSign } from "lucide-react";
import { useProductSync } from "@/hooks/useProductSync";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

const ProductsManagementPro = () => {
  const { products, addProduct, updateProduct, deleteProduct, loading } = useProducts();
  const { syncStatus, syncToSupabase, syncFromSupabase } = useProductSync();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
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
  
  const handleSubmitSize = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!sizeForm.productId) return;
    
    const product = products.find(p => p.id === sizeForm.productId);
    if (!product) return;

    if (editMode === "size" && editSizeProduct && editSizeValue) {
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
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );
  }

  // Calculate statistics
  const totalProducts = products.length;
  const totalSizes = products.reduce((sum, product) => sum + product.sizes.length, 0);
  const avgProfitMargin = products.length > 0 
    ? products.reduce((sum, product) => {
        const productAvg = product.sizes.length > 0 
          ? product.sizes.reduce((sSum, size) => sSum + (size.price - size.cost), 0) / product.sizes.length
          : 0;
        return sum + productAvg;
      }, 0) / products.length
    : 0;

  return (
    <div className="space-y-6 mx-2 md:mx-0">
      {/* Header with Statistics */}
      <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-l-4 border-l-blue-500">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Package className={`${isMobile ? "h-5 w-5" : "h-6 w-6"} text-white`} />
              </div>
              <div>
                <CardTitle className={`font-bold text-slate-800 dark:text-white ${isMobile ? "text-lg" : "text-2xl"}`}>
                  إدارة المنتجات المتقدمة
                </CardTitle>
                <p className={`text-slate-600 dark:text-slate-400 mt-1 ${isMobile ? "text-sm" : "text-base"}`}>
                  إدارة شاملة للمنتجات والمقاسات مع التحليلات
                </p>
              </div>
            </div>
            
            {/* Statistics */}
            <div className={`grid ${isMobile ? "grid-cols-3 gap-2" : "grid-cols-3 gap-4"} w-full lg:w-auto`}>
              <div className="text-center">
                <div className={`${isMobile ? "text-lg" : "text-2xl"} font-bold text-blue-600 dark:text-blue-400`}>
                  {totalProducts}
                </div>
                <div className={`${isMobile ? "text-xs" : "text-sm"} text-gray-600 dark:text-gray-400`}>
                  منتج
                </div>
              </div>
              <div className="text-center">
                <div className={`${isMobile ? "text-lg" : "text-2xl"} font-bold text-green-600 dark:text-green-400`}>
                  {totalSizes}
                </div>
                <div className={`${isMobile ? "text-xs" : "text-sm"} text-gray-600 dark:text-gray-400`}>
                  مقاس
                </div>
              </div>
              <div className="text-center">
                <div className={`${isMobile ? "text-lg" : "text-2xl"} font-bold text-purple-600 dark:text-purple-400`}>
                  {formatCurrency(avgProfitMargin)}
                </div>
                <div className={`${isMobile ? "text-xs" : "text-sm"} text-gray-600 dark:text-gray-400`}>
                  متوسط الربح
                </div>
              </div>
            </div>
          </div>

          {/* Sync Buttons */}
          {user && (
            <div className="flex flex-wrap gap-2 mt-4">
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
        </CardHeader>
      </Card>

      {/* Forms Section */}
      <div className={`grid ${isMobile ? "grid-cols-1 gap-4" : "grid-cols-1 lg:grid-cols-2 gap-6"}`}>
        {/* Product Form */}
        <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className={`${isMobile ? "text-base" : "text-lg"} font-semibold flex items-center gap-2`}>
              <Plus className="h-4 w-4" />
              {editMode === "product" ? "تعديل منتج" : "إضافة منتج جديد"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitProduct} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productName" className="text-xs md:text-sm font-medium">
                  اسم المنتج
                </Label>
                <Input
                  id="productName"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="أدخل اسم المنتج"
                  required
                  className="text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-xs md:text-sm flex-1"
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
            </form>
          </CardContent>
        </Card>

        {/* Size Form */}
        <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className={`${isMobile ? "text-base" : "text-lg"} font-semibold flex items-center gap-2`}>
              <Plus className="h-4 w-4" />
              {editMode === "size" ? "تعديل مقاس" : "إضافة مقاس جديد"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitSize} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="size" className="text-xs md:text-sm font-medium">
                    المقاس
                  </Label>
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
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="cost" className="text-xs md:text-sm font-medium">
                      التكلفة
                    </Label>
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
                    <Label htmlFor="price" className="text-xs md:text-sm font-medium">
                      سعر البيع
                    </Label>
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
              </div>
              
              {sizeForm.productId && (
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    className="bg-green-600 hover:bg-green-700 text-xs md:text-sm flex-1"
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
          </CardContent>
        </Card>
      </div>

      {/* Products List */}
      <div className="space-y-4">
        {products.map((product) => (
          <Card key={product.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className={`${isMobile ? "text-base" : "text-lg"} font-semibold text-gray-800 dark:text-white`}>
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {product.sizes.length} مقاس
                      </Badge>
                      {product.sizes.length > 0 && (
                        <Badge variant="outline" className="text-xs text-green-600">
                          <TrendingUp className="h-3 w-3 ml-1" />
                          ربح: {formatCurrency(product.sizes.reduce((sum, size) => sum + (size.price - size.cost), 0) / product.sizes.length)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 text-xs px-3" 
                    onClick={() => handleAddSizeToProduct(product.id)}
                  >
                    <Plus className="h-3 w-3 ml-1" /> إضافة مقاس
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 text-xs px-3" 
                    onClick={() => handleEditProduct(product)}
                  >
                    <Pencil className="h-3 w-3 ml-1" /> تعديل
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        className="h-8 text-xs px-3"
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
            </CardHeader>
            
            <CardContent>
              {product.sizes.length > 0 ? (
                <div className={`grid ${isMobile ? "grid-cols-1 gap-2" : "grid-cols-2 lg:grid-cols-3 gap-3"}`}>
                  {product.sizes.map((size) => (
                    <div key={`${product.id}-${size.size}`} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-sm">{size.size}</span>
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
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">التكلفة:</span>
                          <span className="font-medium">{formatCurrency(size.cost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">السعر:</span>
                          <span className="font-medium">{formatCurrency(size.price)}</span>
                        </div>
                        <Separator className="my-1" />
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">الربح:</span>
                          <span className={`font-bold ${size.price - size.cost > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatCurrency(size.price - size.cost)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
                    لا توجد مقاسات لهذا المنتج
                  </p>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddSizeToProduct(product.id)}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 ml-1" />
                    إضافة مقاس
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {products.length === 0 && (
          <Card className="shadow-lg">
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                لا توجد منتجات مسجلة
              </h3>
              <p className="text-gray-500 dark:text-gray-500 text-sm mb-4">
                ابدأ بإضافة منتجك الأول لإدارة المخزون
              </p>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-sm"
                onClick={() => setProductName("")}
              >
                <Plus className="h-4 w-4 ml-2" />
                إضافة منتج جديد
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Reset Section */}
      {products.length > 0 && (
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-medium text-red-600 dark:text-red-400 mb-1">
                  إعادة تعيين البيانات
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  حذف جميع المنتجات والمقاسات بشكل نهائي
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="text-xs md:text-sm"
                    size="sm"
                  >
                    <Trash className="h-3 w-3 ml-1" />
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
      )}
    </div>
  );
};

export default ProductsManagementPro;
