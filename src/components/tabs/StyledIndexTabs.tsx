
import React, { useState, createContext, useContext, useEffect } from "react";
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
import SummaryAccountReport from "@/components/admin/SummaryAccountReport";

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

// LocalStorage key for persisting filter
const FILTER_STORAGE_KEY = 'app_date_filter';

const StyledIndexTabs = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Load saved filter from localStorage
  const getSavedFilter = () => {
    try {
      const saved = localStorage.getItem(FILTER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          startDate: parsed.startDate ? new Date(parsed.startDate) : undefined,
          endDate: parsed.endDate ? new Date(parsed.endDate) : undefined,
          selectedYear: parsed.selectedYear || "",
          selectedMonth: parsed.selectedMonth || ""
        };
      }
    } catch (e) {
      console.error('Error loading saved filter:', e);
    }
    return { startDate: undefined, endDate: undefined, selectedYear: "", selectedMonth: "" };
  };

  const savedFilter = getSavedFilter();
  const [startDate, setStartDate] = useState<Date | undefined>(savedFilter.startDate);
  const [endDate, setEndDate] = useState<Date | undefined>(savedFilter.endDate);
  const [selectedYear, setSelectedYear] = useState<string>(savedFilter.selectedYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(savedFilter.selectedMonth);

  // Save filter to localStorage whenever it changes
  useEffect(() => {
    const filterData = {
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      selectedYear,
      selectedMonth
    };
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filterData));
  }, [startDate, endDate, selectedYear, selectedMonth]);

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
      id: "summary-report",
      label: "كشف ملخص",
      icon: Calculator,
      component: <SummaryAccountReport />
    },
    {
      id: "modern-account-statement",
      label: "كشف محدث",
      icon: FileBarChart,
      component: <ModernAccountStatement />
    },
    {
      id: "account-statement",
      label: "كشف الحساب",
      icon: FileText,
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
        {/* Date Filters - Enhanced Responsive Design */}
        <div className={`mb-4 p-4 bg-card rounded-xl shadow-sm border border-border/50 ${isMobile ? 'space-y-3' : ''}`}>
          <div className={`flex items-center gap-3 ${isMobile ? 'flex-col' : 'flex-wrap'}`}>
            <div className="flex items-center gap-2 text-primary">
              <Calendar className="h-4 w-4" />
              <span className={`font-semibold ${isMobile ? 'text-sm' : 'text-sm'}`}>فلتر التاريخ:</span>
            </div>
            
            <div className={`flex items-center gap-2 ${isMobile ? 'w-full flex-col' : 'flex-wrap'}`}>
              <Select value={selectedYear} onValueChange={handleYearChange}>
                <SelectTrigger className={`${isMobile ? 'w-full' : 'w-[130px]'} h-10 bg-background border-border/60 focus:ring-2 focus:ring-primary/20`}>
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
                  <SelectTrigger className={`${isMobile ? 'w-full' : 'w-[130px]'} h-10 bg-background border-border/60 focus:ring-2 focus:ring-primary/20`}>
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
                  <Button variant="outline" size="default" className={`${isMobile ? 'w-full' : ''} h-10 border-border/60 hover:bg-accent`}>
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
                <Button 
                  variant="ghost" 
                  size="default" 
                  onClick={clearFilters}
                  className={`${isMobile ? 'w-full' : ''} h-10 text-destructive hover:text-destructive hover:bg-destructive/10`}
                >
                  إلغاء الفلتر
                </Button>
              )}
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Enhanced TabsList - Responsive & Professional */}
          <TabsList 
            className={`
              w-full mb-6 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 
              dark:from-primary/10 dark:via-primary/20 dark:to-primary/10 
              p-2 rounded-xl border border-border/30 shadow-sm
              ${isMobile 
                ? 'grid grid-cols-4 gap-1 h-auto' 
                : 'flex flex-wrap justify-center gap-1 h-auto min-h-[56px]'}
            `}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={`
                    flex items-center justify-center gap-1.5 rounded-lg transition-all duration-200
                    data-[state=active]:bg-primary data-[state=active]:text-primary-foreground 
                    data-[state=active]:shadow-md data-[state=active]:shadow-primary/20
                    hover:bg-accent/80 font-medium
                    ${isMobile 
                      ? 'flex-col text-[8px] p-2 min-h-[52px]' 
                      : 'flex-row text-xs px-3 py-2.5 min-w-[90px]'}
                  `}
                >
                  <Icon className={isMobile ? "h-4 w-4" : "h-4 w-4"} />
                  <span className={`${isMobile ? "leading-tight text-center" : ""} truncate`}>
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
              className="mt-0 space-y-4 animate-in fade-in-50 duration-300"
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
