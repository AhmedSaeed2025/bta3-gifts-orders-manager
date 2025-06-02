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

export function generateSerialNumber(existingOrders: Order[] = []): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // آخر رقمين من السنة
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // الشهر بتنسيق 01-12
  
  // البحث عن آخر رقم في نفس الشهر والسنة
  const currentPrefix = `INV-${year}${month}`;
  let maxSequence = 0;
  
  existingOrders.forEach(order => {
    if (order.serial.startsWith(currentPrefix)) {
      const sequencePart = order.serial.split('-')[2];
      if (sequencePart) {
        const sequenceNum = parseInt(sequencePart);
        if (!isNaN(sequenceNum) && sequenceNum > maxSequence) {
          maxSequence = sequenceNum;
        }
      }
    }
  });
  
  const nextSequence = (maxSequence + 1).toString().padStart(4, '0');
  return `${currentPrefix}-${nextSequence}`;
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
    
    // Convert table to worksheet
    const ws = XLSX.utils.table_to_sheet(table);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    
    // Write file
    XLSX.writeFile(wb, `${filename}.xlsx`);
    
    console.log('Excel file exported successfully');
  } catch (error) {
    console.error('Export to Excel failed:', error);
  }
}
