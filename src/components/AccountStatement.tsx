
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { PlusCircle, MinusCircle, Banknote, CreditCard, Wallet, Download, Trash2, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Transaction {
  id: string;
  date: Date;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string;
  paymentMethod: string;
  orderReference?: string;
  transaction_type?: string;
  order_serial?: string;
}

const AccountStatement = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editDialog, setEditDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    type: "income" as "income" | "expense",
    category: "",
    amount: 0,
    description: "",
    paymentMethod: "cash",
    orderReference: "",
  });

  const [dateFilter, setDateFilter] = useState({
    from: "",
    to: "",
  });

  // Load transactions from Supabase
  const loadTransactions = async () => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTransactions = data?.map(transaction => ({
        id: transaction.id,
        date: new Date(transaction.created_at),
        type: transaction.transaction_type === 'order_collection' ? 'income' as const : 'expense' as const,
        category: getCategoryFromType(transaction.transaction_type),
        amount: Number(transaction.amount),
        description: transaction.description || '',
        paymentMethod: 'cash', // Default value
        orderReference: transaction.order_serial,
        transaction_type: transaction.transaction_type,
        order_serial: transaction.order_serial
      })) || [];

      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error("حدث خطأ في تحميل المعاملات");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryFromType = (transactionType: string) => {
    switch (transactionType) {
      case 'order_collection':
        return 'تحصيل طلب';
      case 'shipping_payment':
        return 'دفع شحن';
      case 'cost_payment':
        return 'دفع تكلفة';
      default:
        return transactionType;
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          order_serial: formData.orderReference || null,
          transaction_type: formData.type === 'income' ? 'order_collection' : 'cost_payment',
          amount: formData.amount,
          description: formData.description
        });

      if (error) throw error;

      toast.success("تم إضافة المعاملة بنجاح");
      
      // Reset form
      setFormData({
        type: "income",
        category: "",
        amount: 0,
        description: "",
        paymentMethod: "cash",
        orderReference: "",
      });

      // Reload transactions
      await loadTransactions();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error("حدث خطأ في إضافة المعاملة");
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success("تم حذف المعاملة بنجاح");
      await loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error("حدث خطأ في حذف المعاملة");
    }
  };

  const handleEditTransaction = async (transaction: Transaction) => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          amount: transaction.amount,
          description: transaction.description
        })
        .eq('id', transaction.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success("تم تحديث المعاملة بنجاح");
      setEditDialog(false);
      setEditingTransaction(null);
      await loadTransactions();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error("حدث خطأ في تحديث المعاملة");
    }
  };

  const calculateTotals = () => {
    const filteredTransactions = transactions.filter(transaction => {
      if (!dateFilter.from && !dateFilter.to) return true;
      
      const transactionDate = transaction.date.toISOString().split('T')[0];
      const fromDate = dateFilter.from || '1900-01-01';
      const toDate = dateFilter.to || '2100-12-31';
      
      return transactionDate >= fromDate && transactionDate <= toDate;
    });

    const totalIncome = filteredTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = filteredTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      filteredTransactions,
    };
  };

  const { totalIncome, totalExpense, netBalance, filteredTransactions } = calculateTotals();

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "cash":
        return <Banknote className="h-4 w-4" />;
      case "instapay":
        return <CreditCard className="h-4 w-4" />;
      case "wallet":
        return <Wallet className="h-4 w-4" />;
      default:
        return <Banknote className="h-4 w-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash":
        return "كاش";
      case "instapay":
        return "انستا باي";
      case "wallet":
        return "محفظة إلكترونية";
      default:
        return method;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gift-primary mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">جاري تحميل كشف الحساب...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rtl" style={{ direction: 'rtl' }}>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Banknote className="h-6 w-6" />
            كشف حساب الأعمال
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-4 w-full justify-start">
              <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
              <TabsTrigger value="addTransaction">إضافة عملية</TabsTrigger>
              <TabsTrigger value="transactions">جميع العمليات</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <PlusCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium">إجمالي الإيرادات</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(totalIncome)}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MinusCircle className="h-5 w-5 text-red-600" />
                      <span className="font-medium">إجمالي المصروفات</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(totalExpense)}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Banknote className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">صافي الرصيد</span>
                    </div>
                    <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(netBalance)}
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="dateFrom">من تاريخ</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFilter.from}
                    onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="dateTo">إلى تاريخ</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateFilter.to}
                    onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={() => setDateFilter({ from: "", to: "" })}
                    variant="outline"
                  >
                    مسح التاريخ
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="addTransaction">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">نوع العملية</Label>
                    <Select 
                      value={formData.type}
                      onValueChange={(value: "income" | "expense") => 
                        setFormData(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر النوع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">إيراد</SelectItem>
                        <SelectItem value="expense">مصروف</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="amount">المبلغ</Label>
                    <Input 
                      id="amount" 
                      type="number" 
                      min="0"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        amount: parseFloat(e.target.value) || 0 
                      }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">الوصف</Label>
                    <Input 
                      id="description" 
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        description: e.target.value 
                      }))}
                      placeholder="وصف العملية"
                      required
                    />
                  </div>
                  
                  {formData.type === "income" && (
                    <div className="space-y-2">
                      <Label htmlFor="orderReference">مرجع الطلب (اختياري)</Label>
                      <Input 
                        id="orderReference" 
                        value={formData.orderReference}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          orderReference: e.target.value 
                        }))}
                        placeholder="رقم الطلب"
                      />
                    </div>
                  )}
                </div>
                
                <Button type="submit" className="bg-gift-primary hover:bg-gift-primaryHover">
                  إضافة العملية
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="transactions">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>الفئة</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>مرجع الطلب</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length > 0 ? (
                      filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {transaction.date.toLocaleDateString('ar-EG')}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={transaction.type === "income" ? "default" : "destructive"}
                              className={transaction.type === "income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                            >
                              {transaction.type === "income" ? "إيراد" : "مصروف"}
                            </Badge>
                          </TableCell>
                          <TableCell>{transaction.category}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell 
                            className={`font-bold ${
                              transaction.type === "income" ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {transaction.type === "income" ? "+" : "-"}
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell>
                            {transaction.orderReference || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingTransaction(transaction);
                                  setEditDialog(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>تأكيد حذف المعاملة</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      هل أنت متأكد من حذف هذه المعاملة؟ لا يمكن التراجع عن هذا الإجراء.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteTransaction(transaction.id)}
                                    >
                                      حذف
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          لا توجد معاملات متاحة
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>

          {/* Edit Transaction Dialog */}
          <Dialog open={editDialog} onOpenChange={setEditDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg">تعديل المعاملة</DialogTitle>
              </DialogHeader>
              
              {editingTransaction && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="editAmount">المبلغ</Label>
                    <Input 
                      id="editAmount"
                      type="number"
                      value={editingTransaction.amount}
                      onChange={(e) => setEditingTransaction(prev => prev ? {
                        ...prev,
                        amount: Number(e.target.value)
                      } : null)}
                      step={0.01}
                      min={0}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="editDescription">الوصف</Label>
                    <Input 
                      id="editDescription"
                      value={editingTransaction.description}
                      onChange={(e) => setEditingTransaction(prev => prev ? {
                        ...prev,
                        description: e.target.value
                      } : null)}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setEditDialog(false);
                        setEditingTransaction(null);
                      }}
                    >
                      إلغاء
                    </Button>
                    <Button 
                      onClick={() => editingTransaction && handleEditTransaction(editingTransaction)}
                      className="bg-gift-primary hover:bg-gift-primaryHover"
                    >
                      حفظ التغييرات
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountStatement;
