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

  // Fetch orders for alerts - all orders automatically appear
  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ['orders-for-alerts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, serial, total, status, client_name, date_created, profit')
        .eq('user_id', user?.id)
        .order('date_created', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Fetch printing orders count
  const printingStatuses = ['processing', 'sentToPrinter', 'sent_to_printing', 'printing_received', 'readyForDelivery'];
  const printingOrdersCount = orders?.filter(o => printingStatuses.includes(o.status)).length || 0;

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
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Cards - Mobile: 2 cols, Desktop: 4 cols */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        <Card className="p-0">
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">النقد الداخل</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-base sm:text-2xl font-bold text-green-600">
              {totalCashIn.toLocaleString()}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">ج.م</p>
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">النقد الخارج</CardTitle>
            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-base sm:text-2xl font-bold text-red-600">
              {totalCashOut.toLocaleString()}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">ج.م</p>
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">صافي التدفق</CardTitle>
            <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className={`text-base sm:text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netCashFlow.toLocaleString()}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {netCashFlow >= 0 ? 'إيجابي' : 'سلبي'}
            </p>
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">الربح/الخسارة</CardTitle>
            <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className={`text-base sm:text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netCashFlow >= 0 ? 'ربح' : 'خسارة'}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">فعلي</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Summary - Mobile: 2 cols */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <Card className="p-0 border-yellow-200 bg-yellow-50/30 dark:bg-yellow-950/10">
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">من العملاء</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-base sm:text-2xl font-bold text-yellow-600">
              {pendingFromCustomers.toLocaleString()}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">مستحقات</p>
          </CardContent>
        </Card>

        <Card className="p-0 border-orange-200 bg-orange-50/30 dark:bg-orange-950/10">
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">للورش</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-base sm:text-2xl font-bold text-orange-600">
              {pendingToWorkshops.toLocaleString()}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">مستحقات</p>
          </CardContent>
        </Card>
      </div>

      {/* Smart Alerts - Compact on mobile */}
      {alerts.length > 0 && (
        <div className="space-y-2 sm:space-y-4">
          <h3 className="text-sm sm:text-lg font-semibold">تنبيهات ذكية</h3>
          {alerts.map((alert, index) => (
            <Alert key={index} variant={alert.type === 'error' ? 'destructive' : 'default'} className="py-2 sm:py-3">
              <div className="flex items-start gap-2">
                {alert.type === 'warning' && <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5" />}
                {alert.type === 'error' && <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5" />}
                {alert.type === 'info' && <Clock className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5" />}
                <div>
                  <AlertTitle className="text-xs sm:text-sm">
                    {alert.type === 'warning' && 'تحذير'}
                    {alert.type === 'error' && 'خطأ'}
                    {alert.type === 'info' && 'معلومة'}
                  </AlertTitle>
                  <AlertDescription className="text-xs sm:text-sm">{alert.message}</AlertDescription>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* Quick Stats - Mobile: 2x2 grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        <Card className="p-0">
          <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
              الطلبات
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{orders?.length || 0}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">إجمالي</p>
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
              تم التوصيل
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {orders?.filter(o => o.status === 'delivered').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="p-0 border-orange-200 bg-orange-50/30 dark:bg-orange-950/10">
          <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
              في الورشة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-orange-600">{printingOrdersCount}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">طباعة</p>
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
              قيد التنفيذ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">
              {orders?.filter(o => !['delivered', 'cancelled'].includes(o.status)).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinanceDashboard;
