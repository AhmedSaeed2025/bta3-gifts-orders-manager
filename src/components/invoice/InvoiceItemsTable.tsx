
import React from 'react';
import { formatCurrency } from '@/lib/utils';

interface OrderItem {
  id: string;
  product_type: string;
  size: string;
  quantity: number;
  price: number;
  cost: number;
  profit: number;
  item_discount: number;
}

interface InvoiceItemsTableProps {
  items: OrderItem[];
}

const InvoiceItemsTable = ({ items }: InvoiceItemsTableProps) => {
  return (
    <div className="px-6 sm:px-8 lg:px-12 pb-6 sm:pb-8">
      <div className="bg-gray-50/50 rounded-xl p-4 sm:p-6 border border-gray-100">
        <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-800 mb-4 sm:mb-6 flex items-center">
          <span className="bg-purple-600 text-white px-2 py-1 rounded-lg ml-2 sm:ml-3 text-xs sm:text-sm">🛍️</span>
          تفاصيل الطلب
        </h3>
        
        {/* Mobile Card View */}
        <div className="block sm:hidden space-y-3 sm:space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-2 sm:mb-3">
                <h4 className="font-bold text-sm sm:text-base text-gray-800">{item.product_type}</h4>
                <span className="text-sm sm:text-base lg:text-lg font-bold text-green-600">
                  {formatCurrency(item.quantity * item.price - item.item_discount)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                <div>
                  <span className="text-gray-500">المقاس:</span>
                  <p className="font-medium text-gray-800">{item.size}</p>
                </div>
                <div>
                  <span className="text-gray-500">العدد:</span>
                  <p className="font-medium text-gray-800">{item.quantity}</p>
                </div>
                <div>
                  <span className="text-gray-500">السعر:</span>
                  <p className="font-medium text-gray-800">{formatCurrency(item.price)}</p>
                </div>
                {item.item_discount > 0 && (
                  <div>
                    <span className="text-gray-500">الخصم:</span>
                    <p className="font-medium text-red-600">{formatCurrency(item.item_discount)}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-l from-gray-100 to-gray-50">
                <th className="text-right p-3 sm:p-4 font-bold text-xs sm:text-sm lg:text-base text-gray-800 rounded-tr-lg">المنتج</th>
                <th className="text-center p-3 sm:p-4 font-bold text-xs sm:text-sm lg:text-base text-gray-800">المقاس</th>
                <th className="text-center p-3 sm:p-4 font-bold text-xs sm:text-sm lg:text-base text-gray-800">العدد</th>
                <th className="text-right p-3 sm:p-4 font-bold text-xs sm:text-sm lg:text-base text-gray-800">السعر</th>
                <th className="text-center p-3 sm:p-4 font-bold text-xs sm:text-sm lg:text-base text-gray-800">الخصم</th>
                <th className="text-right p-3 sm:p-4 font-bold text-xs sm:text-sm lg:text-base text-gray-800 rounded-tl-lg">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} border-b border-gray-100`}>
                  <td className="p-3 sm:p-4 text-xs sm:text-sm lg:text-base text-gray-800 font-medium">{item.product_type}</td>
                  <td className="p-3 sm:p-4 text-center text-xs sm:text-sm lg:text-base text-gray-700">{item.size}</td>
                  <td className="p-3 sm:p-4 text-center text-xs sm:text-sm lg:text-base text-gray-700">{item.quantity}</td>
                  <td className="p-3 sm:p-4 text-xs sm:text-sm lg:text-base text-gray-700">{formatCurrency(item.price)}</td>
                  <td className="p-3 sm:p-4 text-center text-xs sm:text-sm lg:text-base text-red-600">
                    {item.item_discount > 0 ? `-${formatCurrency(item.item_discount)}` : '-'}
                  </td>
                  <td className="p-3 sm:p-4 font-bold text-xs sm:text-sm lg:text-base text-green-600">
                    {formatCurrency(item.quantity * item.price - item.item_discount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvoiceItemsTable;
