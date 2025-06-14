
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Plus,
  Minus,
  PiggyBank,
  CreditCard,
  Truck,
  ShoppingCart
} from "lucide-react";

interface FinancialSummary {
  totalRevenue: number;
  totalCosts: number;
  totalShipping: number;
  totalDeposits: number;
  netProfit: number;
  totalCollections: number;
  totalShippingPayments: number;
  totalCostPayments: number;
  cashFlow: number;
  remainingCosts: number;
  remainingShipping: number;
  totalExpenses: number;
  totalOtherIncome: number;
}

interface AccountSummaryCardsProps {
  financialSummary: FinancialSummary;
}

const AccountSummaryCards: React.FC<AccountSummaryCardsProps> = ({ financialSummary }) => {
  const isMobile = useIsMobile();

  const cardData = [
    {
      title: "إجمالي المبيعات",
      value: financialSummary.totalRevenue,
      icon: ShoppingCart,
      gradient: "from-blue-500 to-blue-600",
      iconColor: "text-blue-200"
    },
    {
      title: "إجمالي التكاليف",
      value: financialSummary.totalCosts,
      icon: TrendingDown,
      gradient: "from-red-500 to-red-600",
      iconColor: "text-red-200"
    },
    {
      title: "التكاليف المدفوعة",
      value: financialSummary.totalCostPayments,
      icon: CreditCard,
      gradient: "from-pink-500 to-pink-600",
      iconColor: "text-pink-200"
    },
    {
      title: "التكاليف المتبقية",
      value: financialSummary.remainingCosts,
      icon: Minus,
      gradient: "from-rose-500 to-rose-600",
      iconColor: "text-rose-200"
    },
    {
      title: "إجمالي الشحن",
      value: financialSummary.totalShipping,
      icon: Truck,
      gradient: "from-orange-500 to-orange-600",
      iconColor: "text-orange-200"
    },
    {
      title: "الشحن المدفوع",
      value: financialSummary.totalShippingPayments,
      icon: Truck,
      gradient: "from-amber-500 to-amber-600",
      iconColor: "text-amber-200"
    },
    {
      title: "الشحن المتبقي",
      value: financialSummary.remainingShipping,
      icon: Minus,
      gradient: "from-yellow-500 to-yellow-600",
      iconColor: "text-yellow-200"
    },
    {
      title: "إجمالي المصروفات",
      value: financialSummary.totalExpenses,
      icon: TrendingDown,
      gradient: "from-purple-500 to-purple-600",
      iconColor: "text-purple-200"
    },
    {
      title: "الإيرادات الإضافية",
      value: financialSummary.totalOtherIncome,
      icon: Plus,
      gradient: "from-teal-500 to-teal-600",
      iconColor: "text-teal-200"
    }
  ];

  const mainMetrics = [
    {
      title: "صافي الربح",
      value: financialSummary.netProfit,
      icon: TrendingUp,
      gradient: "from-green-500 to-green-600",
      iconColor: "text-green-200"
    },
    {
      title: "إجمالي المحصل",
      value: financialSummary.totalCollections,
      icon: DollarSign,
      gradient: "from-emerald-500 to-emerald-600",
      iconColor: "text-emerald-200"
    },
    {
      title: "التدفق النقدي",
      value: financialSummary.cashFlow,
      icon: PiggyBank,
      gradient: "from-indigo-500 to-indigo-600",
      iconColor: "text-indigo-200"
    }
  ];

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-6">
      {/* الملخص المالي التفصيلي */}
      <div>
        <h3 className={`font-bold text-gray-800 dark:text-white mb-4 ${isMobile ? "text-sm" : "text-lg"}`}>
          الملخص المالي التفصيلي
        </h3>
        <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3"}`}>
          {cardData.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <Card key={index} className={`bg-gradient-to-br ${card.gradient} text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
                <CardContent className={`${isMobile ? "p-3" : "p-4"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className={`text-white/90 font-medium ${isMobile ? "text-xs" : "text-sm"}`}>
                        {truncateText(card.title, isMobile ? 12 : 20)}
                      </p>
                      <p className={`font-bold ltr-numbers ${isMobile ? "text-sm" : "text-lg"} mt-1`}>
                        {formatCurrency(card.value)}
                      </p>
                    </div>
                    <div className={`${isMobile ? "ml-2" : "ml-3"}`}>
                      <IconComponent className={`${isMobile ? "h-5 w-5" : "h-6 w-6"} ${card.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* المؤشرات الرئيسية */}
      <div>
        <h3 className={`font-bold text-gray-800 dark:text-white mb-4 ${isMobile ? "text-sm" : "text-lg"}`}>
          المؤشرات الرئيسية
        </h3>
        <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
          {mainMetrics.map((metric, index) => {
            const IconComponent = metric.icon;
            return (
              <Card key={index} className={`bg-gradient-to-br ${metric.gradient} text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2`}>
                <CardContent className={`${isMobile ? "p-4" : "p-6"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className={`text-white/90 font-medium ${isMobile ? "text-sm" : "text-base"}`}>
                        {metric.title}
                      </p>
                      <p className={`font-bold ltr-numbers ${isMobile ? "text-lg" : "text-2xl"} mt-2`}>
                        {formatCurrency(metric.value)}
                      </p>
                    </div>
                    <div className={`${isMobile ? "ml-3" : "ml-4"}`}>
                      <IconComponent className={`${isMobile ? "h-6 w-6" : "h-8 w-8"} ${metric.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AccountSummaryCards;
