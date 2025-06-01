
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { ORDER_STATUS_LABELS, OrderStatus } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Printer, Edit } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OrderItem } from "@/types";

const OrdersTable: React.FC = () => {
  const { orders, updateOrderStatus, deleteOrder, updateOrder, loading } = useSupabaseOrders();
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const navigate = useNavigate();
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editItems, setEditItems] = useState<OrderItem[]>([]);

  // Safety check: ensure orders is an array before filtering
  const safeOrders = Array.isArray(orders) ? orders : [];

  const filteredOrders = filter === "all" 
    ? safeOrders
    : safeOrders.filter(order => order.status === filter);

  const handleStatusChange = (index: number, status: OrderStatus) => {
    updateOrderStatus(index, status);
  };

  const handleOrderDelete = (index: number) => {
    deleteOrder(index);
  };

  const viewOrderDetails = (serial: string) => {
    navigate(`/orders/${serial}`);
  };

  const editOrder = (order: any, index: number) => {
    setEditingOrder({...order, index});
    setEditItems([...order.items]);
    setEditDialogOpen(true);
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

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingOrder) {
      // Calculate new total
      const subtotal = editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const total = subtotal + (editingOrder.shippingCost || 0) - (editingOrder.discount || 0) - (editingOrder.deposit || 0);
      
      const updatedOrder = {
        ...editingOrder,
        items: editItems,
        total: Math.max(0, total),
        profit: editItems.reduce((sum, item) => sum + ((item.price - item.cost) * item.quantity), 0)
      };
      
      delete updatedOrder.index;
      updateOrder(editingOrder.index, updatedOrder);
      setEditDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gift-primary mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">جاري تحميل الطلبات...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl">جميع الطلبات</CardTitle>
        <div className="w-64">
          <Select 
            value={filter}
            onValueChange={(value) => setFilter(value as "all" | OrderStatus)}
          >
            <SelectTrigger>
              <SelectValue placeholder="تصفية حسب الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="pending">في انتظار التأكيد</SelectItem>
              <SelectItem value="confirmed">تم التأكيد</SelectItem>
              <SelectItem value="sentToPrinter">تم الأرسال للمطبعة</SelectItem>
              <SelectItem value="readyForDelivery">تحت التسليم</SelectItem>
              <SelectItem value="shipped">تم الشحن</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="gift-table">
            <thead>
              <tr>
                <th>سريال</th>
                <th>اسم العميل</th>
                <th>الحالة</th>
                <th>تعديل الحالة</th>
                <th>عدد المنتجات</th>
                <th>المجموع</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order, index) => (
                  <tr key={order.serial}>
                    <td>{order.serial}</td>
                    <td>{order.clientName}</td>
                    <td>{ORDER_STATUS_LABELS[order.status]}</td>
                    <td>
                      <Select 
                        value={order.status}
                        onValueChange={(value) => handleStatusChange(index, value as OrderStatus)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">في انتظار التأكيد</SelectItem>
                          <SelectItem value="confirmed">تم التأكيد</SelectItem>
                          <SelectItem value="sentToPrinter">تم الأرسال للمطبعة</SelectItem>
                          <SelectItem value="readyForDelivery">تحت التسليم</SelectItem>
                          <SelectItem value="shipped">تم الشحن</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td>{order.items && order.items.length ? order.items.length : 0}</td>
                    <td>{formatCurrency(order.total)}</td>
                    <td className="flex flex-wrap gap-1">
                      <Button 
                        className="h-7 text-xs bg-blue-500 hover:bg-blue-600"
                        onClick={() => viewOrderDetails(order.serial)}
                      >
                        عرض
                      </Button>
                      <Button
                        className="h-7 text-xs bg-green-600 hover:bg-green-700"
                        onClick={() => viewOrderDetails(order.serial)}
                      >
                        <Printer size={14} className="ml-1" />
                        فاتورة
                      </Button>
                      <Button
                        className="h-7 text-xs bg-amber-500 hover:bg-amber-600"
                        onClick={() => editOrder(order, index)}
                      >
                        <Edit size={14} className="ml-1" />
                        تعديل
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button className="h-7 text-xs bg-gift-primary hover:bg-gift-primaryHover">
                            حذف
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>تأكيد حذف الطلب</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-gift-primary hover:bg-gift-primaryHover"
                              onClick={() => handleOrderDelete(index)}
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-4">لا توجد طلبات متاحة</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Edit Order Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">تعديل بيانات الطلب</DialogTitle>
            </DialogHeader>
            
            {editingOrder && (
              <form onSubmit={handleSaveEdit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="serial" className="text-xs">رقم الطلب</Label>
                    <Input 
                      id="serial" 
                      value={editingOrder?.serial || ''}
                      onChange={(e) => setEditingOrder(prev => ({...prev, serial: e.target.value}))}
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
                        setEditingOrder(prev => ({...prev, dateCreated: date.toISOString()}));
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
                      onChange={(e) => setEditingOrder(prev => ({...prev, clientName: e.target.value}))}
                      className="text-xs"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="phone" className="text-xs">رقم التليفون</Label>
                    <Input 
                      id="phone" 
                      value={editingOrder?.phone || ''}
                      onChange={(e) => setEditingOrder(prev => ({...prev, phone: e.target.value}))}
                      className="text-xs"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="paymentMethod" className="text-xs">طريقة الدفع</Label>
                    <Select
                      value={editingOrder?.paymentMethod || ''}
                      onValueChange={(value) => setEditingOrder(prev => ({...prev, paymentMethod: value}))}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="اختر طريقة الدفع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="نقدي عند الاستلام">نقدي عند الاستلام</SelectItem>
                        <SelectItem value="انستا باي">انستا باي</SelectItem>
                        <SelectItem value="محفظة الكترونية">محفظة الكترونية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="deliveryMethod" className="text-xs">طريقة التوصيل</Label>
                    <Select
                      value={editingOrder?.deliveryMethod || ''}
                      onValueChange={(value) => setEditingOrder(prev => ({...prev, deliveryMethod: value}))}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="اختر طريقة التوصيل" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="استلام من المعادي">استلام من المعادي</SelectItem>
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
                        onChange={(e) => setEditingOrder(prev => ({...prev, address: e.target.value}))}
                        className="text-xs"
                        rows={2}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="governorate" className="text-xs">المحافظة</Label>
                      <Input 
                        id="governorate" 
                        value={editingOrder?.governorate || ''}
                        onChange={(e) => setEditingOrder(prev => ({...prev, governorate: e.target.value}))}
                        className="text-xs"
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-1">
                  <Label htmlFor="status" className="text-xs">حالة الطلب</Label>
                  <Select
                    value={editingOrder?.status || ''}
                    onValueChange={(value) => setEditingOrder(prev => ({...prev, status: value as OrderStatus}))}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="اختر حالة الطلب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">في انتظار التأكيد</SelectItem>
                      <SelectItem value="confirmed">تم التأكيد</SelectItem>
                      <SelectItem value="sentToPrinter">تم الأرسال للمطبعة</SelectItem>
                      <SelectItem value="readyForDelivery">تحت التسليم</SelectItem>
                      <SelectItem value="shipped">تم الشحن</SelectItem>
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
                      onChange={(e) => setEditingOrder(prev => ({...prev, discount: Number(e.target.value)}))}
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
                      onChange={(e) => setEditingOrder(prev => ({...prev, shippingCost: Number(e.target.value)}))}
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
                      onChange={(e) => setEditingOrder(prev => ({...prev, deposit: Number(e.target.value)}))}
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
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default OrdersTable;
