import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, History, ArrowUpRight, ArrowDownLeft, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Transaction {
  id: string;
  type: 'onramp' | 'offramp';
  amount: number;
  xof_amount: number;
  status: string;
  created_at: string;
  reference_id: string;
}

const statusColors: Record<string, string> = {
  pending_payment: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  pending_momo_payment: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  received: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  processing: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  paid: 'bg-green-500/20 text-green-400 border-green-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  expired: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const statusLabels: Record<string, string> = {
  pending_payment: 'En attente',
  pending_momo_payment: 'En attente paiement',
  received: 'Reçu',
  processing: 'En cours',
  paid: 'Payé',
  completed: 'Terminé',
  failed: 'Échoué',
  expired: 'Expiré',
};

const TransactionHistory = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchedPhone, setSearchedPhone] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchTransactions = async (phone: string) => {
    if (!phone.trim()) return;
    
    setLoading(true);
    setSearchedPhone(phone);
    setHasSearched(true);

    try {
      // Use edge function to search transactions securely
      const { data, error } = await supabase.functions.invoke('search-transactions', {
        body: { phoneNumber: phone }
      });

      if (error) {
        console.error('Search error:', error);
        throw error;
      }

      if (data.success) {
        setTransactions(data.data || []);
      } else {
        console.error('Search failed:', data.error);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 30 seconds when searched
  useEffect(() => {
    if (!searchedPhone) return;

    const interval = setInterval(() => {
      fetchTransactions(searchedPhone);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [searchedPhone]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions(phoneNumber);
  };

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <History className="h-5 w-5 text-primary" />
          Historique des Transactions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="tel"
              placeholder="Entrez votre numéro Mobile Money"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="pl-10 bg-background/50 border-primary/20"
            />
          </div>
          <Button type="submit" disabled={loading || !phoneNumber.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Rechercher'}
          </Button>
        </form>

        {/* Results */}
        {hasSearched && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucune transaction trouvée pour ce numéro</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {transactions.length} transaction(s) trouvée(s)
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchTransactions(searchedPhone)}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Actualiser
                  </Button>
                </div>

                <div className="rounded-lg border border-primary/10 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Montant XOF</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Référence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow key={tx.id} className="hover:bg-muted/20">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {tx.type === 'onramp' ? (
                                <>
                                  <ArrowUpRight className="h-4 w-4 text-green-400" />
                                  <span className="text-sm">Achat Crypto</span>
                                </>
                              ) : (
                                <>
                                  <ArrowDownLeft className="h-4 w-4 text-blue-400" />
                                  <span className="text-sm">Vente Crypto</span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(tx.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                          </TableCell>
                          <TableCell className="font-medium">
                            {tx.xof_amount.toLocaleString('fr-FR')} XOF
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={statusColors[tx.status] || 'bg-gray-500/20 text-gray-400'}
                            >
                              {statusLabels[tx.status] || tx.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-mono text-muted-foreground">
                            {tx.reference_id}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;
