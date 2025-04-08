
import React from "react";
import { Order, ORDER_STATUS_LABELS } from "@/types";
import { Map, Phone, Home } from "lucide-react";

interface InvoiceDetailsProps {
  order: Order;
}

export const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({ order }) => {
  return (
    <>
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
          <h3 className="font-semibold mb-1 text-sm flex items-center gap-1">
            <Map size={14} /> بيانات الفاتورة
          </h3>
          <div className="space-y-1">
            <p><span className="font-medium">رقم الفاتورة:</span> {order.serial}</p>
            <p><span className="font-medium">حالة الطلب:</span> {ORDER_STATUS_LABELS[order.status]}</p>
            <p><span className="font-medium">تاريخ الإصدار:</span> {new Date(order.dateCreated).toLocaleDateString('ar-EG')}</p>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
          <h3 className="font-semibold mb-1 text-sm flex items-center gap-1">
            <Phone size={14} /> بيانات العميل
          </h3>
          <div className="space-y-1">
            <p><span className="font-medium">اسم العميل:</span> {order.clientName}</p>
            <p><span className="font-medium">رقم التليفون:</span> {order.phone}</p>
            <p><span className="font-medium">طريقة السداد:</span> {order.paymentMethod}</p>
          </div>
        </div>
      </div>
      
      <div className="mb-3 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg text-xs">
        <h3 className="font-semibold mb-1 text-sm flex items-center gap-1">
          <Home size={14} /> معلومات التوصيل
        </h3>
        <div className="space-y-1">
          <p><span className="font-medium">طريقة الاستلام:</span> {order.deliveryMethod}</p>
          {order.deliveryMethod === "شحن للمنزل" && (
            <>
              <p><span className="font-medium">العنوان:</span> {order.address}</p>
              <p><span className="font-medium">المحافظة:</span> {order.governorate}</p>
            </>
          )}
        </div>
      </div>
      
      {order.notes && (
        <div className="mb-3 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg text-xs">
          <h3 className="font-semibold mb-1 text-sm">ملاحظات</h3>
          <p className="whitespace-pre-wrap">{order.notes}</p>
        </div>
      )}
    </>
  );
};
