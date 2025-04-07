
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrders } from "@/context/OrderContext";
import { ORDER_STATUS_LABELS, OrderStatus } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Printer } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const OrdersTable: React.FC = () => {
  const { orders, updateOrderStatus, deleteOrder } = useOrders();
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const navigate = useNavigate();

  const filteredOrders = filter === "all" 
    ? orders
    : orders.filter(order => order.status === filter);

  const handleStatusChange = (index: number, status: OrderStatus) => {
    updateOrderStatus(index, status);
  };

  const handleOrderDelete = (index: number) => {
    deleteOrder(index);
  };

  const viewOrderDetails = (serial: string) => {
    navigate(`/orders/${serial}`);
  };

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
                    <td>{order.items.length}</td>
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
      </CardContent>
    </Card>
  );
};

export default OrdersTable;
