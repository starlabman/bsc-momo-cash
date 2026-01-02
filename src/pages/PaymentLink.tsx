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

const PaymentLink = () => {
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
        setError(data.error || 'Demande de paiement introuvable ou expirée');
      }
    } catch (err) {
      console.error('Error fetching payment request:', err);
      setError('Impossible de charger la demande de paiement');
      toast({
        title: "Erreur",
        description: "Impossible de charger la demande de paiement",
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

  // Real-time subscription for status updates
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
            <p className="text-muted-foreground">Chargement de la demande de paiement...</p>
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
              Lien invalide ou expiré
            </CardTitle>
            <CardDescription>{error || 'Cette demande de paiement n\'existe pas ou a expiré'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Retour à l'accueil
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
                Demande de paiement {isOfframp ? 'Crypto → Mobile Money' : 'Mobile Money → Crypto'}
              </CardTitle>
              <Badge variant="outline" className="font-mono text-xs bg-background">
                {request.reference_id}
              </Badge>
            </div>
            <CardDescription>
              {request.requester_name && `De: ${request.requester_name}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Reference ID prominently displayed */}
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-center">
              <Label className="text-xs text-muted-foreground">Référence de transaction</Label>
              <p className="text-xl font-bold font-mono text-primary">{request.reference_id}</p>
              <p className="text-xs text-muted-foreground mt-1">À mentionner lors du paiement</p>
            </div>
            {/* Transaction Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isOfframp ? (
                <>
                  <div className="space-y-2">
                    <Label>Montant à envoyer</Label>
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
                    <Label>Numéro de réception Mobile Money</Label>
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
                    <Label>Montant à payer</Label>
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
                    <Label>Adresse de réception</Label>
                    <div className="p-2 bg-muted rounded break-all font-mono text-xs">
                      {request.recipient_address}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Payment Instructions */}
            {isOfframp ? (
              <div className="space-y-4">
                <div className="text-center">
                  <Label className="text-base font-medium">
                    Adresse de dépôt ({request.token})
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
                      <p className="font-medium">Instructions:</p>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Scannez le QR code ou copiez l'adresse ci-dessus</li>
                        <li>Envoyez exactement {request.amount} {request.token}</li>
                        <li>Le bénéficiaire recevra {Math.round(request.xof_amount).toLocaleString()} XOF sur son Mobile Money</li>
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
                      <span className="font-medium">Numéro de destination :</span>
                      <span className="font-mono">+221 77 XXX XX XX</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="font-medium">Montant exact :</span>
                      <span className="font-mono">{Math.round(request.xof_amount).toLocaleString()} XOF</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Référence à mentionner : <span className="font-mono font-bold text-primary">{request.reference_id}</span>
                    </p>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium">Instructions:</p>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground mt-2">
                        <li>Envoyez {Math.round(request.xof_amount).toLocaleString()} XOF via Mobile Money</li>
                        <li>Mentionnez la référence dans le message</li>
                        <li>Le bénéficiaire recevra {request.crypto_amount.toFixed(6)} {request.token}</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status */}
            <div className="space-y-2">
              <Label>Statut</Label>
              <Badge 
                variant={request.status.includes('pending') ? 'secondary' : 'default'}
                className="text-sm px-3 py-1"
              >
                {request.status === 'pending_payment' ? 'En attente de paiement crypto' : 
                 request.status === 'pending_momo_payment' ? 'En attente de paiement Mobile Money' :
                 request.status}
              </Badge>
            </div>

            {/* Expiry */}
            <div className="text-sm text-muted-foreground">
              <p>Lien valide jusqu'au : {new Date(request.link_expires_at).toLocaleString('fr-FR')}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                Retour à l'accueil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentLink;
