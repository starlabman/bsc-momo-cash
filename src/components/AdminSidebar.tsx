import { LayoutDashboard, ArrowRightLeft, ArrowDownUp, BarChart3, Eye, Globe, Phone, Coins } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

export function AdminSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const active = (location.hash || '#dashboard').replace('#', '');

  const navigationItems = [
    { title: t('admin.sidebar.dashboard'), url: '/admin', icon: LayoutDashboard, section: 'dashboard' },
    { title: t('admin.sidebar.offramp'), url: '/admin#offramp', icon: ArrowRightLeft, section: 'offramp' },
    { title: t('admin.sidebar.onramp'), url: '/admin#onramp', icon: ArrowDownUp, section: 'onramp' },
    { title: t('admin.sidebar.stats'), url: '/admin#stats', icon: BarChart3, section: 'stats' },
    { title: t('admin.sidebar.visibilityBlockchains'), url: '/admin#visibility', icon: Eye, section: 'visibility' },
    { title: t('admin.sidebar.visibilityCountries'), url: '/admin#countries', icon: Globe, section: 'countries' },
    { title: t('admin.sidebar.visibilityOperators'), url: '/admin#operators', icon: Phone, section: 'operators' },
    { title: t('admin.sidebar.visibilityTokens'), url: '/admin#tokens', icon: Coins, section: 'tokens' },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 ring-1 ring-border flex items-center justify-center">
            <ArrowRightLeft className="h-4 w-4 text-primary" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">{t('admin.sidebar.administration')}</p>
            <p className="text-xs text-muted-foreground">{t('admin.sidebar.transactionMgmt')}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('admin.sidebar.navigation')}</SidebarGroupLabel>
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
