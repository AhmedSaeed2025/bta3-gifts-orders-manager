
import React from "react";
import Logo from "@/components/Logo";
import Tabs from "@/components/Tabs";
import OrderForm from "@/components/OrderForm";
import OrdersTable from "@/components/OrdersTable";
import SummaryReport from "@/components/SummaryReport";
import ProfitReport from "@/components/ProfitReport";
import PriceManagement from "@/components/PriceManagement";
import InvoiceTab from "@/components/InvoiceTab";
import ProductsTab from "@/components/ProductsTab";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gift-accent dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-6">
        <Logo />
        
        <Tabs defaultValue="addOrder" className="mt-4 md:mt-6">
          <Tabs.Tab label={isMobile ? "إضافة" : "إضافة طلب"} value="addOrder">
            <OrderForm />
          </Tabs.Tab>
          
          <Tabs.Tab label={isMobile ? "الطلبات" : "جميع الطلبات"} value="orders">
            <OrdersTable />
          </Tabs.Tab>
          
          <Tabs.Tab label="الفاتورة" value="invoice">
            <InvoiceTab />
          </Tabs.Tab>
          
          <Tabs.Tab label={isMobile ? "التقرير" : "تقرير الطلبات"} value="summary">
            <SummaryReport />
          </Tabs.Tab>
          
          <Tabs.Tab label={isMobile ? "الأرباح" : "تقرير الأرباح"} value="profitReport">
            <ProfitReport />
          </Tabs.Tab>
          
          <Tabs.Tab label={isMobile ? "الأسعار" : "أسعار مقترحة"} value="proposedPrices">
            <PriceManagement />
          </Tabs.Tab>
          
          <Tabs.Tab label={isMobile ? "المنتجات" : "إدارة المنتجات"} value="products">
            <ProductsTab />
          </Tabs.Tab>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
