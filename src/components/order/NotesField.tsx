
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface NotesFieldProps {
  notes: string;
  onNotesChange: (notes: string) => void;
}

const NotesField = ({ notes, onNotesChange }: NotesFieldProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="notes">ملاحظات (اختياري)</Label>
      <Textarea
        id="notes"
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="أدخل أي ملاحظات خاصة بالطلب..."
        rows={3}
        className="resize-none"
      />
    </div>
  );
};

export default NotesField;
