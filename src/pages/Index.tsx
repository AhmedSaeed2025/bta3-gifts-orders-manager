
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
import { 
  Plus, 
  List, 
  BarChart3, 
  TrendingUp, 
  Receipt, 
  FileText, 
  Package 
} from "lucide-react";

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
          <TabsList className={`grid w-full grid-cols-7 gap-1 ${isMobile ? 'h-16' : 'h-10'}`} dir="rtl">
            <TabsTrigger 
              value="addOrder" 
              className={`${isMobile ? 'flex-col text-xs p-1 h-14' : 'text-sm'}`}
            >
              {isMobile ? (
                <>
                  <Plus className="h-3 w-3 mb-1" />
                  <span className="text-xs leading-none">إضافة</span>
                </>
              ) : (
                "إضافة طلب"
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="orders" 
              className={`${isMobile ? 'flex-col text-xs p-1 h-14' : 'text-sm'}`}
            >
              {isMobile ? (
                <>
                  <List className="h-3 w-3 mb-1" />
                  <span className="text-xs leading-none">الطلبات</span>
                </>
              ) : (
                "إدارة الطلبات"
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="summary" 
              className={`${isMobile ? 'flex-col text-xs p-1 h-14' : 'text-sm'}`}
            >
              {isMobile ? (
                <>
                  <BarChart3 className="h-3 w-3 mb-1" />
                  <span className="text-xs leading-none">تقرير</span>
                </>
              ) : (
                "تقرير الطلبات"
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="profitReport" 
              className={`${isMobile ? 'flex-col text-xs p-1 h-14' : 'text-sm'}`}
            >
              {isMobile ? (
                <>
                  <TrendingUp className="h-3 w-3 mb-1" />
                  <span className="text-xs leading-none">الأرباح</span>
                </>
              ) : (
                "تقرير الأرباح"
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="accountStatement" 
              className={`${isMobile ? 'flex-col text-xs p-1 h-14' : 'text-sm'}`}
            >
              {isMobile ? (
                <>
                  <Receipt className="h-3 w-3 mb-1" />
                  <span className="text-xs leading-none">الحساب</span>
                </>
              ) : (
                "كشف حساب"
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="invoice" 
              className={`${isMobile ? 'flex-col text-xs p-1 h-14' : 'text-sm'}`}
            >
              {isMobile ? (
                <>
                  <FileText className="h-3 w-3 mb-1" />
                  <span className="text-xs leading-none">الفاتورة</span>
                </>
              ) : (
                "الفاتورة"
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="products" 
              className={`${isMobile ? 'flex-col text-xs p-1 h-14' : 'text-sm'}`}
            >
              {isMobile ? (
                <>
                  <Package className="h-3 w-3 mb-1" />
                  <span className="text-xs leading-none">المنتجات</span>
                </>
              ) : (
                "إدارة المنتجات"
              )}
            </TabsTrigger>
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
