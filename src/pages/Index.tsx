
import React from "react";
import Logo from "@/components/Logo";
import Tabs from "@/components/Tabs";
import OrderForm from "@/components/OrderForm";
import OrdersTable from "@/components/OrdersTable";
import SummaryReport from "@/components/SummaryReport";
import ProfitReport from "@/components/ProfitReport";
import PriceManagement from "@/components/PriceManagement";
import InvoiceTab from "@/components/InvoiceTab";

const Index = () => {
  return (
    <div className="min-h-screen bg-gift-accent">
      <div className="container mx-auto px-4 py-6">
        <Logo />
        
        <Tabs defaultValue="addOrder" className="mt-6">
          <Tabs.Tab label="إضافة طلب" value="addOrder">
            <OrderForm />
          </Tabs.Tab>
          
          <Tabs.Tab label="جميع الطلبات" value="orders">
            <OrdersTable />
          </Tabs.Tab>
          
          <Tabs.Tab label="الفاتورة" value="invoice">
            <InvoiceTab />
          </Tabs.Tab>
          
          <Tabs.Tab label="التقرير" value="summary">
            <SummaryReport />
          </Tabs.Tab>
          
          <Tabs.Tab label="تقرير الأرباح والتكاليف" value="profitReport">
            <ProfitReport />
          </Tabs.Tab>
          
          <Tabs.Tab label="أسعار مقترحة" value="proposedPrices">
            <PriceManagement />
          </Tabs.Tab>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
