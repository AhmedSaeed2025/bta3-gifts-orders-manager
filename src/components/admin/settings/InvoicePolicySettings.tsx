import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface InvoicePolicyData {
  enabled: boolean;
  title: string;
  content: string;
}

const STORAGE_KEY = 'invoice_policy_settings';

const getStorageKey = (userId: string) => `${STORAGE_KEY}_${userId}`;

export const useInvoicePolicy = () => {
  const { user } = useAuth();
  const [policy, setPolicy] = useState<InvoicePolicyData>({ enabled: false, title: 'سياسة الطلبات', content: '' });

  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem(getStorageKey(user.id));
    if (saved) {
      try { setPolicy(JSON.parse(saved)); } catch {}
    }
  }, [user]);

  return policy;
};

const InvoicePolicySettings: React.FC = () => {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [title, setTitle] = useState('سياسة الطلبات');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem(getStorageKey(user.id));
    if (saved) {
      try {
        const data: InvoicePolicyData = JSON.parse(saved);
        setEnabled(data.enabled);
        setTitle(data.title || 'سياسة الطلبات');
        setContent(data.content || '');
      } catch {}
    }
  }, [user]);

  const handleSave = () => {
    if (!user) return;
    const data: InvoicePolicyData = { enabled, title, content };
    localStorage.setItem(getStorageKey(user.id), JSON.stringify(data));
    toast.success('تم حفظ إعدادات سياسة الفاتورة');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          سياسة الفاتورة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
          <Label htmlFor="policy-toggle" className="font-medium">عرض السياسة في الفاتورة</Label>
          <Switch id="policy-toggle" checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <div className="space-y-2">
          <Label>عنوان السياسة</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="سياسة الطلبات" />
        </div>

        <div className="space-y-2">
          <Label>نص السياسة</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="اكتب سياسة الطلبات هنا... (يمكنك كتابة كل بند في سطر جديد)"
            rows={6}
            dir="rtl"
          />
        </div>

        <Button onClick={handleSave} className="w-full gap-2">
          <Save className="h-4 w-4" />
          حفظ إعدادات السياسة
        </Button>
      </CardContent>
    </Card>
  );
};

export default InvoicePolicySettings;
