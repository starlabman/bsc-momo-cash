import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Coins, ArrowRight, Smartphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';

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
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [calculatedXOF, setCalculatedXOF] = useState<number>(0);
  const [request, setRequest] = useState<OfframpRequest | null>(null);
  
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
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Demande créée avec succès
            </CardTitle>
            <CardDescription>
              Envoyez exactement {request.amount} {request.token} à l'adresse ci-dessous
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Montant à envoyer</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-lg px-3 py-2">
                    {request.amount} {request.token}
                  </Badge>
                  <ArrowRight className="h-4 w-4" />
                  <Badge variant="outline" className="text-lg px-3 py-2">
                    {Math.round(request.xof_amount).toLocaleString()} XOF
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Numéro Mobile Money</Label>
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <span className="font-medium">{request.momo_number}</span>
                  {request.momo_provider && (
                    <Badge variant="outline">{request.momo_provider}</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <Label className="text-base font-medium">
                  Adresse BSC ({request.token})
                </Label>
                <div className="mt-2 p-4 bg-muted rounded-lg break-all font-mono text-sm">
                  {request.bsc_address}
                </div>
              </div>

              <div className="flex justify-center">
                <div className="p-4 bg-background border rounded-lg">
                  <QRCodeSVG 
                    value={request.bsc_address} 
                    size={200}
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

            <div className="flex gap-4">
              <Button onClick={resetForm} variant="outline" className="flex-1">
                Nouvelle demande
              </Button>
              <Button 
                onClick={fetchExchangeRate} 
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Loader2 className="h-4 w-4" />
                Actualiser le taux
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Conversion Crypto → Mobile Money
          </CardTitle>
          <CardDescription>
            Convertissez vos USDC/USDT (BSC) en XOF directement sur votre Mobile Money
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un token" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USDC">USDC (BSC)</SelectItem>
                    <SelectItem value="USDT">USDT (BSC)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="momoNumber">Numéro Mobile Money</Label>
                <Input
                  id="momoNumber"
                  type="tel"
                  placeholder="22670123456"
                  value={formData.momoNumber}
                  onChange={(e) => setFormData({ ...formData, momoNumber: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="momoProvider">Opérateur (optionnel)</Label>
                <Select 
                  value={formData.momoProvider} 
                  onValueChange={(value) => setFormData({ ...formData, momoProvider: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Moov">Moov</SelectItem>
                    <SelectItem value="MTN">MTN</SelectItem>
                    <SelectItem value="Orange">Orange</SelectItem>
                    <SelectItem value="Wave">Wave</SelectItem>
                    <SelectItem value="Mixx by Yas">Mixx by Yas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {exchangeRate && calculatedXOF > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Vous recevrez</p>
                      <p className="text-2xl font-bold text-primary">
                        {Math.round(calculatedXOF).toLocaleString()} XOF
                      </p>
                    </div>
                    <div className="text-right">
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
              className="w-full" 
              disabled={loading || !exchangeRate}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                'Créer la demande'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {exchangeRate && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Taux de change USD/XOF</span>
              <span className="font-medium">
                1 USD = {Math.round(exchangeRate.external_rate)} XOF
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
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