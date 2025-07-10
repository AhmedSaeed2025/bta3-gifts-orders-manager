
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Eye,
  TrendingUp,
  TrendingDown,
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
  XCircle
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const DetailedOrdersReport = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch orders data
  const { data: orders = [], isLoading } = useQuery({
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
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalProfit = filteredOrders.reduce((sum, order) => sum + (order.profit || 0), 0);
  const totalShipping = filteredOrders.reduce((sum, order) => sum + (order.shipping_cost || 0), 0);
  const totalDeposits = filteredOrders.reduce((sum, order) => sum + (order.deposit || 0), 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'completed': 'default',
      'pending': 'secondary',
      'cancelled': 'destructive'
    };
    
    const labels = {
      'completed': 'مكتمل',
      'pending': 'قيد الانتظار',
      'cancelled': 'ملغي'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const openOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              تقرير الطلبات التفصيلي
            </h1>
            <p className="text-muted-foreground">تحليل شامل لجميع طلباتك</p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 ml-1" />
            تصدير Excel
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                    <SelectItem value="cancelled">ملغي</SelectItem>
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
              const remainingAmount = (order.total || 0) - (order.deposit || 0);
              
              return (
                <Card key={order.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-12'}`}>
                      {/* Order Info */}
                      <div className={`${isMobile ? 'col-span-1' : 'col-span-3'} space-y-2`}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {order.serial}
                          </Badge>
                          {getStatusBadge(order.status)}
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
                            <div className="font-bold text-green-600">{formatCurrency(order.total || 0)}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">الربح</div>
                            <div className="font-bold text-blue-600">{formatCurrency(order.profit || 0)}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">العربون</div>
                            <div className="font-bold text-purple-600">{formatCurrency(order.deposit || 0)}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">المتبقي</div>
                            <div className="font-bold text-orange-600">{formatCurrency(remainingAmount)}</div>
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
                        {order.shipping_cost > 0 && (
                          <div className="text-xs text-muted-foreground">
                            شحن: {formatCurrency(order.shipping_cost)}
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
                      <div className={`${isMobile ? 'col-span-1' : 'col-span-2'} flex items-center justify-end`}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openOrderDetails(order)}
                          className="text-xs"
                        >
                          <Eye className="h-3 w-3 ml-1" />
                          التفاصيل
                        </Button>
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
                        <span>{formatCurrency((selectedOrder.total || 0) - (selectedOrder.shipping_cost || 0))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>الشحن:</span>
                        <span>{formatCurrency(selectedOrder.shipping_cost || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>الخصم:</span>
                        <span>{formatCurrency(selectedOrder.discount || 0)}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t pt-2">
                        <span>الإجمالي:</span>
                        <span>{formatCurrency(selectedOrder.total || 0)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>العربون المسدد:</span>
                        <span className="text-green-600">{formatCurrency(selectedOrder.deposit || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>المتبقي:</span>
                        <span className="text-orange-600">{formatCurrency((selectedOrder.total || 0) - (selectedOrder.deposit || 0))}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t pt-2">
                        <span>صافي الربح:</span>
                        <span className="text-blue-600">{formatCurrency(selectedOrder.profit || 0)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DetailedOrdersReport;
