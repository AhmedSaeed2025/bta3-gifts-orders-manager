
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
import { Plus, Edit, Trash2 } from "lucide-react";
import { ProductSize } from "@/types";

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
          السعر
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
    deleteProductSize
  } = useProducts();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [isAddSizeOpen, setIsAddSizeOpen] = useState(false);
  const [editingSizeIndex, setEditingSizeIndex] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

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
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">المنتجات</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-y-auto">
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
                        className={`w-full text-right px-4 py-2 hover:bg-gray-100 flex justify-between items-center ${
                          selectedProduct === product.id ? "bg-gray-100" : ""
                        }`}
                      >
                        <span>{product.name}</span>
                        <span className="text-xs text-gray-500">
                          {product.sizes.length} مقاس
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المقاس</TableHead>
                    <TableHead>التكلفة</TableHead>
                    <TableHead>السعر</TableHead>
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
                        <TableCell>{size.size}</TableCell>
                        <TableCell>{size.cost}</TableCell>
                        <TableCell>{size.price}</TableCell>
                        <TableCell>{(size.price - size.cost).toFixed(2)}</TableCell>
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
            </CardContent>
            <CardFooter>
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

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
          </DialogHeader>
          <p>هل أنت متأكد من رغبتك في حذف هذا المنتج؟ لا يمكن التراجع عن هذه العملية.</p>
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
