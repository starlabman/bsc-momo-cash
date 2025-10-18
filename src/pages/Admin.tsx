import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, LogOut, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AdminDashboard from '@/components/AdminDashboard';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Admin = () => {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <ArrowRightLeft className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">CryptoMomo Admin</h1>
                <p className="text-xs text-muted-foreground">Tableau de bord administrateur</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
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
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <AdminDashboard />
      </main>
    </div>
  );
};

export default Admin;