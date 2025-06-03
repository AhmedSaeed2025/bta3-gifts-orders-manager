
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { ORDER_STATUS_LABELS, OrderStatus } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Printer, Edit, DollarSign, Truck, CreditCard, CheckCircle, XCircle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { 
  ResponsiveTable, 
  ResponsiveTableHead, 
  ResponsiveTableBody, 
  ResponsiveTableRow, 
  ResponsiveTableHeader, 
  ResponsiveTableCell 
} from "@/components/ui/responsive-table";

interface TransactionRecord {
  id: string;
  order_serial: string;
  transaction_type: string;
  amount: number;
  description: string;
  created_at: string;
}

const OrdersTable: React.FC = () => {
  const { orders, updateOrderStatus, deleteOrder, loading } = useSupabaseOrders();
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
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

  // Load transactions
  const loadTransactions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [user]);

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
      
      // Reload transactions
      await loadTransactions();
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

  const getOrderTransactions = (orderSerial: string) => {
    return transactions.filter(t => t.order_serial === orderSerial);
  };

  const hasOrderTransaction = (orderSerial: string, transactionType: string) => {
    return transactions.some(t => t.order_serial === orderSerial && t.transaction_type === transactionType);
  };

  const deleteTransaction = async (transactionId: string) => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success("تم حذف المعاملة بنجاح");
      await loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error("حدث خطأ في حذف المعاملة");
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gift-primary border-t-transparent mx-auto"></div>
            <p className="text-lg text-gray-600 dark:text-gray-400">جاري تحميل الطلبات...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rtl space-y-6" style={{ direction: 'rtl' }}>
      <Card className={`${isMobile ? "mobile-card" : ""} bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-l-4 border-l-indigo-500`}>
        <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-4 ${isMobile ? "card-header" : ""}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500 rounded-lg">
              <Printer className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-gray-800 dark:text-white`}>
                إدارة الطلبات
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                عرض وإدارة جميع الطلبات والمعاملات المالية
              </p>
            </div>
          </div>
          <div className={`${isMobile ? "w-32" : "w-64"}`}>
            <Select 
              value={filter}
              onValueChange={(value) => setFilter(value as "all" | OrderStatus)}
            >
              <SelectTrigger className={`${isMobile ? "text-xs" : ""} shadow-lg`}>
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
        <CardContent className={isMobile ? "card-content p-2" : "p-6"}>
          <div className="overflow-x-auto">
            <ResponsiveTable className="w-full">
              <ResponsiveTableHead>
                <ResponsiveTableRow className="bg-gray-50 dark:bg-gray-800">
                  <ResponsiveTableHeader className="font-semibold">رقم الطلب</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold">اسم العميل</ResponsiveTableHeader>
                  {!isMobile && <ResponsiveTableHeader className="font-semibold">التليفون</ResponsiveTableHeader>}
                  <ResponsiveTableHeader className="font-semibold">الحالة</ResponsiveTableHeader>
                  {!isMobile && <ResponsiveTableHeader className="font-semibold">تعديل الحالة</ResponsiveTableHeader>}
                  <ResponsiveTableHeader className="font-semibold">عدد المنتجات</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold">المجموع</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold">حالة التحصيل</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold">إجراءات</ResponsiveTableHeader>
                </ResponsiveTableRow>
              </ResponsiveTableHead>
              <ResponsiveTableBody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order, index) => {
                    const orderTransactions = getOrderTransactions(order.serial);
                    const isCollected = hasOrderTransaction(order.serial, 'order_collection');
                    const hasShippingPayment = hasOrderTransaction(order.serial, 'shipping_payment');
                    const hasCostPayment = hasOrderTransaction(order.serial, 'cost_payment');

                    return (
                      <ResponsiveTableRow key={order.serial} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <ResponsiveTableCell className="font-medium">{order.serial}</ResponsiveTableCell>
                        <ResponsiveTableCell>{order.clientName}</ResponsiveTableCell>
                        {!isMobile && <ResponsiveTableCell>{order.phone}</ResponsiveTableCell>}
                        <ResponsiveTableCell>
                          <Badge 
                            variant="outline"
                            className={`${
                              order.status === 'shipped' ? 'bg-green-100 text-green-800 border-green-300' :
                              order.status === 'confirmed' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                              'bg-gray-100 text-gray-800 border-gray-300'
                            }`}
                          >
                            {ORDER_STATUS_LABELS[order.status]}
                          </Badge>
                        </ResponsiveTableCell>
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
                        <ResponsiveTableCell className="text-center">{order.items && order.items.length ? order.items.length : 0}</ResponsiveTableCell>
                        <ResponsiveTableCell className="font-semibold">{formatCurrency(order.total)}</ResponsiveTableCell>
                        <ResponsiveTableCell>
                          <div className="flex flex-wrap gap-1">
                            {isCollected && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                تم التحصيل
                              </Badge>
                            )}
                            {hasShippingPayment && (
                              <Badge className="bg-blue-100 text-blue-800 text-xs">
                                <Truck className="w-3 h-3 mr-1" />
                                شحن مدفوع
                              </Badge>
                            )}
                            {hasCostPayment && (
                              <Badge className="bg-purple-100 text-purple-800 text-xs">
                                <CreditCard className="w-3 h-3 mr-1" />
                                تكلفة مدفوعة
                              </Badge>
                            )}
                          </div>
                        </ResponsiveTableCell>
                        <ResponsiveTableCell>
                          <div className={`flex gap-1 ${isMobile ? "flex-col" : "flex-wrap"}`}>
                            <Button 
                              className={`${isMobile ? "h-8 text-xs" : "h-8 text-xs"} bg-blue-500 hover:bg-blue-600 shadow-sm`}
                              onClick={() => viewOrderDetails(order.serial)}
                            >
                              {isMobile ? <Printer size={12} /> : "عرض"}
                            </Button>
                            
                            {!isCollected ? (
                              <Button
                                className={`${isMobile ? "h-8 text-xs" : "h-8 text-xs"} bg-green-600 hover:bg-green-700 shadow-sm`}
                                onClick={() => openTransactionDialog(order.serial, 'order_collection')}
                              >
                                {isMobile ? <DollarSign size={12} /> : "تحصيل"}
                              </Button>
                            ) : (
                              <div className="flex gap-1">
                                <Button
                                  className={`${isMobile ? "h-8 text-xs" : "h-8 text-xs"} bg-red-500 hover:bg-red-600 shadow-sm`}
                                  onClick={() => {
                                    const collectionTransaction = orderTransactions.find(t => t.transaction_type === 'order_collection');
                                    if (collectionTransaction) {
                                      deleteTransaction(collectionTransaction.id);
                                    }
                                  }}
                                >
                                  <XCircle size={12} />
                                </Button>
                              </div>
                            )}
                            
                            {!hasShippingPayment ? (
                              <Button
                                className={`${isMobile ? "h-8 text-xs" : "h-8 text-xs"} bg-orange-500 hover:bg-orange-600 shadow-sm`}
                                onClick={() => openTransactionDialog(order.serial, 'shipping_payment')}
                              >
                                {isMobile ? <Truck size={12} /> : "شحن"}
                              </Button>
                            ) : (
                              <Button
                                className={`${isMobile ? "h-8 text-xs" : "h-8 text-xs"} bg-red-500 hover:bg-red-600 shadow-sm`}
                                onClick={() => {
                                  const shippingTransaction = orderTransactions.find(t => t.transaction_type === 'shipping_payment');
                                  if (shippingTransaction) {
                                    deleteTransaction(shippingTransaction.id);
                                  }
                                }}
                              >
                                <XCircle size={12} />
                              </Button>
                            )}
                            
                            {!hasCostPayment ? (
                              <Button
                                className={`${isMobile ? "h-8 text-xs" : "h-8 text-xs"} bg-purple-500 hover:bg-purple-600 shadow-sm`}
                                onClick={() => openTransactionDialog(order.serial, 'cost_payment')}
                              >
                                {isMobile ? <CreditCard size={12} /> : "تكلفة"}
                              </Button>
                            ) : (
                              <Button
                                className={`${isMobile ? "h-8 text-xs" : "h-8 text-xs"} bg-red-500 hover:bg-red-600 shadow-sm`}
                                onClick={() => {
                                  const costTransaction = orderTransactions.find(t => t.transaction_type === 'cost_payment');
                                  if (costTransaction) {
                                    deleteTransaction(costTransaction.id);
                                  }
                                }}
                              >
                                <XCircle size={12} />
                              </Button>
                            )}
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button className={`${isMobile ? "h-8 text-xs" : "h-8 text-xs"} bg-red-600 hover:bg-red-700 shadow-sm`}>
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
                                    className="bg-red-600 hover:bg-red-700"
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
                    );
                  })
                ) : (
                  <ResponsiveTableRow>
                    <ResponsiveTableCell colSpan={isMobile ? 8 : 9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Printer className="h-12 w-12 text-gray-400" />
                        <p className="text-gray-500 text-lg">لا توجد طلبات متاحة</p>
                      </div>
                    </ResponsiveTableCell>
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
