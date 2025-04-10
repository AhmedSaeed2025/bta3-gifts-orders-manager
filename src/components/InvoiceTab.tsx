
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
import { Order } from "@/types";

const InvoiceTab = () => {
  const { orders, updateOrder } = useOrders();
  const [selectedOrderSerial, setSelectedOrderSerial] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<Order | undefined>(orders && orders.length > 0 ? orders[0] : undefined);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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
      setEditingOrder({...selectedOrder});
      setEditDialogOpen(true);
    }
  };

  // Save edited order
  const handleSaveEdit = (e: FormEvent) => {
    e.preventDefault();
    
    if (editingOrder) {
      const orderIndex = orders.findIndex(o => o.serial === editingOrder.serial);
      if (orderIndex !== -1) {
        updateOrder(orderIndex, editingOrder);
        setSelectedOrder(editingOrder);
        setEditDialogOpen(false);
      }
    }
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
              <DialogContent className="max-w-md">
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
                  
                  <div className="space-y-1">
                    <Label htmlFor="discount" className="text-xs">الخصم</Label>
                    <Input 
                      id="discount" 
                      type="number"
                      value={editingOrder?.discount || 0}
                      onChange={(e) => setEditingOrder(prev => prev ? {...prev, discount: Number(e.target.value)} : null)}
                      className="text-xs"
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
                    />
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
