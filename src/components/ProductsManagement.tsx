
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import { Product } from "@/types";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

const ProductsManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [newProduct, setNewProduct] = useState({
    productType: "",
    size: "",
    cost: 0,
    price: 0
  });

  // Load products from local storage
  useEffect(() => {
    const savedProducts = localStorage.getItem("products");
    
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    }
  }, []);

  // Save products to local storage
  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products));
  }, [products]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    const updatedValue = type === 'number' ? parseFloat(value) || 0 : value;
    
    if (editingProduct) {
      setEditingProduct({
        ...editingProduct,
        [name]: updatedValue
      });
    } else {
      setNewProduct({
        ...newProduct,
        [name]: updatedValue
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (editingProduct) {
      setEditingProduct({
        ...editingProduct,
        [name]: value
      });
    } else {
      setNewProduct({
        ...newProduct,
        [name]: value
      });
    }
  };

  const handleAddProduct = () => {
    if (!newProduct.productType || !newProduct.size) {
      toast.error("يرجى إدخال نوع المنتج والمقاس");
      return;
    }

    const newProductWithId: Product = {
      ...newProduct,
      id: uuidv4()
    };
    
    setProducts([...products, newProductWithId]);
    setNewProduct({
      productType: "",
      size: "",
      cost: 0,
      price: 0
    });
    
    setIsAddDialogOpen(false);
    toast.success("تم إضافة المنتج بنجاح");
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleUpdateProduct = () => {
    if (!editingProduct) return;
    
    setProducts(products.map(product => 
      product.id === editingProduct.id ? editingProduct : product
    ));
    
    setEditingProduct(null);
    setIsEditDialogOpen(false);
    toast.success("تم تحديث المنتج بنجاح");
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter(product => product.id !== id));
    toast.success("تم حذف المنتج بنجاح");
  };

  // Filter products based on search query
  const filteredProducts = products.filter(product => 
    product.productType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.size.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl">إدارة المنتجات</CardTitle>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
                <Plus size={16} />
                إضافة منتج
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة منتج جديد</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="productType">نوع المنتج</Label>
                  <Select 
                    value={newProduct.productType}
                    onValueChange={(value) => handleSelectChange("productType", value)}
                  >
                    <SelectTrigger id="productType">
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="تابلوه">تابلوه</SelectItem>
                      <SelectItem value="ماكيت">ماكيت</SelectItem>
                      <SelectItem value="ميدالية اكليريك">ميدالية اكليريك</SelectItem>
                      <SelectItem value="أخرى">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="size">المقاس</Label>
                  <Input 
                    id="size" 
                    name="size" 
                    value={newProduct.size}
                    onChange={handleInputChange} 
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cost">سعر التكلفة</Label>
                  <Input 
                    id="cost" 
                    name="cost" 
                    type="number"
                    min="0"
                    step="0.01" 
                    value={newProduct.cost}
                    onChange={handleInputChange} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price">سعر البيع</Label>
                  <Input 
                    id="price" 
                    name="price" 
                    type="number"
                    min="0"
                    step="0.01" 
                    value={newProduct.price}
                    onChange={handleInputChange} 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddProduct}>إضافة</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-3 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="بحث عن منتج..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نوع المنتج</TableHead>
                <TableHead>المقاس</TableHead>
                <TableHead>سعر التكلفة</TableHead>
                <TableHead>سعر البيع</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.productType}</TableCell>
                    <TableCell>{product.size}</TableCell>
                    <TableCell>{product.cost} جنيه</TableCell>
                    <TableCell>{product.price} جنيه</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openEditDialog(product)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil size={16} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>هل أنت متأكد من حذف هذا المنتج؟</AlertDialogTitle>
                              <AlertDialogDescription>
                                لا يمكن التراجع عن هذا الإجراء بمجرد تنفيذه.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteProduct(product.id)}
                                className="bg-red-600 hover:bg-red-700"
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
                    {searchQuery ? "لا توجد نتائج مطابقة للبحث" : "لا توجد منتجات متاحة"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Edit Product Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تعديل المنتج</DialogTitle>
            </DialogHeader>
            {editingProduct && (
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-productType">نوع المنتج</Label>
                  <Select 
                    value={editingProduct.productType}
                    onValueChange={(value) => handleSelectChange("productType", value)}
                  >
                    <SelectTrigger id="edit-productType">
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="تابلوه">تابلوه</SelectItem>
                      <SelectItem value="ماكيت">ماكيت</SelectItem>
                      <SelectItem value="ميدالية اكليريك">ميدالية اكليريك</SelectItem>
                      <SelectItem value="أخرى">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-size">المقاس</Label>
                  <Input 
                    id="edit-size" 
                    name="size" 
                    value={editingProduct.size}
                    onChange={handleInputChange} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-cost">سعر التكلفة</Label>
                  <Input 
                    id="edit-cost" 
                    name="cost" 
                    type="number"
                    min="0"
                    step="0.01" 
                    value={editingProduct.cost}
                    onChange={handleInputChange} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-price">سعر البيع</Label>
                  <Input 
                    id="edit-price" 
                    name="price" 
                    type="number"
                    min="0"
                    step="0.01" 
                    value={editingProduct.price}
                    onChange={handleInputChange} 
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleUpdateProduct}>حفظ التعديلات</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ProductsManagement;
