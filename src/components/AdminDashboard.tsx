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
import { Loader2, RefreshCw, Settings, TrendingUp, Users, Clock, CheckCircle, XCircle, ArrowRightLeft, ArrowDownUp, Search, X } from 'lucide-react';
import AdminFilters from './AdminFilters';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type DashboardSection = 'dashboard' | 'offramp' | 'onramp' | 'stats';

interface AdminDashboardProps {
  section?: DashboardSection;
}

interface OfframpRequest {
  id: string;
  reference_id: string;
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
  reference_id: string;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    offramp: OfframpRequest[];
    onramp: OnrampRequest[];
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [filteredOfframpRequests, setFilteredOfframpRequests] = useState<OfframpRequest[]>([]);
  const [filteredOnrampRequests, setFilteredOnrampRequests] = useState<OnrampRequest[]>([]);

  // Update filtered requests when main requests change
  useEffect(() => {
    setFilteredOfframpRequests(requests);
  }, [requests]);

  useEffect(() => {
    setFilteredOnrampRequests(onrampRequests);
  }, [onrampRequests]);

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

  // Search function
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    const query = searchQuery.trim().toUpperCase();

    // Search in both offramp and onramp requests
    const matchingOfframp = requests.filter(r => 
      r.reference_id?.toUpperCase().includes(query) ||
      r.momo_number?.includes(query) ||
      r.transaction_hash?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const matchingOnramp = onrampRequests.filter(r => 
      r.reference_id?.toUpperCase().includes(query) ||
      r.momo_number?.includes(query) ||
      r.recipient_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.transaction_hash?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setSearchResults({
      offramp: matchingOfframp,
      onramp: matchingOnramp
    });
    setIsSearching(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  const sectionTitles = {
    dashboard: { title: 'Vue d\'ensemble', subtitle: 'Aperçu des transactions et statistiques' },
    offramp: { title: 'Transactions Offramp', subtitle: 'Crypto → Mobile Money' },
    onramp: { title: 'Transactions Onramp', subtitle: 'Mobile Money → Crypto' },
    stats: { title: 'Statistiques', subtitle: 'Analyses et métriques détaillées' }
  };

  // Determine which requests to display (search results > filters > all)
  const displayedOfframpRequests = searchResults ? searchResults.offramp : filteredOfframpRequests;
  const displayedOnrampRequests = searchResults ? searchResults.onramp : filteredOnrampRequests;

  return (
    <div className="space-y-8">
      {/* Header avec bouton refresh */}
      <div className="flex flex-col gap-4 animate-slide-in-down">
        <div className="flex items-center justify-between">
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

        {/* Search Bar */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par référence (OFF-XXXXXX, ONR-XXXXXX), numéro, adresse..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={clearSearch}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button onClick={handleSearch} disabled={isSearching} className="gap-2">
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Rechercher
              </Button>
            </div>
            
            {searchResults && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <Badge variant="secondary">
                  {searchResults.offramp.length + searchResults.onramp.length} résultat(s)
                </Badge>
                <span className="text-muted-foreground">
                  {searchResults.offramp.length} offramp, {searchResults.onramp.length} onramp
                </span>
                <Button variant="ghost" size="sm" onClick={clearSearch} className="ml-auto text-xs">
                  Effacer la recherche
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Advanced Filters */}
        <AdminFilters
          offrampRequests={requests}
          onrampRequests={onrampRequests}
          filteredOfframpRequests={filteredOfframpRequests}
          filteredOnrampRequests={filteredOnrampRequests}
          onFilteredOfframp={setFilteredOfframpRequests}
          onFilteredOnramp={setFilteredOnrampRequests}
          activeTab={section === 'offramp' ? 'offramp' : section === 'onramp' ? 'onramp' : 'all'}
        />
      </div>

      {/* Statistiques générales - Section Dashboard */}
      {(section === 'dashboard' || section === 'stats') && (
      <div id="dashboard" className="scroll-mt-20">
        {stats && (
          <div className="space-y-6">
            {/* Volumes totaux */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Volume Total USD
                  </CardTitle>
                  <CardDescription>Total des transactions en USD</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl lg:text-4xl font-bold text-blue-600 dark:text-blue-400">
                    ${stats.total_volume_usd.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                    Volume Total XOF
                  </CardTitle>
                  <CardDescription>Total des transactions en XOF</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl lg:text-4xl font-bold text-green-600 dark:text-green-400">
                    {stats.total_volume_xof.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} XOF
                  </p>
                </CardContent>
              </Card>
            </div>

          {/* Statistiques Offramp */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                <ArrowRightLeft className="h-5 w-5" />
                Statistiques Offramp (Crypto → Mobile Money)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
                <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg hover:scale-105 transition-transform">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending_payment}</p>
                  <p className="text-xs text-muted-foreground mt-1">En attente</p>
                </div>
                
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg hover:scale-105 transition-transform">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.received}</p>
                  <p className="text-xs text-muted-foreground mt-1">Reçu</p>
                </div>

                <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg hover:scale-105 transition-transform">
                  <Settings className="h-5 w-5 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.processing}</p>
                  <p className="text-xs text-muted-foreground mt-1">En cours</p>
                </div>

                <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg hover:scale-105 transition-transform">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.paid}</p>
                  <p className="text-xs text-muted-foreground mt-1">Payé</p>
                </div>

                <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg hover:scale-105 transition-transform">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.failed}</p>
                  <p className="text-xs text-muted-foreground mt-1">Échoué</p>
                </div>

                <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg hover:scale-105 transition-transform">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.total_offramp || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques Onramp */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
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

      {/* Statistiques Blockchain par Réseau */}
      {blockchainStats && (
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              Statistiques par Réseau Blockchain
            </CardTitle>
            <CardDescription>Utilisation et volume des différents réseaux blockchain</CardDescription>
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
                <p className="text-xs text-muted-foreground mt-1">Volume total</p>
              </div>

              <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <svg className="h-5 w-5 text-purple-600 dark:text-purple-400 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{blockchainStats.unique_networks}</p>
                <p className="text-xs text-muted-foreground mt-1">Réseaux actifs</p>
              </div>
            </div>

            {/* Network Usage Details */}
            {blockchainStats.volume_by_network && blockchainStats.volume_by_network.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-4">📊 Utilisation par Réseau Blockchain</h4>
                <div className="space-y-3">
                  {blockchainStats.volume_by_network.map((item: any, index: number) => {
                    const isHighest = blockchainStats.highest_volume_network?.network === item.network;
                    const isLowest = blockchainStats.lowest_volume_network?.network === item.network;
                    
                    return (
                      <div 
                        key={item.network} 
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isHighest ? 'border-green-500 bg-green-50 dark:bg-green-950/50' : 
                          isLowest ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/50' : 
                          'border-muted bg-muted/30'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xl">{item.network}</span>
                            {isHighest && (
                              <Badge className="bg-green-600 hover:bg-green-700 text-white">
                                🏆 Plus utilisé
                              </Badge>
                            )}
                            {isLowest && (
                              <Badge className="bg-orange-600 hover:bg-orange-700 text-white">
                                Moins utilisé
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-3xl font-bold text-primary">{item.percentage.toFixed(1)}%</span>
                            <p className="text-xs text-muted-foreground">du total</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div className="p-2 bg-background/50 rounded">
                            <p className="text-xs text-muted-foreground">Transactions</p>
                            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{item.count}</p>
                          </div>
                          <div className="p-2 bg-background/50 rounded">
                            <p className="text-xs text-muted-foreground">Volume</p>
                            <p className="text-xl font-bold text-green-600 dark:text-green-400">
                              {item.volume.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="p-2 bg-background/50 rounded">
                            <p className="text-xs text-muted-foreground">Tokens</p>
                            <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{item.unique_tokens}</p>
                          </div>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div 
                            className={`h-3 rounded-full transition-all duration-500 ${
                              isHighest ? 'bg-gradient-to-r from-green-500 to-green-600' : 
                              isLowest ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 
                              'bg-gradient-to-r from-blue-500 to-blue-600'
                            }`}
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                            {item.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Highest and lowest volume networks - Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {blockchainStats.highest_volume_network && (
                <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg border-2 border-green-500">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🏆</span>
                    <p className="text-sm font-bold text-green-700 dark:text-green-300">
                      RÉSEAU LE PLUS UTILISÉ
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {blockchainStats.highest_volume_network.network}
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Volume:</span>
                      <span className="font-bold">
                        {blockchainStats.highest_volume_network.volume.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transactions:</span>
                      <span className="font-bold">{blockchainStats.highest_volume_network.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Part de marché:</span>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        {blockchainStats.highest_volume_network.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {blockchainStats.lowest_volume_network && (
                <div className="p-5 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg border-2 border-orange-500">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">📉</span>
                    <p className="text-sm font-bold text-orange-700 dark:text-orange-300">
                      RÉSEAU MOINS UTILISÉ
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                    {blockchainStats.lowest_volume_network.network}
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Volume:</span>
                      <span className="font-bold">
                        {blockchainStats.lowest_volume_network.volume.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transactions:</span>
                      <span className="font-bold">{blockchainStats.lowest_volume_network.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Part de marché:</span>
                      <span className="font-bold text-orange-600 dark:text-orange-400">
                        {blockchainStats.lowest_volume_network.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
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
                <p className="text-sm text-muted-foreground mb-2">Total Volume Blockchain</p>
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  {blockchainStats.total_volume.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Summary card for supported networks */}
            {blockchainStats.supported_networks && (
              <div className="mt-6 p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 rounded-lg border-2 border-indigo-300 dark:border-indigo-700">
                <div className="flex items-center gap-3">
                  <svg className="h-8 w-8 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  <div>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {blockchainStats.supported_networks} Réseaux Blockchain
                    </p>
                    <p className="text-sm text-muted-foreground">
                      BSC, Ethereum, Tron, Solana, Arbitrum, Optimism, Lisk, Base
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Statistiques par Pays */}
      {countryStats && countryStats.by_country && countryStats.by_country.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
              </svg>
              Statistiques par Pays
            </CardTitle>
            <CardDescription>Utilisation de CryptoMomo dans différents pays</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{countryStats.total_countries}</p>
                <p className="text-xs text-muted-foreground mt-1">Pays actifs</p>
              </div>

              {countryStats.most_active_country && (
                <>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <span className="text-3xl mx-auto mb-2 block">{countryStats.most_active_country.flag_emoji}</span>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{countryStats.most_active_country.total_transactions}</p>
                    <p className="text-xs text-muted-foreground mt-1">Plus actif: {countryStats.most_active_country.country_name}</p>
                  </div>

                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      ${countryStats.most_active_country.total_volume_usd.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Volume total USD</p>
                  </div>
                </>
              )}

              <div className="text-center p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                <Users className="h-5 w-5 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {countryStats.by_country.reduce((sum, c) => sum + c.total_transactions, 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Total transactions</p>
              </div>
            </div>

            {/* Country Usage Details */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-4">🌍 Utilisation par Pays</h4>
              <div className="space-y-3">
                {countryStats.by_country.map((country: any, index: number) => {
                  const isMostActive = countryStats.most_active_country?.country_id === country.country_id;
                  const isLeastActive = countryStats.least_active_country?.country_id === country.country_id;
                  
                  return (
                    <div 
                      key={country.country_id} 
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isMostActive ? 'border-green-500 bg-green-50 dark:bg-green-950/50' : 
                        isLeastActive ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/50' : 
                        'border-muted bg-muted/30'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{country.flag_emoji}</span>
                          <div>
                            <span className="font-bold text-xl">{country.country_name}</span>
                            <span className="ml-2 text-sm text-muted-foreground">({country.country_code})</span>
                          </div>
                          {isMostActive && (
                            <Badge className="bg-green-500 hover:bg-green-600">🏆 Plus actif</Badge>
                          )}
                          {isLeastActive && countryStats.by_country.length > 1 && (
                            <Badge variant="outline" className="border-orange-500 text-orange-600">📉 Moins actif</Badge>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-sm">
                          {country.percentage.toFixed(1)}% du total
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-3">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Total Transactions</p>
                          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{country.total_transactions}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Offramp</p>
                          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{country.offramp_count}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Onramp</p>
                          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{country.onramp_count}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Volume USD</p>
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">
                            ${country.total_volume_usd.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Volume XOF</p>
                          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            {country.total_volume_xof.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Avg/Transaction</p>
                          <p className="text-lg font-bold text-cyan-600 dark:text-cyan-400">
                            ${country.total_transactions > 0 ? (country.total_volume_usd / country.total_transactions).toFixed(0) : 0}
                          </p>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div 
                          className={`h-3 rounded-full transition-all duration-500 ${
                            isMostActive ? 'bg-gradient-to-r from-green-500 to-green-600' : 
                            isLeastActive ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 
                            'bg-gradient-to-r from-blue-500 to-blue-600'
                          }`}
                          style={{ width: `${country.percentage}%` }}
                        ></div>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                          {country.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Country comparison - Most vs Least Active */}
            {countryStats.most_active_country && countryStats.least_active_country && countryStats.by_country.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg border-2 border-green-500">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-3xl">{countryStats.most_active_country.flag_emoji}</span>
                    <div>
                      <p className="text-sm font-bold text-green-700 dark:text-green-300">PAYS LE PLUS ACTIF</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {countryStats.most_active_country.country_name}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transactions:</span>
                      <span className="font-bold">{countryStats.most_active_country.total_transactions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Volume USD:</span>
                      <span className="font-bold">
                        ${countryStats.most_active_country.total_volume_usd.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Part de marché:</span>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        {countryStats.most_active_country.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-5 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg border-2 border-orange-500">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-3xl">{countryStats.least_active_country.flag_emoji}</span>
                    <div>
                      <p className="text-sm font-bold text-orange-700 dark:text-orange-300">PAYS MOINS ACTIF</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {countryStats.least_active_country.country_name}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transactions:</span>
                      <span className="font-bold">{countryStats.least_active_country.total_transactions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Volume USD:</span>
                      <span className="font-bold">
                        ${countryStats.least_active_country.total_volume_usd.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Part de marché:</span>
                      <span className="font-bold text-orange-600 dark:text-orange-400">
                        {countryStats.least_active_country.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      </div>
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
                <Badge variant="secondary" className="ml-2">{displayedOfframpRequests.length}</Badge>
                {searchResults && displayedOfframpRequests.length !== requests.length && (
                  <span className="text-xs text-muted-foreground font-normal">/ {requests.length} total</span>
                )}
              </CardTitle>
              <CardDescription>
                Liste des demandes de conversion crypto vers Mobile Money
              </CardDescription>
            </CardHeader>
            <CardContent>
              {displayedOfframpRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Aucune demande offramp trouvée</p>
                </div>
              ) : (
                <>
                  {/* Vue Desktop - Tableau */}
                  <div className="hidden lg:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="font-semibold">Transaction</TableHead>
                          <TableHead className="font-semibold">Destinataire</TableHead>
                          <TableHead className="font-semibold text-right">Montant</TableHead>
                          <TableHead className="font-semibold text-center">Statut</TableHead>
                          <TableHead className="font-semibold text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayedOfframpRequests.map((request) => (
                          <TableRow key={request.id} className="hover:bg-muted/20 transition-colors">
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge variant="outline" className="font-mono text-xs w-fit">
                                  {request.reference_id}
                                </Badge>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{new Date(request.created_at).toLocaleDateString('fr-FR')}</span>
                                  <span>•</span>
                                  <span>{new Date(request.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <Badge variant="secondary" className="text-xs w-fit mt-1">
                                  {request.token}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <span className="font-medium">{request.momo_number}</span>
                                {request.momo_provider && (
                                  <Badge variant="outline" className="text-xs w-fit bg-primary/5">
                                    {request.momo_provider}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col items-end gap-1">
                                <span className="font-bold text-lg">{Math.round(request.xof_amount).toLocaleString()}</span>
                                <span className="text-xs text-muted-foreground">XOF</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge 
                                variant={statusColors[request.status as keyof typeof statusColors]}
                                className="whitespace-nowrap"
                              >
                                {statusLabels[request.status as keyof typeof statusLabels]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => openUpdateDialog(request)}
                                    className="hover:bg-primary hover:text-primary-foreground transition-colors"
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
                                      <div className="bg-muted/50 p-3 rounded-lg mb-4">
                                        <p className="text-xs font-semibold mb-2">📋 Flux Offramp:</p>
                                        <div className="space-y-1 text-xs text-muted-foreground">
                                          <div>1️⃣ En attente paiement crypto</div>
                                          <div>2️⃣ Crypto reçue</div>
                                          <div>3️⃣ En cours de traitement</div>
                                          <div>4️⃣ Mobile Money envoyé ✓</div>
                                        </div>
                                      </div>

                                      <div className="space-y-2">
                                        <Label>Statut</Label>
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
                                                {status.label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div className="space-y-2">
                                        <Label>Hash de transaction</Label>
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

                  {/* Vue Mobile - Cartes */}
                  <div className="lg:hidden space-y-3">
                    {displayedOfframpRequests.map((request) => (
                      <div 
                        key={request.id} 
                        className="p-4 rounded-xl border border-border/50 bg-card hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <Badge variant="outline" className="font-mono text-xs mb-1">
                              {request.reference_id}
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              {new Date(request.created_at).toLocaleDateString('fr-FR')} à {new Date(request.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <Badge 
                            variant={statusColors[request.status as keyof typeof statusColors]}
                            className="text-xs"
                          >
                            {statusLabels[request.status as keyof typeof statusLabels]}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Token</p>
                            <Badge variant="secondary" className="text-xs">{request.token}</Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-1">Montant</p>
                            <p className="font-bold text-lg">{Math.round(request.xof_amount).toLocaleString()} <span className="text-xs font-normal text-muted-foreground">XOF</span></p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-border/30">
                          <div>
                            <p className="font-medium text-sm">{request.momo_number}</p>
                            {request.momo_provider && (
                              <Badge variant="outline" className="text-xs mt-1">{request.momo_provider}</Badge>
                            )}
                          </div>
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
                                <DialogTitle>Modifier la demande</DialogTitle>
                              </DialogHeader>
                              {selectedRequest?.id === request.id && (
                                <div className="space-y-4">
                                  <Select 
                                    value={updateData.status} 
                                    onValueChange={(value) => setUpdateData({ ...updateData, status: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Statut" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {offrampStatuses.map((status) => (
                                        <SelectItem key={status.value} value={status.value}>
                                          {status.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    placeholder="Hash de transaction"
                                    value={updateData.transaction_hash}
                                    onChange={(e) => setUpdateData({ ...updateData, transaction_hash: e.target.value })}
                                  />
                                  <Textarea
                                    placeholder="Notes..."
                                    value={updateData.notes}
                                    onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })}
                                  />
                                  <Button onClick={updateRequestStatus} disabled={loading} className="w-full">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Mettre à jour'}
                                  </Button>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
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
                <Badge variant="secondary" className="ml-2">{displayedOnrampRequests.length}</Badge>
                {searchResults && displayedOnrampRequests.length !== onrampRequests.length && (
                  <span className="text-xs text-muted-foreground font-normal">/ {onrampRequests.length} total</span>
                )}
              </CardTitle>
              <CardDescription>
                Liste des demandes de conversion Mobile Money vers crypto
              </CardDescription>
            </CardHeader>
            <CardContent>
              {displayedOnrampRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ArrowDownUp className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Aucune demande onramp trouvée</p>
                </div>
              ) : (
                <>
                  {/* Vue Desktop - Tableau */}
                  <div className="hidden lg:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="font-semibold">Transaction</TableHead>
                          <TableHead className="font-semibold">Source</TableHead>
                          <TableHead className="font-semibold">Destination</TableHead>
                          <TableHead className="font-semibold text-right">Montant</TableHead>
                          <TableHead className="font-semibold text-center">Statut</TableHead>
                          <TableHead className="font-semibold text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayedOnrampRequests.map((request) => (
                          <TableRow key={request.id} className="hover:bg-muted/20 transition-colors">
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge variant="outline" className="font-mono text-xs w-fit">
                                  {request.reference_id}
                                </Badge>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{new Date(request.created_at).toLocaleDateString('fr-FR')}</span>
                                  <span>•</span>
                                  <span>{new Date(request.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <span className="font-medium">{request.momo_number}</span>
                                {request.momo_provider && (
                                  <Badge variant="outline" className="text-xs w-fit bg-primary/5">
                                    {request.momo_provider}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge variant="secondary" className="text-xs w-fit">{request.token}</Badge>
                                <span className="text-xs font-mono text-muted-foreground">
                                  {request.recipient_address.slice(0, 8)}...{request.recipient_address.slice(-6)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col items-end gap-1">
                                <span className="font-bold text-lg">{Math.round(request.xof_amount).toLocaleString()}</span>
                                <span className="text-xs text-muted-foreground">XOF → {request.crypto_amount?.toLocaleString(undefined, { maximumFractionDigits: 6 })} {request.token}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge 
                                variant={statusColors[request.status as keyof typeof statusColors] || 'secondary'}
                                className="whitespace-nowrap"
                              >
                                {statusLabels[request.status as keyof typeof statusLabels] || request.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => openOnrampUpdateDialog(request)}
                                    className="hover:bg-primary hover:text-primary-foreground transition-colors"
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
                                      <div className="bg-muted/50 p-3 rounded-lg mb-4">
                                        <p className="text-xs font-semibold mb-2">📋 Flux Onramp:</p>
                                        <div className="space-y-1 text-xs text-muted-foreground">
                                          <div>1️⃣ En attente paiement Mobile Money</div>
                                          <div>2️⃣ Mobile Money reçu</div>
                                          <div>3️⃣ En cours de traitement</div>
                                          <div>4️⃣ Crypto envoyée ✓</div>
                                        </div>
                                      </div>

                                      <div className="space-y-2">
                                        <Label>Statut</Label>
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
                                                {status.label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div className="space-y-2">
                                        <Label>Hash de transaction</Label>
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

                  {/* Vue Mobile - Cartes */}
                  <div className="lg:hidden space-y-3">
                    {displayedOnrampRequests.map((request) => (
                      <div 
                        key={request.id} 
                        className="p-4 rounded-xl border border-border/50 bg-card hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <Badge variant="outline" className="font-mono text-xs mb-1">
                              {request.reference_id}
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              {new Date(request.created_at).toLocaleDateString('fr-FR')} à {new Date(request.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <Badge 
                            variant={statusColors[request.status as keyof typeof statusColors] || 'secondary'}
                            className="text-xs"
                          >
                            {statusLabels[request.status as keyof typeof statusLabels] || request.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Vers</p>
                            <Badge variant="secondary" className="text-xs">{request.token}</Badge>
                            <p className="text-xs font-mono text-muted-foreground mt-1">
                              {request.recipient_address.slice(0, 6)}...{request.recipient_address.slice(-4)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-1">Montant</p>
                            <p className="font-bold text-lg">{Math.round(request.xof_amount).toLocaleString()} <span className="text-xs font-normal text-muted-foreground">XOF</span></p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-border/30">
                          <div>
                            <p className="font-medium text-sm">{request.momo_number}</p>
                            {request.momo_provider && (
                              <Badge variant="outline" className="text-xs mt-1">{request.momo_provider}</Badge>
                            )}
                          </div>
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
                                <DialogTitle>Modifier la demande</DialogTitle>
                              </DialogHeader>
                              {selectedOnrampRequest?.id === request.id && (
                                <div className="space-y-4">
                                  <Select 
                                    value={onrampUpdateData.status} 
                                    onValueChange={(value) => setOnrampUpdateData({ ...onrampUpdateData, status: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Statut" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {onrampStatuses.map((status) => (
                                        <SelectItem key={status.value} value={status.value}>
                                          {status.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    placeholder="Hash de transaction"
                                    value={onrampUpdateData.transaction_hash}
                                    onChange={(e) => setOnrampUpdateData({ ...onrampUpdateData, transaction_hash: e.target.value })}
                                  />
                                  <Textarea
                                    placeholder="Notes..."
                                    value={onrampUpdateData.notes}
                                    onChange={(e) => setOnrampUpdateData({ ...onrampUpdateData, notes: e.target.value })}
                                  />
                                  <Button onClick={updateOnrampRequestStatus} disabled={loading} className="w-full">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Mettre à jour'}
                                  </Button>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
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