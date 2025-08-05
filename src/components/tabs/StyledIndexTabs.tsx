
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  Plus, 
  Receipt, 
  FileText, 
  Truck, 
  Calculator,
  Settings,
  Printer,
  FileBarChart
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import EnhancedAdminDashboard from "@/components/admin/EnhancedAdminDashboard";
import OrderForm from "@/components/OrderForm";
import ProductsManagementPro from "@/components/ProductsManagementPro";
import AdminOrders from "@/pages/admin/AdminOrders";
import ImprovedShippingReport from "@/components/admin/ImprovedShippingReport";
import DetailedOrdersReport from "@/components/admin/DetailedOrdersReport";
import ComprehensiveAccountStatement from "@/components/admin/ComprehensiveAccountStatement";
import ModernAccountStatement from "@/components/admin/ModernAccountStatement";
import ImprovedInvoiceTab from "@/components/ImprovedInvoiceTab";
import AdminSettings from "@/pages/admin/AdminSettings";
import PrintingReport from "@/components/admin/PrintingReport";

const StyledIndexTabs = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("dashboard");

  const tabs = [
    {
      id: "dashboard",
      label: "لوحة التحكم",
      icon: BarChart3,
      component: <EnhancedAdminDashboard />
    },
    {
      id: "add-order",
      label: "إضافة طلب",
      icon: Plus,
      component: <OrderForm />
    },
    {
      id: "orders-management",
      label: "إدارة الطلبات",
      icon: ShoppingCart,
      component: <AdminOrders />
    },
    {
      id: "products",
      label: "إدارة المنتجات",
      icon: Package,
      component: <ProductsManagementPro />
    },
    {
      id: "orders-report",
      label: "تقرير الطلبات",
      icon: FileText,
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
      icon: Calculator,
      component: <ComprehensiveAccountStatement />
    },
    {
      id: "modern-account-statement",
      label: "كشف حساب محدث",
      icon: FileBarChart,
      component: <ModernAccountStatement />
    },
    {
      id: "printing-report",
      label: "المطبعة",
      icon: Printer,
      component: <PrintingReport />
    },
    {
      id: "invoice",
      label: "الفاتورة",
      icon: Receipt,
      component: <ImprovedInvoiceTab />
    },
    {
      id: "settings",
      label: "الإعدادات",
      icon: Settings,
      component: <AdminSettings />
    }
  ];

  return (
    <div className="w-full" dir="rtl">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList 
          className={`
            grid w-full mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 
            dark:from-blue-900/20 dark:to-indigo-900/20 p-1 rounded-xl
            ${isMobile ? 'grid-cols-3 gap-1' : 'grid-cols-11 gap-2'}
            ${isMobile ? 'h-auto' : 'h-14'}
          `}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200
                  data-[state=active]:bg-white data-[state=active]:shadow-md
                  data-[state=active]:text-blue-600 hover:bg-white/50
                  ${isMobile ? 'flex-col text-xs min-h-[60px]' : 'flex-row text-sm min-h-[48px]'}
                  font-medium
                `}
              >
                <Icon className={isMobile ? "h-4 w-4" : "h-5 w-5"} />
                <span className={isMobile ? "text-[10px] leading-tight text-center" : "text-sm"}>
                  {tab.label}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent 
            key={tab.id} 
            value={tab.id} 
            className="mt-0 space-y-4"
          >
            {tab.component}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default StyledIndexTabs;
