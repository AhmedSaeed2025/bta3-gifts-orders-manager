
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { formatCurrency, exportToExcel } from "@/lib/utils";
import { DownloadCloud, FileText } from "lucide-react";

const SummaryReport = () => {
  const { orders, loading } = useSupabaseOrders();

  const handleExport = () => {
    exportToExcel("summaryTable", "Orders_Report");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gift-primary mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">جاري تحميل التقارير...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rtl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            <FileText className="h-5 w-5" />
            تقرير الطلبات
          </CardTitle>
          <Button 
            onClick={handleExport}
            className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
          >
            <DownloadCloud className="h-4 w-4" />
            تصدير إلى Excel
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table id="summaryTable" className="gift-table">
              <thead>
                <tr>
                  <th>رقم الطلب</th>
                  <th>التاريخ</th>
                  <th>اسم العميل</th>
                  <th>رقم التليفون</th>
                  <th>طريقة السداد</th>
                  <th>طريقة الاستلام</th>
                  <th>العنوان</th>
                  <th>المحافظة</th>
                  <th>نوع المنتج</th>
                  <th>المقاس</th>
                  <th>الكمية</th>
                  <th>سعر البيع</th>
                  <th>سعر التكلفة</th>
                  <th>الخصم</th>
                  <th>مصاريف الشحن</th>
                  <th>الإجمالي</th>
                  <th>الربح</th>
                  <th>حالة الطلب</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.flatMap((order, orderIndex) => {
                    const items = order.items || [];
                    
                    return items.map((item, itemIndex) => (
                      <tr key={`${order.serial}-${itemIndex}`}>
                        <td>GFT{order.serial}</td>
                        <td>{new Date(order.dateCreated).toLocaleDateString('ar-EG')}</td>
                        <td>{order.clientName}</td>
                        <td>{order.phone}</td>
                        <td>{order.paymentMethod}</td>
                        <td>{order.deliveryMethod}</td>
                        <td>{order.address}</td>
                        <td>{order.governorate}</td>
                        <td>{item.productType}</td>
                        <td>{item.size}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.price)}</td>
                        <td>{formatCurrency(item.cost)}</td>
                        <td>{itemIndex === 0 ? formatCurrency(order.discount) : "0.00 جنيه"}</td>
                        <td>{itemIndex === 0 ? formatCurrency(order.shippingCost) : "0.00 جنيه"}</td>
                        <td>{itemIndex === 0 ? formatCurrency(order.total) : "-"}</td>
                        <td>{formatCurrency(item.profit)}</td>
                        <td>{order.status}</td>
                      </tr>
                    ));
                  })
                ) : (
                  <tr>
                    <td colSpan={18} className="text-center py-4">لا توجد بيانات متاحة</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryReport;
