
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Banknote, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Truck, 
  Package,
  Calculator,
  FileText,
  Activity
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  ResponsiveTable, 
  ResponsiveTableHead, 
  ResponsiveTableBody, 
  ResponsiveTableRow, 
  ResponsiveTableHeader, 
  ResponsiveTableCell 
} from "@/components/ui/responsive-table";

interface Transaction {
  id: string;
  order_serial: string;
  transaction_type: string;
  amount: number;
  description: string;
  created_at: string;
}

const AccountStatement = () => {
  const { orders, loading } = useSupabaseOrders();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const safeOrders = Array.isArray(orders) ? orders : [];

  // Get available years for filter
  const availableYears = React.useMemo(() => {
    const years = new Set<string>();
    safeOrders.forEach(order => {
      const year = new Date(order.dateCreated).getFullYear().toString();
      years.add(year);
    });
    transactions.forEach(transaction => {
      const year = new Date(transaction.created_at).getFullYear().toString();
      years.add(year);
    });
    return Array.from(years).sort().reverse();
  }, [safeOrders, transactions]);

  // Load transactions
  const loadTransactions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [user]);

  // Filter transactions
  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.created_at);
      const transactionYear = transactionDate.getFullYear().toString();
      const transactionMonth = (transactionDate.getMonth() + 1).toString().padStart(2, '0');
      
      if (filterYear !== "all" && transactionYear !== filterYear) return false;
      if (filterMonth !== "all" && transactionMonth !== filterMonth) return false;
      if (filterType !== "all" && transaction.transaction_type !== filterType) return false;
      
      return true;
    });
  }, [transactions, filterMonth, filterYear, filterType]);

  // Calculate comprehensive statistics
  const accountSummary = React.useMemo(() => {
    const totalRevenue = filteredTransactions
      .filter(t => t.transaction_type === 'order_collection')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalShippingPaid = filteredTransactions
      .filter(t => t.transaction_type === 'shipping_payment')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalCostPaid = filteredTransactions
      .filter(t => t.transaction_type === 'cost_payment')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate unpaid costs from all orders
    let totalUnpaidCosts = 0;
    let totalOrderCosts = 0;
    let totalOrderRevenue = 0;
    let totalShippingCosts = 0;

    safeOrders.forEach(order => {
      const orderCost = order.items?.reduce((sum, item) => sum + (item.cost * item.quantity), 0) || 0;
      totalOrderCosts += orderCost;
      totalOrderRevenue += order.total;
      totalShippingCosts += order.shippingCost || 0;

      // Check if cost has been paid for this order
      const costPaid = transactions.some(t => 
        t.order_serial === order.serial && t.transaction_type === 'cost_payment'
      );
      
      if (!costPaid) {
        totalUnpaidCosts += orderCost;
      }
    });

    const netProfit = totalRevenue - totalCostPaid - totalShippingPaid;
    const totalOrders = safeOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalOrderRevenue / totalOrders : 0;

    return {
      totalRevenue,
      totalShippingPaid,
      totalCostPaid,
      totalUnpaidCosts,
      netProfit,
      totalOrders,
      totalOrderRevenue,
      totalShippingCosts,
      totalOrderCosts,
      avgOrderValue,
      cashFlow: totalRevenue - totalCostPaid - totalShippingPaid
    };
  }, [filteredTransactions, safeOrders, transactions]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'order_collection':
        return <DollarSign className="h-4 w-4" />;
      case 'shipping_payment':
        return <Truck className="h-4 w-4" />;
      case 'cost_payment':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'order_collection':
        return 'تحصيل طلب';
      case 'shipping_payment':
        return 'دفع شحن';
      case 'cost_payment':
        return 'دفع تكلفة';
      default:
        return type;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'order_collection':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'shipping_payment':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cost_payment':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gift-primary border-t-transparent mx-auto"></div>
            <p className="text-lg text-gray-600 dark:text-gray-400">جاري تحميل كشف الحساب...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rtl space-y-6" style={{ direction: 'rtl' }}>
      {/* Header */}
      <Card className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-l-4 border-l-emerald-500">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-lg">
              <Banknote className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-gray-800 dark:text-white`}>
                كشف الحساب التفصيلي
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                تقرير شامل للمعاملات المالية والإحصائيات
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs font-medium">إجمالي التحصيل</p>
                <p className={`${isMobile ? "text-sm" : "text-lg"} font-bold`}>{formatCurrency(accountSummary.totalRevenue)}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-xs font-medium">التكلفة غير المسددة</p>
                <p className={`${isMobile ? "text-sm" : "text-lg"} font-bold`}>{formatCurrency(accountSummary.totalUnpaidCosts)}</p>
              </div>
              <TrendingDown className="h-6 w-6 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium">إجمالي الطلبات</p>
                <p className={`${isMobile ? "text-lg" : "text-2xl"} font-bold`}>{accountSummary.totalOrders}</p>
              </div>
              <Package className="h-6 w-6 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs font-medium">صافي الربح</p>
                <p className={`${isMobile ? "text-sm" : "text-lg"} font-bold`}>{formatCurrency(accountSummary.netProfit)}</p>
              </div>
              <Calculator className="h-6 w-6 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-xs font-medium">إجمالي الشحن</p>
                <p className={`${isMobile ? "text-sm" : "text-lg"} font-bold`}>{formatCurrency(accountSummary.totalShippingCosts)}</p>
              </div>
              <Truck className="h-6 w-6 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-xs font-medium">إجمالي المبيعات</p>
                <p className={`${isMobile ? "text-sm" : "text-lg"} font-bold`}>{formatCurrency(accountSummary.totalOrderRevenue)}</p>
              </div>
              <FileText className="h-6 w-6 text-indigo-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-xs font-medium">متوسط قيمة الطلب</p>
                <p className={`${isMobile ? "text-sm" : "text-lg"} font-bold`}>{formatCurrency(accountSummary.avgOrderValue)}</p>
              </div>
              <Activity className="h-6 w-6 text-teal-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-xs font-medium">التدفق النقدي</p>
                <p className={`${isMobile ? "text-sm" : "text-lg"} font-bold`}>{formatCurrency(accountSummary.cashFlow)}</p>
              </div>
              <Banknote className="h-6 w-6 text-emerald-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-l-4 border-l-gray-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">فلاتر كشف الحساب</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-4"}`}>
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
              <Label htmlFor="filterType">نوع المعاملة</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المعاملات</SelectItem>
                  <SelectItem value="order_collection">تحصيل طلب</SelectItem>
                  <SelectItem value="shipping_payment">دفع شحن</SelectItem>
                  <SelectItem value="cost_payment">دفع تكلفة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent className={`${isMobile ? "p-2" : "p-6"}`}>
          <div className="overflow-x-auto">
            <ResponsiveTable className="w-full">
              <ResponsiveTableHead>
                <ResponsiveTableRow className="bg-gray-50 dark:bg-gray-800">
                  <ResponsiveTableHeader className="font-semibold">التاريخ</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold">رقم الطلب</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold">نوع المعاملة</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold">الوصف</ResponsiveTableHeader>
                  <ResponsiveTableHeader className="font-semibold">المبلغ</ResponsiveTableHeader>
                </ResponsiveTableRow>
              </ResponsiveTableHead>
              <ResponsiveTableBody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <ResponsiveTableRow key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <ResponsiveTableCell className="text-gray-600 dark:text-gray-300">
                        {new Date(transaction.created_at).toLocaleDateString('ar-EG')}
                      </ResponsiveTableCell>
                      <ResponsiveTableCell className="font-medium text-blue-600 dark:text-blue-400">
                        {transaction.order_serial}
                      </ResponsiveTableCell>
                      <ResponsiveTableCell>
                        <Badge variant="outline" className={getTransactionColor(transaction.transaction_type)}>
                          <div className="flex items-center gap-1">
                            {getTransactionIcon(transaction.transaction_type)}
                            <span>{getTransactionTypeLabel(transaction.transaction_type)}</span>
                          </div>
                        </Badge>
                      </ResponsiveTableCell>
                      <ResponsiveTableCell className="text-gray-600 dark:text-gray-300">
                        {transaction.description}
                      </ResponsiveTableCell>
                      <ResponsiveTableCell className="font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(transaction.amount)}
                      </ResponsiveTableCell>
                    </ResponsiveTableRow>
                  ))
                ) : (
                  <ResponsiveTableRow>
                    <ResponsiveTableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Banknote className="h-12 w-12 text-gray-400" />
                        <p className="text-gray-500 text-lg">لا توجد معاملات متاحة</p>
                      </div>
                    </ResponsiveTableCell>
                  </ResponsiveTableRow>
                )}
              </ResponsiveTableBody>
            </ResponsiveTable>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountStatement;
