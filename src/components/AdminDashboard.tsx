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

type DashboardSection = 'dashboard' | 'offramp' | 'onramp' | 'stats-global' | 'stats-country' | 'stats-blockchain' | 'stats-users';

interface AdminDashboardProps {
  section?: DashboardSection;
}

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
  unique_networks: number;
  supported_networks?: number;
  volume_by_network: Array<{ 
    network: string; 
    volume: number; 
    count: number; 
    unique_tokens: number; 
    percentage: number;
    offramp_count?: number;
    onramp_count?: number;
  }>;
  highest_volume_network: { 
    network: string; 
    volume: number; 
    count: number; 
    unique_tokens: number; 
    percentage: number;
    offramp_count?: number;
    onramp_count?: number;
  } | null;
  lowest_volume_network: { 
    network: string; 
    volume: number; 
    count: number; 
    unique_tokens: number; 
    percentage: number;
    offramp_count?: number;
    onramp_count?: number;
  } | null;
  by_network?: Array<{
    network: string;
    total_events: number;
    total_amount: number;
  }>;
  by_token?: Array<{
    token_symbol: string;
    total_events: number;
    total_amount: number;
  }>;
}

interface CountryStats {
  by_country: Array<{
    country_id: string;
    country_name: string;
    country_code: string;
    flag_emoji: string;
    offramp_count: number;
    onramp_count: number;
    offramp_volume_usd: number;
    offramp_volume_xof: number;
    onramp_volume_usd: number;
    onramp_volume_xof: number;
    total_transactions: number;
    total_volume_usd: number;
    total_volume_xof: number;
    percentage: number;
  }>;
  total_countries: number;
  most_active_country: any;
  least_active_country: any;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ section = 'dashboard' }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<OfframpRequest[]>([]);
  const [onrampRequests, setOnrampRequests] = useState<OnrampRequest[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [blockchainStats, setBlockchainStats] = useState<BlockchainStats | null>(null);
  const [countryStats, setCountryStats] = useState<CountryStats | null>(null);
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

  // Statuts pour OFFRAMP (Crypto → Mobile Money)
  const offrampStatuses = [
    { value: 'pending_payment', label: 'En attente paiement crypto', color: 'secondary', description: 'Client doit envoyer la crypto' },
    { value: 'received', label: 'Crypto reçue', color: 'default', description: 'Paiement crypto confirmé' },
    { value: 'processing', label: 'En cours de traitement', color: 'outline', description: 'Transfert mobile money en cours' },
    { value: 'paid', label: 'Mobile Money envoyé', color: 'default', description: 'Client a reçu le mobile money' },
    { value: 'failed', label: 'Échoué', color: 'destructive', description: 'Transaction échouée' }
  ];

  // Statuts pour ONRAMP (Mobile Money → Crypto)
  const onrampStatuses = [
    { value: 'pending_momo_payment', label: 'En attente paiement Mobile Money', color: 'secondary', description: 'Client doit envoyer le mobile money' },
    { value: 'momo_payment_received', label: 'Mobile Money reçu', color: 'default', description: 'Paiement mobile money confirmé' },
    { value: 'processing', label: 'En cours de traitement', color: 'outline', description: 'Transfert crypto en cours' },
    { value: 'completed', label: 'Crypto envoyée', color: 'default', description: 'Client a reçu la crypto' },
    { value: 'failed', label: 'Échoué', color: 'destructive', description: 'Transaction échouée' }
  ];

  const getStatusInfo = (status: string, isOnramp: boolean = false) => {
    const statuses = isOnramp ? onrampStatuses : offrampStatuses;
    return statuses.find(s => s.value === status) || statuses[0];
  };

  const statusColors = {
    'pending_payment': 'secondary',
    'pending_momo_payment': 'secondary',
    'received': 'default',
    'momo_payment_received': 'default',
    'processing': 'outline',
    'paid': 'default',
    'completed': 'default',
    'failed': 'destructive'
  } as const;

  const statusLabels = {
    'pending_payment': 'En attente paiement crypto',
    'pending_momo_payment': 'En attente paiement Mobile Money',
    'momo_payment_received': 'Mobile Money reçu',
    'received': 'Crypto reçue',
    'processing': 'En cours de traitement',
    'paid': 'Mobile Money envoyé',
    'completed': 'Crypto envoyée',
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
        setCountryStats(data.data.countryStats);
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

  const sectionTitles = {
    dashboard: { title: 'Vue d\'ensemble', subtitle: 'Aperçu des transactions et statistiques' },
    offramp: { title: 'Transactions Offramp', subtitle: 'Crypto → Mobile Money' },
    onramp: { title: 'Transactions Onramp', subtitle: 'Mobile Money → Crypto' },
    'stats-global': { title: 'Statistiques Globales', subtitle: 'Vue d\'ensemble des statistiques générales' },
    'stats-country': { title: 'Statistiques par Pays', subtitle: 'Analyses détaillées par pays' },
    'stats-blockchain': { title: 'Statistiques Blockchain', subtitle: 'Analyses par réseau et événements blockchain' },
    'stats-users': { title: 'Statistiques Utilisateurs', subtitle: 'Analyses des requêtes et utilisateurs' }
  };

  return (
    <div className="space-y-8">
      {/* Header avec bouton refresh */}
      <div className="flex items-center justify-between animate-slide-in-down">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {sectionTitles[section].title}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{sectionTitles[section].subtitle}</p>
        </div>
        <Button 
          onClick={() => {
            fetchRequests();
            fetchOnrampRequests();
          }} 
          disabled={loading}
          className="gap-2 shadow-lg hover:shadow-xl transition-shadow"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Actualiser</span>
        </Button>
      </div>

      {/* Statistiques générales - Section Dashboard et Stats Global */}
      {(section === 'dashboard' || section === 'stats-global') && (
      <div id="dashboard" className="scroll-mt-20">
        {stats && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">En attente</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.pending_payment}</p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-500/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Reçu</p>
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.received}</p>
                    </div>
                    <ArrowDownUp className="h-8 w-8 text-yellow-500/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">En traitement</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.processing}</p>
                    </div>
                    <RefreshCw className="h-8 w-8 text-purple-500/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Payé</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.paid}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20 hover:border-red-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Échoué</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.failed}</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Offramp</p>
                      <p className="text-2xl font-bold">{stats.total_offramp}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-primary/50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Onramp Stats */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Onramp</p>
                      <p className="text-2xl font-bold">{stats.total_onramp}</p>
                    </div>
                    <ArrowRightLeft className="h-8 w-8 text-primary/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">En attente</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.pending_onramp}</p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-500/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Complété</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed_onramp}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Volume Total</p>
                      <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                        {Number(stats.total_volume_usd).toLocaleString('en-US', { 
                          style: 'currency', 
                          currency: 'USD',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-amber-500/50" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Statistiques Pays */}
      {(section === 'dashboard' || section === 'stats-country') && countryStats && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Statistiques par Pays
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Pays le plus actif</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl font-bold">{countryStats.most_active_country?.country_name || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">{countryStats.most_active_country?.total_requests || 0} requêtes</p>
                    </div>
                    <p className="text-3xl">{countryStats.most_active_country?.flag_emoji || '🌍'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Pays le moins actif</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl font-bold">{countryStats.least_active_country?.country_name || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">{countryStats.least_active_country?.total_requests || 0} requêtes</p>
                    </div>
                    <p className="text-3xl">{countryStats.least_active_country?.flag_emoji || '🌍'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-3">Répartition par pays</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pays</TableHead>
                        <TableHead className="text-right">Requêtes</TableHead>
                        <TableHead className="text-right">Volume (USD)</TableHead>
                        <TableHead className="text-right">Volume (XOF)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {countryStats.by_country?.map((country: any) => (
                        <TableRow key={country.country_id}>
                          <TableCell className="flex items-center gap-2">
                            <span className="text-2xl">{country.flag_emoji}</span>
                            <span className="font-medium">{country.country_name}</span>
                          </TableCell>
                          <TableCell className="text-right">{country.total_requests}</TableCell>
                          <TableCell className="text-right">
                            {Number(country.total_usd || 0).toLocaleString('en-US', { 
                              style: 'currency', 
                              currency: 'USD',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            {Number(country.total_xof || 0).toLocaleString('fr-FR', { 
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0
                            })} XOF
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques Blockchain */}
      {(section === 'dashboard' || section === 'stats-blockchain') && blockchainStats && (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Statistiques Blockchain
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <p className="text-sm font-medium text-muted-foreground mb-2">Total événements</p>
                <p className="text-2xl font-bold">{blockchainStats.total_events || 0}</p>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <p className="text-sm font-medium text-muted-foreground mb-2">Traités</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{blockchainStats.processed_events || 0}</p>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20">
                <p className="text-sm font-medium text-muted-foreground mb-2">En attente</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{blockchainStats.pending_events || 0}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">Par réseau</h4>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Réseau</TableHead>
                      <TableHead className="text-right">Événements</TableHead>
                      <TableHead className="text-right">Volume Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blockchainStats.by_network?.map((network: any) => (
                      <TableRow key={network.network}>
                        <TableCell className="font-medium uppercase">{network.network}</TableCell>
                        <TableCell className="text-right">{network.total_events}</TableCell>
                        <TableCell className="text-right">
                          {Number(network.total_amount || 0).toLocaleString('en-US', { 
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">Par token</h4>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Token</TableHead>
                      <TableHead className="text-right">Événements</TableHead>
                      <TableHead className="text-right">Volume Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blockchainStats.by_token?.map((token: any) => (
                      <TableRow key={token.token_symbol}>
                        <TableCell className="font-medium">{token.token_symbol}</TableCell>
                        <TableCell className="text-right">{token.total_events}</TableCell>
                        <TableCell className="text-right">
                          {Number(token.total_amount || 0).toLocaleString('en-US', { 
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Statistiques Utilisateurs */}
      {(section === 'dashboard' || section === 'stats-users') && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Statistiques Utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Total requêtes uniques</p>
                  <p className="text-2xl font-bold">{requests.length + onrampRequests.length}</p>
                </div>

                <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Utilisateurs actifs</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {new Set([
                      ...requests.map(r => r.momo_number),
                      ...onrampRequests.map(r => r.momo_number)
                    ]).size}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requests Tabs - Sections Offramp et Onramp */}
      <div className="space-y-6">
        {/* Section Offramp */}
        {(section === 'dashboard' || section === 'offramp') && (
        <div id="offramp" className="scroll-mt-20">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                <ArrowRightLeft className="h-5 w-5" />
                Demandes Offramp (Crypto → Mobile Money)
                <Badge variant="secondary" className="ml-2">{requests.length}</Badge>
              </CardTitle>
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
                                  {/* Status flow explanation */}
                                  <div className="bg-muted/50 p-3 rounded-lg mb-4">
                                    <p className="text-xs font-semibold mb-2">📋 Flux Offramp (Crypto → Mobile Money):</p>
                                    <div className="space-y-1 text-xs text-muted-foreground">
                                      <div>1️⃣ En attente paiement crypto → Client envoie crypto</div>
                                      <div>2️⃣ Crypto reçue → Paiement confirmé on-chain</div>
                                      <div>3️⃣ En cours de traitement → Transfert Mobile Money en cours</div>
                                      <div>4️⃣ Mobile Money envoyé → Transaction terminée ✓</div>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Statut actuel: {getStatusInfo(request.status, false).label}</Label>
                                    <Select 
                                      value={updateData.status} 
                                      onValueChange={(value) => setUpdateData({ ...updateData, status: value })}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Choisir un statut" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {offrampStatuses.map((status) => (
                                          <SelectItem key={status.value} value={status.value}>
                                            <div className="flex flex-col">
                                              <span className="font-medium">{status.label}</span>
                                              <span className="text-xs text-muted-foreground">{status.description}</span>
                                            </div>
                                          </SelectItem>
                                        ))}
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
        </div>
        )}

        {/* Section Onramp */}
        {(section === 'dashboard' || section === 'onramp') && (
        <div id="onramp" className="scroll-mt-20">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                <ArrowDownUp className="h-5 w-5" />
                Demandes Onramp (Mobile Money → Crypto)
                <Badge variant="secondary" className="ml-2">{onrampRequests.length}</Badge>
              </CardTitle>
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
                                  {/* Status flow explanation */}
                                  <div className="bg-muted/50 p-3 rounded-lg mb-4">
                                    <p className="text-xs font-semibold mb-2">📋 Flux Onramp (Mobile Money → Crypto):</p>
                                    <div className="space-y-1 text-xs text-muted-foreground">
                                      <div>1️⃣ En attente paiement Mobile Money → Client envoie Mobile Money</div>
                                      <div>2️⃣ Mobile Money reçu → Paiement confirmé</div>
                                      <div>3️⃣ En cours de traitement → Transfert crypto en cours</div>
                                      <div>4️⃣ Crypto envoyée → Transaction terminée ✓</div>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Statut actuel: {getStatusInfo(request.status, true).label}</Label>
                                    <Select 
                                      value={onrampUpdateData.status} 
                                      onValueChange={(value) => setOnrampUpdateData({ ...onrampUpdateData, status: value })}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Choisir un statut" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {onrampStatuses.map((status) => (
                                          <SelectItem key={status.value} value={status.value}>
                                            <div className="flex flex-col">
                                              <span className="font-medium">{status.label}</span>
                                              <span className="text-xs text-muted-foreground">{status.description}</span>
                                            </div>
                                          </SelectItem>
                                        ))}
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
        </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;