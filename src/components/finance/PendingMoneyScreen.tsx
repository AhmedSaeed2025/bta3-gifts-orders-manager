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
import { Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const PendingMoneyScreen = () => {
  const { user } = useAuth();

  // Fetch unpaid customer payments
  const { data: unpaidCustomerPayments, isLoading: loadingCustomer } = useQuery({
    queryKey: ['unpaid-customer-payments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_payments')
        .select('*')
        .eq('user_id', user?.id)
        .eq('payment_status', 'Unpaid')
        .order('payment_date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Fetch due workshop payments
  const { data: dueWorkshopPayments, isLoading: loadingWorkshop } = useQuery({
    queryKey: ['due-workshop-payments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workshop_payments')
        .select('*')
        .eq('user_id', user?.id)
        .eq('payment_status', 'Due')
        .order('expected_payment_date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Fetch orders for reference
  const { data: orders } = useQuery({
    queryKey: ['orders-list', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, serial, client_name')
        .eq('user_id', user?.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  const getOrderSerial = (orderId: string) => {
    const order = orders?.find(o => o.id === orderId);
    return order?.serial || orderId;
  };

  const totalUnpaidFromCustomers = unpaidCustomerPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const totalDueToWorkshops = dueWorkshopPayments?.reduce((sum, p) => sum + Number(p.cost_amount), 0) || 0;

  const isLoading = loadingCustomer || loadingWorkshop;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              مستحقات من العملاء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {totalUnpaidFromCustomers.toLocaleString()} ج.م
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {unpaidCustomerPayments?.length || 0} دفعة في انتظار التحصيل
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              مستحقات للورش
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {totalDueToWorkshops.toLocaleString()} ج.م
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {dueWorkshopPayments?.length || 0} دفعة في انتظار السداد
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Unpaid Customer Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-yellow-500" />
            مدفوعات العملاء غير المحصلة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : unpaidCustomerPayments?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              🎉 لا توجد مستحقات من العملاء
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الطلب</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>طريقة الدفع</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>تاريخ الاستحقاق</TableHead>
                  <TableHead>ملاحظات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unpaidCustomerPayments?.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {getOrderSerial(payment.order_id)}
                    </TableCell>
                    <TableCell>{payment.customer_name}</TableCell>
                    <TableCell>{payment.payment_method}</TableCell>
                    <TableCell className="text-yellow-600 font-semibold">
                      {Number(payment.amount).toLocaleString()} ج.م
                    </TableCell>
                    <TableCell>
                      {format(new Date(payment.payment_date), 'dd/MM/yyyy', { locale: ar })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Due Workshop Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-orange-500" />
            مستحقات الورش غير المدفوعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : dueWorkshopPayments?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              🎉 لا توجد مستحقات للورش
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الورشة</TableHead>
                  <TableHead>رقم الطلب</TableHead>
                  <TableHead>المنتج</TableHead>
                  <TableHead>المقاس</TableHead>
                  <TableHead>التكلفة</TableHead>
                  <TableHead>تاريخ السداد المتوقع</TableHead>
                  <TableHead>ملاحظات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dueWorkshopPayments?.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.workshop_name}</TableCell>
                    <TableCell>{getOrderSerial(payment.order_id)}</TableCell>
                    <TableCell>{payment.product_name}</TableCell>
                    <TableCell>{payment.size_or_variant || '-'}</TableCell>
                    <TableCell className="text-orange-600 font-semibold">
                      {Number(payment.cost_amount).toLocaleString()} ج.م
                    </TableCell>
                    <TableCell>
                      {payment.expected_payment_date 
                        ? format(new Date(payment.expected_payment_date), 'dd/MM/yyyy', { locale: ar })
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.notes || '-'}
                    </TableCell>
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

export default PendingMoneyScreen;
