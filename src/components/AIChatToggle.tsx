import { Sparkles } from 'lucide-react';

interface Props {
  onClick: () => void;
  isOpen: boolean;
}

export function AIChatToggle({ onClick, isOpen }: Props) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 text-xs px-3 py-2 rounded-full transition-all w-full justify-center ${
        isOpen
          ? 'bg-primary text-primary-foreground'
          : 'bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground'
      }`}
      style={!isOpen ? { animation: 'chatGlow 3s ease-in-out infinite' } : undefined}
    >
      <Sparkles className="h-3.5 w-3.5" />
      <span className="font-medium">Ask Atlas</span>
      <style>{`
        @keyframes chatGlow {
          0%, 100% { box-shadow: 0 0 4px 0 hsl(var(--primary) / 0.2); }
          50% { box-shadow: 0 0 12px 2px hsl(var(--primary) / 0.4); }
        }
      `}</style>
    </button>
  );
}
