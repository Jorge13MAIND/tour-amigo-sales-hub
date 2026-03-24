import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { HeaderBar } from './HeaderBar';
import { DealDetailPanel } from './DealDetailPanel';
import { AIChatPanel } from './AIChatPanel';
import { useAppContext } from '@/contexts/AppContext';
import { useRealtimeNotifications } from '@/hooks/useNotifications';

export function AppLayout() {
  const { isChatOpen, setIsChatOpen } = useAppContext();
  useRealtimeNotifications();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <HeaderBar />
          <main className="flex-1 overflow-auto px-8 py-6">
            <Outlet />
          </main>
        </div>
      </div>
      <DealDetailPanel />
      <AIChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </SidebarProvider>
  );
}
