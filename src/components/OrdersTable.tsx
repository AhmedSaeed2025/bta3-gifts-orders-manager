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
import { supabase } from "@/integrations/supabase/client";
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
  X
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

  // Calculate summary statistics
  const summaryStats = React.useMemo(() => {
    if (!filteredOrders || filteredOrders.length === 0) {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        totalCost: 0,
        totalShipping: 0,
        netProfit: 0
      };
    }

    let totalRevenue = 0;
    let totalCost = 0;
    let totalShipping = 0;

    filteredOrders.forEach(order => {
      totalRevenue += order.total;
      totalShipping += order.shippingCost || 0;
      
      // Calculate total cost for this order
      const orderCost = order.items?.reduce((sum, item) => sum + (item.cost * item.quantity), 0) || 0;
      totalCost += orderCost;
    });

    // Corrected net profit calculation: Revenue - Cost - Shipping
    const netProfit = totalRevenue - totalCost - totalShipping;

    return {
      totalOrders: filteredOrders.length,
      totalRevenue,
      totalCost,
      totalShipping,
      netProfit
    };
  }, [filteredOrders]);

  const handleEditOrder = (serial: string) => {
    navigate(`/edit-order/${serial}`);
  };

  const handleViewOrder = (serial: string) => {
    navigate(`/orders/${serial}`);
  };

  const handleDeleteOrder = async (index: number) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الطلب؟")) {
      await deleteOrder(index);
    }
  };

  const handleStatusChange = async (index: number, newStatus: string) => {
    await updateOrderStatus(index, newStatus as any);
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
    // Corrected calculation: Revenue - Cost - Shipping
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
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-gray-800 dark:text-white`}>
                إدارة الطلبات
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                إدارة وتتبع جميع الطلبات مع إمكانية التعديل والحذف
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium">إجمالي الطلبات</p>
                <p className={`${isMobile ? "text-lg" : "text-2xl"} font-bold`} style={{ direction: 'ltr' }}>{summaryStats.totalOrders}</p>
              </div>
              <Calendar className="h-6 w-6 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs font-medium">إجمالي المبيعات</p>
                <p className={`${isMobile ? "text-sm" : "text-lg"} font-bold`} style={{ direction: 'ltr' }}>{formatCurrency(summaryStats.totalRevenue)}</p>
              </div>
              <DollarSign className="h-6 w-6 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-xs font-medium">إجمالي التكلفة</p>
                <p className={`${isMobile ? "text-sm" : "text-lg"} font-bold`} style={{ direction: 'ltr' }}>{formatCurrency(summaryStats.totalCost)}</p>
              </div>
              <Package className="h-6 w-6 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-xs font-medium">إجمالي الشحن</p>
                <p className={`${isMobile ? "text-sm" : "text-lg"} font-bold`} style={{ direction: 'ltr' }}>{formatCurrency(summaryStats.totalShipping)}</p>
              </div>
              <Truck className="h-6 w-6 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs font-medium">صافي الربح</p>
                <p className={`${isMobile ? "text-sm" : "text-lg"} font-bold`} style={{ direction: 'ltr' }}>{formatCurrency(summaryStats.netProfit)}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-l-4 border-l-indigo-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            فلاتر الطلبات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-5"}`}>
            <div className="space-y-2">
              <Label htmlFor="filterYear">السنة</Label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger>
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
            
            <div className="space-y-2">
              <Label htmlFor="filterMonth">الشهر</Label>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger>
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
            
            <div className="space-y-2">
              <Label htmlFor="filterStatus">الحالة</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label htmlFor="filterPaymentMethod">طريقة السداد</Label>
              <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
                <SelectTrigger>
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
                className="w-full flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                مسح الفلاتر
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className={`${isMobile ? "p-2" : "p-6"}`}>
          <div className="overflow-x-auto">
            <ResponsiveTable className="w-full">
              <ResponsiveTableHead>
                <ResponsiveTableRow className="bg-gray-50 dark:bg-gray-800">
                  <ResponsiveTableHeader className="font-semibold">رقم الطلب</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold">التاريخ</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold">العميل</ResponsiveTableHeader>
                  {!isMobile && <ResponsiveTableHeader className="font-semibold">التليفون</ResponsiveTableHeader>}
                  <ResponsiveTableHeader className="font-semibold">طريقة السداد</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold">قيمة الطلب</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold">صافي الربح</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold">الحالة</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold">إجراءات</ResponsiveTableHeader>
                </ResponsiveTableRow>
              </ResponsiveTableHead>
              <ResponsiveTableBody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order, index) => (
                    <ResponsiveTableRow key={order.serial} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <ResponsiveTableCell className="font-medium text-blue-600 dark:text-blue-400">
                        <div className="ltr-numbers">{order.serial}</div>
                      </ResponsiveTableCell>
                      <ResponsiveTableCell className="text-gray-600 dark:text-gray-300">
                        <div className="ltr-numbers">{new Date(order.dateCreated).toLocaleDateString('en-US')}</div>
                      </ResponsiveTableCell>
                      <ResponsiveTableCell className="font-medium">{order.clientName}</ResponsiveTableCell>
                      {!isMobile && (
                        <ResponsiveTableCell className="text-gray-600 dark:text-gray-300">
                          <div className="ltr-numbers">{order.phone}</div>
                        </ResponsiveTableCell>
                      )}
                      <ResponsiveTableCell>
                        <Badge variant="outline" className="text-xs">
                          {order.paymentMethod}
                        </Badge>
                      </ResponsiveTableCell>
                      <ResponsiveTableCell className="text-right font-semibold text-green-600 dark:text-green-400">
                        <div className="ltr-numbers">{formatCurrency(order.total)}</div>
                      </ResponsiveTableCell>
                      <ResponsiveTableCell className="text-right font-semibold text-purple-600 dark:text-purple-400">
                        <div className="ltr-numbers">{formatCurrency(calculateOrderNetProfit(order))}</div>
                      </ResponsiveTableCell>
                      <ResponsiveTableCell>
                        <div className="flex flex-col gap-2">
                          <Select
                            value={order.status}
                            onValueChange={(value) => handleStatusChange(index, value)}
                          >
                            <SelectTrigger className="w-auto min-w-32">
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
                          <Badge className={`text-xs ${getStatusBadgeColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </div>
                      </ResponsiveTableCell>
                      <ResponsiveTableCell>
                        <div className="flex flex-col gap-2 min-w-max">
                          {/* Action Buttons */}
                          <div className="flex gap-1">
                            <Button
                              onClick={() => handleEditOrder(order.serial)}
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 text-xs"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={() => handleViewOrder(order.serial)}
                              size="sm"
                              variant="outline"
                              className="px-2 py-1 text-xs"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteOrder(index)}
                              size="sm"
                              variant="destructive"
                              className="px-2 py-1 text-xs"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          {/* Financial Actions */}
                          <div className="flex flex-col gap-1">
                            {/* Collection Action */}
                            {!hasTransaction(order.serial, 'order_collection') ? (
                              <Button
                                onClick={() => openCustomAmountDialog('collection', order)}
                                size="sm"
                                className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 text-xs flex items-center gap-1"
                              >
                                <CreditCard className="h-3 w-3" />
                                تحصيل
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handleCancelTransaction(order.serial, 'order_collection')}
                                size="sm"
                                variant="outline"
                                className="border-green-500 text-green-500 hover:bg-green-50 px-2 py-1 text-xs flex items-center gap-1"
                              >
                                <X className="h-3 w-3" />
                                إلغاء تحصيل
                              </Button>
                            )}
                            
                            {/* Shipping Payment Action */}
                            {!hasTransaction(order.serial, 'shipping_payment') ? (
                              <Button
                                onClick={() => openCustomAmountDialog('shipping', order)}
                                size="sm"
                                className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 text-xs flex items-center gap-1"
                              >
                                <Truck className="h-3 w-3" />
                                شحن
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handleCancelTransaction(order.serial, 'shipping_payment')}
                                size="sm"
                                variant="outline"
                                className="border-orange-500 text-orange-500 hover:bg-orange-50 px-2 py-1 text-xs flex items-center gap-1"
                              >
                                <X className="h-3 w-3" />
                                إلغاء شحن
                              </Button>
                            )}
                            
                            {/* Cost Payment Action */}
                            {!hasTransaction(order.serial, 'cost_payment') ? (
                              <Button
                                onClick={() => openCustomAmountDialog('cost', order)}
                                size="sm"
                                className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 text-xs flex items-center gap-1"
                              >
                                <Package className="h-3 w-3" />
                                تكلفة
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handleCancelTransaction(order.serial, 'cost_payment')}
                                size="sm"
                                variant="outline"
                                className="border-red-500 text-red-500 hover:bg-red-50 px-2 py-1 text-xs flex items-center gap-1"
                              >
                                <X className="h-3 w-3" />
                                إلغاء تكلفة
                              </Button>
                            )}
                          </div>
                        </div>
                      </ResponsiveTableCell>
                    </ResponsiveTableRow>
                  ))
                ) : (
                  <ResponsiveTableRow>
                    <ResponsiveTableCell colSpan={isMobile ? 7 : 9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-12 w-12 text-gray-400" />
                        <p className="text-gray-500 text-lg">لا توجد طلبات متاحة</p>
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
