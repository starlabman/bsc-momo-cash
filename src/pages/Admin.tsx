import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, LogOut, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AdminDashboard from '@/components/AdminDashboard';
import { useToast } from '@/hooks/use-toast';

const Admin = () => {
  const [adminUser, setAdminUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if admin is logged in and validate token
    const token = localStorage.getItem('admin_token');
    const user = localStorage.getItem('admin_user');

    if (!token || !user) {
      navigate('/admin/login');
      return;
    }

    try {
      const adminUser = JSON.parse(user);
      setAdminUser(adminUser);
      
      // Validate the JWT token to ensure it's still valid
      validateAdminToken(token);
    } catch {
      // Clear invalid data and redirect
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      navigate('/admin/login');
    }
  }, [navigate]);

  const validateAdminToken = async (token: string) => {
    try {
      // Parse the JWT token to check expiration client-side first
      const tokenData = JSON.parse(token);
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (tokenData.expires_at && currentTime > tokenData.expires_at) {
        // Token expired
        handleSessionExpired();
        return;
      }
    } catch {
      // Invalid token format
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

  if (!adminUser) {
    return null; // Will redirect in useEffect
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