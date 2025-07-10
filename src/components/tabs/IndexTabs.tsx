
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
  Truck,
  LayoutDashboard
} from "lucide-react";
import OrderForm from "@/components/OrderForm";
import OrdersTable from "@/components/OrdersTable";
import ImprovedSummaryReport from "@/components/admin/ImprovedSummaryReport";
import ProfitReport from "@/components/ProfitReport";
import ImprovedAccountStatement from "@/components/ImprovedAccountStatement";
import InvoiceTab from "@/components/InvoiceTab";
import ProductsManagementCopy from "@/components/admin/ProductsManagementCopy";
import ImprovedShippingReport from "@/components/admin/ImprovedShippingReport";
import AdminDashboard from "@/components/admin/AdminDashboard";

const IndexTabs = () => {
  const isMobile = useIsMobile();

  return (
    <Tabs defaultValue="dashboard" className="mt-2 md:mt-4" dir="rtl">
      <TabsList className={`grid w-full ${isMobile ? 'grid-cols-4 gap-1 h-auto p-1 mobile-warm-tabs' : 'grid-cols-8 gap-1 h-10'}`} dir="rtl">
        <TabsTrigger 
          value="dashboard" 
          className={`${isMobile ? 'flex-col text-xs p-2 h-16 mobile-warm-tab-inactive data-[state=active]:mobile-warm-tab-active' : 'text-sm'}`}
        >
          {isMobile ? (
            <>
              <LayoutDashboard className="h-4 w-4 mb-1" />
              <span className="text-xs leading-tight">الرئيسية</span>
            </>
          ) : (
            "لوحة التحكم"
          )}
        </TabsTrigger>
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
        
        {!isMobile && (
          <>
            <TabsTrigger 
              value="profitReport" 
              className="text-sm"
            >
              "تقرير الأرباح"
            </TabsTrigger>
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
          </>
        )}
      </TabsList>
      
      {isMobile && (
        <>
          <TabsList className="grid w-full grid-cols-4 gap-1 h-auto p-1 mt-2 mobile-warm-tabs" dir="rtl">
            <TabsTrigger 
              value="profitReport" 
              className="flex-col text-xs p-2 h-16 mobile-warm-tab-inactive data-[state=active]:mobile-warm-tab-active"
            >
              <TrendingUp className="h-4 w-4 mb-1" />
              <span className="text-xs leading-tight">الأرباح</span>
            </TabsTrigger>
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
          </TabsList>
          <TabsList className="grid w-full grid-cols-1 gap-1 h-auto p-1 mt-2 mobile-warm-tabs" dir="rtl">
            <TabsTrigger 
              value="products" 
              className="flex-col text-xs p-2 h-16 mobile-warm-tab-inactive data-[state=active]:mobile-warm-tab-active"
            >
              <Package className="h-4 w-4 mb-1" />
              <span className="text-xs leading-tight">المنتجات</span>
            </TabsTrigger>
          </TabsList>
        </>
      )}
      
      <div className={`${isMobile ? 'px-1 mt-2' : ''}`}>
        <TabsContent value="dashboard" className={isMobile ? 'mobile-warm-card rounded-lg' : ''}>
          <AdminDashboard />
        </TabsContent>
        
        <TabsContent value="addOrder" className={isMobile ? 'mobile-warm-card rounded-lg' : ''}>
          <OrderForm />
        </TabsContent>
        
        <TabsContent value="orders" className={isMobile ? 'mobile-warm-card rounded-lg' : ''}>
          <OrdersTable />
        </TabsContent>
        
        <TabsContent value="summary" className={isMobile ? 'mobile-warm-card rounded-lg' : ''}>
          <ImprovedSummaryReport />
        </TabsContent>
        
        <TabsContent value="profitReport" className={isMobile ? 'mobile-warm-card rounded-lg' : ''}>
          <ProfitReport />
        </TabsContent>
        
        <TabsContent value="shipping" className={isMobile ? 'mobile-warm-card rounded-lg' : ''}>
          <ImprovedShippingReport />
        </TabsContent>
        
        <TabsContent value="accountStatement" className={isMobile ? 'mobile-warm-card rounded-lg' : ''}>
          <ImprovedAccountStatement />
        </TabsContent>
        
        <TabsContent value="invoice" className={isMobile ? 'mobile-warm-card rounded-lg' : ''}>
          <InvoiceTab />
        </TabsContent>
        
        <TabsContent value="products" className={isMobile ? 'mobile-warm-card rounded-lg' : ''}>
          <ProductsManagementCopy />
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default IndexTabs;
