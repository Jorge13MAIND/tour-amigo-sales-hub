import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface AddNoteFormProps {
  onSubmit: (content: string) => void;
  isPending?: boolean;
}

export function AddNoteForm({ onSubmit, isPending }: AddNoteFormProps) {
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit(content.trim());
    setContent('');
  };

  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Add a note..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="text-sm min-h-[80px] resize-none bg-background"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
        }}
      />
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!content.trim() || isPending}
          className="rounded-lg text-xs"
        >
          <Send className="h-3 w-3 mr-1.5" />
          {isPending ? 'Saving...' : 'Add Note'}
        </Button>
      </div>
    </div>
  );
}
