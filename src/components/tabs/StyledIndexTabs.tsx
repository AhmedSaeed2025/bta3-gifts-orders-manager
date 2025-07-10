
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import OrderForm from "../OrderForm";
import InvoiceTab from "../InvoiceTab";
import ImprovedAccountStatement from "../ImprovedAccountStatement";
import SummaryReport from "../SummaryReport";
import ProfitReport from "../ProfitReport";
import MobileProductsManagement from "../admin/MobileProductsManagement";
import { LayoutDashboard, Plus, Receipt, DollarSign, TrendingUp, BarChart3, Package } from "lucide-react";
import Invoice from "../Invoice";

const tabsData = [
  {
    id: "dashboard",
    label: "لوحة التحكم",
    icon: LayoutDashboard,
    component: <SummaryReport />
  },
  {
    id: "add-order",
    label: "إضافة طلب",
    icon: Plus,
    component: <OrderForm />
  },
  {
    id: "invoice",
    label: "الفاتورة",
    icon: Receipt,
    component: <Invoice order={null} />
  },
  {
    id: "account",
    label: "كشف الحساب",
    icon: DollarSign,
    component: <ImprovedAccountStatement />
  },
  {
    id: "profit",
    label: "تقرير الأرباح",
    icon: TrendingUp,
    component: <ProfitReport />
  },
  {
    id: "summary",
    label: "التقارير",
    icon: BarChart3,
    component: <SummaryReport />
  },
  {
    id: "products",
    label: "إدارة المنتجات",
    icon: Package,
    component: <MobileProductsManagement />
  }
];

const StyledIndexTabs = () => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gift-primary/5 to-gift-secondary/5" dir="rtl">
      <Tabs defaultValue="dashboard" className="w-full">
        <div className="bg-white border-b shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto">
            <TabsList className={`grid w-full ${isMobile ? 'grid-cols-3' : 'grid-cols-7'} bg-transparent h-auto p-0`}>
              {tabsData.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={`
                      flex flex-col items-center gap-1 py-3 px-2 data-[state=active]:bg-gift-primary/10 
                      data-[state=active]:text-gift-primary data-[state=active]:border-b-2 
                      data-[state=active]:border-gift-primary rounded-none bg-transparent
                      hover:bg-gift-primary/5 transition-all duration-200
                      ${isMobile ? 'text-xs' : 'text-sm'}
                    `}
                  >
                    <IconComponent className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                    <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} font-medium whitespace-nowrap`}>
                      {tab.label}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4">
          {tabsData.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-0">
              <div className="animate-fade-in">
                {tab.component}
              </div>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
};

export default StyledIndexTabs;
