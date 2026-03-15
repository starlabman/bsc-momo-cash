import { LayoutDashboard, ArrowRightLeft, ArrowDownUp, BarChart3, Eye, Globe } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const navigationItems = [
  { 
    title: 'Dashboard', 
    url: '/admin', 
    icon: LayoutDashboard,
    section: 'dashboard'
  },
  { 
    title: 'Offramp (Crypto → MoMo)', 
    url: '/admin#offramp', 
    icon: ArrowRightLeft,
    section: 'offramp'
  },
  { 
    title: 'Onramp (MoMo → Crypto)', 
    url: '/admin#onramp', 
    icon: ArrowDownUp,
    section: 'onramp'
  },
  { 
    title: 'Statistiques', 
    url: '/admin#stats', 
    icon: BarChart3,
    section: 'stats'
  },
  { 
    title: 'Visibilité Blockchains', 
    url: '/admin#visibility', 
    icon: Eye,
    section: 'visibility'
  },
  { 
    title: 'Visibilité Pays', 
    url: '/admin#countries', 
    icon: Globe,
    section: 'countries'
  },
];

export function AdminSidebar() {
  const location = useLocation();
  const active = (location.hash || '#dashboard').replace('#', '');

  return (
    <Sidebar>
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 ring-1 ring-border flex items-center justify-center">
            <ArrowRightLeft className="h-4 w-4 text-primary" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Administration</p>
            <p className="text-xs text-muted-foreground">Gestion des transactions</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.section}>
                  <SidebarMenuButton asChild>
                    <a 
                      href={item.url}
                      className={cn(
                        "rounded-lg px-2 py-2 transition-colors",
                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        active === item.section &&
                          "bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-sidebar-border"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
