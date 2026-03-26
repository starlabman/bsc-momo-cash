import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, Share2, QrCode } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(paymentLink);
      setCopied(true);
      toast({
        title: t('paymentLinkCard.copied'),
        description: t('paymentLinkCard.copiedDesc'),
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: t('errors.error'),
        description: t('paymentLinkCard.copyError'),
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `SikaPay`,
          text: `${amount} ${token}`,
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
            {t('paymentLinkCard.title')}
          </DialogTitle>
          <DialogDescription>
            {t('paymentLinkCard.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('paymentLinkCard.requestAmount')}</Label>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-lg">{amount} {token}</p>
              <p className="text-sm text-muted-foreground">
                {t('paymentLinkCard.type')}: {type === 'offramp' ? 'Crypto → Mobile Money' : 'Mobile Money → Crypto'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">{t('paymentLinkCard.label')}</Label>
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
              {t('paymentLinkCard.share')}
            </Button>
            <Button
              onClick={() => setShowQR(!showQR)}
              variant="outline"
              className="flex-1"
            >
              <QrCode className="mr-2 h-4 w-4" />
              {showQR ? t('paymentLinkCard.hideQr') : t('paymentLinkCard.qrCode')}
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
            <p>{t('paymentLinkCard.validity')}</p>
            <p className="mt-1">{t('paymentLinkCard.shareInfo')}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
