
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
      gradient: isMobile ? "from-blue-400 to-blue-500" : "from-blue-500 to-blue-600",
      bgColor: isMobile ? "bg-blue-50 dark:bg-blue-900/20" : "",
      textColor: isMobile ? "text-blue-700 dark:text-blue-300" : "text-white",
      iconColor: isMobile ? "text-blue-600 dark:text-blue-400" : "text-blue-200",
      border: isMobile ? "border border-blue-200 dark:border-blue-700" : ""
    },
    {
      title: "إجمالي التكاليف",
      value: financialSummary.totalCosts,
      icon: TrendingDown,
      gradient: isMobile ? "from-red-400 to-red-500" : "from-red-500 to-red-600",
      bgColor: isMobile ? "bg-red-50 dark:bg-red-900/20" : "",
      textColor: isMobile ? "text-red-700 dark:text-red-300" : "text-white",
      iconColor: isMobile ? "text-red-600 dark:text-red-400" : "text-red-200",
      border: isMobile ? "border border-red-200 dark:border-red-700" : ""
    },
    {
      title: "التكاليف المدفوعة",
      value: financialSummary.totalCostPayments,
      icon: CreditCard,
      gradient: isMobile ? "from-pink-400 to-pink-500" : "from-pink-500 to-pink-600",
      bgColor: isMobile ? "bg-pink-50 dark:bg-pink-900/20" : "",
      textColor: isMobile ? "text-pink-700 dark:text-pink-300" : "text-white",
      iconColor: isMobile ? "text-pink-600 dark:text-pink-400" : "text-pink-200",
      border: isMobile ? "border border-pink-200 dark:border-pink-700" : ""
    },
    {
      title: "التكاليف المتبقية",
      value: financialSummary.remainingCosts,
      icon: Minus,
      gradient: isMobile ? "from-rose-400 to-rose-500" : "from-rose-500 to-rose-600",
      bgColor: isMobile ? "bg-rose-50 dark:bg-rose-900/20" : "",
      textColor: isMobile ? "text-rose-700 dark:text-rose-300" : "text-white",
      iconColor: isMobile ? "text-rose-600 dark:text-rose-400" : "text-rose-200",
      border: isMobile ? "border border-rose-200 dark:border-rose-700" : ""
    },
    {
      title: "إجمالي الشحن",
      value: financialSummary.totalShipping,
      icon: Truck,
      gradient: isMobile ? "from-orange-400 to-orange-500" : "from-orange-500 to-orange-600",
      bgColor: isMobile ? "bg-orange-50 dark:bg-orange-900/20" : "",
      textColor: isMobile ? "text-orange-700 dark:text-orange-300" : "text-white",
      iconColor: isMobile ? "text-orange-600 dark:text-orange-400" : "text-orange-200",
      border: isMobile ? "border border-orange-200 dark:border-orange-700" : ""
    },
    {
      title: "الشحن المدفوع",
      value: financialSummary.totalShippingPayments,
      icon: Truck,
      gradient: isMobile ? "from-amber-400 to-amber-500" : "from-amber-500 to-amber-600",
      bgColor: isMobile ? "bg-amber-50 dark:bg-amber-900/20" : "",
      textColor: isMobile ? "text-amber-700 dark:text-amber-300" : "text-white",
      iconColor: isMobile ? "text-amber-600 dark:text-amber-400" : "text-amber-200",
      border: isMobile ? "border border-amber-200 dark:border-amber-700" : ""
    },
    {
      title: "الشحن المتبقي",
      value: financialSummary.remainingShipping,
      icon: Minus,
      gradient: isMobile ? "from-yellow-400 to-yellow-500" : "from-yellow-500 to-yellow-600",
      bgColor: isMobile ? "bg-yellow-50 dark:bg-yellow-900/20" : "",
      textColor: isMobile ? "text-yellow-700 dark:text-yellow-300" : "text-white",
      iconColor: isMobile ? "text-yellow-600 dark:text-yellow-400" : "text-yellow-200",
      border: isMobile ? "border border-yellow-200 dark:border-yellow-700" : ""
    },
    {
      title: "إجمالي المصروفات",
      value: financialSummary.totalExpenses,
      icon: TrendingDown,
      gradient: isMobile ? "from-purple-400 to-purple-500" : "from-purple-500 to-purple-600",
      bgColor: isMobile ? "bg-purple-50 dark:bg-purple-900/20" : "",
      textColor: isMobile ? "text-purple-700 dark:text-purple-300" : "text-white",
      iconColor: isMobile ? "text-purple-600 dark:text-purple-400" : "text-purple-200",
      border: isMobile ? "border border-purple-200 dark:border-purple-700" : ""
    },
    {
      title: "الإيرادات الإضافية",
      value: financialSummary.totalOtherIncome,
      icon: Plus,
      gradient: isMobile ? "from-teal-400 to-teal-500" : "from-teal-500 to-teal-600",
      bgColor: isMobile ? "bg-teal-50 dark:bg-teal-900/20" : "",
      textColor: isMobile ? "text-teal-700 dark:text-teal-300" : "text-white",
      iconColor: isMobile ? "text-teal-600 dark:text-teal-400" : "text-teal-200",
      border: isMobile ? "border border-teal-200 dark:border-teal-700" : ""
    }
  ];

  const mainMetrics = [
    {
      title: "صافي الربح",
      value: financialSummary.netProfit,
      icon: TrendingUp,
      gradient: isMobile ? "from-green-400 to-green-500" : "from-green-500 to-green-600",
      bgColor: isMobile ? "bg-green-50 dark:bg-green-900/20" : "",
      textColor: isMobile ? "text-green-700 dark:text-green-300" : "text-white",
      iconColor: isMobile ? "text-green-600 dark:text-green-400" : "text-green-200",
      border: isMobile ? "border border-green-200 dark:border-green-700" : ""
    },
    {
      title: "إجمالي المحصل",
      value: financialSummary.totalCollections,
      icon: DollarSign,
      gradient: isMobile ? "from-emerald-400 to-emerald-500" : "from-emerald-500 to-emerald-600",
      bgColor: isMobile ? "bg-emerald-50 dark:bg-emerald-900/20" : "",
      textColor: isMobile ? "text-emerald-700 dark:text-emerald-300" : "text-white",
      iconColor: isMobile ? "text-emerald-600 dark:text-emerald-400" : "text-emerald-200",
      border: isMobile ? "border border-emerald-200 dark:border-emerald-700" : ""
    },
    {
      title: "التدفق النقدي",
      value: financialSummary.cashFlow,
      icon: PiggyBank,
      gradient: isMobile ? "from-indigo-400 to-indigo-500" : "from-indigo-500 to-indigo-600",
      bgColor: isMobile ? "bg-indigo-50 dark:bg-indigo-900/20" : "",
      textColor: isMobile ? "text-indigo-700 dark:text-indigo-300" : "text-white",
      iconColor: isMobile ? "text-indigo-600 dark:text-indigo-400" : "text-indigo-200",
      border: isMobile ? "border border-indigo-200 dark:border-indigo-700" : ""
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
        <h3 className={`font-bold mb-4 ${isMobile ? "text-sm text-gray-700 dark:text-gray-300" : "text-lg text-gray-800 dark:text-white"}`}>
          الملخص المالي التفصيلي
        </h3>
        <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3"}`}>
          {cardData.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <Card 
                key={index} 
                className={`
                  ${isMobile 
                    ? `${card.bgColor} ${card.border} shadow-sm hover:shadow-md` 
                    : `bg-gradient-to-br ${card.gradient} text-white shadow-lg hover:shadow-xl`
                  }
                  transition-all duration-300 transform hover:-translate-y-1
                `}
              >
                <CardContent className={`${isMobile ? "p-4" : "p-4"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className={`font-medium ${isMobile ? "text-xs" : "text-sm"} ${isMobile ? card.textColor : "text-white/90"}`}>
                        {truncateText(card.title, isMobile ? 15 : 20)}
                      </p>
                      <p className={`font-bold ltr-numbers ${isMobile ? "text-lg" : "text-lg"} mt-2 ${isMobile ? card.textColor : "text-white"}`}>
                        {formatCurrency(card.value)}
                      </p>
                    </div>
                    <div className={`${isMobile ? "ml-3" : "ml-3"}`}>
                      <IconComponent className={`${isMobile ? "h-6 w-6" : "h-6 w-6"} ${card.iconColor}`} />
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
        <h3 className={`font-bold mb-4 ${isMobile ? "text-sm text-gray-700 dark:text-gray-300" : "text-lg text-gray-800 dark:text-white"}`}>
          المؤشرات الرئيسية
        </h3>
        <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
          {mainMetrics.map((metric, index) => {
            const IconComponent = metric.icon;
            return (
              <Card 
                key={index} 
                className={`
                  ${isMobile 
                    ? `${metric.bgColor} ${metric.border} shadow-md hover:shadow-lg` 
                    : `bg-gradient-to-br ${metric.gradient} text-white shadow-xl hover:shadow-2xl`
                  }
                  transition-all duration-300 transform hover:-translate-y-2
                `}
              >
                <CardContent className={`${isMobile ? "p-5" : "p-6"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className={`font-medium ${isMobile ? "text-sm" : "text-base"} ${isMobile ? metric.textColor : "text-white/90"}`}>
                        {metric.title}
                      </p>
                      <p className={`font-bold ltr-numbers ${isMobile ? "text-xl" : "text-2xl"} mt-2 ${isMobile ? metric.textColor : "text-white"}`}>
                        {formatCurrency(metric.value)}
                      </p>
                    </div>
                    <div className={`${isMobile ? "ml-4" : "ml-4"}`}>
                      <IconComponent className={`${isMobile ? "h-7 w-7" : "h-8 w-8"} ${metric.iconColor}`} />
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
