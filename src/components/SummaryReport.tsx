
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

  // Ensure orders is an array to prevent "map" errors
  const safeOrders = Array.isArray(orders) ? orders : [];

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
              {safeOrders.length > 0 ? (
                safeOrders.flatMap((order, orderIndex) => {
                  // Ensure items array exists before mapping through it
                  const items = order.items || [];
                  
                  return items.map((item, itemIndex) => (
                    <tr key={`${order.serial}-${itemIndex}`}>
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
                      <td>{orderIndex === 0 && itemIndex === 0 ? formatCurrency(order.discount) : "0.00 جنيه"}</td>
                      <td>{itemIndex === 0 ? formatCurrency(order.total) : "-"}</td>
                    </tr>
                  ));
                })
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
