import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Printer, Package } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useOrderStatuses } from '@/hooks/useOrderStatuses';

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
  const { getStatusLabel, getStatusColor } = useOrderStatuses();

  // Fetch orders with printing-related statuses
  const { data: printingOrders, isLoading } = useQuery({
    queryKey: ['printing-orders', user?.id],
    queryFn: async () => {
      // Get orders that are sent to printing
      const printingStatuses = [
        'sent_to_printing'
      ];
      
      const { data, error } = await supabase
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

      if (error) throw error;
      return data as OrderWithItems[];
    },
    enabled: !!user
  });

  // Calculate summary
  const summary = {
    totalOrders: printingOrders?.length || 0,
    totalItems: printingOrders?.reduce((sum, order) => 
      sum + order.order_items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0) || 0,
    totalCost: printingOrders?.reduce((sum, order) => 
      sum + order.order_items.reduce((itemSum, item) => itemSum + (item.cost * item.quantity), 0), 0) || 0,
    totalValue: printingOrders?.reduce((sum, order) => sum + Number(order.total), 0) || 0
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">طلبات في الورشة</CardTitle>
            <Printer className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{summary.totalOrders}</div>
            <p className="text-xs text-muted-foreground">طلب قيد الطباعة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي القطع</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary.totalItems}</div>
            <p className="text-xs text-muted-foreground">قطعة للطباعة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">تكلفة الطباعة المتوقعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summary.totalCost.toLocaleString()} ج.م
            </div>
            <p className="text-xs text-muted-foreground">تكلفة الورشة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">قيمة الطلبات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.totalValue.toLocaleString()} ج.م
            </div>
            <p className="text-xs text-muted-foreground">إجمالي البيع</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            الطلبات في الورشة / الطباعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : printingOrders?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Printer className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد طلبات في الورشة حالياً</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الطلب</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>المنتجات</TableHead>
                  <TableHead>عدد القطع</TableHead>
                  <TableHead>التكلفة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {printingOrders?.map((order) => {
                  const itemCount = order.order_items.reduce((sum, item) => sum + item.quantity, 0);
                  const orderCost = order.order_items.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
                  
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
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(order.date_created), 'dd/MM/yyyy', { locale: ar })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PrintingOrdersReport;
