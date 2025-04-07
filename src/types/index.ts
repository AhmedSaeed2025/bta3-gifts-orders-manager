
export interface OrderItem {
  productType: string;
  size: string;
  quantity: number;
  cost: number;
  price: number;
  profit: number;
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
    };
  };
}
