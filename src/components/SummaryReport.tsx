
import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { formatCurrency, exportToExcel } from "@/lib/utils";
import { DownloadCloud, FileText, Download } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";

const SummaryReport = () => {
  const { orders, loading } = useSupabaseOrders();
  const reportRef = useRef<HTMLDivElement>(null);

  const handleExcelExport = () => {
    exportToExcel("summaryTable", "Orders_Report");
  };

  const handlePDFExport = async () => {
    if (!reportRef.current) return;
    
    try {
      toast.info("جاري إنشاء ملف PDF...");
      
      reportRef.current.classList.add('pdf-export');
      
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: reportRef.current.scrollWidth,
        height: reportRef.current.scrollHeight,
        windowWidth: 794,
        windowHeight: 1123
      });
      
      reportRef.current.classList.remove('pdf-export');
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      
      const imgWidth = 297; // A4 landscape width
      const pageHeight = 210; // A4 landscape height
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`تقرير_الطلبات_${new Date().toLocaleDateString('ar-EG')}.pdf`);
      toast.success("تم إنشاء ملف PDF بنجاح");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("حدث خطأ أثناء إنشاء ملف PDF");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gift-primary mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">جاري تحميل التقارير...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rtl" style={{ direction: 'rtl' }}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            <FileText className="h-5 w-5" />
            تقرير الطلبات
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={handlePDFExport}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              تصدير PDF
            </Button>
            <Button 
              onClick={handleExcelExport}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              <DownloadCloud className="h-4 w-4" />
              تصدير Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={reportRef} className="overflow-x-auto">
            <table id="summaryTable" className="gift-table">
              <thead>
                <tr>
                  <th>Order_Number</th>
                  <th>Date</th>
                  <th>Client_Name</th>
                  <th>Phone</th>
                  <th>Payment_Method</th>
                  <th>Delivery_Method</th>
                  <th>Address</th>
                  <th>Governorate</th>
                  <th>Product_Type</th>
                  <th>Size</th>
                  <th>Quantity</th>
                  <th>Sale_Price</th>
                  <th>Cost_Price</th>
                  <th>Discount</th>
                  <th>Shipping_Cost</th>
                  <th>Total</th>
                  <th>Profit</th>
                  <th>Order_Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.flatMap((order, orderIndex) => {
                    const items = order.items || [];
                    
                    return items.map((item, itemIndex) => (
                      <tr key={`${order.serial}-${itemIndex}`}>
                        <td>GFT{order.serial}</td>
                        <td>{new Date(order.dateCreated).toLocaleDateString('en-US')}</td>
                        <td>{order.clientName}</td>
                        <td>{order.phone}</td>
                        <td>{order.paymentMethod}</td>
                        <td>{order.deliveryMethod}</td>
                        <td>{order.address}</td>
                        <td>{order.governorate}</td>
                        <td>{item.productType}</td>
                        <td>{item.size}</td>
                        <td>{item.quantity}</td>
                        <td>{item.price.toFixed(2)}</td>
                        <td>{item.cost.toFixed(2)}</td>
                        <td>{itemIndex === 0 ? order.discount.toFixed(2) : "0.00"}</td>
                        <td>{itemIndex === 0 ? order.shippingCost.toFixed(2) : "0.00"}</td>
                        <td>{itemIndex === 0 ? order.total.toFixed(2) : "-"}</td>
                        <td>{item.profit.toFixed(2)}</td>
                        <td>{order.status}</td>
                      </tr>
                    ));
                  })
                ) : (
                  <tr>
                    <td colSpan={18} className="text-center py-4">No data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryReport;
