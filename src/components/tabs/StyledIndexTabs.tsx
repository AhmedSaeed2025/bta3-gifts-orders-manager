
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { 
  Package, 
  ShoppingCart, 
  BarChart3, 
  TrendingUp,
  Truck,
  LayoutDashboard,
  FolderOpen,
  Calculator
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

import OrderForm from "@/components/OrderForm";
import MobileProductsManagement from "@/components/admin/MobileProductsManagement";
import DetailedOrdersReport from "@/components/admin/DetailedOrdersReport";
import ImprovedShippingReport from "@/components/admin/ImprovedShippingReport";
import EnhancedAdminDashboard from "@/components/admin/EnhancedAdminDashboard";
import AdminOrders from "@/pages/admin/AdminOrders";

const StyledIndexTabs = () => {
  const isMobile = useIsMobile();

  const tabItems = [
    {
      id: "dashboard",
      label: "لوحة التحكم",
      icon: LayoutDashboard,
      component: <EnhancedAdminDashboard />
    },
    {
      id: "add-order",
      label: "إضافة طلب",
      icon: ShoppingCart,
      component: <OrderForm />
    },
    {
      id: "orders",
      label: "إدارة الطلبات",
      icon: FolderOpen,
      component: <AdminOrders />
    },
    {
      id: "products",
      label: "إدارة المنتجات",
      icon: Package,
      component: <MobileProductsManagement />
    },
    {
      id: "reports",
      label: "تقرير الطلبات",
      icon: BarChart3,
      component: <DetailedOrdersReport />
    },
    {
      id: "shipping",
      label: "تقرير الشحن",
      icon: Truck,
      component: <ImprovedShippingReport />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-4 space-y-4">
        <div className="text-center py-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Calculator className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              برنامج الحسابات المتقدم
            </h1>
          </div>
          <p className="text-muted-foreground">إدارة شاملة لمشروعك التجاري</p>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className={`
              grid w-full gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg
              ${isMobile ? 'grid-cols-3 h-auto' : 'grid-cols-6 h-12'}
            `}>
              {tabItems.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={`
                    flex items-center gap-2 rounded-md transition-all duration-200
                    data-[state=active]:bg-white data-[state=active]:shadow-md
                    data-[state=active]:text-primary font-medium
                    hover:bg-white/60 hover:shadow-sm
                    ${isMobile ? 'flex-col py-3 px-2 text-xs min-h-[60px]' : 'flex-row py-2 px-3 text-sm'}
                  `}
                >
                  <tab.icon className={isMobile ? "h-4 w-4" : "h-4 w-4"} />
                  <span className={isMobile ? "text-center leading-tight" : ""}>
                    {tab.label}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {tabItems.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="mt-6">
                <div className="animate-in fade-in-50 duration-300">
                  {tab.component}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default StyledIndexTabs;
