
import React from "react";
import { Order } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { 
  Facebook, 
  Phone, 
  Instagram, 
  Send, 
  Link 
} from "lucide-react";

interface InvoiceFooterProps {
  order: Order;
}

export const InvoiceFooter: React.FC<InvoiceFooterProps> = ({ order }) => {
  const items = order.items || [];
  
  return (
    <>
      <div className="flex justify-end">
        <div className="w-full">
          <div className="flex justify-between py-1 text-xs">
            <span className="font-medium">إجمالي المنتجات:</span>
            <span>{formatCurrency(items.reduce((sum, item) => sum + item.price * item.quantity, 0))}</span>
          </div>
          {order.shippingCost > 0 && (
            <div className="flex justify-between py-1 border-t border-gray-200 dark:border-gray-700 text-xs">
              <span className="font-medium">مصاريف الشحن:</span>
              <span>{formatCurrency(order.shippingCost)}</span>
            </div>
          )}
          {order.deposit > 0 && (
            <div className="flex justify-between py-1 border-t border-gray-200 dark:border-gray-700 text-xs">
              <span className="font-medium">العربون:</span>
              <span>{formatCurrency(order.deposit)}</span>
            </div>
          )}
          {order.discount > 0 && (
            <div className="flex justify-between py-1 border-t border-gray-200 dark:border-gray-700 text-xs">
              <span className="font-medium">الخصم:</span>
              <span className="text-red-600">{formatCurrency(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between py-1 border-t border-gray-200 dark:border-gray-700 text-sm">
            <span className="font-bold">المجموع الكلي:</span>
            <span className="font-bold">{formatCurrency(order.total)}</span>
          </div>
          {order.deposit > 0 && (
            <div className="flex justify-between py-1 border-t border-gray-200 dark:border-gray-700 text-sm">
              <span className="font-bold">المتبقي:</span>
              <span className="font-bold">{formatCurrency(order.total - order.deposit)}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-4 pt-2 border-t border-gray-200 dark:border-gray-700 text-center text-[10px] text-gray-500 dark:text-gray-400">
        <p>شكراً لثقتكم في #بتاع_هدايا_الأصلى</p>
        <div className="flex justify-center items-center gap-1 mt-1">
          <Phone size={10} />
          <span>للتواصل: 01113977005</span>
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1 mt-1">
          <div className="flex items-center gap-1">
            <Facebook size={10} />
            <a href="https://www.facebook.com/D4Uofficial" className="text-blue-600 hover:underline">
              D4Uofficial
            </a>
          </div>
          
          <div className="flex items-center gap-1">
            <Instagram size={10} />
            <a href="https://www.instagram.com/design4you_gift_store" className="text-purple-600 hover:underline">
              design4you_gift_store
            </a>
          </div>
          
          <div className="flex items-center gap-1">
            <Send size={10} />
            <a href="https://t.me/GiftsEg" className="text-blue-500 hover:underline">
              GiftsEg
            </a>
          </div>
          
          <div className="flex items-center gap-1">
            <Link size={10} />
            <a href="https://www.tiktok.com/@giftstore2022" className="text-black dark:text-white hover:underline">
              giftstore2022
            </a>
          </div>
        </div>
        
        <p className="mt-2 text-[8px]">جميع الحقوق محفوظة #بتاع_هدايا_الأصلى 2025</p>
      </div>
    </>
  );
};
