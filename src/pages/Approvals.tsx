import { ShieldCheck } from 'lucide-react';

export default function Approvals() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
      <ShieldCheck className="h-10 w-10" />
      <p className="text-sm">Approvals — Coming in Sprint 4b</p>
    </div>
  );
}
