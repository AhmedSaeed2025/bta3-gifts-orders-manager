
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrders } from "@/context/OrderContext";
import Invoice from "./Invoice";
import { Label } from "./ui/label";

const InvoiceTab = () => {
  const { orders } = useOrders();
  const [selectedOrderSerial, setSelectedOrderSerial] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState(orders && orders.length > 0 ? orders[0] : undefined);

  // Update order options when orders change
  useEffect(() => {
    if (orders && orders.length > 0 && !selectedOrderSerial) {
      setSelectedOrderSerial(orders[0].serial);
      setSelectedOrder(orders[0]);
    }
  }, [orders, selectedOrderSerial]);

  // Handle order selection
  const handleOrderChange = (serial: string) => {
    setSelectedOrderSerial(serial);
    const order = orders.find(o => o.serial === serial);
    if (order) {
      setSelectedOrder(order);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">طباعة الفاتورة</CardTitle>
      </CardHeader>
      <CardContent>
        {!orders || orders.length === 0 ? (
          <p className="text-center py-4">لا توجد طلبات متاحة لعرض الفاتورة</p>
        ) : (
          <div>
            <div className="mb-6">
              <Label htmlFor="orderSelect">اختر الطلب:</Label>
              <Select 
                value={selectedOrderSerial}
                onValueChange={handleOrderChange}
              >
                <SelectTrigger className="w-full md:w-80">
                  <SelectValue placeholder="اختر الطلب" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order) => (
                    <SelectItem key={order.serial} value={order.serial}>
                      {`${order.serial} - ${order.clientName}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedOrder && (
              <Invoice order={selectedOrder} />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceTab;
