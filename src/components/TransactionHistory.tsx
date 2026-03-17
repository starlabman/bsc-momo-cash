import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, History, ArrowUpRight, ArrowDownLeft, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

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

const TransactionHistory = () => {
  const { t, i18n } = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchedPhone, setSearchedPhone] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const dateLocale = i18n.language?.startsWith('fr') ? fr : enUS;

  const fetchTransactions = async (phone: string) => {
    if (!phone.trim()) return;
    
    setLoading(true);
    setSearchedPhone(phone);
    setHasSearched(true);

    try {
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

  useEffect(() => {
    if (!searchedPhone) return;
    const interval = setInterval(() => {
      fetchTransactions(searchedPhone);
    }, 30000);
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
          {t('transactions.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="tel"
              placeholder={t('transactions.searchPlaceholder')}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="pl-10 bg-background/50 border-primary/20"
            />
          </div>
          <Button type="submit" disabled={loading || !phoneNumber.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('transactions.search')}
          </Button>
        </form>

        {hasSearched && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{t('transactions.noResults')}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {t('transactions.found', { count: transactions.length })}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchTransactions(searchedPhone)}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('transactions.refresh')}</span>
                  </Button>
                </div>

                {/* Mobile card view */}
                <div className="space-y-3 sm:hidden">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="p-3 rounded-lg border border-primary/10 bg-muted/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {tx.type === 'onramp' ? (
                            <ArrowUpRight className="h-4 w-4 text-green-400" />
                          ) : (
                            <ArrowDownLeft className="h-4 w-4 text-blue-400" />
                          )}
                          <span className="text-sm font-medium">
                            {tx.type === 'onramp' ? t('transactions.buyCrypto') : t('transactions.sellCrypto')}
                          </span>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] ${statusColors[tx.status] || 'bg-gray-500/20 text-gray-400'}`}
                        >
                          {t(`statuses.${tx.status}`, tx.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold">{tx.xof_amount.toLocaleString('fr-FR')} XOF</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(tx.created_at), 'dd MMM HH:mm', { locale: dateLocale })}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-muted-foreground truncate">
                        {t('transactions.ref')}: {tx.reference_id}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table view */}
                <div className="rounded-lg border border-primary/10 overflow-x-auto hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>{t('transactions.type')}</TableHead>
                        <TableHead>{t('transactions.date')}</TableHead>
                        <TableHead>{t('transactions.amountXof')}</TableHead>
                        <TableHead>{t('transactions.statusCol')}</TableHead>
                        <TableHead>{t('transactions.reference')}</TableHead>
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
                                  <span className="text-sm">{t('transactions.buyCrypto')}</span>
                                </>
                              ) : (
                                <>
                                  <ArrowDownLeft className="h-4 w-4 text-blue-400" />
                                  <span className="text-sm">{t('transactions.sellCrypto')}</span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {format(new Date(tx.created_at), 'dd MMM yyyy HH:mm', { locale: dateLocale })}
                          </TableCell>
                          <TableCell className="font-medium whitespace-nowrap">
                            {tx.xof_amount.toLocaleString('fr-FR')} XOF
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={statusColors[tx.status] || 'bg-gray-500/20 text-gray-400'}
                            >
                              {t(`statuses.${tx.status}`, tx.status)}
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