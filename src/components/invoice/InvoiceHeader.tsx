
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface InvoiceHeaderProps {
  orderSerial: string;
  orderDate: string;
}

const InvoiceHeader = ({ orderSerial, orderDate }: InvoiceHeaderProps) => {
  return (
    <div className="bg-gradient-to-l from-slate-50 to-blue-50 px-6 sm:px-8 lg:px-12 py-6 sm:py-8">
      <div className="flex flex-col lg:flex-row justify-between items-start gap-4 sm:gap-6">
        {/* Company Info */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 w-full lg:w-auto">
          <div className="flex-shrink-0">
            <img 
              src="/lovable-uploads/ac63ecb6-e1d0-4917-9537-12f75da70364.png" 
              alt="شعار بتاع هدايا" 
              className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 object-contain rounded-xl shadow-md bg-white p-2" 
            />
          </div>
          <div className="text-center sm:text-right">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-l from-blue-600 to-purple-600 bg-clip-text text-transparent">
              #بتاع_هدايا_الأصلي
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1">Design4You - تصميم من أجلك</p>
            <p className="text-xs text-gray-500 mt-1">ملوك الهدايا والتصميم في مصر</p>
          </div>
        </div>
        
        {/* Invoice Details */}
        <div className="w-full lg:w-auto">
          <div className="bg-white rounded-xl p-3 sm:p-4 lg:p-6 shadow-lg border border-gray-100">
            <div className="text-center">
              <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-800 mb-2 sm:mb-3">فاتورة رقم</h2>
              <div className="bg-gradient-to-l from-blue-600 to-purple-600 text-white rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 mb-2 sm:mb-3">
                <span className="text-sm sm:text-lg lg:text-xl font-bold">{orderSerial}</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">
                التاريخ: {new Date(orderDate).toLocaleDateString('ar-EG')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceHeader;
