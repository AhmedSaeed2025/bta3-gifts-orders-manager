
import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Order, ORDER_STATUS_LABELS } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useReactToPrint } from "react-to-print";
import { 
  Facebook, 
  Phone, 
  Home, 
  Map, 
  Instagram, 
  Send,
  Link 
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InvoiceHeader } from "./invoice/InvoiceHeader";
import { InvoiceDetails } from "./invoice/InvoiceDetails";
import { InvoiceItems } from "./invoice/InvoiceItems";
import { InvoiceFooter } from "./invoice/InvoiceFooter";

interface InvoiceProps {
  order: Order;
}

const Invoice: React.FC<InvoiceProps> = ({ order }) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!order) {
    return <div>لا توجد بيانات للفاتورة</div>;
  }

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `فاتورة_${order.serial}`,
    pageStyle: '@page { size: A5; margin: 10mm; }',
    removeAfterPrint: true
  });

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button 
          onClick={handlePrint}
          className="bg-gift-secondary hover:bg-gift-secondaryHover"
        >
          طباعة الفاتورة
        </Button>
      </div>
      
      <Card ref={printRef} className="print:shadow-none print:border-none max-w-md mx-auto">
        <CardContent className="p-4 text-sm">
          <InvoiceHeader />
          <InvoiceDetails order={order} />
          <InvoiceItems items={order.items || []} />
          <InvoiceFooter order={order} />
        </CardContent>
      </Card>
    </div>
  );
};

export default Invoice;
