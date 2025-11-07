import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, LogOut, User, Menu } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AdminDashboard from '@/components/AdminDashboard';
import { AdminSidebar } from '@/components/AdminSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type DashboardSection = 'dashboard' | 'offramp' | 'onramp' | 'stats-global' | 'stats-country' | 'stats-blockchain' | 'stats-users';

const Admin = () => {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const getCurrentSection = (): DashboardSection => {
    const hash = location.hash.replace('#', '');
    if (hash === 'offramp' || hash === 'onramp' || hash === 'stats-global' || hash === 'stats-country' || hash === 'stats-blockchain' || hash === 'stats-users') {
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

    console.log('=== ADMIN SESSION VALIDATION ===');
    console.log('Token exists:', !!token);
    console.log('User exists:', !!user);

    if (!token || !user) {
      navigate('/admin/login');
      return;
    }

    try {
      const adminUser = JSON.parse(user);
      console.log('Admin user parsed:', adminUser);
      
      // CRITICAL: Validate token server-side using the validate-admin-token edge function
      const { data, error } = await supabase.functions.invoke('validate-admin-token', {
        body: { token }
      });

      console.log('Token validation response:', { data, error });

      if (error || !data?.valid) {
        console.error('Server-side token validation failed:', error);
        handleSessionExpired();
        return;
      }

      // Token is valid, set admin user
      console.log('Session validated successfully');
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
      title: "Session expirée",
      description: "Votre session a expiré. Veuillez vous reconnecter.",
      variant: "destructive"
    });
    
    navigate('/admin/login');
  };

  const handleLogout = () => {
    // Clear all admin-related data from localStorage
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    // Also clear any cached admin session data
    localStorage.removeItem('admin_session_expires');
    
    toast({
      title: "Déconnexion réussie",
      description: "Session sécurisée terminée avec succès",
    });
    navigate('/');
  };

  if (isValidating || !adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Validation de la session...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-gradient-to-br from-background via-background to-primary/5">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col w-full">
          {/* Header */}
          <header className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-40">
            <div className="px-4 lg:px-8 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SidebarTrigger className="lg:hidden" />
                  <div className="hidden lg:block h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                    <ArrowRightLeft className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-lg lg:text-xl font-bold">CryptoMomo Admin</h1>
                    <p className="text-xs text-muted-foreground hidden sm:block">Tableau de bord administrateur</p>
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
                    <span className="hidden sm:inline">Déconnexion</span>
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
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