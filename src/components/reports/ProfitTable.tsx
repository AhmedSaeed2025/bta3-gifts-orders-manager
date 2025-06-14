
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { FileSpreadsheet } from "lucide-react";

interface ProfitTableRow {
  month: string;
  productType: string;
  quantity: number;
  totalCost: number;
  totalSales: number;
  totalShipping: number;
  totalDiscounts: number;
  netProfit: number;
}

interface ProfitTableProps {
  data: ProfitTableRow[];
}

const ProfitTable: React.FC<ProfitTableProps> = ({ data }) => {
  const isMobile = useIsMobile();

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">لا توجد بيانات متاحة</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className={`${isMobile ? "text-base" : "text-lg"} font-medium`}>
          تفاصيل الأرباح والتكاليف حسب المنتج والشهر
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table id="profitReportTable" className="w-full">
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800">
                <TableHead className={`text-right font-semibold ${isMobile ? "text-xs" : "text-sm"}`}>الشهر</TableHead>
                <TableHead className={`text-right font-semibold ${isMobile ? "text-xs" : "text-sm"}`}>نوع المنتج</TableHead>
                <TableHead className={`text-right font-semibold ${isMobile ? "text-xs" : "text-sm"}`}>الكمية</TableHead>
                <TableHead className={`text-right font-semibold ${isMobile ? "text-xs" : "text-sm"}`}>إجمالي التكاليف</TableHead>
                <TableHead className={`text-right font-semibold ${isMobile ? "text-xs" : "text-sm"}`}>إجمالي المبيعات</TableHead>
                <TableHead className={`text-right font-semibold ${isMobile ? "text-xs" : "text-sm"}`}>إجمالي الشحن</TableHead>
                <TableHead className={`text-right font-semibold ${isMobile ? "text-xs" : "text-sm"}`}>إجمالي الخصومات</TableHead>
                <TableHead className={`text-right font-semibold ${isMobile ? "text-xs" : "text-sm"}`}>صافي الربح</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <TableCell className={`${isMobile ? "text-xs" : "text-sm"} border-b`}>{row.month}</TableCell>
                  <TableCell className={`${isMobile ? "text-xs" : "text-sm"} border-b`}>{row.productType}</TableCell>
                  <TableCell className={`${isMobile ? "text-xs" : "text-sm"} border-b text-center font-semibold text-gray-700`}>{row.quantity}</TableCell>
                  <TableCell className={`${isMobile ? "text-xs" : "text-sm"} border-b text-red-600 font-semibold`}>{formatCurrency(row.totalCost)}</TableCell>
                  <TableCell className={`${isMobile ? "text-xs" : "text-sm"} border-b text-blue-600 font-semibold`}>{formatCurrency(row.totalSales)}</TableCell>
                  <TableCell className={`${isMobile ? "text-xs" : "text-sm"} border-b text-orange-600 font-semibold`}>{formatCurrency(row.totalShipping)}</TableCell>
                  <TableCell className={`${isMobile ? "text-xs" : "text-sm"} border-b text-purple-600 font-semibold`}>{formatCurrency(row.totalDiscounts)}</TableCell>
                  <TableCell className={`${isMobile ? "text-xs" : "text-sm"} border-b text-green-600 font-semibold`}>{formatCurrency(row.netProfit)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfitTable;
