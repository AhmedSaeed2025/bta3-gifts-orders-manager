
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
      color: "blue"
    },
    {
      title: "إجمالي التكاليف",
      value: financialSummary.totalCosts,
      icon: TrendingDown,
      color: "red"
    },
    {
      title: "التكاليف المدفوعة",
      value: financialSummary.totalCostPayments,
      icon: CreditCard,
      color: "pink"
    },
    {
      title: "التكاليف المتبقية",
      value: financialSummary.remainingCosts,
      icon: Minus,
      color: "rose"
    },
    {
      title: "إجمالي الشحن",
      value: financialSummary.totalShipping,
      icon: Truck,
      color: "orange"
    },
    {
      title: "الشحن المدفوع",
      value: financialSummary.totalShippingPayments,
      icon: Truck,
      color: "amber"
    },
    {
      title: "الشحن المتبقي",
      value: financialSummary.remainingShipping,
      icon: Minus,
      color: "yellow"
    },
    {
      title: "إجمالي المصروفات",
      value: financialSummary.totalExpenses,
      icon: TrendingDown,
      color: "purple"
    },
    {
      title: "الإيرادات الإضافية",
      value: financialSummary.totalOtherIncome,
      icon: Plus,
      color: "teal"
    }
  ];

  const mainMetrics = [
    {
      title: "صافي الربح",
      value: financialSummary.netProfit,
      icon: TrendingUp,
      color: "green"
    },
    {
      title: "إجمالي المحصل",
      value: financialSummary.totalCollections,
      icon: DollarSign,
      color: "emerald"
    },
    {
      title: "التدفق النقدي",
      value: financialSummary.cashFlow,
      icon: PiggyBank,
      color: "indigo"
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300",
      red: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300",
      pink: "bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-700 text-pink-700 dark:text-pink-300",
      rose: "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700 text-rose-700 dark:text-rose-300",
      orange: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300",
      amber: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300",
      yellow: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300",
      purple: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300",
      teal: "bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-700 text-teal-700 dark:text-teal-300",
      green: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300",
      emerald: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300",
      indigo: "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getIconColor = (color: string) => {
    const colors = {
      blue: "text-blue-500 dark:text-blue-400",
      red: "text-red-500 dark:text-red-400",
      pink: "text-pink-500 dark:text-pink-400",
      rose: "text-rose-500 dark:text-rose-400",
      orange: "text-orange-500 dark:text-orange-400",
      amber: "text-amber-500 dark:text-amber-400",
      yellow: "text-yellow-500 dark:text-yellow-400",
      purple: "text-purple-500 dark:text-purple-400",
      teal: "text-teal-500 dark:text-teal-400",
      green: "text-green-500 dark:text-green-400",
      emerald: "text-emerald-500 dark:text-emerald-400",
      indigo: "text-indigo-500 dark:text-indigo-400"
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* الملخص المالي التفصيلي */}
      <div>
        <h3 className="font-bold mb-4 text-sm text-gray-700 dark:text-gray-300">
          الملخص المالي التفصيلي
        </h3>
        <div className={`grid gap-2 ${isMobile ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-3"}`}>
          {cardData.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <Card 
                key={index} 
                className={`${getColorClasses(card.color)} border shadow-sm hover:shadow-md transition-all duration-300`}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0">
                      <IconComponent className={`h-4 w-4 ${getIconColor(card.color)}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs truncate">
                        {card.title}
                      </p>
                      <p className="font-bold ltr-numbers text-sm mt-1">
                        {formatCurrency(card.value)}
                      </p>
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
        <h3 className="font-bold mb-4 text-sm text-gray-700 dark:text-gray-300">
          المؤشرات الرئيسية
        </h3>
        <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
          {mainMetrics.map((metric, index) => {
            const IconComponent = metric.icon;
            return (
              <Card 
                key={index} 
                className={`${getColorClasses(metric.color)} border shadow-md hover:shadow-lg transition-all duration-300`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <IconComponent className={`h-5 w-5 ${getIconColor(metric.color)}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {metric.title}
                      </p>
                      <p className="font-bold ltr-numbers text-lg mt-1">
                        {formatCurrency(metric.value)}
                      </p>
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
