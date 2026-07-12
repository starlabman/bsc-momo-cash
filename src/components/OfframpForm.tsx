import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Coins, ArrowRight, Smartphone, CheckCircle, Globe, Share2, Copy, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { formatPhoneNumber } from '@/utils/phoneDetection';
import NetworkSelector, { SUPPORTED_NETWORKS } from '@/components/NetworkSelector';
import { CountryOperatorSelector, MobileOperator } from './CountryOperatorSelector';
import { Switch } from '@/components/ui/switch';
import { Link2 } from 'lucide-react';
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

interface OfframpRequest {
  id: string;
  reference_id: string;
  amount: number;
  token: string;
  momo_number: string;
  momo_provider: string;
  xof_amount: number;
  exchange_rate: number;
  deposit_address: string;
  token_address: string;
  network: string;
  status: string;
  created_at: string;
}

const OfframpForm = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingRate, setLoadingRate] = useState(true);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [calculatedXOF, setCalculatedXOF] = useState<number>(0);
  const [request, setRequest] = useState<OfframpRequest | null>(null);
  const [paymentLinkData, setPaymentLinkData] = useState<{link: string, type: 'offramp' | 'onramp'} | null>(null);
  
  const [formData, setFormData] = useState({
    amount: '',
    network: 'base',
    token: 'USDC',
    momoNumber: '',
    momoProvider: '',
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
    if (formData.amount && exchangeRate) {
      const amount = parseFloat(formData.amount);
      if (!isNaN(amount)) {
        setCalculatedXOF(amount * exchangeRate.offramp_rate);
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
      const amount = parseFloat(formData.amount);
      
      if (!amount || amount <= 0 || amount > 1000) {
        throw new Error(t('errors.amountRange'));
      }

      if (!formData.momoNumber || !selectedCountry || !isPhoneNumberValid) {
        throw new Error(t('errors.fillFields'));
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
        if (data.data.payment_link) {
          setPaymentLinkData({link: data.data.payment_link, type: 'offramp'});
          setRequest(data.data);
          toast({
            title: t('success.linkGenerated'),
            description: t('success.linkGeneratedDesc'),
          });
        } else {
          setRequest(data.data);
          toast({
            title: t('success.requestCreated'),
            description: t('success.requestCreatedDesc'),
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
      amount: '',
      network: 'base',
      token: 'USDC',
      momoNumber: '',
      momoProvider: '',
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
    { id: 'amount', label: t('common.steps.amount'), completed: !!formData.amount && parseFloat(formData.amount) > 0, active: !!formData.network && !formData.amount },
    { id: 'recipient', label: t('common.steps.recipient'), completed: isPhoneNumberValid, active: !!formData.amount && !isPhoneNumberValid },
    { id: 'confirm', label: t('common.steps.confirm'), completed: false, active: isPhoneNumberValid },
  ], [formData.network, formData.token, formData.amount, isPhoneNumberValid, t]);

  const USD_PRESETS = [10, 25, 50, 100, 250, 500];

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
                {paymentLinkData ? t('offramp.requestDetails') : t('offramp.successTitle')}
              </CardTitle>
              <Badge variant="outline" className="font-mono text-xs bg-background">
                {request.reference_id}
              </Badge>
            </div>
            <CardDescription>
              {paymentLinkData ? t('offramp.paymentInfo') : t('offramp.sendExactly', { amount: request.amount, token: request.token })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-primary/5 border-2 border-primary/30 rounded-xl space-y-3">
              <div className="flex items-center justify-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <Label className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {t('offramp.uniqueAddress')}
                </Label>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold font-mono text-primary tracking-wide">{request.reference_id}</p>
              </div>
              <div className="text-center">
                <Label className="text-xs text-muted-foreground">
                  {t('offramp.network')} {request.network?.toUpperCase() || ''} • {request.token}
                </Label>
                <div className="mt-1 p-3 bg-muted rounded-lg break-all font-mono text-xs hover:bg-muted/80 transition-colors cursor-pointer"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(request.deposit_address);
                      toast({ title: t('success.copied'), description: t('success.addressCopied') });
                    } catch {}
                  }}
                >
                  {request.deposit_address}
                </div>
              </div>
              <p className="text-[11px] text-center text-muted-foreground">
                {t('offramp.addressLinked')} <span className="font-mono font-bold text-primary">{request.reference_id}</span>
              </p>
            </div>

            <div className="flex justify-center">
              <div className="p-3 sm:p-4 bg-background border rounded-lg animate-scale-in">
                <QRCodeSVG 
                  value={request.deposit_address} 
                  size={window.innerWidth < 640 ? 160 : 200}
                  level="M"
                />
                <p className="text-center text-[10px] font-mono text-muted-foreground mt-2">{request.reference_id}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('offramp.amountToSend')}</Label>
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
                <Label>{t('offramp.momoNumber')}</Label>
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

            <div className="space-y-2">
              <Label>{t('offramp.status')}</Label>
              <Badge 
                variant={request.status === 'pending_payment' ? 'secondary' : 'default'}
                className="text-sm px-3 py-1"
              >
                {request.status === 'pending_payment' ? t('offramp.pendingPayment') : request.status}
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button onClick={resetForm} variant="outline" className="flex-1 hover-scale">
                {t('offramp.newRequest')}
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
                {t('offramp.refreshRate')}
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
        fromAmount={formData.amount}
        fromCurrency="USD"
        toAmount={calculatedXOF}
        toCurrency="XOF"
        rate={exchangeRate?.offramp_rate}
        loading={loadingRate}
        onRefresh={fetchExchangeRate}
      />

      <Card className="shadow-card border-primary/10 bg-gradient-card overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <Coins className="h-4 w-4 text-white" />
                </div>
                {t('offramp.title')}
              </CardTitle>
              <CardDescription className="mt-1">
                {t('offramp.description')}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs gap-1">
              <Sparkles className="h-3 w-3" />
              {t('offramp.noKyc')}
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

            <div className="space-y-3">
              <Label htmlFor="amount" className="text-sm font-medium flex items-center gap-2">
                {t('offramp.amountLabel')}
              </Label>
              
              <AmountPresets
                presets={USD_PRESETS}
                currency="$"
                onSelect={(amount) => setFormData({ ...formData, amount: String(amount) })}
                selectedAmount={formData.amount}
              />
              
              <Input
                id="amount"
                type="number"
                placeholder={t('offramp.amountPlaceholder')}
                min="1"
                max="1000"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="text-base h-11"
                required
              />
              <p className="text-xs text-muted-foreground">
                {t('offramp.amountRange')}
              </p>
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
                    <Label htmlFor="payment-link" className="cursor-pointer text-sm">
                      {t('offramp.paymentLink')}
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
                
                {formData.generatePaymentLink && (
                  <div className="space-y-2 mt-4 animate-fade-in">
                    <Label htmlFor="requester-name" className="text-xs">{t('offramp.requesterName')}</Label>
                    <Input
                      id="requester-name"
                      type="text"
                      placeholder={t('offramp.requesterNamePlaceholder')}
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
              disabled={loading || !exchangeRate || loadingRate || !isPhoneNumberValid || !selectedCountry || !formData.amount}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('offramp.submitting')}
                </>
              ) : (
                <>
                  <Coins className="mr-2 h-4 w-4" />
                  {formData.generatePaymentLink ? t('offramp.submitLinkBtn') : t('offramp.submitBtn')}
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

export default OfframpForm;
