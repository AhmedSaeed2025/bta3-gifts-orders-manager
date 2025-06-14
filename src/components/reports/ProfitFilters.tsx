
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import { Filter, RefreshCw, Download, FileSpreadsheet } from "lucide-react";

interface ProfitFiltersProps {
  filterMonth: string;
  setFilterMonth: (value: string) => void;
  filterYear: string;
  setFilterYear: (value: string) => void;
  filterProduct: string;
  setFilterProduct: (value: string) => void;
  availableYears: string[];
  availableProducts: string[];
  onClearFilters: () => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
}

const ProfitFilters: React.FC<ProfitFiltersProps> = ({
  filterMonth,
  setFilterMonth,
  filterYear,
  setFilterYear,
  filterProduct,
  setFilterProduct,
  availableYears,
  availableProducts,
  onClearFilters,
  onExportExcel,
  onExportPDF
}) => {
  const isMobile = useIsMobile();

  return (
    <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
      <CardHeader className={`${isMobile ? "pb-3" : "pb-4"}`}>
        <div className="flex items-center justify-between">
          <CardTitle className={`${isMobile ? "text-base" : "text-lg"} flex items-center gap-2`}>
            <Filter className={`${isMobile ? "h-4 w-4" : "h-5 w-5"}`} />
            فلاتر التقرير والتصدير
          </CardTitle>
          <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
            <Button
              onClick={onExportExcel}
              size="sm"
              className={`bg-green-600 hover:bg-green-700 flex items-center gap-2 ${isMobile ? "text-xs" : ""}`}
            >
              <FileSpreadsheet className={`${isMobile ? "h-3 w-3" : "h-4 w-4"}`} />
              Excel
            </Button>
            <Button
              onClick={onExportPDF}
              size="sm"
              className={`bg-red-600 hover:bg-red-700 flex items-center gap-2 ${isMobile ? "text-xs" : ""}`}
            >
              <Download className={`${isMobile ? "h-3 w-3" : "h-4 w-4"}`} />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-4"}`}>
          <div className="space-y-2">
            <Label htmlFor="filterYear" className={isMobile ? "text-sm" : ""}>السنة</Label>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className={isMobile ? "h-9" : ""}>
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
            <Label htmlFor="filterMonth" className={isMobile ? "text-sm" : ""}>الشهر</Label>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className={isMobile ? "h-9" : ""}>
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
            <Label htmlFor="filterProduct" className={isMobile ? "text-sm" : ""}>نوع المنتج</Label>
            <Select value={filterProduct} onValueChange={setFilterProduct}>
              <SelectTrigger className={isMobile ? "h-9" : ""}>
                <SelectValue placeholder="اختر المنتج" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المنتجات</SelectItem>
                {availableProducts.map(product => (
                  <SelectItem key={product} value={product}>{product}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end">
            <Button 
              onClick={onClearFilters}
              variant="outline"
              className="w-full flex items-center gap-2"
            >
              <RefreshCw className={`${isMobile ? "h-3 w-3" : "h-4 w-4"}`} />
              مسح الفلاتر
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfitFilters;
