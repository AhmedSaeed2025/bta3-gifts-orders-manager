import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { useDateFilter } from '@/components/tabs/StyledIndexTabs';
import { calculateOrderFinancials } from '@/lib/orderFinancials';
import { 
  Plus, DollarSign, TrendingUp, TrendingDown, Calculator, Wallet,
  Clock, Edit, Trash2, Filter, Truck, Target, FileText, Calendar,
  Receipt, CreditCard, ArrowUpDown, Factory, AlertTriangle, 
  ArrowDownLeft, ArrowUpRight, Package, CheckCircle2, XCircle,
  BarChart3, Banknote, Scale, Search, Eye, Phone, MapPin,
  Smartphone, Building2, ChevronDown, ChevronUp, ListOrdered
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  description?: string;
  order_serial: string;
  created_at: string;
}

const ImprovedComprehensiveAccountStatement = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { startDate, endDate } = useDateFilter();
  
  const [addTransactionDialog, setAddTransactionDialog] = useState(false);
  const [editTransactionDialog, setEditTransactionDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [activeSection, setActiveSection] = useState<'summary' | 'orders' | 'comparison' | 'cashflow' | 'transactions'>('summary');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');
  const [orderSortBy, setOrderSortBy] = useState<'date' | 'remaining' | 'total'>('date');
  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; order: any; type: 'collection' | 'cost' | 'instapay' | 'wallet' | 'shipping_company' }>({ open: false, order: null, type: 'collection' });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [orderDetailsDialog, setOrderDetailsDialog] = useState<{ open: boolean; order: any }>({ open: false, order: null });
  
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    type: 'expense',
    category: 'other',
    description: ''
  });

  // Fetch orders with items
  const { data: allOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['comprehensive-orders'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Fetch transactions
  const { data: allTransactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['comprehensive-transactions'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Fetch workshop payments (actual costs paid)
  const { data: allWorkshopPayments = [] } = useQuery({
    queryKey: ['comprehensive-workshop-payments'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('workshop_payments')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Fetch customer payments
  const { data: allCustomerPayments = [] } = useQuery({
    queryKey: ['comprehensive-customer-payments'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('customer_payments')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Filter by date
  const orders = useMemo(() => allOrders.filter(o => {
    const d = new Date(o.date_created);
    return (!startDate || d >= startDate) && (!endDate || d <= endDate);
  }), [allOrders, startDate, endDate]);

  const transactions = useMemo(() => allTransactions.filter(t => {
    const d = new Date(t.created_at);
    return (!startDate || d >= startDate) && (!endDate || d <= endDate);
  }), [allTransactions, startDate, endDate]);

  // Filter workshop & customer payments by order_id of date-filtered orders
  const filteredOrderIds = useMemo(() => new Set(orders.map(o => o.id)), [orders]);

  const workshopPayments = useMemo(() => allWorkshopPayments.filter(w => 
    filteredOrderIds.has(w.order_id)
  ), [allWorkshopPayments, filteredOrderIds]);

  const customerPayments = useMemo(() => allCustomerPayments.filter(c => 
    filteredOrderIds.has(c.order_id)
  ), [allCustomerPayments, filteredOrderIds]);

  // Comprehensive financial calculations
  const financial = useMemo(() => {
    // === من الطلبات (المتوقع) ===
    let expectedRevenue = 0;
    let expectedProductionCost = 0;
    let expectedShippingCost = 0;
    let totalDiscount = 0;
    let totalDeposits = 0;
    let totalOrderPaymentsReceived = 0;

    orders.forEach(order => {
      const fin = calculateOrderFinancials(order);
      expectedRevenue += fin.total;
      expectedShippingCost += fin.shipping;
      totalDiscount += fin.discount;
      totalDeposits += fin.deposit;
      totalOrderPaymentsReceived += fin.paid;

      // Expected production cost from items
      const items = order.order_items || [];
      items.forEach((item: any) => {
        expectedProductionCost += Number(item.cost ?? 0) * Number(item.quantity ?? 1);
      });
    });

    // === الفعلي (من المدفوعات) ===
    const actualWorkshopPaid = workshopPayments
      .filter(w => w.payment_status === 'Paid')
      .reduce((sum, w) => sum + Number(w.cost_amount), 0);
    
    const actualWorkshopDue = workshopPayments
      .filter(w => w.payment_status !== 'Paid')
      .reduce((sum, w) => sum + Number(w.cost_amount), 0);

    const totalWorkshopCost = workshopPayments
      .reduce((sum, w) => sum + Number(w.cost_amount), 0);

    const actualCustomerPaid = customerPayments
      .filter(p => p.payment_status === 'Paid' || p.payment_status === 'Partial')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    // === من المعاملات اليدوية ===
    let manualIncome = 0;
    let manualExpenses = 0;
    let manualShippingExpenses = 0;
    let manualProductionExpenses = 0;
    let manualOtherExpenses = 0;

    transactions.forEach(t => {
      const desc = t.description || '';
      if (t.transaction_type === 'income') {
        manualIncome += t.amount;
      } else if (t.transaction_type === 'expense') {
        manualExpenses += t.amount;
        if (desc.includes('[shipping]') || desc.includes('شحن')) {
          manualShippingExpenses += t.amount;
        } else if (desc.includes('[cost]') || desc.includes('تكلفة') || desc.includes('إنتاج')) {
          manualProductionExpenses += t.amount;
        } else {
          manualOtherExpenses += t.amount;
        }
      }
    });

    // === الحسابات النهائية ===
    // إجمالي المحصل فعلياً (عربون + دفعات + تحصيلات يدوية)
    const totalCollected = totalOrderPaymentsReceived + manualIncome;
    
    // إجمالي المدفوع فعلياً (ورش + شحن + مصاريف)
    const totalPaidOut = actualWorkshopPaid + manualExpenses;
    
    // الرصيد النقدي = المحصل - المدفوع
    const cashBalance = totalCollected - totalPaidOut;
    
    // صافي الربح المتوقع = الإيرادات - تكلفة الإنتاج المتوقعة - الخصومات
    const expectedProfit = expectedRevenue - expectedProductionCost - totalDiscount;
    
    // صافي الربح الفعلي = المحصل - المدفوع
    const actualProfit = totalCollected - totalPaidOut;

    // فرق التكلفة (المتوقع vs الفعلي)
    const costDifference = expectedProductionCost - totalWorkshopCost;

    // المبالغ المعلقة
    const pendingFromCustomers = expectedRevenue - totalOrderPaymentsReceived;
    const pendingToWorkshops = actualWorkshopDue;

    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    const activeOrders = orders.filter(o => o.status !== 'cancelled').length;

    // === التنبيهات الذكية ===
    const alerts: { type: 'danger' | 'warning' | 'info'; icon: string; message: string; count: number }[] = [];

    // 1) طلبات تم توصيلها بدون تحصيل كامل
    const deliveredNotFullyPaid = orders.filter(o => {
      if (o.status !== 'delivered') return false;
      const fin = calculateOrderFinancials(o);
      return fin.remaining > 0;
    });
    if (deliveredNotFullyPaid.length > 0) {
      const pendingAmount = deliveredNotFullyPaid.reduce((sum, o) => sum + calculateOrderFinancials(o).remaining, 0);
      alerts.push({
        type: 'danger',
        icon: '🚨',
        message: `${deliveredNotFullyPaid.length} طلب تم توصيله بدون تحصيل كامل (متبقي ${formatCurrency(pendingAmount)})`,
        count: deliveredNotFullyPaid.length
      });
    }

    // 2) طلبات تكلفة ورشتها أعلى من سعر البيع
    const orderIds = new Set(orders.map(o => o.id));
    const lossOrders = orders.filter(o => {
      const orderWP = workshopPayments.filter(w => w.order_id === o.id);
      const wpCost = orderWP.reduce((sum, w) => sum + Number(w.cost_amount), 0);
      const fin = calculateOrderFinancials(o);
      return wpCost > 0 && wpCost > fin.total;
    });
    if (lossOrders.length > 0) {
      alerts.push({
        type: 'danger',
        icon: '📉',
        message: `${lossOrders.length} طلب تكلفة الورشة فيه أعلى من سعر البيع (خسارة محتملة)`,
        count: lossOrders.length
      });
    }

    // 3) طلبات بدون تسجيل تكلفة ورشة
    const activeNonCancelled = orders.filter(o => o.status !== 'cancelled');
    const ordersWithoutWorkshop = activeNonCancelled.filter(o => {
      const hasWP = workshopPayments.some(w => w.order_id === o.id);
      return !hasWP;
    });
    if (ordersWithoutWorkshop.length > 0) {
      alerts.push({
        type: 'warning',
        icon: '🏭',
        message: `${ordersWithoutWorkshop.length} طلب بدون تسجيل تكلفة ورشة — سجّلها من الإدارة المالية`,
        count: ordersWithoutWorkshop.length
      });
    }

    // 4) طلبات بدون أي دفعات
    const ordersWithoutPayments = activeNonCancelled.filter(o => {
      const fin = calculateOrderFinancials(o);
      return fin.paid === 0 && fin.total > 0;
    });
    if (ordersWithoutPayments.length > 0) {
      alerts.push({
        type: 'warning',
        icon: '💳',
        message: `${ordersWithoutPayments.length} طلب بدون أي دفعات مسجلة`,
        count: ordersWithoutPayments.length
      });
    }

    // 5) طلبات تم شحنها ولم يتم تحصيلها بالكامل
    const shippedNotPaid = orders.filter(o => {
      if (o.status !== 'shipped') return false;
      const fin = calculateOrderFinancials(o);
      return fin.remaining > 0;
    });
    if (shippedNotPaid.length > 0) {
      alerts.push({
        type: 'info',
        icon: '🚚',
        message: `${shippedNotPaid.length} طلب تم شحنه ولم يُحصّل بالكامل بعد`,
        count: shippedNotPaid.length
      });
    }

    return {
      // Orders
      orderCount: orders.length,
      activeOrders,
      cancelledOrders,
      
      // Revenue
      expectedRevenue,
      totalCollected,
      totalOrderPaymentsReceived,
      totalDeposits,
      manualIncome,
      pendingFromCustomers,
      
      // Costs - Expected
      expectedProductionCost,
      expectedShippingCost,
      totalDiscount,
      
      // Costs - Actual
      actualWorkshopPaid,
      actualWorkshopDue,
      totalWorkshopCost,
      manualShippingExpenses,
      manualProductionExpenses,
      manualOtherExpenses,
      manualExpenses,
      totalPaidOut,
      pendingToWorkshops,
      
      // Comparison
      costDifference,
      
      // Profit
      expectedProfit,
      actualProfit,
      cashBalance,

      // Customer payments
      actualCustomerPaid,

      // Alerts
      alerts,
    };
  }, [orders, transactions, workshopPayments, customerPayments]);

  // Mutations
  const addMutation = useMutation({
    mutationFn: async (t: typeof newTransaction) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        order_serial: `MANUAL-${Date.now()}`,
        transaction_type: t.type,
        amount: parseFloat(t.amount),
        description: t.category !== 'other' ? `[${t.category}] ${t.description}` : t.description
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comprehensive-transactions'] });
      toast.success('تم إضافة المعاملة بنجاح');
      setAddTransactionDialog(false);
      setNewTransaction({ amount: '', type: 'expense', category: 'other', description: '' });
    },
    onError: () => toast.error('حدث خطأ')
  });

  const editMutation = useMutation({
    mutationFn: async (t: Transaction) => {
      const { error } = await supabase.from('transactions')
        .update({ amount: t.amount, description: t.description })
        .eq('id', t.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comprehensive-transactions'] });
      toast.success('تم التحديث');
      setEditTransactionDialog(false);
    },
    onError: () => toast.error('حدث خطأ')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comprehensive-transactions'] });
      toast.success('تم الحذف');
    }
  });

  const filteredTransactions = useMemo(() => {
    if (filterType === 'all') return transactions;
    return transactions.filter(t => {
      if (filterType === 'income') return t.transaction_type === 'income';
      if (filterType === 'expense') return t.transaction_type === 'expense';
      return true;
    });
  }, [transactions, filterType]);

  // Filtered & sorted orders for the orders tab
  const displayOrders = useMemo(() => {
    let filtered = orders.filter(o => o.status !== 'cancelled');
    
    // Search
    if (orderSearch) {
      const s = orderSearch.toLowerCase();
      filtered = filtered.filter(o => 
        o.serial?.toLowerCase().includes(s) ||
        o.client_name?.toLowerCase().includes(s) ||
        o.phone?.includes(s)
      );
    }

    // Payment filter
    if (orderPaymentFilter !== 'all') {
      filtered = filtered.filter(o => {
        const fin = calculateOrderFinancials(o);
        if (orderPaymentFilter === 'paid') return fin.remaining === 0;
        if (orderPaymentFilter === 'unpaid') return fin.paid === 0 && fin.total > 0;
        if (orderPaymentFilter === 'partial') return fin.paid > 0 && fin.remaining > 0;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (orderSortBy === 'remaining') {
        return calculateOrderFinancials(b).remaining - calculateOrderFinancials(a).remaining;
      }
      if (orderSortBy === 'total') {
        return calculateOrderFinancials(b).total - calculateOrderFinancials(a).total;
      }
      return new Date(b.date_created).getTime() - new Date(a.date_created).getTime();
    });

    return filtered;
  }, [orders, orderSearch, orderPaymentFilter, orderSortBy]);

  // Payment mutation for orders tab
  const orderPaymentMutation = useMutation({
    mutationFn: async ({ orderId, orderSerial, amount, type, notes }: { orderId: string; orderSerial: string; amount: number; type: string; notes: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Find the order
      const order = orders.find(o => o.id === orderId);
      if (!order) throw new Error('Order not found');

      if (type === 'collection' || type === 'instapay' || type === 'wallet' || type === 'shipping_company') {
        // Update order payments_received
        const currentPaid = Number(order.payments_received || 0);
        const newPaid = currentPaid + amount;
        const fin = calculateOrderFinancials(order);
        const newRemaining = Math.max(0, fin.total - Number(order.deposit || 0) - newPaid);

        const { error: orderError } = await supabase
          .from('orders')
          .update({ payments_received: newPaid, remaining_amount: newRemaining })
          .eq('id', orderId);
        if (orderError) throw orderError;

        // Add transaction
        const methodLabel = type === 'instapay' ? 'انستا باي' : type === 'wallet' ? 'محفظة' : type === 'shipping_company' ? 'شركة شحن' : 'تحصيل';
        const { error: txError } = await supabase.from('transactions').insert({
          user_id: user.id,
          order_serial: orderSerial,
          transaction_type: 'income',
          amount,
          description: `[order_collection] ${methodLabel} - ${notes || 'دفعة من العميل'}`
        });
        if (txError) throw txError;

      } else if (type === 'cost') {
        // Register workshop payment
        const { error: wpError } = await supabase.from('workshop_payments').insert({
          user_id: user.id,
          order_id: orderId,
          workshop_name: notes || 'ورشة',
          product_name: 'تكلفة إنتاج',
          cost_amount: amount,
          payment_status: 'Paid',
          actual_payment_date: new Date().toISOString().split('T')[0]
        });
        if (wpError) throw wpError;

        // Add expense transaction
        const { error: txError } = await supabase.from('transactions').insert({
          user_id: user.id,
          order_serial: orderSerial,
          transaction_type: 'expense',
          amount,
          description: `[cost] تكلفة ورشة - ${notes || ''}`
        });
        if (txError) throw txError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comprehensive-orders'] });
      queryClient.invalidateQueries({ queryKey: ['comprehensive-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['comprehensive-workshop-payments'] });
      queryClient.invalidateQueries({ queryKey: ['comprehensive-customer-payments'] });
      toast.success('تم تسجيل الدفعة بنجاح');
      setPaymentDialog({ open: false, order: null, type: 'collection' });
      setPaymentAmount('');
      setPaymentNotes('');
    },
    onError: () => toast.error('حدث خطأ في تسجيل الدفعة')
  });

  const fmt = (n: number) => formatCurrency(n);

  const sections = [
    { id: 'summary', label: 'الملخص', icon: BarChart3 },
    { id: 'orders', label: 'تفاصيل الطلبات', icon: ListOrdered },
    { id: 'comparison', label: 'متوقع vs فعلي', icon: Scale },
    { id: 'cashflow', label: 'حركة النقدية', icon: ArrowUpDown },
    { id: 'transactions', label: 'المعاملات', icon: FileText },
  ];

  if (ordersLoading || transactionsLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'}`}>
        <div>
          <h2 className={`font-bold text-foreground ${isMobile ? 'text-xl' : 'text-2xl'}`}>
            كشف الحساب الشامل
          </h2>
          <div className="flex items-center gap-2 mt-1 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">
              {startDate && endDate 
                ? `${format(startDate, 'dd MMMM yyyy', { locale: ar })} - ${format(endDate, 'dd MMMM yyyy', { locale: ar })}`
                : 'جميع الفترات'}
            </span>
            <Badge variant="secondary" className="text-xs">{financial.activeOrders} طلب نشط</Badge>
          </div>
        </div>
        <Dialog open={addTransactionDialog} onOpenChange={setAddTransactionDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة معاملة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة معاملة جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>النوع</Label>
                <Select value={newTransaction.type} onValueChange={v => setNewTransaction(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">إيراد</SelectItem>
                    <SelectItem value="expense">مصروف</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newTransaction.type === 'expense' && (
                <div className="space-y-2">
                  <Label>التصنيف</Label>
                  <Select value={newTransaction.category} onValueChange={v => setNewTransaction(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cost">تكلفة إنتاج (ورشة)</SelectItem>
                      <SelectItem value="shipping">مصاريف شحن</SelectItem>
                      <SelectItem value="materials">خامات</SelectItem>
                      <SelectItem value="other">مصروفات أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Input placeholder="وصف المعاملة" value={newTransaction.description}
                  onChange={e => setNewTransaction(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>المبلغ (ج.م)</Label>
                <Input type="number" placeholder="0" value={newTransaction.amount}
                  onChange={e => setNewTransaction(p => ({ ...p, amount: e.target.value }))} />
              </div>
              <Button onClick={() => {
                if (!newTransaction.amount || !newTransaction.description) { toast.error('يرجى ملء جميع الحقول'); return; }
                addMutation.mutate(newTransaction);
              }} className="w-full" disabled={addMutation.isPending}>
                {addMutation.isPending ? 'جاري الإضافة...' : 'إضافة'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Section Navigation */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {sections.map(s => {
          const Icon = s.icon;
          const isActive = activeSection === s.id;
          return (
            <button key={s.id} onClick={() => setActiveSection(s.id as any)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border
                ${isActive 
                  ? 'bg-primary text-primary-foreground border-primary shadow-md' 
                  : 'bg-card text-muted-foreground border-border hover:bg-accent'}`}>
              <Icon className="h-3.5 w-3.5" />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* ======= SECTION: الملخص المالي ======= */}
      {activeSection === 'summary' && (
        <div className="space-y-5">
          {/* Smart Alerts */}
          {financial.alerts.length > 0 && (
            <div className="space-y-2">
              {financial.alerts.map((alert, idx) => (
                <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border transition-all
                  ${alert.type === 'danger' 
                    ? 'bg-destructive/10 border-destructive/30 dark:bg-destructive/5' 
                    : alert.type === 'warning' 
                      ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700' 
                      : 'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700'
                  }`}>
                  <span className="text-lg shrink-0 mt-0.5">{alert.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                      alert.type === 'danger' ? 'text-destructive' 
                        : alert.type === 'warning' ? 'text-amber-800 dark:text-amber-300' 
                        : 'text-blue-800 dark:text-blue-300'
                    }`}>
                      {alert.message}
                    </p>
                  </div>
                  <Badge variant="outline" className={`shrink-0 text-xs ${
                    alert.type === 'danger' ? 'border-destructive/50 text-destructive' 
                      : alert.type === 'warning' ? 'border-amber-400 text-amber-700 dark:text-amber-400' 
                      : 'border-blue-400 text-blue-700 dark:text-blue-400'
                  }`}>
                    {alert.count}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* Top KPI Cards */}
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs text-muted-foreground font-medium">إجمالي المبيعات</span>
                </div>
                <p className="text-xl font-bold text-foreground">{fmt(financial.expectedRevenue)}</p>
                <p className="text-xs text-muted-foreground mt-1">{financial.activeOrders} طلب</p>
                <div className="mt-3 pt-2 border-t border-border/50 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">قيمة المنتجات</span>
                    <span className="font-medium">{fmt(financial.expectedRevenue - financial.expectedShippingCost)}</span>
                  </div>
                  {financial.expectedShippingCost > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">رسوم الشحن</span>
                      <span className="font-medium">{fmt(financial.expectedShippingCost)}</span>
                    </div>
                  )}
                  {financial.totalDiscount > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">خصومات</span>
                      <span className="font-medium text-red-500">-{fmt(financial.totalDiscount)}</span>
                    </div>
                  )}
                  {financial.cancelledOrders > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">طلبات ملغية</span>
                      <span className="font-medium text-red-500">{financial.cancelledOrders}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Banknote className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-muted-foreground font-medium">إجمالي المحصل</span>
                </div>
                <p className="text-xl font-bold text-foreground">{fmt(financial.totalCollected)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  من أصل {fmt(financial.expectedRevenue)}
                  {financial.expectedRevenue > 0 
                    ? ` (${((financial.totalOrderPaymentsReceived / financial.expectedRevenue) * 100).toFixed(0)}%)`
                    : ''}
                </p>
                {/* Collection breakdown */}
                <div className="mt-3 pt-2 border-t border-border/50 space-y-1.5">
                  {financial.totalDeposits > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" /> عربون
                      </span>
                      <span className="font-medium">{fmt(financial.totalDeposits)}</span>
                    </div>
                  )}
                  {(financial.totalOrderPaymentsReceived - financial.totalDeposits) > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Banknote className="h-3 w-3" /> دفعات من الطلبات
                      </span>
                      <span className="font-medium">{fmt(financial.totalOrderPaymentsReceived - financial.totalDeposits)}</span>
                    </div>
                  )}
                  {financial.actualCustomerPaid > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Receipt className="h-3 w-3" /> تحصيلات العملاء
                      </span>
                      <span className="font-medium">{fmt(financial.actualCustomerPaid)}</span>
                    </div>
                  )}
                  {financial.manualIncome > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> إيرادات أخرى
                      </span>
                      <span className="font-medium">{fmt(financial.manualIncome)}</span>
                    </div>
                  )}
                </div>
                {financial.expectedRevenue > 0 && (
                  <Progress value={(financial.totalOrderPaymentsReceived / financial.expectedRevenue) * 100} 
                    className="mt-2 h-1.5" />
                )}
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-red-600" />
                  <span className="text-xs text-muted-foreground font-medium">إجمالي المدفوع</span>
                </div>
                <p className="text-xl font-bold text-foreground">{fmt(financial.totalPaidOut)}</p>
                <p className="text-xs text-muted-foreground mt-1">ورش + شحن + مصاريف</p>
                <div className="mt-3 pt-2 border-t border-border/50 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Factory className="h-3 w-3" /> ورش (مدفوع)
                    </span>
                    <span className="font-medium">{fmt(financial.actualWorkshopPaid)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Truck className="h-3 w-3" /> شحن
                    </span>
                    <span className="font-medium">{fmt(financial.manualShippingExpenses)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3" /> مصاريف أخرى
                    </span>
                    <span className="font-medium">{fmt(financial.manualOtherExpenses)}</span>
                  </div>
                  <div className="pt-1.5 mt-1.5 border-t border-dashed border-border/50 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-blue-600 flex items-center gap-1">
                        <Target className="h-3 w-3" /> تكلفة متوقعة
                      </span>
                      <span className="font-medium text-blue-600">{fmt(financial.expectedProductionCost)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-purple-600 flex items-center gap-1">
                        <Factory className="h-3 w-3" /> تكلفة مسجلة (ورش)
                      </span>
                      <span className="font-medium text-purple-600">{fmt(financial.totalWorkshopCost)}</span>
                    </div>
                  </div>
                  {financial.pendingToWorkshops > 0 && (
                    <div className="flex justify-between text-xs pt-1 border-t border-dashed border-border/50">
                      <span className="text-amber-600 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> مستحق للورش
                      </span>
                      <span className="font-medium text-amber-600">{fmt(financial.pendingToWorkshops)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className={`border-l-4 ${financial.cashBalance >= 0 ? 'border-l-emerald-500' : 'border-l-amber-500'}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className={`h-4 w-4 ${financial.cashBalance >= 0 ? 'text-emerald-600' : 'text-amber-600'}`} />
                  <span className="text-xs text-muted-foreground font-medium">الرصيد النقدي</span>
                </div>
                <p className={`text-xl font-bold ${financial.cashBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {fmt(financial.cashBalance)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">المحصل - المدفوع</p>
                <div className="mt-3 pt-2 border-t border-border/50 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-600">+ المحصل</span>
                    <span className="font-medium text-emerald-600">{fmt(financial.totalCollected)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-red-500">- المدفوع</span>
                    <span className="font-medium text-red-500">{fmt(financial.totalPaidOut)}</span>
                  </div>
                  {financial.pendingFromCustomers > 0 && (
                    <div className="flex justify-between text-xs border-t border-border/30 pt-1">
                      <span className="text-amber-600">متبقي عند العملاء</span>
                      <span className="font-medium text-amber-600">{fmt(financial.pendingFromCustomers)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calculation Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calculator className="h-5 w-5 text-primary" />
                ملخص الحساب
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                {/* Income */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-emerald-600 flex items-center gap-2">
                    <ArrowDownLeft className="h-4 w-4" /> الإيرادات
                  </p>
                  <div className="mr-6 space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">مبيعات الطلبات (شامل الشحن)</span>
                      <span className="font-medium">{fmt(financial.expectedRevenue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">المحصل من العملاء (عربون + دفعات)</span>
                      <span className="font-medium text-emerald-600">{fmt(financial.totalOrderPaymentsReceived)}</span>
                    </div>
                    {financial.manualIncome > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">إيرادات أخرى مسجلة</span>
                        <span className="font-medium text-emerald-600">+ {fmt(financial.manualIncome)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-semibold border-t border-border/50 pt-1.5">
                      <span>إجمالي المحصل</span>
                      <span className="text-emerald-600">{fmt(financial.totalCollected)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Expenses */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-red-600 flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4" /> المصروفات الفعلية
                  </p>
                  <div className="mr-6 space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Factory className="h-3 w-3" /> مدفوعات الورش
                      </span>
                      <span className="font-medium text-red-600">{fmt(financial.actualWorkshopPaid)}</span>
                    </div>
                    {financial.manualShippingExpenses > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Truck className="h-3 w-3" /> مصاريف شحن مسجلة
                        </span>
                        <span className="font-medium text-red-600">{fmt(financial.manualShippingExpenses)}</span>
                      </div>
                    )}
                    {financial.manualProductionExpenses > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Package className="h-3 w-3" /> تكاليف إنتاج مسجلة
                        </span>
                        <span className="font-medium text-red-600">{fmt(financial.manualProductionExpenses)}</span>
                      </div>
                    )}
                    {financial.manualOtherExpenses > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <FileText className="h-3 w-3" /> مصروفات أخرى
                        </span>
                        <span className="font-medium text-red-600">{fmt(financial.manualOtherExpenses)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-semibold border-t border-border/50 pt-1.5">
                      <span>إجمالي المدفوع</span>
                      <span className="text-red-600">{fmt(financial.totalPaidOut)}</span>
                    </div>
                  </div>
                </div>

                <Separator className="border-2" />

                {/* Net */}
                <div className="flex justify-between items-center text-lg">
                  <span className="font-bold">الرصيد النقدي (المحصل - المدفوع)</span>
                  <span className={`font-bold ${financial.cashBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {fmt(financial.cashBalance)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Amounts */}
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <span className="font-semibold text-amber-800 dark:text-amber-400">مبالغ معلقة من العملاء</span>
                </div>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{fmt(financial.pendingFromCustomers)}</p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">المبيعات - المحصل من الطلبات</p>
                {financial.expectedRevenue > 0 && (
                  <Progress value={(financial.totalOrderPaymentsReceived / financial.expectedRevenue) * 100} 
                    className="mt-3 h-2" />
                )}
              </CardContent>
            </Card>
            <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Factory className="h-5 w-5 text-orange-600" />
                  <span className="font-semibold text-orange-800 dark:text-orange-400">مستحقات للورش (لم تُدفع)</span>
                </div>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{fmt(financial.pendingToWorkshops)}</p>
                <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">مدفوعات ورش بحالة "مستحقة"</p>
                {financial.totalWorkshopCost > 0 && (
                  <Progress value={(financial.actualWorkshopPaid / financial.totalWorkshopCost) * 100} 
                    className="mt-3 h-2" />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ======= SECTION: تفاصيل الطلبات ======= */}
      {activeSection === 'orders' && (
        <div className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-3`}>
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث بالسيريال أو اسم العميل أو الموبايل..."
                    value={orderSearch}
                    onChange={e => setOrderSearch(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <Select value={orderPaymentFilter} onValueChange={(v: any) => setOrderPaymentFilter(v)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="حالة الدفع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="paid">مدفوع بالكامل</SelectItem>
                    <SelectItem value="partial">مدفوع جزئياً</SelectItem>
                    <SelectItem value="unpaid">لم يُدفع</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={orderSortBy} onValueChange={(v: any) => setOrderSortBy(v)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="ترتيب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">بالتاريخ</SelectItem>
                    <SelectItem value="remaining">بالمتبقي</SelectItem>
                    <SelectItem value="total">بالإجمالي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                <Badge variant="secondary">{displayOrders.length} طلب</Badge>
                <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                  محصل: {fmt(displayOrders.reduce((s, o) => s + calculateOrderFinancials(o).paid, 0))}
                </Badge>
                <Badge variant="outline" className="text-amber-600 border-amber-300">
                  متبقي: {fmt(displayOrders.reduce((s, o) => s + calculateOrderFinancials(o).remaining, 0))}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Orders List */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {displayOrders.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p>لا توجد طلبات مطابقة</p>
                </CardContent>
              </Card>
            ) : displayOrders.map(order => {
              const fin = calculateOrderFinancials(order);
              const orderWP = workshopPayments.filter(w => w.order_id === order.id);
              const workshopCostPaid = orderWP.filter(w => w.payment_status === 'Paid').reduce((s, w) => s + Number(w.cost_amount), 0);
              const workshopCostDue = orderWP.filter(w => w.payment_status !== 'Paid').reduce((s, w) => s + Number(w.cost_amount), 0);
              const expectedCost = (order.order_items || []).reduce((s: number, i: any) => s + (Number(i.cost || 0) * Number(i.quantity || 1)), 0);
              // الربح = الإجمالي - التكلفة (الفعلية إن وجدت، وإلا المتوقعة) - الشحن
              const costUsed = workshopCostPaid > 0 ? workshopCostPaid : expectedCost;
              const actualProfit = fin.total - costUsed - fin.shipping;
              const paymentPercent = fin.total > 0 ? Math.min(100, (fin.paid / fin.total) * 100) : 0;
              const paymentStatus = fin.remaining === 0 ? 'paid' : fin.paid > 0 ? 'partial' : 'unpaid';

              return (
                <Card key={order.id} className={`transition-all hover:shadow-md border-r-4 ${
                  paymentStatus === 'paid' ? 'border-r-emerald-500' 
                    : paymentStatus === 'partial' ? 'border-r-amber-500' 
                    : 'border-r-red-500'
                }`}>
                  <CardContent className={isMobile ? 'p-3' : 'p-4'}>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className="font-mono text-[10px] h-5">{order.serial}</Badge>
                        <Badge className={`text-[10px] h-5 ${
                          order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                            : order.status === 'shipped' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {order.status === 'delivered' ? 'تم التوصيل' : order.status === 'shipped' ? 'تم الشحن' 
                            : order.status === 'printing' ? 'في المطبعة' : order.status === 'pending' ? 'قيد الانتظار' : order.status}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {format(new Date(order.date_created), 'dd/MM/yyyy', { locale: ar })}
                      </span>
                    </div>

                    {/* Customer */}
                    <div className="flex items-center gap-2 mb-2 text-sm">
                      <span className="font-semibold text-foreground truncate">{order.client_name}</span>
                      {order.phone && !isMobile && (
                        <span className="text-muted-foreground text-xs flex items-center gap-1">
                          <Phone className="h-3 w-3" />{order.phone}
                        </span>
                      )}
                    </div>

                    {/* Financial Grid - Mobile optimized */}
                    {isMobile ? (
                      <div className="space-y-1.5 mb-2">
                        {/* Row 1: Main financials */}
                        <div className="grid grid-cols-3 gap-1.5">
                          <div className="bg-muted/40 rounded-md p-1.5 text-center">
                            <p className="text-[9px] text-muted-foreground">الإجمالي</p>
                            <p className="text-xs font-bold">{fmt(fin.total)}</p>
                          </div>
                          <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-md p-1.5 text-center">
                            <p className="text-[9px] text-muted-foreground">المحصل</p>
                            <p className="text-xs font-bold text-emerald-600">{fmt(fin.paid)}</p>
                          </div>
                          <div className={`rounded-md p-1.5 text-center ${fin.remaining > 0 ? 'bg-red-50 dark:bg-red-950/20' : 'bg-emerald-50 dark:bg-emerald-950/20'}`}>
                            <p className="text-[9px] text-muted-foreground">المتبقي</p>
                            <p className={`text-xs font-bold ${fin.remaining > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{fmt(fin.remaining)}</p>
                          </div>
                        </div>
                        {/* Row 2: Cost details */}
                        <div className="grid grid-cols-3 gap-1.5">
                          <div className="bg-muted/40 rounded-md p-1.5 text-center">
                            <p className="text-[9px] text-muted-foreground">التكلفة</p>
                            <p className="text-xs font-bold">{fmt(expectedCost)}</p>
                          </div>
                          {fin.shipping > 0 ? (
                            <div className="bg-muted/40 rounded-md p-1.5 text-center">
                              <p className="text-[9px] text-muted-foreground">الشحن</p>
                              <p className="text-xs font-bold">{fmt(fin.shipping)}</p>
                            </div>
                          ) : (
                            <div />
                          )}
                          <div className={`rounded-md p-1.5 text-center ${actualProfit >= 0 ? 'bg-blue-50 dark:bg-blue-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
                            <p className="text-[9px] text-muted-foreground">الربح</p>
                            <p className={`text-xs font-bold ${actualProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{fmt(actualProfit)}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-2 mb-3 grid-cols-7">
                        <div className="bg-muted/40 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-muted-foreground">الإجمالي</p>
                          <p className="text-sm font-bold">{fmt(fin.total)}</p>
                        </div>
                        <div className="bg-muted/40 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-muted-foreground">التكلفة</p>
                          <p className="text-sm font-bold">{fmt(expectedCost)}</p>
                          {workshopCostPaid > 0 && <p className="text-[10px] text-emerald-600">فعلي: {fmt(workshopCostPaid)}</p>}
                        </div>
                        {fin.shipping > 0 && (
                          <div className="bg-muted/40 rounded-lg p-2 text-center">
                            <p className="text-[10px] text-muted-foreground">الشحن</p>
                            <p className="text-sm font-bold">{fmt(fin.shipping)}</p>
                          </div>
                        )}
                        {fin.discount > 0 && (
                          <div className="bg-muted/40 rounded-lg p-2 text-center">
                            <p className="text-[10px] text-muted-foreground">خصم</p>
                            <p className="text-sm font-bold text-red-500">-{fmt(fin.discount)}</p>
                          </div>
                        )}
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-muted-foreground">المحصل</p>
                          <p className="text-sm font-bold text-emerald-600">{fmt(fin.paid)}</p>
                          {fin.deposit > 0 && <p className="text-[10px] text-muted-foreground">عربون: {fmt(fin.deposit)}</p>}
                        </div>
                        <div className={`rounded-lg p-2 text-center ${fin.remaining > 0 ? 'bg-red-50 dark:bg-red-950/20' : 'bg-emerald-50 dark:bg-emerald-950/20'}`}>
                          <p className="text-[10px] text-muted-foreground">المتبقي</p>
                          <p className={`text-sm font-bold ${fin.remaining > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{fmt(fin.remaining)}</p>
                        </div>
                        <div className={`rounded-lg p-2 text-center ${actualProfit >= 0 ? 'bg-blue-50 dark:bg-blue-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
                          <p className="text-[10px] text-muted-foreground">الربح الفعلي</p>
                          <p className={`text-sm font-bold ${actualProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{fmt(actualProfit)}</p>
                        </div>
                      </div>
                    )}

                    {/* Progress bar */}
                    <Progress value={paymentPercent} className="h-1 mb-2" />

                    {/* Actions - Mobile: horizontal scroll, Desktop: wrap */}
                    {isMobile ? (
                      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                        {fin.remaining > 0 && (
                          <>
                            <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7 px-2 shrink-0 border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400"
                              onClick={() => { setPaymentDialog({ open: true, order, type: 'collection' }); setPaymentAmount(String(fin.remaining)); }}>
                              <DollarSign className="h-3 w-3" /> تحصيل
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7 px-2 shrink-0 border-purple-300 text-purple-700 dark:border-purple-700 dark:text-purple-400"
                              onClick={() => { setPaymentDialog({ open: true, order, type: 'instapay' }); setPaymentAmount(String(fin.remaining)); }}>
                              <Smartphone className="h-3 w-3" /> انستا باي
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7 px-2 shrink-0 border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-400"
                              onClick={() => { setPaymentDialog({ open: true, order, type: 'wallet' }); setPaymentAmount(String(fin.remaining)); }}>
                              <Wallet className="h-3 w-3" /> محفظة
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7 px-2 shrink-0 border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400"
                              onClick={() => { setPaymentDialog({ open: true, order, type: 'shipping_company' }); setPaymentAmount(String(fin.remaining)); }}>
                              <Truck className="h-3 w-3" /> شحن
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7 px-2 shrink-0 border-red-300 text-red-700 dark:border-red-700 dark:text-red-400"
                          onClick={() => { setPaymentDialog({ open: true, order, type: 'cost' }); setPaymentAmount(String(expectedCost)); }}>
                          <Factory className="h-3 w-3" /> ورشة
                        </Button>
                        <Button size="sm" variant="ghost" className="gap-1 text-[10px] h-7 px-2 shrink-0"
                          onClick={() => setOrderDetailsDialog({ open: true, order })}>
                          <Eye className="h-3 w-3" /> تفاصيل
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {fin.remaining > 0 && (
                          <>
                            <Button size="sm" variant="outline" className="gap-1 text-xs h-8 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400"
                              onClick={() => { setPaymentDialog({ open: true, order, type: 'collection' }); setPaymentAmount(String(fin.remaining)); }}>
                              <DollarSign className="h-3 w-3" /> تحصيل
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1 text-xs h-8 border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400"
                              onClick={() => { setPaymentDialog({ open: true, order, type: 'instapay' }); setPaymentAmount(String(fin.remaining)); }}>
                              <Smartphone className="h-3 w-3" /> انستا باي
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1 text-xs h-8 border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400"
                              onClick={() => { setPaymentDialog({ open: true, order, type: 'wallet' }); setPaymentAmount(String(fin.remaining)); }}>
                              <Wallet className="h-3 w-3" /> محفظة
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1 text-xs h-8 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400"
                              onClick={() => { setPaymentDialog({ open: true, order, type: 'shipping_company' }); setPaymentAmount(String(fin.remaining)); }}>
                              <Truck className="h-3 w-3" /> شركة شحن
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="outline" className="gap-1 text-xs h-8 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
                          onClick={() => { setPaymentDialog({ open: true, order, type: 'cost' }); setPaymentAmount(String(expectedCost)); }}>
                          <Factory className="h-3 w-3" /> تكلفة ورشة
                        </Button>
                        <Button size="sm" variant="ghost" className="gap-1 text-xs h-8"
                          onClick={() => setOrderDetailsDialog({ open: true, order })}>
                          <Eye className="h-3 w-3" /> تفاصيل
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ======= SECTION: مقارنة المتوقع vs الفعلي ======= */}
      {activeSection === 'comparison' && (
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Scale className="h-5 w-5 text-primary" />
                مقارنة التكاليف: المتوقع من الطلبات vs الفعلي المدفوع
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                التكلفة المتوقعة هي المسجلة في كل طلب. التكلفة الفعلية هي ما تم دفعه للورش فعلياً.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Production Cost Comparison */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Factory className="h-4 w-4 text-primary" /> تكلفة الإنتاج (الورش)
                </h4>
                <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
                  <div className="bg-card rounded-lg p-4 border">
                    <p className="text-xs text-muted-foreground mb-1">المتوقع (من الطلبات)</p>
                    <p className="text-xl font-bold">{fmt(financial.expectedProductionCost)}</p>
                  </div>
                  <div className="bg-card rounded-lg p-4 border">
                    <p className="text-xs text-muted-foreground mb-1">الفعلي (مدفوعات الورش)</p>
                    <p className="text-xl font-bold text-red-600">{fmt(financial.totalWorkshopCost)}</p>
                    <div className="flex gap-2 mt-1 text-xs">
                      <span className="text-emerald-600">مدفوع: {fmt(financial.actualWorkshopPaid)}</span>
                      <span className="text-amber-600">مستحق: {fmt(financial.actualWorkshopDue)}</span>
                    </div>
                  </div>
                  <div className={`rounded-lg p-4 border-2 ${
                    financial.costDifference > 0 
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700' 
                      : financial.costDifference < 0 
                        ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-700'
                        : 'bg-card border-border'
                  }`}>
                    <p className="text-xs text-muted-foreground mb-1">الفرق</p>
                    <p className={`text-xl font-bold ${
                      financial.costDifference > 0 ? 'text-emerald-600' : financial.costDifference < 0 ? 'text-red-600' : ''
                    }`}>
                      {financial.costDifference > 0 ? '+' : ''}{fmt(financial.costDifference)}
                    </p>
                    <p className="text-xs mt-1">
                      {financial.costDifference > 0 ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> التكلفة الفعلية أقل من المتوقع ✓
                        </span>
                      ) : financial.costDifference < 0 ? (
                        <span className="text-red-600 flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> التكلفة الفعلية أعلى من المتوقع ⚠
                        </span>
                      ) : (
                        <span className="text-muted-foreground">متطابق</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Shipping Cost Comparison */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" /> مصاريف الشحن
                </h4>
                <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  <div className="bg-card rounded-lg p-4 border">
                    <p className="text-xs text-muted-foreground mb-1">المضاف على الفواتير</p>
                    <p className="text-xl font-bold">{fmt(financial.expectedShippingCost)}</p>
                    <p className="text-xs text-muted-foreground mt-1">يتم تحصيله من العميل ضمن الفاتورة</p>
                  </div>
                  <div className="bg-card rounded-lg p-4 border">
                    <p className="text-xs text-muted-foreground mb-1">المدفوع لشركة الشحن</p>
                    <p className="text-xl font-bold text-red-600">{fmt(financial.manualShippingExpenses)}</p>
                    <p className="text-xs text-muted-foreground mt-1">المسجل كمصروف شحن في المعاملات</p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" /> خلاصة المقارنة
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">صافي الربح المتوقع (من أسعار الطلبات)</span>
                    <span className="font-semibold">{fmt(financial.expectedProfit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">صافي الربح الفعلي (محصل - مدفوع)</span>
                    <span className={`font-semibold ${financial.actualProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {fmt(financial.actualProfit)}
                    </span>
                  </div>
                  {financial.totalWorkshopCost === 0 && financial.expectedProductionCost > 0 && (
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2 mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-xs">لم يتم تسجيل أي مدفوعات ورش بعد - سجّل مدفوعات الورش من تبويب "الإدارة المالية" لمقارنة دقيقة</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ======= SECTION: حركة النقدية ======= */}
      {activeSection === 'cashflow' && (
        <div className="space-y-5">
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {/* Money In */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-emerald-600">
                  <ArrowDownLeft className="h-5 w-5" />
                  الأموال الداخلة (تحصيلات)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                  <span className="text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4" /> عربون + دفعات من الطلبات
                  </span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">{fmt(financial.totalOrderPaymentsReceived)}</span>
                </div>
                {financial.actualCustomerPaid > 0 && (
                  <div className="flex justify-between p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                    <span className="text-sm flex items-center gap-2">
                      <Banknote className="h-4 w-4" /> مدفوعات العملاء (الإدارة المالية)
                    </span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">{fmt(financial.actualCustomerPaid)}</span>
                  </div>
                )}
                {financial.manualIncome > 0 && (
                  <div className="flex justify-between p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                    <span className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" /> إيرادات أخرى
                    </span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">{fmt(financial.manualIncome)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg font-bold">
                  <span>الإجمالي</span>
                  <span className="text-emerald-700 dark:text-emerald-300">{fmt(financial.totalCollected)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Money Out */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-red-600">
                  <ArrowUpRight className="h-5 w-5" />
                  الأموال الخارجة (مدفوعات)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <span className="text-sm flex items-center gap-2">
                    <Factory className="h-4 w-4" /> مدفوعات الورش
                  </span>
                  <span className="font-semibold text-red-700 dark:text-red-400">{fmt(financial.actualWorkshopPaid)}</span>
                </div>
                {financial.manualShippingExpenses > 0 && (
                  <div className="flex justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <span className="text-sm flex items-center gap-2">
                      <Truck className="h-4 w-4" /> مصاريف شحن
                    </span>
                    <span className="font-semibold text-red-700 dark:text-red-400">{fmt(financial.manualShippingExpenses)}</span>
                  </div>
                )}
                {financial.manualProductionExpenses > 0 && (
                  <div className="flex justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <span className="text-sm flex items-center gap-2">
                      <Package className="h-4 w-4" /> تكاليف إنتاج مسجلة
                    </span>
                    <span className="font-semibold text-red-700 dark:text-red-400">{fmt(financial.manualProductionExpenses)}</span>
                  </div>
                )}
                {financial.manualOtherExpenses > 0 && (
                  <div className="flex justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <span className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" /> مصروفات أخرى
                    </span>
                    <span className="font-semibold text-red-700 dark:text-red-400">{fmt(financial.manualOtherExpenses)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between p-3 bg-red-100 dark:bg-red-900/30 rounded-lg font-bold">
                  <span>الإجمالي</span>
                  <span className="text-red-700 dark:text-red-300">{fmt(financial.totalPaidOut)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cash Balance */}
          <Card className={`border-2 ${financial.cashBalance >= 0 ? 'border-emerald-300 dark:border-emerald-700' : 'border-red-300 dark:border-red-700'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${financial.cashBalance >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-red-100 dark:bg-red-900/40'}`}>
                    <Wallet className={`h-6 w-6 ${financial.cashBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">صافي الرصيد النقدي</p>
                    <p className="text-xs text-muted-foreground">الأموال الداخلة - الأموال الخارجة</p>
                  </div>
                </div>
                <p className={`text-3xl font-bold ${financial.cashBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {fmt(financial.cashBalance)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ======= SECTION: المعاملات ======= */}
      {activeSection === 'transactions' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5" />
                سجل المعاملات
              </CardTitle>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="income">إيرادات</SelectItem>
                    <SelectItem value="expense">مصروفات</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>لا توجد معاملات</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredTransactions.map(t => {
                  const isIncome = t.transaction_type === 'income';
                  return (
                    <div key={t.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors
                      ${isIncome 
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800' 
                        : 'bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-800'
                      } hover:shadow-sm`}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg shrink-0 ${isIncome ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-red-100 dark:bg-red-900/40'}`}>
                          {isIncome ? <ArrowDownLeft className="h-4 w-4 text-emerald-600" /> : <ArrowUpRight className="h-4 w-4 text-red-600" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{t.description || (isIncome ? 'إيراد' : 'مصروف')}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(t.created_at), 'dd/MM/yyyy', { locale: ar })}
                            <Badge variant="outline" className="text-[10px] h-5">{t.order_serial}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`font-bold ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isIncome ? '+' : '-'}{fmt(Math.abs(t.amount))}
                        </span>
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => { setSelectedTransaction({ ...t }); setEditTransactionDialog(true); }}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => { if (confirm('حذف هذه المعاملة؟')) deleteMutation.mutate(t.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={editTransactionDialog} onOpenChange={setEditTransactionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل المعاملة</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Input value={selectedTransaction.description || ''}
                  onChange={e => setSelectedTransaction(p => p ? { ...p, description: e.target.value } : null)} />
              </div>
              <div className="space-y-2">
                <Label>المبلغ (ج.م)</Label>
                <Input type="number" value={selectedTransaction.amount}
                  onChange={e => setSelectedTransaction(p => p ? { ...p, amount: parseFloat(e.target.value) || 0 } : null)} />
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setEditTransactionDialog(false)}>إلغاء</Button>
                <Button onClick={() => selectedTransaction && editMutation.mutate(selectedTransaction)}
                  disabled={editMutation.isPending}>
                  {editMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog.open} onOpenChange={(open) => { if (!open) setPaymentDialog({ open: false, order: null, type: 'collection' }); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {paymentDialog.type === 'cost' ? 'تسجيل تكلفة ورشة' 
                : paymentDialog.type === 'instapay' ? 'تحصيل عبر انستا باي'
                : paymentDialog.type === 'wallet' ? 'تحصيل عبر محفظة'
                : paymentDialog.type === 'shipping_company' ? 'تحصيل عبر شركة شحن'
                : 'تحصيل من العميل'}
            </DialogTitle>
          </DialogHeader>
          {paymentDialog.order && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الطلب</span>
                  <span className="font-mono font-bold">{paymentDialog.order.serial}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">العميل</span>
                  <span className="font-medium">{paymentDialog.order.client_name}</span>
                </div>
                {paymentDialog.type !== 'cost' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المتبقي</span>
                    <span className="font-bold text-red-600">{fmt(calculateOrderFinancials(paymentDialog.order).remaining)}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>المبلغ (ج.م)</Label>
                <Input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="أدخل المبلغ" />
              </div>
              <div className="space-y-2">
                <Label>{paymentDialog.type === 'cost' ? 'اسم الورشة / ملاحظات' : 'ملاحظات (اختياري)'}</Label>
                <Input value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} 
                  placeholder={paymentDialog.type === 'cost' ? 'اسم الورشة' : 'ملاحظات'} />
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setPaymentDialog({ open: false, order: null, type: 'collection' })}>إلغاء</Button>
                <Button 
                  disabled={!paymentAmount || orderPaymentMutation.isPending}
                  onClick={() => {
                    orderPaymentMutation.mutate({
                      orderId: paymentDialog.order.id,
                      orderSerial: paymentDialog.order.serial,
                      amount: parseFloat(paymentAmount),
                      type: paymentDialog.type,
                      notes: paymentNotes
                    });
                  }}>
                  {orderPaymentMutation.isPending ? 'جاري...' : 'تأكيد'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={orderDetailsDialog.open} onOpenChange={(open) => { if (!open) setOrderDetailsDialog({ open: false, order: null }); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              تفاصيل الطلب {orderDetailsDialog.order?.serial}
            </DialogTitle>
          </DialogHeader>
          {orderDetailsDialog.order && (() => {
            const o = orderDetailsDialog.order;
            const fin = calculateOrderFinancials(o);
            const orderWP = workshopPayments.filter(w => w.order_id === o.id);
            const wpPaid = orderWP.filter(w => w.payment_status === 'Paid').reduce((s: number, w: any) => s + Number(w.cost_amount), 0);
            const expectedCost = (o.order_items || []).reduce((s: number, i: any) => s + (Number(i.cost || 0) * Number(i.quantity || 1)), 0);
            return (
              <div className="space-y-4 text-sm" dir="rtl">
                {/* Customer Info */}
                <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                  <h4 className="font-semibold flex items-center gap-2"><Phone className="h-4 w-4" /> بيانات العميل</h4>
                  <div className="grid grid-cols-2 gap-2 mr-6">
                    <div><span className="text-muted-foreground">الاسم:</span> <span className="font-medium">{o.client_name}</span></div>
                    <div><span className="text-muted-foreground">الموبايل:</span> <span className="font-medium">{o.phone}</span></div>
                    {o.phone2 && <div><span className="text-muted-foreground">موبايل 2:</span> <span className="font-medium">{o.phone2}</span></div>}
                    {o.governorate && <div><span className="text-muted-foreground">المحافظة:</span> <span className="font-medium">{o.governorate}</span></div>}
                    {o.address && <div className="col-span-2"><span className="text-muted-foreground">العنوان:</span> <span className="font-medium">{o.address}</span></div>}
                  </div>
                </div>

                {/* Items */}
                <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                  <h4 className="font-semibold flex items-center gap-2"><Package className="h-4 w-4" /> المنتجات</h4>
                  <div className="space-y-1.5 mr-6">
                    {(o.order_items || []).map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-card rounded p-2 border">
                        <div>
                          <span className="font-medium">{item.product_type}</span>
                          <span className="text-muted-foreground text-xs mr-2">({item.size}) × {item.quantity}</span>
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{fmt(Number(item.price || 0) * Number(item.quantity || 1))}</p>
                          <p className="text-[10px] text-muted-foreground">تكلفة: {fmt(Number(item.cost || 0) * Number(item.quantity || 1))}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                  <h4 className="font-semibold flex items-center gap-2"><Calculator className="h-4 w-4" /> الملخص المالي</h4>
                  <div className="space-y-1.5 mr-6">
                    <div className="flex justify-between"><span className="text-muted-foreground">إجمالي الفاتورة</span><span className="font-bold">{fmt(fin.total)}</span></div>
                    {fin.shipping > 0 && <div className="flex justify-between"><span className="text-muted-foreground">الشحن</span><span>{fmt(fin.shipping)}</span></div>}
                    {fin.discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">خصم</span><span className="text-red-600">-{fmt(fin.discount)}</span></div>}
                    <Separator />
                    <div className="flex justify-between"><span className="text-muted-foreground">تكلفة الإنتاج (متوقعة)</span><span>{fmt(expectedCost)}</span></div>
                    {wpPaid > 0 && <div className="flex justify-between"><span className="text-muted-foreground">تكلفة ورشة (مدفوعة)</span><span className="text-red-600">{fmt(wpPaid)}</span></div>}
                    <Separator />
                    <div className="flex justify-between"><span className="text-emerald-600">المحصل</span><span className="font-bold text-emerald-600">{fmt(fin.paid)}</span></div>
                    {fin.deposit > 0 && <div className="flex justify-between text-xs"><span className="text-muted-foreground mr-4">↳ عربون</span><span>{fmt(fin.deposit)}</span></div>}
                    {fin.paymentsReceived > 0 && <div className="flex justify-between text-xs"><span className="text-muted-foreground mr-4">↳ دفعات</span><span>{fmt(fin.paymentsReceived)}</span></div>}
                    <div className="flex justify-between"><span className={fin.remaining > 0 ? 'text-red-600' : 'text-emerald-600'}>المتبقي</span><span className={`font-bold ${fin.remaining > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{fmt(fin.remaining)}</span></div>
                    <Separator />
                    {(() => { const costUsed = wpPaid > 0 ? wpPaid : expectedCost; const profit = fin.total - costUsed - fin.shipping; return (
                    <div className="flex justify-between font-bold"><span>الربح الفعلي</span><span className={profit >= 0 ? 'text-emerald-600' : 'text-red-600'}>{fmt(profit)}</span></div>
                    ); })()}
                  </div>
                </div>

                {/* Workshop Payments */}
                {orderWP.length > 0 && (
                  <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                    <h4 className="font-semibold flex items-center gap-2"><Factory className="h-4 w-4" /> مدفوعات الورش</h4>
                    <div className="space-y-1.5 mr-6">
                      {orderWP.map((w: any) => (
                        <div key={w.id} className="flex justify-between items-center bg-card rounded p-2 border">
                          <div>
                            <span className="font-medium">{w.workshop_name}</span>
                            <span className="text-muted-foreground text-xs mr-2">{w.product_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={w.payment_status === 'Paid' ? 'default' : 'secondary'} className="text-[10px]">
                              {w.payment_status === 'Paid' ? 'مدفوع' : 'مستحق'}
                            </Badge>
                            <span className="font-medium">{fmt(Number(w.cost_amount))}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {o.notes && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">ملاحظات:</p>
                    <p className="text-sm">{o.notes}</p>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImprovedComprehensiveAccountStatement;
