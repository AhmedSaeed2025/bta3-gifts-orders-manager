import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const FinanceDashboard = () => {
  const { user } = useAuth();

  // Fetch customer payments summary
  const { data: customerPayments, isLoading: loadingCustomer } = useQuery({
    queryKey: ['customer-payments-summary', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_payments')
        .select('amount, payment_status')
        .eq('user_id', user?.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Fetch workshop payments summary
  const { data: workshopPayments, isLoading: loadingWorkshop } = useQuery({
    queryKey: ['workshop-payments-summary', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workshop_payments')
        .select('cost_amount, payment_status')
        .eq('user_id', user?.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Fetch orders for alerts
  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ['orders-for-alerts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, serial, total, status, client_name')
        .eq('user_id', user?.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Calculate totals
  const totalCashIn = customerPayments?.reduce((sum, p) => 
    p.payment_status === 'Paid' || p.payment_status === 'Partial' 
      ? sum + Number(p.amount) 
      : sum, 0) || 0;

  const totalCashOut = workshopPayments?.reduce((sum, p) => 
    p.payment_status === 'Paid' 
      ? sum + Number(p.cost_amount) 
      : sum, 0) || 0;

  const netCashFlow = totalCashIn - totalCashOut;

  const pendingFromCustomers = customerPayments?.reduce((sum, p) => 
    p.payment_status === 'Unpaid' 
      ? sum + Number(p.amount) 
      : sum, 0) || 0;

  const pendingToWorkshops = workshopPayments?.reduce((sum, p) => 
    p.payment_status === 'Due' 
      ? sum + Number(p.cost_amount) 
      : sum, 0) || 0;

  // Generate smart alerts
  const alerts: { type: 'warning' | 'error' | 'info'; message: string }[] = [];
  
  // Check for delivered orders without payments
  const deliveredOrders = orders?.filter(o => o.status === 'delivered') || [];
  const ordersWithPayments = new Set(customerPayments?.map(p => p) || []);
  
  if (pendingFromCustomers > 0) {
    alerts.push({
      type: 'warning',
      message: `هناك ${pendingFromCustomers.toLocaleString()} ج.م مستحقات من العملاء لم يتم تحصيلها`
    });
  }

  if (pendingToWorkshops > 0) {
    alerts.push({
      type: 'info',
      message: `هناك ${pendingToWorkshops.toLocaleString()} ج.م مستحقات للورش لم يتم سدادها`
    });
  }

  const isLoading = loadingCustomer || loadingWorkshop || loadingOrders;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي النقد الداخل</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalCashIn.toLocaleString()} ج.م
            </div>
            <p className="text-xs text-muted-foreground">
              من مدفوعات العملاء
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي النقد الخارج</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {totalCashOut.toLocaleString()} ج.م
            </div>
            <p className="text-xs text-muted-foreground">
              لمدفوعات الورش
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">صافي التدفق النقدي</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netCashFlow.toLocaleString()} ج.م
            </div>
            <p className="text-xs text-muted-foreground">
              {netCashFlow >= 0 ? 'إيجابي' : 'سلبي'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">الربح/الخسارة</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netCashFlow >= 0 ? 'ربح' : 'خسارة'}
            </div>
            <p className="text-xs text-muted-foreground">
              بناءً على الحركة النقدية الفعلية
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">مستحقات من العملاء</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingFromCustomers.toLocaleString()} ج.م
            </div>
            <p className="text-xs text-muted-foreground">
              في انتظار التحصيل
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">مستحقات للورش</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {pendingToWorkshops.toLocaleString()} ج.م
            </div>
            <p className="text-xs text-muted-foreground">
              في انتظار السداد
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Smart Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">تنبيهات ذكية</h3>
          {alerts.map((alert, index) => (
            <Alert key={index} variant={alert.type === 'error' ? 'destructive' : 'default'}>
              {alert.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
              {alert.type === 'error' && <XCircle className="h-4 w-4" />}
              {alert.type === 'info' && <Clock className="h-4 w-4" />}
              <AlertTitle>
                {alert.type === 'warning' && 'تحذير'}
                {alert.type === 'error' && 'خطأ'}
                {alert.type === 'info' && 'معلومة'}
              </AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              طلبات مربحة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders?.filter(o => o.status === 'delivered').length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              طلبات خاسرة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              طلبات غير مكتملة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders?.filter(o => o.status !== 'delivered').length || 0}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinanceDashboard;
