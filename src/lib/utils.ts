
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import * as XLSX from 'xlsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount).replace('EGP', 'ج.م').replace(/[\u0660-\u0669]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1584 + 48))
}

export function exportToExcel(tableId: string, fileName: string) {
  const table = document.getElementById(tableId);
  if (!table) {
    console.error('Table not found');
    return;
  }

  const wb = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

// Enhanced export function for profit report
export function exportProfitReportToExcel(data: any[], fileName: string) {
  // Prepare data for Excel export
  const excelData = data.map(row => ({
    'الشهر': row.month,
    'نوع المنتج': row.productType,
    'الكمية': row.quantity,
    'إجمالي التكاليف': row.totalCost,
    'إجمالي المبيعات': row.totalSales,
    'إجمالي الشحن': row.totalShipping,
    'إجمالي الخصومات': row.totalDiscounts,
    'صافي الربح': row.netProfit
  }));

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);
  
  // Set column widths
  const colWidths = [
    { wch: 15 }, // الشهر
    { wch: 20 }, // نوع المنتج
    { wch: 10 }, // الكمية
    { wch: 15 }, // إجمالي التكاليف
    { wch: 15 }, // إجمالي المبيعات
    { wch: 15 }, // إجمالي الشحن
    { wch: 15 }, // إجمالي الخصومات
    { wch: 15 }, // صافي الربح
  ];
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "تقرير الأرباح");
  
  // Save file
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

export function generateMonthlyReport(orders: any[]) {
  const monthlyReport: Record<string, Record<string, any>> = {};
  
  orders.forEach(order => {
    const orderDate = new Date(order.dateCreated);
    const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyReport[monthKey]) {
      monthlyReport[monthKey] = {};
    }
    
    order.items?.forEach((item: any) => {
      const productType = item.productType;
      
      if (!monthlyReport[monthKey][productType]) {
        monthlyReport[monthKey][productType] = {
          totalCost: 0,
          totalSales: 0,
          totalShipping: 0,
          totalDiscounts: 0,
          quantity: 0
        };
      }
      
      const itemCost = item.cost * item.quantity;
      const itemSales = item.price * item.quantity;
      const itemDiscounts = (item.itemDiscount || 0) * item.quantity;
      
      monthlyReport[monthKey][productType].totalCost += itemCost;
      monthlyReport[monthKey][productType].totalSales += itemSales;
      monthlyReport[monthKey][productType].totalDiscounts += itemDiscounts;
      monthlyReport[monthKey][productType].quantity += item.quantity;
    });
    
    // Add shipping cost and order discount to the first product type for this order
    if (order.items && order.items.length > 0) {
      const firstProductType = order.items[0].productType;
      if (monthlyReport[monthKey][firstProductType]) {
        monthlyReport[monthKey][firstProductType].totalShipping += order.shippingCost || 0;
        // Add order-level discount to the first product
        monthlyReport[monthKey][firstProductType].totalDiscounts += order.discount || 0;
      }
    }
  });
  
  return monthlyReport;
}
