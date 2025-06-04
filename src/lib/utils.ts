import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { MonthlyReport } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
  }).format(amount);
};

export const generateMonthlyReport = (orders: any[]): MonthlyReport => {
  const report: MonthlyReport = {};
  
  orders.forEach(order => {
    const orderDate = new Date(order.dateCreated);
    const monthKey = orderDate.toLocaleDateString('ar-EG', { 
      year: 'numeric', 
      month: 'long' 
    });
    
    if (!report[monthKey]) {
      report[monthKey] = {};
    }
    
    order.items?.forEach((item: any) => {
      const productType = item.productType;
      
      if (!report[monthKey][productType]) {
        report[monthKey][productType] = {
          totalCost: 0,
          totalSales: 0,
          totalShipping: 0
        };
      }
      
      const itemCost = item.cost * item.quantity;
      const itemSales = item.price * item.quantity;
      const itemShipping = (order.shippingCost || 0) * (item.quantity / order.items.reduce((sum: number, i: any) => sum + i.quantity, 0));
      
      report[monthKey][productType].totalCost += itemCost;
      report[monthKey][productType].totalSales += itemSales;
      report[monthKey][productType].totalShipping += itemShipping;
    });
  });
  
  return report;
};

export const exportToExcel = (tableId: string, fileName: string) => {
  const table = document.getElementById(tableId);
  if (!table) {
    console.error('Table not found');
    return;
  }

  const wb = XLSX.utils.table_to_book(table, { sheet: 'Sheet JS' });
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

  const blob = new Blob([new Uint8Array(wbout)], { type: 'application/octet-stream' });
  saveAs(blob, `${fileName}.xlsx`);
};
