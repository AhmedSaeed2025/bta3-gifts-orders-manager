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
import { Plus, Pencil, Trash2, Loader2, Check, Factory, DollarSign, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface WorkshopPayment {
  id: string;
  order_id: string;
  workshop_name: string;
  product_name: string;
  size_or_variant: string | null;
  cost_amount: number;
  payment_status: string;
  expected_payment_date: string | null;
  actual_payment_date: string | null;
  notes: string | null;
  created_at: string;
}

interface Order {
  id: string;
  serial: string;
  client_name: string;
  total: number;
  status: string;
}

const PAYMENT_STATUSES = ['Paid', 'Due'];

const WorkshopPaymentsScreen = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<WorkshopPayment | null>(null);
  const [formData, setFormData] = useState({
    order_id: '',
    workshop_name: 'المطبعة',
    product_name: '',
    size_or_variant: '',
    cost_amount: '',
    payment_status: 'Due',
    expected_payment_date: '',
    actual_payment_date: '',
    notes: ''
  });

  // Fetch orders for dropdown
  const { data: orders } = useQuery({
    queryKey: ['orders-list', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, serial, client_name, total, status')
        .eq('user_id', user?.id)
        .order('date_created', { ascending: false });
      
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!user
  });

  // Fetch workshop payments
  const { data: payments, isLoading } = useQuery({
    queryKey: ['workshop-payments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workshop_payments')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as WorkshopPayment[];
    },
    enabled: !!user
  });

  // Calculate summary
  const summary = {
    totalDue: payments?.filter(p => p.payment_status === 'Due').reduce((sum, p) => sum + p.cost_amount, 0) || 0,
    totalPaid: payments?.filter(p => p.payment_status === 'Paid').reduce((sum, p) => sum + p.cost_amount, 0) || 0,
    totalPayments: payments?.length || 0
  };

  // Add payment mutation
  const addPaymentMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('workshop_payments')
        .insert({
          user_id: user?.id,
          order_id: data.order_id,
          workshop_name: data.workshop_name || 'المطبعة',
          product_name: data.product_name,
          size_or_variant: data.size_or_variant || null,
          cost_amount: parseFloat(data.cost_amount),
          payment_status: data.payment_status,
          expected_payment_date: data.expected_payment_date || null,
          actual_payment_date: data.actual_payment_date || null,
          notes: data.notes || null
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop-payments'] });
      toast.success('تم إضافة تكلفة الورشة بنجاح');
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      console.error('Error adding workshop payment:', error);
      toast.error('حدث خطأ أثناء إضافة تكلفة الورشة');
    }
  });

  // Update payment mutation
  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('workshop_payments')
        .update({
          order_id: data.order_id,
          workshop_name: data.workshop_name || 'المطبعة',
          product_name: data.product_name,
          size_or_variant: data.size_or_variant || null,
          cost_amount: parseFloat(data.cost_amount),
          payment_status: data.payment_status,
          expected_payment_date: data.expected_payment_date || null,
          actual_payment_date: data.actual_payment_date || null,
          notes: data.notes || null
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop-payments'] });
      toast.success('تم تحديث تكلفة الورشة بنجاح');
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      console.error('Error updating workshop payment:', error);
      toast.error('حدث خطأ أثناء تحديث تكلفة الورشة');
    }
  });

  // Delete payment mutation
  const deletePaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workshop_payments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop-payments'] });
      toast.success('تم حذف تكلفة الورشة بنجاح');
    },
    onError: (error) => {
      console.error('Error deleting workshop payment:', error);
      toast.error('حدث خطأ أثناء حذف تكلفة الورشة');
    }
  });

  // Mark as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workshop_payments')
        .update({
          payment_status: 'Paid',
          actual_payment_date: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop-payments'] });
      toast.success('تم تعليم الدفعة كمدفوعة');
    },
    onError: (error) => {
      console.error('Error marking as paid:', error);
      toast.error('حدث خطأ');
    }
  });

  const resetForm = () => {
    setFormData({
      order_id: '',
      workshop_name: 'المطبعة',
      product_name: '',
      size_or_variant: '',
      cost_amount: '',
      payment_status: 'Due',
      expected_payment_date: '',
      actual_payment_date: '',
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
        notes: `طلب ${order.serial} - ${order.client_name}`
      }));
    }
  };

  const handleEdit = (payment: WorkshopPayment) => {
    setEditingPayment(payment);
    setFormData({
      order_id: payment.order_id,
      workshop_name: payment.workshop_name,
      product_name: payment.product_name,
      size_or_variant: payment.size_or_variant || '',
      cost_amount: payment.cost_amount.toString(),
      payment_status: payment.payment_status,
      expected_payment_date: payment.expected_payment_date?.split('T')[0] || '',
      actual_payment_date: payment.actual_payment_date?.split('T')[0] || '',
      notes: payment.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.order_id || !formData.product_name || !formData.cost_amount) {
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
      case 'Due':
        return <Badge variant="destructive">مستحق</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getOrderSerial = (orderId: string) => {
    const order = orders?.find(o => o.id === orderId);
    return order?.serial || '-';
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-3 grid-cols-3">
        <Card className="p-0">
          <CardHeader className="p-3 lg:p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-red-500" />
              <span className="hidden sm:inline">مستحق للورشة</span>
              <span className="sm:hidden">مستحق</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 lg:p-4 pt-0">
            <div className="text-lg lg:text-2xl font-bold text-red-600">{summary.totalDue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="p-3 lg:p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="hidden sm:inline">مدفوع للورشة</span>
              <span className="sm:hidden">مدفوع</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 lg:p-4 pt-0">
            <div className="text-lg lg:text-2xl font-bold text-green-600">{summary.totalPaid.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="p-3 lg:p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium flex items-center gap-2">
              <Factory className="h-4 w-4 text-blue-500" />
              <span className="hidden sm:inline">عدد العمليات</span>
              <span className="sm:hidden">العمليات</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 lg:p-4 pt-0">
            <div className="text-lg lg:text-2xl font-bold text-blue-600">{summary.totalPayments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 lg:p-6">
          <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
            <Factory className="h-5 w-5" />
            مدفوعات الورشة
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                إضافة تكلفة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
              <DialogHeader>
                <DialogTitle>
                  {editingPayment ? 'تعديل تكلفة الورشة' : 'إضافة تكلفة ورشة'}
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
                          {order.serial} - {order.client_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>اسم المنتج *</Label>
                  <Input 
                    value={formData.product_name} 
                    onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
                    placeholder="مثال: تيشيرت"
                  />
                </div>

                <div>
                  <Label>المقاس/النوع</Label>
                  <Input 
                    value={formData.size_or_variant} 
                    onChange={(e) => setFormData(prev => ({ ...prev, size_or_variant: e.target.value }))}
                    placeholder="اختياري"
                  />
                </div>

                <div>
                  <Label>التكلفة *</Label>
                  <Input 
                    type="number"
                    value={formData.cost_amount} 
                    onChange={(e) => setFormData(prev => ({ ...prev, cost_amount: e.target.value }))}
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
                          {status === 'Paid' ? 'مدفوع' : 'مستحق'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  {editingPayment ? 'تحديث' : 'إضافة'}
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
              <Factory className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد تكاليف ورش بعد</p>
              <p className="text-xs mt-2">يمكنك تسجيل التكاليف من تبويب "المطبعة"</p>
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
                        <div className="text-xs text-muted-foreground">{payment.product_name}</div>
                      </div>
                      {getStatusBadge(payment.payment_status)}
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-primary">{payment.cost_amount.toLocaleString()} ج.م</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(payment.created_at), 'dd/MM/yyyy', { locale: ar })}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {payment.payment_status === 'Due' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={() => markAsPaidMutation.mutate(payment.id)}
                        >
                          <Check className="h-3 w-3" />
                          تم الدفع
                        </Button>
                      )}
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
                        onClick={() => deletePaymentMutation.mutate(payment.id)}
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
                      <TableHead>المنتج</TableHead>
                      <TableHead>المقاس</TableHead>
                      <TableHead>التكلفة</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments?.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{getOrderSerial(payment.order_id)}</TableCell>
                        <TableCell>{payment.product_name}</TableCell>
                        <TableCell>{payment.size_or_variant || '-'}</TableCell>
                        <TableCell className="font-bold">{payment.cost_amount.toLocaleString()} ج.م</TableCell>
                        <TableCell>{getStatusBadge(payment.payment_status)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(payment.created_at), 'dd/MM/yyyy', { locale: ar })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {payment.payment_status === 'Due' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => markAsPaidMutation.mutate(payment.id)}
                                title="تعليم كمدفوع"
                              >
                                <Check className="h-4 w-4 text-green-500" />
                              </Button>
                            )}
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
                              onClick={() => deletePaymentMutation.mutate(payment.id)}
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

export default WorkshopPaymentsScreen;