
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";
import { calculateOrderFinancials } from "@/lib/orderFinancials";
import { useOrderStatuses } from "@/hooks/useOrderStatuses";
import { useDateFilter } from "@/components/tabs/StyledIndexTabs";
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Eye,
  TrendingUp,
  Package,
  DollarSign,
  Truck,
  Calendar,
  User,
  Phone,
  MapPin,
  CreditCard,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Receipt,
  Trash2,
  Printer,
  Copy,
  Check
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate, useLocation } from "react-router-dom";
import OrderPaymentDialog from "./OrderPaymentDialog";
import InvoiceTemplateSelector from "@/components/invoice/InvoiceTemplateSelector";
import { toast } from "sonner";

const DetailedOrdersReport = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { getStatusOptions, getStatusLabel, getStatusColor } = useOrderStatuses();
  const { startDate, endDate } = useDateFilter();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'collection' | 'shipping' | 'cost'>('collection');
  const [invoiceOrder, setInvoiceOrder] = useState<any>(null);

  const selectedFinancials = selectedOrder ? calculateOrderFinancials(selectedOrder) : null;
  const statusOptions = getStatusOptions();


  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldKey);
      toast.success('تم النسخ');
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  // Fetch orders data
  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['detailed-orders-report'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('user_id', user.id)
        .order('date_created', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Scroll to the focused order after returning from edit
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const focusSerial = params.get('focusSerial');

    if (focusSerial && !isLoading) {
      setTimeout(() => {
        const el = document.getElementById(`order-card-${focusSerial}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
          setTimeout(() => el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2'), 3000);
        }
      }, 300);
    }
  }, [location.search, isLoading]);

  const deliveryMethods = [...new Set(orders.map(o => o.delivery_method).filter(Boolean))];

  // Filter orders with date filter support
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.serial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.phone?.includes(searchTerm);
    
    const matchesStatus = statusFilters.length === 0 || statusFilters.includes(order.status);
    const matchesPayment = paymentFilter === "all" || order.payment_method === paymentFilter;
    const matchesDelivery = deliveryFilter === "all" || order.delivery_method === deliveryFilter;
    
    // Apply date filter from context
    const orderDate = new Date(order.date_created);
    const matchesDateFrom = !startDate || orderDate >= startDate;
    const matchesDateTo = !endDate || orderDate <= endDate;
    
    return matchesSearch && matchesStatus && matchesPayment && matchesDelivery && matchesDateFrom && matchesDateTo;
  });

  // Calculate summary statistics
  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + calculateOrderFinancials(order).total, 0);
  const totalProfit = filteredOrders.reduce((sum, order) => sum + (order.profit || 0), 0);
  const totalShipping = filteredOrders.reduce((sum, order) => sum + calculateOrderFinancials(order).shipping, 0);
  const totalDeposits = filteredOrders.reduce((sum, order) => sum + calculateOrderFinancials(order).paid, 0);
  const totalCosts = filteredOrders.reduce((sum, order) => {
    const financials = calculateOrderFinancials(order);
    // التكلفة = الإجمالي - الربح - الشحن
    return sum + (financials.total - (order.profit || 0) - financials.shipping);
  }, 0);
  const totalDiscounts = filteredOrders.reduce((sum, order) => sum + calculateOrderFinancials(order).discount, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': 
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'shipped': return <Truck className="h-4 w-4 text-indigo-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleStatusChange = async (orderId: string, serial: string, newStatus: string) => {
    try {
      // Update orders table
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      // Also update admin_orders table to keep in sync
      const { error: adminError } = await supabase
        .from('admin_orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('serial', serial)
        .eq('user_id', user?.id);

      if (adminError) {
        console.error('Error syncing admin_orders:', adminError);
      }

      toast.success(`تم تحديث حالة الطلب إلى: ${getStatusLabel(newStatus)}`);
      refetch();
      // Invalidate all order-related queries
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders-invoice'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders-enhanced'] });
      queryClient.invalidateQueries({ queryKey: ['printing-orders'] });
      queryClient.invalidateQueries({ queryKey: ['comprehensive-orders'] });
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('حدث خطأ في تحديث حالة الطلب');
    }
  };

  // Delete order mutation with sync
  const deleteOrderMutation = useMutation({
    mutationFn: async ({ orderId, serial }: { orderId: string; serial: string }) => {
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');
      
      // Delete from orders table
      const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)
        .eq('user_id', user.id);
      
      if (ordersError) throw ordersError;

      // Also delete from admin_orders to keep in sync
      const { error: adminError } = await supabase
        .from('admin_orders')
        .delete()
        .eq('serial', serial)
        .eq('user_id', user.id);

      if (adminError) {
        console.error('Error syncing admin_orders delete:', adminError);
      }

      // Delete related transactions
      await supabase
        .from('transactions')
        .delete()
        .eq('order_serial', serial)
        .eq('user_id', user.id);
    },
    onSuccess: () => {
      // Invalidate all order-related queries to sync across all screens
      queryClient.invalidateQueries({ queryKey: ['detailed-orders-report'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders-enhanced'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders-invoice'] });
      queryClient.invalidateQueries({ queryKey: ['printing-orders'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary-orders'] });
      queryClient.invalidateQueries({ queryKey: ['comprehensive-orders'] });
      queryClient.invalidateQueries({ queryKey: ['comprehensive-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['comprehensive-workshop-payments'] });
      queryClient.invalidateQueries({ queryKey: ['comprehensive-customer-payments'] });
      toast.success('تم حذف الطلب بنجاح');
    },
    onError: (error: any) => {
      console.error('Delete order error:', error);
      toast.error('حدث خطأ في حذف الطلب');
    }
  });

  const handleDeleteOrder = (order: any) => {
    if (window.confirm(`هل أنت متأكد من حذف الطلب ${order.serial}؟ سيتم حذف جميع البيانات المرتبطة به.`)) {
      deleteOrderMutation.mutate({ orderId: order.id, serial: order.serial });
    }
  };

  const openOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const handleEditOrder = (order: any) => {
    navigate(`/edit-order/${order.serial}`, {
      state: {
        returnTo: 'orders-report',
        focusSerial: order.serial,
      },
    });
  };

  const handlePayment = async (amount: number, notes?: string, updateOrderCost?: boolean) => {
    if (!selectedOrder) return;

    try {
      // Update order based on payment type
      if (paymentType === 'collection') {
        // Update the order's deposit amount
        const newDeposit = (selectedOrder.deposit || 0) + amount;
        
        const { error: orderError } = await supabase
          .from('orders')
          .update({ deposit: newDeposit })
          .eq('id', selectedOrder.id);

        if (orderError) throw orderError;

        // Also update admin_orders
        await supabase
          .from('admin_orders')
          .update({ deposit: newDeposit })
          .eq('serial', selectedOrder.serial)
          .eq('user_id', user?.id);
      }

      // إذا كان سداد تكلفة وتم تعديل المبلغ، نحدث تكلفة الطلب
      if (paymentType === 'cost' && updateOrderCost) {
        // حساب الربح الجديد بناءً على التكلفة الجديدة
        // الربح = إجمالي المبلغ - التكلفة الجديدة - الشحن
        const newProfit = (selectedOrder.total || 0) - amount - (selectedOrder.shipping_cost || 0);
        
        const { error: orderError } = await supabase
          .from('orders')
          .update({ profit: newProfit })
          .eq('id', selectedOrder.id);

        if (orderError) throw orderError;

        // Also update admin_orders
        await supabase
          .from('admin_orders')
          .update({ profit: newProfit })
          .eq('serial', selectedOrder.serial)
          .eq('user_id', user?.id);

        toast.success('تم تحديث تكلفة الطلب وحساب الربح الجديد');
      }

      // Add transaction record
      const transactionType = paymentType === 'collection' ? 'order_collection' :
                             paymentType === 'shipping' ? 'shipping_payment' : 'cost_payment';
      
      const description = paymentType === 'collection' ? `تحصيل من الطلب ${selectedOrder.serial}` :
                         paymentType === 'shipping' ? `سداد شحن للطلب ${selectedOrder.serial}` :
                         `سداد تكلفة للطلب ${selectedOrder.serial}`;

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          amount: amount,
          transaction_type: transactionType,
          description: notes ? `${description} - ${notes}` : description,
          order_serial: selectedOrder.serial
        });

      if (transactionError) throw transactionError;

      toast.success('تم تسجيل المعاملة بنجاح');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders-enhanced'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders-for-modern-statement'] });
      setPaymentDialogOpen(false);
    } catch (error) {
      console.error('Error adding payment:', error);
      toast.error('حدث خطأ في تسجيل المعاملة');
    }
  };

  const openPaymentDialog = (order: any, type: 'collection' | 'shipping' | 'cost') => {
    setSelectedOrder(order);
    setPaymentType(type);
    setPaymentDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`font-bold flex items-center gap-2 ${isMobile ? 'text-base' : 'text-2xl'}`}>
              <FileText className={`text-primary ${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} />
              تقرير الطلبات
            </h1>
            <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>تحليل شامل لجميع طلباتك</p>
          </div>
          <Button variant="outline" size="sm" className={isMobile ? 'text-xs px-2' : ''}>
            <Download className="h-4 w-4 ml-1" />
            {!isMobile && 'تصدير'}
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-4'}`}>
              <div className="space-y-2">
                <label className="text-sm font-medium">البحث</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="اسم العميل، رقم الطلب، الهاتف..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">حالة الطلب</label>
                <div className="flex flex-wrap gap-1.5">
                  {statusOptions.map(status => {
                    const isActive = statusFilters.includes(status.value);
                    return (
                      <Badge
                        key={status.value}
                        variant={isActive ? "default" : "outline"}
                        className={`cursor-pointer text-xs transition-all ${isActive ? '' : 'opacity-60 hover:opacity-100'}`}
                        onClick={() => {
                          setStatusFilters(prev =>
                            isActive ? prev.filter(s => s !== status.value) : [...prev, status.value]
                          );
                        }}
                      >
                        {status.label}
                      </Badge>
                    );
                  })}
                  {statusFilters.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="cursor-pointer text-xs"
                      onClick={() => setStatusFilters([])}
                    >
                      مسح الكل ✕
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">طريقة الدفع</label>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الطرق</SelectItem>
                    <SelectItem value="نقدي عند الاستلام">نقدي عند الاستلام</SelectItem>
                    <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
                    <SelectItem value="فودافون كاش">فودافون كاش</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">طريقة التسليم</label>
                <Select value={deliveryFilter} onValueChange={setDeliveryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الطرق</SelectItem>
                    {deliveryMethods.map(method => (
                      <SelectItem key={method} value={method}>{method}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active filters summary */}
            {(statusFilters.length > 0 || paymentFilter !== "all" || deliveryFilter !== "all" || searchTerm) && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">فلاتر نشطة</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-6 text-destructive hover:text-destructive"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilters([]);
                    setPaymentFilter("all");
                    setDeliveryFilter("all");
                  }}
                >
                  مسح الكل
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Statistics */}
      <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-4 lg:grid-cols-7'}`}>
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">إجمالي الطلبات</p>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{totalOrders}</p>
              </div>
              <Package className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-green-600 dark:text-green-400 font-medium">إجمالي الإيرادات</p>
                <p className={`${isMobile ? 'text-base' : 'text-xl'} font-bold text-green-700 dark:text-green-300`}>
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-red-600 dark:text-red-400 font-medium">إجمالي التكاليف</p>
                <p className={`${isMobile ? 'text-base' : 'text-xl'} font-bold text-red-700 dark:text-red-300`}>
                  {formatCurrency(totalCosts)}
                </p>
              </div>
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">صافي الربح</p>
                <p className={`${isMobile ? 'text-base' : 'text-xl'} font-bold text-purple-700 dark:text-purple-300`}>
                  {formatCurrency(totalProfit)}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-orange-600 dark:text-orange-400 font-medium">الشحن</p>
                <p className={`${isMobile ? 'text-base' : 'text-xl'} font-bold text-orange-700 dark:text-orange-300`}>
                  {formatCurrency(totalShipping)}
                </p>
              </div>
              <Truck className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        {totalDiscounts > 0 && (
          <Card className="bg-gradient-to-r from-pink-50 to-pink-100 dark:from-pink-950/50 dark:to-pink-900/50">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-pink-600 dark:text-pink-400 font-medium">الخصومات</p>
                  <p className={`${isMobile ? 'text-base' : 'text-xl'} font-bold text-pink-700 dark:text-pink-300`}>
                    {formatCurrency(totalDiscounts)}
                  </p>
                </div>
                <Receipt className="h-6 w-6 text-pink-500" />
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-950/50 dark:to-teal-900/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">العربون المسدد</p>
                <p className={`${isMobile ? 'text-base' : 'text-xl'} font-bold text-teal-700 dark:text-teal-300`}>
                  {formatCurrency(totalDeposits)}
                </p>
              </div>
              <CreditCard className="h-6 w-6 text-teal-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            تفاصيل الطلبات ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const { total, paid, remaining, shipping, discount } = calculateOrderFinancials(order);
              // حساب التكلفة = الإجمالي - الربح - الشحن
              const orderCost = total - (order.profit || 0) - shipping;
              
              return (
                <Card key={order.id} id={`order-card-${order.serial}`} className="border-l-4 border-l-primary overflow-hidden transition-all duration-500">
                  <CardContent className="p-0">
                    {/* Top Section: Header + Actions */}
                    <div className={`flex ${isMobile ? 'flex-col' : 'flex-row items-start justify-between'} gap-3 p-4 pb-3`}>
                      {/* Left: Order header info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <Badge variant="outline" className="text-xs font-mono">
                            {order.serial}
                          </Badge>
                          <Select 
                            value={order.status} 
                            onValueChange={(value) => handleStatusChange(order.id, order.serial, value)}
                          >
                            <SelectTrigger className={`h-7 w-auto min-w-[100px] text-xs ${getStatusColor(order.status)}`}>
                              <SelectValue>{getStatusLabel(order.status)}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map(status => (
                                <SelectItem key={status.value} value={status.value}>
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                          <span className="flex items-center gap-1 font-medium">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            {order.client_name}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground text-xs">
                            <Phone className="h-3 w-3" />
                            {order.phone}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground text-xs">
                            <Calendar className="h-3 w-3" />
                            {new Date(order.date_created).toLocaleDateString('ar-EG')}
                          </span>
                        </div>
                      </div>

                      {/* Right: Action Buttons */}
                      <div className={`flex flex-wrap gap-1.5 ${isMobile ? 'w-full' : 'shrink-0'}`}>
                        <Button variant="outline" size="sm" onClick={() => openOrderDetails(order)} className="text-xs h-8 gap-1 font-medium">
                          <Eye className="h-3.5 w-3.5" /> التفاصيل
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditOrder(order)} className="text-xs h-8 gap-1 font-medium">
                          <Edit className="h-3.5 w-3.5" /> تعديل
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setInvoiceOrder(order)} className="text-xs h-8 gap-1 font-medium border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-950/50">
                          <Printer className="h-3.5 w-3.5" /> فاتورة
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDeleteOrder(order)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" disabled={deleteOrderMutation.isPending}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openPaymentDialog(order, 'collection')} className="text-xs h-8 gap-1 font-medium border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/50">
                          <Receipt className="h-3.5 w-3.5" /> تحصيل
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openPaymentDialog(order, 'cost')} className="text-xs h-8 gap-1 font-medium border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/50">
                          <DollarSign className="h-3.5 w-3.5" /> تكلفة
                        </Button>
                      </div>
                    </div>

                    {/* Middle Section: Financial + Delivery */}
                    <div className={`grid gap-4 px-4 pb-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-5'}`}>
                      <div className="text-center p-2 bg-muted/30 rounded-lg">
                        <div className="text-[10px] text-muted-foreground mb-0.5">الإجمالي</div>
                        <div className="font-bold text-sm text-green-600 dark:text-green-400">{formatCurrency(total)}</div>
                      </div>
                      <div className="text-center p-2 bg-muted/30 rounded-lg">
                        <div className="text-[10px] text-muted-foreground mb-0.5">الربح</div>
                        <div className="font-bold text-sm text-blue-600 dark:text-blue-400">{formatCurrency(order.profit || 0)}</div>
                      </div>
                      <div className="text-center p-2 bg-muted/30 rounded-lg">
                        <div className="text-[10px] text-muted-foreground mb-0.5">المدفوع</div>
                        <div className="font-bold text-sm text-purple-600 dark:text-purple-400">{formatCurrency(paid)}</div>
                      </div>
                      <div className="text-center p-2 bg-muted/30 rounded-lg">
                        <div className="text-[10px] text-muted-foreground mb-0.5">المتبقي</div>
                        <div className={`font-bold text-sm ${remaining > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'}`}>{formatCurrency(remaining)}</div>
                      </div>
                      <div className={`${isMobile ? 'col-span-2' : ''} flex items-center justify-center gap-3 text-xs text-muted-foreground p-2 bg-muted/30 rounded-lg`}>
                        <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" />{order.payment_method}</span>
                        <span className="flex items-center gap-1"><Truck className="h-3 w-3" />{order.delivery_method}</span>
                        {order.governorate && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{order.governorate}</span>}
                      </div>
                    </div>

                    {/* Cost Summary Bar */}
                    <div className="px-4 pb-3">
                      <div className="flex flex-wrap items-center gap-3 text-[11px] bg-muted/40 rounded-md px-3 py-1.5 border border-border/40">
                        <span className="text-[10px] font-medium text-muted-foreground">التكاليف:</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> التكلفة: <b className="text-red-600 dark:text-red-400">{formatCurrency(orderCost)}</b></span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> الشحن: <b className="text-orange-600 dark:text-orange-400">{formatCurrency(shipping)}</b></span>
                        {discount > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span> خصم: <b className="text-pink-600 dark:text-pink-400">-{formatCurrency(discount)}</b></span>}
                      </div>
                    </div>

                    {/* Bottom Section: Products + Notes */}
                    <div className="border-t px-4 py-3 bg-muted/20">
                      <div className="text-[10px] font-medium text-muted-foreground mb-2">المنتجات:</div>
                      <div className="flex flex-wrap gap-2">
                        {order.order_items?.map((item: any, index: number) => {
                          const itemTotal = (item.price - (item.item_discount || 0)) * item.quantity;
                          return (
                            <div key={index} className="flex items-center gap-1.5 bg-background rounded-md px-2.5 py-1 border text-sm">
                              <span className="font-medium">{item.product_type}</span>
                              <Badge variant="secondary" className="text-[10px] h-5 font-normal">{item.size}</Badge>
                              <span className="text-muted-foreground text-xs">×{item.quantity}</span>
                              {item.item_discount > 0 && (
                                <Badge variant="outline" className="text-[10px] h-5 font-normal text-red-600 border-red-200">-{formatCurrency(item.item_discount)}/قطعة</Badge>
                              )}
                              <span className="font-semibold text-xs">{formatCurrency(itemTotal)}</span>
                            </div>
                          );
                        })}
                      </div>
                      {order.notes && (
                        <div className="mt-2 text-xs text-muted-foreground bg-background/60 p-2 rounded-md border border-border/30">
                          {order.notes}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredOrders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد طلبات تطابق معايير البحث</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                تفاصيل الطلب
              </DialogTitle>
              {selectedOrder && (
                <Badge variant="outline" className="text-base font-mono px-3 py-1">
                  {selectedOrder.serial}
                </Badge>
              )}
            </div>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4 pt-2">

              {/* Order Status + Date Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedOrder.status)}
                  <Badge className={`${getStatusColor(selectedOrder.status)} text-white text-sm px-3`}>
                    {getStatusLabel(selectedOrder.status)}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(selectedOrder.date_created).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>

              {/* Customer Info */}
              <Card className="border-2 border-primary/10">
                <CardHeader className="py-3 px-4 bg-primary/5 rounded-t-lg">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    بيانات العميل
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">الاسم</p>
                      <div className="flex items-center gap-1">
                        <p className="font-semibold text-sm">{selectedOrder.client_name}</p>
                        <button onClick={() => copyToClipboard(selectedOrder.client_name, 'name')} className="p-1 rounded hover:bg-muted transition-colors" title="نسخ">
                          {copiedField === 'name' ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">الهاتف</p>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-sm flex items-center gap-1">
                          <Phone className="h-3 w-3 text-primary" />
                          {selectedOrder.phone}
                          <button onClick={() => copyToClipboard(selectedOrder.phone, 'phone')} className="p-1 rounded hover:bg-muted transition-colors" title="نسخ">
                            {copiedField === 'phone' ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                          </button>
                        </span>
                        {selectedOrder.phone2 && (
                          <span className="font-semibold text-sm flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {selectedOrder.phone2}
                            <button onClick={() => copyToClipboard(selectedOrder.phone2, 'phone2')} className="p-1 rounded hover:bg-muted transition-colors" title="نسخ">
                              {copiedField === 'phone2' ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                            </button>
                            <Badge variant="secondary" className="text-[10px] h-4 px-1">إضافي</Badge>
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedOrder.governorate && selectedOrder.governorate !== '-' && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">المحافظة</p>
                        <div className="flex items-center gap-1">
                          <p className="font-semibold text-sm flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-primary" />
                            {selectedOrder.governorate}
                          </p>
                          <button onClick={() => copyToClipboard(selectedOrder.governorate, 'gov')} className="p-1 rounded hover:bg-muted transition-colors" title="نسخ">
                            {copiedField === 'gov' ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                          </button>
                        </div>
                      </div>
                    )}
                    {selectedOrder.address && selectedOrder.address !== '-' && (
                      <div className={!selectedOrder.governorate || selectedOrder.governorate === '-' ? 'col-span-2' : ''}>
                        <p className="text-xs text-muted-foreground mb-0.5">العنوان</p>
                        <div className="flex items-start gap-1">
                          <p className="font-semibold text-sm leading-relaxed">{selectedOrder.address}</p>
                          <button onClick={() => copyToClipboard(selectedOrder.address, 'address')} className="p-1 rounded hover:bg-muted transition-colors shrink-0" title="نسخ">
                            {copiedField === 'address' ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Products */}
              <Card className="border-2 border-blue-100 dark:border-blue-900/40">
                <CardHeader className="py-3 px-4 bg-blue-50 dark:bg-blue-950/30 rounded-t-lg">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    المنتجات
                    <Badge variant="secondary" className="mr-auto text-xs">
                      {selectedOrder.order_items?.length || 0} صنف
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {selectedOrder.order_items?.map((item: any, index: number) => {
                      const discountedPrice = item.price - (item.item_discount || 0);
                      const itemTotal = discountedPrice * item.quantity;
                      return (
                        <div key={index} className="flex items-start justify-between p-3 bg-muted/30 rounded-lg border border-border/40 hover:bg-muted/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">{item.product_type}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px] h-5">{item.size}</Badge>
                              <span className="text-xs text-muted-foreground">× {item.quantity}</span>
                              <span className="text-xs text-muted-foreground">سعر الوحدة: {formatCurrency(item.price)}</span>
                              {item.item_discount > 0 && (
                                <Badge variant="outline" className="text-[10px] h-5 text-red-600 border-red-200 bg-red-50">
                                  خصم: -{formatCurrency(item.item_discount)}/قطعة
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <p className="font-bold text-sm">{formatCurrency(itemTotal)}</p>
                            <p className="text-[11px] text-muted-foreground">ربح: {formatCurrency(item.profit || 0)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Financial Summary */}
              <Card className="border-2 border-green-100 dark:border-green-900/40">
                <CardHeader className="py-3 px-4 bg-green-50 dark:bg-green-950/30 rounded-t-lg">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    الملخص المالي
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center py-1.5 border-b border-dashed border-border/50">
                      <span className="text-muted-foreground">المجموع الفرعي</span>
                      <span className="font-semibold">{formatCurrency(selectedFinancials?.subtotal ?? 0)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-dashed border-border/50">
                      <span className="text-muted-foreground flex items-center gap-1"><Truck className="h-3 w-3" />الشحن</span>
                      <span className="font-semibold text-orange-600">+{formatCurrency(selectedFinancials?.shipping ?? 0)}</span>
                    </div>
                    {(selectedFinancials?.discount ?? 0) > 0 && (
                      <div className="flex justify-between items-center py-1.5 border-b border-dashed border-border/50">
                        <span className="text-muted-foreground">الخصم</span>
                        <span className="font-semibold text-pink-600">-{formatCurrency(selectedFinancials?.discount ?? 0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2 bg-muted/40 rounded-lg px-3 mt-1">
                      <span className="font-bold">الإجمالي</span>
                      <span className="font-bold text-base text-foreground">{formatCurrency(selectedFinancials?.total ?? 0)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="flex justify-between items-center py-1.5 bg-green-50 dark:bg-green-950/30 rounded-lg px-3">
                        <span className="text-muted-foreground text-xs">العربون المسدد</span>
                        <span className="font-semibold text-green-600">{formatCurrency(selectedFinancials?.paid ?? 0)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 bg-orange-50 dark:bg-orange-950/30 rounded-lg px-3">
                        <span className="text-muted-foreground text-xs">المتبقي</span>
                        <span className="font-semibold text-orange-600">{formatCurrency(selectedFinancials?.remaining ?? 0)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg px-3">
                      <span className="font-bold flex items-center gap-1"><TrendingUp className="h-4 w-4 text-blue-600" />صافي الربح</span>
                      <span className="font-bold text-base text-blue-600">{formatCurrency(selectedOrder.profit || 0)}</span>
                    </div>
                  </div>

                  {/* Payment + Delivery Methods */}
                  <div className="mt-3 pt-3 border-t border-dashed border-border/50 flex flex-wrap gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-1.5">
                      <CreditCard className="h-3.5 w-3.5" />
                      <span className="font-medium">{selectedOrder.payment_method}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-1.5">
                      <Truck className="h-3.5 w-3.5" />
                      <span className="font-medium">{selectedOrder.delivery_method}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {selectedOrder.notes && (
                <Card className="border-2 border-yellow-100 dark:border-yellow-900/40">
                  <CardContent className="py-3 px-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5 text-yellow-600" />
                      ملاحظات
                    </p>
                    <p className="text-sm leading-relaxed">{selectedOrder.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Attached Image */}
              {selectedOrder.attached_image_url && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">الصورة المرفقة</p>
                    <img
                      src={selectedOrder.attached_image_url}
                      alt="صورة مرفقة"
                      className="max-w-full h-auto max-h-48 rounded-lg border object-contain"
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <OrderPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        order={selectedOrder}
        paymentType={paymentType}
        onConfirm={handlePayment}
      />

      {/* Invoice Dialog */}
      <Dialog open={!!invoiceOrder} onOpenChange={(open) => !open && setInvoiceOrder(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          {invoiceOrder && (
            <InvoiceTemplateSelector 
              order={{
                ...invoiceOrder,
                clientName: invoiceOrder.client_name,
                phone: invoiceOrder.phone,
                address: invoiceOrder.address,
                dateCreated: invoiceOrder.date_created,
                deliveryMethod: invoiceOrder.delivery_method,
                paymentMethod: invoiceOrder.payment_method,
                shippingCost: invoiceOrder.shipping_cost,
                items: invoiceOrder.order_items?.map((item: any) => ({
                  productType: item.product_type,
                  size: item.size,
                  quantity: item.quantity,
                  price: item.price,
                  cost: item.cost,
                  profit: item.profit,
                  item_discount: item.item_discount
                })) || []
              }}
              onClose={() => setInvoiceOrder(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DetailedOrdersReport;
