
import React from 'react';
import { formatCurrency } from '@/lib/utils';

interface InvoiceTotalsProps {
  subtotal: number;
  shippingCost: number;
  discount: number;
  finalTotal: number;
  deposit: number;
  remainingAmount: number;
}

const InvoiceTotals = ({ 
  subtotal, 
  shippingCost, 
  discount, 
  finalTotal, 
  deposit, 
  remainingAmount 
}: InvoiceTotalsProps) => {
  return (
    <div className="px-6 sm:px-8 lg:px-12 pb-6 sm:pb-8">
      <div className="flex justify-end">
        <div className="w-full sm:w-80 lg:w-96 bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between text-xs sm:text-sm lg:text-base text-gray-700">
              <span>المجموع الفرعي:</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            
            {shippingCost > 0 && (
              <div className="flex justify-between text-xs sm:text-sm lg:text-base text-gray-700">
                <span>تكلفة الشحن:</span>
                <span className="font-semibold">{formatCurrency(shippingCost)}</span>
              </div>
            )}
            
            {discount > 0 && (
              <div className="flex justify-between text-xs sm:text-sm lg:text-base text-red-600">
                <span>الخصم:</span>
                <span className="font-semibold">-{formatCurrency(discount)}</span>
              </div>
            )}
            
            <hr className="border-gray-200" />
            
            <div className="flex justify-between text-sm sm:text-lg lg:text-xl font-bold bg-gradient-to-l from-blue-600 to-purple-600 text-white p-3 sm:p-4 rounded-lg">
              <span>إجمالي الفاتورة:</span>
              <span>{formatCurrency(finalTotal)}</span>
            </div>
            
            {deposit > 0 && (
              <div className="flex justify-between text-xs sm:text-sm lg:text-base text-green-600 font-semibold bg-green-50 p-2 rounded">
                <span>المبلغ المسدد:</span>
                <span>{formatCurrency(deposit)}</span>
              </div>
            )}
            
            {remainingAmount > 0 && (
              <div className="flex justify-between text-sm sm:text-base lg:text-lg text-red-600 font-bold bg-red-50 p-2 rounded border border-red-200">
                <span>المبلغ المتبقي للسداد:</span>
                <span>{formatCurrency(remainingAmount)}</span>
              </div>
            )}
            
            {remainingAmount === 0 && finalTotal > 0 && (
              <div className="flex justify-center text-sm sm:text-base text-green-600 font-bold bg-green-100 p-3 rounded-lg border border-green-300">
                <span>✅ تم السداد بالكامل</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTotals;
