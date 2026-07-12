import React from 'react';
import { ArrowDown, RefreshCw, Smartphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { SUPPORTED_NETWORKS } from '@/components/NetworkSelector';
import AmountPresets from '@/components/AmountPresets';
import { useTranslation } from 'react-i18next';

export type SwapDirection = 'offramp' | 'onramp';

interface SwapCardProps {
  direction: SwapDirection;
  // Amount user types (on the SEND side)
  sendAmount: string;
  onSendAmountChange: (v: string) => void;
  sendCurrency: string; // "USDC" | "USDT" for offramp, "XOF" for onramp
  sendMin: number;
  sendMax: number;
  sendStep?: string;
  // Computed amount on the RECEIVE side (read only)
  receiveAmount: number;
  receiveCurrency: string;
  // Network context (only meaningful when direction involves crypto network)
  network?: string;
  // For onramp we need to know the token being received (USDC/USDT)
  token?: string;
  // Live rate metadata
  rate?: number;
  loading?: boolean;
  onRefresh?: () => void;
  // Presets rendered above the input (optional)
  presets?: number[];
  presetCurrency?: string;
  // Operator/country name shown on the Mobile Money side (optional)
  momoLabel?: string;
}

const formatNumber = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });

const SwapCard: React.FC<SwapCardProps> = ({
  direction,
  sendAmount,
  onSendAmountChange,
  sendCurrency,
  sendMin,
  sendMax,
  sendStep = '0.01',
  receiveAmount,
  receiveCurrency,
  network,
  token,
  rate,
  loading,
  onRefresh,
  presets,
  presetCurrency,
  momoLabel,
}) => {
  const { t } = useTranslation();
  const currentNetwork = SUPPORTED_NETWORKS.find((n) => n.id === network);

  // Which side is crypto (has a blockchain network)?
  const cryptoOnSend = direction === 'offramp';
  const hasAmount = sendAmount && parseFloat(sendAmount) > 0;

  const CryptoBadge = () => (
    <div className="flex items-center gap-2 rounded-full bg-background/60 backdrop-blur px-3 py-1.5 border border-primary/30 shadow-sm">
      {currentNetwork ? (
        <img
          src={currentNetwork.icon}
          alt={currentNetwork.name}
          className="w-5 h-5 rounded-full"
        />
      ) : (
        <div className="w-5 h-5 rounded-full bg-primary/20" />
      )}
      <span className="text-xs font-semibold text-foreground">
        {currentNetwork?.symbol || '—'}
      </span>
    </div>
  );

  const MomoBadge = () => (
    <div className="flex items-center gap-2 rounded-full bg-background/60 backdrop-blur px-3 py-1.5 border border-orange-500/40 shadow-sm">
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
        <Smartphone className="h-3 w-3 text-white" />
      </div>
      <span className="text-xs font-semibold text-foreground">
        {momoLabel || 'Mobile Money'}
      </span>
    </div>
  );

  const TokenPill = ({ symbol, tone }: { symbol: string; tone: 'crypto' | 'fiat' }) => (
    <div
      className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 font-bold text-sm shrink-0 ${
        tone === 'crypto'
          ? 'bg-gradient-to-br from-primary/20 to-violet-500/10 border border-primary/30 text-primary'
          : 'bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/40 text-orange-500'
      }`}
    >
      <span
        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white ${
          tone === 'crypto'
            ? 'bg-gradient-to-br from-primary to-violet-600'
            : 'bg-gradient-to-br from-orange-500 to-amber-500'
        }`}
      >
        {symbol.charAt(0)}
      </span>
      {symbol}
    </div>
  );

  return (
    <div className="relative rounded-3xl p-[1.5px] bg-gradient-to-br from-primary/40 via-violet-500/20 to-orange-500/40 shadow-2xl">
      <div className="relative rounded-[calc(1.5rem-1px)] bg-card/95 backdrop-blur-xl overflow-hidden">
        {/* SEND SIDE */}
        <div className="relative p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] sm:text-xs font-bold tracking-[0.15em] text-muted-foreground uppercase">
              {t('swapCard.youSend', 'Vous envoyez')}
            </span>
            {cryptoOnSend ? <CryptoBadge /> : <MomoBadge />}
          </div>

          {presets && presets.length > 0 && (
            <div className="mb-3">
              <AmountPresets
                presets={presets}
                currency={presetCurrency || sendCurrency}
                onSelect={(amount) => onSendAmountChange(String(amount))}
                selectedAmount={sendAmount}
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0"
              min={sendMin}
              max={sendMax}
              step={sendStep}
              value={sendAmount}
              onChange={(e) => onSendAmountChange(e.target.value)}
              className="flex-1 h-14 sm:h-16 text-2xl sm:text-4xl font-bold bg-transparent border-0 shadow-none px-0 focus-visible:ring-0 placeholder:text-muted-foreground/40"
              aria-label={t('swapCard.youSend', 'Vous envoyez')}
              required
            />
            <TokenPill
              symbol={sendCurrency}
              tone={cryptoOnSend ? 'crypto' : 'fiat'}
            />
          </div>

          <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
            Min: {sendMin.toLocaleString()} • Max: {sendMax.toLocaleString()} {sendCurrency}
          </p>
        </div>

        {/* DIVIDER + ARROW */}
        <div className="relative">
          <div className="border-t border-dashed border-border/60" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary via-violet-500 to-orange-500 p-[2px] shadow-lg shadow-primary/30">
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                <ArrowDown className="h-4 w-4 text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* RECEIVE SIDE */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-br from-muted/30 via-transparent to-orange-500/5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] sm:text-xs font-bold tracking-[0.15em] text-muted-foreground uppercase">
              {t('swapCard.youReceive', 'Vous recevez')}
            </span>
            {cryptoOnSend ? <MomoBadge /> : <CryptoBadge />}
          </div>

          <div className="flex items-center gap-3">
            {loading ? (
              <Skeleton className="h-14 sm:h-16 flex-1" />
            ) : (
              <div
                className={`flex-1 h-14 sm:h-16 flex items-center text-2xl sm:text-4xl font-bold truncate ${
                  hasAmount ? 'text-foreground' : 'text-muted-foreground/40'
                }`}
              >
                {hasAmount ? formatNumber(receiveAmount) : '0'}
              </div>
            )}
            <TokenPill
              symbol={receiveCurrency}
              tone={cryptoOnSend ? 'fiat' : 'crypto'}
            />
          </div>

          {/* RATE FOOTER */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
              {rate ? (
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono border-primary/30 bg-primary/5"
                >
                  1 {cryptoOnSend ? sendCurrency : receiveCurrency} ≈ {rate.toFixed(0)} XOF
                </Badge>
              ) : (
                <span>—</span>
              )}
            </div>
            {onRefresh && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="text-[10px] sm:text-xs h-7 gap-1.5 text-muted-foreground hover:text-primary"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                {t('liveConversion.refreshRate', 'Actualiser')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwapCard;
