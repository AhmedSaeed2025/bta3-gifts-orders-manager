import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, 
  CreditCard, 
  Factory, 
  TrendingUp, 
  Clock,
  Printer
} from 'lucide-react';
import FinanceDashboard from '@/components/finance/FinanceDashboard';
import CustomerPaymentsScreen from '@/components/finance/CustomerPaymentsScreen';
import WorkshopPaymentsScreen from '@/components/finance/WorkshopPaymentsScreen';
import OrderProfitabilityScreen from '@/components/finance/OrderProfitabilityScreen';
import PendingMoneyScreen from '@/components/finance/PendingMoneyScreen';
import PrintingOrdersReport from '@/components/finance/PrintingOrdersReport';

const AdminFinance = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6" dir="rtl">
      {/* Header - Responsive */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold">الإدارة المالية</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Cash Flow & Workshops</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 sm:space-y-4">
        {/* Mobile: Horizontal scrollable tabs */}
        <div className="w-full overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-max sm:w-full sm:grid sm:grid-cols-6 gap-1 p-1 min-w-max">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm whitespace-nowrap"
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              <span>لوحة التحكم</span>
            </TabsTrigger>
            <TabsTrigger 
              value="profitability" 
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm whitespace-nowrap"
            >
              <TrendingUp className="h-4 w-4 shrink-0" />
              <span>الربحية</span>
            </TabsTrigger>
            <TabsTrigger 
              value="printing-report" 
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm whitespace-nowrap"
            >
              <Printer className="h-4 w-4 shrink-0" />
              <span>الورشة</span>
            </TabsTrigger>
            <TabsTrigger 
              value="customer-payments" 
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm whitespace-nowrap"
            >
              <CreditCard className="h-4 w-4 shrink-0" />
              <span>العملاء</span>
            </TabsTrigger>
            <TabsTrigger 
              value="workshop-payments" 
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm whitespace-nowrap"
            >
              <Factory className="h-4 w-4 shrink-0" />
              <span>الورش</span>
            </TabsTrigger>
            <TabsTrigger 
              value="pending" 
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm whitespace-nowrap"
            >
              <Clock className="h-4 w-4 shrink-0" />
              <span>المعلقات</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard">
          <FinanceDashboard />
        </TabsContent>

        <TabsContent value="profitability">
          <OrderProfitabilityScreen />
        </TabsContent>

        <TabsContent value="printing-report">
          <PrintingOrdersReport />
        </TabsContent>

        <TabsContent value="customer-payments">
          <CustomerPaymentsScreen />
        </TabsContent>

        <TabsContent value="workshop-payments">
          <WorkshopPaymentsScreen />
        </TabsContent>

        <TabsContent value="pending">
          <PendingMoneyScreen />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminFinance;
