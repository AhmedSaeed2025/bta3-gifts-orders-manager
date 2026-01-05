import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  CreditCard, 
  Factory, 
  TrendingUp, 
  Clock,
  Printer,
  ArrowRight,
  Store,
  FileText
} from 'lucide-react';
import FinanceDashboard from '@/components/finance/FinanceDashboard';
import CustomerPaymentsScreen from '@/components/finance/CustomerPaymentsScreen';
import WorkshopPaymentsScreen from '@/components/finance/WorkshopPaymentsScreen';
import OrderProfitabilityScreen from '@/components/finance/OrderProfitabilityScreen';
import PendingMoneyScreen from '@/components/finance/PendingMoneyScreen';
import PrintingOrdersReport from '@/components/finance/PrintingOrdersReport';

const AdminFinance = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'profitability', label: 'الربحية', icon: TrendingUp },
    { id: 'printing-report', label: 'المطبعة', icon: Printer },
    { id: 'customer-payments', label: 'العملاء', icon: CreditCard },
    { id: 'workshop-payments', label: 'الورش', icon: Factory },
    { id: 'pending', label: 'المعلقات', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Mobile Header with Navigation */}
      <div className="lg:hidden sticky top-0 z-50 bg-card border-b">
        <div className="flex items-center justify-between p-3">
          <h1 className="text-lg font-bold">الإدارة المالية</h1>
          <div className="flex items-center gap-2">
            <Link to="/store">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Store className="h-4 w-4" />
                <span className="hidden xs:inline">المتجر</span>
              </Button>
            </Link>
            <Link to="/legacy-admin">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <FileText className="h-4 w-4" />
                <span className="hidden xs:inline">الحسابات</span>
              </Button>
            </Link>
            <Link to="/admin/dashboard">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ArrowRight className="h-4 w-4" />
                <span className="hidden xs:inline">الرجوع</span>
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Mobile Tab Navigation - Horizontal Scroll */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 p-2 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all
                    ${isActive 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }
                  `}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block p-6 border-b">
        <h1 className="text-3xl font-bold">الإدارة المالية</h1>
        <p className="text-sm text-muted-foreground">Cash Flow & Workshops</p>
      </div>

      {/* Content Area */}
      <div className="p-3 lg:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          {/* Desktop Tabs */}
          <TabsList className="hidden lg:grid lg:grid-cols-6 gap-1 p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.id}
                  value={tab.id} 
                  className="flex items-center gap-2 text-sm"
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="dashboard" className="mt-0 lg:mt-4">
            <FinanceDashboard />
          </TabsContent>

          <TabsContent value="profitability" className="mt-0 lg:mt-4">
            <OrderProfitabilityScreen />
          </TabsContent>

          <TabsContent value="printing-report" className="mt-0 lg:mt-4">
            <PrintingOrdersReport />
          </TabsContent>

          <TabsContent value="customer-payments" className="mt-0 lg:mt-4">
            <CustomerPaymentsScreen />
          </TabsContent>

          <TabsContent value="workshop-payments" className="mt-0 lg:mt-4">
            <WorkshopPaymentsScreen />
          </TabsContent>

          <TabsContent value="pending" className="mt-0 lg:mt-4">
            <PendingMoneyScreen />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminFinance;
