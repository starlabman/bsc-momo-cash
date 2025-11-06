import { LayoutDashboard, ArrowRightLeft, ArrowDownUp, BarChart3 } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

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
];

export function AdminSidebar() {
  return (
    <Sidebar>
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
                      className="hover:bg-accent/50 transition-colors"
                    >
                      <item.icon className="h-5 w-5" />
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
