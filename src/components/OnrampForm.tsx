import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Coins, ArrowRight, Smartphone, CheckCircle, DollarSign, Share2, Copy, Sparkles, Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatPhoneNumber } from '@/utils/phoneDetection';
import NetworkSelector, { SUPPORTED_NETWORKS } from '@/components/NetworkSelector';
import { CountryOperatorSelector, MobileOperator } from './CountryOperatorSelector';
import { Switch } from '@/components/ui/switch';
import { Link2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import AmountPresets from './AmountPresets';
import FormStepIndicator from './FormStepIndicator';
import LiveConversionPreview from './LiveConversionPreview';

interface ExchangeRate {
  external_rate: number;
  final_rate: number;
  margin: number;
  last_updated: string;
}

interface OnrampRequest {
  id: string;
  reference_id: string;
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
  deposit_number?: string;
}

const OnrampForm = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingRate, setLoadingRate] = useState(true);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [calculatedCrypto, setCalculatedCrypto] = useState<number>(0);
  const [request, setRequest] = useState<OnrampRequest | null>(null);
  const [paymentLinkData, setPaymentLinkData] = useState<{link: string, type: 'offramp' | 'onramp'} | null>(null);
  
  const [formData, setFormData] = useState({
    xofAmount: '',
    network: 'base', // Default to Base for better UX
    token: 'USDC',
    momoNumber: '',
    momoProvider: '',
    recipientAddress: '',
    generatePaymentLink: false,
    requesterName: ''
  });
  
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCountryData, setSelectedCountryData] = useState<any>(null);
  const [selectedOperatorData, setSelectedOperatorData] = useState<MobileOperator | null>(null);
  const [isPhoneNumberValid, setIsPhoneNumberValid] = useState(false);

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

      if (!formData.momoNumber || !selectedCountry || !isPhoneNumberValid) {
        throw new Error('Veuillez remplir tous les champs requis et vérifier le numéro de téléphone');
      }

      if (!formData.recipientAddress) {
        throw new Error('L\'adresse de réception est requise');
      }

      const currentNetwork = SUPPORTED_NETWORKS.find(n => n.id === formData.network);
      const tokenInfo = currentNetwork?.tokens.find(t => t.symbol === formData.token);

      // Validate address based on network
      let addressValid = false;
      if (formData.network === 'base' || formData.network === 'bsc' || 
          formData.network === 'ethereum' || formData.network === 'arbitrum' || 
          formData.network === 'optimism' || formData.network === 'polygon') {
        addressValid = /^0x[a-fA-F0-9]{40}$/.test(formData.recipientAddress);
      } else if (formData.network === 'solana') {
        addressValid = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(formData.recipientAddress);
      }

      if (!addressValid) {
        throw new Error(`Adresse ${currentNetwork?.name} invalide`);
      }

      const { data, error } = await supabase.functions.invoke('create-onramp-request', {
        body: {
          xofAmount,
          token: formData.token,
          network: formData.network,
          tokenAddress: tokenInfo?.address,
          momoNumber: selectedCountryData?.phone_prefix + formData.momoNumber,
          momoProvider: formData.momoProvider || undefined,
          recipientAddress: formData.recipientAddress,
          countryId: selectedCountry,
          generatePaymentLink: formData.generatePaymentLink,
          requesterName: formData.requesterName || undefined
        }
      });

      if (error) throw error;

      if (data.success) {
        // Add deposit number from selected operator to request data
        const requestWithDeposit = {
          ...data.data,
          deposit_number: selectedOperatorData?.deposit_number
        };
        
        if (data.data.payment_link) {
          setPaymentLinkData({link: data.data.payment_link, type: 'onramp'});
          setRequest(requestWithDeposit);
          
          toast({
            title: "Lien de paiement généré !",
            description: "Partagez le lien pour que quelqu'un d'autre effectue le paiement",
          });
        } else {
          setRequest(requestWithDeposit);
          
          toast({
            title: "Demande créée !",
            description: "Votre demande d'achat de crypto a été créée avec succès",
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
    setPaymentLinkData(null);
    setFormData({
      xofAmount: '',
      network: 'base', // Reset to Base
      token: 'USDC',
      momoNumber: '',
      momoProvider: '',
      recipientAddress: '',
      generatePaymentLink: false,
      requesterName: ''
    });
    setSelectedCountry('');
    setSelectedCountryData(null);
    setSelectedOperatorData(null);
    setIsPhoneNumberValid(false);
  };

  const currentNetwork = SUPPORTED_NETWORKS.find(n => n.id === formData.network);

  // Form steps for progress indicator - must be before early return
  const formSteps = useMemo(() => [
    { id: 'network', label: 'Réseau', completed: !!formData.network && !!formData.token, active: !formData.network },
    { id: 'amount', label: 'Montant', completed: !!formData.xofAmount && parseFloat(formData.xofAmount) > 0, active: !!formData.network && !formData.xofAmount },
    { id: 'wallet', label: 'Wallet', completed: !!formData.recipientAddress, active: !!formData.xofAmount && !formData.recipientAddress },
    { id: 'confirm', label: 'Confirmer', completed: false, active: isPhoneNumberValid && !!formData.recipientAddress },
  ], [formData.network, formData.token, formData.xofAmount, formData.recipientAddress, isPhoneNumberValid]);

  const XOF_PRESETS = [5000, 10000, 25000, 50000, 100000, 250000];

  if (request) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        {paymentLinkData && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-primary" />
                Lien de paiement généré
              </CardTitle>
              <CardDescription>
                Partagez ce lien avec la personne qui effectuera le paiement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Lien de paiement</Label>
                <div className="flex gap-2">
                  <Input
                    value={paymentLinkData.link}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(paymentLinkData.link);
                        toast({
                          title: "Copié !",
                          description: "Le lien a été copié dans le presse-papier",
                        });
                      } catch (err) {
                        toast({
                          title: "Erreur",
                          description: "Impossible de copier le lien",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-center p-4 bg-background border rounded-lg">
                <QRCodeSVG 
                  value={paymentLinkData.link} 
                  size={200}
                  level="M"
                />
              </div>

              <div className="text-xs text-muted-foreground">
                <p>💡 Ce lien est valide pendant 7 jours</p>
                <p className="mt-1">La personne pourra utiliser ce lien pour effectuer le paiement</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle className="h-5 w-5" />
                {paymentLinkData ? 'Détails de la demande' : 'Demande d\'achat créée avec succès'}
              </CardTitle>
              <Badge variant="outline" className="font-mono text-xs bg-background">
                {request.reference_id}
              </Badge>
            </div>
            <CardDescription>
              {paymentLinkData ? 'Informations de paiement' : `Envoyez exactement ${Math.round(request.xof_amount).toLocaleString()} XOF via Mobile Money`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Reference ID prominently displayed */}
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-center">
              <Label className="text-xs text-muted-foreground">Référence de transaction</Label>
              <p className="text-xl font-bold font-mono text-primary">{request.reference_id}</p>
              <p className="text-xs text-muted-foreground mt-1">Mentionnez cette référence lors du paiement</p>
            </div>
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <Smartphone className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-medium">Numéro de destination :</span>
                      <span className="font-mono font-bold text-primary">
                        {request.deposit_number 
                          ? `${selectedCountryData?.phone_prefix || ''} ${request.deposit_number}`
                          : 'Non configuré - Contactez le support'
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="font-medium">Montant exact :</span>
                      <span className="font-mono">{Math.round(request.xof_amount).toLocaleString()} XOF</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Référence à mentionner : <span className="font-mono font-bold text-primary">{request.reference_id}</span>
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
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-in-up">
      {/* Live Conversion Preview - Always visible at top */}
      <LiveConversionPreview
        fromAmount={formData.xofAmount}
        fromCurrency="XOF"
        toAmount={calculatedCrypto}
        toCurrency={formData.token}
        rate={exchangeRate?.final_rate}
        loading={loadingRate}
        onRefresh={fetchExchangeRate}
      />

      <Card className="shadow-card border-primary/10 bg-gradient-card overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
                Mobile Money → Crypto
              </CardTitle>
              <CardDescription className="mt-1">
                Achetez des tokens avec XOF
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs gap-1">
              <Sparkles className="h-3 w-3" />
              Sans KYC
            </Badge>
          </div>
          
          {/* Progress Indicator */}
          <div className="mt-4">
            <FormStepIndicator steps={formSteps} />
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Network & Token Selection */}
            <div className="space-y-4">
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
            </div>

            {/* Amount & Wallet Address */}
            <div className="grid grid-cols-1 gap-4">
              {/* Amount Input with Presets */}
              <div className="space-y-3">
                <Label htmlFor="xofAmount" className="text-sm font-medium flex items-center gap-2">
                  💵 Montant à envoyer (XOF)
                </Label>
                
                {/* Quick Amount Presets */}
                <AmountPresets
                  presets={XOF_PRESETS}
                  currency="XOF"
                  onSelect={(amount) => setFormData({ ...formData, xofAmount: String(amount) })}
                  selectedAmount={formData.xofAmount}
                />
                
                <Input
                  id="xofAmount"
                  type="number"
                  placeholder="Ou entrez un montant personnalisé"
                  min="1000"
                  max="600000"
                  step="1"
                  value={formData.xofAmount}
                  onChange={(e) => setFormData({ ...formData, xofAmount: e.target.value })}
                  className="text-base h-11"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Min: 1,000 XOF • Max: 600,000 XOF
                </p>
              </div>

              {/* Wallet Address */}
              <div className="space-y-2">
                <Label htmlFor="recipientAddress" className="text-sm font-medium flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Adresse de réception ({currentNetwork?.name})
                </Label>
                <Input
                  id="recipientAddress"
                  type="text"
                  placeholder={formData.network === 'solana' ? 'Adresse Solana (Base58)' : 'Adresse EVM (0x...)'}
                  value={formData.recipientAddress}
                  onChange={(e) => setFormData({ ...formData, recipientAddress: e.target.value })}
                  className="text-base font-mono h-11"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Votre adresse {currentNetwork?.name} pour recevoir les {formData.token}
                </p>
              </div>
            </div>

            {/* Country/Operator Selection */}
            <div className="pt-2 border-t border-border/50">
              <CountryOperatorSelector
                selectedCountry={selectedCountry}
                selectedOperator={formData.momoProvider}
                phoneNumber={formData.momoNumber}
                onCountryChange={(countryId, countryData) => {
                  setSelectedCountry(countryId);
                  setSelectedCountryData(countryData);
                }}
                onOperatorChange={(operator, operatorData) => {
                  setFormData({ ...formData, momoProvider: operator });
                  setSelectedOperatorData(operatorData || null);
                }}
                onPhoneNumberChange={(phoneNumber) => setFormData({ ...formData, momoNumber: phoneNumber })}
                onValidationChange={setIsPhoneNumberValid}
              />
            </div>

            {/* Payment Link Option */}
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="payment-link-onramp" className="cursor-pointer text-sm">
                      Générer un lien de paiement
                    </Label>
                  </div>
                  <Switch
                    id="payment-link-onramp"
                    checked={formData.generatePaymentLink}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, generatePaymentLink: checked })
                    }
                  />
                </div>
                
                {formData.generatePaymentLink && (
                  <div className="space-y-2 mt-4 animate-fade-in">
                    <Label htmlFor="requester-name-onramp" className="text-xs">Votre nom (optionnel)</Label>
                    <Input
                      id="requester-name-onramp"
                      type="text"
                      placeholder="Ex: Jean Dupont"
                      value={formData.requesterName}
                      onChange={(e) => setFormData({ ...formData, requesterName: e.target.value })}
                      className="h-9"
                      maxLength={100}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 text-base bg-gradient-primary hover:opacity-90 transition-all duration-300" 
              disabled={loading || !exchangeRate || loadingRate || !isPhoneNumberValid || !selectedCountry || !formData.xofAmount || !formData.recipientAddress}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Coins className="mr-2 h-4 w-4" />
                  {formData.generatePaymentLink ? 'Générer le lien' : 'Créer la demande'}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Exchange Rate Info Footer */}
      {exchangeRate && (
        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>Taux: 1 USD = {Math.round(exchangeRate.final_rate)} XOF (marge {(exchangeRate.margin * 100).toFixed(0)}%)</p>
          <p>Mis à jour: {new Date(exchangeRate.last_updated).toLocaleString('fr-FR')}</p>
        </div>
      )}
    </div>
  );
};

export default OnrampForm;