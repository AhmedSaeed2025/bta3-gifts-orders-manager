
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { PlusCircle, MinusCircle, Banknote, CreditCard, Wallet, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Transaction {
  id: string;
  date: Date;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string;
  paymentMethod: string;
  orderReference?: string;
}

const AccountStatement = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      date: new Date(),
      ...formData,
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    toast.success("تم إضافة العملية بنجاح");
    
    // Reset form
    setFormData({
      type: "income",
      category: "",
      amount: 0,
      description: "",
      paymentMethod: "cash",
      orderReference: "",
    });
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
                    <Label htmlFor="category">الفئة</Label>
                    <Select 
                      value={formData.category}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الفئة" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.type === "income" ? (
                          <>
                            <SelectItem value="order_payment">سداد طلب</SelectItem>
                            <SelectItem value="service_payment">سداد خدمة</SelectItem>
                            <SelectItem value="other_income">إيراد آخر</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="raw_materials">مواد خام</SelectItem>
                            <SelectItem value="operational_costs">تكاليف تشغيلية</SelectItem>
                            <SelectItem value="shipping">شحن</SelectItem>
                            <SelectItem value="marketing">تسويق</SelectItem>
                            <SelectItem value="other_expense">مصروف آخر</SelectItem>
                          </>
                        )}
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">طريقة الدفع</Label>
                    <Select 
                      value={formData.paymentMethod}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر طريقة الدفع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">كاش</SelectItem>
                        <SelectItem value="instapay">انستا باي</SelectItem>
                        <SelectItem value="wallet">محفظة إلكترونية</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <TableHead>طريقة الدفع</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>مرجع الطلب</TableHead>
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
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getPaymentMethodIcon(transaction.paymentMethod)}
                              {getPaymentMethodLabel(transaction.paymentMethod)}
                            </div>
                          </TableCell>
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
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          لا توجد عمليات متاحة
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountStatement;
