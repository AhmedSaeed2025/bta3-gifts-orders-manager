
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { MonthlyReport, Order } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return amount.toFixed(2) + " جنيه"
}

export function calculateTotal(price: number, quantity: number, discount: number): number {
  return (price * quantity) - discount
}

export function calculateProfit(price: number, cost: number, quantity: number): number {
  return (price - cost) * quantity
}

export function generateMonthlyReport(orders: Order[] | undefined): MonthlyReport {
  const report: MonthlyReport = {}
  
  // Guard clause to handle undefined or empty orders array
  if (!orders || orders.length === 0) {
    return report;
  }
  
  orders.forEach(order => {
    const orderDate = new Date(order.dateCreated)
    const month = orderDate.toLocaleString('default', { month: 'long' })
    
    // Check if order.items exists before trying to iterate over it
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        if (!report[month]) {
          report[month] = {}
        }
        
        if (!report[month][item.productType]) {
          report[month][item.productType] = { totalCost: 0, totalSales: 0 }
        }
        
        report[month][item.productType].totalCost += item.cost * item.quantity
        report[month][item.productType].totalSales += item.price * item.quantity
      })
    }
  })
  
  return report
}

export function calculateTotals(orders: Order[] | undefined) {
  // Default values when orders is undefined or empty
  if (!orders || orders.length === 0) {
    return { totalCost: 0, totalSales: 0, netProfit: 0 };
  }

  const totalCost = orders.reduce((sum, order) => 
    sum + (order.items ? order.items.reduce((itemSum, item) => itemSum + (item.cost * item.quantity), 0) : 0), 0)
    
  const totalSales = orders.reduce((sum, order) => sum + order.total, 0)
  const netProfit = totalSales - totalCost
  
  return { totalCost, totalSales, netProfit }
}

export function exportToExcel(tableId: string, fileName: string) {
  const table = document.getElementById(tableId)
  if (!table) return
  
  const rows = table.querySelectorAll('tr')
  let csvContent = "data:text/csv;charset=utf-8,"
  
  rows.forEach(row => {
    const rowData: string[] = []
    row.querySelectorAll('th, td').forEach(cell => {
      rowData.push(cell.textContent || '')
    })
    csvContent += rowData.join(",") + "\n"
  })
  
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", `${fileName}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
