
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Copy, RefreshCw, Globe, Key, Activity, CheckCircle, XCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface WebhookConfig {
  id: string;
  webhook_url: string;
  webhook_key: string;
  is_active: boolean;
  created_at: string;
}

interface WebhookLog {
  id: string;
  order_serial: string | null;
  response_status: number;
  response_message: string;
  created_at: string;
}

const WebhookTab = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig | null>(null);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const webhookUrl = `https://emlfypsnbxfjhhqcqfni.supabase.co/functions/v1/webhook-orders`;

  useEffect(() => {
    if (user) {
      loadWebhookConfig();
      loadWebhookLogs();
    }
  }, [user]);

  const loadWebhookConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('webhook_configs')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading webhook config:', error);
        return;
      }

      setWebhookConfig(data);
    } catch (error) {
      console.error('Error loading webhook config:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWebhookLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('id, order_serial, response_status, response_message, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading webhook logs:', error);
        return;
      }

      setLogs(data || []);
    } catch (error) {
      console.error('Error loading webhook logs:', error);
    }
  };

  const createWebhookConfig = async () => {
    if (!user) return;

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('webhook_configs')
        .insert({
          user_id: user.id,
          webhook_url: webhookUrl,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating webhook config:', error);
        toast.error("حدث خطأ في إنشاء الـ webhook");
        return;
      }

      setWebhookConfig(data);
      toast.success("تم إنشاء الـ webhook بنجاح");
    } catch (error) {
      console.error('Error creating webhook config:', error);
      toast.error("حدث خطأ في إنشاء الـ webhook");
    } finally {
      setCreating(false);
    }
  };

  const toggleWebhook = async () => {
    if (!webhookConfig) return;

    try {
      const { error } = await supabase
        .from('webhook_configs')
        .update({ is_active: !webhookConfig.is_active })
        .eq('id', webhookConfig.id);

      if (error) {
        console.error('Error toggling webhook:', error);
        toast.error("حدث خطأ في تحديث حالة الـ webhook");
        return;
      }

      setWebhookConfig({ ...webhookConfig, is_active: !webhookConfig.is_active });
      toast.success(webhookConfig.is_active ? "تم إيقاف الـ webhook" : "تم تفعيل الـ webhook");
    } catch (error) {
      console.error('Error toggling webhook:', error);
      toast.error("حدث خطأ في تحديث حالة الـ webhook");
    }
  };

  const regenerateKey = async () => {
    if (!webhookConfig) return;

    try {
      const newKey = crypto.randomUUID();
      const { error } = await supabase
        .from('webhook_configs')
        .update({ webhook_key: newKey })
        .eq('id', webhookConfig.id);

      if (error) {
        console.error('Error regenerating key:', error);
        toast.error("حدث خطأ في إعادة توليد المفتاح");
        return;
      }

      setWebhookConfig({ ...webhookConfig, webhook_key: newKey });
      toast.success("تم إعادة توليد المفتاح بنجاح");
    } catch (error) {
      console.error('Error regenerating key:', error);
      toast.error("حدث خطأ في إعادة توليد المفتاح");
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`تم نسخ ${label}`);
    } catch (error) {
      toast.error("فشل في النسخ");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gift-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {!webhookConfig ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              إعداد Webhook للطلبات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                لم يتم إعداد webhook بعد. قم بإنشاء webhook لاستقبال الطلبات من موقعك الإلكتروني.
              </p>
              <Button 
                onClick={createWebhookConfig}
                disabled={creating}
                className="bg-gift-primary hover:bg-gift-primaryHover"
              >
                {creating ? "جاري الإنشاء..." : "إنشاء Webhook"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  إعدادات Webhook
                </div>
                <Badge variant={webhookConfig.is_active ? "default" : "secondary"}>
                  {webhookConfig.is_active ? "مفعل" : "متوقف"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">رابط Webhook</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhook-url"
                    value={webhookUrl}
                    readOnly
                    className="bg-gray-50"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(webhookUrl, "رابط الـ webhook")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-key">مفتاح المصادقة</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhook-key"
                    value={webhookConfig.webhook_key}
                    readOnly
                    className="bg-gray-50 font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(webhookConfig.webhook_key, "مفتاح المصادقة")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={regenerateKey}
                    title="إعادة توليد المفتاح"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="webhook-active">تفعيل Webhook</Label>
                <Switch
                  id="webhook-active"
                  checked={webhookConfig.is_active}
                  onCheckedChange={toggleWebhook}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                تنسيق البيانات المطلوبة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">يجب إرسال البيانات بتنسيق JSON إلى الـ webhook:</h4>
                <pre className={`${isMobile ? 'text-xs' : 'text-sm'} overflow-x-auto`}>
{`{
  "webhook_key": "${webhookConfig.webhook_key}",
  "paymentMethod": "cash", // cash, installment, bank_transfer
  "clientName": "اسم العميل",
  "phone": "01xxxxxxxxx",
  "deliveryMethod": "delivery", // delivery, pickup
  "address": "عنوان التسليم (اختياري)",
  "governorate": "المحافظة (اختياري)",
  "shippingCost": 50,
  "deposit": 100,
  "items": [
    {
      "productType": "اسم المنتج",
      "size": "المقاس",
      "quantity": 2,
      "cost": 100,
      "price": 150,
      "itemDiscount": 10
    }
  ]
}`}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                سجل Webhook
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-gray-500 text-center py-4">لا توجد طلبات واردة بعد</p>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {log.response_status === 200 ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <div>
                          <div className="font-medium">
                            {log.order_serial || "فشل في إنشاء الطلب"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {log.response_message}
                          </div>
                        </div>
                      </div>
                      <div className="text-left">
                        <Badge variant={log.response_status === 200 ? "default" : "destructive"}>
                          {log.response_status}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(log.created_at).toLocaleString('ar-EG')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default WebhookTab;
