
import React from "react";
import { formatCurrency } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Order } from "@/types";

interface InvoiceItemsProps {
  items: Order["items"];
}

export const InvoiceItems: React.FC<InvoiceItemsProps> = ({ items }) => {
  return (
    <div className="mb-3">
      <h3 className="font-semibold mb-1 text-sm">تفاصيل الطلب</h3>
      <div className="overflow-x-auto">
        <Table className="text-xs w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">المنتج</TableHead>
              <TableHead className="text-xs">المقاس</TableHead>
              <TableHead className="text-xs">الكمية</TableHead>
              <TableHead className="text-xs">السعر</TableHead>
              <TableHead className="text-xs">الإجمالي</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="text-xs p-1">{item.productType}</TableCell>
                <TableCell className="text-xs p-1">{item.size}</TableCell>
                <TableCell className="text-xs p-1">{item.quantity}</TableCell>
                <TableCell className="text-xs p-1">{formatCurrency(item.price)}</TableCell>
                <TableCell className="text-xs p-1">{formatCurrency(item.price * item.quantity)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
