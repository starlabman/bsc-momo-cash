import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Coins, ArrowRight, Smartphone, CheckCircle, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatPhoneNumber } from '@/utils/phoneDetection';

interface ExchangeRate {
  external_rate: number;
  final_rate: number;
  margin: number;
  last_updated: string;
}

interface OnrampRequest {
  id: string;
  xof_amount: number;
  usd_amount: number;
  crypto_amount: number;
  token: string;
  momo_number: string;
  momo_provider: string;
  recipient_address: string;
  exchange_rate: number;
  status: string;
  created_at: string;
}

const OnrampForm = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingRate, setLoadingRate] = useState(true);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [calculatedCrypto, setCalculatedCrypto] = useState<number>(0);
  const [request, setRequest] = useState<OnrampRequest | null>(null);
  
  const [formData, setFormData] = useState({
    xofAmount: '',
    token: 'USDC',
    momoNumber: '',
    momoProvider: '',
    recipientAddress: ''
  });

  // Fetch exchange rate on component mount
  useEffect(() => {
    fetchExchangeRate();
  }, []);

  // Calculate crypto amount when XOF amount or rate changes
  useEffect(() => {
    if (formData.xofAmount && exchangeRate) {
      const amount = parseFloat(formData.xofAmount);
      if (!isNaN(amount)) {
        const usdAmount = amount / exchangeRate.final_rate;
        setCalculatedCrypto(usdAmount);
      } else {
        setCalculatedCrypto(0);
      }
    } else {
      setCalculatedCrypto(0);
    }
  }, [formData.xofAmount, exchangeRate]);

  const fetchExchangeRate = async () => {
    setLoadingRate(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-exchange-rate');
      if (error) throw error;
      
      if (data.success) {
        setExchangeRate(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer le taux de change",
        variant: "destructive",
      });
    } finally {
      setLoadingRate(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const xofAmount = parseFloat(formData.xofAmount);
      
      if (!xofAmount || xofAmount <= 0 || xofAmount > 600000) {
        throw new Error('Le montant doit être entre 0 et 600,000 XOF');
      }

      if (!formData.momoNumber) {
        throw new Error('Le numéro Mobile Money est requis');
      }

      if (!formData.recipientAddress) {
        throw new Error('L\'adresse de réception est requise');
      }

      // Validate BSC address format (basic validation)
      if (!/^0x[a-fA-F0-9]{40}$/.test(formData.recipientAddress)) {
        throw new Error('Adresse BSC invalide');
      }

      const { data, error } = await supabase.functions.invoke('create-onramp-request', {
        body: {
          xofAmount,
          token: formData.token,
          momoNumber: formData.momoNumber,
          momoProvider: formData.momoProvider || undefined,
          recipientAddress: formData.recipientAddress
        }
      });

      if (error) throw error;

      if (data.success) {
        setRequest(data.data);
        toast({
          title: "Demande créée !",
          description: "Votre demande d'achat de crypto a été créée avec succès",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error creating request:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRequest(null);
    setFormData({
      xofAmount: '',
      token: 'USDC',
      momoNumber: '',
      momoProvider: '',
      recipientAddress: ''
    });
  };

  if (request) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              Demande d'achat créée avec succès
            </CardTitle>
            <CardDescription>
              Envoyez exactement {Math.round(request.xof_amount).toLocaleString()} XOF via Mobile Money
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Montant à envoyer</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-base sm:text-lg px-3 py-2 animate-scale-in">
                    {Math.round(request.xof_amount).toLocaleString()} XOF
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className="text-base sm:text-lg px-3 py-2 animate-scale-in">
                    {request.crypto_amount.toFixed(6)} {request.token}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Adresse de réception</Label>
                <div className="p-2 bg-muted rounded break-all font-mono text-xs">
                  {request.recipient_address}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Instructions de paiement</Label>
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-primary" />
                      <span className="font-medium">Numéro de destination :</span>
                      <span className="font-mono">+221 77 XXX XX XX</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="font-medium">Montant exact :</span>
                      <span className="font-mono">{Math.round(request.xof_amount).toLocaleString()} XOF</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Référence à mentionner : <span className="font-mono">{request.id.substring(0, 8)}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <Label>Statut</Label>
              <Badge 
                variant={request.status === 'pending_momo_payment' ? 'secondary' : 'default'}
                className="text-sm px-3 py-1"
              >
                {request.status === 'pending_momo_payment' ? 'En attente de paiement Mobile Money' : request.status}
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button onClick={resetForm} variant="outline" className="flex-1 hover-scale">
                Nouvelle demande
              </Button>
              <Button 
                onClick={fetchExchangeRate} 
                variant="secondary"
                className="flex-1 sm:flex-none flex items-center gap-2 hover-scale"
                disabled={loadingRate}
              >
                {loadingRate ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Coins className="h-4 w-4" />
                )}
                Actualiser le taux
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <Card className="hover-scale">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Coins className="h-5 w-5 text-primary" />
            Conversion Mobile Money → Crypto
          </CardTitle>
          <CardDescription className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            Achetez des USDC/USDT (BSC) avec votre Mobile Money
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="xofAmount">Montant (XOF)</Label>
                <Input
                  id="xofAmount"
                  type="number"
                  placeholder="50000"
                  min="1000"
                  max="600000"
                  step="1"
                  value={formData.xofAmount}
                  onChange={(e) => setFormData({ ...formData, xofAmount: e.target.value })}
                  className="text-base"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Limite : 600,000 XOF par transaction
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="token">Token à recevoir</Label>
                <Select 
                  value={formData.token} 
                  onValueChange={(value) => setFormData({ ...formData, token: value })}
                >
                  <SelectTrigger className="text-base">
                    <SelectValue placeholder="Sélectionner un token" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USDC">USDC (BSC)</SelectItem>
                    <SelectItem value="USDT">USDT (BSC)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientAddress">Adresse de réception (BSC)</Label>
              <Input
                id="recipientAddress"
                type="text"
                placeholder="0x..."
                value={formData.recipientAddress}
                onChange={(e) => setFormData({ ...formData, recipientAddress: e.target.value })}
                className="text-base font-mono"
                required
              />
              <p className="text-xs text-muted-foreground">
                Votre adresse BSC où vous recevrez les tokens
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="momoNumber">Votre numéro Mobile Money</Label>
                <Input
                  id="momoNumber"
                  type="tel"
                  placeholder="Ex: +221 77 123 45 67"
                  value={formData.momoNumber}
                  onChange={(e) => setFormData({ ...formData, momoNumber: e.target.value })}
                  className="text-base"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="momoProvider">Votre opérateur</Label>
                <Select 
                  value={formData.momoProvider} 
                  onValueChange={(value) => setFormData({ ...formData, momoProvider: value })}
                >
                  <SelectTrigger className="text-base">
                    <SelectValue placeholder="Sélectionner un opérateur" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    <SelectItem value="Orange">Orange</SelectItem>
                    <SelectItem value="MTN">MTN</SelectItem>
                    <SelectItem value="Moov">Moov</SelectItem>
                    <SelectItem value="Wave">Wave</SelectItem>
                    <SelectItem value="Free">Free</SelectItem>
                    <SelectItem value="Malitel">Malitel</SelectItem>
                    <SelectItem value="Togocel">Togocel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loadingRate ? (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-48" />
                  </div>
                </CardContent>
              </Card>
            ) : exchangeRate && calculatedCrypto > 0 && (
              <Card className="bg-primary/5 border-primary/20 animate-scale-in">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Vous recevrez</p>
                      <p className="text-xl sm:text-2xl font-bold text-primary">
                        {calculatedCrypto.toFixed(6)} {formData.token}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-muted-foreground">
                        Taux : 1 USD = {Math.round(exchangeRate.final_rate)} XOF
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Marge : {(exchangeRate.margin * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-base hover-scale" 
              disabled={loading || !exchangeRate || loadingRate}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : loadingRate ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Chargement du taux...
                </>
              ) : (
                'Créer la demande d\'achat'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {loadingRate ? (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-3 w-56" />
          </CardContent>
        </Card>
      ) : exchangeRate && (
        <Card className="animate-fade-in">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
              <span className="text-muted-foreground">Taux de change USD/XOF</span>
              <span className="font-medium">
                1 USD = {Math.round(exchangeRate.external_rate)} XOF
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm mt-1">
              <span className="text-muted-foreground">Taux après marge ({(exchangeRate.margin * 100).toFixed(1)}%)</span>
              <span className="font-medium text-primary">
                1 USD = {Math.round(exchangeRate.final_rate)} XOF
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Dernière mise à jour : {new Date(exchangeRate.last_updated).toLocaleString('fr-FR')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OnrampForm;