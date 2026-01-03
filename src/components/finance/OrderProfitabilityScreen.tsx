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
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface OrderFinancialData {
  order_id: string;
  serial: string;
  selling_price: number;
  client_name: string;
  order_status: string;
  date_created: string;
  total_customer_paid: number;
  total_workshop_cost: number;
  paid_workshop_cost: number;
  net_profit_loss: number;
  cash_flow_status: string;
  financial_status: string;
}

const OrderProfitabilityScreen = () => {
  const { user } = useAuth();

  // Fetch order financial view
  const { data: ordersFinancial, isLoading } = useQuery({
    queryKey: ['order-financial-view', user?.id],
    queryFn: async () => {
      // Since we can't directly query the view with RLS, we'll compute it manually
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, serial, total, client_name, status, date_created')
        .eq('user_id', user?.id)
        .order('date_created', { ascending: false });

      if (ordersError) throw ordersError;

      const { data: customerPayments, error: cpError } = await supabase
        .from('customer_payments')
        .select('order_id, amount, payment_status')
        .eq('user_id', user?.id);

      if (cpError) throw cpError;

      const { data: workshopPayments, error: wpError } = await supabase
        .from('workshop_payments')
        .select('order_id, cost_amount, payment_status')
        .eq('user_id', user?.id);

      if (wpError) throw wpError;

      // Calculate financial data for each order
      return orders?.map(order => {
        const orderCustomerPayments = customerPayments?.filter(p => p.order_id === order.id) || [];
        const orderWorkshopPayments = workshopPayments?.filter(p => p.order_id === order.id) || [];

        const totalCustomerPaid = orderCustomerPayments
          .filter(p => p.payment_status === 'Paid' || p.payment_status === 'Partial')
          .reduce((sum, p) => sum + Number(p.amount), 0);

        const totalWorkshopCost = orderWorkshopPayments
          .reduce((sum, p) => sum + Number(p.cost_amount), 0);

        const paidWorkshopCost = orderWorkshopPayments
          .filter(p => p.payment_status === 'Paid')
          .reduce((sum, p) => sum + Number(p.cost_amount), 0);

        const netProfitLoss = totalCustomerPaid - paidWorkshopCost;

        let cashFlowStatus = 'Balanced';
        if (netProfitLoss > 0) cashFlowStatus = 'Positive';
        else if (netProfitLoss < 0) cashFlowStatus = 'Negative';

        let financialStatus = 'Incomplete';
        if (totalCustomerPaid > 0 && totalWorkshopCost > 0) {
          financialStatus = (totalCustomerPaid - totalWorkshopCost) > 0 ? 'Profitable' : 'Loss';
        }

        return {
          order_id: order.id,
          serial: order.serial,
          selling_price: Number(order.total),
          client_name: order.client_name,
          order_status: order.status,
          date_created: order.date_created,
          total_customer_paid: totalCustomerPaid,
          total_workshop_cost: totalWorkshopCost,
          paid_workshop_cost: paidWorkshopCost,
          net_profit_loss: netProfitLoss,
          cash_flow_status: cashFlowStatus,
          financial_status: financialStatus
        } as OrderFinancialData;
      }) || [];
    },
    enabled: !!user
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Profitable':
        return <Badge className="bg-green-500">مربح</Badge>;
      case 'Loss':
        return <Badge variant="destructive">خاسر</Badge>;
      case 'Incomplete':
        return <Badge className="bg-yellow-500">غير مكتمل</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getOrderStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'قيد المراجعة',
      confirmed: 'تم التأكيد',
      processing: 'قيد التحضير',
      shipped: 'تم الشحن',
      delivered: 'تم التوصيل',
      cancelled: 'ملغي'
    };
    return labels[status] || status;
  };

  // Calculate summary
  const summary = {
    profitable: ordersFinancial?.filter(o => o.financial_status === 'Profitable').length || 0,
    loss: ordersFinancial?.filter(o => o.financial_status === 'Loss').length || 0,
    incomplete: ordersFinancial?.filter(o => o.financial_status === 'Incomplete').length || 0,
    totalProfit: ordersFinancial?.reduce((sum, o) => o.financial_status === 'Profitable' ? sum + o.net_profit_loss : sum, 0) || 0,
    totalLoss: ordersFinancial?.reduce((sum, o) => o.financial_status === 'Loss' ? sum + Math.abs(o.net_profit_loss) : sum, 0) || 0
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">طلبات مربحة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.profitable}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">طلبات خاسرة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.loss}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">غير مكتملة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary.incomplete}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأرباح</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.totalProfit.toLocaleString()} ج.م</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الخسائر</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.totalLoss.toLocaleString()} ج.م</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>ربحية الطلبات</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : ordersFinancial?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد طلبات بعد
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الطلب</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>سعر البيع</TableHead>
                  <TableHead>المحصل</TableHead>
                  <TableHead>تكلفة الورشة</TableHead>
                  <TableHead>صافي الربح/الخسارة</TableHead>
                  <TableHead>حالة الطلب</TableHead>
                  <TableHead>الحالة المالية</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersFinancial?.map((order) => (
                  <TableRow key={order.order_id}>
                    <TableCell className="font-medium">{order.serial}</TableCell>
                    <TableCell>{order.client_name}</TableCell>
                    <TableCell>{order.selling_price.toLocaleString()} ج.م</TableCell>
                    <TableCell className="text-green-600">
                      {order.total_customer_paid.toLocaleString()} ج.م
                    </TableCell>
                    <TableCell className="text-red-600">
                      {order.total_workshop_cost.toLocaleString()} ج.م
                    </TableCell>
                    <TableCell className={order.net_profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {order.net_profit_loss.toLocaleString()} ج.م
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getOrderStatusLabel(order.order_status)}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.financial_status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderProfitabilityScreen;
