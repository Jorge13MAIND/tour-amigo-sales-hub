import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type FieldType = 'text' | 'number' | 'date' | 'select' | 'textarea';

interface EditableFieldProps {
  label: string;
  value: string;
  type?: FieldType;
  options?: { value: string; label: string }[];
  onSave: (value: string) => void;
  isSaving?: boolean;
  mono?: boolean;
  full?: boolean;
  placeholder?: string;
}

export function EditableField({
  label,
  value,
  type = 'text',
  options,
  onSave,
  isSaving,
  mono,
  full,
  placeholder,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const save = useCallback(() => {
    if (draft !== value) onSave(draft);
    setEditing(false);
  }, [draft, value, onSave]);

  const cancel = useCallback(() => {
    setDraft(value);
    setEditing(false);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') save();
    if (e.key === 'Escape') cancel();
  };

  const isMuted = !value || value === 'TBD' || value === 'N/A';

  if (!editing) {
    return (
      <div className={cn('group', full && 'col-span-2')}>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        <div
          className="flex items-center gap-1.5 cursor-pointer rounded-md px-1 -mx-1 py-0.5 hover:bg-accent/50 transition-colors mt-0.5"
          onClick={() => setEditing(true)}
        >
          <p className={cn(
            'text-sm flex-1',
            mono ? 'font-mono font-semibold' : 'font-medium',
            isMuted ? 'text-muted-foreground italic' : 'text-card-foreground'
          )}>
            {value || placeholder || 'Click to edit'}
          </p>
          <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>
      </div>
    );
  }

  if (type === 'select' && options) {
    return (
      <div className={cn(full && 'col-span-2')}>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        <Select value={draft} onValueChange={(v) => { onSave(v); setEditing(false); }}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className={cn(full && 'col-span-2')}>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-center gap-1">
        {type === 'textarea' ? (
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={save}
            className="text-xs min-h-[60px] resize-none"
            disabled={isSaving}
          />
        ) : (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={save}
            className="h-8 text-xs"
            disabled={isSaving}
          />
        )}
        <button onClick={save} className="p-1 rounded hover:bg-accent text-primary shrink-0" disabled={isSaving}>
          <Check className="h-3.5 w-3.5" />
        </button>
        <button onClick={cancel} className="p-1 rounded hover:bg-accent text-muted-foreground shrink-0">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
