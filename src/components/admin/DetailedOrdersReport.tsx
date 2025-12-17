
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";
import { calculateOrderFinancials } from "@/lib/orderFinancials";
import { useOrderStatuses } from "@/hooks/useOrderStatuses";
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
  Receipt
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import OrderPaymentDialog from "./OrderPaymentDialog";
import { toast } from "sonner";

const DetailedOrdersReport = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { getStatusOptions, getStatusLabel, getStatusColor } = useOrderStatuses();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'collection' | 'shipping' | 'cost'>('collection');

  const selectedFinancials = selectedOrder ? calculateOrderFinancials(selectedOrder) : null;
  const statusOptions = getStatusOptions();

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

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.serial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.phone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesPayment = paymentFilter === "all" || order.payment_method === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Calculate summary statistics
  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + calculateOrderFinancials(order).total, 0);
  const totalProfit = filteredOrders.reduce((sum, order) => sum + (order.profit || 0), 0);
  const totalShipping = filteredOrders.reduce((sum, order) => sum + calculateOrderFinancials(order).shipping, 0);
  const totalDeposits = filteredOrders.reduce((sum, order) => sum + calculateOrderFinancials(order).paid, 0);

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

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      toast.success(`تم تحديث حالة الطلب إلى: ${getStatusLabel(newStatus)}`);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders-enhanced'] });
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('حدث خطأ في تحديث حالة الطلب');
    }
  };

  const openOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const handleEditOrder = (order: any) => {
    navigate(`/edit-order/${order.serial}`);
  };

  const handlePayment = async (amount: number, notes?: string) => {
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
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    {statusOptions.map(status => (
                      <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <label className="text-sm font-medium">الإجراءات</label>
                <Button variant="outline" className="w-full">
                  <Filter className="h-4 w-4 ml-1" />
                  فلاتر متقدمة
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Statistics */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-5'}`}>
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">إجمالي الطلبات</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalOrders}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">إجمالي الإيرادات</p>
                <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-green-700 dark:text-green-300`}>
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">صافي الربح</p>
                <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-purple-700 dark:text-purple-300`}>
                  {formatCurrency(totalProfit)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">الشحن</p>
                <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-orange-700 dark:text-orange-300`}>
                  {formatCurrency(totalShipping)}
                </p>
              </div>
              <Truck className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-950/50 dark:to-teal-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">العربون المسدد</p>
                <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-teal-700 dark:text-teal-300`}>
                  {formatCurrency(totalDeposits)}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-teal-500" />
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
              const { total, paid, remaining, shipping } = calculateOrderFinancials(order);
              
              return (
                <Card key={order.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-12'}`}>
                      {/* Order Info */}
                      <div className={`${isMobile ? 'col-span-1' : 'col-span-3'} space-y-2`}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {order.serial}
                          </Badge>
                          <Select 
                            value={order.status} 
                            onValueChange={(value) => handleStatusChange(order.id, value)}
                          >
                            <SelectTrigger className={`h-7 w-auto min-w-[90px] text-xs ${getStatusColor(order.status)}`}>
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
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <User className="h-3 w-3" />
                            <span className="font-medium">{order.client_name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{order.phone}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(order.date_created).toLocaleDateString('ar-EG')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Financial Info */}
                      <div className={`${isMobile ? 'col-span-1' : 'col-span-4'}`}>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">المبلغ الإجمالي</div>
                            <div className="font-bold text-green-600">{formatCurrency(total)}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">الربح</div>
                            <div className="font-bold text-blue-600">{formatCurrency(order.profit || 0)}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">العربون</div>
                            <div className="font-bold text-purple-600">{formatCurrency(-paid)}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">المتبقي</div>
                            <div className="font-bold text-orange-600">{formatCurrency(remaining)}</div>
                          </div>
                        </div>
                      </div>

                      {/* Delivery Info */}
                      <div className={`${isMobile ? 'col-span-1' : 'col-span-3'} space-y-2`}>
                        <div className="flex items-center gap-1 text-sm">
                          <CreditCard className="h-3 w-3" />
                          <span className="text-xs">{order.payment_method}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Truck className="h-3 w-3" />
                          <span className="text-xs">{order.delivery_method}</span>
                        </div>
                        {shipping > 0 && (
                          <div className="text-xs text-muted-foreground">
                            شحن: {formatCurrency(shipping)}
                          </div>
                        )}
                        {order.governorate && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{order.governorate}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className={`${isMobile ? 'col-span-1' : 'col-span-2'} flex flex-col gap-2`}>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openOrderDetails(order)}
                            className="text-xs flex-1"
                          >
                            <Eye className="h-3 w-3 ml-1" />
                            التفاصيل
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditOrder(order)}
                            className="text-xs flex-1"
                          >
                            <Edit className="h-3 w-3 ml-1" />
                            تعديل
                          </Button>
                        </div>
                        
                        {/* Payment Actions */}
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPaymentDialog(order, 'collection')}
                            className="text-xs bg-green-50 hover:bg-green-100"
                          >
                            <Receipt className="h-3 w-3 ml-1" />
                            تحصيل
                          </Button>
                          {order.shipping_cost > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openPaymentDialog(order, 'shipping')}
                              className="text-xs bg-orange-50 hover:bg-orange-100"
                            >
                              <Truck className="h-3 w-3 ml-1" />
                              شحن
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPaymentDialog(order, 'cost')}
                            className="text-xs bg-red-50 hover:bg-red-100"
                          >
                            <DollarSign className="h-3 w-3 ml-1" />
                            تكلفة
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Items Summary */}
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs text-muted-foreground mb-2">المنتجات:</div>
                      <div className="flex flex-wrap gap-1">
                        {order.order_items?.map((item: any, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {item.product_type} ({item.size}) × {item.quantity}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {order.notes && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-xs text-muted-foreground mb-1">ملاحظات:</div>
                        <div className="text-sm bg-gray-50 p-2 rounded">{order.notes}</div>
                      </div>
                    )}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب - {selectedOrder?.serial}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">بيانات العميل</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">الاسم</label>
                    <p className="text-sm">{selectedOrder.client_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">الهاتف</label>
                    <p className="text-sm">{selectedOrder.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">المحافظة</label>
                    <p className="text-sm">{selectedOrder.governorate || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">العنوان</label>
                    <p className="text-sm">{selectedOrder.address || '-'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">المنتجات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedOrder.order_items?.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{item.product_type}</p>
                          <p className="text-sm text-muted-foreground">المقاس: {item.size} | الكمية: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(item.price * item.quantity)}</p>
                          <p className="text-sm text-muted-foreground">ربح: {formatCurrency(item.profit || 0)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Financial Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">الملخص المالي</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>المجموع الفرعي:</span>
                        <span>{formatCurrency(selectedFinancials?.subtotal ?? 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>الشحن:</span>
                        <span>{formatCurrency(selectedFinancials?.shipping ?? 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>الخصم:</span>
                        <span>{formatCurrency(selectedFinancials?.discount ?? 0)}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t pt-2">
                        <span>الإجمالي:</span>
                        <span>{formatCurrency(selectedFinancials?.total ?? 0)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>العربون المسدد:</span>
                        <span className="text-green-600">{formatCurrency(-(selectedFinancials?.paid ?? 0))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>المتبقي:</span>
                        <span className="text-orange-600">{formatCurrency(selectedFinancials?.remaining ?? 0)}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t pt-2">
                        <span>صافي الربح:</span>
                        <span className="text-blue-600">{formatCurrency(selectedOrder.profit || 0)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {selectedOrder.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">ملاحظات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedOrder.notes}</p>
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
    </div>
  );
};

export default DetailedOrdersReport;
