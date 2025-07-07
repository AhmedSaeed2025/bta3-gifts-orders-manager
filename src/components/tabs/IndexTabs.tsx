
import React from "react";
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
  Truck,
} from "lucide-react";
import OrderForm from "@/components/OrderForm";
import OrdersTable from "@/components/OrdersTable";
import SummaryReport from "@/components/SummaryReport";
import ProfitReport from "@/components/ProfitReport";
import ImprovedAccountStatement from "@/components/ImprovedAccountStatement";
import InvoiceTab from "@/components/InvoiceTab";
import ProductsTab from "@/components/ProductsTab";
import WebhookTab from "@/components/WebhookTab";
import ShippingReport from "@/components/admin/ShippingReport";

const IndexTabs = () => {
  const isMobile = useIsMobile();

  return (
    <Tabs defaultValue="addOrder" className="mt-2 md:mt-4" dir="rtl">
      <TabsList className={`grid w-full ${isMobile ? 'grid-cols-4 gap-1 h-auto p-1 mobile-warm-tabs' : 'grid-cols-9 gap-1 h-10'}`} dir="rtl">
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
              value="shipping" 
              className="text-sm"
            >
              "شركة الشحن"
            </TabsTrigger>
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
        <>
          <TabsList className="grid w-full grid-cols-4 gap-1 h-auto p-1 mt-2 mobile-warm-tabs" dir="rtl">
            <TabsTrigger 
              value="shipping" 
              className="flex-col text-xs p-2 h-16 mobile-warm-tab-inactive data-[state=active]:mobile-warm-tab-active"
            >
              <Truck className="h-4 w-4 mb-1" />
              <span className="text-xs leading-tight">الشحن</span>
            </TabsTrigger>
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
          </TabsList>
          <TabsList className="grid w-full grid-cols-1 gap-1 h-auto p-1 mt-2 mobile-warm-tabs" dir="rtl">
            <TabsTrigger 
              value="webhook" 
              className="flex-col text-xs p-2 h-16 mobile-warm-tab-inactive data-[state=active]:mobile-warm-tab-active"
            >
              <Globe className="h-4 w-4 mb-1" />
              <span className="text-xs leading-tight">Webhook</span>
            </TabsTrigger>
          </TabsList>
        </>
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
        
        <TabsContent value="shipping" className={isMobile ? 'mobile-warm-card rounded-lg' : ''}>
          <ShippingReport />
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
  );
};

export default IndexTabs;
