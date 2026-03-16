import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, EyeOff, Phone, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OperatorWithCountry {
  id: string;
  name: string;
  country_id: string;
  is_visible: boolean;
  country_name?: string;
  country_code?: string;
}

const OperatorVisibilityManager: React.FC = () => {
  const [operators, setOperators] = useState<OperatorWithCountry[]>([]);
  const [countries, setCountries] = useState<{ id: string; name: string; code: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [opRes, countryRes] = await Promise.all([
        supabase.from('mobile_operators').select('id, name, country_id, is_visible').order('name'),
        supabase.from('countries').select('id, name, code').order('name'),
      ]);

      if (opRes.error) throw opRes.error;
      if (countryRes.error) throw countryRes.error;

      const countryMap = new Map((countryRes.data || []).map(c => [c.id, c]));
      const ops = ((opRes.data as any[]) || []).map(op => ({
        ...op,
        country_name: countryMap.get(op.country_id)?.name || 'Inconnu',
        country_code: countryMap.get(op.country_id)?.code || '--',
      }));

      setCountries(countryRes.data || []);
      setOperators(ops);
    } catch (error) {
      console.error('Error fetching operators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (operatorId: string, currentVisible: boolean) => {
    setTogglingId(operatorId);
    const token = localStorage.getItem('admin_token');

    try {
      const { data, error } = await supabase.functions.invoke('toggle-operator-visibility', {
        body: { token, operator_id: operatorId, is_visible: !currentVisible }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erreur');

      setOperators(prev =>
        prev.map(o => o.id === operatorId ? { ...o, is_visible: !currentVisible } : o)
      );

      toast({
        title: !currentVisible ? 'Opérateur activé' : 'Opérateur désactivé',
        description: `L'opérateur sera ${!currentVisible ? 'visible' : 'masqué'} sur les formulaires.`,
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

  const handleBulkToggle = async (enableAll: boolean) => {
    setBulkLoading(true);
    const token = localStorage.getItem('admin_token');

    try {
      const { data, error } = await supabase.functions.invoke('toggle-operator-visibility', {
        body: { token, bulk_action: enableAll ? 'enable_all' : 'disable_all' }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erreur');

      setOperators(prev => prev.map(o => ({ ...o, is_visible: enableAll })));

      toast({
        title: enableAll ? 'Tous les opérateurs activés' : 'Tous les opérateurs désactivés',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de modifier la visibilité',
        variant: 'destructive',
      });
    } finally {
      setBulkLoading(false);
    }
  };

  const visibleCount = operators.filter(o => o.is_visible).length;
  const allVisible = visibleCount === operators.length;
  const noneVisible = visibleCount === 0;

  const groupedByCountry = countries
    .map(country => ({
      ...country,
      operators: operators.filter(o => o.country_id === country.id),
    }))
    .filter(g => g.operators.length > 0);

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
              <Phone className="h-5 w-5 text-primary" />
              Visibilité des Opérateurs Mobile Money
            </CardTitle>
            <CardDescription>
              Activez ou désactivez les opérateurs affichés par pays dans les formulaires
            </CardDescription>
          </div>
          <Badge variant="outline">
            {visibleCount}/{operators.length} actifs
          </Badge>
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={bulkLoading || allVisible}
            onClick={() => handleBulkToggle(true)}
          >
            {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ToggleRight className="h-4 w-4 mr-1" />}
            Tout activer
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={bulkLoading || noneVisible}
            onClick={() => handleBulkToggle(false)}
          >
            {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ToggleLeft className="h-4 w-4 mr-1" />}
            Tout désactiver
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {groupedByCountry.map((group) => (
          <div key={group.id}>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <span className="uppercase">{group.code}</span>
              <span>—</span>
              <span>{group.name}</span>
              <Badge variant="secondary" className="text-[10px] ml-auto">
                {group.operators.filter(o => o.is_visible).length}/{group.operators.length}
              </Badge>
            </h4>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.operators.map((op) => {
                const isToggling = togglingId === op.id;
                return (
                  <div
                    key={op.id}
                    className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                      op.is_visible
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border bg-muted/30 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{op.name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {op.is_visible ? (
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
                        checked={op.is_visible}
                        onCheckedChange={() => handleToggle(op.id, op.is_visible)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default OperatorVisibilityManager;
