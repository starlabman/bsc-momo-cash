import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle, ArrowRight, Smartphone, DollarSign, Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { formatPhoneNumber } from '@/utils/phoneDetection';
import { useTranslation } from 'react-i18next';

const PaymentLink = () => {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentRequest = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.functions.invoke('get-payment-request', {
        body: { token }
      });

      if (fetchError) throw fetchError;

      if (data.success) {
        setRequest(data.data);
      } else {
        setError(data.error || t('paymentPage.notFoundOrExpired'));
      }
    } catch (err) {
      console.error('Error fetching payment request:', err);
      setError(t('paymentPage.loadError'));
      toast({
        title: t('errors.error'),
        description: t('paymentPage.loadError'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPaymentRequest();
    }
  }, [token]);

  useEffect(() => {
    if (!request?.id) return;

    const table = request.type === 'offramp' ? 'offramp_requests' : 'onramp_requests';
    
    const channel = supabase
      .channel(`payment-status-${request.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: table,
          filter: `id=eq.${request.id}`
        },
        (payload) => {
          console.log('Status update received:', payload);
          setRequest((prev: any) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [request?.id, request?.type]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">{t('paymentPage.loading')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              {t('paymentPage.invalidLink')}
            </CardTitle>
            <CardDescription>{error || t('paymentPage.invalidDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              {t('paymentPage.backHome')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOfframp = request.type === 'offramp';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                {t('paymentPage.paymentRequest')} {isOfframp ? 'Crypto → Mobile Money' : 'Mobile Money → Crypto'}
              </CardTitle>
              <Badge variant="outline" className="font-mono text-xs bg-background">
                {request.reference_id}
              </Badge>
            </div>
            <CardDescription>
              {request.requester_name && t('paymentPage.from', { name: request.requester_name })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-center">
              <Label className="text-xs text-muted-foreground">{t('paymentPage.transactionRef')}</Label>
              <p className="text-xl font-bold font-mono text-primary">{request.reference_id}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('paymentPage.mentionOnPayment')}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isOfframp ? (
                <>
                  <div className="space-y-2">
                    <Label>{t('paymentPage.amountToSend')}</Label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-lg px-3 py-2">
                        {request.amount} {request.token}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline" className="text-lg px-3 py-2">
                        {Math.round(request.xof_amount).toLocaleString()} XOF
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('paymentPage.momoReceiveNumber')}</Label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Smartphone className="h-4 w-4 text-primary" />
                      <span className="font-medium">{formatPhoneNumber(request.momo_number)}</span>
                      {request.momo_provider && (
                        <Badge variant="outline">{request.momo_provider}</Badge>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>{t('paymentPage.amountToPay')}</Label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-lg px-3 py-2">
                        {Math.round(request.xof_amount).toLocaleString()} XOF
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline" className="text-lg px-3 py-2">
                        {request.crypto_amount.toFixed(6)} {request.token}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('paymentPage.recipientAddress')}</Label>
                    <div className="p-2 bg-muted rounded break-all font-mono text-xs">
                      {request.recipient_address}
                    </div>
                  </div>
                </>
              )}
            </div>

            {isOfframp ? (
              <div className="space-y-4">
                <div className="text-center">
                  <Label className="text-base font-medium">
                    {t('paymentPage.depositAddress', { token: request.token })}
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

                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-4">
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">{t('paymentPage.instructions')}</p>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>{t('paymentPage.offrampStep1')}</li>
                        <li>{t('paymentPage.offrampStep2', { amount: request.amount, token: request.token })}</li>
                        <li>{t('paymentPage.offrampStep3', { amount: Math.round(request.xof_amount).toLocaleString() })}</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-primary" />
                      <span className="font-medium">{t('paymentPage.onrampDestNumber')}</span>
                      <span className="font-mono">+221 77 XXX XX XX</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="font-medium">{t('paymentPage.onrampExactAmount')}</span>
                      <span className="font-mono">{Math.round(request.xof_amount).toLocaleString()} XOF</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('paymentPage.onrampRefMention')} <span className="font-mono font-bold text-primary">{request.reference_id}</span>
                    </p>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium">{t('paymentPage.instructions')}</p>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground mt-2">
                        <li>{t('paymentPage.onrampStep1', { amount: Math.round(request.xof_amount).toLocaleString() })}</li>
                        <li>{t('paymentPage.onrampStep2')}</li>
                        <li>{t('paymentPage.onrampStep3', { amount: request.crypto_amount.toFixed(6), token: request.token })}</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label>{t('paymentPage.status')}</Label>
              <Badge 
                variant={request.status.includes('pending') ? 'secondary' : 'default'}
                className="text-sm px-3 py-1"
              >
                {request.status === 'pending_payment' ? t('paymentPage.pendingCrypto') : 
                 request.status === 'pending_momo_payment' ? t('paymentPage.pendingMomo') :
                 request.status}
              </Badge>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>{t('paymentPage.validUntil', { date: new Date(request.link_expires_at).toLocaleString() })}</p>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                {t('paymentPage.backHome')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentLink;
