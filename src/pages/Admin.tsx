import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import AdminDashboard from '@/components/AdminDashboard';
import { AdminSidebar } from '@/components/AdminSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type DashboardSection = 'dashboard' | 'offramp' | 'onramp' | 'stats';

const Admin = () => {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const getCurrentSection = (): DashboardSection => {
    const hash = location.hash.replace('#', '');
    if (hash === 'offramp' || hash === 'onramp' || hash === 'stats') {
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
          {/* Header amélioré */}
          <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
            <div className="px-4 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="lg:hidden h-10 w-10 rounded-xl border border-border/50 hover:bg-accent transition-colors" />
                  
                  {/* Breadcrumb */}
                  <div className="hidden sm:flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Admin</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="font-medium text-foreground capitalize">
                      {getCurrentSection() === 'dashboard' ? 'Vue d\'ensemble' : getCurrentSection()}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* User info card */}
                  <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-muted/50 border border-border/50">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{adminUser.username}</span>
                      <span className="text-xs text-muted-foreground">Administrateur</span>
                    </div>
                  </div>
                  
                  {/* Logout button */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    className="h-10 px-4 rounded-xl border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all duration-200"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Déconnexion</span>
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content avec animations */}
          <main className="flex-1 overflow-auto">
            <div className="px-4 lg:px-8 py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <AdminDashboard section={getCurrentSection()} />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Admin;