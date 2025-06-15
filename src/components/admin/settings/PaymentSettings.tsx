
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { CreditCard, Banknote, Smartphone } from 'lucide-react';

interface PaymentSettingsProps {
  formData: any;
  onInputChange: (field: string, value: string) => void;
  onToggleChange: (field: string, value: boolean) => void;
}

const PaymentSettings = ({ formData, onInputChange, onToggleChange }: PaymentSettingsProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <CardTitle>طرق الدفع المتاحة</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>الدفع عند الاستلام</Label>
              <p className="text-sm text-muted-foreground">
                السماح بالدفع عند استلام الطلب
              </p>
            </div>
            <Switch
              checked={formData.cash_on_delivery}
              onCheckedChange={(checked) => onToggleChange('cash_on_delivery', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>التحويل البنكي</Label>
              <p className="text-sm text-muted-foreground">
                السماح بالدفع عبر التحويل البنكي
              </p>
            </div>
            <Switch
              checked={formData.bank_transfer}
              onCheckedChange={(checked) => onToggleChange('bank_transfer', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>المحافظ الإلكترونية</Label>
              <p className="text-sm text-muted-foreground">
                فودافون كاش، أورانج مني، إتصالات فليكس
              </p>
            </div>
            <Switch
              checked={formData.mobile_wallets}
              onCheckedChange={(checked) => onToggleChange('mobile_wallets', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>فيزا/ماستركارد</Label>
              <p className="text-sm text-muted-foreground">
                الدفع بالبطاقات الائتمانية
              </p>
            </div>
            <Switch
              checked={formData.credit_cards}
              onCheckedChange={(checked) => onToggleChange('credit_cards', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {formData.bank_transfer && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              <CardTitle>معلومات الحساب البنكي</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_name">اسم البنك</Label>
                <Input
                  id="bank_name"
                  value={formData.bank_name}
                  onChange={(e) => onInputChange('bank_name', e.target.value)}
                  placeholder="البنك الأهلي المصري"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_holder">اسم صاحب الحساب</Label>
                <Input
                  id="account_holder"
                  value={formData.account_holder}
                  onChange={(e) => onInputChange('account_holder', e.target.value)}
                  placeholder="اسم صاحب الحساب"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_number">رقم الحساب</Label>
              <Input
                id="account_number"
                value={formData.account_number}
                onChange={(e) => onInputChange('account_number', e.target.value)}
                placeholder="رقم الحساب البنكي"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="iban">رقم الآيبان (IBAN)</Label>
              <Input
                id="iban"
                value={formData.iban}
                onChange={(e) => onInputChange('iban', e.target.value)}
                placeholder="EG380019000500000000263180002"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {formData.mobile_wallets && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              <CardTitle>أرقام المحافظ الإلكترونية</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vodafone_cash">فودافون كاش</Label>
                <Input
                  id="vodafone_cash"
                  value={formData.vodafone_cash}
                  onChange={(e) => onInputChange('vodafone_cash', e.target.value)}
                  placeholder="01xxxxxxxxx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orange_money">أورانج مني</Label>
                <Input
                  id="orange_money"
                  value={formData.orange_money}
                  onChange={(e) => onInputChange('orange_money', e.target.value)}
                  placeholder="01xxxxxxxxx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="etisalat_flex">إتصالات فليكس</Label>
                <Input
                  id="etisalat_flex"
                  value={formData.etisalat_flex}
                  onChange={(e) => onInputChange('etisalat_flex', e.target.value)}
                  placeholder="01xxxxxxxxx"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>رسالة الدفع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="payment_instructions">تعليمات الدفع</Label>
            <Textarea
              id="payment_instructions"
              value={formData.payment_instructions}
              onChange={(e) => onInputChange('payment_instructions', e.target.value)}
              placeholder="تعليمات خاصة بالدفع للعملاء..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSettings;
