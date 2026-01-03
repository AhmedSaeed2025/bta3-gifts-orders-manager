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
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
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

const PAYMENT_METHODS = ['Instapay', 'Wallet', 'Post Office', 'Shipping Company', 'Cash'];
const PAYMENT_STATUSES = ['Paid', 'Partial', 'Unpaid'];

const CustomerPaymentsScreen = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<CustomerPayment | null>(null);
  const [formData, setFormData] = useState({
    order_id: '',
    customer_name: '',
    payment_method: 'Cash',
    amount: '',
    payment_status: 'Paid',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: ''
  });

  // Fetch orders for dropdown
  const { data: orders } = useQuery({
    queryKey: ['orders-list', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, serial, client_name, total')
        .eq('user_id', user?.id)
        .order('date_created', { ascending: false });
      
      if (error) throw error;
      return data || [];
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

  // Add payment mutation
  const addPaymentMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
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
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-payments'] });
      queryClient.invalidateQueries({ queryKey: ['customer-payments-summary'] });
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
      queryClient.invalidateQueries({ queryKey: ['customer-payments-summary'] });
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
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customer_payments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-payments'] });
      queryClient.invalidateQueries({ queryKey: ['customer-payments-summary'] });
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
      payment_method: 'Cash',
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
        customer_name: order.client_name
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
    return order?.serial || orderId;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>مدفوعات العملاء</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة دفعة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {editingPayment ? 'تعديل الدفعة' : 'إضافة دفعة جديدة'}
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
                        {order.serial} - {order.client_name} ({order.total} ج.م)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>اسم العميل</Label>
                <Input 
                  value={formData.customer_name} 
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                  readOnly
                />
              </div>

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
            لا توجد مدفوعات بعد
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الطلب</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>طريقة الدفع</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>التاريخ</TableHead>
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
                  <TableCell>{payment.amount.toLocaleString()} ج.م</TableCell>
                  <TableCell>{getStatusBadge(payment.payment_status)}</TableCell>
                  <TableCell>
                    {format(new Date(payment.payment_date), 'dd/MM/yyyy', { locale: ar })}
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

export default CustomerPaymentsScreen;
