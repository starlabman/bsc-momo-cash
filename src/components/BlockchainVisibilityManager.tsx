import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, EyeOff, Network, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react';
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
  const [bulkLoading, setBulkLoading] = useState(false);
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
        description: !currentVisible
          ? 'Le réseau est maintenant visible.'
          : 'Le réseau et ses tokens liés ont été désactivés.',
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
      const { data, error } = await supabase.functions.invoke('toggle-blockchain-visibility', {
        body: { token, bulk_action: enableAll ? 'enable_all' : 'disable_all' }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erreur');

      setVisibilities(prev => prev.map(v => ({ ...v, is_visible: enableAll })));

      toast({
        title: enableAll ? 'Tous les réseaux activés' : 'Tous les réseaux désactivés',
        description: enableAll
          ? 'Tous les réseaux sont maintenant visibles.'
          : 'Tous les réseaux et leurs tokens liés ont été désactivés.',
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

  const getNetworkIcon = (networkId: string) => {
    return SUPPORTED_NETWORKS.find(n => n.id === networkId)?.icon;
  };

  const visibleCount = visibilities.filter(v => v.is_visible).length;
  const allVisible = visibleCount === visibilities.length;
  const noneVisible = visibleCount === 0;

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
                Désactiver un réseau désactive aussi ses tokens liés
              </CardDescription>
            </div>
            <Badge variant="outline">
              {visibleCount}/{visibilities.length} actifs
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
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibilities.map((visibility) => {
              const icon = getNetworkIcon(visibility.network_id);
              const isToggling = togglingId === visibility.network_id;
              const pending = pendingCounts[visibility.network_id] || 0;

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
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{visibility.network_name}</p>
                        {pending > 0 && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">
                            {pending} en cours
                          </Badge>
                        )}
                      </div>
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
              Désactiver ce réseau le masquera sur la page d'accueil et désactivera ses tokens liés.
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
