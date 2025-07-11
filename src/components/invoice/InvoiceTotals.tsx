
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
              <div className="flex justify-between text-xs sm:text-sm lg:text-base text-blue-600 font-semibold">
                <span>المبلغ المسدد:</span>
                <span>{formatCurrency(deposit)}</span>
              </div>
            )}
            
            {remainingAmount > 0 && (
              <div className="flex justify-between text-sm sm:text-base lg:text-lg text-orange-600 font-bold">
                <span>المبلغ المتبقي:</span>
                <span>{formatCurrency(remainingAmount)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTotals;
