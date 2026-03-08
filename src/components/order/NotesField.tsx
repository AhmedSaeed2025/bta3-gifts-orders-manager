
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StickyNote } from 'lucide-react';

interface NotesFieldProps {
  notes: string;
  onNotesChange: (notes: string) => void;
}

const NotesField = ({ notes, onNotesChange }: NotesFieldProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-primary">
        <StickyNote size={18} />
        <h3 className="font-semibold text-sm">ملاحظات (اختياري)</h3>
      </div>
      <Textarea
        id="notes"
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="أدخل أي ملاحظات خاصة بالطلب..."
        rows={3}
        className="resize-none text-sm"
      />
    </div>
  );
};

export default NotesField;
