import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Loader2, CreditCard, DollarSign, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface CustomerPayment {
  id: string;
  order_id: string;
  customer_name: string;
  payment_method: string;
  amount: number;
  payment_status: string;
  payment_date: string;
  reference_number: string | null;
  notes: string | null;
}

interface Order {
  id: string;
  serial: string;
  client_name: string;
  total: number;
  payments_received: number;
  remaining_amount: number;
  status: string;
}

const PAYMENT_METHODS = ['كاش', 'انستاباي', 'محفظة', 'شركة شحن', 'تحويل بنكي'];
const PAYMENT_STATUSES = ['Paid', 'Partial', 'Unpaid'];

const CustomerPaymentsScreen = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<CustomerPayment | null>(null);
  const [formData, setFormData] = useState({
    order_id: '',
    customer_name: '',
    payment_method: 'كاش',
    amount: '',
    payment_status: 'Paid',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: ''
  });

  // Fetch orders for dropdown with payment info
  const { data: orders } = useQuery({
    queryKey: ['orders-with-payments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, serial, client_name, total, payments_received, remaining_amount, status')
        .eq('user_id', user?.id)
        .order('date_created', { ascending: false });
      
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!user
  });

  // Fetch customer payments
  const { data: payments, isLoading } = useQuery({
    queryKey: ['customer-payments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_payments')
        .select('*')
        .eq('user_id', user?.id)
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      return data as CustomerPayment[];
    },
    enabled: !!user
  });

  // Calculate summary
  const summary = {
    totalReceived: payments?.filter(p => p.payment_status === 'Paid').reduce((sum, p) => sum + p.amount, 0) || 0,
    totalPending: payments?.filter(p => p.payment_status !== 'Paid').reduce((sum, p) => sum + p.amount, 0) || 0,
    totalPayments: payments?.length || 0,
    ordersWithBalance: orders?.filter(o => (o.remaining_amount || 0) > 0).length || 0
  };

  // Add payment mutation
  const addPaymentMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // First add the payment
      const { error: paymentError } = await supabase
        .from('customer_payments')
        .insert({
          user_id: user?.id,
          order_id: data.order_id,
          customer_name: data.customer_name,
          payment_method: data.payment_method,
          amount: parseFloat(data.amount),
          payment_status: data.payment_status,
          payment_date: data.payment_date,
          reference_number: data.reference_number || null,
          notes: data.notes || null
        });
      
      if (paymentError) throw paymentError;

      // Then update the order's payments_received
      const order = orders?.find(o => o.id === data.order_id);
      if (order) {
        const newPaymentsReceived = (order.payments_received || 0) + parseFloat(data.amount);
        const newRemaining = order.total - newPaymentsReceived;
        
        await supabase
          .from('orders')
          .update({
            payments_received: newPaymentsReceived,
            remaining_amount: newRemaining > 0 ? newRemaining : 0
          })
          .eq('id', data.order_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-payments'] });
      queryClient.invalidateQueries({ queryKey: ['orders-with-payments'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('تم إضافة الدفعة بنجاح');
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      console.error('Error adding payment:', error);
      toast.error('حدث خطأ أثناء إضافة الدفعة');
    }
  });

  // Update payment mutation
  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('customer_payments')
        .update({
          order_id: data.order_id,
          customer_name: data.customer_name,
          payment_method: data.payment_method,
          amount: parseFloat(data.amount),
          payment_status: data.payment_status,
          payment_date: data.payment_date,
          reference_number: data.reference_number || null,
          notes: data.notes || null
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-payments'] });
      queryClient.invalidateQueries({ queryKey: ['orders-with-payments'] });
      toast.success('تم تحديث الدفعة بنجاح');
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      console.error('Error updating payment:', error);
      toast.error('حدث خطأ أثناء تحديث الدفعة');
    }
  });

  // Delete payment mutation
  const deletePaymentMutation = useMutation({
    mutationFn: async (payment: CustomerPayment) => {
      const { error } = await supabase
        .from('customer_payments')
        .delete()
        .eq('id', payment.id);
      
      if (error) throw error;

      // Update order's payments_received
      const order = orders?.find(o => o.id === payment.order_id);
      if (order) {
        const newPaymentsReceived = Math.max(0, (order.payments_received || 0) - payment.amount);
        const newRemaining = order.total - newPaymentsReceived;
        
        await supabase
          .from('orders')
          .update({
            payments_received: newPaymentsReceived,
            remaining_amount: newRemaining > 0 ? newRemaining : 0
          })
          .eq('id', payment.order_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-payments'] });
      queryClient.invalidateQueries({ queryKey: ['orders-with-payments'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('تم حذف الدفعة بنجاح');
    },
    onError: (error) => {
      console.error('Error deleting payment:', error);
      toast.error('حدث خطأ أثناء حذف الدفعة');
    }
  });

  const resetForm = () => {
    setFormData({
      order_id: '',
      customer_name: '',
      payment_method: 'كاش',
      amount: '',
      payment_status: 'Paid',
      payment_date: new Date().toISOString().split('T')[0],
      reference_number: '',
      notes: ''
    });
    setEditingPayment(null);
  };

  const handleOrderSelect = (orderId: string) => {
    const order = orders?.find(o => o.id === orderId);
    if (order) {
      setFormData(prev => ({
        ...prev,
        order_id: orderId,
        customer_name: order.client_name,
        amount: (order.remaining_amount || order.total).toString()
      }));
    }
  };

  const handleEdit = (payment: CustomerPayment) => {
    setEditingPayment(payment);
    setFormData({
      order_id: payment.order_id,
      customer_name: payment.customer_name,
      payment_method: payment.payment_method,
      amount: payment.amount.toString(),
      payment_status: payment.payment_status,
      payment_date: payment.payment_date.split('T')[0],
      reference_number: payment.reference_number || '',
      notes: payment.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.order_id || !formData.amount) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    if (editingPayment) {
      updatePaymentMutation.mutate({ id: editingPayment.id, data: formData });
    } else {
      addPaymentMutation.mutate(formData);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <Badge className="bg-green-500">مدفوع</Badge>;
      case 'Partial':
        return <Badge className="bg-yellow-500">جزئي</Badge>;
      case 'Unpaid':
        return <Badge variant="destructive">غير مدفوع</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getOrderSerial = (orderId: string) => {
    const order = orders?.find(o => o.id === orderId);
    return order?.serial || '-';
  };

  const getOrderRemaining = (orderId: string) => {
    const order = orders?.find(o => o.id === orderId);
    return order?.remaining_amount || 0;
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="p-0">
          <CardHeader className="p-3 lg:p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="hidden sm:inline">إجمالي المستلم</span>
              <span className="sm:hidden">المستلم</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 lg:p-4 pt-0">
            <div className="text-lg lg:text-2xl font-bold text-green-600">{summary.totalReceived.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="p-3 lg:p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="hidden sm:inline">قيد الانتظار</span>
              <span className="sm:hidden">معلق</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 lg:p-4 pt-0">
            <div className="text-lg lg:text-2xl font-bold text-yellow-600">{summary.totalPending.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="p-3 lg:p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-500" />
              <span className="hidden sm:inline">عدد الدفعات</span>
              <span className="sm:hidden">الدفعات</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 lg:p-4 pt-0">
            <div className="text-lg lg:text-2xl font-bold text-blue-600">{summary.totalPayments}</div>
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="p-3 lg:p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-red-500" />
              <span className="hidden sm:inline">طلبات برصيد</span>
              <span className="sm:hidden">برصيد</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 lg:p-4 pt-0">
            <div className="text-lg lg:text-2xl font-bold text-red-600">{summary.ordersWithBalance}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 lg:p-6">
          <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
            <CreditCard className="h-5 w-5" />
            مدفوعات العملاء
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                تسجيل دفعة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
              <DialogHeader>
                <DialogTitle>
                  {editingPayment ? 'تعديل الدفعة' : 'تسجيل دفعة جديدة'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>الطلب *</Label>
                  <Select value={formData.order_id} onValueChange={handleOrderSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الطلب" />
                    </SelectTrigger>
                    <SelectContent>
                      {orders?.map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          <div className="flex items-center justify-between w-full gap-2">
                            <span>{order.serial} - {order.client_name}</span>
                            {(order.remaining_amount || 0) > 0 && (
                              <Badge variant="destructive" className="text-[10px]">
                                متبقي: {order.remaining_amount}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.order_id && (
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <div><strong>العميل:</strong> {formData.customer_name}</div>
                    <div><strong>المتبقي:</strong> {getOrderRemaining(formData.order_id).toLocaleString()} ج.م</div>
                  </div>
                )}

                <div>
                  <Label>طريقة الدفع *</Label>
                  <Select value={formData.payment_method} onValueChange={(v) => setFormData(prev => ({ ...prev, payment_method: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>{method}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>المبلغ *</Label>
                  <Input 
                    type="number"
                    value={formData.amount} 
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label>حالة الدفع</Label>
                  <Select value={formData.payment_status} onValueChange={(v) => setFormData(prev => ({ ...prev, payment_status: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status === 'Paid' ? 'مدفوع' : status === 'Partial' ? 'جزئي' : 'غير مدفوع'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>تاريخ الدفع</Label>
                  <Input 
                    type="date"
                    value={formData.payment_date} 
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>رقم المرجع</Label>
                  <Input 
                    value={formData.reference_number} 
                    onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                    placeholder="اختياري"
                  />
                </div>

                <div>
                  <Label>ملاحظات</Label>
                  <Textarea 
                    value={formData.notes} 
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="اختياري"
                  />
                </div>

                <Button 
                  onClick={handleSubmit} 
                  className="w-full"
                  disabled={addPaymentMutation.isPending || updatePaymentMutation.isPending}
                >
                  {(addPaymentMutation.isPending || updatePaymentMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingPayment ? 'تحديث' : 'تسجيل'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0 lg:p-6 lg:pt-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : payments?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد مدفوعات بعد</p>
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3 p-3">
                {payments?.map((payment) => (
                  <Card key={payment.id} className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-bold text-sm">{getOrderSerial(payment.order_id)}</div>
                        <div className="text-xs text-muted-foreground">{payment.customer_name}</div>
                      </div>
                      {getStatusBadge(payment.payment_status)}
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-green-600">{payment.amount.toLocaleString()} ج.م</span>
                      <Badge variant="outline" className="text-xs">{payment.payment_method}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span>{format(new Date(payment.payment_date), 'dd/MM/yyyy', { locale: ar })}</span>
                      {payment.reference_number && <span>#{payment.reference_number}</span>}
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(payment)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePaymentMutation.mutate(payment)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الطلب</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>طريقة الدفع</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>المرجع</TableHead>
                      <TableHead>إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments?.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {getOrderSerial(payment.order_id)}
                        </TableCell>
                        <TableCell>{payment.customer_name}</TableCell>
                        <TableCell>{payment.payment_method}</TableCell>
                        <TableCell className="font-bold text-green-600">{payment.amount.toLocaleString()} ج.م</TableCell>
                        <TableCell>{getStatusBadge(payment.payment_status)}</TableCell>
                        <TableCell>
                          {format(new Date(payment.payment_date), 'dd/MM/yyyy', { locale: ar })}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {payment.reference_number || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(payment)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deletePaymentMutation.mutate(payment)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerPaymentsScreen;