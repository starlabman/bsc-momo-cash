import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye, EyeOff, Network, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SUPPORTED_NETWORKS } from '@/components/NetworkSelector';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BlockchainVisibility {
  id: string;
  network_id: string;
  network_name: string;
  is_visible: boolean;
}

const BlockchainVisibilityManager: React.FC = () => {
  const [visibilities, setVisibilities] = useState<BlockchainVisibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    networkId: string;
    networkName: string;
    pendingCount: number;
  }>({ open: false, networkId: '', networkName: '', pendingCount: 0 });
  const { toast } = useToast();

  useEffect(() => {
    fetchVisibilities();
    fetchAllPendingCounts();
  }, []);

  const fetchVisibilities = async () => {
    try {
      const { data, error } = await supabase
        .from('blockchain_visibility')
        .select('*')
        .order('network_name');

      if (error) throw error;
      setVisibilities((data as any[]) || []);
    } catch (error) {
      console.error('Error fetching visibilities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPendingCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('blockchain_events')
        .select('network')
        .eq('processed', false);

      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((e: any) => {
        counts[e.network] = (counts[e.network] || 0) + 1;
      });
      setPendingCounts(counts);
    } catch {
      // silent
    }
  };

  const checkPendingTransactions = async (networkId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('blockchain_events')
        .select('*', { count: 'exact', head: true })
        .eq('network', networkId)
        .eq('processed', false);

      if (error) throw error;
      return count || 0;
    } catch {
      return 0;
    }
  };

  const handleToggle = async (networkId: string, networkName: string, currentVisible: boolean) => {
    // If disabling, check for pending transactions first
    if (currentVisible) {
      const pendingCount = await checkPendingTransactions(networkId);
      if (pendingCount > 0) {
        setConfirmDialog({ open: true, networkId, networkName, pendingCount });
        return;
      }
    }
    await toggleVisibility(networkId, currentVisible);
  };

  const toggleVisibility = async (networkId: string, currentVisible: boolean) => {
    setTogglingId(networkId);
    const token = localStorage.getItem('admin_token');

    try {
      const { data, error } = await supabase.functions.invoke('toggle-blockchain-visibility', {
        body: { token, network_id: networkId, is_visible: !currentVisible }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erreur');

      setVisibilities(prev =>
        prev.map(v => v.network_id === networkId ? { ...v, is_visible: !currentVisible } : v)
      );

      toast({
        title: !currentVisible ? 'Réseau activé' : 'Réseau désactivé',
        description: `Le réseau sera ${!currentVisible ? 'visible' : 'masqué'} sur la page d'accueil.`,
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

  const getNetworkIcon = (networkId: string) => {
    return SUPPORTED_NETWORKS.find(n => n.id === networkId)?.icon;
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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5 text-primary" />
                Visibilité des Blockchains
              </CardTitle>
              <CardDescription>
                Activez ou désactivez les réseaux blockchain affichés sur la page d'accueil
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
              const icon = getNetworkIcon(visibility.network_id);
              const isToggling = togglingId === visibility.network_id;

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
                    {icon ? (
                      <img src={icon} alt={visibility.network_name} className="h-8 w-8 rounded-full" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <Network className="h-4 w-4" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{visibility.network_name}</p>
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
                      onCheckedChange={() => handleToggle(visibility.network_id, visibility.network_name, visibility.is_visible)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Transactions en cours détectées
            </AlertDialogTitle>
            <AlertDialogDescription>
              Le réseau <strong>{confirmDialog.networkName}</strong> a actuellement{' '}
              <strong>{confirmDialog.pendingCount} transaction{confirmDialog.pendingCount > 1 ? 's' : ''} non traitée{confirmDialog.pendingCount > 1 ? 's' : ''}</strong>.
              Désactiver ce réseau le masquera sur la page d'accueil mais n'affectera pas les transactions existantes.
              Voulez-vous continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                toggleVisibility(confirmDialog.networkId, true);
                setConfirmDialog(prev => ({ ...prev, open: false }));
              }}
            >
              Désactiver quand même
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BlockchainVisibilityManager;
