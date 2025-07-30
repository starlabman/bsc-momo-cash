import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Coins, ArrowRight, Smartphone, CheckCircle, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { detectOperator, formatPhoneNumber, FRANCOPHONE_XOF_OPERATORS, type MobileOperator } from '@/utils/phoneDetection';

interface ExchangeRate {
  external_rate: number;
  final_rate: number;
  margin: number;
  last_updated: string;
}

interface OfframpRequest {
  id: string;
  amount: number;
  token: string;
  momo_number: string;
  momo_provider: string;
  xof_amount: number;
  exchange_rate: number;
  bsc_address: string;
  token_address: string;
  status: string;
  created_at: string;
}

const OfframpForm = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingRate, setLoadingRate] = useState(true);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [calculatedXOF, setCalculatedXOF] = useState<number>(0);
  const [request, setRequest] = useState<OfframpRequest | null>(null);
  const [detectedOperator, setDetectedOperator] = useState<MobileOperator | null>(null);
  
  const [formData, setFormData] = useState({
    amount: '',
    token: 'USDC',
    momoNumber: '',
    momoProvider: ''
  });

  // Fetch exchange rate on component mount
  useEffect(() => {
    fetchExchangeRate();
  }, []);

  // Auto-detect operator when phone number changes
  useEffect(() => {
    if (formData.momoNumber) {
      const detected = detectOperator(formData.momoNumber);
      setDetectedOperator(detected);
      
      if (detected && !formData.momoProvider) {
        setFormData(prev => ({ ...prev, momoProvider: detected.name }));
      }
    } else {
      setDetectedOperator(null);
    }
  }, [formData.momoNumber]);

  // Calculate XOF amount when amount or rate changes
  useEffect(() => {
    if (formData.amount && exchangeRate) {
      const amount = parseFloat(formData.amount);
      if (!isNaN(amount)) {
        setCalculatedXOF(amount * exchangeRate.final_rate);
      } else {
        setCalculatedXOF(0);
      }
    } else {
      setCalculatedXOF(0);
    }
  }, [formData.amount, exchangeRate]);

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
      const amount = parseFloat(formData.amount);
      
      if (!amount || amount <= 0 || amount > 1000) {
        throw new Error('Le montant doit être entre 0 et 1000 USD');
      }

      if (!formData.momoNumber) {
        throw new Error('Le numéro Mobile Money est requis');
      }

      if (!detectOperator(formData.momoNumber)) {
        throw new Error('Numéro non supporté. Utilisez un numéro des pays francophones UEMOA.');
      }

      const { data, error } = await supabase.functions.invoke('create-offramp-request', {
        body: {
          amount,
          token: formData.token,
          momoNumber: formData.momoNumber,
          momoProvider: formData.momoProvider || undefined
        }
      });

      if (error) throw error;

      if (data.success) {
        setRequest(data.data);
        toast({
          title: "Demande créée !",
          description: "Votre demande de conversion a été créée avec succès",
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
      amount: '',
      token: 'USDC',
      momoNumber: '',
      momoProvider: ''
    });
  };

  if (request) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              Demande créée avec succès
            </CardTitle>
            <CardDescription>
              Envoyez exactement {request.amount} {request.token} à l'adresse ci-dessous
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Montant à envoyer</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-base sm:text-lg px-3 py-2 animate-scale-in">
                    {request.amount} {request.token}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className="text-base sm:text-lg px-3 py-2 animate-scale-in">
                    {Math.round(request.xof_amount).toLocaleString()} XOF
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Numéro Mobile Money</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  <Smartphone className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm sm:text-base">{formatPhoneNumber(request.momo_number)}</span>
                  {request.momo_provider && (
                    <Badge variant="outline" className="animate-fade-in">
                      {request.momo_provider}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <Label className="text-base font-medium">
                  Adresse BSC ({request.token})
                </Label>
                <div className="mt-2 p-3 sm:p-4 bg-muted rounded-lg break-all font-mono text-xs sm:text-sm hover:bg-muted/80 transition-colors">
                  {request.bsc_address}
                </div>
              </div>

              <div className="flex justify-center">
                <div className="p-3 sm:p-4 bg-background border rounded-lg animate-scale-in">
                  <QRCodeSVG 
                    value={request.bsc_address} 
                    size={window.innerWidth < 640 ? 160 : 200}
                    level="M"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Statut</Label>
              <Badge 
                variant={request.status === 'pending_payment' ? 'secondary' : 'default'}
                className="text-sm px-3 py-1"
              >
                {request.status === 'pending_payment' ? 'En attente de paiement' : request.status}
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
            Conversion Crypto → Mobile Money
          </CardTitle>
          <CardDescription className="flex items-center gap-1">
            <Globe className="h-4 w-4" />
            Convertissez vos USDC/USDT (BSC) en XOF directement sur votre Mobile Money
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Montant (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="100"
                  min="1"
                  max="1000"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="text-base"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Limite : 1000 USD par transaction
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="token">Token</Label>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="momoNumber">Numéro Mobile Money</Label>
                <Input
                  id="momoNumber"
                  type="tel"
                  placeholder="Ex: +221 77 123 45 67"
                  value={formData.momoNumber}
                  onChange={(e) => setFormData({ ...formData, momoNumber: e.target.value })}
                  className="text-base"
                  required
                />
                {detectedOperator && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 animate-fade-in">
                    <CheckCircle className="h-4 w-4" />
                    <span>{detectedOperator.name} - {detectedOperator.country}</span>
                  </div>
                )}
                {formData.momoNumber && !detectedOperator && (
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    Numéro non reconnu. Vérifiez le format (pays francophones UEMOA uniquement)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="momoProvider">Opérateur</Label>
                <Select 
                  value={formData.momoProvider} 
                  onValueChange={(value) => setFormData({ ...formData, momoProvider: value })}
                >
                  <SelectTrigger className="text-base">
                    <SelectValue placeholder={detectedOperator ? "Auto-détecté" : "Sélectionner"} />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {FRANCOPHONE_XOF_OPERATORS
                      .reduce((unique, op) => {
                        if (!unique.find(u => u.name === op.name)) {
                          unique.push(op);
                        }
                        return unique;
                      }, [] as MobileOperator[])
                      .map(operator => (
                        <SelectItem key={operator.code} value={operator.name}>
                          {operator.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {detectedOperator && (
                  <p className="text-xs text-muted-foreground">
                    ✓ Détecté automatiquement
                  </p>
                )}
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
            ) : exchangeRate && calculatedXOF > 0 && (
              <Card className="bg-primary/5 border-primary/20 animate-scale-in">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Vous recevrez</p>
                      <p className="text-xl sm:text-2xl font-bold text-primary">
                        {Math.round(calculatedXOF).toLocaleString()} XOF
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
                'Créer la demande'
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

export default OfframpForm;