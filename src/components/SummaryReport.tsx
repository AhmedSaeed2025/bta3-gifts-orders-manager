
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrders } from "@/context/OrderContext";
import { formatCurrency, exportToExcel } from "@/lib/utils";

const SummaryReport = () => {
  const { orders } = useOrders();

  const handleExport = () => {
    exportToExcel("summaryTable", "تقرير_الطلبات");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl">تقرير الطلبات</CardTitle>
        <Button 
          onClick={handleExport}
          className="bg-green-600 hover:bg-green-700"
        >
          تصدير إلى Excel
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table id="summaryTable" className="gift-table">
            <thead>
              <tr>
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
                <th>الخصم</th>
                <th>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.serial}>
                    <td>{order.clientName}</td>
                    <td>{order.phone}</td>
                    <td>{order.paymentMethod}</td>
                    <td>{order.deliveryMethod}</td>
                    <td>{order.address}</td>
                    <td>{order.governorate}</td>
                    <td>{order.productType}</td>
                    <td>{order.size}</td>
                    <td>{order.quantity}</td>
                    <td>{formatCurrency(order.price)}</td>
                    <td>{formatCurrency(order.discount)}</td>
                    <td>{formatCurrency(order.total)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} className="text-center py-4">لا توجد بيانات متاحة</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default SummaryReport;
