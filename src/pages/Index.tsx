import React from "react";
import { Link, useLocation } from "react-router-dom";

const navLinks = [
  { to: "/", label: "المتجر" },
  { to: "/admin/dashboard", label: "لوحة التحكم" },
  { to: "/legacy-admin", label: "برنامج الحسابات" },
];

const AccountsNavbar = () => {
  const location = useLocation();
  return (
    <nav className="w-full bg-white border-b mb-6 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 h-14">
        {navLinks.map((link) => {
          const isActive =
            link.to === "/legacy-admin"
              ? location.pathname.startsWith("/legacy-admin")
              : location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2 rounded transition-all font-medium ${
                isActive
                  ? "bg-primary text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <div>
      <AccountsNavbar />
      <div className="min-h-screen bg-gift-accent dark:bg-gray-900 transition-colors duration-300" dir="rtl">
        <div className="container mx-auto px-2 md:px-4 py-3 md:py-6" dir="rtl">
          <div className="flex items-center justify-between mb-4" dir="rtl">
            <Logo />
            <UserProfile />
          </div>
          
          <Tabs defaultValue="addOrder" className="mt-2 md:mt-4" dir="rtl">
            <TabsList className={`grid w-full grid-cols-8 gap-1 ${isMobile ? 'h-16' : 'h-10'}`} dir="rtl">
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
              <TabsTrigger 
                value="webhook" 
                className={`${isMobile ? 'flex-col text-xs p-1 h-14' : 'text-sm'}`}
              >
                {isMobile ? (
                  <>
                    <Globe className="h-3 w-3 mb-1" />
                    <span className="text-xs leading-none">Webhook</span>
                  </>
                ) : (
                  "Webhook"
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
            
            <TabsContent value="webhook">
              <WebhookTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;
