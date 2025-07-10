export interface OrderItem {
  productType: string;
  size: string;
  quantity: number;
  cost: number;
  price: number;
  profit: number;
  itemDiscount?: number; // خصم على مستوى الصنف
}

export interface Order {
  serial: string;
  paymentMethod: string;
  clientName: string;
  phone: string;
  deliveryMethod: string;
  address: string;
  governorate: string;
  items: OrderItem[];
  shippingCost: number;
  discount: number;
  deposit: number;
  total: number;
  profit: number;
  status: OrderStatus;
  dateCreated: string;
  notes?: string; // Add notes property
}

export type OrderStatus = "pending" | "confirmed" | "processing" | "sentToPrinter" | "readyForDelivery" | "shipped" | "delivered" | "cancelled";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "قيد المراجعة",
  confirmed: "تم التأكيد", 
  processing: "قيد التحضير",
  sentToPrinter: "تم الإرسال للمطبعة",
  readyForDelivery: "تحت التسليم",
  shipped: "تم الشحن",
  delivered: "تم التوصيل",
  cancelled: "ملغي"
};

export const ORDER_STATUS_ORDER: OrderStatus[] = [
  "pending",
  "confirmed", 
  "processing",
  "sentToPrinter",
  "readyForDelivery",
  "shipped",
  "delivered"
];

export interface OrderStatusConfig {
  status: OrderStatus;
  label: string;
  order: number;
  enabled: boolean;
}

export interface ProposedPrice {
  cost: number;
  price: number;
}

export interface ProposedPrices {
  [productType: string]: {
    [size: string]: ProposedPrice;
  };
}

export interface MonthlyReport {
  [month: string]: {
    [productType: string]: {
      totalCost: number;
      totalSales: number;
      totalShipping: number;
    };
  };
}

export interface Product {
  id: string;
  name: string;
  sizes: ProductSize[];
  category?: string; // Add category field
}

export interface ProductSize {
  size: string;
  cost: number;
  price: number;
}
