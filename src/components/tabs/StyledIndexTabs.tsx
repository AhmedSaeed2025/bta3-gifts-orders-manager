
import React, { useState, createContext, useContext } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  Plus, 
  Receipt, 
  FileText, 
  Truck, 
  Calculator,
  Settings,
  Printer,
  FileBarChart,
  Calendar
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth } from "date-fns";
import { ar } from "date-fns/locale";
import EnhancedAdminDashboard from "@/components/admin/EnhancedAdminDashboard";
import OrderForm from "@/components/OrderForm";
import ProductsManagementPro from "@/components/ProductsManagementPro";
import AdminOrders from "@/pages/admin/AdminOrders";
import ImprovedShippingReport from "@/components/admin/ImprovedShippingReport";
import DetailedOrdersReport from "@/components/admin/DetailedOrdersReport";
import ComprehensiveAccountStatement from "@/components/admin/ComprehensiveAccountStatement";
import ModernAccountStatement from "@/components/admin/ModernAccountStatement";
import ImprovedInvoiceTab from "@/components/ImprovedInvoiceTab";
import AdminSettings from "@/pages/admin/AdminSettings";
import PrintingReport from "@/components/admin/PrintingReport";

// Create date filter context
interface DateFilterContextType {
  startDate: Date | undefined;
  endDate: Date | undefined;
  setDateRange: (start: Date | undefined, end: Date | undefined) => void;
}

export const DateFilterContext = createContext<DateFilterContextType>({
  startDate: undefined,
  endDate: undefined,
  setDateRange: () => {}
});

export const useDateFilter = () => useContext(DateFilterContext);

const StyledIndexTabs = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  const setDateRange = (start: Date | undefined, end: Date | undefined) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setSelectedMonth("");
    if (year && year !== "all") {
      const yearNum = parseInt(year);
      setStartDate(startOfYear(new Date(yearNum, 0, 1)));
      setEndDate(endOfYear(new Date(yearNum, 0, 1)));
    } else {
      setStartDate(undefined);
      setEndDate(undefined);
    }
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    if (month && selectedYear && selectedYear !== "all") {
      const yearNum = parseInt(selectedYear);
      const monthNum = parseInt(month);
      setStartDate(startOfMonth(new Date(yearNum, monthNum, 1)));
      setEndDate(endOfMonth(new Date(yearNum, monthNum, 1)));
    }
  };

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedYear("");
    setSelectedMonth("");
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: "0", label: "يناير" },
    { value: "1", label: "فبراير" },
    { value: "2", label: "مارس" },
    { value: "3", label: "أبريل" },
    { value: "4", label: "مايو" },
    { value: "5", label: "يونيو" },
    { value: "6", label: "يوليو" },
    { value: "7", label: "أغسطس" },
    { value: "8", label: "سبتمبر" },
    { value: "9", label: "أكتوبر" },
    { value: "10", label: "نوفمبر" },
    { value: "11", label: "ديسمبر" },
  ];

  // Reverse order of tabs - from right to left (settings first, dashboard last)
  const tabs = [
    {
      id: "settings",
      label: "الإعدادات",
      icon: Settings,
      component: <AdminSettings />
    },
    {
      id: "invoice",
      label: "الفاتورة",
      icon: Receipt,
      component: <ImprovedInvoiceTab />
    },
    {
      id: "printing-report",
      label: "المطبعة",
      icon: Printer,
      component: <PrintingReport />
    },
    {
      id: "modern-account-statement",
      label: "كشف حساب محدث",
      icon: FileBarChart,
      component: <ModernAccountStatement />
    },
    {
      id: "account-statement",
      label: "كشف الحساب",
      icon: Calculator,
      component: <ComprehensiveAccountStatement />
    },
    {
      id: "shipping-report",
      label: "تقرير الشحن",
      icon: Truck,
      component: <ImprovedShippingReport />
    },
    {
      id: "orders-report",
      label: "تقرير الطلبات",
      icon: FileText,
      component: <DetailedOrdersReport />
    },
    {
      id: "products",
      label: "إدارة المنتجات",
      icon: Package,
      component: <ProductsManagementPro />
    },
    {
      id: "orders-management",
      label: "إدارة الطلبات",
      icon: ShoppingCart,
      component: <AdminOrders />
    },
    {
      id: "add-order",
      label: "إضافة طلب",
      icon: Plus,
      component: <OrderForm />
    },
    {
      id: "dashboard",
      label: "لوحة التحكم",
      icon: BarChart3,
      component: <EnhancedAdminDashboard />
    }
  ];

  return (
    <DateFilterContext.Provider value={{ startDate, endDate, setDateRange }}>
      <div className="w-full" dir="rtl">
        {/* Date Filters */}
        <div className={`mb-4 flex flex-wrap items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm ${isMobile ? 'flex-col' : ''}`}>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">فلتر التاريخ:</span>
          </div>
          
          <Select value={selectedYear} onValueChange={handleYearChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="السنة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل السنوات</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedYear && selectedYear !== "all" && (
            <Select value={selectedMonth} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="الشهر" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 ml-2" />
                {startDate && endDate 
                  ? `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`
                  : "تاريخ مخصص"
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="range"
                selected={{ from: startDate, to: endDate }}
                onSelect={(range) => {
                  setStartDate(range?.from);
                  setEndDate(range?.to);
                  setSelectedYear("");
                  setSelectedMonth("");
                }}
                locale={ar}
                numberOfMonths={isMobile ? 1 : 2}
              />
            </PopoverContent>
          </Popover>

          {(startDate || endDate) && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              إلغاء الفلتر
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList 
            className={`
              grid w-full mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 
              dark:from-blue-900/20 dark:to-indigo-900/20 p-1 rounded-xl
              ${isMobile ? 'grid-cols-3 gap-1' : 'grid-cols-11 gap-2'}
              ${isMobile ? 'h-auto' : 'h-14'}
            `}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={`
                    flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg transition-all duration-200
                    data-[state=active]:bg-white data-[state=active]:shadow-md
                    data-[state=active]:text-blue-600 hover:bg-white/50
                    ${isMobile ? 'flex-col text-[9px] min-h-[50px]' : 'flex-row text-sm min-h-[48px]'}
                    font-medium
                  `}
                >
                  <Icon className={isMobile ? "h-3.5 w-3.5" : "h-5 w-5"} />
                  <span className={isMobile ? "text-[8px] leading-tight text-center line-clamp-2" : "text-sm"}>
                    {tab.label}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent 
              key={tab.id} 
              value={tab.id} 
              className="mt-0 space-y-4"
            >
              {tab.component}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DateFilterContext.Provider>
  );
};

export default StyledIndexTabs;
