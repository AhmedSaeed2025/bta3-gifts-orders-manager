
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { formatCurrency } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import CustomAmountDialog from "./CustomAmountDialog";
import { 
  Edit, 
  Eye, 
  Trash2, 
  Package, 
  Filter, 
  RefreshCw,
  TrendingUp,
  Calendar,
  DollarSign,
  CreditCard,
  Truck,
  X,
  Clock,
  Settings,
  CheckCircle
} from "lucide-react";
import { 
  ResponsiveTable, 
  ResponsiveTableHead, 
  ResponsiveTableBody, 
  ResponsiveTableRow, 
  ResponsiveTableHeader, 
  ResponsiveTableCell 
} from "@/components/ui/responsive-table";
import { useTransactions } from "@/context/TransactionContext";

const OrdersTable = () => {
  const { orders, loading, deleteOrder, updateOrderStatus } = useSupabaseOrders();
  const { addTransaction, deleteTransaction, getTransactionsByOrderSerial } = useTransactions();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Filter states
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>("all");

  // Custom amount dialog states
  const [customAmountDialog, setCustomAmountDialog] = useState<{
    isOpen: boolean;
    type: 'collection' | 'shipping' | 'cost';
    order: any;
    defaultAmount: number;
  }>({
    isOpen: false,
    type: 'collection',
    order: null,
    defaultAmount: 0
  });

  const safeOrders = Array.isArray(orders) ? orders : [];

  // Get available years for filter
  const availableYears = React.useMemo(() => {
    const years = new Set<string>();
    safeOrders.forEach(order => {
      const year = new Date(order.dateCreated).getFullYear().toString();
      years.add(year);
    });
    return Array.from(years).sort().reverse();
  }, [safeOrders]);

  // Filter orders based on selected filters
  const filteredOrders = React.useMemo(() => {
    return safeOrders.filter(order => {
      const orderDate = new Date(order.dateCreated);
      const orderYear = orderDate.getFullYear().toString();
      const orderMonth = (orderDate.getMonth() + 1).toString().padStart(2, '0');
      
      if (filterYear !== "all" && orderYear !== filterYear) return false;
      if (filterMonth !== "all" && orderMonth !== filterMonth) return false;
      if (filterStatus !== "all" && order.status !== filterStatus) return false;
      if (filterPaymentMethod !== "all" && order.paymentMethod !== filterPaymentMethod) return false;
      
      return true;
    });
  }, [safeOrders, filterMonth, filterYear, filterStatus, filterPaymentMethod]);

  // Calculate summary statistics - مع إضافة البيانات الجديدة المطلوبة
  const summaryStats = React.useMemo(() => {
    if (!filteredOrders || filteredOrders.length === 0) {
      return {
        totalOrders: 0,
        pendingOrders: 0,
        workshopOrders: 0,
        readyForDeliveryOrders: 0,
        totalRevenue: 0,
        totalCost: 0,
        totalShipping: 0,
        netProfit: 0,
        workshopProducts: 0
      };
    }

    let totalRevenue = 0;
    let totalCost = 0;
    let totalShipping = 0;
    let pendingOrders = 0;
    let workshopOrders = 0;
    let readyForDeliveryOrders = 0;
    let workshopProducts = 0;

    filteredOrders.forEach(order => {
      if (order.status === 'pending') {
        pendingOrders++;
      }
      if (order.status === 'sentToPrinter') {
        workshopOrders++;
        // عدد المنتجات في الورشة = مجموع الكميات في الطلبات المرسلة للمطبعة
        workshopProducts += order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      }
      if (order.status === 'readyForDelivery') {
        readyForDeliveryOrders++;
      }
      
      totalRevenue += order.total;
      totalShipping += order.shippingCost || 0;
      
      // Calculate actual costs from items
      const orderCosts = order.items?.reduce((sum, item) => sum + (item.cost * item.quantity), 0) || 0;
      totalCost += orderCosts;
    });

    // Fixed net profit calculation: Revenue - Cost - Shipping
    const netProfit = totalRevenue - totalCost - totalShipping;

    return {
      totalOrders: filteredOrders.length,
      pendingOrders,
      workshopOrders,
      readyForDeliveryOrders,
      totalRevenue,
      totalCost,
      totalShipping,
      netProfit,
      workshopProducts
    };
  }, [filteredOrders]);

  const handleEditOrder = (serial: string) => {
    navigate(`/edit-order/${serial}`);
  };

  const handleViewOrder = (serial: string) => {
    navigate(`/orders/${serial}`);
  };

  const handleDeleteOrder = async (orderIndex: number) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الطلب؟")) {
      await deleteOrder(orderIndex);
    }
  };

  const handleStatusChange = async (orderIndex: number, newStatus: string) => {
    await updateOrderStatus(orderIndex, newStatus as any);
  };

  // Open custom amount dialog
  const openCustomAmountDialog = (type: 'collection' | 'shipping' | 'cost', order: any) => {
    let defaultAmount = 0;
    if (type === 'collection') {
      defaultAmount = order.total - (order.deposit || 0);
    } else if (type === 'shipping') {
      defaultAmount = order.shippingCost || 0;
    } else if (type === 'cost') {
      defaultAmount = order.items?.reduce((sum: number, item: any) => sum + (item.cost * item.quantity), 0) || 0;
    }

    setCustomAmountDialog({
      isOpen: true,
      type,
      order,
      defaultAmount
    });
  };

  // Handle custom amount confirmation
  const handleCustomAmountConfirm = async (amount: number) => {
    const { type, order } = customAmountDialog;
    
    try {
      let description = '';
      let transactionType = '';
      
      if (type === 'collection') {
        transactionType = 'order_collection';
        description = `تحصيل طلب رقم ${order.serial} - العميل: ${order.clientName}`;
      } else if (type === 'shipping') {
        transactionType = 'shipping_payment';
        description = `دفع شحن طلب رقم ${order.serial} - ${order.deliveryMethod}`;
      } else if (type === 'cost') {
        transactionType = 'cost_payment';
        description = `دفع تكلفة طلب رقم ${order.serial} - تكلفة الإنتاج`;
      }

      await addTransaction({
        transaction_type: transactionType,
        amount: amount,
        description: description,
        order_serial: order.serial
      });

      toast.success("تم تسجيل المعاملة بنجاح");
    } catch (error) {
      console.error('Error recording transaction:', error);
      toast.error("حدث خطأ في تسجيل المعاملة");
    }
  };

  // Cancel transaction functions
  const handleCancelTransaction = async (orderSerial: string, transactionType: string) => {
    try {
      const orderTransactions = getTransactionsByOrderSerial(orderSerial);
      const transactionToCancel = orderTransactions.find(t => t.transaction_type === transactionType);
      
      if (transactionToCancel) {
        await deleteTransaction(transactionToCancel.id);
        toast.success("تم إلغاء المعاملة بنجاح");
      }
    } catch (error) {
      console.error('Error canceling transaction:', error);
      toast.error("حدث خطأ في إلغاء المعاملة");
    }
  };

  // Check if transaction exists for an order
  const hasTransaction = (orderSerial: string, transactionType: string) => {
    const orderTransactions = getTransactionsByOrderSerial(orderSerial);
    return orderTransactions.some(t => t.transaction_type === transactionType);
  };

  const clearFilters = () => {
    setFilterMonth("all");
    setFilterYear("all");
    setFilterStatus("all");
    setFilterPaymentMethod("all");
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'shipped': return 'bg-green-100 text-green-800 border-green-300';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'sentToPrinter': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'readyForDelivery': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'في انتظار التأكيد';
      case 'confirmed': return 'تم التأكيد';
      case 'sentToPrinter': return 'تم الإرسال للمطبعة';
      case 'readyForDelivery': return 'تحت التسليم';
      case 'shipped': return 'تم الشحن';
      default: return status;
    }
  };

  const calculateOrderNetProfit = (order: any) => {
    const orderCost = order.items?.reduce((sum: number, item: any) => sum + (item.cost * item.quantity), 0) || 0;
    return order.total - orderCost - (order.shippingCost || 0);
  };

  const getCustomAmountDialogTitle = (type: 'collection' | 'shipping' | 'cost') => {
    switch (type) {
      case 'collection': return 'تحصيل مبلغ من العميل';
      case 'shipping': return 'دفع مصاريف الشحن';
      case 'cost': return 'دفع تكلفة الإنتاج';
      default: return '';
    }
  };

  // Function to truncate text - تقليل النصوص الطويلة
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "غير محدد";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gift-primary border-t-transparent mx-auto"></div>
            <p className={`text-gray-600 dark:text-gray-400 ${isMobile ? "text-sm" : "text-lg"}`}>جاري تحميل الطلبات...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rtl space-y-4" dir="rtl">
      {/* Header - تم تصغير الخط */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-l-blue-500">
        <CardHeader className={`${isMobile ? "pb-2" : "pb-3"}`}>
          <div className="flex items-center gap-2">
            <div className="p-1 bg-blue-500 rounded-lg">
              <Package className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} text-white`} />
            </div>
            <div>
              <CardTitle className={`font-bold text-gray-800 dark:text-white ${isMobile ? "text-xs" : "text-sm"}`}>
                إدارة الطلبات
              </CardTitle>
              {!isMobile && (
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-xs">
                  إدارة وتتبع جميع الطلبات
                </p>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Statistics - مع إضافة البطاقات الجديدة وتصغير الخط */}
      <div className={`grid gap-2 ${isMobile ? "grid-cols-2" : "grid-cols-2 md:grid-cols-8"}`}>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className={`${isMobile ? "p-2" : "p-2"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-blue-100 font-medium ${isMobile ? "text-xs" : "text-xs"}`}>
                  {isMobile ? "الطلبات" : "إجمالي الطلبات"}
                </p>
                <p className={`font-bold ltr-numbers ${isMobile ? "text-sm" : "text-base"}`}>{summaryStats.totalOrders}</p>
              </div>
              <Calendar className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} text-blue-200`} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <CardContent className={`${isMobile ? "p-2" : "p-2"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-yellow-100 font-medium ${isMobile ? "text-xs" : "text-xs"}`}>
                  {isMobile ? "منتظرة" : "طلبات منتظرة"}
                </p>
                <p className={`font-bold ltr-numbers ${isMobile ? "text-sm" : "text-base"}`}>{summaryStats.pendingOrders}</p>
              </div>
              <Clock className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} text-yellow-200`} />
            </div>
          </CardContent>
        </Card>

        {/* بطاقة جديدة: عدد المنتجات في الورشة */}
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className={`${isMobile ? "p-2" : "p-2"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-purple-100 font-medium ${isMobile ? "text-xs" : "text-xs"}`}>
                  {isMobile ? "الورشة" : "منتجات الورشة"}
                </p>
                <p className={`font-bold ltr-numbers ${isMobile ? "text-sm" : "text-base"}`}>{summaryStats.workshopProducts}</p>
              </div>
              <Settings className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} text-purple-200`} />
            </div>
          </CardContent>
        </Card>

        {/* بطاقة جديدة: أوردرات تحت التسليم */}
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className={`${isMobile ? "p-2" : "p-2"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-orange-100 font-medium ${isMobile ? "text-xs" : "text-xs"}`}>
                  {isMobile ? "تحت التسليم" : "تحت التسليم"}
                </p>
                <p className={`font-bold ltr-numbers ${isMobile ? "text-sm" : "text-base"}`}>{summaryStats.readyForDeliveryOrders}</p>
              </div>
              <CheckCircle className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} text-orange-200`} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className={`${isMobile ? "p-2" : "p-2"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-green-100 font-medium ${isMobile ? "text-xs" : "text-xs"}`}>
                  {isMobile ? "المبيعات" : "إجمالي المبيعات"}
                </p>
                <p className={`font-bold ltr-numbers ${isMobile ? "text-xs" : "text-sm"}`}>{formatCurrency(summaryStats.totalRevenue)}</p>
              </div>
              <DollarSign className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} text-green-200`} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className={`${isMobile ? "p-2" : "p-2"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-red-100 font-medium ${isMobile ? "text-xs" : "text-xs"}`}>
                  {isMobile ? "التكلفة" : "إجمالي التكلفة"}
                </p>
                <p className={`font-bold ltr-numbers ${isMobile ? "text-xs" : "text-sm"}`}>{formatCurrency(summaryStats.totalCost)}</p>
              </div>
              <Package className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} text-red-200`} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <CardContent className={`${isMobile ? "p-2" : "p-2"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-indigo-100 font-medium ${isMobile ? "text-xs" : "text-xs"}`}>
                  {isMobile ? "الشحن" : "إجمالي الشحن"}
                </p>
                <p className={`font-bold ltr-numbers ${isMobile ? "text-xs" : "text-sm"}`}>{formatCurrency(summaryStats.totalShipping)}</p>
              </div>
              <Truck className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} text-indigo-200`} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className={`${isMobile ? "p-2" : "p-2"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-emerald-100 font-medium ${isMobile ? "text-xs" : "text-xs"}`}>
                  {isMobile ? "الربح" : "صافي الربح"}
                </p>
                <p className={`font-bold ltr-numbers ${isMobile ? "text-xs" : "text-sm"}`}>{formatCurrency(summaryStats.netProfit)}</p>
              </div>
              <TrendingUp className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} text-emerald-200`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters - تم تصغير الخط */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-l-4 border-l-indigo-500">
        <CardHeader className={`${isMobile ? "pb-1" : "pb-2"}`}>
          <CardTitle className={`${isMobile ? "text-xs" : "text-sm"} flex items-center gap-2`}>
            <Filter className={`${isMobile ? "h-2 w-2" : "h-3 w-3"}`} />
            فلاتر الطلبات
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className={`grid gap-2 ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-5"}`}>
            <div className="space-y-1">
              <Label htmlFor="filterYear" className={`${isMobile ? "text-xs" : "text-xs"}`}>السنة</Label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className={`${isMobile ? "text-xs h-6" : "h-7 text-xs"}`}>
                  <SelectValue placeholder="اختر السنة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع السنوات</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="filterMonth" className={`${isMobile ? "text-xs" : "text-xs"}`}>الشهر</Label>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className={`${isMobile ? "text-xs h-6" : "h-7 text-xs"}`}>
                  <SelectValue placeholder="اختر الشهر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الشهور</SelectItem>
                  <SelectItem value="01">يناير</SelectItem>
                  <SelectItem value="02">فبراير</SelectItem>
                  <SelectItem value="03">مارس</SelectItem>
                  <SelectItem value="04">أبريل</SelectItem>
                  <SelectItem value="05">مايو</SelectItem>
                  <SelectItem value="06">يونيو</SelectItem>
                  <SelectItem value="07">يوليو</SelectItem>
                  <SelectItem value="08">أغسطس</SelectItem>
                  <SelectItem value="09">سبتمبر</SelectItem>
                  <SelectItem value="10">أكتوبر</SelectItem>
                  <SelectItem value="11">نوفمبر</SelectItem>
                  <SelectItem value="12">ديسمبر</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="filterStatus" className={`${isMobile ? "text-xs" : "text-xs"}`}>الحالة</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className={`${isMobile ? "text-xs h-6" : "h-7 text-xs"}`}>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">في انتظار التأكيد</SelectItem>
                  <SelectItem value="confirmed">تم التأكيد</SelectItem>
                  <SelectItem value="sentToPrinter">تم الإرسال للمطبعة</SelectItem>
                  <SelectItem value="readyForDelivery">تحت التسليم</SelectItem>
                  <SelectItem value="shipped">تم الشحن</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filterPaymentMethod" className={`${isMobile ? "text-xs" : "text-xs"}`}>طريقة السداد</Label>
              <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
                <SelectTrigger className={`${isMobile ? "text-xs h-6" : "h-7 text-xs"}`}>
                  <SelectValue placeholder="اختر طريقة السداد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الطرق</SelectItem>
                  <SelectItem value="كاش">كاش</SelectItem>
                  <SelectItem value="فيزا">فيزا</SelectItem>
                  <SelectItem value="تحويل">تحويل</SelectItem>
                  <SelectItem value="آجل">آجل</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={clearFilters}
                variant="outline"
                size="sm"
                className={`w-full flex items-center gap-1 ${isMobile ? "h-6 text-xs" : "h-7 text-xs"}`}
              >
                <RefreshCw className={`${isMobile ? "h-2 w-2" : "h-3 w-3"}`} />
                مسح الفلاتر
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table - تم تصغير الخط */}
      <Card>
        <CardContent className={`${isMobile ? "p-1" : "p-2"}`}>
          <div className="overflow-x-auto">
            <ResponsiveTable className="w-full">
              <ResponsiveTableHead>
                <ResponsiveTableRow className="bg-gray-50 dark:bg-gray-800">
                  <ResponsiveTableHeader className={`font-semibold ${isMobile ? "text-xs" : "text-xs"}`}>رقم الطلب</ResponsiveTableHeader>
                  <ResponsiveTableHeader className={`font-semibold ${isMobile ? "text-xs" : "text-xs"}`}>التاريخ</ResponsiveTableHeader>
                  <ResponsiveTableHeader className={`font-semibold ${isMobile ? "text-xs" : "text-xs"}`}>اسم العميل</ResponsiveTableHeader>
                  {!isMobile && <ResponsiveTableHeader className="font-semibold text-xs">التليفون</ResponsiveTableHeader>}
                  <ResponsiveTableHeader className={`font-semibold ${isMobile ? "text-xs" : "text-xs"}`}>طريقة السداد</ResponsiveTableHeader>
                  <ResponsiveTableHeader className={`font-semibold ${isMobile ? "text-xs" : "text-xs"}`}>طريقة التوصيل</ResponsiveTableHeader>
                  {!isMobile && <ResponsiveTableHeader className="font-semibold text-xs">العنوان</ResponsiveTableHeader>}
                  {!isMobile && <ResponsiveTableHeader className="font-semibold text-xs">المحافظة</ResponsiveTableHeader>}
                  <ResponsiveTableHeader className={`font-semibold ${isMobile ? "text-xs" : "text-xs"}`}>إجمالي الطلب</ResponsiveTableHeader>
                  <ResponsiveTableHeader className={`font-semibold ${isMobile ? "text-xs" : "text-xs"}`}>صافي الربح</ResponsiveTableHeader>
                  <ResponsiveTableHeader className={`font-semibold ${isMobile ? "text-xs" : "text-xs"}`}>الحالة</ResponsiveTableHeader>
                  <ResponsiveTableHeader className={`font-semibold ${isMobile ? "text-xs" : "text-xs"}`}>إجراءات مالية</ResponsiveTableHeader>
                  <ResponsiveTableHeader className={`font-semibold ${isMobile ? "text-xs" : "text-xs"}`}>إجراءات</ResponsiveTableHeader>
                </ResponsiveTableRow>
              </ResponsiveTableHead>
              <ResponsiveTableBody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order, index) => (
                    <ResponsiveTableRow key={order.serial} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <ResponsiveTableCell className={`font-medium text-blue-600 dark:text-blue-400 ${isMobile ? "text-xs" : "text-xs"}`}>{order.serial}</ResponsiveTableCell>
                      <ResponsiveTableCell className={`text-gray-600 dark:text-gray-300 ${isMobile ? "text-xs" : "text-xs"}`}>{new Date(order.dateCreated).toLocaleDateString('ar-EG')}</ResponsiveTableCell>
                      <ResponsiveTableCell className={`font-medium text-gray-800 dark:text-white ${isMobile ? "text-xs" : "text-xs"}`} title={order.clientName}>
                        {truncateText(order.clientName, isMobile ? 6 : 15)}
                      </ResponsiveTableCell>
                      {!isMobile && <ResponsiveTableCell className="text-gray-600 dark:text-gray-300 text-xs">{order.phone}</ResponsiveTableCell>}
                      <ResponsiveTableCell className={`text-gray-600 dark:text-gray-300 ${isMobile ? "text-xs" : "text-xs"}`} title={order.paymentMethod}>
                        {truncateText(order.paymentMethod, isMobile ? 4 : 12)}
                      </ResponsiveTableCell>
                      <ResponsiveTableCell className={`text-gray-600 dark:text-gray-300 ${isMobile ? "text-xs" : "text-xs"}`} title={order.deliveryMethod}>
                        {truncateText(order.deliveryMethod, isMobile ? 4 : 12)}
                      </ResponsiveTableCell>
                      {!isMobile && <ResponsiveTableCell className="text-gray-600 dark:text-gray-300 text-xs" title={order.address}>
                        {truncateText(order.address, 15)}
                      </ResponsiveTableCell>}
                      {!isMobile && <ResponsiveTableCell className="text-gray-600 dark:text-gray-300 text-xs" title={order.governorate}>
                        {truncateText(order.governorate, 10)}
                      </ResponsiveTableCell>}
                      <ResponsiveTableCell className={`text-right font-semibold text-green-600 dark:text-green-400 ltr-numbers ${isMobile ? "text-xs" : "text-xs"}`}>{formatCurrency(order.total)}</ResponsiveTableCell>
                      <ResponsiveTableCell className={`text-right font-semibold text-purple-600 dark:text-purple-400 ltr-numbers ${isMobile ? "text-xs" : "text-xs"}`}>{formatCurrency(calculateOrderNetProfit(order))}</ResponsiveTableCell>
                      <ResponsiveTableCell>
                        <Select value={order.status} onValueChange={(value) => handleStatusChange(index, value)}>
                          <SelectTrigger className={`${isMobile ? "w-16 h-6" : "w-28 h-7"}`}>
                            <SelectValue>
                              <Badge variant="outline" className={`${getStatusBadgeColor(order.status)} ${isMobile ? "text-xs" : "text-xs"}`}>
                                {isMobile ? 
                                  (order.status === 'pending' ? 'منتظر' : 
                                   order.status === 'confirmed' ? 'مؤكد' :
                                   order.status === 'sentToPrinter' ? 'مطبعة' :
                                   order.status === 'readyForDelivery' ? 'تسليم' :
                                   order.status === 'shipped' ? 'شحن' : order.status)
                                  : getStatusLabel(order.status)
                                }
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">في انتظار التأكيد</SelectItem>
                            <SelectItem value="confirmed">تم التأكيد</SelectItem>
                            <SelectItem value="sentToPrinter">تم الإرسال للمطبعة</SelectItem>
                            <SelectItem value="readyForDelivery">تحت التسليم</SelectItem>
                            <SelectItem value="shipped">تم الشحن</SelectItem>
                          </SelectContent>
                        </Select>
                      </ResponsiveTableCell>
                      <ResponsiveTableCell>
                        <div className="flex flex-col gap-1">
                          {!hasTransaction(order.serial, 'order_collection') ? (
                            <Button
                              size="sm"
                              onClick={() => openCustomAmountDialog('collection', order)}
                              className={`bg-green-600 hover:bg-green-700 text-white ${isMobile ? "h-5 text-xs" : "h-6 text-xs"}`}
                            >
                              <DollarSign className={`${isMobile ? "h-2 w-2" : "h-3 w-3"} mr-1`} />
                              {isMobile ? "تحصيل" : "تحصيل"}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancelTransaction(order.serial, 'order_collection')}
                              className={`bg-red-600 hover:bg-red-700 ${isMobile ? "h-5 text-xs" : "h-6 text-xs"}`}
                            >
                              <X className={`${isMobile ? "h-2 w-2" : "h-3 w-3"} mr-1`} />
                              {isMobile ? "إلغاء" : "إلغاء التحصيل"}
                            </Button>
                          )}
                          
                          {!hasTransaction(order.serial, 'shipping_payment') ? (
                            <Button
                              size="sm"
                              onClick={() => openCustomAmountDialog('shipping', order)}
                              className={`bg-blue-600 hover:bg-blue-700 text-white ${isMobile ? "h-5 text-xs" : "h-6 text-xs"}`}
                            >
                              <Truck className={`${isMobile ? "h-2 w-2" : "h-3 w-3"} mr-1`} />
                              {isMobile ? "شحن" : "دفع شحن"}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancelTransaction(order.serial, 'shipping_payment')}
                              className={`bg-red-600 hover:bg-red-700 ${isMobile ? "h-5 text-xs" : "h-6 text-xs"}`}
                            >
                              <X className={`${isMobile ? "h-2 w-2" : "h-3 w-3"} mr-1`} />
                              {isMobile ? "إلغاء" : "إلغاء الشحن"}
                            </Button>
                          )}
                          
                          {!hasTransaction(order.serial, 'cost_payment') ? (
                            <Button
                              size="sm"
                              onClick={() => openCustomAmountDialog('cost', order)}
                              className={`bg-orange-600 hover:bg-orange-700 text-white ${isMobile ? "h-5 text-xs" : "h-6 text-xs"}`}
                            >
                              <CreditCard className={`${isMobile ? "h-2 w-2" : "h-3 w-3"} mr-1`} />
                              {isMobile ? "تكلفة" : "دفع تكلفة"}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancelTransaction(order.serial, 'cost_payment')}
                              className={`bg-red-600 hover:bg-red-700 ${isMobile ? "h-5 text-xs" : "h-6 text-xs"}`}
                            >
                              <X className={`${isMobile ? "h-2 w-2" : "h-3 w-3"} mr-1`} />
                              {isMobile ? "إلغاء" : "إلغاء التكلفة"}
                            </Button>
                          )}
                        </div>
                      </ResponsiveTableCell>
                      <ResponsiveTableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleViewOrder(order.serial)}
                            className={`bg-blue-500 hover:bg-blue-600 text-white ${isMobile ? "h-5 text-xs" : "h-6 text-xs"}`}
                          >
                            <Eye className={`${isMobile ? "h-2 w-2" : "h-3 w-3"} mr-1`} />
                            {isMobile ? "عرض" : "عرض"}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleEditOrder(order.serial)}
                            className={`bg-green-500 hover:bg-green-600 text-white ${isMobile ? "h-5 text-xs" : "h-6 text-xs"}`}
                          >
                            <Edit className={`${isMobile ? "h-2 w-2" : "h-3 w-3"} mr-1`} />
                            {isMobile ? "تعديل" : "تعديل"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteOrder(index)}
                            className={`${isMobile ? "h-5 text-xs" : "h-6 text-xs"}`}
                          >
                            <Trash2 className={`${isMobile ? "h-2 w-2" : "h-3 w-3"} mr-1`} />
                            {isMobile ? "حذف" : "حذف"}
                          </Button>
                        </div>
                      </ResponsiveTableCell>
                    </ResponsiveTableRow>
                  ))
                ) : (
                  <ResponsiveTableRow>
                    <ResponsiveTableCell colSpan={isMobile ? 10 : 13} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Package className={`${isMobile ? "h-8 w-8" : "h-12 w-12"} text-gray-400`} />
                        <p className={`text-gray-500 ${isMobile ? "text-sm" : "text-lg"}`}>لا توجد طلبات متاحة</p>
                      </div>
                    </ResponsiveTableCell>
                  </ResponsiveTableRow>
                )}
              </ResponsiveTableBody>
            </ResponsiveTable>
          </div>
        </CardContent>
      </Card>

      {/* Custom Amount Dialog */}
      <CustomAmountDialog
        isOpen={customAmountDialog.isOpen}
        onClose={() => setCustomAmountDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleCustomAmountConfirm}
        title={getCustomAmountDialogTitle(customAmountDialog.type)}
        defaultAmount={customAmountDialog.defaultAmount}
      />
    </div>
  );
};

export default OrdersTable;
