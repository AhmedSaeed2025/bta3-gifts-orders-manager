
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  BarChart3, 
  FileText, 
  FolderOpen, 
  Package, 
  Printer,
  TrendingUp,
  Truck,
  Receipt,
  DollarSign
} from "lucide-react";

import OrderForm from "@/components/OrderForm";
import MobileProductsManagement from "@/components/admin/MobileProductsManagement";
import DetailedOrdersReport from "@/components/admin/DetailedOrdersReport";
import ImprovedShippingReport from "@/components/admin/ImprovedShippingReport";
import EnhancedAdminDashboard from "@/components/admin/EnhancedAdminDashboard";
import AdminOrders from "@/pages/admin/AdminOrders";
import InvoiceTab from "@/components/InvoiceTab";
import ImprovedAccountStatement from "@/components/ImprovedAccountStatement";

const StyledIndexTabs = () => {
  const isMobile = useIsMobile();

  const tabs = [
    {
      id: "dashboard",
      label: "لوحة التحكم",
      icon: BarChart3,
      component: <EnhancedAdminDashboard />
    },
    {
      id: "new-order",
      label: "إضافة طلب",
      icon: FileText,
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
      id: "invoice",
      label: "طباعة الفاتورة",
      icon: Printer,
      component: <InvoiceTab />
    },
    {
      id: "orders-report",
      label: "تقرير الطلبات",
      icon: TrendingUp,
      component: <DetailedOrdersReport />
    },
    {
      id: "shipping-report",
      label: "تقرير الشحن",
      icon: Truck,
      component: <ImprovedShippingReport />
    },
    {
      id: "account-statement",
      label: "كشف الحساب",
      icon: DollarSign,
      component: <ImprovedAccountStatement />
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6" dir="rtl">
      <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-l-4 border-l-blue-500 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className={`font-bold text-slate-800 dark:text-white ${isMobile ? "text-lg" : "text-2xl"}`}>
            برنامج إدارة الطلبات المتقدم
          </CardTitle>
          <p className={`text-slate-600 dark:text-slate-400 ${isMobile ? "text-sm" : "text-base"}`}>
            نظام شامل لإدارة الطلبات والمنتجات والحسابات
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2 h-auto gap-1' : 'grid-cols-8'} bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 p-2 rounded-xl shadow-lg`}>
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={`
                  ${isMobile ? 'flex-col gap-1 h-16 text-xs p-2' : 'flex-row gap-2 h-12 text-sm px-4'}
                  bg-white/60 dark:bg-slate-600/60 
                  hover:bg-white/80 dark:hover:bg-slate-500/80
                  data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600
                  data-[state=active]:text-white data-[state=active]:shadow-lg
                  data-[state=active]:border-2 data-[state=active]:border-white/20
                  transition-all duration-300 ease-in-out
                  rounded-lg font-medium
                  border border-slate-200 dark:border-slate-600
                  text-slate-700 dark:text-slate-200
                  shadow-sm hover:shadow-md
                `}
              >
                <IconComponent className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} flex-shrink-0`} />
                <span className="truncate leading-tight">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-6">
            <div className="animate-in fade-in-50 duration-500">
              {tab.component}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default StyledIndexTabs;
