
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Order } from "@/types";
import * as XLSX from 'xlsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return `${amount.toFixed(2)} جنيه`;
}

export function generateSerialNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const timestamp = now.getTime().toString().slice(-4);
  
  return `${year}${month}${day}${timestamp}`;
}

export function generateMonthlyReport(orders: Order[]) {
  const report: Record<string, Record<string, { totalCost: number; totalSales: number }>> = {};

  orders.forEach(order => {
    const date = new Date(order.dateCreated);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (!report[monthKey]) {
      report[monthKey] = {};
    }

    order.items?.forEach(item => {
      if (!report[monthKey][item.productType]) {
        report[monthKey][item.productType] = { totalCost: 0, totalSales: 0 };
      }
      
      report[monthKey][item.productType].totalCost += item.cost * item.quantity;
      report[monthKey][item.productType].totalSales += item.price * item.quantity;
    });
  });

  return report;
}

export function calculateTotals(orders: Order[]) {
  let totalCost = 0;
  let totalSales = 0;

  orders.forEach(order => {
    order.items?.forEach(item => {
      totalCost += item.cost * item.quantity;
      totalSales += item.price * item.quantity;
    });
  });

  return {
    totalCost,
    totalSales,
    netProfit: totalSales - totalCost
  };
}

export function exportToExcel(tableId: string, filename: string) {
  try {
    const table = document.getElementById(tableId);
    if (!table) {
      console.error('Table not found');
      return;
    }

    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Convert table to worksheet with English headers
    const ws = XLSX.utils.table_to_sheet(table);
    
    // Replace Arabic headers with English ones for better Excel compatibility
    const englishHeaders = {
      'رقم الطلب': 'Order_Number',
      'التاريخ': 'Date',
      'اسم العميل': 'Client_Name',
      'رقم التليفون': 'Phone',
      'طريقة السداد': 'Payment_Method',
      'طريقة الاستلام': 'Delivery_Method',
      'العنوان': 'Address',
      'المحافظة': 'Governorate',
      'نوع المنتج': 'Product_Type',
      'المقاس': 'Size',
      'الكمية': 'Quantity',
      'سعر البيع': 'Sale_Price',
      'سعر التكلفة': 'Cost_Price',
      'الخصم': 'Discount',
      'مصاريف الشحن': 'Shipping_Cost',
      'الإجمالي': 'Total',
      'الربح': 'Profit',
      'حالة الطلب': 'Order_Status',
      'الشهر': 'Month',
      'إجمالي التكاليف': 'Total_Costs',
      'إجمالي المبيعات': 'Total_Sales',
      'صافي الربح': 'Net_Profit'
    };

    // Get the range of the worksheet
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    
    // Replace headers in the first row
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      const cell = ws[cellRef];
      if (cell && cell.v && englishHeaders[cell.v as keyof typeof englishHeaders]) {
        cell.v = englishHeaders[cell.v as keyof typeof englishHeaders];
      }
    }
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    
    // Write file
    XLSX.writeFile(wb, `${filename}.xlsx`);
    
    console.log('Excel file exported successfully');
  } catch (error) {
    console.error('Export to Excel failed:', error);
  }
}
