
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

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gift-accent dark:bg-gray-900 transition-colors duration-300" dir="rtl">
      <div className="container mx-auto px-2 md:px-4 py-3 md:py-6" dir="rtl">
        <div className="flex items-center justify-between mb-4" dir="rtl">
          <Logo />
          <UserProfile />
        </div>
        
        <Tabs defaultValue="addOrder" className="mt-2 md:mt-4" dir="rtl">
          <TabsList className="grid w-full grid-cols-7 gap-1" dir="rtl">
            <TabsTrigger value="addOrder">{isMobile ? "إضافة طلب" : "إضافة طلب"}</TabsTrigger>
            <TabsTrigger value="orders">{isMobile ? "إدارة الطلبات" : "إدارة الطلبات"}</TabsTrigger>
            <TabsTrigger value="summary">{isMobile ? "تقرير الطلبات" : "تقرير الطلبات"}</TabsTrigger>
            <TabsTrigger value="profitReport">{isMobile ? "تقرير الأرباح" : "تقرير الأرباح"}</TabsTrigger>
            <TabsTrigger value="accountStatement">{isMobile ? "كشف حساب" : "كشف حساب"}</TabsTrigger>
            <TabsTrigger value="invoice">{isMobile ? "الفاتورة" : "الفاتورة"}</TabsTrigger>
            <TabsTrigger value="products">{isMobile ? "إدارة المنتجات" : "إدارة المنتجات"}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="addOrder">
            <OrderForm />
          </TabsContent>
          
          <TabsContent value="orders">
            <OrdersTable />
          </TabsContent>
          
          <TabsContent value="summary">
            <SummaryReport />
          </TabsContent>
          
          <TabsContent value="profitReport">
            <ProfitReport />
          </TabsContent>
          
          <TabsContent value="accountStatement">
            <ImprovedAccountStatement />
          </TabsContent>
          
          <TabsContent value="invoice">
            <InvoiceTab />
          </TabsContent>
          
          <TabsContent value="products">
            <ProductsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
