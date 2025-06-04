import React, { useState } from "react";
import OrderForm from "./OrderForm";
import OrdersTable from "./OrdersTable";
import ProfitReport from "./ProfitReport";
import ProductsTab from "./ProductsTab";
import SummaryReport from "./SummaryReport";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import ImprovedAccountStatement from "./ImprovedAccountStatement";

const Tabs = () => {
  const [activeTab, setActiveTab] = useState("add-order");
  const isMobile = useIsMobile();

  const tabs = [
    { id: "add-order", label: "إضافة طلب" },
    { id: "orders", label: "إدارة الطلبات" },
    { id: "profit-report", label: "تقرير الأرباح" },
    { id: "account-statement", label: "كشف الحساب" },
    { id: "products", label: "المنتجات" },
    { id: "summary", label: "ملخص" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "add-order":
        return <OrderForm />;
      case "orders":
        return <OrdersTable />;
      case "profit-report":
        return <ProfitReport />;
      case "account-statement":
        return <ImprovedAccountStatement />;
      case "products":
        return <ProductsTab />;
      case "summary":
        return <SummaryReport />;
      default:
        return <OrderForm />;
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-0">
        <div className="flex flex-col">
          <div
            className={`flex ${
              isMobile ? "flex-col" : "flex-row"
            } items-center justify-start gap-2 p-2`}
          >
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "outline"}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full ${isMobile ? "text-sm" : "text-base"}`}
              >
                {tab.label}
              </Button>
            ))}
          </div>
          <div className="p-4">{renderContent()}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Tabs;
