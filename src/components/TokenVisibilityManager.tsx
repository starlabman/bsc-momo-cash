import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye, EyeOff, Coins, Network } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SUPPORTED_NETWORKS } from '@/components/NetworkSelector';

interface TokenVisibility {
  id: string;
  network_id: string;
  token_symbol: string;
  is_visible: boolean;
}

const TokenVisibilityManager: React.FC = () => {
  const [tokens, setTokens] = useState<TokenVisibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      const { data, error } = await supabase
        .from('token_visibility')
        .select('*')
        .order('network_id')
        .order('token_symbol');

      if (error) throw error;
      setTokens((data as any[]) || []);
    } catch (error) {
      console.error('Error fetching token visibilities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (networkId: string, tokenSymbol: string, currentVisible: boolean) => {
    const key = `${networkId}-${tokenSymbol}`;
    setTogglingKey(key);
    const token = localStorage.getItem('admin_token');

    try {
      const { data, error } = await supabase.functions.invoke('toggle-token-visibility', {
        body: { token, network_id: networkId, token_symbol: tokenSymbol, is_visible: !currentVisible }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erreur');

      setTokens(prev =>
        prev.map(t =>
          t.network_id === networkId && t.token_symbol === tokenSymbol
            ? { ...t, is_visible: !currentVisible }
            : t
        )
      );

      toast({
        title: !currentVisible ? 'Token activé' : 'Token désactivé',
        description: `${tokenSymbol} sur ${networkId} sera ${!currentVisible ? 'visible' : 'masqué'}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de modifier la visibilité',
        variant: 'destructive',
      });
    } finally {
      setTogglingKey(null);
    }
  };

  const visibleCount = tokens.filter(t => t.is_visible).length;

  // Group by network
  const groupedByNetwork = SUPPORTED_NETWORKS.map(network => ({
    ...network,
    tokens: tokens.filter(t => t.network_id === network.id),
  })).filter(g => g.tokens.length > 0);

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
              <Coins className="h-5 w-5 text-primary" />
              Visibilité des Tokens par Réseau
            </CardTitle>
            <CardDescription>
              Activez ou désactivez les tokens affichés pour chaque réseau blockchain
            </CardDescription>
          </div>
          <Badge variant="outline">
            {visibleCount}/{tokens.length} actifs
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {groupedByNetwork.map((group) => (
          <div key={group.id}>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <img src={group.icon} alt={group.name} className="h-5 w-5 rounded-full" />
              <span>{group.name}</span>
              <Badge variant="secondary" className="text-[10px]">
                {group.symbol}
              </Badge>
              <Badge variant="secondary" className="text-[10px] ml-auto">
                {group.tokens.filter(t => t.is_visible).length}/{group.tokens.length}
              </Badge>
            </h4>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.tokens.map((tv) => {
                const key = `${tv.network_id}-${tv.token_symbol}`;
                const isToggling = togglingKey === key;
                return (
                  <div
                    key={tv.id}
                    className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                      tv.is_visible
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border bg-muted/30 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <Coins className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{tv.token_symbol}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {tv.is_visible ? (
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
                        checked={tv.is_visible}
                        onCheckedChange={() => handleToggle(tv.network_id, tv.token_symbol, tv.is_visible)}
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

export default TokenVisibilityManager;
