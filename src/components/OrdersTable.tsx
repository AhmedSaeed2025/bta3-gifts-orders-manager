
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { ORDER_STATUS_LABELS, OrderStatus } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Printer, Edit, DollarSign, Truck, CreditCard } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  ResponsiveTable, 
  ResponsiveTableHead, 
  ResponsiveTableBody, 
  ResponsiveTableRow, 
  ResponsiveTableHeader, 
  ResponsiveTableCell 
} from "@/components/ui/responsive-table";

const OrdersTable: React.FC = () => {
  const { orders, updateOrderStatus, deleteOrder, loading } = useSupabaseOrders();
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  
  // Transaction dialogs state
  const [transactionDialog, setTransactionDialog] = useState(false);
  const [transactionType, setTransactionType] = useState<'order_collection' | 'shipping_payment' | 'cost_payment'>('order_collection');
  const [selectedOrderSerial, setSelectedOrderSerial] = useState<string>('');
  const [transactionAmount, setTransactionAmount] = useState<number>(0);
  const [transactionDescription, setTransactionDescription] = useState<string>('');

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

  const openTransactionDialog = (orderSerial: string, type: 'order_collection' | 'shipping_payment' | 'cost_payment') => {
    setSelectedOrderSerial(orderSerial);
    setTransactionType(type);
    setTransactionDialog(true);
    
    // Set default amounts based on transaction type
    const order = orders.find(o => o.serial === orderSerial);
    if (order) {
      switch (type) {
        case 'order_collection':
          setTransactionAmount(order.total);
          setTransactionDescription(`تحصيل قيمة الطلب ${orderSerial}`);
          break;
        case 'shipping_payment':
          setTransactionAmount(order.shippingCost || 0);
          setTransactionDescription(`دفع مصاريف شحن الطلب ${orderSerial}`);
          break;
        case 'cost_payment':
          const totalCost = order.items?.reduce((sum, item) => sum + (item.cost * item.quantity), 0) || 0;
          setTransactionAmount(totalCost);
          setTransactionDescription(`دفع تكلفة الطلب ${orderSerial}`);
          break;
      }
    }
  };

  const handleTransactionSubmit = async () => {
    if (!user || !selectedOrderSerial || transactionAmount <= 0) {
      toast.error("يرجى ملء جميع البيانات المطلوبة");
      return;
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          order_serial: selectedOrderSerial,
          transaction_type: transactionType,
          amount: transactionAmount,
          description: transactionDescription
        });

      if (error) throw error;

      toast.success("تم تسجيل المعاملة بنجاح");
      setTransactionDialog(false);
      setTransactionAmount(0);
      setTransactionDescription('');
      setSelectedOrderSerial('');
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error("حدث خطأ في تسجيل المعاملة");
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'order_collection':
        return 'تحصيل الطلب';
      case 'shipping_payment':
        return 'دفع شحن';
      case 'cost_payment':
        return 'دفع تكلفة';
      default:
        return type;
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
    <div className="rtl" style={{ direction: 'rtl' }}>
      <Card className={isMobile ? "mobile-card" : ""}>
        <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${isMobile ? "card-header" : ""}`}>
          <CardTitle className={`${isMobile ? "text-lg" : "text-xl"}`}>جميع الطلبات</CardTitle>
          <div className={`${isMobile ? "w-32" : "w-64"}`}>
            <Select 
              value={filter}
              onValueChange={(value) => setFilter(value as "all" | OrderStatus)}
            >
              <SelectTrigger className={isMobile ? "text-xs" : ""}>
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
        <CardContent className={isMobile ? "card-content" : ""}>
          <div className="overflow-x-auto">
            <ResponsiveTable>
              <ResponsiveTableHead>
                <ResponsiveTableRow>
                  <ResponsiveTableHeader>سريال</ResponsiveTableHeader>
                  <ResponsiveTableHeader>اسم العميل</ResponsiveTableHeader>
                  {!isMobile && <ResponsiveTableHeader>التليفون</ResponsiveTableHeader>}
                  <ResponsiveTableHeader>الحالة</ResponsiveTableHeader>
                  {!isMobile && <ResponsiveTableHeader>تعديل الحالة</ResponsiveTableHeader>}
                  <ResponsiveTableHeader>عدد المنتجات</ResponsiveTableHeader>
                  <ResponsiveTableHeader>المجموع</ResponsiveTableHeader>
                  <ResponsiveTableHeader>إجراءات</ResponsiveTableHeader>
                </ResponsiveTableRow>
              </ResponsiveTableHead>
              <ResponsiveTableBody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order, index) => (
                    <ResponsiveTableRow key={order.serial}>
                      <ResponsiveTableCell className={isMobile ? "text-xs" : ""}>{order.serial}</ResponsiveTableCell>
                      <ResponsiveTableCell className={isMobile ? "text-xs" : ""}>{order.clientName}</ResponsiveTableCell>
                      {!isMobile && <ResponsiveTableCell>{order.phone}</ResponsiveTableCell>}
                      <ResponsiveTableCell className={isMobile ? "text-xs" : ""}>{ORDER_STATUS_LABELS[order.status]}</ResponsiveTableCell>
                      {!isMobile && (
                        <ResponsiveTableCell>
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
                        </ResponsiveTableCell>
                      )}
                      <ResponsiveTableCell className={isMobile ? "text-xs" : ""}>{order.items && order.items.length ? order.items.length : 0}</ResponsiveTableCell>
                      <ResponsiveTableCell className={isMobile ? "text-xs" : ""}>{formatCurrency(order.total)}</ResponsiveTableCell>
                      <ResponsiveTableCell>
                        <div className={`flex gap-1 ${isMobile ? "flex-col" : "flex-wrap"}`}>
                          <Button 
                            className={`${isMobile ? "h-6 text-xs" : "h-7 text-xs"} bg-blue-500 hover:bg-blue-600`}
                            onClick={() => viewOrderDetails(order.serial)}
                          >
                            {isMobile ? <Printer size={12} /> : "عرض"}
                          </Button>
                          
                          <Button
                            className={`${isMobile ? "h-6 text-xs" : "h-7 text-xs"} bg-green-600 hover:bg-green-700`}
                            onClick={() => openTransactionDialog(order.serial, 'order_collection')}
                          >
                            {isMobile ? <DollarSign size={12} /> : "تحصيل"}
                          </Button>
                          
                          <Button
                            className={`${isMobile ? "h-6 text-xs" : "h-7 text-xs"} bg-orange-500 hover:bg-orange-600`}
                            onClick={() => openTransactionDialog(order.serial, 'shipping_payment')}
                          >
                            {isMobile ? <Truck size={12} /> : "شحن"}
                          </Button>
                          
                          <Button
                            className={`${isMobile ? "h-6 text-xs" : "h-7 text-xs"} bg-purple-500 hover:bg-purple-600`}
                            onClick={() => openTransactionDialog(order.serial, 'cost_payment')}
                          >
                            {isMobile ? <CreditCard size={12} /> : "تكلفة"}
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button className={`${isMobile ? "h-6 text-xs" : "h-7 text-xs"} bg-gift-primary hover:bg-gift-primaryHover`}>
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
                        </div>
                      </ResponsiveTableCell>
                    </ResponsiveTableRow>
                  ))
                ) : (
                  <ResponsiveTableRow>
                    <ResponsiveTableCell colSpan={isMobile ? 6 : 8} className="text-center py-4">لا توجد طلبات متاحة</ResponsiveTableCell>
                  </ResponsiveTableRow>
                )}
              </ResponsiveTableBody>
            </ResponsiveTable>
          </div>

          {/* Transaction Dialog */}
          <Dialog open={transactionDialog} onOpenChange={setTransactionDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg">{getTransactionTypeLabel(transactionType)}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="transactionAmount">المبلغ</Label>
                  <Input 
                    id="transactionAmount"
                    type="number"
                    value={transactionAmount}
                    onChange={(e) => setTransactionAmount(Number(e.target.value))}
                    step={0.01}
                    min={0}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="transactionDescription">الوصف</Label>
                  <Input 
                    id="transactionDescription"
                    value={transactionDescription}
                    onChange={(e) => setTransactionDescription(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => setTransactionDialog(false)}
                  >
                    إلغاء
                  </Button>
                  <Button 
                    onClick={handleTransactionSubmit}
                    className="bg-gift-primary hover:bg-gift-primaryHover"
                  >
                    تسجيل المعاملة
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersTable;
