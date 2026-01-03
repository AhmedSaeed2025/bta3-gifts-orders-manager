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
import { Plus, Pencil, Trash2, Loader2, Check } from 'lucide-react';
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
}

const PAYMENT_STATUSES = ['Paid', 'Due'];

const WorkshopPaymentsScreen = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<WorkshopPayment | null>(null);
  const [formData, setFormData] = useState({
    order_id: '',
    workshop_name: '',
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
        .select('id, serial, client_name')
        .eq('user_id', user?.id)
        .order('date_created', { ascending: false });
      
      if (error) throw error;
      return data || [];
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

  // Add payment mutation
  const addPaymentMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('workshop_payments')
        .insert({
          user_id: user?.id,
          order_id: data.order_id,
          workshop_name: data.workshop_name,
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
      queryClient.invalidateQueries({ queryKey: ['workshop-payments-summary'] });
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
          workshop_name: data.workshop_name,
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
      queryClient.invalidateQueries({ queryKey: ['workshop-payments-summary'] });
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
      queryClient.invalidateQueries({ queryKey: ['workshop-payments-summary'] });
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
      queryClient.invalidateQueries({ queryKey: ['workshop-payments-summary'] });
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
      workshop_name: '',
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
    if (!formData.order_id || !formData.workshop_name || !formData.product_name || !formData.cost_amount) {
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
    return order?.serial || orderId;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>مدفوعات الورش</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة تكلفة ورشة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {editingPayment ? 'تعديل تكلفة الورشة' : 'إضافة تكلفة ورشة جديدة'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <Label>الطلب *</Label>
                <Select value={formData.order_id} onValueChange={(v) => setFormData(prev => ({ ...prev, order_id: v }))}>
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
                <Label>اسم الورشة *</Label>
                <Input 
                  value={formData.workshop_name} 
                  onChange={(e) => setFormData(prev => ({ ...prev, workshop_name: e.target.value }))}
                  placeholder="مثال: مطبعة النور"
                />
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
                <Label>تاريخ السداد المتوقع</Label>
                <Input 
                  type="date"
                  value={formData.expected_payment_date} 
                  onChange={(e) => setFormData(prev => ({ ...prev, expected_payment_date: e.target.value }))}
                />
              </div>

              <div>
                <Label>تاريخ السداد الفعلي</Label>
                <Input 
                  type="date"
                  value={formData.actual_payment_date} 
                  onChange={(e) => setFormData(prev => ({ ...prev, actual_payment_date: e.target.value }))}
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
                {editingPayment ? 'تحديث' : 'إضافة'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : payments?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد تكاليف ورش بعد
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الورشة</TableHead>
                <TableHead>رقم الطلب</TableHead>
                <TableHead>المنتج</TableHead>
                <TableHead>المقاس</TableHead>
                <TableHead>التكلفة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments?.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.workshop_name}</TableCell>
                  <TableCell>{getOrderSerial(payment.order_id)}</TableCell>
                  <TableCell>{payment.product_name}</TableCell>
                  <TableCell>{payment.size_or_variant || '-'}</TableCell>
                  <TableCell>{payment.cost_amount.toLocaleString()} ج.م</TableCell>
                  <TableCell>{getStatusBadge(payment.payment_status)}</TableCell>
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
        )}
      </CardContent>
    </Card>
  );
};

export default WorkshopPaymentsScreen;
