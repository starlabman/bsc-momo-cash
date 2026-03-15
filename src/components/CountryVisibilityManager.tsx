import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye, EyeOff, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CountryVisibility {
  id: string;
  country_id: string;
  country_name: string;
  country_code: string;
  is_visible: boolean;
}

const CountryVisibilityManager: React.FC = () => {
  const [visibilities, setVisibilities] = useState<CountryVisibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchVisibilities();
  }, []);

  const fetchVisibilities = async () => {
    try {
      const { data, error } = await supabase
        .from('country_visibility')
        .select('*')
        .order('country_name');

      if (error) throw error;
      setVisibilities((data as any[]) || []);
    } catch (error) {
      console.error('Error fetching country visibilities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (countryId: string, currentVisible: boolean) => {
    setTogglingId(countryId);
    const token = localStorage.getItem('admin_token');

    try {
      const { data, error } = await supabase.functions.invoke('toggle-country-visibility', {
        body: { token, country_id: countryId, is_visible: !currentVisible }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erreur');

      setVisibilities(prev =>
        prev.map(v => v.country_id === countryId ? { ...v, is_visible: !currentVisible } : v)
      );

      toast({
        title: !currentVisible ? 'Pays activé' : 'Pays désactivé',
        description: `Le pays sera ${!currentVisible ? 'visible' : 'masqué'} sur les formulaires.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de modifier la visibilité',
        variant: 'destructive',
      });
    } finally {
      setTogglingId(null);
    }
  };

  const visibleCount = visibilities.filter(v => v.is_visible).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Visibilité des Pays
            </CardTitle>
            <CardDescription>
              Activez ou désactivez les pays affichés dans les formulaires
            </CardDescription>
          </div>
          <Badge variant="outline">
            {visibleCount}/{visibilities.length} actifs
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibilities.map((visibility) => {
            const isToggling = togglingId === visibility.country_id;

            return (
              <div
                key={visibility.id}
                className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                  visibility.is_visible
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border bg-muted/30 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                    {visibility.country_code?.slice(0, 2)?.toUpperCase() || '--'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{visibility.country_name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {visibility.is_visible ? (
                        <>
                          <Eye className="h-3 w-3" />
                          <span>Visible</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" />
                          <span>Masqué</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {isToggling ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Switch
                    checked={visibility.is_visible}
                    onCheckedChange={() => handleToggle(visibility.country_id, visibility.is_visible)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CountryVisibilityManager;
