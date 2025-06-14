
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { Filter, RefreshCw, Search, Calendar } from "lucide-react";

interface TransactionFiltersProps {
  filterMonth: string;
  setFilterMonth: (value: string) => void;
  filterYear: string;
  setFilterYear: (value: string) => void;
  filterType: string;
  setFilterType: (value: string) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  availableYears: string[];
  onClearFilters: () => void;
}

const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  filterMonth,
  setFilterMonth,
  filterYear,
  setFilterYear,
  filterType,
  setFilterType,
  searchTerm,
  setSearchTerm,
  availableYears,
  onClearFilters
}) => {
  const isMobile = useIsMobile();

  return (
    <Card className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-l-4 border-l-blue-500 shadow-lg">
      <CardHeader className={`${isMobile ? "pb-3" : "pb-4"}`}>
        <CardTitle className={`${isMobile ? "text-sm" : "text-lg"} flex items-center gap-3 text-slate-700 dark:text-slate-200`}>
          <div className="p-2 bg-blue-500 rounded-lg">
            <Filter className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} text-white`} />
          </div>
          فلاتر البحث والتصفية
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* الصف الأول - البحث والسنة */}
          <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-4"}`}>
            <div className="space-y-2">
              <Label htmlFor="search" className={`${isMobile ? "text-xs" : "text-sm"} font-medium text-slate-700 dark:text-slate-300`}>
                البحث في الوصف
              </Label>
              <div className="relative">
                <Search className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isMobile ? "h-3 w-3" : "h-4 w-4"} text-slate-400`} />
                <Input
                  id="search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ابحث في الوصف..."
                  className={`${isMobile ? "text-xs h-8 pr-8" : "text-sm h-10 pr-10"} border-slate-300 dark:border-slate-600 focus:border-blue-500`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filterYear" className={`${isMobile ? "text-xs" : "text-sm"} font-medium text-slate-700 dark:text-slate-300`}>
                السنة
              </Label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className={`${isMobile ? "text-xs h-8" : "text-sm h-10"} border-slate-300 dark:border-slate-600`}>
                  <Calendar className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} text-slate-400 ml-2`} />
                  <SelectValue placeholder="اختر السنة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع السنوات</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filterMonth" className={`${isMobile ? "text-xs" : "text-sm"} font-medium text-slate-700 dark:text-slate-300`}>
                الشهر
              </Label>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className={`${isMobile ? "text-xs h-8" : "text-sm h-10"} border-slate-300 dark:border-slate-600`}>
                  <SelectValue placeholder="اختر الشهر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الشهور</SelectItem>
                  <SelectItem value="01">يناير</SelectItem>
                  <SelectItem value="02">فبراير</SelectItem>
                  <SelectItem value="03">مارس</SelectItem>
                  <SelectItem value="04">أبريل</SelectItem>
                  <SelectItem value="05">مايو</SelectItem>
                  <SelectItem value="06">يونيو</SelectItem>
                  <SelectItem value="07">يوليو</SelectItem>
                  <SelectItem value="08">أغسطس</SelectItem>
                  <SelectItem value="09">سبتمبر</SelectItem>
                  <SelectItem value="10">أكتوبر</SelectItem>
                  <SelectItem value="11">نوفمبر</SelectItem>
                  <SelectItem value="12">ديسمبر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filterType" className={`${isMobile ? "text-xs" : "text-sm"} font-medium text-slate-700 dark:text-slate-300`}>
                نوع المعاملة
              </Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className={`${isMobile ? "text-xs h-8" : "text-sm h-10"} border-slate-300 dark:border-slate-600`}>
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المعاملات</SelectItem>
                  <SelectItem value="order_collection">تحصيل طلب</SelectItem>
                  <SelectItem value="shipping_payment">دفع شحن</SelectItem>
                  <SelectItem value="cost_payment">دفع تكلفة</SelectItem>
                  <SelectItem value="expense">مصروف</SelectItem>
                  <SelectItem value="other_income">إيراد إضافي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* زر مسح الفلاتر */}
          <div className="flex justify-end">
            <Button 
              onClick={onClearFilters}
              variant="outline"
              size={isMobile ? "sm" : "default"}
              className={`flex items-center gap-2 ${isMobile ? "text-xs" : "text-sm"} border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700`}
            >
              <RefreshCw className={`${isMobile ? "h-3 w-3" : "h-4 w-4"}`} />
              مسح جميع الفلاتر
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionFilters;
