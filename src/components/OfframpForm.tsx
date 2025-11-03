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
import { formatPhoneNumber } from '@/utils/phoneDetection';
import NetworkSelector, { SUPPORTED_NETWORKS } from '@/components/NetworkSelector';
import WalletConnector from '@/components/WalletConnector';
import { CountryOperatorSelector } from './CountryOperatorSelector';
import { PaymentLinkDialog } from './PaymentLinkDialog';
import { Switch } from '@/components/ui/switch';
import { Link2 } from 'lucide-react';

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
  
  const [formData, setFormData] = useState({
    amount: '',
    network: 'base', // Default to Base
    token: 'USDC',
    momoNumber: '',
    momoProvider: '',
    generatePaymentLink: false,
    requesterName: ''
  });
  
  const [showPaymentLinkDialog, setShowPaymentLinkDialog] = useState(false);
  const [paymentLink, setPaymentLink] = useState('');
  
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCountryData, setSelectedCountryData] = useState<any>(null);
  const [isPhoneNumberValid, setIsPhoneNumberValid] = useState(false);

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

      if (!formData.momoNumber || !selectedCountry || !isPhoneNumberValid) {
        throw new Error('Veuillez remplir tous les champs requis et vérifier le numéro de téléphone');
      }


      const currentNetwork = SUPPORTED_NETWORKS.find(n => n.id === formData.network);
      const tokenInfo = currentNetwork?.tokens.find(t => t.symbol === formData.token);

      const { data, error } = await supabase.functions.invoke('create-offramp-request', {
        body: {
          amount,
          token: formData.token,
          network: formData.network,
          tokenAddress: tokenInfo?.address,
          momoNumber: selectedCountryData?.phone_prefix + formData.momoNumber,
          momoProvider: formData.momoProvider || undefined,
          countryId: selectedCountry,
          generatePaymentLink: formData.generatePaymentLink,
          requesterName: formData.requesterName || undefined
        }
      });

      if (error) throw error;

      if (data.success) {
        // Si un lien de paiement est généré, ne pas afficher la page de succès normale
        if (data.data.payment_link) {
          setPaymentLink(data.data.payment_link);
          setShowPaymentLinkDialog(true);
          
          toast({
            title: "Lien de paiement généré !",
            description: "Partagez le lien pour que quelqu'un d'autre effectue le paiement",
          });
        } else {
          setRequest(data.data);
          
          toast({
            title: "Demande créée !",
            description: "Votre demande de conversion a été créée avec succès",
          });
        }
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
      network: 'base', // Reset to Base
      token: 'USDC',
      momoNumber: '',
      momoProvider: '',
      generatePaymentLink: false,
      requesterName: ''
    });
    setSelectedCountry('');
    setSelectedCountryData(null);
    setIsPhoneNumberValid(false);
    setPaymentLink('');
    setShowPaymentLinkDialog(false);
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

  const currentNetwork = SUPPORTED_NETWORKS.find(n => n.id === formData.network);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-in-up">
      <Card className="hover-scale shadow-card border-primary/10 bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl animate-fade-in">
            <Coins className="h-5 w-5 text-primary animate-float" />
            Conversion Crypto → Mobile Money
          </CardTitle>
          <CardDescription className="flex items-center gap-1 animate-slide-in-down">
            <Globe className="h-4 w-4" />
            Convertissez vos tokens crypto en XOF directement sur votre Mobile Money
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Wallet Connector for Base network */}
            {formData.network === 'base' && (
              <div className="animate-slide-in-up">
                <WalletConnector />
              </div>
            )}
            <NetworkSelector
              selectedNetwork={formData.network}
              onNetworkChange={(network) => {
                const newNetwork = SUPPORTED_NETWORKS.find(n => n.id === network);
                const firstToken = newNetwork?.tokens[0]?.symbol || 'USDC';
                setFormData({ ...formData, network, token: firstToken });
              }}
              selectedToken={formData.token}
              onTokenChange={(token) => setFormData({ ...formData, token })}
            />

            <div className="space-y-2 animate-slide-in-up">
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
                className="text-base hover:border-primary/50 transition-colors"
                required
              />
              <p className="text-xs text-muted-foreground">
                Limite : 1000 USD par transaction
              </p>
            </div>

            <div className="animate-slide-in-up">
              <CountryOperatorSelector
                selectedCountry={selectedCountry}
                selectedOperator={formData.momoProvider}
                phoneNumber={formData.momoNumber}
                onCountryChange={(countryId, countryData) => {
                  setSelectedCountry(countryId);
                  setSelectedCountryData(countryData);
                }}
                onOperatorChange={(operator) => setFormData({ ...formData, momoProvider: operator })}
                onPhoneNumberChange={(phoneNumber) => setFormData({ ...formData, momoNumber: phoneNumber })}
                onValidationChange={setIsPhoneNumberValid}
              />
            </div>

            <Card className="bg-accent/5 border-accent/20 animate-slide-in-up">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-accent" />
                    <Label htmlFor="payment-link" className="cursor-pointer">
                      Générer un lien de paiement
                    </Label>
                  </div>
                  <Switch
                    id="payment-link"
                    checked={formData.generatePaymentLink}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, generatePaymentLink: checked })
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Créez un lien de paiement que vous pourrez partager avec quelqu'un d'autre pour qu'il effectue le paiement
                </p>
                
                {formData.generatePaymentLink && (
                  <div className="space-y-2 animate-slide-in-down">
                    <Label htmlFor="requester-name">Votre nom (optionnel)</Label>
                    <Input
                      id="requester-name"
                      type="text"
                      placeholder="Ex: Jean Dupont"
                      value={formData.requesterName}
                      onChange={(e) => setFormData({ ...formData, requesterName: e.target.value })}
                      className="text-base"
                      maxLength={100}
                    />
                    <p className="text-xs text-muted-foreground">
                      Votre nom sera affiché sur la page de paiement
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

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
              <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20 animate-bounce-in hover:shadow-glow transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="animate-zoom-in">
                      <p className="text-sm text-muted-foreground">Vous recevrez</p>
                      <p className="text-xl sm:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                        {Math.round(calculatedXOF).toLocaleString()} XOF
                      </p>
                    </div>
                    <div className="text-left sm:text-right animate-slide-in-right">
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
              className="w-full h-12 text-base bg-gradient-primary hover:shadow-primary transition-all duration-300 animate-pulse-glow" 
              disabled={loading || !exchangeRate || loadingRate || !isPhoneNumberValid || !selectedCountry}
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
                <>
                  <Coins className="mr-2 h-4 w-4" />
                  Créer la demande
                </>
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
      
      <PaymentLinkDialog
        open={showPaymentLinkDialog}
        onOpenChange={(open) => {
          setShowPaymentLinkDialog(open);
          if (!open) {
            // Réinitialiser le formulaire quand on ferme le dialogue
            resetForm();
          }
        }}
        paymentLink={paymentLink}
        amount={formData.amount}
        token={formData.token}
        type="offramp"
      />
    </div>
  );
};

export default OfframpForm;