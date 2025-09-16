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
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<OfframpRequest[]>([]);
  const [onrampRequests, setOnrampRequests] = useState<OnrampRequest[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
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
      console.log('=== FETCH REQUESTS DEBUG ===');
      const authHeaders = getAuthHeaders();
      console.log('Auth headers:', authHeaders);
      
      const { data, error } = await supabase.functions.invoke('admin-dashboard', {
        headers: authHeaders
      });
      
      console.log('Function response data:', data);
      console.log('Function response error:', error);
      
      if (error) throw error;

      if (data?.success) {
        console.log('Setting requests:', data.data.requests);
        console.log('Setting stats:', data.data.stats);
        setRequests(data.data.requests);
        setStats(data.data.stats);
      } else {
        console.error('Function returned error:', data?.error);
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

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-xs text-muted-foreground">En attente</p>
                  <p className="text-xl font-bold">{stats.pending_payment}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Reçu</p>
                  <p className="text-xl font-bold">{stats.received}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-xs text-muted-foreground">En cours</p>
                  <p className="text-xl font-bold">{stats.processing}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Payé</p>
                  <p className="text-xl font-bold">{stats.paid}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Échoué</p>
                  <p className="text-xl font-bold">{stats.failed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Volume USD</p>
                  <p className="text-lg font-bold">${stats.total_volume_usd.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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