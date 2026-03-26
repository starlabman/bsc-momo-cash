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
import { useTranslation } from 'react-i18next';

interface ExchangeRate {
  external_rate: number;
  final_rate: number;
  offramp_rate: number;
  onramp_rate: number;
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
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingRate, setLoadingRate] = useState(true);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [calculatedCrypto, setCalculatedCrypto] = useState<number>(0);
  const [request, setRequest] = useState<OnrampRequest | null>(null);
  const [paymentLinkData, setPaymentLinkData] = useState<{link: string, type: 'offramp' | 'onramp'} | null>(null);
  
  const [formData, setFormData] = useState({
    xofAmount: '',
    network: 'base',
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

  useEffect(() => {
    fetchExchangeRate();
  }, []);

  useEffect(() => {
    if (formData.xofAmount && exchangeRate) {
      const amount = parseFloat(formData.xofAmount);
      if (!isNaN(amount)) {
        const usdAmount = amount / exchangeRate.onramp_rate;
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
        title: t('errors.error'),
        description: t('errors.fetchRate'),
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
        throw new Error(t('errors.amountRangeXof'));
      }

      if (!formData.momoNumber || !selectedCountry || !isPhoneNumberValid) {
        throw new Error(t('errors.fillFields'));
      }

      if (!formData.recipientAddress) {
        throw new Error(t('errors.addressRequired'));
      }

      const currentNetwork = SUPPORTED_NETWORKS.find(n => n.id === formData.network);
      const tokenInfo = currentNetwork?.tokens.find(t => t.symbol === formData.token);

      let addressValid = false;
      if (formData.network === 'base' || formData.network === 'bsc' || 
          formData.network === 'ethereum' || formData.network === 'arbitrum' || 
          formData.network === 'optimism' || formData.network === 'polygon' ||
          formData.network === 'avalanche' || formData.network === 'lisk') {
        addressValid = /^0x[a-fA-F0-9]{40}$/.test(formData.recipientAddress);
      } else if (formData.network === 'solana') {
        addressValid = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(formData.recipientAddress);
      }

      if (!addressValid) {
        throw new Error(t('errors.invalidAddress', { network: currentNetwork?.name }));
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
        const requestWithDeposit = {
          ...data.data,
          deposit_number: selectedOperatorData?.deposit_number
        };
        
        if (data.data.payment_link) {
          setPaymentLinkData({link: data.data.payment_link, type: 'onramp'});
          setRequest(requestWithDeposit);
          toast({
            title: t('success.linkGenerated'),
            description: t('success.linkGeneratedDesc'),
          });
        } else {
          setRequest(requestWithDeposit);
          toast({
            title: t('success.buyCreated'),
            description: t('success.buyCreatedDesc'),
          });
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error creating request:', error);
      toast({
        title: t('errors.error'),
        description: error instanceof Error ? error.message : t('errors.genericError'),
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
      network: 'base',
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

  const formSteps = useMemo(() => [
    { id: 'network', label: t('common.steps.network'), completed: !!formData.network && !!formData.token, active: !formData.network },
    { id: 'amount', label: t('common.steps.amount'), completed: !!formData.xofAmount && parseFloat(formData.xofAmount) > 0, active: !!formData.network && !formData.xofAmount },
    { id: 'wallet', label: t('common.steps.wallet'), completed: !!formData.recipientAddress, active: !!formData.xofAmount && !formData.recipientAddress },
    { id: 'confirm', label: t('common.steps.confirm'), completed: false, active: isPhoneNumberValid && !!formData.recipientAddress },
  ], [formData.network, formData.token, formData.xofAmount, formData.recipientAddress, isPhoneNumberValid, t]);

  const XOF_PRESETS = [5000, 10000, 25000, 50000, 100000, 250000];

  if (request) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        {paymentLinkData && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-primary" />
                {t('paymentLinkCard.title')}
              </CardTitle>
              <CardDescription>
                {t('paymentLinkCard.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('paymentLinkCard.label')}</Label>
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
                          title: t('paymentLinkCard.copied'),
                          description: t('paymentLinkCard.copiedDesc'),
                        });
                      } catch (err) {
                        toast({
                          title: t('errors.error'),
                          description: t('paymentLinkCard.copyError'),
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
                <p>{t('paymentLinkCard.validity')}</p>
                <p className="mt-1">{t('paymentLinkCard.shareInfo')}</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle className="h-5 w-5" />
                {paymentLinkData ? t('onramp.recipientAddress') : t('onramp.successTitle')}
              </CardTitle>
              <Badge variant="outline" className="font-mono text-xs bg-background">
                {request.reference_id}
              </Badge>
            </div>
            <CardDescription>
              {paymentLinkData ? t('offramp.paymentInfo') : t('onramp.sendExactly', { amount: Math.round(request.xof_amount).toLocaleString() })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-primary/5 border-2 border-primary/30 rounded-xl space-y-3">
              <div className="flex items-center justify-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <Label className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {t('onramp.uniqueId')}
                </Label>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold font-mono text-primary tracking-wide">{request.reference_id}</p>
              </div>
              <p className="text-[11px] text-center text-muted-foreground">
                {t('onramp.codeIdentifies')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('onramp.amountToSend')}</Label>
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
                <Label>{t('onramp.recipientAddress')}</Label>
                <div className="p-2 bg-muted rounded break-all font-mono text-xs">
                  {request.recipient_address}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('onramp.paymentInstructions')}</Label>
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Smartphone className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-medium">{t('onramp.destinationNumber')}</span>
                      <span className="font-mono font-bold text-primary">
                        {request.deposit_number 
                          ? `${selectedCountryData?.phone_prefix || ''} ${request.deposit_number}`
                          : t('onramp.notConfigured')
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="font-medium">{t('onramp.exactAmount')}</span>
                      <span className="font-mono">{Math.round(request.xof_amount).toLocaleString()} XOF</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('onramp.referenceToMention')} <span className="font-mono font-bold text-primary">{request.reference_id}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <Label>{t('onramp.status')}</Label>
              <Badge 
                variant={request.status === 'pending_momo_payment' ? 'secondary' : 'default'}
                className="text-sm px-3 py-1"
              >
                {request.status === 'pending_momo_payment' ? t('onramp.pendingMomo') : request.status}
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button onClick={resetForm} variant="outline" className="flex-1 hover-scale">
                {t('onramp.newRequest')}
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
                {t('onramp.refreshRate')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-in-up">
      <LiveConversionPreview
        fromAmount={formData.xofAmount}
        fromCurrency="XOF"
        toAmount={calculatedCrypto}
        toCurrency={formData.token}
        rate={exchangeRate?.onramp_rate}
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
                {t('onramp.title')}
              </CardTitle>
              <CardDescription className="mt-1">
                {t('onramp.description')}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs gap-1">
              <Sparkles className="h-3 w-3" />
              {t('onramp.noKyc')}
            </Badge>
          </div>
          
          <div className="mt-4">
            <FormStepIndicator steps={formSteps} />
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-3">
                <Label htmlFor="xofAmount" className="text-sm font-medium flex items-center gap-2">
                  {t('onramp.amountLabel')}
                </Label>
                
                <AmountPresets
                  presets={XOF_PRESETS}
                  currency="XOF"
                  onSelect={(amount) => setFormData({ ...formData, xofAmount: String(amount) })}
                  selectedAmount={formData.xofAmount}
                />
                
                <Input
                  id="xofAmount"
                  type="number"
                  placeholder={t('onramp.amountPlaceholder')}
                  min="1000"
                  max="600000"
                  step="1"
                  value={formData.xofAmount}
                  onChange={(e) => setFormData({ ...formData, xofAmount: e.target.value })}
                  className="text-base h-11"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {t('onramp.amountRange')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipientAddress" className="text-sm font-medium flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  {t('onramp.walletLabel', { network: currentNetwork?.name })}
                </Label>
                <Input
                  id="recipientAddress"
                  type="text"
                  placeholder={formData.network === 'solana' ? t('onramp.walletPlaceholder') : t('onramp.walletPlaceholderEvm')}
                  value={formData.recipientAddress}
                  onChange={(e) => setFormData({ ...formData, recipientAddress: e.target.value })}
                  className="text-base font-mono h-11"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {t('onramp.walletHint', { network: currentNetwork?.name, token: formData.token })}
                </p>
              </div>
            </div>

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

            <Card className="bg-muted/30 border-dashed">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="payment-link-onramp" className="cursor-pointer text-sm">
                      {t('onramp.paymentLink')}
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
                    <Label htmlFor="requester-name-onramp" className="text-xs">{t('onramp.requesterName')}</Label>
                    <Input
                      id="requester-name-onramp"
                      type="text"
                      placeholder={t('onramp.requesterNamePlaceholder')}
                      value={formData.requesterName}
                      onChange={(e) => setFormData({ ...formData, requesterName: e.target.value })}
                      className="h-9"
                      maxLength={100}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              className="w-full h-12 text-base bg-gradient-primary hover:opacity-90 transition-all duration-300" 
              disabled={loading || !exchangeRate || loadingRate || !isPhoneNumberValid || !selectedCountry || !formData.xofAmount || !formData.recipientAddress}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('onramp.submitting')}
                </>
              ) : (
                <>
                  <Coins className="mr-2 h-4 w-4" />
                  {formData.generatePaymentLink ? t('onramp.submitLinkBtn') : t('onramp.submitBtn')}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {exchangeRate && (
        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>{t('common.rate', { rate: Math.round(exchangeRate.final_rate), margin: (exchangeRate.margin * 100).toFixed(0) })}</p>
          <p>{t('common.updated', { date: new Date(exchangeRate.last_updated).toLocaleString() })}</p>
        </div>
      )}
    </div>
  );
};

export default OnrampForm;
