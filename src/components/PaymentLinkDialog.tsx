import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, Share2, QrCode } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';

interface PaymentLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentLink: string;
  amount: string;
  token: string;
  type: 'offramp' | 'onramp';
}

export const PaymentLinkDialog = ({ 
  open, 
  onOpenChange, 
  paymentLink,
  amount,
  token,
  type 
}: PaymentLinkDialogProps) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(paymentLink);
      setCopied(true);
      toast({
        title: "Copié !",
        description: "Le lien a été copié dans le presse-papier",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Demande de paiement CryptoMomo`,
          text: `Veuillez payer ${amount} ${token}`,
          url: paymentLink,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Lien de paiement généré
          </DialogTitle>
          <DialogDescription>
            Partagez ce lien avec la personne qui effectuera le paiement
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Montant de la demande</Label>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-lg">{amount} {token}</p>
              <p className="text-sm text-muted-foreground">
                Type: {type === 'offramp' ? 'Crypto → Mobile Money' : 'Mobile Money → Crypto'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">Lien de paiement</Label>
            <div className="flex gap-2">
              <Input
                id="link"
                value={paymentLink}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleShare}
              className="flex-1"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Partager
            </Button>
            <Button
              onClick={() => setShowQR(!showQR)}
              variant="outline"
              className="flex-1"
            >
              <QrCode className="mr-2 h-4 w-4" />
              {showQR ? 'Masquer' : 'QR Code'}
            </Button>
          </div>

          {showQR && (
            <div className="flex justify-center p-4 bg-background border rounded-lg">
              <QRCodeSVG 
                value={paymentLink} 
                size={200}
                level="M"
              />
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            <p>💡 Ce lien est valide pendant 7 jours</p>
            <p className="mt-1">La personne pourra utiliser ce lien pour effectuer le paiement</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
