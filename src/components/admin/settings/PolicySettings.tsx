
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText } from 'lucide-react';

interface PolicySettingsProps {
  formData: any;
  onInputChange: (field: string, value: string) => void;
}

const PolicySettings = ({ formData, onInputChange }: PolicySettingsProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle>سياسة الاستبدال والاسترجاع</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            إذا تركت هذا الحقل فارغاً، سيتم استخدام السياسة الافتراضية
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="return_policy">سياسة الاستبدال والاسترجاع</Label>
            <Textarea
              id="return_policy"
              value={formData.return_policy}
              onChange={(e) => onInputChange('return_policy', e.target.value)}
              placeholder="اكتب سياسة الاستبدال والاسترجاع الخاصة بمتجرك..."
              rows={8}
              className="min-h-[200px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الشروط والأحكام</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="terms_conditions">الشروط والأحكام</Label>
            <Textarea
              id="terms_conditions"
              value={formData.terms_conditions}
              onChange={(e) => onInputChange('terms_conditions', e.target.value)}
              placeholder="اكتب الشروط والأحكام..."
              rows={6}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>سياسة الخصوصية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="privacy_policy">سياسة الخصوصية</Label>
            <Textarea
              id="privacy_policy"
              value={formData.privacy_policy}
              onChange={(e) => onInputChange('privacy_policy', e.target.value)}
              placeholder="اكتب سياسة الخصوصية..."
              rows={6}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>سياسة ملفات تعريف الارتباط</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="cookie_policy">سياسة ملفات تعريف الارتباط</Label>
            <Textarea
              id="cookie_policy"
              value={formData.cookie_policy}
              onChange={(e) => onInputChange('cookie_policy', e.target.value)}
              placeholder="اكتب سياسة ملفات تعريف الارتباط..."
              rows={6}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PolicySettings;
