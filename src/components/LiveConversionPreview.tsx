import React from 'react';
import { ArrowRight, TrendingUp, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';

interface LiveConversionPreviewProps {
  fromAmount: string;
  fromCurrency: string;
  toAmount: number;
  toCurrency: string;
  rate?: number;
  loading?: boolean;
  onRefresh?: () => void;
}

const LiveConversionPreview: React.FC<LiveConversionPreviewProps> = ({
  fromAmount,
  fromCurrency,
  toAmount,
  toCurrency,
  rate,
  loading,
  onRefresh
}) => {
  const { t } = useTranslation();
  const hasAmount = fromAmount && parseFloat(fromAmount) > 0;

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5 rounded-xl p-4 border border-primary/20">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5 rounded-xl p-3 sm:p-4 border border-primary/20 transition-all duration-300">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">{t('liveConversion.youSend')}</p>
          <p className={`text-base sm:text-xl font-bold transition-all duration-300 truncate ${hasAmount ? 'text-foreground' : 'text-muted-foreground'}`}>
            {hasAmount ? parseFloat(fromAmount).toLocaleString() : '0'} <span className="text-sm sm:text-xl">{fromCurrency}</span>
          </p>
        </div>
        
        <div className="flex flex-col items-center gap-0.5 sm:gap-1 shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          {rate && (
            <Badge variant="outline" className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5">
              1:{rate.toFixed(0)}
            </Badge>
          )}
        </div>
        
        <div className="flex-1 text-right min-w-0">
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">{t('liveConversion.youReceive')}</p>
          <p className={`text-base sm:text-xl font-bold transition-all duration-300 truncate ${hasAmount ? 'text-primary' : 'text-muted-foreground'}`}>
            {hasAmount ? toAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : '0'} <span className="text-sm sm:text-xl">{toCurrency}</span>
          </p>
        </div>
      </div>
      
      {onRefresh && (
        <div className="flex items-center justify-center mt-3 pt-3 border-t border-primary/10">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="text-xs text-muted-foreground hover:text-primary gap-1.5"
          >
            <RefreshCw className="h-3 w-3" />
            {t('liveConversion.refreshRate')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default LiveConversionPreview;
