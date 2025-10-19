import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, Settings, TrendingUp, Users, Clock, CheckCircle, XCircle, ArrowRightLeft, ArrowDownUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OfframpRequest {
  id: string;
  amount: number;
  token: string;
  momo_number: string;
  momo_provider: string;
  usd_amount: number;
  xof_amount: number;
  exchange_rate: number;
  bsc_address: string;
  transaction_hash: string | null;
  status: string;
  request_ip: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  blockchain_events: any[];
}

interface OnrampRequest {
  id: string;
  xof_amount: number;
  usd_amount: number;
  crypto_amount: number;
  exchange_rate: number;
  token: string;
  momo_number: string;
  momo_provider: string;
  recipient_address: string;
  request_ip: string;
  notes: string | null;
  transaction_hash: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface DashboardStats {
  pending_payment: number;
  received: number;
  processing: number;
  paid: number;
  failed: number;
  total_volume_usd: number;
  total_volume_xof: number;
  total_offramp: number;
  total_onramp: number;
  pending_onramp: number;
  completed_onramp: number;
}

interface BlockchainStats {
  total_events: number;
  processed_events: number;
  pending_events: number;
  total_volume: number;
  unique_tokens: number;
  recent_events: any[];
  volume_by_blockchain: Array<{ token: string; volume: number; count: number }>;
  highest_volume_blockchain: { token: string; volume: number; count: number } | null;
  lowest_volume_blockchain: { token: string; volume: number; count: number } | null;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<OfframpRequest[]>([]);
  const [onrampRequests, setOnrampRequests] = useState<OnrampRequest[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [blockchainStats, setBlockchainStats] = useState<BlockchainStats | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<OfframpRequest | null>(null);
  const [selectedOnrampRequest, setSelectedOnrampRequest] = useState<OnrampRequest | null>(null);
  const [updateData, setUpdateData] = useState({
    status: '',
    notes: '',
    transaction_hash: ''
  });
  const [onrampUpdateData, setOnrampUpdateData] = useState({
    status: '',
    notes: '',
    transaction_hash: ''
  });

  // Helper function to get admin authorization headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const statusColors = {
    'pending_payment': 'secondary',
    'received': 'default',
    'processing': 'outline',
    'paid': 'default',
    'failed': 'destructive'
  } as const;

  const statusLabels = {
    'pending_payment': 'En attente',
    'pending_momo_payment': 'En attente paiement Mobile Money',
    'momo_payment_received': 'Paiement Mobile Money reçu',
    'crypto_sent': 'Crypto envoyé',
    'received': 'Reçu',
    'processing': 'En cours',
    'paid': 'Payé',
    'failed': 'Échoué'
  };

  useEffect(() => {
    fetchRequests();
    fetchOnrampRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const authHeaders = getAuthHeaders();
      
      const response = await fetch(`https://xusensadnrsodukuzndm.supabase.co/functions/v1/admin-dashboard`, {
        method: 'GET',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (data?.success) {
        setRequests(data.data.requests);
        setStats(data.data.stats);
        setBlockchainStats(data.data.blockchainStats);
      } else {
        throw new Error(data?.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Erreur",
        description: `Impossible de charger les demandes: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOnrampRequests = async () => {
    setLoading(true);
    try {
      console.log('=== FETCH ONRAMP REQUESTS DEBUG ===');
      const authHeaders = getAuthHeaders();
      console.log('Auth headers:', authHeaders);
      
      const { data, error } = await supabase.functions.invoke('admin-dashboard', {
        body: { table: 'onramp_requests' },
        headers: authHeaders
      });

      console.log('Onramp function response data:', data);
      console.log('Onramp function response error:', error);

      if (error) throw error;

      if (data?.success) {
        console.log('Setting onramp requests:', data.data.requests || []);
        setOnrampRequests(data.data.requests || []);
      } else {
        console.error('Onramp function returned error:', data?.error);
        throw new Error(data?.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error fetching onramp requests:', error);
      toast({
        title: "Erreur",
        description: `Impossible de charger les demandes onramp: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async () => {
    if (!selectedRequest) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-dashboard', {
        body: {
          id: selectedRequest.id,
          status: updateData.status,
          notes: updateData.notes || undefined,
          transaction_hash: updateData.transaction_hash || undefined
        },
        headers: getAuthHeaders()
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Succès",
          description: "Demande mise à jour",
        });
        setSelectedRequest(null);
        setUpdateData({ status: '', notes: '', transaction_hash: '' });
        fetchRequests();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOnrampRequestStatus = async () => {
    if (!selectedOnrampRequest) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-dashboard', {
        body: {
          table: 'onramp_requests',
          id: selectedOnrampRequest.id,
          status: onrampUpdateData.status,
          notes: onrampUpdateData.notes || undefined,
          transaction_hash: onrampUpdateData.transaction_hash || undefined
        },
        headers: getAuthHeaders()
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Succès",
          description: "Demande onramp mise à jour",
        });
        setSelectedOnrampRequest(null);
        setOnrampUpdateData({ status: '', notes: '', transaction_hash: '' });
        fetchOnrampRequests();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error updating onramp request:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openUpdateDialog = (request: OfframpRequest) => {
    setSelectedRequest(request);
    setUpdateData({
      status: request.status,
      notes: request.notes || '',
      transaction_hash: request.transaction_hash || ''
    });
  };

  const openOnrampUpdateDialog = (request: OnrampRequest) => {
    setSelectedOnrampRequest(request);
    setOnrampUpdateData({
      status: request.status,
      notes: request.notes || '',
      transaction_hash: request.transaction_hash || ''
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Admin</h1>
          <p className="text-muted-foreground">Gestion des demandes de conversion crypto</p>
        </div>
        <Button 
          onClick={() => {
            fetchRequests();
            fetchOnrampRequests();
          }} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Statistiques générales */}
      {stats && (
        <div className="space-y-4">
          {/* Volumes totaux */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Volume Total USD
                </CardTitle>
                <CardDescription>Total des transactions en USD</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  ${stats.total_volume_usd.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Volume Total XOF
                </CardTitle>
                <CardDescription>Total des transactions en XOF</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                  {stats.total_volume_xof.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} XOF
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Statistiques Offramp */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" />
                Statistiques Offramp (Crypto → Mobile Money)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending_payment}</p>
                  <p className="text-xs text-muted-foreground mt-1">En attente</p>
                </div>
                
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.received}</p>
                  <p className="text-xs text-muted-foreground mt-1">Reçu</p>
                </div>

                <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <Settings className="h-5 w-5 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.processing}</p>
                  <p className="text-xs text-muted-foreground mt-1">En cours</p>
                </div>

                <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.paid}</p>
                  <p className="text-xs text-muted-foreground mt-1">Payé</p>
                </div>

                <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.failed}</p>
                  <p className="text-xs text-muted-foreground mt-1">Échoué</p>
                </div>

                <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.total_offramp || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques Onramp */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownUp className="h-5 w-5" />
                Statistiques Onramp (Mobile Money → Crypto)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending_onramp || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">En attente paiement</p>
                </div>

                <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.completed_onramp || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Complété</p>
                </div>

                <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
                  <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.total_onramp || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total</p>
                </div>

                <div className="text-center p-3 bg-cyan-50 dark:bg-cyan-950 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-cyan-600 dark:text-cyan-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                    {stats.total_onramp && stats.completed_onramp ? 
                      Math.round((stats.completed_onramp / stats.total_onramp) * 100) : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Taux réussite</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Métriques de performance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {(stats.total_offramp || 0) + (stats.total_onramp || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.total_offramp || 0} offramp + {stats.total_onramp || 0} onramp
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Taux de réussite Offramp</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats.total_offramp ? 
                    Math.round((stats.paid / stats.total_offramp) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.paid} payés sur {stats.total_offramp || 0} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Montant moyen par transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  ${stats.total_offramp ? 
                    (stats.total_volume_usd / stats.total_offramp).toFixed(2) : 0}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Basé sur {stats.total_offramp || 0} transactions offramp
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Statistiques Blockchain */}
      {blockchainStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              Statistiques Blockchain
            </CardTitle>
            <CardDescription>Événements et transactions on-chain</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="text-center p-3 bg-violet-50 dark:bg-violet-950 rounded-lg">
                <svg className="h-5 w-5 text-violet-600 dark:text-violet-400 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{blockchainStats.total_events}</p>
                <p className="text-xs text-muted-foreground mt-1">Total événements</p>
              </div>

              <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{blockchainStats.processed_events}</p>
                <p className="text-xs text-muted-foreground mt-1">Traités</p>
              </div>

              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{blockchainStats.pending_events}</p>
                <p className="text-xs text-muted-foreground mt-1">En attente</p>
              </div>

              <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {blockchainStats.total_volume.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Volume blockchain</p>
              </div>

              <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <svg className="h-5 w-5 text-purple-600 dark:text-purple-400 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{blockchainStats.unique_tokens}</p>
                <p className="text-xs text-muted-foreground mt-1">Tokens uniques</p>
              </div>
            </div>

            {/* Volume comparison */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Volume Offramp (XOF)</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {stats?.total_volume_xof?.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) || '0'} XOF
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Volume Offramp (USD)</p>
                <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                  ${stats?.total_volume_usd?.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) || '0'}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Total Onramp</p>
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  {stats?.total_onramp || 0} transactions
                </p>
              </div>
            </div>

            {/* Volume by blockchain */}
            {blockchainStats.volume_by_blockchain && blockchainStats.volume_by_blockchain.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold mb-3">Volume par blockchain</h4>
                <div className="space-y-2">
                  {blockchainStats.volume_by_blockchain.map((item: any) => (
                    <div key={item.token} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{item.token}</Badge>
                        <span className="text-sm text-muted-foreground">{item.count} transactions</span>
                      </div>
                      <p className="text-lg font-bold">{item.volume.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Highest and lowest volume blockchains */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {blockchainStats.highest_volume_blockchain && (
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <p className="text-sm font-semibold">Blockchain max volume</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {blockchainStats.highest_volume_blockchain.token}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {blockchainStats.highest_volume_blockchain.volume.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} 
                    ({blockchainStats.highest_volume_blockchain.count} tx)
                  </p>
                </div>
              )}
              {blockchainStats.lowest_volume_blockchain && (
                <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400 rotate-180" />
                    <p className="text-sm font-semibold">Blockchain min volume</p>
                  </div>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {blockchainStats.lowest_volume_blockchain.token}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {blockchainStats.lowest_volume_blockchain.volume.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} 
                    ({blockchainStats.lowest_volume_blockchain.count} tx)
                  </p>
                </div>
              )}
            </div>

            {/* Recent blockchain events */}
            {blockchainStats.recent_events.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-3">Événements récents</h4>
                <div className="space-y-2">
                  {blockchainStats.recent_events.map((event: any) => (
                    <div key={event.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={event.processed ? "default" : "secondary"}>
                            {event.token_symbol}
                          </Badge>
                          <span className="font-mono text-xs">{event.amount}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          TX: {event.transaction_hash?.substring(0, 20)}...
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={event.processed ? "default" : "outline"}>
                          {event.processed ? 'Traité' : 'En attente'}
                        </Badge>
                        {event.block_number && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Bloc #{event.block_number}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Requests Tabs */}
      <Tabs defaultValue="offramp" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="offramp" className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Crypto → Mobile Money ({requests.length})
          </TabsTrigger>
          <TabsTrigger value="onramp" className="flex items-center gap-2">
            <ArrowDownUp className="h-4 w-4" />
            Mobile Money → Crypto ({onrampRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="offramp">
          <Card>
            <CardHeader>
              <CardTitle>Demandes Offramp (Crypto → Mobile Money)</CardTitle>
              <CardDescription>
                Liste des demandes de conversion crypto vers Mobile Money
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Token</TableHead>
                      <TableHead>Mobile Money</TableHead>
                      <TableHead>XOF</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="text-xs">
                          {new Date(request.created_at).toLocaleDateString('fr-FR')}
                          <br />
                          {new Date(request.created_at).toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{request.amount} {request.token}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{request.token}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{request.momo_number}</div>
                          {request.momo_provider && (
                            <Badge variant="secondary" className="text-xs">
                              {request.momo_provider}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {Math.round(request.xof_amount).toLocaleString()} XOF
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusColors[request.status as keyof typeof statusColors]}>
                            {statusLabels[request.status as keyof typeof statusLabels]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openUpdateDialog(request)}
                              >
                                Modifier
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Mettre à jour la demande offramp</DialogTitle>
                                <DialogDescription>
                                  Modifiez le statut et ajoutez des notes
                                </DialogDescription>
                              </DialogHeader>
                              
                              {selectedRequest?.id === request.id && (
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label>Statut</Label>
                                    <Select 
                                      value={updateData.status} 
                                      onValueChange={(value) => setUpdateData({ ...updateData, status: value })}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending_payment">En attente</SelectItem>
                                        <SelectItem value="received">Reçu</SelectItem>
                                        <SelectItem value="processing">En cours</SelectItem>
                                        <SelectItem value="paid">Payé</SelectItem>
                                        <SelectItem value="failed">Échoué</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Hash de transaction (optionnel)</Label>
                                    <Input
                                      placeholder="0x..."
                                      value={updateData.transaction_hash}
                                      onChange={(e) => setUpdateData({ ...updateData, transaction_hash: e.target.value })}
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Notes</Label>
                                    <Textarea
                                      placeholder="Ajouter des notes..."
                                      value={updateData.notes}
                                      onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })}
                                    />
                                  </div>

                                  <Button 
                                    onClick={updateRequestStatus} 
                                    disabled={loading}
                                    className="w-full"
                                  >
                                    {loading ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Mise à jour...
                                      </>
                                    ) : (
                                      'Mettre à jour'
                                    )}
                                  </Button>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {requests.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune demande offramp trouvée
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="onramp">
          <Card>
            <CardHeader>
              <CardTitle>Demandes Onramp (Mobile Money → Crypto)</CardTitle>
              <CardDescription>
                Liste des demandes de conversion Mobile Money vers crypto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>XOF</TableHead>
                      <TableHead>Crypto</TableHead>
                      <TableHead>Mobile Money</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {onrampRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="text-xs">
                          {new Date(request.created_at).toLocaleDateString('fr-FR')}
                          <br />
                          {new Date(request.created_at).toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </TableCell>
                        <TableCell className="font-medium">
                          {Math.round(request.xof_amount).toLocaleString()} XOF
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{request.crypto_amount} {request.token}</div>
                          <Badge variant="outline" className="text-xs">{request.token}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{request.momo_number}</div>
                          {request.momo_provider && (
                            <Badge variant="secondary" className="text-xs">
                              {request.momo_provider}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {request.recipient_address.slice(0, 6)}...{request.recipient_address.slice(-4)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusColors[request.status as keyof typeof statusColors] || 'secondary'}>
                            {statusLabels[request.status as keyof typeof statusLabels] || request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openOnrampUpdateDialog(request)}
                              >
                                Modifier
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Mettre à jour la demande onramp</DialogTitle>
                                <DialogDescription>
                                  Modifiez le statut et ajoutez des notes
                                </DialogDescription>
                              </DialogHeader>
                              
                              {selectedOnrampRequest?.id === request.id && (
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label>Statut</Label>
                                    <Select 
                                      value={onrampUpdateData.status} 
                                      onValueChange={(value) => setOnrampUpdateData({ ...onrampUpdateData, status: value })}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending_momo_payment">En attente paiement Mobile Money</SelectItem>
                                        <SelectItem value="momo_payment_received">Paiement Mobile Money reçu</SelectItem>
                                        <SelectItem value="crypto_sent">Crypto envoyé</SelectItem>
                                        <SelectItem value="failed">Échoué</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Hash de transaction (optionnel)</Label>
                                    <Input
                                      placeholder="0x..."
                                      value={onrampUpdateData.transaction_hash}
                                      onChange={(e) => setOnrampUpdateData({ ...onrampUpdateData, transaction_hash: e.target.value })}
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Notes</Label>
                                    <Textarea
                                      placeholder="Ajouter des notes..."
                                      value={onrampUpdateData.notes}
                                      onChange={(e) => setOnrampUpdateData({ ...onrampUpdateData, notes: e.target.value })}
                                    />
                                  </div>

                                  <Button 
                                    onClick={updateOnrampRequestStatus} 
                                    disabled={loading}
                                    className="w-full"
                                  >
                                    {loading ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Mise à jour...
                                      </>
                                    ) : (
                                      'Mettre à jour'
                                    )}
                                  </Button>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {onrampRequests.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune demande onramp trouvée
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;