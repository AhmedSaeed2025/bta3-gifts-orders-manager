
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart,
  Package,
  Truck,
  Percent,
  Hash
} from "lucide-react";

interface ProfitSummaryProps {
  totalCost: number;
  totalSales: number;
  totalShipping: number;
  totalDiscounts: number;
  netProfit: number;
  totalItems: number;
  totalOrders: number;
  avgOrderValue: number;
}

const ProfitSummaryCards: React.FC<{ summary: ProfitSummaryProps }> = ({ summary }) => {
  const isMobile = useIsMobile();

  const summaryCards = [
    {
      title: "إجمالي المبيعات",
      value: summary.totalSales,
      icon: ShoppingCart,
      gradient: "from-blue-500 to-blue-600",
      iconColor: "text-blue-200",
      format: "currency"
    },
    {
      title: "إجمالي التكاليف",
      value: summary.totalCost,
      icon: TrendingDown,
      gradient: "from-red-500 to-red-600",
      iconColor: "text-red-200",
      format: "currency"
    },
    {
      title: "إجمالي الشحن",
      value: summary.totalShipping,
      icon: Truck,
      gradient: "from-orange-500 to-orange-600",
      iconColor: "text-orange-200",
      format: "currency"
    },
    {
      title: "إجمالي الخصومات",
      value: summary.totalDiscounts,
      icon: Percent,
      gradient: "from-purple-500 to-purple-600",
      iconColor: "text-purple-200",
      format: "currency"
    },
    {
      title: "صافي الربح",
      value: summary.netProfit,
      icon: TrendingUp,
      gradient: "from-green-500 to-green-600",
      iconColor: "text-green-200",
      format: "currency"
    },
    {
      title: "عدد المنتجات",
      value: summary.totalItems,
      icon: Package,
      gradient: "from-indigo-500 to-indigo-600",
      iconColor: "text-indigo-200",
      format: "number"
    },
    {
      title: "عدد الطلبات",
      value: summary.totalOrders,
      icon: Hash,
      gradient: "from-teal-500 to-teal-600",
      iconColor: "text-teal-200",
      format: "number"
    },
    {
      title: "متوسط قيمة الطلب",
      value: summary.avgOrderValue,
      icon: DollarSign,
      gradient: "from-emerald-500 to-emerald-600",
      iconColor: "text-emerald-200",
      format: "currency"
    }
  ];

  const formatValue = (value: number, format: string) => {
    if (format === "currency") {
      return formatCurrency(value);
    }
    return value.toString();
  };

  return (
    <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-4"}`}>
      {summaryCards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <Card key={index} className={`bg-gradient-to-br ${card.gradient} text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
            <CardContent className={`${isMobile ? "p-4" : "p-6"}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className={`text-white/90 font-medium ${isMobile ? "text-sm" : "text-base"}`}>
                    {card.title}
                  </p>
                  <p className={`font-bold ltr-numbers ${isMobile ? "text-lg" : "text-2xl"} mt-2`}>
                    {formatValue(card.value, card.format)}
                  </p>
                </div>
                <div className={`${isMobile ? "ml-3" : "ml-4"}`}>
                  <IconComponent className={`${isMobile ? "h-6 w-6" : "h-8 w-8"} ${card.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ProfitSummaryCards;
