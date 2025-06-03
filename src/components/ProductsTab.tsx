
import React, { useState } from "react";
import { useProducts } from "@/context/ProductContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter 
} from "@/components/ui/sheet";
import { Plus, Edit, Trash2, AlertCircle, Search, X } from "lucide-react";
import { ProductSize } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

// Extracted ProductForm component
const ProductForm = ({ 
  initialName = "", 
  onSubmit 
}: { 
  initialName?: string; 
  onSubmit: (name: string) => void;
}) => {
  const [name, setName] = useState(initialName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="productName" className="block text-sm mb-1">
          اسم المنتج
        </label>
        <Input
          id="productName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ادخل اسم المنتج"
          required
          className="text-sm"
        />
      </div>
      <Button type="submit" className="w-full">
        {initialName ? "تحديث" : "إضافة"}
      </Button>
    </form>
  );
};

// Extracted SizeForm component
const SizeForm = ({ 
  initialSize = { size: "", cost: 0, price: 0 }, 
  onSubmit 
}: { 
  initialSize?: ProductSize; 
  onSubmit: (size: ProductSize) => void;
}) => {
  const [size, setSize] = useState(initialSize.size);
  const [cost, setCost] = useState(initialSize.cost);
  const [price, setPrice] = useState(initialSize.price);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (size.trim()) {
      onSubmit({ size, cost, price });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="size" className="block text-sm mb-1">
          المقاس
        </label>
        <Input
          id="size"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="ادخل المقاس"
          required
          className="text-sm"
        />
      </div>
      <div>
        <label htmlFor="cost" className="block text-sm mb-1">
          التكلفة
        </label>
        <Input
          id="cost"
          type="number"
          value={cost}
          onChange={(e) => setCost(Number(e.target.value))}
          placeholder="ادخل التكلفة"
          min={0}
          step={0.01}
          required
          className="text-sm"
        />
      </div>
      <div>
        <label htmlFor="price" className="block text-sm mb-1">
          سعر البيع المقترح
        </label>
        <Input
          id="price"
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          placeholder="ادخل السعر"
          min={0}
          step={0.01}
          required
          className="text-sm"
        />
      </div>
      <div className="border border-blue-100 bg-blue-50 dark:border-blue-900 dark:bg-blue-950 p-3 rounded-md mt-2">
        <div className="flex justify-between text-sm">
          <span>الربح:</span>
          <span className="font-bold">
            {Number(price - cost).toFixed(2)} جنيه
          </span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span>نسبة الربح:</span>
          <span className="font-bold">
            {cost > 0 ? Math.round(((price - cost) / cost) * 100) : 0}%
          </span>
        </div>
      </div>
      <Button type="submit" className="w-full">
        {initialSize.size ? "تحديث" : "إضافة"}
      </Button>
    </form>
  );
};

const ProductsTab = () => {
  const isMobile = useIsMobile();
  const { 
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct,
    loading
  } = useProducts();
  
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [isAddSizeOpen, setIsAddSizeOpen] = useState(false);
  const [editingSizeIndex, setEditingSizeIndex] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Auto-select first product if none selected
  React.useEffect(() => {
    if (products.length > 0 && !selectedProduct) {
      setSelectedProduct(products[0].id);
    } else if (products.length === 0) {
      setSelectedProduct(null);
    }
  }, [products, selectedProduct]);

  const product = selectedProduct 
    ? products.find(p => p.id === selectedProduct) 
    : null;

  const handleDeleteProduct = (id: string) => {
    setProductToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteProduct = () => {
    if (productToDelete) {
      deleteProduct(productToDelete);
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
      if (selectedProduct === productToDelete) {
        setSelectedProduct(products.length > 1 ? products[0].id : null);
      }
    }
  };

  const handleEditSize = (size: string) => {
    setEditingSizeIndex(size);
  };

  const handleDeleteSize = async (size: string) => {
    if (selectedProduct && product) {
      const updatedSizes = product.sizes.filter(s => s.size !== size);
      await updateProduct(selectedProduct, { ...product, sizes: updatedSizes });
    }
  };

  const handleAddProductSize = async (productId: string, size: ProductSize) => {
    const targetProduct = products.find(p => p.id === productId);
    if (targetProduct) {
      const updatedSizes = [...targetProduct.sizes, size];
      await updateProduct(productId, { ...targetProduct, sizes: updatedSizes });
    }
  };

  const handleUpdateProductSize = async (productId: string, oldSize: string, newSize: ProductSize) => {
    const targetProduct = products.find(p => p.id === productId);
    if (targetProduct) {
      const updatedSizes = targetProduct.sizes.map(s => s.size === oldSize ? newSize : s);
      await updateProduct(productId, { ...targetProduct, sizes: updatedSizes });
    }
  };

  const handleClearAllProducts = async () => {
    for (const product of products) {
      await deleteProduct(product.id);
    }
  };

  // Filter products by search query
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter sizes by search query if a product is selected
  const filteredSizes = product?.sizes.filter(s => 
    s.size.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.cost.toString().includes(searchQuery) ||
    s.price.toString().includes(searchQuery)
  ) || [];

  // Clear search query
  const clearSearch = () => {
    setSearchQuery("");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-center">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {/* Products List */}
      <div className={isMobile ? "order-2" : "md:col-span-2"}>
        <Card className="h-full">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base md:text-xl">المنتجات</CardTitle>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 w-8 p-0" title="إضافة منتج جديد">
                    <Plus size={16} />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>إضافة منتج جديد</DialogTitle>
                  </DialogHeader>
                  <ProductForm onSubmit={async (name) => {
                    await addProduct({ name, sizes: [] });
                    toast.success("تم إضافة المنتج بنجاح");
                  }} />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="p-2">
              <div className="relative">
                <Input 
                  placeholder="بحث عن منتج..." 
                  className="mb-2 pr-9" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    className="absolute left-2 top-1/2 -translate-y-1/2" 
                    onClick={clearSearch}
                    aria-label="مسح البحث"
                  >
                    <X size={16} className="text-gray-400" />
                  </button>
                )}
              </div>
            </div>
            
            <ScrollArea className={isMobile ? "h-[180px]" : "h-[300px] md:h-[400px]"}>
              {filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchQuery ? "لا توجد نتائج للبحث" : "لا توجد منتجات مضافة"}
                </div>
              ) : (
                <ul className="divide-y">
                  {filteredProducts.map(product => (
                    <li key={product.id}>
                      <button
                        onClick={() => setSelectedProduct(product.id)}
                        className={`w-full text-right px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 flex justify-between items-center ${
                          selectedProduct === product.id ? "bg-gray-100 dark:bg-gray-800" : ""
                        }`}
                      >
                        <span className="font-medium text-sm">{product.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {product.sizes.length} مقاس
                        </Badge>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </CardContent>
          
          <CardFooter className="p-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-red-500 hover:text-red-700 border-red-200 hover:border-red-300"
              onClick={() => setIsClearAllDialogOpen(true)}
            >
              إعادة تعيين المنتجات
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Product Details */}
      <div className={isMobile ? "order-1" : "md:col-span-3"}>
        {selectedProduct && product ? (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base md:text-xl">{product.name}</CardTitle>
                
                <div className="flex space-x-2 rtl:space-x-reverse">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                        <Edit size={16} />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>تعديل المنتج</DialogTitle>
                      </DialogHeader>
                      <ProductForm 
                        initialName={product.name} 
                        onSubmit={async (name) => {
                          await updateProduct(product.id, { ...product, name });
                          toast.success("تم تعديل المنتج بنجاح");
                        }} 
                      />
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-500 hover:text-red-700 border-red-200 hover:border-red-300 h-8 w-8 p-0"
                    onClick={() => handleDeleteProduct(product.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-3 md:p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="relative max-w-[200px] w-full">
                  <Input 
                    placeholder="بحث عن مقاس..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-9"
                  />
                  {searchQuery && (
                    <button 
                      className="absolute left-2 top-1/2 -translate-y-1/2" 
                      onClick={clearSearch}
                      aria-label="مسح البحث"
                    >
                      <X size={16} className="text-gray-400" />
                    </button>
                  )}
                </div>
                
                <Button 
                  size="sm" 
                  onClick={() => setIsAddSizeOpen(true)}
                  className="h-9"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  {isMobile ? "إضافة" : "إضافة مقاس جديد"}
                </Button>
              </div>
              
              <div className="overflow-x-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المقاس</TableHead>
                      <TableHead>التكلفة</TableHead>
                      <TableHead>السعر</TableHead>
                      <TableHead>الربح</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSizes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-sm">
                          {searchQuery ? "لا توجد مقاسات تطابق البحث" : "لم يتم إضافة أي مقاسات بعد"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSizes.map((size) => (
                        <TableRow key={size.size}>
                          <TableCell className="font-medium">{size.size}</TableCell>
                          <TableCell>{formatCurrency(size.cost)}</TableCell>
                          <TableCell>{formatCurrency(size.price)}</TableCell>
                          <TableCell className="text-green-600">
                            {formatCurrency(size.price - size.cost)}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1 rtl:space-x-reverse">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEditSize(size.size)}
                                className="h-7 w-7 p-0"
                              >
                                <Edit size={14} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-500 hover:text-red-700 h-7 w-7 p-0"
                                onClick={() => handleDeleteSize(size.size)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="h-full flex items-center justify-center p-8 border rounded-md bg-gray-50 dark:bg-gray-800">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">لم يتم تحديد منتج</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                يرجى اختيار منتج من القائمة أو إضافة منتج جديد
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="mt-4">إضافة منتج جديد</Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>إضافة منتج جديد</DialogTitle>
                  </DialogHeader>
                  <ProductForm onSubmit={async (name) => await addProduct({ name, sizes: [] })} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}
      </div>

      {/* Delete product confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle size={20} />
            <p className="text-sm">
              هل أنت متأكد من رغبتك في حذف هذا المنتج؟ لا يمكن التراجع عن هذه العملية.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={confirmDeleteProduct}>
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear all products confirmation dialog */}
      <Dialog open={isClearAllDialogOpen} onOpenChange={setIsClearAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إعادة تعيين المنتجات</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 text-amber-500">
            <AlertCircle size={20} />
            <p className="text-sm">
              سيتم إعادة تعيين جميع المنتجات وإنشاء قائمة افتراضية جديدة. هل تريد الاستمرار؟
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsClearAllDialogOpen(false)}>
              إلغاء
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                handleClearAllProducts();
                setIsClearAllDialogOpen(false);
                setSearchQuery("");
                toast.success("تم إعادة تعيين المنتجات بنجاح");
              }}
            >
              إعادة التعيين
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add size sheet */}
      <Sheet open={isAddSizeOpen} onOpenChange={setIsAddSizeOpen}>
        <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "h-[85vh]" : ""}>
          <SheetHeader>
            <SheetTitle>إضافة مقاس جديد</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <SizeForm
              onSubmit={async (size) => {
                if (selectedProduct) {
                  await handleAddProductSize(selectedProduct, size);
                  setIsAddSizeOpen(false);
                  toast.success("تم إضافة المقاس بنجاح");
                }
              }}
            />
          </div>
          <SheetFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsAddSizeOpen(false)}>
              إلغاء
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Edit size sheet */}
      <Sheet open={!!editingSizeIndex} onOpenChange={() => setEditingSizeIndex(null)}>
        <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "h-[85vh]" : ""}>
          <SheetHeader>
            <SheetTitle>تعديل المقاس</SheetTitle>
          </SheetHeader>
          {editingSizeIndex && selectedProduct && (
            <div className="mt-4">
              <SizeForm
                initialSize={
                  product?.sizes.find(s => s.size === editingSizeIndex) || 
                  { size: editingSizeIndex, cost: 0, price: 0 }
                }
                onSubmit={async (updatedSize) => {
                  if (selectedProduct) {
                    await handleUpdateProductSize(selectedProduct, editingSizeIndex, updatedSize);
                    setEditingSizeIndex(null);
                    toast.success("تم تحديث المقاس بنجاح");
                  }
                }}
              />
            </div>
          )}
          <SheetFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditingSizeIndex(null)}>
              إلغاء
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ProductsTab;
