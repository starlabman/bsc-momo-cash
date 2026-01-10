import { useLocation } from 'react-router-dom';
import { LayoutDashboard, ArrowRightLeft, ArrowDownUp, BarChart3, Home, Shield, Bell } from 'lucide-react';
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
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const navigationItems = [
  { 
    title: 'Dashboard', 
    url: '/admin', 
    icon: LayoutDashboard,
    section: 'dashboard',
    description: 'Vue d\'ensemble'
  },
  { 
    title: 'Offramp', 
    url: '/admin#offramp', 
    icon: ArrowRightLeft,
    section: 'offramp',
    description: 'Crypto → Mobile Money',
    badge: 'crypto'
  },
  { 
    title: 'Onramp', 
    url: '/admin#onramp', 
    icon: ArrowDownUp,
    section: 'onramp',
    description: 'Mobile Money → Crypto',
    badge: 'momo'
  },
  { 
    title: 'Statistiques', 
    url: '/admin#stats', 
    icon: BarChart3,
    section: 'stats',
    description: 'Analyses détaillées'
  },
];

export function AdminSidebar() {
  const location = useLocation();
  
  const getCurrentSection = () => {
    const hash = location.hash.replace('#', '');
    if (hash === 'offramp' || hash === 'onramp' || hash === 'stats') {
      return hash;
    }
    return 'dashboard';
  };
  
  const currentSection = getCurrentSection();

  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="border-b border-border/50 p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight">Admin Panel</span>
            <span className="text-xs text-muted-foreground">CryptoMomo</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => {
                const isActive = currentSection === item.section;
                return (
                  <SidebarMenuItem key={item.section}>
                    <SidebarMenuButton asChild>
                      <a 
                        href={item.url}
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                          isActive 
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                            : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {/* Active indicator bar */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-foreground rounded-r-full" />
                        )}
                        
                        <div className={cn(
                          "h-9 w-9 rounded-lg flex items-center justify-center transition-all",
                          isActive 
                            ? "bg-primary-foreground/20" 
                            : "bg-muted group-hover:bg-accent"
                        )}>
                          <item.icon className={cn(
                            "h-5 w-5 transition-transform group-hover:scale-110",
                            isActive ? "text-primary-foreground" : ""
                          )} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-medium truncate",
                              isActive ? "text-primary-foreground" : ""
                            )}>
                              {item.title}
                            </span>
                            {item.badge && (
                              <Badge 
                                variant={isActive ? "secondary" : "outline"} 
                                className={cn(
                                  "text-[10px] px-1.5 py-0",
                                  isActive ? "bg-primary-foreground/20 text-primary-foreground border-0" : ""
                                )}
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          <p className={cn(
                            "text-xs truncate",
                            isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>
                            {item.description}
                          </p>
                        </div>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Quick Actions */}
        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
            Raccourcis
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a 
                    href="/"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-accent/50 text-muted-foreground hover:text-foreground group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-muted group-hover:bg-accent flex items-center justify-center">
                      <Home className="h-4 w-4" />
                    </div>
                    <span className="text-sm">Retour au site</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-border/50 p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span>Système opérationnel</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
