
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

export function generateMonthlyReport(orders: Order[]): MonthlyReport {
  const report: MonthlyReport = {}
  
  orders.forEach(order => {
    const orderDate = new Date(order.dateCreated)
    const month = orderDate.toLocaleString('default', { month: 'long' })
    
    if (!report[month]) {
      report[month] = {}
    }
    
    if (!report[month][order.productType]) {
      report[month][order.productType] = { totalCost: 0, totalSales: 0 }
    }
    
    report[month][order.productType].totalCost += order.cost * order.quantity
    report[month][order.productType].totalSales += order.price * order.quantity
  })
  
  return report
}

export function calculateTotals(orders: Order[]) {
  const totalCost = orders.reduce((sum, order) => sum + (order.cost * order.quantity), 0)
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
