import { LayoutGrid, Columns3, ClipboardCheck, TrendingUp, Sun, Moon } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useDailyMetrics } from '@/hooks/useDailyMetrics';
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
  const { data: metrics } = useDailyMetrics();
  const showMetrics = (metrics?.length || 0) >= 7;
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const items = [
    { title: 'Dashboard', url: '/', icon: LayoutGrid },
    { title: 'Pipeline', url: '/pipeline', icon: Columns3 },
    { title: 'Decisions', url: '/decisions', icon: ClipboardCheck },
    ...(showMetrics ? [{ title: 'Metrics', url: '/metrics', icon: TrendingUp }] : []),
  ];

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-sidebar">
        <div className="p-4 pb-2">
          {!collapsed && <h1 className="text-sm font-semibold text-sidebar-foreground tracking-tight">Tour Amigo</h1>}
          {!collapsed && <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-widest mt-0.5">Command Center</p>}
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-3">
          <button
            onClick={() => setIsDark(!isDark)}
            className="flex items-center gap-2 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors w-full px-2 py-1.5 rounded"
          >
            {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {!collapsed && (isDark ? 'Light mode' : 'Dark mode')}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
