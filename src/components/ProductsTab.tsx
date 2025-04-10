
import React, { useState, useEffect } from "react";
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
import { Plus, Edit, Trash2, RotateCcw, AlertCircle, Search, ArrowLeft, ArrowRight } from "lucide-react";
import { ProductSize } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

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
  const { 
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct,
    addProductSize,
    updateProductSize,
    deleteProductSize,
    clearAllProducts
  } = useProducts();
  
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [isAddSizeOpen, setIsAddSizeOpen] = useState(false);
  const [editingSizeIndex, setEditingSizeIndex] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (products.length > 0 && !selectedProduct) {
      setSelectedProduct(products[0].id);
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

  const handleDeleteSize = (size: string) => {
    if (selectedProduct) {
      deleteProductSize(selectedProduct, size);
    }
  };

  // Filter sizes based on search query
  const filteredSizes = product?.sizes.filter(size => 
    size.size.toLowerCase().includes(searchQuery.toLowerCase()) ||
    size.price.toString().includes(searchQuery) ||
    size.cost.toString().includes(searchQuery)
  ) || [];

  // Calculate pagination
  const totalPages = Math.ceil(filteredSizes.length / itemsPerPage);
  const currentItems = filteredSizes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when searching or changing product
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedProduct]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
      <div className="md:col-span-2">
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base md:text-xl font-bold">المنتجات</CardTitle>
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900"
                onClick={() => setIsClearAllDialogOpen(true)}
              >
                <RotateCcw size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-2">
              <div className="relative mb-2">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input 
                  placeholder="بحث عن منتج..." 
                  className="pl-8 text-xs h-9" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <ScrollArea className="h-[350px] md:h-[400px] rounded-md">
              {products.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  لا توجد منتجات مضافة
                </div>
              ) : (
                <ul className="divide-y dark:divide-gray-700">
                  {products
                    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(product => (
                    <li key={product.id}>
                      <button
                        onClick={() => setSelectedProduct(product.id)}
                        className={`w-full text-right px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 flex justify-between items-center ${
                          selectedProduct === product.id ? "bg-gray-100 dark:bg-gray-800" : ""
                        }`}
                      >
                        <span className="font-medium text-sm">{product.name}</span>
                        <Badge variant="outline" className="rounded-full text-[10px] px-2 py-0">
                          {product.sizes.length} مقاس
                        </Badge>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full text-sm">
                  <Plus size={16} className="ml-2" />
                  إضافة منتج جديد
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إضافة منتج جديد</DialogTitle>
                </DialogHeader>
                <ProductForm onSubmit={(name) => addProduct(name)} />
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
      </div>

      <div className="md:col-span-5">
        {selectedProduct && product ? (
          <Card>
            <CardHeader className="flex flex-row justify-between items-center py-3">
              <CardTitle className="text-base md:text-xl font-bold">{product.name}</CardTitle>
              <div className="flex space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                      <Edit size={16} />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>تعديل المنتج</DialogTitle>
                    </DialogHeader>
                    <ProductForm 
                      initialName={product.name} 
                      onSubmit={(name) => updateProduct(product.id, name)} 
                    />
                  </DialogContent>
                </Dialog>
                
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDeleteProduct(product.id)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 md:p-4">
              <div className="mb-3 flex flex-col md:flex-row gap-2 md:items-center justify-between">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input 
                    placeholder="بحث عن مقاس..." 
                    className="pl-8 text-xs h-9 w-full md:w-60" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button 
                  className="text-xs h-9"
                  onClick={() => setIsAddSizeOpen(true)}
                >
                  <Plus size={14} className="ml-1" />
                  إضافة مقاس جديد
                </Button>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-bold">المقاس</TableHead>
                      <TableHead className="text-xs font-bold">التكلفة</TableHead>
                      <TableHead className="text-xs font-bold">السعر المقترح</TableHead>
                      <TableHead className="text-xs font-bold">الربح</TableHead>
                      <TableHead className="w-[80px] text-xs font-bold">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-xs">
                          {searchQuery ? "لا توجد مقاسات تطابق البحث" : "لم يتم إضافة أي مقاسات بعد"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentItems.map((size) => (
                        <TableRow key={size.size}>
                          <TableCell className="font-medium text-xs">{size.size}</TableCell>
                          <TableCell className="text-xs">{size.cost}</TableCell>
                          <TableCell className="text-xs">{size.price}</TableCell>
                          <TableCell className="text-green-600 font-medium text-xs">
                            {(size.price - size.cost).toFixed(2)}
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 mr-1">
                              ({Math.round(((size.price - size.cost) / size.cost) * 100)}%)
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
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
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 h-7 w-7 p-0"
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
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-4 rtl:flex-row-reverse">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ArrowRight size={14} />
                  </Button>
                  
                  <span className="text-xs">
                    {currentPage} / {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ArrowLeft size={14} />
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-0">
              {filteredSizes.length > 0 && (
                <div className="w-full border-t pt-3 mt-2 dark:border-gray-700">
                  <div className="flex flex-wrap justify-between gap-2 text-xs">
                    <div>
                      <span className="font-medium">إجمالي المقاسات: </span>
                      <span>{filteredSizes.length}</span>
                    </div>
                    <div>
                      <span className="font-medium">متوسط التكلفة: </span>
                      <span>
                        {(filteredSizes.reduce((sum, size) => sum + size.cost, 0) / filteredSizes.length).toFixed(2)} جنيه
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">متوسط السعر: </span>
                      <span>
                        {(filteredSizes.reduce((sum, size) => sum + size.price, 0) / filteredSizes.length).toFixed(2)} جنيه
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">متوسط الربح: </span>
                      <span className="text-green-600">
                        {(filteredSizes.reduce((sum, size) => sum + (size.price - size.cost), 0) / filteredSizes.length).toFixed(2)} جنيه
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardFooter>
          </Card>
        ) : (
          <div className="h-full flex items-center justify-center p-8 border rounded-md bg-gray-50 dark:bg-gray-800">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">لم يتم تحديد منتج</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">يرجى اختيار منتج من القائمة أو إضافة منتج جديد</p>
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
            <p className="text-sm">هل أنت متأكد من رغبتك في حذف هذا المنتج؟ لا يمكن التراجع عن هذه العملية.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="text-sm">
              إلغاء
            </Button>
            <Button variant="destructive" onClick={confirmDeleteProduct} className="text-sm">
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
            <p className="text-sm">سيتم إعادة تعيين جميع المنتجات وإنشاء منتج افتراضي جديد. هل تريد الاستمرار؟</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsClearAllDialogOpen(false)} className="text-sm">
              إلغاء
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                clearAllProducts();
                setIsClearAllDialogOpen(false);
                setCurrentPage(1);
                setSearchQuery("");
                toast.success("تم إعادة تعيين المنتجات بنجاح");
              }}
              className="text-sm"
            >
              إعادة التعيين
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add size sheet */}
      <Sheet open={isAddSizeOpen} onOpenChange={setIsAddSizeOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>إضافة مقاس جديد</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <SizeForm
              onSubmit={(size) => {
                if (selectedProduct) {
                  addProductSize(selectedProduct, size);
                  setIsAddSizeOpen(false);
                }
              }}
            />
          </div>
          <SheetFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsAddSizeOpen(false)} className="text-sm">
              إلغاء
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Edit size sheet */}
      <Sheet open={!!editingSizeIndex} onOpenChange={() => setEditingSizeIndex(null)}>
        <SheetContent>
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
                onSubmit={(updatedSize) => {
                  if (selectedProduct) {
                    updateProductSize(selectedProduct, editingSizeIndex, updatedSize);
                    setEditingSizeIndex(null);
                  }
                }}
              />
            </div>
          )}
          <SheetFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditingSizeIndex(null)} className="text-sm">
              إلغاء
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ProductsTab;
