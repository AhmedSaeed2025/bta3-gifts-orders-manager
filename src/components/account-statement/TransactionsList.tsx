
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Trash2, 
  Receipt,
  Plus,
  Minus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Truck,
  CreditCard,
  Calendar,
  FileText
} from "lucide-react";

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  description: string;
  order_serial: string;
  created_at: string;
}

interface TransactionsListProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
}

const TransactionsList: React.FC<TransactionsListProps> = ({
  transactions,
  onDeleteTransaction
}) => {
  const isMobile = useIsMobile();

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'order_collection':
        return <DollarSign className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} text-green-600`} />;
      case 'shipping_payment':
        return <Truck className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} text-blue-600`} />;
      case 'cost_payment':
        return <CreditCard className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} text-orange-600`} />;
      case 'expense':
        return <TrendingDown className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} text-red-600`} />;
      case 'other_income':
        return <TrendingUp className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} text-purple-600`} />;
      default:
        return <Receipt className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} text-gray-600`} />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'order_collection':
        return 'تحصيل طلب';
      case 'shipping_payment':
        return 'دفع شحن';
      case 'cost_payment':
        return 'دفع تكلفة';
      case 'expense':
        return 'مصروف';
      case 'other_income':
        return 'إيراد إضافي';
      default:
        return type;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'order_collection':
        return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400';
      case 'shipping_payment':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400';
      case 'cost_payment':
        return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/20 dark:text-orange-400';
      case 'expense':
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-400';
      case 'other_income':
        return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const isPositiveTransaction = (type: string) => {
    return type === 'order_collection' || type === 'other_income';
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="shadow-lg border-0 bg-white dark:bg-gray-900">
      <CardHeader className={`${isMobile ? "pb-3" : "pb-4"} bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900`}>
        <CardTitle className={`font-bold flex items-center gap-3 ${isMobile ? "text-sm" : "text-lg"} text-slate-700 dark:text-slate-200`}>
          <div className="p-2 bg-indigo-500 rounded-lg">
            <FileText className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} text-white`} />
          </div>
          سجل المعاملات المالية
          <Badge variant="outline" className={`${isMobile ? "text-xs" : "text-sm"} bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400`}>
            {transactions.length} معاملة
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className={`${isMobile ? "p-3" : "p-6"}`}>
        <div className="space-y-3">
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <div 
                key={transaction.id} 
                className={`group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 hover:shadow-lg transition-all duration-300 ${isMobile ? "p-3" : "p-4"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0">
                      {getTransactionIcon(transaction.transaction_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant="outline" 
                          className={`${getTransactionColor(transaction.transaction_type)} ${isMobile ? "text-xs" : "text-sm"} font-medium`}
                        >
                          {getTransactionLabel(transaction.transaction_type)}
                        </Badge>
                        {!isMobile && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {transaction.order_serial}
                          </span>
                        )}
                      </div>
                      
                      <p className={`text-slate-700 dark:text-slate-300 font-medium ${isMobile ? "text-sm" : "text-base"} mb-1`}>
                        {truncateText(transaction.description, isMobile ? 30 : 60)}
                      </p>
                      
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(transaction.created_at)}</span>
                        </div>
                        {!isMobile && (
                          <span>{formatTime(transaction.created_at)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`font-bold ${isMobile ? "text-sm" : "text-lg"} ${
                        isPositiveTransaction(transaction.transaction_type)
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      } ltr-numbers flex items-center gap-1`}>
                        {isPositiveTransaction(transaction.transaction_type) ? (
                          <Plus className="h-4 w-4" />
                        ) : (
                          <Minus className="h-4 w-4" />
                        )}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </span>
                      {isMobile && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {transaction.order_serial}
                        </p>
                      )}
                    </div>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDeleteTransaction(transaction.id)}
                      className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isMobile ? "h-8 w-8" : "h-9 w-9"} p-0 bg-red-500 hover:bg-red-600`}
                    >
                      <Trash2 className={`${isMobile ? "h-3 w-3" : "h-4 w-4"}`} />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="bg-slate-100 dark:bg-slate-800 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Receipt className={`${isMobile ? "h-8 w-8" : "h-10 w-10"} text-slate-400`} />
              </div>
              <p className={`text-slate-500 dark:text-slate-400 ${isMobile ? "text-sm" : "text-lg"} font-medium`}>
                لا توجد معاملات مسجلة
              </p>
              <p className={`text-slate-400 dark:text-slate-500 ${isMobile ? "text-xs" : "text-sm"} mt-1`}>
                ستظهر المعاملات هنا عند إضافتها
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionsList;
