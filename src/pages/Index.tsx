
import React from "react";
import Logo from "@/components/Logo";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import OrderForm from "@/components/OrderForm";
import OrdersTable from "@/components/OrdersTable";
import SummaryReport from "@/components/SummaryReport";
import ProfitReport from "@/components/ProfitReport";
import InvoiceTab from "@/components/InvoiceTab";
import ProductsTab from "@/components/ProductsTab";
import ImprovedAccountStatement from "@/components/ImprovedAccountStatement";
import UserProfile from "@/components/UserProfile";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Plus, 
  List, 
  BarChart3, 
  TrendingUp, 
  Receipt, 
  FileText, 
  Package 
} from "lucide-react";

const Index = () => {
  const isMobile = useIsMobile();

  const tabs = [
    { 
      id: "addOrder", 
      label: isMobile ? "إضافة" : "إضافة طلب", 
      icon: Plus, 
      component: <OrderForm /> 
    },
    { 
      id: "orders", 
      label: isMobile ? "الطلبات" : "إدارة الطلبات", 
      icon: List, 
      component: <OrdersTable /> 
    },
    { 
      id: "summary", 
      label: isMobile ? "تقرير" : "تقرير الطلبات", 
      icon: BarChart3, 
      component: <SummaryReport /> 
    },
    { 
      id: "profitReport", 
      label: isMobile ? "الأرباح" : "تقرير الأرباح", 
      icon: TrendingUp, 
      component: <ProfitReport /> 
    },
    { 
      id: "accountStatement", 
      label: isMobile ? "الحساب" : "كشف حساب", 
      icon: Receipt, 
      component: <ImprovedAccountStatement /> 
    },
    { 
      id: "invoice", 
      label: isMobile ? "الفاتورة" : "الفاتورة", 
      icon: FileText, 
      component: <InvoiceTab /> 
    },
    { 
      id: "products", 
      label: isMobile ? "المنتجات" : "إدارة المنتجات", 
      icon: Package, 
      component: <ProductsTab /> 
    }
  ];

  return (
    <div className="min-h-screen bg-gift-accent dark:bg-gray-900 transition-colors duration-300" dir="rtl">
      <div className="container mx-auto px-2 md:px-4 py-3 md:py-6">
        <div className="flex items-center justify-between mb-4">
          <Logo />
          <UserProfile />
        </div>
        
        <Tabs defaultValue="addOrder" className="mt-2 md:mt-4">
          <TabsList className={`grid w-full gap-1 ${isMobile ? 'grid-cols-7 h-16' : 'grid-cols-7 h-10'}`}>
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.id}
                value={tab.id} 
                className={`${isMobile ? 'flex-col text-xs p-1 h-14' : 'text-sm'}`}
              >
                {isMobile ? (
                  <>
                    <tab.icon className="h-3 w-3 mb-1" />
                    <span className="text-xs leading-none">{tab.label}</span>
                  </>
                ) : (
                  tab.label
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              {tab.component}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
