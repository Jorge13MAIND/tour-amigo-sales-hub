import { Lightbulb } from 'lucide-react';

export default function Improvements() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
      <Lightbulb className="h-10 w-10" />
      <p className="text-sm">Improvements — Coming in Sprint 4c</p>
    </div>
  );
}
