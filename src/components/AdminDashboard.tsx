import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  ArrowDownUp,
  ArrowRightLeft,
  BarChart3,
  CheckCircle,
  Clock,
  Coins,
  Globe,
  Hash,
  Loader2,
  Radio,
  RefreshCw,
  Search,
  Settings,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Wifi,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import AdminFilters from './AdminFilters';
import BlockchainTokenBadge from './BlockchainTokenBadge';
import BlockchainVisibilityManager from './BlockchainVisibilityManager';
import CountryVisibilityManager from './CountryVisibilityManager';
import OperatorVisibilityManager from './OperatorVisibilityManager';
import TokenVisibilityManager from './TokenVisibilityManager';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type DashboardSection = 'dashboard' | 'offramp' | 'onramp' | 'stats' | 'visibility' | 'countries' | 'operators' | 'tokens';

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

interface NetworkBreakdown {
  network: string;
  count: number;
  volume_usd: number;
  offramp_count: number;
  onramp_count: number;
  percentage: number;
}

interface CountryStatItem {
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
  networks_breakdown: NetworkBreakdown[];
  unique_networks: number;
  tokens_used: string[];
  preferred_network: string | null;
}

interface CountryStats {
  by_country: CountryStatItem[];
  total_countries: number;
  most_active_country: CountryStatItem | null;
  least_active_country: CountryStatItem | null;
}

const isFallbackFlag = (flag: string | null | undefined) => {
  if (!flag) return true;
  const trimmed = flag.trim();
  return trimmed === '' || trimmed === '🏴';
};

const FlagOrFallback = ({ flag, code }: { flag: string | null | undefined; code: string }) => {
  if (isFallbackFlag(flag)) {
    return (
      <span
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground ring-1 ring-border"
        aria-label={`Pays ${code}`}
        title={code}
      >
        {code?.slice(0, 2)?.toUpperCase() || '--'}
      </span>
    );
  }

  return (
    <span className="text-2xl leading-none" aria-hidden>
      {flag}
    </span>
  );
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ section = 'dashboard' }) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<OfframpRequest[]>([]);
  const [onrampRequests, setOnrampRequests] = useState<OnrampRequest[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [blockchainStats, setBlockchainStats] = useState<BlockchainStats | null>(null);
  const [countryStats, setCountryStats] = useState<CountryStats | null>(null);
  const [liveBlockchainEvents, setLiveBlockchainEvents] = useState<any[]>([]);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
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

  const PAGE_SIZE = 20;
  const [offrampPage, setOfframpPage] = useState(1);
  const [onrampPage, setOnrampPage] = useState(1);

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
    { value: 'pending_payment', label: t('admin.dashboard.offrampStatusPending'), color: 'secondary', description: t('admin.dashboard.offrampStatusPendingDesc') },
    { value: 'received', label: t('admin.dashboard.offrampStatusReceived'), color: 'default', description: t('admin.dashboard.offrampStatusReceivedDesc') },
    { value: 'processing', label: t('admin.dashboard.offrampStatusProcessing'), color: 'outline', description: t('admin.dashboard.offrampStatusProcessingDesc') },
    { value: 'paid', label: t('admin.dashboard.offrampStatusPaid'), color: 'default', description: t('admin.dashboard.offrampStatusPaidDesc') },
    { value: 'failed', label: t('admin.dashboard.offrampStatusFailed'), color: 'destructive', description: t('admin.dashboard.offrampStatusFailedDesc') }
  ];

  const onrampStatuses = [
    { value: 'pending_momo_payment', label: t('admin.dashboard.onrampStatusPending'), color: 'secondary', description: t('admin.dashboard.onrampStatusPendingDesc') },
    { value: 'momo_payment_received', label: t('admin.dashboard.onrampStatusReceived'), color: 'default', description: t('admin.dashboard.onrampStatusReceivedDesc') },
    { value: 'processing', label: t('admin.dashboard.onrampStatusProcessing'), color: 'outline', description: t('admin.dashboard.onrampStatusProcessingDesc') },
    { value: 'completed', label: t('admin.dashboard.onrampStatusCompleted'), color: 'default', description: t('admin.dashboard.onrampStatusCompletedDesc') },
    { value: 'failed', label: t('admin.dashboard.onrampStatusFailed'), color: 'destructive', description: t('admin.dashboard.onrampStatusFailedDesc') }
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
    'pending_payment': t('admin.dashboard.offrampStatusPending'),
    'pending_momo_payment': t('admin.dashboard.onrampStatusPending'),
    'momo_payment_received': t('admin.dashboard.onrampStatusReceived'),
    'received': t('admin.dashboard.offrampStatusReceived'),
    'processing': t('admin.dashboard.offrampStatusProcessing'),
    'paid': t('admin.dashboard.offrampStatusPaid'),
    'completed': t('admin.dashboard.onrampStatusCompleted'),
    'failed': t('admin.dashboard.offrampStatusFailed')
  };

  useEffect(() => {
    fetchRequests();
    fetchOnrampRequests();
  }, []);

  // Real-time subscriptions for live updates
  useEffect(() => {
    console.log('Setting up realtime subscriptions for admin dashboard...');
    
    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'offramp_requests' },
        (payload) => {
          console.log('Realtime offramp update:', payload.eventType, payload);
          if (payload.eventType === 'INSERT') {
            setRequests(prev => [payload.new as OfframpRequest, ...prev]);
            fetchRequests();
          } else if (payload.eventType === 'UPDATE') {
            setRequests(prev => prev.map(r => 
              r.id === (payload.new as OfframpRequest).id ? { ...r, ...payload.new as OfframpRequest } : r
            ));
          } else if (payload.eventType === 'DELETE') {
            setRequests(prev => prev.filter(r => r.id !== (payload.old as any).id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'onramp_requests' },
        (payload) => {
          console.log('Realtime onramp update:', payload.eventType, payload);
          if (payload.eventType === 'INSERT') {
            setOnrampRequests(prev => [payload.new as OnrampRequest, ...prev]);
            fetchOnrampRequests();
          } else if (payload.eventType === 'UPDATE') {
            setOnrampRequests(prev => prev.map(r => 
              r.id === (payload.new as OnrampRequest).id ? { ...r, ...payload.new as OnrampRequest } : r
            ));
          } else if (payload.eventType === 'DELETE') {
            setOnrampRequests(prev => prev.filter(r => r.id !== (payload.old as any).id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blockchain_events' },
        (payload) => {
          console.log('Realtime blockchain event:', payload.eventType, payload);
          if (payload.eventType === 'INSERT') {
            const newEvent = payload.new as any;
            setLiveBlockchainEvents(prev => [newEvent, ...prev].slice(0, 50));
            toast({
              title: "⛓️ Transaction blockchain détectée",
              description: `${newEvent.amount} ${newEvent.token_symbol} reçu sur ${newEvent.network?.toUpperCase()} via ${newEvent.webhook_source}`,
            });
          } else if (payload.eventType === 'UPDATE') {
            setLiveBlockchainEvents(prev => prev.map(e => 
              e.id === (payload.new as any).id ? { ...e, ...payload.new } : e
            ));
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        setRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('Cleaning up realtime subscriptions...');
      supabase.removeChannel(channel);
    };
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
        title: t('admin.dashboard.error'),
        description: `${t('admin.dashboard.loadError')}: ${error instanceof Error ? error.message : 'Unknown'}`,
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

  const sectionTitles: Record<DashboardSection, { title: string; subtitle: string }> = {
    dashboard: { title: t('admin.dashboard.overview'), subtitle: t('admin.dashboard.overviewSub') },
    offramp: { title: t('admin.dashboard.offrampTitle'), subtitle: t('admin.dashboard.offrampSub') },
    onramp: { title: t('admin.dashboard.onrampTitle'), subtitle: t('admin.dashboard.onrampSub') },
    stats: { title: t('admin.dashboard.statsTitle'), subtitle: t('admin.dashboard.statsSub') },
    visibility: { title: t('admin.dashboard.visibilityTitle'), subtitle: t('admin.dashboard.visibilitySub') },
    countries: { title: t('admin.dashboard.countriesTitle'), subtitle: t('admin.dashboard.countriesSub') },
    operators: { title: t('admin.dashboard.operatorsTitle'), subtitle: t('admin.dashboard.operatorsSub') },
    tokens: { title: t('admin.dashboard.tokensTitle'), subtitle: t('admin.dashboard.tokensSub') },
  };

  // Determine which requests to display (search results > filters > all)
  const displayedOfframpRequests = searchResults ? searchResults.offramp : filteredOfframpRequests;
  const displayedOnrampRequests = searchResults ? searchResults.onramp : filteredOnrampRequests;

  // Reset pagination when data source changes (search / filters)
  useEffect(() => {
    setOfframpPage(1);
  }, [searchResults, filteredOfframpRequests.length]);

  useEffect(() => {
    setOnrampPage(1);
  }, [searchResults, filteredOnrampRequests.length]);

  const clampPage = (page: number, totalPages: number) => {
    if (totalPages <= 1) return 1;
    return Math.min(Math.max(1, page), totalPages);
  };

  const getPageItems = (currentPage: number, totalPages: number): Array<number | 'ellipsis'> => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const items: Array<number | 'ellipsis'> = [1];
    const left = Math.max(2, currentPage - 1);
    const right = Math.min(totalPages - 1, currentPage + 1);

    if (left > 2) items.push('ellipsis');
    for (let p = left; p <= right; p += 1) items.push(p);
    if (right < totalPages - 1) items.push('ellipsis');
    items.push(totalPages);
    return items;
  };

  const renderPagination = (
    currentPage: number,
    setPage: (p: number) => void,
    totalItems: number
  ) => {
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
    const safePage = clampPage(currentPage, totalPages);
    if (totalPages <= 1) return null;

    const items = getPageItems(safePage, totalPages);

    return (
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Page <span className="font-medium text-foreground">{safePage}</span> sur{' '}
          <span className="font-medium text-foreground">{totalPages}</span> • {totalItems} élément(s)
        </p>

        <Pagination className="justify-end sm:justify-center">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage(clampPage(safePage - 1, totalPages));
                }}
                aria-disabled={safePage === 1}
                className={safePage === 1 ? 'pointer-events-none opacity-50' : undefined}
              />
            </PaginationItem>

            {items.map((it, idx) => (
              <PaginationItem key={`${it}-${idx}`}>
                {it === 'ellipsis' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href="#"
                    isActive={it === safePage}
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(it);
                    }}
                  >
                    {it}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage(clampPage(safePage + 1, totalPages));
                }}
                aria-disabled={safePage === totalPages}
                className={safePage === totalPages ? 'pointer-events-none opacity-50' : undefined}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  const offrampTotalPages = Math.max(1, Math.ceil(displayedOfframpRequests.length / PAGE_SIZE));
  const onrampTotalPages = Math.max(1, Math.ceil(displayedOnrampRequests.length / PAGE_SIZE));

  const pagedOfframpRequests = displayedOfframpRequests.slice(
    (clampPage(offrampPage, offrampTotalPages) - 1) * PAGE_SIZE,
    clampPage(offrampPage, offrampTotalPages) * PAGE_SIZE
  );

  const pagedOnrampRequests = displayedOnrampRequests.slice(
    (clampPage(onrampPage, onrampTotalPages) - 1) * PAGE_SIZE,
    clampPage(onrampPage, onrampTotalPages) * PAGE_SIZE
  );

  return (
    <div className="space-y-8">
      {/* Header avec bouton refresh */}
      <div className="flex flex-col gap-4 animate-slide-in-down">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight">
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
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>
        </div>

        {/* Search Bar */}
        <Card className="shadow-sm">
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

      {/* Live Blockchain Events Feed */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                <Radio className="h-5 w-5 text-primary" />
                Écoute Blockchain en Temps Réel
                {realtimeConnected && (
                  <Badge variant="outline" className="text-xs gap-1 border-green-500/50">
                    <Wifi className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">LIVE</span>
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Monitoring des 9 réseaux : Base, BSC, ETH, Arbitrum, Optimism, Polygon, Solana, Avalanche, Lisk
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                toast({ title: "🔄 Scan en cours...", description: "Lancement du scan blockchain sur tous les réseaux" });
                try {
                  const { data, error } = await supabase.functions.invoke('blockchain-monitor');
                  if (error) throw error;
                  toast({
                    title: "✅ Scan terminé",
                    description: `${data?.total_new_events || 0} nouveaux événements détectés en ${data?.duration_ms || 0}ms`,
                  });
                  // Refresh stats
                  fetchRequests();
                } catch (e) {
                  toast({ title: "Erreur", description: "Impossible de lancer le scan", variant: "destructive" });
                }
              }}
              className="gap-2"
            >
              <Zap className="h-4 w-4" />
              Scanner maintenant
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Scan State Summary */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg border bg-card p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Wifi className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xl font-bold">{liveBlockchainEvents.length}</p>
              <p className="text-xs text-muted-foreground">Événements live</p>
            </div>
            <div className="rounded-lg border bg-card p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xl font-bold">
                {liveBlockchainEvents.filter(e => e.matched_request_type).length}
              </p>
              <p className="text-xs text-muted-foreground">Auto-matchés</p>
            </div>
            <div className="rounded-lg border bg-card p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Radio className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xl font-bold">9</p>
              <p className="text-xs text-muted-foreground">Réseaux surveillés</p>
            </div>
          </div>

          {/* Live Events Table */}
          {liveBlockchainEvents.length > 0 ? (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Réseau</TableHead>
                    <TableHead>Token</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>De</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Match</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {liveBlockchainEvents.slice(0, 20).map((event: any, index: number) => (
                    <TableRow key={event.id || index} className="hover:bg-muted/20 animate-slide-in-up">
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-mono">
                          {event.network?.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="text-xs">{event.token_symbol}</Badge>
                      </TableCell>
                      <TableCell className="font-mono font-bold">
                        {typeof event.amount === 'number' ? event.amount.toLocaleString('fr-FR', { maximumFractionDigits: 4 }) : event.amount}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] truncate">
                        {event.from_address ? `${event.from_address.slice(0, 6)}...${event.from_address.slice(-4)}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={event.webhook_source === 'polling' ? 'secondary' : 'default'} className="text-xs">
                          {event.webhook_source || 'polling'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {event.matched_request_type ? (
                          <Badge className="text-xs bg-green-500/20 text-green-500 border-green-500/30">
                            ✓ {event.matched_request_type}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {event.created_at ? new Date(event.created_at).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Radio className="h-12 w-12 mx-auto mb-3 opacity-50 animate-pulse" />
              <p className="font-medium">En attente de transactions blockchain...</p>
              <p className="text-sm mt-1">Les transactions seront détectées automatiquement via le polling et les webhooks</p>
            </div>
          )}
        </CardContent>
      </Card>

      {blockchainStats && (
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
              <BarChart3 className="h-5 w-5" />
              Statistiques par Réseau Blockchain
            </CardTitle>
            <CardDescription>Utilisation et volume des différents réseaux blockchain</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-5">
              <div className="rounded-lg border bg-card p-3 text-center">
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Hash className="h-4 w-4" />
                </div>
                <p className="text-2xl font-bold">{blockchainStats.total_events}</p>
                <p className="mt-1 text-xs text-muted-foreground">Total événements</p>
              </div>

              <div className="rounded-lg border bg-card p-3 text-center">
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <p className="text-2xl font-bold">{blockchainStats.processed_events}</p>
                <p className="mt-1 text-xs text-muted-foreground">Traités</p>
              </div>

              <div className="rounded-lg border bg-card p-3 text-center">
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Clock className="h-4 w-4" />
                </div>
                <p className="text-2xl font-bold">{blockchainStats.pending_events}</p>
                <p className="mt-1 text-xs text-muted-foreground">En attente</p>
              </div>

              <div className="rounded-lg border bg-card p-3 text-center">
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <p className="text-2xl font-bold">
                  {blockchainStats.total_volume.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Volume total</p>
              </div>

              <div className="rounded-lg border bg-card p-3 text-center">
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <p className="text-2xl font-bold">{blockchainStats.unique_networks}</p>
                <p className="mt-1 text-xs text-muted-foreground">Réseaux actifs</p>
              </div>
            </div>

            {/* Network Usage Details */}
            {blockchainStats.volume_by_network && blockchainStats.volume_by_network.length > 0 && (
              <div className="mb-6">
                <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  Utilisation par réseau
                </h4>
                <div className="space-y-3">
                  {blockchainStats.volume_by_network.map((item: any, index: number) => {
                    const isHighest = blockchainStats.highest_volume_network?.network === item.network;
                    const isLowest = blockchainStats.lowest_volume_network?.network === item.network;
                    
                    return (
                      <div 
                        key={item.network} 
                        className={
                          "rounded-lg border bg-card p-4 transition-all " +
                          (isHighest
                            ? "ring-1 ring-primary/25"
                            : isLowest
                              ? "ring-1 ring-destructive/20"
                              : "")
                        }
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xl">{item.network}</span>
                            {isHighest && (
                              <Badge>
                                <span className="inline-flex items-center gap-1">
                                  <Trophy className="h-3.5 w-3.5" />
                                  Plus utilisé
                                </span>
                              </Badge>
                            )}
                            {isLowest && (
                              <Badge variant="destructive">
                                <span className="inline-flex items-center gap-1">
                                  <TrendingDown className="h-3.5 w-3.5" />
                                  Moins utilisé
                                </span>
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-3xl font-bold">{item.percentage.toFixed(1)}%</span>
                            <p className="text-xs text-muted-foreground">du total</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div className="rounded-md bg-muted/40 p-2">
                            <p className="text-xs text-muted-foreground">Transactions</p>
                            <p className="text-xl font-bold">{item.count}</p>
                          </div>
                          <div className="rounded-md bg-muted/40 p-2">
                            <p className="text-xs text-muted-foreground">Volume</p>
                            <p className="text-xl font-bold">
                              {item.volume.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="rounded-md bg-muted/40 p-2">
                            <p className="text-xs text-muted-foreground">Tokens</p>
                            <p className="text-xl font-bold">{item.unique_tokens}</p>
                          </div>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
                          <div 
                            className={
                              "h-full rounded-full transition-all duration-500 " +
                              (isLowest ? "bg-destructive" : "bg-primary")
                            }
                            style={{ width: `${item.percentage}%` }}
                          ></div>
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
                <div className="rounded-lg border bg-card p-5 ring-1 ring-primary/25">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-border">
                      <Trophy className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-semibold">Réseau le plus utilisé</p>
                  </div>
                  <p className="mb-2 text-3xl font-bold">
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
                      <span className="font-bold">
                        {blockchainStats.highest_volume_network.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {blockchainStats.lowest_volume_network && (
                <div className="rounded-lg border bg-card p-5 ring-1 ring-destructive/20">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-1 ring-border">
                      <TrendingDown className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-semibold">Réseau moins utilisé</p>
                  </div>
                  <p className="mb-2 text-3xl font-bold">
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
                      <span className="font-bold text-destructive">
                        {blockchainStats.lowest_volume_network.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Volume comparison */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground mb-2">Volume Offramp (XOF)</p>
                <p className="text-2xl font-bold">
                  {stats?.total_volume_xof?.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) || '0'} XOF
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground mb-2">Volume Offramp (USD)</p>
                <p className="text-2xl font-bold">
                  ${stats?.total_volume_usd?.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) || '0'}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground mb-2">Total Volume Blockchain</p>
                <p className="text-2xl font-bold">
                  {blockchainStats.total_volume.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Summary card for supported networks */}
            {blockchainStats.supported_networks && (
              <div className="mt-6 rounded-lg border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Coins className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {blockchainStats.supported_networks} Réseaux Blockchain
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Base, BSC, Ethereum, Arbitrum, Optimism, Polygon, Solana, Avalanche, Lisk
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Statistiques détaillées par Pays */}
      {countryStats && countryStats.by_country && countryStats.by_country.length > 0 && (
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
              <Globe className="h-5 w-5" />
              Statistiques détaillées par Pays
            </CardTitle>
            <CardDescription>Utilisation par pays avec répartition blockchain, offramp et onramp</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Summary tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="rounded-lg border bg-card p-3 text-center">
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Globe className="h-4 w-4" />
                </div>
                <p className="text-2xl font-bold">{countryStats.total_countries}</p>
                <p className="mt-1 text-xs text-muted-foreground">Pays actifs</p>
              </div>

              {countryStats.most_active_country && (
                <>
                  <div className="rounded-lg border bg-card p-3 text-center">
                    <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center">
                      <FlagOrFallback flag={countryStats.most_active_country.flag_emoji} code={countryStats.most_active_country.country_code} />
                    </div>
                    <p className="text-2xl font-bold">{countryStats.most_active_country.total_transactions}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Plus actif: {countryStats.most_active_country.country_name}</p>
                  </div>

                  <div className="rounded-lg border bg-card p-3 text-center">
                    <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <p className="text-2xl font-bold">
                      ${countryStats.most_active_country.total_volume_usd.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Volume total USD</p>
                  </div>
                </>
              )}

              <div className="rounded-lg border bg-card p-3 text-center">
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Users className="h-4 w-4" />
                </div>
                <p className="text-2xl font-bold">{countryStats.by_country.reduce((sum, c) => sum + c.total_transactions, 0)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Total transactions</p>
              </div>
            </div>

            {/* Detailed Country Cards */}
            <div className="mb-6">
              <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Détails par pays
              </h4>
              <div className="space-y-4">
                {countryStats.by_country.map((country) => {
                  const isMostActive = countryStats.most_active_country?.country_id === country.country_id;
                  const isLeastActive = countryStats.least_active_country?.country_id === country.country_id && countryStats.by_country.length > 1;
                  
                  return (
                    <div 
                      key={country.country_id} 
                      className={
                        "rounded-lg border bg-card p-5 transition-all " +
                        (isMostActive
                          ? "ring-1 ring-primary/25"
                          : isLeastActive
                            ? "ring-1 ring-destructive/20"
                            : "")
                      }
                    >
                      {/* Country header */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <FlagOrFallback flag={country.flag_emoji} code={country.country_code} />
                          <div>
                            <span className="font-bold text-xl">{country.country_name}</span>
                            <span className="ml-2 text-sm text-muted-foreground">({country.country_code})</span>
                          </div>
                          {isMostActive && (
                            <Badge>
                              <span className="inline-flex items-center gap-1">
                                <Trophy className="h-3.5 w-3.5" />
                                Plus actif
                              </span>
                            </Badge>
                          )}
                          {isLeastActive && (
                            <Badge variant="destructive">
                              <span className="inline-flex items-center gap-1">
                                <TrendingDown className="h-3.5 w-3.5" />
                                Moins actif
                              </span>
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="text-sm">
                            {country.percentage.toFixed(1)}% du total
                          </Badge>
                          {country.preferred_network && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Réseau préféré: <span className="font-medium">{country.preferred_network}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Transaction stats grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-4">
                        <div className="text-center rounded-lg bg-muted/30 p-2">
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="text-lg font-bold">{country.total_transactions}</p>
                        </div>
                        <div className="text-center rounded-lg bg-muted/30 p-2">
                          <p className="text-xs text-muted-foreground">Offramp</p>
                          <p className="text-lg font-bold">{country.offramp_count}</p>
                        </div>
                        <div className="text-center rounded-lg bg-muted/30 p-2">
                          <p className="text-xs text-muted-foreground">Onramp</p>
                          <p className="text-lg font-bold">{country.onramp_count}</p>
                        </div>
                        <div className="text-center rounded-lg bg-muted/30 p-2">
                          <p className="text-xs text-muted-foreground">Volume USD</p>
                          <p className="text-lg font-bold">
                            ${country.total_volume_usd.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                          </p>
                        </div>
                        <div className="text-center rounded-lg bg-muted/30 p-2">
                          <p className="text-xs text-muted-foreground">Volume XOF</p>
                          <p className="text-lg font-bold">
                            {country.total_volume_xof.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                          </p>
                        </div>
                        <div className="text-center rounded-lg bg-muted/30 p-2">
                          <p className="text-xs text-muted-foreground">Réseaux</p>
                          <p className="text-lg font-bold">{country.unique_networks}</p>
                        </div>
                        <div className="text-center rounded-lg bg-muted/30 p-2">
                          <p className="text-xs text-muted-foreground">Moy./TX</p>
                          <p className="text-lg font-bold">
                            ${country.total_transactions > 0 ? (country.total_volume_usd / country.total_transactions).toFixed(0) : 0}
                          </p>
                        </div>
                      </div>

                      {/* Networks breakdown */}
                      {country.networks_breakdown && country.networks_breakdown.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2 flex items-center gap-2">
                            <Coins className="h-4 w-4 text-muted-foreground" />
                            Répartition par Blockchain
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {country.networks_breakdown.map((net, idx) => (
                              <div 
                                key={net.network} 
                                className="flex items-center justify-between rounded-lg border bg-card p-2"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold">
                                    {idx + 1}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold">{net.network}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {net.offramp_count} off · {net.onramp_count} on
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold">{net.count} TX</p>
                                  <p className="text-xs text-muted-foreground">{net.percentage.toFixed(1)}%</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Tokens used */}
                      {country.tokens_used && country.tokens_used.length > 0 && (
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">Tokens utilisés:</span>
                          {country.tokens_used.map((token) => (
                            <Badge key={token} variant="outline" className="text-xs">
                              {token}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {/* Progress bar */}
                      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted mt-4">
                        <div 
                          className={
                            "h-full rounded-full transition-all duration-500 " +
                            (isLeastActive ? "bg-destructive" : "bg-primary")
                          }
                          style={{ width: `${country.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Country comparison - Most vs Least Active */}
            {countryStats.most_active_country && countryStats.least_active_country && countryStats.by_country.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border bg-card p-5 ring-1 ring-primary/25">
                  <div className="flex items-center gap-2 mb-3">
                    <FlagOrFallback flag={countryStats.most_active_country.flag_emoji} code={countryStats.most_active_country.country_code} />
                    <div>
                      <p className="text-sm font-semibold">Pays le plus actif</p>
                      <p className="text-2xl font-bold">
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
                      <span className="text-muted-foreground">Offramp / Onramp:</span>
                      <span className="font-bold">
                        {countryStats.most_active_country.offramp_count} / {countryStats.most_active_country.onramp_count}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Volume USD:</span>
                      <span className="font-bold">
                        ${countryStats.most_active_country.total_volume_usd.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Part de marché:</span>
                      <span className="font-bold">
                        {countryStats.most_active_country.percentage.toFixed(1)}%
                      </span>
                    </div>
                    {countryStats.most_active_country.preferred_network && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Réseau préféré:</span>
                        <span className="font-bold">{countryStats.most_active_country.preferred_network}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="rounded-lg border bg-card p-5 ring-1 ring-destructive/20">
                  <div className="flex items-center gap-2 mb-3">
                    <FlagOrFallback flag={countryStats.least_active_country.flag_emoji} code={countryStats.least_active_country.country_code} />
                    <div>
                      <p className="text-sm font-semibold">Pays moins actif</p>
                      <p className="text-2xl font-bold">
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
                      <span className="text-muted-foreground">Offramp / Onramp:</span>
                      <span className="font-bold">
                        {countryStats.least_active_country.offramp_count} / {countryStats.least_active_country.onramp_count}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Volume USD:</span>
                      <span className="font-bold">
                        ${countryStats.least_active_country.total_volume_usd.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Part de marché:</span>
                      <span className="font-bold text-destructive">
                        {countryStats.least_active_country.percentage.toFixed(1)}%
                      </span>
                    </div>
                    {countryStats.least_active_country.preferred_network && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Réseau préféré:</span>
                        <span className="font-bold">{countryStats.least_active_country.preferred_network}</span>
                      </div>
                    )}
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
          <Card className="shadow-sm">
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
                    <TableRow>
                      <TableHead className="h-11 text-xs font-medium">Référence</TableHead>
                      <TableHead className="h-11 text-xs font-medium">Date</TableHead>
                      <TableHead className="h-11 text-xs font-medium">Montant</TableHead>
                      <TableHead className="h-11 text-xs font-medium">Token</TableHead>
                      <TableHead className="h-11 text-xs font-medium">Mobile Money</TableHead>
                      <TableHead className="h-11 text-xs font-medium">XOF</TableHead>
                      <TableHead className="h-11 text-xs font-medium">Statut</TableHead>
                      <TableHead className="h-11 text-xs font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && pagedOfframpRequests.length === 0 && (
                      Array.from({ length: 6 }).map((_, i) => (
                        <TableRow key={`offramp-skel-${i}`} className="even:bg-muted/20">
                          <TableCell className="py-3"><Skeleton className="h-5 w-28" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-5 w-28" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-5 w-14" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-5 w-20" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-5 w-28" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-8 w-20" /></TableCell>
                        </TableRow>
                      ))
                    )}

                    {!loading && pagedOfframpRequests.map((request) => (
                      <TableRow key={request.id} className="even:bg-muted/20">
                        <TableCell className="py-3">
                          <Badge variant="outline" className="font-mono text-xs">
                            {request.reference_id}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-xs">
                          {new Date(request.created_at).toLocaleDateString('fr-FR')}
                          <br />
                          {new Date(request.created_at).toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </TableCell>
                        <TableCell className="py-3">
                          <BlockchainTokenBadge token={request.token} showAmount amount={request.amount} />
                        </TableCell>
                        <TableCell className="py-3">
                          <BlockchainTokenBadge token={request.token} />
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="text-sm">{request.momo_number}</div>
                          {request.momo_provider && (
                            <Badge variant="secondary" className="text-xs">
                              {request.momo_provider}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-3 font-medium">
                          {Math.round(request.xof_amount).toLocaleString()} XOF
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant={statusColors[request.status as keyof typeof statusColors]}>
                            {statusLabels[request.status as keyof typeof statusLabels]}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3">
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

               {renderPagination(offrampPage, setOfframpPage, displayedOfframpRequests.length)}
              
              {displayedOfframpRequests.length === 0 && !loading && (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-sm font-medium">Aucune demande offramp</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {searchResults ? "Aucun résultat pour cette recherche." : "Aucune transaction ne correspond aux filtres actuels."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        )}

        {/* Section Onramp */}
        {(section === 'dashboard' || section === 'onramp') && (
        <div id="onramp" className="scroll-mt-20">
          <Card className="shadow-sm">
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
                    <TableRow>
                      <TableHead className="h-11 text-xs font-medium">Référence</TableHead>
                      <TableHead className="h-11 text-xs font-medium">Date</TableHead>
                      <TableHead className="h-11 text-xs font-medium">XOF</TableHead>
                      <TableHead className="h-11 text-xs font-medium">Crypto</TableHead>
                      <TableHead className="h-11 text-xs font-medium">Mobile Money</TableHead>
                      <TableHead className="h-11 text-xs font-medium">Destination</TableHead>
                      <TableHead className="h-11 text-xs font-medium">Statut</TableHead>
                      <TableHead className="h-11 text-xs font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && pagedOnrampRequests.length === 0 && (
                      Array.from({ length: 6 }).map((_, i) => (
                        <TableRow key={`onramp-skel-${i}`} className="even:bg-muted/20">
                          <TableCell className="py-3"><Skeleton className="h-5 w-28" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-5 w-20" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-5 w-28" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-5 w-28" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-8 w-20" /></TableCell>
                        </TableRow>
                      ))
                    )}

                    {!loading && pagedOnrampRequests.map((request) => (
                      <TableRow key={request.id} className="even:bg-muted/20">
                        <TableCell className="py-3">
                          <Badge variant="outline" className="font-mono text-xs">
                            {request.reference_id}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-xs">
                          {new Date(request.created_at).toLocaleDateString('fr-FR')}
                          <br />
                          {new Date(request.created_at).toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </TableCell>
                        <TableCell className="py-3 font-medium">
                          {Math.round(request.xof_amount).toLocaleString()} XOF
                        </TableCell>
                        <TableCell className="py-3">
                          <BlockchainTokenBadge token={request.token} showAmount amount={request.crypto_amount} />
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="text-sm">{request.momo_number}</div>
                          {request.momo_provider && (
                            <Badge variant="secondary" className="text-xs">
                              {request.momo_provider}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-3 text-xs">
                          {request.recipient_address.slice(0, 6)}...{request.recipient_address.slice(-4)}
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant={statusColors[request.status as keyof typeof statusColors] || 'secondary'}>
                            {statusLabels[request.status as keyof typeof statusLabels] || request.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3">
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

               {renderPagination(onrampPage, setOnrampPage, displayedOnrampRequests.length)}
              
              {displayedOnrampRequests.length === 0 && !loading && (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-sm font-medium">Aucune demande onramp</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {searchResults ? "Aucun résultat pour cette recherche." : "Aucune transaction ne correspond aux filtres actuels."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        )}

        {/* Visibilité des Blockchains */}
        {section === 'visibility' && (
          <div id="visibility" className="scroll-mt-20">
            <BlockchainVisibilityManager />
          </div>
        )}

        {/* Visibilité des Pays */}
        {section === 'countries' && (
          <div id="countries" className="scroll-mt-20">
            <CountryVisibilityManager />
          </div>
        )}

        {/* Visibilité des Opérateurs */}
        {section === 'operators' && (
          <div id="operators" className="scroll-mt-20">
            <OperatorVisibilityManager />
          </div>
        )}

        {/* Visibilité des Tokens */}
        {section === 'tokens' && (
          <div id="tokens" className="scroll-mt-20">
            <TokenVisibilityManager />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;