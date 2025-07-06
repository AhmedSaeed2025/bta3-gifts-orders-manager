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
  CheckCircle,
  User,
  Phone,
  MapPin,
  FileText
} from "lucide-react";
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
      
      return true;
    });
  }, [safeOrders, filterMonth, filterYear, filterStatus]);

  // Calculate summary statistics
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
        workshopProducts += order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      }
      if (order.status === 'readyForDelivery') {
        readyForDeliveryOrders++;
      }
      
      totalRevenue += order.total;
      totalShipping += order.shippingCost || 0;
      
      const orderCosts = order.items?.reduce((sum, item) => sum + (item.cost * item.quantity), 0) || 0;
      totalCost += orderCosts;
    });

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

  const hasTransaction = (orderSerial: string, transactionType: string) => {
    const orderTransactions = getTransactionsByOrderSerial(orderSerial);
    return orderTransactions.some(t => t.transaction_type === transactionType);
  };

  const clearFilters = () => {
    setFilterMonth("all");
    setFilterYear("all");
    setFilterStatus("all");
  };

  // Handle status filter from summary cards
  const handleStatusFilter = (status: string) => {
    setFilterStatus(status);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'shipped': return 'bg-green-500 text-white hover:bg-green-600';
      case 'confirmed': return 'bg-blue-500 text-white hover:bg-blue-600';
      case 'pending': return 'bg-yellow-500 text-white hover:bg-yellow-600';
      case 'sentToPrinter': return 'bg-purple-500 text-white hover:bg-purple-600';
      case 'readyForDelivery': return 'bg-orange-500 text-white hover:bg-orange-600';
      default: return 'bg-gray-500 text-white hover:bg-gray-600';
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

  const calculateOrderCost = (order: any) => {
    return order.items?.reduce((sum: number, item: any) => sum + (item.cost * item.quantity), 0) || 0;
  };

  const getCustomAmountDialogTitle = (type: 'collection' | 'shipping' | 'cost') => {
    switch (type) {
      case 'collection': return 'تحصيل مبلغ من العميل';
      case 'shipping': return 'دفع مصاريف الشحن';
      case 'cost': return 'دفع تكلفة الإنتاج';
      default: return '';
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "غير محدد";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gift-accent dark:bg-gray-900 p-4">
        <Card className="max-w-md mx-auto mt-20 shadow-xl">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gift-primary border-t-transparent mx-auto"></div>
                <Package className="h-6 w-6 text-gift-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">جاري تحميل الطلبات...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 min-h-screen p-3" dir="rtl">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-lg border-0">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-white">
                إدارة الطلبات
              </CardTitle>
              <p className="text-blue-100 mt-1 text-sm">
                إدارة وتتبع جميع الطلبات بشكل احترافي
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Statistics */}
      <div className={`grid gap-3 ${isMobile ? "grid-cols-2" : "grid-cols-4 md:grid-cols-8"}`}>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-300">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 font-medium text-xs mb-1">
                  {isMobile ? "الطلبات" : "إجمالي الطلبات"}
                </p>
                <p className="text-lg font-bold">{summaryStats.totalOrders}</p>
              </div>
              <Calendar className="h-6 w-6 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
          onClick={() => handleStatusFilter('pending')}
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 font-medium text-xs mb-1">
                  {isMobile ? "منتظرة" : "طلبات منتظرة"}
                </p>
                <p className="text-lg font-bold">{summaryStats.pendingOrders}</p>
              </div>
              <Clock className="h-6 w-6 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
          onClick={() => handleStatusFilter('sentToPrinter')}
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 font-medium text-xs mb-1">
                  {isMobile ? "الورشة" : "منتجات الورشة"}
                </p>
                <p className="text-lg font-bold">{summaryStats.workshopProducts}</p>
              </div>
              <Settings className="h-6 w-6 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
          onClick={() => handleStatusFilter('readyForDelivery')}
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 font-medium text-xs mb-1">
                  {isMobile ? "تحت التسليم" : "تحت التسليم"}
                </p>
                <p className="text-lg font-bold">{summaryStats.readyForDeliveryOrders}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md hover:shadow-lg transition-all duration-300">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 font-medium text-xs mb-1">
                  {isMobile ? "المبيعات" : "إجمالي المبيعات"}
                </p>
                <p className="text-sm font-bold">{formatCurrency(summaryStats.totalRevenue)}</p>
              </div>
              <DollarSign className="h-6 w-6 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md hover:shadow-lg transition-all duration-300">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 font-medium text-xs mb-1">
                  {isMobile ? "التكلفة" : "إجمالي التكلفة"}
                </p>
                <p className="text-sm font-bold">{formatCurrency(summaryStats.totalCost)}</p>
              </div>
              <Package className="h-6 w-6 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all duration-300">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 font-medium text-xs mb-1">
                  {isMobile ? "الشحن" : "إجمالي الشحن"}
                </p>
                <p className="text-sm font-bold">{formatCurrency(summaryStats.totalShipping)}</p>
              </div>
              <Truck className="h-6 w-6 text-indigo-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md hover:shadow-lg transition-all duration-300">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 font-medium text-xs mb-1">
                  {isMobile ? "الربح" : "صافي الربح"}
                </p>
                <p className="text-sm font-bold">{formatCurrency(summaryStats.netProfit)}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-emerald-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-gray-800">
            <div className="p-1.5 bg-indigo-500 rounded-lg">
              <Filter className="h-4 w-4 text-white" />
            </div>
            فلاتر الطلبات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-2 md:grid-cols-4"}`}>
            <div className="space-y-1.5">
              <Label htmlFor="filterYear" className="text-xs font-medium text-gray-700">السنة</Label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="h-8 text-xs">
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
            
            <div className="space-y-1.5">
              <Label htmlFor="filterMonth" className="text-xs font-medium text-gray-700">الشهر</Label>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="h-8 text-xs">
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
            
            <div className="space-y-1.5">
              <Label htmlFor="filterStatus" className="text-xs font-medium text-gray-700">الحالة</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 text-xs">
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
            
            <div className="flex items-end">
              <Button 
                onClick={clearFilters}
                variant="outline"
                className="w-full h-8 flex items-center gap-1.5 text-xs"
              >
                <RefreshCw className="h-3 w-3" />
                مسح الفلاتر
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Display */}
      {isMobile ? (
        // Mobile Card Layout
        <div className="space-y-3">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order, index) => (
              <Card key={order.serial} className="bg-white shadow-md hover:shadow-lg transition-all duration-300">
                <CardContent className="p-3">
                  <div className="space-y-2.5">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3 w-3 text-blue-500" />
                        <span className="font-bold text-blue-600 text-sm">#{order.serial}</span>
                      </div>
                      <Badge className={`${getStatusBadgeColor(order.status)} text-xs px-2 py-0.5`}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-gray-50 rounded-lg p-2.5 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3 text-gray-600" />
                        <span className="font-medium text-gray-800 text-sm">{order.clientName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-gray-600" />
                        <span className="text-gray-600 text-xs">{order.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-gray-600" />
                        <span className="text-gray-600 text-xs">{truncateText(order.address, 25)}</span>
                      </div>
                    </div>

                    {/* Financial Info - Updated to show 3 columns with profit */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-green-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-green-600 font-medium">إجمالي الطلب</p>
                        <p className="text-xs font-bold text-green-700">{formatCurrency(order.total)}</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-red-600 font-medium">تكلفة الطلب</p>
                        <p className="text-xs font-bold text-red-700">{formatCurrency(calculateOrderCost(order))}</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-purple-600 font-medium">ربح الطلب</p>
                        <p className="text-xs font-bold text-purple-700">{formatCurrency(calculateOrderNetProfit(order))}</p>
                      </div>
                    </div>

                    {/* Status Change */}
                    <Select value={order.status} onValueChange={(value) => handleStatusChange(index, value)}>
                      <SelectTrigger className="w-full h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">في انتظار التأكيد</SelectItem>
                        <SelectItem value="confirmed">تم التأكيد</SelectItem>
                        <SelectItem value="sentToPrinter">تم الإرسال للمطبعة</SelectItem>
                        <SelectItem value="readyForDelivery">تحت التسليم</SelectItem>
                        <SelectItem value="shipped">تم الشحن</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Financial Actions */}
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs font-medium text-gray-700 mb-2">الإجراءات المالية</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {!hasTransaction(order.serial, 'order_collection') ? (
                          <Button
                            size="sm"
                            onClick={() => openCustomAmountDialog('collection', order)}
                            className="bg-green-600 hover:bg-green-700 text-white h-6 text-xs px-1"
                            title="تحصيل من العميل"
                          >
                            <DollarSign className="h-3 w-3" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancelTransaction(order.serial, 'order_collection')}
                            className="h-6 text-xs px-1"
                            title="إلغاء التحصيل"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                        
                        {!hasTransaction(order.serial, 'shipping_payment') ? (
                          <Button
                            size="sm"
                            onClick={() => openCustomAmountDialog('shipping', order)}
                            className="bg-blue-600 hover:bg-blue-700 text-white h-6 text-xs px-1"
                            title="دفع شحن"
                          >
                            <Truck className="h-3 w-3" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancelTransaction(order.serial, 'shipping_payment')}
                            className="h-6 text-xs px-1"
                            title="إلغاء الشحن"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                        
                        {!hasTransaction(order.serial, 'cost_payment') ? (
                          <Button
                            size="sm"
                            onClick={() => openCustomAmountDialog('cost', order)}
                            className="bg-orange-600 hover:bg-orange-700 text-white h-6 text-xs px-1"
                            title="دفع تكلفة"
                          >
                            <CreditCard className="h-3 w-3" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancelTransaction(order.serial, 'cost_payment')}
                            className="h-6 text-xs px-1"
                            title="إلغاء التكلفة"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1.5 pt-2 border-t">
                      <Button
                        size="sm"
                        onClick={() => handleViewOrder(order.serial)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white h-8 text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        عرض
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleEditOrder(order.serial)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white h-8 text-xs"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        تعديل
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteOrder(index)}
                        className="h-8 px-2"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-white shadow-md">
              <CardContent className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">لا توجد طلبات متاحة</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        // Desktop Table Layout
        <Card className="bg-white shadow-md">
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-right p-2 font-semibold text-gray-700">رقم الطلب</th>
                    <th className="text-right p-2 font-semibold text-gray-700">التاريخ</th>
                    <th className="text-right p-2 font-semibold text-gray-700">اسم العميل</th>
                    <th className="text-right p-2 font-semibold text-gray-700">التليفون</th>
                    <th className="text-right p-2 font-semibold text-gray-700">طريقة التوصيل</th>
                    <th className="text-right p-2 font-semibold text-gray-700">العنوان</th>
                    <th className="text-right p-2 font-semibold text-gray-700">المحافظة</th>
                    <th className="text-right p-2 font-semibold text-gray-700">إجمالي الطلب</th>
                    <th className="text-right p-2 font-semibold text-gray-700">تكلفة الطلب</th>
                    <th className="text-right p-2 font-semibold text-gray-700">صافي الربح</th>
                    <th className="text-center p-2 font-semibold text-gray-700">الحالة</th>
                    <th className="text-center p-2 font-semibold text-gray-700">إجراءات مالية</th>
                    <th className="text-center p-2 font-semibold text-gray-700">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order, index) => (
                      <tr key={order.serial} className="border-b border-gray-100 hover:bg-blue-50 transition-colors duration-200">
                        <td className="p-2 font-medium text-blue-600">{order.serial}</td>
                        <td className="p-2 text-gray-600">{new Date(order.dateCreated).toLocaleDateString('ar-EG')}</td>
                        <td className="p-2 font-medium text-gray-800" title={order.clientName}>
                          {truncateText(order.clientName, 12)}
                        </td>
                        <td className="p-2 text-gray-600">{order.phone}</td>
                        <td className="p-2 text-gray-600" title={order.deliveryMethod}>
                          {truncateText(order.deliveryMethod, 10)}
                        </td>
                        <td className="p-2 text-gray-600" title={order.address}>
                          {truncateText(order.address, 15)}
                        </td>
                        <td className="p-2 text-gray-600" title={order.governorate}>
                          {truncateText(order.governorate, 8)}
                        </td>
                        <td className="p-2 text-right font-semibold text-green-600">{formatCurrency(order.total)}</td>
                        <td className="p-2 text-right font-semibold text-red-600">{formatCurrency(calculateOrderCost(order))}</td>
                        <td className="p-2 text-right font-semibold text-purple-600">{formatCurrency(calculateOrderNetProfit(order))}</td>
                        <td className="p-2 text-center">
                          <Select value={order.status} onValueChange={(value) => handleStatusChange(index, value)}>
                            <SelectTrigger className="w-24 h-7 text-xs">
                              <SelectValue>
                                <Badge className={`${getStatusBadgeColor(order.status)} text-xs px-1 py-0.5`}>
                                  {getStatusLabel(order.status)}
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
                        </td>
                        <td className="p-2">
                          <div className="bg-gray-50 rounded-lg p-1.5 space-y-1">
                            <div className="grid grid-cols-3 gap-1">
                              {!hasTransaction(order.serial, 'order_collection') ? (
                                <Button
                                  size="sm"
                                  onClick={() => openCustomAmountDialog('collection', order)}
                                  className="bg-green-600 hover:bg-green-700 text-white h-6 text-xs px-1"
                                  title="تحصيل من العميل"
                                >
                                  <DollarSign className="h-3 w-3" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleCancelTransaction(order.serial, 'order_collection')}
                                  className="h-6 text-xs px-1"
                                  title="إلغاء التحصيل"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                              
                              {!hasTransaction(order.serial, 'shipping_payment') ? (
                                <Button
                                  size="sm"
                                  onClick={() => openCustomAmountDialog('shipping', order)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white h-6 text-xs px-1"
                                  title="دفع شحن"
                                >
                                  <Truck className="h-3 w-3" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleCancelTransaction(order.serial, 'shipping_payment')}
                                  className="h-6 text-xs px-1"
                                  title="إلغاء الشحن"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                              
                              {!hasTransaction(order.serial, 'cost_payment') ? (
                                <Button
                                  size="sm"
                                  onClick={() => openCustomAmountDialog('cost', order)}
                                  className="bg-orange-600 hover:bg-orange-700 text-white h-6 text-xs px-1"
                                  title="دفع تكلفة"
                                >
                                  <CreditCard className="h-3 w-3" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleCancelTransaction(order.serial, 'cost_payment')}
                                  className="h-6 text-xs px-1"
                                  title="إلغاء التكلفة"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => handleViewOrder(order.serial)}
                              className="bg-blue-500 hover:bg-blue-600 text-white h-6 text-xs px-1"
                              title="عرض الطلب"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleEditOrder(order.serial)}
                              className="bg-green-500 hover:bg-green-600 text-white h-6 text-xs px-1"
                              title="تعديل الطلب"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteOrder(index)}
                              className="h-6 px-1"
                              title="حذف الطلب"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={13} className="text-center py-8">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">لا توجد طلبات متاحة</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

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
