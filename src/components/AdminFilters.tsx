import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Filter, X, Download, CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

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

interface Country {
  id: string;
  name: string;
  code: string;
  flag_emoji: string;
}

interface FilterState {
  status: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  country: string;
  network: string;
  momoProvider: string;
  minAmount: string;
  maxAmount: string;
}

interface AdminFiltersProps {
  offrampRequests: OfframpRequest[];
  onrampRequests: OnrampRequest[];
  filteredOfframpRequests: OfframpRequest[];
  filteredOnrampRequests: OnrampRequest[];
  onFilteredOfframp: (requests: OfframpRequest[]) => void;
  onFilteredOnramp: (requests: OnrampRequest[]) => void;
  activeTab: 'offramp' | 'onramp' | 'all';
}

const AdminFilters: React.FC<AdminFiltersProps> = ({
  offrampRequests,
  onrampRequests,
  filteredOfframpRequests,
  filteredOnrampRequests,
  onFilteredOfframp,
  onFilteredOnramp,
  activeTab
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    dateFrom: undefined,
    dateTo: undefined,
    country: 'all',
    network: 'all',
    momoProvider: 'all',
    minAmount: '',
    maxAmount: ''
  });

  // Status options
  const offrampStatuses = [
    { value: 'pending_payment', label: 'En attente paiement crypto' },
    { value: 'received', label: 'Crypto reçue' },
    { value: 'processing', label: 'En cours de traitement' },
    { value: 'paid', label: 'Mobile Money envoyé' },
    { value: 'failed', label: 'Échoué' }
  ];

  const onrampStatuses = [
    { value: 'pending_momo_payment', label: 'En attente paiement Mobile Money' },
    { value: 'momo_payment_received', label: 'Mobile Money reçu' },
    { value: 'processing', label: 'En cours de traitement' },
    { value: 'completed', label: 'Crypto envoyée' },
    { value: 'failed', label: 'Échoué' }
  ];

  const networks = ['BSC', 'Ethereum', 'Polygon', 'Arbitrum', 'Base', 'Optimism'];
  const momoProviders = ['Orange Money', 'MTN Money', 'Wave', 'Moov Money', 'Free Money'];

  // Fetch countries
  useEffect(() => {
    const fetchCountries = async () => {
      const { data } = await supabase.from('countries').select('*');
      if (data) setCountries(data);
    };
    fetchCountries();
  }, []);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [filters, offrampRequests, onrampRequests]);

  const applyFilters = () => {
    // Filter offramp
    let filteredOfframp = [...offrampRequests];
    
    if (filters.status !== 'all') {
      filteredOfframp = filteredOfframp.filter(r => r.status === filters.status);
    }
    
    if (filters.dateFrom) {
      filteredOfframp = filteredOfframp.filter(r => new Date(r.created_at) >= filters.dateFrom!);
    }
    
    if (filters.dateTo) {
      const endOfDay = new Date(filters.dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      filteredOfframp = filteredOfframp.filter(r => new Date(r.created_at) <= endOfDay);
    }
    
    if (filters.network !== 'all') {
      filteredOfframp = filteredOfframp.filter(r => 
        r.token?.toLowerCase().includes(filters.network.toLowerCase()) ||
        r.bsc_address?.toLowerCase().includes(filters.network.toLowerCase())
      );
    }
    
    if (filters.momoProvider !== 'all') {
      filteredOfframp = filteredOfframp.filter(r => 
        r.momo_provider?.toLowerCase() === filters.momoProvider.toLowerCase()
      );
    }
    
    if (filters.minAmount) {
      filteredOfframp = filteredOfframp.filter(r => r.usd_amount >= parseFloat(filters.minAmount));
    }
    
    if (filters.maxAmount) {
      filteredOfframp = filteredOfframp.filter(r => r.usd_amount <= parseFloat(filters.maxAmount));
    }

    // Filter onramp
    let filteredOnramp = [...onrampRequests];
    
    if (filters.status !== 'all') {
      filteredOnramp = filteredOnramp.filter(r => r.status === filters.status);
    }
    
    if (filters.dateFrom) {
      filteredOnramp = filteredOnramp.filter(r => new Date(r.created_at) >= filters.dateFrom!);
    }
    
    if (filters.dateTo) {
      const endOfDay = new Date(filters.dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      filteredOnramp = filteredOnramp.filter(r => new Date(r.created_at) <= endOfDay);
    }
    
    if (filters.momoProvider !== 'all') {
      filteredOnramp = filteredOnramp.filter(r => 
        r.momo_provider?.toLowerCase() === filters.momoProvider.toLowerCase()
      );
    }
    
    if (filters.minAmount) {
      filteredOnramp = filteredOnramp.filter(r => r.usd_amount >= parseFloat(filters.minAmount));
    }
    
    if (filters.maxAmount) {
      filteredOnramp = filteredOnramp.filter(r => r.usd_amount <= parseFloat(filters.maxAmount));
    }

    onFilteredOfframp(filteredOfframp);
    onFilteredOnramp(filteredOnramp);
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      dateFrom: undefined,
      dateTo: undefined,
      country: 'all',
      network: 'all',
      momoProvider: 'all',
      minAmount: '',
      maxAmount: ''
    });
  };

  const hasActiveFilters = () => {
    return filters.status !== 'all' ||
      filters.dateFrom !== undefined ||
      filters.dateTo !== undefined ||
      filters.country !== 'all' ||
      filters.network !== 'all' ||
      filters.momoProvider !== 'all' ||
      filters.minAmount !== '' ||
      filters.maxAmount !== '';
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.country !== 'all') count++;
    if (filters.network !== 'all') count++;
    if (filters.momoProvider !== 'all') count++;
    if (filters.minAmount) count++;
    if (filters.maxAmount) count++;
    return count;
  };

  // Export to CSV - uses filtered data
  const exportToCSV = (type: 'offramp' | 'onramp' | 'all') => {
    let csvContent = '';
    
    // Use filtered data instead of raw data
    const offrampToExport = filteredOfframpRequests;
    const onrampToExport = filteredOnrampRequests;
    
    if (type === 'offramp' || type === 'all') {
      // Offramp headers
      const offrampHeaders = [
        'Référence', 'Date', 'Montant Crypto', 'Token', 'Montant USD', 'Montant XOF',
        'Taux de change', 'Numéro Mobile Money', 'Opérateur', 'Adresse BSC',
        'Hash Transaction', 'Statut', 'Notes'
      ];
      
      csvContent += `TRANSACTIONS OFFRAMP (Crypto → Mobile Money) - ${offrampToExport.length} transaction(s)\n`;
      csvContent += offrampHeaders.join(';') + '\n';
      
      offrampToExport.forEach(r => {
        const row = [
          r.reference_id,
          format(new Date(r.created_at), 'dd/MM/yyyy HH:mm'),
          r.amount,
          r.token,
          r.usd_amount,
          r.xof_amount,
          r.exchange_rate,
          r.momo_number,
          r.momo_provider || '',
          r.bsc_address,
          r.transaction_hash || '',
          r.status,
          r.notes?.replace(/[;\n]/g, ' ') || ''
        ];
        csvContent += row.join(';') + '\n';
      });
      
      csvContent += '\n';
    }
    
    if (type === 'onramp' || type === 'all') {
      // Onramp headers
      const onrampHeaders = [
        'Référence', 'Date', 'Montant XOF', 'Montant USD', 'Montant Crypto', 'Token',
        'Taux de change', 'Numéro Mobile Money', 'Opérateur', 'Adresse Destination',
        'Hash Transaction', 'Statut', 'Notes'
      ];
      
      csvContent += `TRANSACTIONS ONRAMP (Mobile Money → Crypto) - ${onrampToExport.length} transaction(s)\n`;
      csvContent += onrampHeaders.join(';') + '\n';
      
      onrampToExport.forEach(r => {
        const row = [
          r.reference_id,
          format(new Date(r.created_at), 'dd/MM/yyyy HH:mm'),
          r.xof_amount,
          r.usd_amount,
          r.crypto_amount,
          r.token,
          r.exchange_rate,
          r.momo_number,
          r.momo_provider || '',
          r.recipient_address,
          r.transaction_hash || '',
          r.status,
          r.notes?.replace(/[;\n]/g, ' ') || ''
        ];
        csvContent += row.join(';') + '\n';
      });
    }
    
    // Download file with filter indicator
    const filterIndicator = hasActiveFilters() ? '_filtered' : '';
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${type}${filterIndicator}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
    link.click();
  };

  const statuses = activeTab === 'onramp' ? onrampStatuses : 
                   activeTab === 'offramp' ? offrampStatuses :
                   [...offrampStatuses, ...onrampStatuses.filter(s => !offrampStatuses.find(os => os.value === s.value))];

  return (
    <Card className="border-primary/20 bg-primary/5">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardContent className="pt-4 pb-4 cursor-pointer hover:bg-primary/10 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Filter className="h-5 w-5 text-primary" />
                <span className="font-medium">Filtres avancés</span>
                {hasActiveFilters() && (
                  <Badge variant="secondary" className="bg-primary text-primary-foreground">
                    {getActiveFilterCount()} actif(s)
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Export buttons */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2" onClick={(e) => e.stopPropagation()}>
                      <Download className="h-4 w-4" />
                      Exporter CSV
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 bg-background" align="end">
                    <div className="space-y-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start"
                        onClick={() => exportToCSV('offramp')}
                      >
                        Offramp seulement
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start"
                        onClick={() => exportToCSV('onramp')}
                      >
                        Onramp seulement
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start"
                        onClick={() => exportToCSV('all')}
                      >
                        Toutes les transactions
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status filter */}
              <div className="space-y-2">
                <Label className="text-xs">Statut</Label>
                <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {statuses.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date from */}
              <div className="space-y-2">
                <Label className="text-xs">Date début</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateFrom ? format(filters.dateFrom, 'dd/MM/yyyy') : 'Sélectionner'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateFrom}
                      onSelect={(date) => setFilters({ ...filters, dateFrom: date })}
                      locale={fr}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date to */}
              <div className="space-y-2">
                <Label className="text-xs">Date fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateTo ? format(filters.dateTo, 'dd/MM/yyyy') : 'Sélectionner'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateTo}
                      onSelect={(date) => setFilters({ ...filters, dateTo: date })}
                      locale={fr}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Country filter */}
              <div className="space-y-2">
                <Label className="text-xs">Pays</Label>
                <Select value={filters.country} onValueChange={(v) => setFilters({ ...filters, country: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les pays" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="all">Tous les pays</SelectItem>
                    {countries.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.flag_emoji} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Network filter (for offramp) */}
              {(activeTab === 'offramp' || activeTab === 'all') && (
                <div className="space-y-2">
                  <Label className="text-xs">Réseau Blockchain</Label>
                  <Select value={filters.network} onValueChange={(v) => setFilters({ ...filters, network: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les réseaux" />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      <SelectItem value="all">Tous les réseaux</SelectItem>
                      {networks.map((n) => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Mobile Money Provider */}
              <div className="space-y-2">
                <Label className="text-xs">Opérateur Mobile Money</Label>
                <Select value={filters.momoProvider} onValueChange={(v) => setFilters({ ...filters, momoProvider: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les opérateurs" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="all">Tous les opérateurs</SelectItem>
                    {momoProviders.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Min Amount */}
              <div className="space-y-2">
                <Label className="text-xs">Montant min (USD)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minAmount}
                  onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                />
              </div>

              {/* Max Amount */}
              <div className="space-y-2">
                <Label className="text-xs">Montant max (USD)</Label>
                <Input
                  type="number"
                  placeholder="∞"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                />
              </div>
            </div>

            {/* Clear filters button */}
            {hasActiveFilters() && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2 text-muted-foreground">
                  <X className="h-4 w-4" />
                  Réinitialiser les filtres
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default AdminFilters;
