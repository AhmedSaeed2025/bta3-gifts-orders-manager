import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Printer, Package, DollarSign, Check, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useOrderStatuses } from '@/hooks/useOrderStatuses';
import { toast } from 'sonner';

interface OrderWithItems {
  id: string;
  serial: string;
  client_name: string;
  phone: string;
  status: string;
  date_created: string;
  total: number;
  notes: string | null;
  order_items: {
    id: string;
    product_type: string;
    size: string;
    quantity: number;
    price: number;
    cost: number;
  }[];
}

const PrintingOrdersReport = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { getStatusLabel, getStatusColor } = useOrderStatuses();
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [workshopCost, setWorkshopCost] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch orders with printing-related statuses from BOTH tables
  const { data: printingOrders, isLoading } = useQuery({
    queryKey: ['printing-orders', user?.id],
    queryFn: async () => {
      const printingStatuses = ['sent_to_printing'];
      
      // Fetch from orders table
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          serial,
          client_name,
          phone,
          status,
          date_created,
          total,
          notes,
          order_items (
            id,
            product_type,
            size,
            quantity,
            price,
            cost
          )
        `)
        .eq('user_id', user?.id)
        .in('status', printingStatuses)
        .order('date_created', { ascending: false });

      if (ordersError) throw ordersError;
      
      // Also fetch from admin_orders table
      const { data: adminOrdersData, error: adminOrdersError } = await supabase
        .from('admin_orders')
        .select(`
          id,
          serial,
          customer_name,
          customer_phone,
          status,
          order_date,
          total_amount,
          notes,
          admin_order_items (
            id,
            product_name,
            product_size,
            quantity,
            unit_price,
            unit_cost
          )
        `)
        .eq('user_id', user?.id)
        .in('status', printingStatuses)
        .order('order_date', { ascending: false });

      if (adminOrdersError) throw adminOrdersError;

      // Combine and normalize both datasets
      const normalizedOrders = ordersData?.map(order => ({
        id: order.id,
        serial: order.serial,
        client_name: order.client_name,
        phone: order.phone,
        status: order.status,
        date_created: order.date_created,
        total: order.total,
        notes: order.notes,
        order_items: order.order_items.map(item => ({
          id: item.id,
          product_type: item.product_type,
          size: item.size,
          quantity: item.quantity,
          price: item.price,
          cost: item.cost
        })),
        source: 'orders' as const
      })) || [];

      const normalizedAdminOrders = adminOrdersData?.map(order => ({
        id: order.id,
        serial: order.serial,
        client_name: order.customer_name,
        phone: order.customer_phone,
        status: order.status,
        date_created: order.order_date,
        total: order.total_amount,
        notes: order.notes,
        order_items: order.admin_order_items.map(item => ({
          id: item.id,
          product_type: item.product_name,
          size: item.product_size,
          quantity: item.quantity,
          price: item.unit_price,
          cost: item.unit_cost
        })),
        source: 'admin_orders' as const
      })) || [];

      // Merge and remove duplicates by serial
      const allOrders = [...normalizedOrders, ...normalizedAdminOrders];
      const uniqueOrders = allOrders.filter((order, index, self) =>
        index === self.findIndex(o => o.serial === order.serial)
      );

      return uniqueOrders as (OrderWithItems & { source: 'orders' | 'admin_orders' })[];
    },
    enabled: !!user
  });

  // Fetch workshop payments to check which orders already have costs recorded
  const { data: workshopPayments } = useQuery({
    queryKey: ['workshop-payments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workshop_payments')
        .select('order_id, cost_amount, payment_status')
        .eq('user_id', user?.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Add workshop cost mutation
  const addWorkshopCostMutation = useMutation({
    mutationFn: async ({ orderId, cost, orderInfo }: { orderId: string; cost: number; orderInfo: OrderWithItems }) => {
      const { error } = await supabase
        .from('workshop_payments')
        .insert({
          user_id: user?.id,
          order_id: orderId,
          workshop_name: 'المطبعة',
          product_name: orderInfo.order_items.map(i => i.product_type).join(', '),
          size_or_variant: orderInfo.order_items.map(i => i.size).join(', '),
          cost_amount: cost,
          payment_status: 'Due',
          notes: `طلب رقم ${orderInfo.serial} - ${orderInfo.client_name}`
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop-payments'] });
      queryClient.invalidateQueries({ queryKey: ['printing-orders'] });
      toast.success('تم تسجيل تكلفة الورشة بنجاح');
      setIsDialogOpen(false);
      setWorkshopCost('');
      setSelectedOrder(null);
    },
    onError: (error) => {
      console.error('Error adding workshop cost:', error);
      toast.error('حدث خطأ في تسجيل التكلفة');
    }
  });

  const getOrderWorkshopCost = (orderId: string) => {
    const payment = workshopPayments?.find(p => p.order_id === orderId);
    return payment;
  };

  const handleAddCost = (order: OrderWithItems) => {
    setSelectedOrder(order);
    // Set default cost from order items
    const totalCost = order.order_items.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
    setWorkshopCost(totalCost.toString());
    setIsDialogOpen(true);
  };

  const handleSubmitCost = () => {
    if (!selectedOrder || !workshopCost) return;
    addWorkshopCostMutation.mutate({
      orderId: selectedOrder.id,
      cost: parseFloat(workshopCost),
      orderInfo: selectedOrder
    });
  };

  // Calculate summary
  const summary = {
    totalOrders: printingOrders?.length || 0,
    totalItems: printingOrders?.reduce((sum, order) => 
      sum + order.order_items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0) || 0,
    totalCost: printingOrders?.reduce((sum, order) => 
      sum + order.order_items.reduce((itemSum, item) => itemSum + (item.cost * item.quantity), 0), 0) || 0,
    totalValue: printingOrders?.reduce((sum, order) => sum + Number(order.total), 0) || 0,
    registeredCosts: workshopPayments?.filter(p => 
      printingOrders?.some(o => o.id === p.order_id)
    ).reduce((sum, p) => sum + p.cost_amount, 0) || 0
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <Card className="p-0">
          <CardHeader className="p-3 lg:p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium flex items-center gap-2">
              <Printer className="h-4 w-4 text-orange-500" />
              <span className="hidden sm:inline">طلبات في المطبعة</span>
              <span className="sm:hidden">المطبعة</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 lg:p-4 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-orange-600">{summary.totalOrders}</div>
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="p-3 lg:p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-500" />
              <span className="hidden sm:inline">إجمالي القطع</span>
              <span className="sm:hidden">القطع</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 lg:p-4 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-blue-600">{summary.totalItems}</div>
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="p-3 lg:p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium">التكلفة المتوقعة</CardTitle>
          </CardHeader>
          <CardContent className="p-3 lg:p-4 pt-0">
            <div className="text-lg lg:text-2xl font-bold text-red-600">
              {summary.totalCost.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="p-3 lg:p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium">التكلفة المسجلة</CardTitle>
          </CardHeader>
          <CardContent className="p-3 lg:p-4 pt-0">
            <div className="text-lg lg:text-2xl font-bold text-purple-600">
              {summary.registeredCosts.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="p-0 col-span-2 lg:col-span-1">
          <CardHeader className="p-3 lg:p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium">قيمة البيع</CardTitle>
          </CardHeader>
          <CardContent className="p-3 lg:p-4 pt-0">
            <div className="text-lg lg:text-2xl font-bold text-green-600">
              {summary.totalValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader className="p-3 lg:p-6">
          <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
            <Printer className="h-5 w-5" />
            الطلبات في المطبعة
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 lg:p-6 lg:pt-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : printingOrders?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Printer className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد طلبات في المطبعة حالياً</p>
              <p className="text-xs mt-2">قم بتحديث حالة الطلب إلى "تم الإرسال للمطبعة" لتظهر هنا</p>
            </div>
          ) : (
            <>
              {/* Mobile Cards View */}
              <div className="lg:hidden space-y-3 p-3">
                {printingOrders?.map((order) => {
                  const itemCount = order.order_items.reduce((sum, item) => sum + item.quantity, 0);
                  const orderCost = order.order_items.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
                  const workshopPayment = getOrderWorkshopCost(order.id);
                  
                  return (
                    <Card key={order.id} className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-bold text-sm">{order.serial}</div>
                          <div className="text-xs text-muted-foreground">{order.client_name}</div>
                        </div>
                        <Badge className={getStatusColor(order.status)} variant="secondary">
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                        <div>
                          <span className="text-muted-foreground">القطع:</span>
                          <span className="font-medium mr-1">{itemCount}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">التكلفة:</span>
                          <span className="font-medium text-red-600 mr-1">{orderCost}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">البيع:</span>
                          <span className="font-medium text-green-600 mr-1">{order.total}</span>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground mb-3">
                        {order.order_items.map((item, idx) => (
                          <span key={idx}>
                            {item.product_type} ({item.size}) ×{item.quantity}
                            {idx < order.order_items.length - 1 ? ' | ' : ''}
                          </span>
                        ))}
                      </div>

                      {workshopPayment ? (
                        <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>تم تسجيل التكلفة: {workshopPayment.cost_amount} ج.م</span>
                          <Badge variant={workshopPayment.payment_status === 'Paid' ? 'default' : 'destructive'} className="text-[10px]">
                            {workshopPayment.payment_status === 'Paid' ? 'مدفوع' : 'مستحق'}
                          </Badge>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          className="w-full gap-2"
                          onClick={() => handleAddCost(order)}
                        >
                          <DollarSign className="h-4 w-4" />
                          تسجيل تكلفة الورشة
                        </Button>
                      )}
                    </Card>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الطلب</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>المنتجات</TableHead>
                      <TableHead>القطع</TableHead>
                      <TableHead>التكلفة المتوقعة</TableHead>
                      <TableHead>تكلفة الورشة</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {printingOrders?.map((order) => {
                      const itemCount = order.order_items.reduce((sum, item) => sum + item.quantity, 0);
                      const orderCost = order.order_items.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
                      const workshopPayment = getOrderWorkshopCost(order.id);
                      
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.serial}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{order.client_name}</div>
                              <div className="text-xs text-muted-foreground">{order.phone}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {order.order_items.map((item, idx) => (
                                <div key={idx} className="text-sm">
                                  {item.product_type} - {item.size} (×{item.quantity})
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{itemCount} قطعة</Badge>
                          </TableCell>
                          <TableCell className="text-red-600">
                            {orderCost.toLocaleString()} ج.م
                          </TableCell>
                          <TableCell>
                            {workshopPayment ? (
                              <div className="flex items-center gap-2">
                                <span className="text-purple-600 font-medium">
                                  {workshopPayment.cost_amount.toLocaleString()} ج.م
                                </span>
                                <Badge variant={workshopPayment.payment_status === 'Paid' ? 'default' : 'destructive'}>
                                  {workshopPayment.payment_status === 'Paid' ? 'مدفوع' : 'مستحق'}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(order.status)}>
                              {getStatusLabel(order.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {!workshopPayment && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="gap-1"
                                onClick={() => handleAddCost(order)}
                              >
                                <Plus className="h-3 w-3" />
                                تسجيل التكلفة
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Cost Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>تسجيل تكلفة الورشة</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg text-sm">
                <div><strong>الطلب:</strong> {selectedOrder.serial}</div>
                <div><strong>العميل:</strong> {selectedOrder.client_name}</div>
                <div><strong>المنتجات:</strong> {selectedOrder.order_items.map(i => `${i.product_type} (${i.size})`).join(', ')}</div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">تكلفة الورشة</label>
                <Input
                  type="number"
                  value={workshopCost}
                  onChange={(e) => setWorkshopCost(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <Button 
                className="w-full" 
                onClick={handleSubmitCost}
                disabled={addWorkshopCostMutation.isPending}
              >
                {addWorkshopCostMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                تسجيل التكلفة
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrintingOrdersReport;