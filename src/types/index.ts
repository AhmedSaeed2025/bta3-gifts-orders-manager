
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
}

export type OrderStatus = "pending" | "confirmed" | "sentToPrinter" | "readyForDelivery" | "shipped";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "في انتظار التأكيد",
  confirmed: "تم التأكيد",
  sentToPrinter: "تم الأرسال للمطبعة",
  readyForDelivery: "تحت التسليم",
  shipped: "تم الشحن"
};

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
}

export interface ProductSize {
  size: string;
  cost: number;
  price: number;
}
