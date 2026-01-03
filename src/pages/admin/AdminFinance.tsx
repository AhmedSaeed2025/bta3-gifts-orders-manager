import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, 
  CreditCard, 
  Factory, 
  TrendingUp, 
  Clock 
} from 'lucide-react';
import FinanceDashboard from '@/components/finance/FinanceDashboard';
import CustomerPaymentsScreen from '@/components/finance/CustomerPaymentsScreen';
import WorkshopPaymentsScreen from '@/components/finance/WorkshopPaymentsScreen';
import OrderProfitabilityScreen from '@/components/finance/OrderProfitabilityScreen';
import PendingMoneyScreen from '@/components/finance/PendingMoneyScreen';

const AdminFinance = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">الإدارة المالية</h1>
          <p className="text-muted-foreground">Cash Flow & Workshops</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="dashboard" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">لوحة التحكم</span>
          </TabsTrigger>
          <TabsTrigger value="customer-payments" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">مدفوعات العملاء</span>
          </TabsTrigger>
          <TabsTrigger value="workshop-payments" className="gap-2">
            <Factory className="h-4 w-4" />
            <span className="hidden sm:inline">مدفوعات الورش</span>
          </TabsTrigger>
          <TabsTrigger value="profitability" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">ربحية الطلبات</span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">المعلقات</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <FinanceDashboard />
        </TabsContent>

        <TabsContent value="customer-payments">
          <CustomerPaymentsScreen />
        </TabsContent>

        <TabsContent value="workshop-payments">
          <WorkshopPaymentsScreen />
        </TabsContent>

        <TabsContent value="profitability">
          <OrderProfitabilityScreen />
        </TabsContent>

        <TabsContent value="pending">
          <PendingMoneyScreen />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminFinance;
