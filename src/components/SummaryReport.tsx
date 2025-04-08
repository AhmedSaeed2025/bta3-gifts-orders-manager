
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useOrders } from "@/context/OrderContext";
import { formatCurrency, exportToExcel } from "@/lib/utils";
import { DownloadCloud, FileText, Search, Filter } from "lucide-react";

const SummaryReport = () => {
  const { orders } = useOrders();
  const [searchQuery, setSearchQuery] = useState("");

  const handleExport = () => {
    exportToExcel("summaryTable", "تقرير_الطلبات");
  };

  // Ensure orders is an array to prevent "map" errors
  const safeOrders = Array.isArray(orders) ? orders : [];

  // Filter orders based on search query
  const filteredOrders = safeOrders.filter(order => {
    const searchLower = searchQuery.toLowerCase();
    return (
      order.serial.toLowerCase().includes(searchLower) ||
      order.clientName.toLowerCase().includes(searchLower) ||
      order.phone.toLowerCase().includes(searchLower) ||
      (order.items && order.items.some(item => 
        item.productType.toLowerCase().includes(searchLower) ||
        item.size.toLowerCase().includes(searchLower)
      ))
    );
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <FileText className="h-5 w-5" />
          تقرير الطلبات
        </CardTitle>
        <div className="flex gap-2">
          <div className="relative w-[250px]">
            <Search className="absolute left-2 top-3 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="بحث (رقم الطلب، العميل، المنتج...)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button 
            onClick={handleExport}
            className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
          >
            <DownloadCloud className="h-4 w-4" />
            تصدير إلى Excel
          </Button>
        </div>
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
                <th>العربون</th>
                <th>مصاريف الشحن</th>
                <th>الإجمالي</th>
                <th>الربح</th>
                <th>حالة الطلب</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.flatMap((order, orderIndex) => {
                  // Ensure items array exists before mapping through it
                  const items = order.items || [];
                  
                  return items.map((item, itemIndex) => (
                    <tr key={`${order.serial}-${itemIndex}`}>
                      <td>{order.serial}</td>
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
                      <td className={itemIndex === 0 && order.discount > 0 ? "text-red-600" : ""}>
                        {itemIndex === 0 ? formatCurrency(order.discount) : "0.00 جنيه"}
                      </td>
                      <td>{itemIndex === 0 ? formatCurrency(order.deposit || 0) : "0.00 جنيه"}</td>
                      <td>{itemIndex === 0 ? formatCurrency(order.shippingCost) : "0.00 جنيه"}</td>
                      <td>{itemIndex === 0 ? formatCurrency(order.total) : "-"}</td>
                      <td>{formatCurrency(item.profit)}</td>
                      <td>{order.status}</td>
                    </tr>
                  ));
                })
              ) : (
                <tr>
                  <td colSpan={19} className="text-center py-4">لا توجد بيانات متاحة</td>
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
