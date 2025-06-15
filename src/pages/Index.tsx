
import React from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "@/components/Logo";
import UserProfile from "@/components/UserProfile";
import OrderForm from "@/components/OrderForm";
import OrdersTable from "@/components/OrdersTable";
import SummaryReport from "@/components/SummaryReport";
import ProfitReport from "@/components/ProfitReport";
import ImprovedAccountStatement from "@/components/ImprovedAccountStatement";
import InvoiceTab from "@/components/InvoiceTab";
import ProductsTab from "@/components/ProductsTab";
import WebhookTab from "@/components/WebhookTab";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Plus,
  List,
  BarChart3,
  TrendingUp,
  Receipt,
  FileText,
  Package,
  Globe,
} from "lucide-react";

const navLinks = [
  { to: "/", label: "المتجر" },
  { to: "/admin/dashboard", label: "لوحة التحكم" },
  { to: "/legacy-admin", label: "برنامج الحسابات" },
];

const AccountsNavbar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  
  return (
    <nav className={`w-full bg-white border-b mb-4 md:mb-6 shadow-sm ${isMobile ? 'mobile-warm-bg' : ''}`}>
      <div className={`max-w-7xl mx-auto px-2 md:px-4 flex items-center ${isMobile ? 'flex-col gap-2 py-2' : 'gap-2 h-14'}`}>
        {navLinks.map((link) => {
          const isActive =
            link.to === "/legacy-admin"
              ? location.pathname.startsWith("/legacy-admin")
              : location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`${isMobile ? 'w-full text-center' : ''} px-3 md:px-4 py-2 rounded transition-all font-medium text-sm md:text-base ${
                isActive
                  ? `${isMobile ? 'mobile-warm-button' : 'bg-primary'} text-white shadow-md`
                  : `text-gray-700 hover:bg-gray-100 ${isMobile ? 'mobile-warm-border border' : ''}`
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <div className={`${isMobile ? 'mobile-warm-bg' : ''}`}>
      <AccountsNavbar />
      <div className={`min-h-screen transition-colors duration-300 ${isMobile ? 'mobile-warm-bg' : 'bg-gift-accent dark:bg-gray-900'}`} dir="rtl">
        <div className={`container mx-auto px-2 md:px-4 py-2 md:py-6 ${isMobile ? 'max-w-full' : ''}`} dir="rtl">
          <div className={`flex items-center justify-between mb-3 md:mb-4 ${isMobile ? 'px-2' : ''}`} dir="rtl">
            <Logo />
            <UserProfile />
          </div>
          
          <Tabs defaultValue="addOrder" className="mt-2 md:mt-4" dir="rtl">
            <TabsList className={`grid w-full ${isMobile ? 'grid-cols-4 gap-1 h-auto p-1 mobile-warm-tabs' : 'grid-cols-8 gap-1 h-10'}`} dir="rtl">
              <TabsTrigger 
                value="addOrder" 
                className={`${isMobile ? 'flex-col text-xs p-2 h-16 mobile-warm-tab-inactive data-[state=active]:mobile-warm-tab-active' : 'text-sm'}`}
              >
                {isMobile ? (
                  <>
                    <Plus className="h-4 w-4 mb-1" />
                    <span className="text-xs leading-tight">إضافة</span>
                  </>
                ) : (
                  "إضافة طلب"
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="orders" 
                className={`${isMobile ? 'flex-col text-xs p-2 h-16 mobile-warm-tab-inactive data-[state=active]:mobile-warm-tab-active' : 'text-sm'}`}
              >
                {isMobile ? (
                  <>
                    <List className="h-4 w-4 mb-1" />
                    <span className="text-xs leading-tight">الطلبات</span>
                  </>
                ) : (
                  "إدارة الطلبات"
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="summary" 
                className={`${isMobile ? 'flex-col text-xs p-2 h-16 mobile-warm-tab-inactive data-[state=active]:mobile-warm-tab-active' : 'text-sm'}`}
              >
                {isMobile ? (
                  <>
                    <BarChart3 className="h-4 w-4 mb-1" />
                    <span className="text-xs leading-tight">تقرير</span>
                  </>
                ) : (
                  "تقرير الطلبات"
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="profitReport" 
                className={`${isMobile ? 'flex-col text-xs p-2 h-16 mobile-warm-tab-inactive data-[state=active]:mobile-warm-tab-active' : 'text-sm'}`}
              >
                {isMobile ? (
                  <>
                    <TrendingUp className="h-4 w-4 mb-1" />
                    <span className="text-xs leading-tight">الأرباح</span>
                  </>
                ) : (
                  "تقرير الأرباح"
                )}
              </TabsTrigger>
              
              {!isMobile && (
                <>
                  <TabsTrigger 
                    value="accountStatement" 
                    className="text-sm"
                  >
                    "كشف حساب"
                  </TabsTrigger>
                  <TabsTrigger 
                    value="invoice" 
                    className="text-sm"
                  >
                    "الفاتورة"
                  </TabsTrigger>
                  <TabsTrigger 
                    value="products" 
                    className="text-sm"
                  >
                    "إدارة المنتجات"
                  </TabsTrigger>
                  <TabsTrigger 
                    value="webhook" 
                    className="text-sm"
                  >
                    "Webhook"
                  </TabsTrigger>
                </>
              )}
            </TabsList>
            
            {isMobile && (
              <TabsList className="grid w-full grid-cols-4 gap-1 h-auto p-1 mt-2 mobile-warm-tabs" dir="rtl">
                <TabsTrigger 
                  value="accountStatement" 
                  className="flex-col text-xs p-2 h-16 mobile-warm-tab-inactive data-[state=active]:mobile-warm-tab-active"
                >
                  <Receipt className="h-4 w-4 mb-1" />
                  <span className="text-xs leading-tight">الحساب</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="invoice" 
                  className="flex-col text-xs p-2 h-16 mobile-warm-tab-inactive data-[state=active]:mobile-warm-tab-active"
                >
                  <FileText className="h-4 w-4 mb-1" />
                  <span className="text-xs leading-tight">الفاتورة</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="products" 
                  className="flex-col text-xs p-2 h-16 mobile-warm-tab-inactive data-[state=active]:mobile-warm-tab-active"
                >
                  <Package className="h-4 w-4 mb-1" />
                  <span className="text-xs leading-tight">المنتجات</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="webhook" 
                  className="flex-col text-xs p-2 h-16 mobile-warm-tab-inactive data-[state=active]:mobile-warm-tab-active"
                >
                  <Globe className="h-4 w-4 mb-1" />
                  <span className="text-xs leading-tight">Webhook</span>
                </TabsTrigger>
              </TabsList>
            )}
            
            <div className={`${isMobile ? 'px-1 mt-2' : ''}`}>
              <TabsContent value="addOrder" className={isMobile ? 'mobile-warm-card rounded-lg' : ''}>
                <OrderForm />
              </TabsContent>
              
              <TabsContent value="orders" className={isMobile ? 'mobile-warm-card rounded-lg' : ''}>
                <OrdersTable />
              </TabsContent>
              
              <TabsContent value="summary" className={isMobile ? 'mobile-warm-card rounded-lg' : ''}>
                <SummaryReport />
              </TabsContent>
              
              <TabsContent value="profitReport" className={isMobile ? 'mobile-warm-card rounded-lg' : ''}>
                <ProfitReport />
              </TabsContent>
              
              <TabsContent value="accountStatement" className={isMobile ? 'mobile-warm-card rounded-lg' : ''}>
                <ImprovedAccountStatement />
              </TabsContent>
              
              <TabsContent value="invoice" className={isMobile ? 'mobile-warm-card rounded-lg' : ''}>
                <InvoiceTab />
              </TabsContent>
              
              <TabsContent value="products" className={isMobile ? 'mobile-warm-card rounded-lg' : ''}>
                <ProductsTab />
              </TabsContent>
              
              <TabsContent value="webhook" className={isMobile ? 'mobile-warm-card rounded-lg' : ''}>
                <WebhookTab />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;
