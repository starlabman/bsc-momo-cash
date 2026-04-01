import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import FloatingParticles from '@/components/FloatingParticles';

const AdminLogin = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.functions.invoke('admin-auth-rate-limit', {
        body: { username, password }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        setError(data.error || t('admin.login.errorAuth'));
        return;
      }

      localStorage.setItem('admin_token', data.data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.data.admin));

      toast({
        title: t('admin.login.successTitle'),
        description: t('admin.login.successDesc'),
      });

      navigate('/admin');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(t('admin.login.errorConnection'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4 relative overflow-hidden">
      <FloatingParticles />
      
      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <img 
              src="/sikapay-favicon.png" 
              alt="SikaPay Logo" 
              className="h-10 w-10 rounded-lg"
            />
            <div>
              <h1 className="text-2xl font-bold">SikaPay</h1>
              <p className="text-sm text-muted-foreground">{t('admin.login.administration')}</p>
            </div>
          </div>
        </div>

        <Card className="shadow-lg animate-slide-in-up">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">{t('admin.login.title')}</CardTitle>
            <CardDescription>{t('admin.login.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">{t('admin.login.username')}</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder={t('admin.login.usernamePlaceholder')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('admin.login.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('admin.login.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? t('admin.login.submitting') : t('admin.login.submit')}
              </Button>
            </form>

            <div className="text-center pt-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="text-sm"
              >
                {t('admin.login.backHome')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          <p>{t('admin.login.securityInfo')}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
