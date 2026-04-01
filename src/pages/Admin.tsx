import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, LogOut, User, Menu } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AdminDashboard from '@/components/AdminDashboard';
import { AdminSidebar } from '@/components/AdminSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type DashboardSection = 'dashboard' | 'offramp' | 'onramp' | 'stats' | 'visibility' | 'countries' | 'operators' | 'tokens';

const Admin = () => {
  const { t } = useTranslation();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const getCurrentSection = (): DashboardSection => {
    const hash = location.hash.replace('#', '');
    if (hash === 'offramp' || hash === 'onramp' || hash === 'stats' || hash === 'visibility' || hash === 'countries' || hash === 'operators' || hash === 'tokens') {
      return hash;
    }
    return 'dashboard';
  };

  useEffect(() => {
    validateSession();
  }, [navigate]);

  const validateSession = async () => {
    const token = localStorage.getItem('admin_token');
    const user = localStorage.getItem('admin_user');

    if (!token || !user) {
      navigate('/admin/login');
      return;
    }

    try {
      const adminUser = JSON.parse(user);
      
      const { data, error } = await supabase.functions.invoke('validate-admin-token', {
        body: { token }
      });

      if (error || !data?.valid) {
        handleSessionExpired();
        return;
      }

      setAdminUser(adminUser);
      setIsValidating(false);
    } catch (error) {
      console.error('Session validation error:', error);
      handleSessionExpired();
    }
  };

  const handleSessionExpired = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    
    toast({
      title: t('admin.header.sessionExpired'),
      description: t('admin.header.sessionExpiredDesc'),
      variant: "destructive"
    });
    
    navigate('/admin/login');
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_session_expires');
    
    toast({
      title: t('admin.header.logoutSuccess'),
      description: t('admin.header.logoutSuccessDesc'),
    });
    navigate('/');
  };

  if (isValidating || !adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t('admin.header.validating')}</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-gradient-to-br from-background via-background to-primary/5">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col w-full">
          <header className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-40">
            <div className="px-4 lg:px-8 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SidebarTrigger className="lg:hidden" />
                  <div className="hidden lg:block h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                    <ArrowRightLeft className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-lg lg:text-xl font-bold">{t('admin.header.title')}</h1>
                    <p className="text-xs text-muted-foreground hidden sm:block">{t('admin.header.subtitle')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="hidden md:flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{adminUser.username}</span>
                    <Badge variant="outline" className="text-xs">Admin</Badge>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('admin.header.logout')}</span>
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="px-4 lg:px-8 py-6">
              <AdminDashboard section={getCurrentSection()} />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
