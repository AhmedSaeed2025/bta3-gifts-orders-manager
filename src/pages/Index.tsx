
import React from "react";
import Logo from "@/components/Logo";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/Tabs";
import OrderForm from "@/components/OrderForm";
import OrdersTable from "@/components/OrdersTable";
import SummaryReport from "@/components/SummaryReport";
import ProfitReport from "@/components/ProfitReport";
import PriceManagement from "@/components/PriceManagement";
import InvoiceTab from "@/components/InvoiceTab";
import ProductsTab from "@/components/ProductsTab";
import UserProfile from "@/components/UserProfile";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gift-accent dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto px-2 md:px-4 py-3 md:py-6">
        <div className="flex items-center justify-between mb-4">
          <Logo />
          <UserProfile />
        </div>
        
        <Tabs defaultValue="addOrder" className="mt-2 md:mt-4">
          <TabsList className="grid w-full grid-cols-7 gap-1">
            <TabsTrigger value="addOrder">{isMobile ? "إضافة" : "إضافة طلب"}</TabsTrigger>
            <TabsTrigger value="orders">{isMobile ? "الطلبات" : "جميع الطلبات"}</TabsTrigger>
            <TabsTrigger value="invoice">{isMobile ? "الفاتورة" : "الفاتورة"}</TabsTrigger>
            <TabsTrigger value="summary">{isMobile ? "التقرير" : "تقرير الطلبات"}</TabsTrigger>
            <TabsTrigger value="profitReport">{isMobile ? "الأرباح" : "تقرير الأرباح"}</TabsTrigger>
            <TabsTrigger value="proposedPrices">{isMobile ? "الأسعار" : "أسعار مقترحة"}</TabsTrigger>
            <TabsTrigger value="products">{isMobile ? "المنتجات" : "إدارة المنتجات"}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="addOrder">
            <OrderForm />
          </TabsContent>
          
          <TabsContent value="orders">
            <OrdersTable />
          </TabsContent>
          
          <TabsContent value="invoice">
            <InvoiceTab />
          </TabsContent>
          
          <TabsContent value="summary">
            <SummaryReport />
          </TabsContent>
          
          <TabsContent value="profitReport">
            <ProfitReport />
          </TabsContent>
          
          <TabsContent value="proposedPrices">
            <PriceManagement />
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
