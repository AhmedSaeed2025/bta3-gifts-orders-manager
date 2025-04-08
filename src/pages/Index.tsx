
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Logo from "@/components/Logo";
import OrderForm from "@/components/OrderForm";
import OrdersTable from "@/components/OrdersTable";
import PriceManagement from "@/components/PriceManagement";
import SummaryReport from "@/components/SummaryReport";
import ProfitReport from "@/components/ProfitReport";
import InvoiceTab from "@/components/InvoiceTab";
import ProductsManagement from "@/components/ProductsManagement";

const Index = () => {
  return (
    <div className="min-h-screen bg-gift-accent dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto px-4 py-6">
        <Logo />
        
        <div className="mt-8">
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="w-full mb-6 flex flex-wrap gap-2">
              <TabsTrigger value="orders">الطلبات</TabsTrigger>
              <TabsTrigger value="add-order">إضافة طلب</TabsTrigger>
              <TabsTrigger value="products">المنتجات</TabsTrigger>
              <TabsTrigger value="prices">الأسعار</TabsTrigger>
              <TabsTrigger value="invoice">الفواتير</TabsTrigger>
              <TabsTrigger value="report">تقرير عام</TabsTrigger>
              <TabsTrigger value="profit">الأرباح والتكاليف</TabsTrigger>
            </TabsList>
            
            <TabsContent value="orders" className="space-y-4">
              <OrdersTable />
            </TabsContent>
            
            <TabsContent value="add-order" className="space-y-4">
              <OrderForm />
            </TabsContent>
            
            <TabsContent value="products" className="space-y-4">
              <ProductsManagement />
            </TabsContent>
            
            <TabsContent value="prices" className="space-y-4">
              <PriceManagement />
            </TabsContent>
            
            <TabsContent value="invoice" className="space-y-4">
              <InvoiceTab />
            </TabsContent>
            
            <TabsContent value="report" className="space-y-4">
              <SummaryReport />
            </TabsContent>
            
            <TabsContent value="profit" className="space-y-4">
              <ProfitReport />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;
