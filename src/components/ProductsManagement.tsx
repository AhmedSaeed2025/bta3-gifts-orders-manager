
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
import { Trash, Pencil, Plus } from "lucide-react";

const ProductsManagement = () => {
  const { products, addProduct, updateProduct, deleteProduct, addProductSize, updateProductSize, deleteProductSize, clearAllProducts } = useProducts();
  
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
  const handleSubmitProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (editMode === "product" && editId) {
      updateProduct(editId, productName);
      setEditMode(null);
      setEditId(null);
    } else {
      addProduct(productName);
    }
    
    setProductName("");
  };
  
  const handleEditProduct = (product: Product) => {
    setProductName(product.name);
    setEditMode("product");
    setEditId(product.id);
  };
  
  // Size form handling
  const handleSubmitSize = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!sizeForm.productId) return;
    
    if (editMode === "size" && editSizeProduct && editSizeValue) {
      updateProductSize(
        editSizeProduct,
        editSizeValue,
        {
          size: sizeForm.size,
          cost: sizeForm.cost,
          price: sizeForm.price
        }
      );
      setEditMode(null);
      setEditSizeProduct(null);
      setEditSizeValue(null);
    } else {
      addProductSize(
        sizeForm.productId,
        {
          size: sizeForm.size,
          cost: sizeForm.cost,
          price: sizeForm.price
        }
      );
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
  
  const handleAddSizeToProduct = (productId: string) => {
    setSizeForm({
      ...sizeForm,
      productId
    });
    setEditMode(null);
    setEditSizeProduct(null);
    setEditSizeValue(null);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">إدارة المنتجات والمقاسات</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Product Form */}
        <div className="mb-6 border p-4 rounded-md">
          <h3 className="font-medium mb-3">{editMode === "product" ? "تعديل منتج" : "إضافة منتج جديد"}</h3>
          <form onSubmit={handleSubmitProduct} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productName">اسم المنتج</Label>
              <div className="flex gap-2">
                <Input
                  id="productName"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="أدخل اسم المنتج"
                  required
                />
                <Button 
                  type="submit" 
                  className="bg-gift-primary hover:bg-gift-primaryHover"
                >
                  {editMode === "product" ? "تعديل" : "إضافة"}
                </Button>
                {editMode === "product" && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={cancelEdit}
                  >
                    إلغاء
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
        
        {/* Size Form */}
        <div className="mb-6 border p-4 rounded-md">
          <h3 className="font-medium mb-3">{editMode === "size" ? "تعديل مقاس" : "إضافة مقاس جديد"}</h3>
          <form onSubmit={handleSubmitSize} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size">المقاس</Label>
                <Input
                  id="size"
                  value={sizeForm.size}
                  onChange={(e) => setSizeForm({...sizeForm, size: e.target.value})}
                  placeholder="أدخل المقاس"
                  required
                  disabled={!sizeForm.productId}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cost">التكلفة</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={sizeForm.cost}
                  onChange={(e) => setSizeForm({...sizeForm, cost: parseFloat(e.target.value) || 0})}
                  required
                  disabled={!sizeForm.productId}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">سعر البيع</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={sizeForm.price}
                  onChange={(e) => setSizeForm({...sizeForm, price: parseFloat(e.target.value) || 0})}
                  required
                  disabled={!sizeForm.productId}
                />
              </div>
            </div>
            
            {sizeForm.productId && (
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="bg-gift-primary hover:bg-gift-primaryHover"
                >
                  {editMode === "size" ? "تعديل المقاس" : "إضافة المقاس"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={cancelEdit}
                >
                  إلغاء
                </Button>
              </div>
            )}
          </form>
        </div>
        
        {/* Products List */}
        <div className="space-y-8">
          {products.map((product) => (
            <div key={product.id} className="border rounded-md p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium">{product.name}</h3>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8" 
                    onClick={() => handleAddSizeToProduct(product.id)}
                  >
                    <Plus className="h-4 w-4 ml-1" /> إضافة مقاس
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8" 
                    onClick={() => handleEditProduct(product)}
                  >
                    <Pencil className="h-4 w-4 ml-1" /> تعديل
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        className="h-8"
                      >
                        <Trash className="h-4 w-4 ml-1" /> حذف
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
                      <TableHead>المقاس</TableHead>
                      <TableHead>التكلفة</TableHead>
                      <TableHead>سعر البيع</TableHead>
                      <TableHead>الربح</TableHead>
                      <TableHead className="text-left">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.sizes.length > 0 ? (
                      product.sizes.map((size) => (
                        <TableRow key={`${product.id}-${size.size}`}>
                          <TableCell>{size.size}</TableCell>
                          <TableCell>{formatCurrency(size.cost)}</TableCell>
                          <TableCell>{formatCurrency(size.price)}</TableCell>
                          <TableCell>{formatCurrency(size.price - size.cost)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-7 w-7 p-0" 
                                onClick={() => handleEditSize(product.id, size)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                  >
                                    <Trash className="h-4 w-4" />
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
                                      onClick={() => deleteProductSize(product.id, size.size)}
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
                        <TableCell colSpan={5} className="text-center py-4">
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
              <p className="text-gray-500 dark:text-gray-400">لا توجد منتجات مسجلة</p>
              <Button 
                className="mt-2 bg-gift-primary hover:bg-gift-primaryHover"
                onClick={() => setProductName("")}
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
                className="w-full md:w-auto"
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
                  onClick={clearAllProducts}
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
