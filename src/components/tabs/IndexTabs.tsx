
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrdersTable from "../OrdersTable";
import AddOrderDialog from "../AddOrderDialog";
import SummaryReport from "../SummaryReport";
import ProfitReport from "../ProfitReport";
import ImprovedAccountStatement from "../ImprovedAccountStatement";
import ProductsManagementAdvanced from "../ProductsManagementAdvanced";
import InvoiceTab from "../InvoiceTab";
import { Plus, Package, FileText, TrendingUp, Receipt, ShoppingBag, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";

const IndexTabs = () => {
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
  const { refreshOrders } = useSupabaseOrders();

  const handleOrderAdded = () => {
    refreshOrders();
    setIsAddOrderOpen(false);
  };

  return (
    <Tabs defaultValue="orders" className="w-full">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="orders" className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4" />
          إدارة الطلبات
        </TabsTrigger>
        <TabsTrigger value="products" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          إدارة المنتجات
        </TabsTrigger>
        <TabsTrigger value="invoice" className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          طباعة الفاتورة
        </TabsTrigger>
        <TabsTrigger value="summary" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          تقرير شامل
        </TabsTrigger>
        <TabsTrigger value="profit" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          تقرير الأرباح
        </TabsTrigger>
        <TabsTrigger value="account" className="flex items-center gap-2">
          <Receipt className="h-4 w-4" />
          كشف الحساب
        </TabsTrigger>
      </TabsList>

      <TabsContent value="orders" className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">إدارة الطلبات</h2>
          <Button onClick={() => setIsAddOrderOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            إضافة طلب جديد
          </Button>
        </div>
        <OrdersTable />
        <AddOrderDialog 
          isOpen={isAddOrderOpen}
          onClose={() => setIsAddOrderOpen(false)}
          onOrderAdded={handleOrderAdded}
        />
      </TabsContent>

      <TabsContent value="products">
        <ProductsManagementAdvanced />
      </TabsContent>

      <TabsContent value="invoice">
        <InvoiceTab />
      </TabsContent>

      <TabsContent value="summary">
        <SummaryReport />
      </TabsContent>

      <TabsContent value="profit">
        <ProfitReport />
      </TabsContent>

      <TabsContent value="account">
        <ImprovedAccountStatement />
      </TabsContent>
    </Tabs>
  );
};

export default IndexTabs;
