
import React from 'react';

interface InvoiceCustomerInfoProps {
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  deliveryMethod: string;
  status: string;
  address?: string;
}

const InvoiceCustomerInfo = ({ 
  customerName, 
  customerPhone, 
  paymentMethod, 
  deliveryMethod, 
  status, 
  address 
}: InvoiceCustomerInfoProps) => {
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'قيد المراجعة';
      case 'confirmed': return 'مؤكد';
      case 'processing': return 'قيد التجهيز';
      case 'shipped': return 'تم الشحن';
      case 'delivered': return 'تم التوصيل';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="px-6 sm:px-8 lg:px-12 py-6 sm:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Customer Info */}
        <div className="bg-blue-50/50 rounded-xl p-4 sm:p-6 border border-blue-100">
          <h3 className="text-sm sm:text-base lg:text-lg font-bold text-blue-800 mb-3 sm:mb-4 flex items-center">
            <span className="bg-blue-600 text-white px-2 py-1 rounded-lg ml-2 sm:ml-3 text-xs sm:text-sm">👤</span>
            بيانات العميل
          </h3>
          <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm lg:text-base">
            <div className="flex items-center">
              <span className="font-semibold text-gray-700 ml-2">الاسم:</span>
              <span className="text-gray-900">{customerName}</span>
            </div>
            <div className="flex items-center">
              <span className="font-semibold text-gray-700 ml-2">الهاتف:</span>
              <span className="text-gray-900">{customerPhone}</span>
            </div>
            <div className="flex items-center">
              <span className="font-semibold text-gray-700 ml-2">طريقة الدفع:</span>
              <span className="text-gray-900">{paymentMethod}</span>
            </div>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="bg-green-50/50 rounded-xl p-4 sm:p-6 border border-green-100">
          <h3 className="text-sm sm:text-base lg:text-lg font-bold text-green-800 mb-3 sm:mb-4 flex items-center">
            <span className="bg-green-600 text-white px-2 py-1 rounded-lg ml-2 sm:ml-3 text-xs sm:text-sm">🚚</span>
            معلومات التوصيل
          </h3>
          <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm lg:text-base">
            <div className="flex items-center">
              <span className="font-semibold text-gray-700 ml-2">طريقة الاستلام:</span>
              <span className="text-gray-900">{deliveryMethod}</span>
            </div>
            <div className="flex items-center flex-wrap gap-2">
              <span className="font-semibold text-gray-700">حالة الطلب:</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(status)}`}>
                {getStatusLabel(status)}
              </span>
            </div>
            {address && (
              <div className="flex items-start">
                <span className="font-semibold text-gray-700 ml-2">العنوان:</span>
                <span className="text-gray-900">{address}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceCustomerInfo;
