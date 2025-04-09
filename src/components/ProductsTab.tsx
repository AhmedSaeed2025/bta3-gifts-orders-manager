
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
import { Plus, Edit, Trash2, RotateCcw, AlertCircle } from "lucide-react";
import { ProductSize } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
        />
      </div>
      <Button type="submit" className="w-full">
        {initialName ? "تحديث" : "إضافة"}
      </Button>
    </form>
  );
};

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
        />
      </div>
      <div className="border border-blue-100 bg-blue-50 p-3 rounded-md mt-2">
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
        setSelectedProduct(null);
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
      <div className="md:col-span-2">
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl font-bold">المنتجات</CardTitle>
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => setIsClearAllDialogOpen(true)}
              >
                <RotateCcw size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px] rounded-md">
              {products.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  لا توجد منتجات مضافة
                </div>
              ) : (
                <ul className="divide-y">
                  {products.map(product => (
                    <li key={product.id}>
                      <button
                        onClick={() => setSelectedProduct(product.id)}
                        className={`w-full text-right px-4 py-3 hover:bg-gray-100 flex justify-between items-center ${
                          selectedProduct === product.id ? "bg-gray-100" : ""
                        }`}
                      >
                        <span className="font-medium">{product.name}</span>
                        <Badge variant="outline" className="rounded-full">
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
                <Button className="w-full">
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
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="text-xl font-bold">{product.name}</CardTitle>
              <div className="flex space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
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
                  size="icon"
                  onClick={() => handleDeleteProduct(product.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المقاس</TableHead>
                      <TableHead>التكلفة</TableHead>
                      <TableHead>السعر المقترح</TableHead>
                      <TableHead>الربح</TableHead>
                      <TableHead className="w-[100px]">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.sizes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          لم يتم إضافة أي مقاسات بعد
                        </TableCell>
                      </TableRow>
                    ) : (
                      product.sizes.map((size) => (
                        <TableRow key={size.size}>
                          <TableCell className="font-medium">{size.size}</TableCell>
                          <TableCell>{size.cost}</TableCell>
                          <TableCell>{size.price}</TableCell>
                          <TableCell className="text-green-600 font-medium">
                            {(size.price - size.cost).toFixed(2)}
                            <span className="text-xs text-gray-500 mr-1">
                              ({Math.round(((size.price - size.cost) / size.cost) * 100)}%)
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEditSize(size.size)}
                              >
                                <Edit size={14} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
            <Separator className="my-2" />
            <CardFooter className="pt-4">
              <Button 
                className="w-full"
                onClick={() => setIsAddSizeOpen(true)}
              >
                <Plus size={16} className="ml-2" />
                إضافة مقاس جديد
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="h-full flex items-center justify-center p-8 border rounded-md bg-gray-50">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">لم يتم تحديد منتج</h3>
              <p className="text-gray-500">يرجى اختيار منتج من القائمة أو إضافة منتج جديد</p>
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
            <p>هل أنت متأكد من رغبتك في حذف هذا المنتج؟ لا يمكن التراجع عن هذه العملية.</p>
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
            <DialogTitle>حذف جميع المنتجات</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle size={20} />
            <p>هل أنت متأكد من رغبتك في حذف جميع المنتجات؟ لا يمكن التراجع عن هذه العملية.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsClearAllDialogOpen(false)}>
              إلغاء
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                clearAllProducts();
                setIsClearAllDialogOpen(false);
                setSelectedProduct(null);
              }}
            >
              حذف الكل
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
            <Button variant="outline" onClick={() => setIsAddSizeOpen(false)}>
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
