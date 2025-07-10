
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface NotesFieldProps {
  notes: string;
  onNotesChange: (notes: string) => void;
}

const NotesField: React.FC<NotesFieldProps> = ({ notes, onNotesChange }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          ملاحظات إضافية
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm">
            ملاحظات خاصة بالطلب (اختياري)
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="أدخل أي ملاحظات خاصة بالطلب، طلبات التخصيص، أو تعليمات التوصيل..."
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            ستظهر هذه الملاحظات في الفاتورة وتقارير الطلبات
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotesField;
