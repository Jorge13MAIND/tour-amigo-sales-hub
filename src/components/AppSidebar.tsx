import { LayoutGrid, Columns3, ClipboardCheck, TrendingUp, Sun, Moon } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useDailyMetrics } from '@/hooks/useDailyMetrics';
import { useAtRiskCount } from '@/hooks/useDeals';
import { usePendingDecisionCount } from '@/hooks/useDecisions';
import { useAppContext } from '@/contexts/AppContext';
import { useState, useEffect } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { selectedPipeline } = useAppContext();
  const { data: metrics } = useDailyMetrics();
  const { data: atRiskCount } = useAtRiskCount(selectedPipeline);
  const { data: pendingDecisions } = usePendingDecisionCount();
  const showMetrics = (metrics?.length || 0) >= 7;
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const items = [
    { title: 'Dashboard', url: '/', icon: LayoutGrid, badge: 0 },
    { title: 'Pipeline', url: '/pipeline', icon: Columns3, badge: atRiskCount || 0, badgeColor: 'bg-destructive text-destructive-foreground' },
    { title: 'Decisions', url: '/decisions', icon: ClipboardCheck, badge: pendingDecisions || 0, badgeColor: 'bg-risk-medium text-white' },
    ...(showMetrics ? [{ title: 'Metrics', url: '/metrics', icon: TrendingUp, badge: 0, badgeColor: '' }] : []),
  ];

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-sidebar">
        {/* Logo area */}
        <div className="p-5 pb-6">
          {!collapsed ? (
            <div>
              <h1 className="text-base font-bold tracking-tight">
                <span className="text-sidebar-foreground">tour</span>
                <span className="text-sidebar-primary">amigo</span>
              </h1>
              <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-[0.2em] mt-0.5 font-medium">Command Center</p>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold text-sm">
              T
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg px-3 py-2.5 transition-all flex items-center gap-2"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span className="text-sm flex-1">{item.title}</span>}
                      {!collapsed && item.badge > 0 && (
                        <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4">
          <button
            onClick={() => setIsDark(!isDark)}
            className="flex items-center gap-2.5 text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors w-full px-3 py-2 rounded-lg hover:bg-sidebar-accent"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {!collapsed && <span>{isDark ? 'Light mode' : 'Dark mode'}</span>}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
