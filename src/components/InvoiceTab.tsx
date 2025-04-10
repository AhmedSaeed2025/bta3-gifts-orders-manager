
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrders } from "@/context/OrderContext";
import Invoice from "./Invoice";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { FormEvent } from "react";
import { Pencil } from "lucide-react";
import { Order, OrderItem, OrderStatus } from "@/types";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";

const InvoiceTab = () => {
  const { orders, updateOrder } = useOrders();
  const [selectedOrderSerial, setSelectedOrderSerial] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<Order | undefined>(orders && orders.length > 0 ? orders[0] : undefined);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editItems, setEditItems] = useState<OrderItem[]>([]);

  // Update order options when orders change
  useEffect(() => {
    if (orders && orders.length > 0 && !selectedOrderSerial) {
      setSelectedOrderSerial(orders[0].serial);
      setSelectedOrder(orders[0]);
    }
  }, [orders, selectedOrderSerial]);

  // Handle order selection
  const handleOrderChange = (serial: string) => {
    setSelectedOrderSerial(serial);
    const order = orders.find(o => o.serial === serial);
    if (order) {
      setSelectedOrder(order);
    }
  };

  // Start editing an order
  const handleEditClick = () => {
    if (selectedOrder) {
      const orderToEdit = {...selectedOrder};
      setEditingOrder(orderToEdit);
      setEditItems(orderToEdit.items ? [...orderToEdit.items] : []);
      setEditDialogOpen(true);
    }
  };

  // Handle item change
  const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
    const updatedItems = [...editItems];
    
    if (field === 'quantity' || field === 'price' || field === 'cost') {
      updatedItems[index] = { 
        ...updatedItems[index], 
        [field]: Number(value),
        profit: field === 'price' ? Number(value) * updatedItems[index].quantity - updatedItems[index].cost : 
                field === 'cost' ? updatedItems[index].price * updatedItems[index].quantity - Number(value) :
                field === 'quantity' ? updatedItems[index].price * Number(value) - updatedItems[index].cost :
                updatedItems[index].profit
      };
    } else {
      updatedItems[index] = { ...updatedItems[index], [field]: value };
    }
    
    setEditItems(updatedItems);
  };

  // Save edited order
  const handleSaveEdit = (e: FormEvent) => {
    e.preventDefault();
    
    if (editingOrder) {
      // Calculate new total
      const subtotal = editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const total = subtotal + (editingOrder.shippingCost || 0) - (editingOrder.discount || 0) - (editingOrder.deposit || 0);
      
      const updatedOrder = {
        ...editingOrder,
        items: editItems,
        total: Math.max(0, total)
      };
      
      const orderIndex = orders.findIndex(o => o.serial === updatedOrder.serial);
      if (orderIndex !== -1) {
        updateOrder(orderIndex, updatedOrder);
        setSelectedOrder(updatedOrder);
        setEditDialogOpen(false);
        toast.success("تم تحديث الطلب بنجاح");
      }
    }
  };

  // Add a new item
  const handleAddItem = () => {
    setEditItems([
      ...editItems, 
      { 
        productType: "", 
        size: "", 
        quantity: 1, 
        price: 0, 
        cost: 0,
        profit: 0
      }
    ]);
  };

  // Remove an item
  const handleRemoveItem = (index: number) => {
    const updatedItems = [...editItems];
    updatedItems.splice(index, 1);
    setEditItems(updatedItems);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="py-3">
        <CardTitle className="text-base md:text-xl flex items-center justify-between">
          <span>طباعة الفاتورة</span>
          {selectedOrder && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleEditClick}
              className="text-xs flex items-center gap-1 h-7"
            >
              <Pencil size={14} />
              تعديل الطلب
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 md:p-4">
        {!orders || orders.length === 0 ? (
          <p className="text-center py-3 text-sm">لا توجد طلبات متاحة لعرض الفاتورة</p>
        ) : (
          <div>
            <div className="mb-4">
              <Label htmlFor="orderSelect" className="text-xs md:text-sm mb-1 block">اختر الطلب:</Label>
              <Select 
                value={selectedOrderSerial}
                onValueChange={handleOrderChange}
              >
                <SelectTrigger className="w-full text-xs md:text-sm h-8 md:h-10">
                  <SelectValue placeholder="اختر الطلب" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order) => (
                    <SelectItem key={order.serial} value={order.serial} className="text-xs md:text-sm">
                      {`${order.serial} - ${order.clientName}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedOrder && (
              <Invoice order={selectedOrder} />
            )}
            
            {/* Edit Order Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg">تعديل بيانات الطلب</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSaveEdit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="serial" className="text-xs">رقم الطلب</Label>
                      <Input 
                        id="serial" 
                        value={editingOrder?.serial || ''}
                        onChange={(e) => setEditingOrder(prev => prev ? {...prev, serial: e.target.value} : null)}
                        className="text-xs"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="dateCreated" className="text-xs">تاريخ الطلب</Label>
                      <Input 
                        id="dateCreated" 
                        type="date"
                        value={editingOrder ? new Date(editingOrder.dateCreated).toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          const date = new Date(e.target.value);
                          setEditingOrder(prev => prev ? {...prev, dateCreated: date.toISOString()} : null);
                        }}
                        className="text-xs"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="clientName" className="text-xs">اسم العميل</Label>
                      <Input 
                        id="clientName" 
                        value={editingOrder?.clientName || ''}
                        onChange={(e) => setEditingOrder(prev => prev ? {...prev, clientName: e.target.value} : null)}
                        className="text-xs"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="phone" className="text-xs">رقم التليفون</Label>
                      <Input 
                        id="phone" 
                        value={editingOrder?.phone || ''}
                        onChange={(e) => setEditingOrder(prev => prev ? {...prev, phone: e.target.value} : null)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="paymentMethod" className="text-xs">طريقة الدفع</Label>
                      <Select
                        value={editingOrder?.paymentMethod || ''}
                        onValueChange={(value) => setEditingOrder(prev => prev ? {...prev, paymentMethod: value} : null)}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="اختر طريقة الدفع" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="كاش">كاش</SelectItem>
                          <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
                          <SelectItem value="فوري">فوري</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="deliveryMethod" className="text-xs">طريقة التوصيل</Label>
                      <Select
                        value={editingOrder?.deliveryMethod || ''}
                        onValueChange={(value) => setEditingOrder(prev => prev ? {...prev, deliveryMethod: value} : null)}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="اختر طريقة التوصيل" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="استلام من المتجر">استلام من المتجر</SelectItem>
                          <SelectItem value="شحن للمنزل">شحن للمنزل</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {editingOrder?.deliveryMethod === "شحن للمنزل" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="address" className="text-xs">العنوان</Label>
                        <Textarea 
                          id="address" 
                          value={editingOrder?.address || ''}
                          onChange={(e) => setEditingOrder(prev => prev ? {...prev, address: e.target.value} : null)}
                          className="text-xs"
                          rows={2}
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <Label htmlFor="governorate" className="text-xs">المحافظة</Label>
                        <Input 
                          id="governorate" 
                          value={editingOrder?.governorate || ''}
                          onChange={(e) => setEditingOrder(prev => prev ? {...prev, governorate: e.target.value} : null)}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <Label htmlFor="status" className="text-xs">حالة الطلب</Label>
                    <Select
                      value={editingOrder?.status || ''}
                      onValueChange={(value) => setEditingOrder(prev => prev ? {...prev, status: value as OrderStatus} : null)}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="اختر حالة الطلب" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="جديد">جديد</SelectItem>
                        <SelectItem value="جاري التجهيز">جاري التجهيز</SelectItem>
                        <SelectItem value="جاهز للتسليم">جاهز للتسليم</SelectItem>
                        <SelectItem value="تم التسليم">تم التسليم</SelectItem>
                        <SelectItem value="ملغي">ملغي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="border p-3 rounded-md">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-sm">المنتجات</h3>
                      <Button 
                        type="button" 
                        onClick={handleAddItem} 
                        variant="outline" 
                        size="sm"
                        className="text-xs"
                      >
                        إضافة منتج
                      </Button>
                    </div>
                    
                    {editItems.map((item, index) => (
                      <div key={index} className="border-t pt-2 mt-2 first:border-t-0 first:pt-0 first:mt-0">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">منتج {index + 1}</span>
                          {editItems.length > 1 && (
                            <Button 
                              type="button" 
                              onClick={() => handleRemoveItem(index)} 
                              variant="ghost" 
                              size="sm" 
                              className="text-xs text-red-500 h-6 px-2"
                            >
                              حذف
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <Label htmlFor={`productType-${index}`} className="text-xs mb-1 block">نوع المنتج</Label>
                            <Input 
                              id={`productType-${index}`}
                              value={item.productType}
                              onChange={(e) => handleItemChange(index, 'productType', e.target.value)}
                              className="text-xs"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`size-${index}`} className="text-xs mb-1 block">المقاس</Label>
                            <Input 
                              id={`size-${index}`}
                              value={item.size}
                              onChange={(e) => handleItemChange(index, 'size', e.target.value)}
                              className="text-xs"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label htmlFor={`quantity-${index}`} className="text-xs mb-1 block">الكمية</Label>
                            <Input 
                              id={`quantity-${index}`}
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              className="text-xs"
                              min={1}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`price-${index}`} className="text-xs mb-1 block">السعر</Label>
                            <Input 
                              id={`price-${index}`}
                              type="number"
                              value={item.price}
                              onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                              className="text-xs"
                              min={0}
                              step={0.01}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`cost-${index}`} className="text-xs mb-1 block">التكلفة</Label>
                            <Input 
                              id={`cost-${index}`}
                              type="number"
                              value={item.cost}
                              onChange={(e) => handleItemChange(index, 'cost', e.target.value)}
                              className="text-xs"
                              min={0}
                              step={0.01}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="discount" className="text-xs">الخصم</Label>
                      <Input 
                        id="discount" 
                        type="number"
                        value={editingOrder?.discount || 0}
                        onChange={(e) => setEditingOrder(prev => prev ? {...prev, discount: Number(e.target.value)} : null)}
                        className="text-xs"
                        min={0}
                        step={0.01}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="shippingCost" className="text-xs">تكلفة الشحن</Label>
                      <Input 
                        id="shippingCost" 
                        type="number"
                        value={editingOrder?.shippingCost || 0}
                        onChange={(e) => setEditingOrder(prev => prev ? {...prev, shippingCost: Number(e.target.value)} : null)}
                        className="text-xs"
                        min={0}
                        step={0.01}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="deposit" className="text-xs">العربون المدفوع</Label>
                      <Input 
                        id="deposit" 
                        type="number"
                        value={editingOrder?.deposit || 0}
                        onChange={(e) => setEditingOrder(prev => prev ? {...prev, deposit: Number(e.target.value)} : null)}
                        className="text-xs"
                        min={0}
                        step={0.01}
                      />
                    </div>
                  </div>
                  
                  <div className="pt-2 flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setEditDialogOpen(false)}
                      className="text-xs"
                    >
                      إلغاء
                    </Button>
                    <Button 
                      type="submit"
                      className="text-xs bg-gift-primary hover:bg-gift-primaryHover"
                    >
                      حفظ التغييرات
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceTab;
