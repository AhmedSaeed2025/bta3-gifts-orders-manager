
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatCurrency } from "@/lib/utils";
import {
  Trash2,
  DollarSign,
  Truck,
  CreditCard,
  Minus,
  Plus,
  Activity,
  Receipt,
  Banknote
} from "lucide-react";
import {
  ResponsiveTable,
  ResponsiveTableHead,
  ResponsiveTableBody,
  ResponsiveTableRow,
  ResponsiveTableHeader,
  ResponsiveTableCell
} from "@/components/ui/responsive-table";

interface Transaction {
  id: string;
  order_serial: string;
  transaction_type: string;
  amount: number;
  description: string | null;
  created_at: string;
}

interface TransactionsListProps {
  transactions: Transaction[];
  onDeleteTransaction: (transactionId: string) => void;
}

const TransactionsList = ({ transactions, onDeleteTransaction }: TransactionsListProps) => {
  const isMobile = useIsMobile();

  const truncateText = (text: string | null, limit: number = 50): string => {
    if (!text) return "-";
    return text.length > limit ? `${text.substring(0, limit)}...` : text;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'order_collection':
        return <DollarSign className="h-4 w-4" />;
      case 'deposit':
        return <Banknote className="h-4 w-4" />;
      case 'shipping_payment':
        return <Truck className="h-4 w-4" />;
      case 'cost_payment':
        return <CreditCard className="h-4 w-4" />;
      case 'expense':
        return <Minus className="h-4 w-4" />;
      case 'other_income':
        return <Plus className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'order_collection':
        return 'تحصيل طلب';
      case 'deposit':
        return 'سداد عربون';
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
        return 'bg-green-100 text-green-800 border-green-300';
      case 'deposit':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'shipping_payment':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cost_payment':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'expense':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'other_income':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Card className="shadow-xl border-l-4 border-l-indigo-500">
      <CardHeader className={`bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 ${isMobile ? "pb-3" : "pb-6"}`}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg">
            <Receipt className={`${isMobile ? "h-5 w-5" : "h-6 w-6"} text-white`} />
          </div>
          <div>
            <CardTitle className={`font-bold text-slate-800 dark:text-white ${isMobile ? "text-lg" : "text-2xl"}`}>
              قائمة المعاملات المالية
            </CardTitle>
            <p className={`text-slate-600 dark:text-slate-400 mt-1 ${isMobile ? "text-sm" : "text-base"}`}>
              سجل تفصيلي لجميع المعاملات المالية
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={`${isMobile ? "p-2" : "p-6"}`}>
        <div className="overflow-x-auto">
          <ResponsiveTable className="w-full">
            <ResponsiveTableHead>
              <ResponsiveTableRow className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                <ResponsiveTableHeader className="font-bold text-slate-700 dark:text-slate-300">التاريخ</ResponsiveTableHeader>
                <ResponsiveTableHeader className="font-bold text-slate-700 dark:text-slate-300">رقم المرجع</ResponsiveTableHeader>
                <ResponsiveTableHeader className="font-bold text-slate-700 dark:text-slate-300">نوع المعاملة</ResponsiveTableHeader>
                <ResponsiveTableHeader className="font-bold text-slate-700 dark:text-slate-300">الوصف</ResponsiveTableHeader>
                <ResponsiveTableHeader className="font-bold text-slate-700 dark:text-slate-300">المبلغ</ResponsiveTableHeader>
                <ResponsiveTableHeader className="font-bold text-slate-700 dark:text-slate-300 text-center">الإجراءات</ResponsiveTableHeader>
              </ResponsiveTableRow>
            </ResponsiveTableHead>
            <ResponsiveTableBody>
              {transactions.length > 0 ? (
                transactions.map((transaction, index) => (
                  <ResponsiveTableRow 
                    key={transaction.id} 
                    className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'} hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200`}
                  >
                    <ResponsiveTableCell className="text-slate-600 dark:text-slate-300 font-medium">
                      {new Date(transaction.created_at).toLocaleDateString('ar-EG')}
                    </ResponsiveTableCell>
                    <ResponsiveTableCell className="font-semibold text-blue-600 dark:text-blue-400">
                      {transaction.order_serial}
                    </ResponsiveTableCell>
                    <ResponsiveTableCell>
                      <Badge variant="outline" className={`${getTransactionColor(transaction.transaction_type)} font-medium shadow-sm`}>
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(transaction.transaction_type)}
                          <span>{getTransactionTypeLabel(transaction.transaction_type)}</span>
                        </div>
                      </Badge>
                    </ResponsiveTableCell>
                    <ResponsiveTableCell className="text-slate-600 dark:text-slate-300">
                      <span title={transaction.description || "-"}>
                        {truncateText(transaction.description)}
                      </span>
                    </ResponsiveTableCell>
                    <ResponsiveTableCell className={`font-bold text-lg ${
                      transaction.transaction_type === 'expense' || 
                      transaction.transaction_type === 'shipping_payment' || 
                      transaction.transaction_type === 'cost_payment' 
                        ? 'text-red-600 dark:text-red-400' : 
                        'text-green-600 dark:text-green-400'
                    }`}>
                      {(transaction.transaction_type === 'expense' || 
                        transaction.transaction_type === 'shipping_payment' || 
                        transaction.transaction_type === 'cost_payment') ? '-' : '+'}{formatCurrency(transaction.amount)}
                    </ResponsiveTableCell>
                    <ResponsiveTableCell className="text-center">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDeleteTransaction(transaction.id)}
                        className="hover:bg-red-600 transition-colors duration-200 shadow-sm"
                        title="حذف المعاملة"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </ResponsiveTableCell>
                  </ResponsiveTableRow>
                ))
              ) : (
                <ResponsiveTableRow>
                  <ResponsiveTableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                        <Receipt className="h-12 w-12 text-gray-400" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xl font-semibold text-gray-500 dark:text-gray-400">لا توجد معاملات متاحة</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">سيتم عرض المعاملات المالية هنا عند إضافتها</p>
                      </div>
                    </div>
                  </ResponsiveTableCell>
                </ResponsiveTableRow>
              )}
            </ResponsiveTableBody>
          </ResponsiveTable>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionsList;
