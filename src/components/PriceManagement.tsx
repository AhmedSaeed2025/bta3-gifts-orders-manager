
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePrices } from "@/context/PriceContext";
import { useProducts } from "@/context/ProductContext";
import { formatCurrency } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";

const PriceManagement = () => {
  const { proposedPrices, addProposedPrice, deleteProposedPrice } = usePrices();
  const { products } = useProducts();
  const isMobile = useIsMobile();
  
  const [formData, setFormData] = useState({
    productType: "",
    size: "",
    cost: 0,
    price: 0,
  });

  const [searchQuery, setSearchQuery] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    addProposedPrice(
      formData.productType,
      formData.size,
      formData.cost,
      formData.price
    );
    
    // Reset form
    setFormData({
      productType: "",
      size: "",
      cost: 0,
      price: 0,
    });
  };

  const handleEditPrice = (productType: string, size: string) => {
    if (proposedPrices[productType] && proposedPrices[productType][size]) {
      setFormData({
        productType,
        size,
        cost: proposedPrices[productType][size].cost,
        price: proposedPrices[productType][size].price,
      });
    }
  };

  // Filter products based on search query
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get all available product types from registered products
  const productTypes = Array.from(new Set(products.map(product => product.name)));

  // Get all available sizes from all products
  const allAvailableSizes = Array.from(
    new Set([
      ...products.flatMap(product => 
        product.sizes.map(size => size.size)
      ),
      "15*20 سم",
      "20*30 سم", 
      "30*40 سم",
      "40*50 سم",
      "50*60 سم",
      "50*70 سم",
      "100*60 سم",
      "ميدالية أكليريك مستطيلة",
      "ميدالية اكليريك مجسمة",
      "دلاية عربية اكليريك ( قطعة )",
      "دلاية عربية أكليريك ( قطعتين )",
      "أخرى"
    ])
  );

  return (
    <Card className="rtl" style={{ direction: 'rtl' }}>
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">إدارة الأسعار المقترحة</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="proposedPrices" className="w-full">
          <TabsList className="mb-4 w-full justify-start overflow-x-auto">
            <TabsTrigger value="proposedPrices">{isMobile ? "الأسعار المقترحة" : "الأسعار المقترحة"}</TabsTrigger>
            <TabsTrigger value="productPrices">{isMobile ? "أسعار المنتجات" : "أسعار المنتجات المسجلة"}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="proposedPrices">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productType">نوع المنتج</Label>
                  <Select 
                    value={formData.productType}
                    onValueChange={(value) => handleSelectChange("productType", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Include product types from registered products */}
                      {productTypes.map((productType) => (
                        <SelectItem key={productType} value={productType}>
                          {productType}
                        </SelectItem>
                      ))}
                      <SelectItem value="تابلوه">تابلوه</SelectItem>
                      <SelectItem value="ماكيت">ماكيت</SelectItem>
                      <SelectItem value="ميدالية اكليريك">ميدالية اكليريك</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="size">المقاس</Label>
                  <Select 
                    value={formData.size}
                    onValueChange={(value) => handleSelectChange("size", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المقاس" />
                    </SelectTrigger>
                    <SelectContent>
                      {allAvailableSizes.map(size => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cost">تكلفة الصنف المقترحة</Label>
                  <Input 
                    id="cost" 
                    name="cost" 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={formData.cost}
                    onChange={handleChange} 
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price">سعر البيع المقترح</Label>
                  <Input 
                    id="price" 
                    name="price" 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange} 
                    required
                  />
                </div>
              </div>
              
              <Button type="submit" className="bg-gift-primary hover:bg-gift-primaryHover">
                حفظ السعر المقترح
              </Button>
            </form>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">الأسعار المقترحة الحالية</h3>
              <div className="relative mb-4">
                <Input
                  placeholder="بحث عن سعر..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-xs"
                />
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs md:text-sm">نوع المنتج</TableHead>
                      <TableHead className="text-xs md:text-sm">المقاس</TableHead>
                      <TableHead className="text-xs md:text-sm">تكلفة الصنف المقترحة</TableHead>
                      <TableHead className="text-xs md:text-sm">سعر البيع المقترح</TableHead>
                      <TableHead className="text-xs md:text-sm">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(proposedPrices).flatMap(([productType, sizes]) =>
                      Object.entries(sizes)
                        .filter(([size]) => {
                          const searchLower = searchQuery.toLowerCase();
                          return (
                            productType.toLowerCase().includes(searchLower) ||
                            size.toLowerCase().includes(searchLower)
                          );
                        })
                        .map(([size, data]) => (
                          <TableRow key={`${productType}-${size}`}>
                            <TableCell className="text-xs md:text-sm">{productType}</TableCell>
                            <TableCell className="text-xs md:text-sm">{size}</TableCell>
                            <TableCell className="text-xs md:text-sm">{formatCurrency(data.cost)}</TableCell>
                            <TableCell className="text-xs md:text-sm">{formatCurrency(data.price)}</TableCell>
                            <TableCell className="flex flex-wrap gap-1">
                              <Button 
                                className="h-6 md:h-7 text-xs bg-blue-500 hover:bg-blue-600 px-2"
                                onClick={() => handleEditPrice(productType, size)}
                              >
                                {isMobile ? "تعديل" : "تعديل"}
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button className="h-6 md:h-7 text-xs bg-gift-primary hover:bg-gift-primaryHover px-2">
                                    {isMobile ? "حذف" : "حذف"}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>تأكيد حذف السعر</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      هل أنت متأكد من حذف هذا السعر المقترح؟
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction 
                                      className="bg-gift-primary hover:bg-gift-primaryHover"
                                      onClick={() => deleteProposedPrice(productType, size)}
                                    >
                                      حذف
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                    {Object.keys(proposedPrices).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">لا توجد أسعار مقترحة متاحة</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="productPrices">
            <div className="space-y-6">
              <h3 className="text-lg font-medium mb-2">أسعار المنتجات المسجلة</h3>
              
              <div className="relative mb-4">
                <Input
                  placeholder="بحث عن منتج..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-xs"
                />
              </div>
              
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <div key={product.id} className="border rounded-md p-3">
                    <h4 className="font-medium mb-2 text-sm md:text-base">{product.name}</h4>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs md:text-sm">المقاس</TableHead>
                            <TableHead className="text-xs md:text-sm">التكلفة</TableHead>
                            <TableHead className="text-xs md:text-sm">سعر البيع</TableHead>
                            <TableHead className="text-xs md:text-sm">الربح</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {product.sizes.map(size => (
                            <TableRow key={`${product.id}-${size.size}`}>
                              <TableCell className="text-xs md:text-sm">{size.size}</TableCell>
                              <TableCell className="text-xs md:text-sm">{formatCurrency(size.cost)}</TableCell>
                              <TableCell className="text-xs md:text-sm">{formatCurrency(size.price)}</TableCell>
                              <TableCell className="text-xs md:text-sm">{formatCurrency(size.price - size.cost)}</TableCell>
                            </TableRow>
                          ))}
                          {product.sizes.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-2 text-xs md:text-sm">
                                لا توجد مقاسات لهذا المنتج
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 border rounded-md">
                  <p className="text-gray-500 text-sm md:text-base">لا توجد منتجات مسجلة</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PriceManagement;
