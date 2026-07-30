import * as XLSX from "xlsx";
import { calculateOrderFinancials } from "@/lib/orderFinancials";

const toEnDigits = (v: any) =>
  String(v ?? "").replace(/[\u0660-\u0669]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1584 + 48));

const fmtDate = (d: any) => {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
};

const num = (v: any) => {
  const n = Number(v);
  return isFinite(n) ? Math.round(n * 100) / 100 : 0;
};

export interface ExportableOrder {
  id?: string;
  serial?: string;
  status?: string;
  notes?: string | null;
  // orders table
  client_name?: string;
  phone?: string;
  phone2?: string | null;
  address?: string | null;
  date_created?: string;
  total?: number;
  order_items?: any[];
  // admin_orders table
  customer_name?: string;
  customer_phone?: string;
  customer_phone2?: string | null;
  customer_email?: string | null;
  shipping_address?: string | null;
  order_date?: string;
  total_amount?: number;
  admin_order_items?: any[];
  [k: string]: any;
}

const normalize = (o: ExportableOrder) => ({
  serial: o.serial || "",
  name: o.client_name || o.customer_name || "",
  phone: toEnDigits(o.phone || o.customer_phone || ""),
  phone2: toEnDigits(o.phone2 || o.customer_phone2 || ""),
  email: o.customer_email || o.email || "",
  governorate: o.governorate || "",
  address: o.address || o.shipping_address || "",
  date: fmtDate(o.date_created || o.order_date),
  paymentMethod: o.payment_method || "",
  deliveryMethod: o.delivery_method || "",
  notes: o.notes || "",
  items: (o.order_items || o.admin_order_items || []).map((i: any) => ({
    product: i.product_type || i.product_name || "",
    size: i.size || i.product_size || "",
    qty: num(i.quantity),
    unit: num(i.price ?? i.unit_price),
    cost: num(i.cost ?? i.unit_cost),
    discount: num(i.item_discount),
  })),
});

/**
 * Exports orders to a well-formatted .xlsx file (2 sheets: summary + line items).
 */
export function exportOrdersToExcel(
  orders: ExportableOrder[],
  fileBaseName = "orders",
  statusLabel: (s: string) => string = (s) => s
) {
  const summaryRows: any[] = [];
  const itemRows: any[] = [];

  orders.forEach((raw) => {
    const o = normalize(raw);
    const fin = calculateOrderFinancials(raw as any);

    summaryRows.push({
      "رقم الطلب": o.serial,
      "التاريخ": o.date,
      "اسم العميل": o.name,
      "الهاتف": o.phone,
      "هاتف إضافي": o.phone2,
      "المحافظة": o.governorate,
      "العنوان": o.address,
      "طريقة الاستلام": o.deliveryMethod,
      "طريقة الدفع": o.paymentMethod,
      "الحالة": statusLabel(String(raw.status || "")),
      "عدد الأصناف": o.items.reduce((s, i) => s + i.qty, 0),
      "إجمالي المنتجات": num(fin.subtotal ?? 0),
      "الشحن": num(fin.shipping ?? 0),
      "الخصم": num(fin.discount ?? 0),
      "الإجمالي": num(fin.total ?? raw.total ?? raw.total_amount ?? 0),
      "المدفوع": num(fin.paid ?? 0),
      "المتبقي": num(fin.remaining ?? 0),
      "الربح": num(raw.profit ?? 0),
      "ملاحظات": o.notes,
    });

    o.items.forEach((i) => {
      itemRows.push({
        "رقم الطلب": o.serial,
        "التاريخ": o.date,
        "اسم العميل": o.name,
        "المنتج": i.product,
        "المقاس": i.size,
        "الكمية": i.qty,
        "سعر الوحدة": i.unit,
        "التكلفة": i.cost,
        "خصم الصنف": i.discount,
        "الإجمالي": num(i.qty * i.unit - i.discount * i.qty),
      });
    });
  });

  if (!summaryRows.length) return 0;

  const wb = XLSX.utils.book_new();

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary["!cols"] = [
    { wch: 16 }, { wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 34 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 14 },
    { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 28 },
  ];
  (wsSummary as any)["!freeze"] = { xSplit: 0, ySplit: 1 };
  wsSummary["!autofilter"] = { ref: wsSummary["!ref"] as string };
  XLSX.utils.book_append_sheet(wb, wsSummary, "الطلبات");

  if (itemRows.length) {
    const wsItems = XLSX.utils.json_to_sheet(itemRows);
    wsItems["!cols"] = [
      { wch: 16 }, { wch: 12 }, { wch: 22 }, { wch: 26 }, { wch: 12 },
      { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    ];
    wsItems["!autofilter"] = { ref: wsItems["!ref"] as string };
    XLSX.utils.book_append_sheet(wb, wsItems, "الأصناف");
  }

  XLSX.writeFile(wb, `${fileBaseName}_${fmtDate(new Date())}.xlsx`);
  return summaryRows.length;
}
