import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface Token {
  symbol: string;
  name: string;
  address?: string;
  decimals?: number;
  icon?: React.ReactNode;
}

interface TokenSelectorProps {
  tokens: Token[];
  selectedToken: string;
  onTokenChange: (token: string) => void;
  label?: string;
  className?: string;
}

const getTokenIcon = (symbol: string) => {
  switch (symbol.toUpperCase()) {
    case 'USDC':
      return (
        <svg width="20" height="20" viewBox="0 0 256 256" className="inline">
          <circle cx="128" cy="128" r="128" fill="#2775CA"/>
          <path d="M128 48C89.3 48 58 79.3 58 118s31.3 70 70 70 70-31.3 70-70-31.3-70-70-70zm0 120c-27.6 0-50-22.4-50-50s22.4-50 50-50 50 22.4 50 50-22.4 50-50 50z" fill="white"/>
          <path d="M128 88c-16.5 0-30 13.5-30 30h12c0-9.9 8.1-18 18-18s18 8.1 18 18-8.1 18-18 18h-6v12h6c16.5 0 30-13.5 30-30s-13.5-30-30-30z" fill="white"/>
        </svg>
      );
    case 'USDT':
      return (
        <svg width="20" height="20" viewBox="0 0 256 256" className="inline">
          <circle cx="128" cy="128" r="128" fill="#26A17B"/>
          <path d="M149.15 109.82v-4.12h19.68V88.07h-77.66v17.63h19.68v4.12c-20.52 1.98-35.8 6.86-35.8 12.67 0 7.31 22.25 13.24 49.7 13.24s49.7-5.93 49.7-13.24c0-5.81-15.28-10.69-35.8-12.67h.5z" fill="white"/>
          <path d="M128 109.82c-27.45 0-49.7 5.93-49.7 13.24s22.25 13.24 49.7 13.24 49.7-5.93 49.7-13.24-22.25-13.24-49.7-13.24z" fill="white"/>
        </svg>
      );
    case 'ETH':
      return (
        <svg width="20" height="20" viewBox="0 0 256 417" className="inline">
          <path d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z" fill="#343434"/>
          <path d="M127.962 0L0 212.32l127.962 75.639V154.158z" fill="#8C8C8C"/>
          <path d="M127.961 312.187l-1.575 1.92v98.199l1.575 4.6L256 236.587z" fill="#3C3C3B"/>
          <path d="M127.962 416.905v-104.72L0 236.585z" fill="#8C8C8C"/>
        </svg>
      );
    case 'BNB':
      return (
        <svg width="20" height="20" viewBox="0 0 256 256" className="inline">
          <circle cx="128" cy="128" r="128" fill="#F3BA2F"/>
          <path d="M116.4 121.6L128 110l11.6 11.6 19.8-19.8L128 70.4l-31.4 31.4 19.8 19.8z" fill="white"/>
        </svg>
      );
    case 'MATIC':
      return (
        <svg width="20" height="20" viewBox="0 0 38.4 33.5" className="inline">
          <path d="M29,10.2c-0.7-0.4-1.6-0.4-2.4,0L21,13.5l-3.8,2.1l-5.5,3.3c-0.7,0.4-1.6,0.4-2.4,0L5,16.3c-0.7-0.4-1.2-1.2-1.2-2.1v-5c0-0.8,0.4-1.6,1.2-2.1l4.3-2.5c0.7-0.4,1.6-0.4,2.4,0L16,7.2c0.7,0.4,1.2,1.2,1.2,2.1v3.3l3.8-2.2V7c0-0.8-0.4-1.6-1.2-2.1L12.5,1.7c-0.7-0.4-1.6-0.4-2.4,0L2.8,4.8c-0.8,0.4-1.2,1.2-1.2,2.1v6.4c0,0.8,0.4,1.6,1.2,2.1L9.1,19c0.7,0.4,1.6,0.4,2.4,0l5.5-3.2l3.8-2.2l5.5-3.2c0.7-0.4,1.6-0.4,2.4,0l4.3,2.5c0.7,0.4,1.2,1.2,1.2,2.1v5c0,0.8-0.4,1.6-1.2,2.1L29,24.6c-0.7,0.4-1.6,0.4-2.4,0l-4.3-2.5c-0.7-0.4-1.2-1.2-1.2-2.1V16l-3.8,2.2v3.3c0,0.8,0.4,1.6,1.2,2.1l7.2,4.2c0.7,0.4,1.6,0.4,2.4,0l7.2-4.2c0.8-0.4,1.2-1.2,1.2-2.1v-6.4C37.2,14.3,36.8,13.5,37.2,12.7z" fill="#8247E5"/>
        </svg>
      );
    default:
      return (
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <span className="text-xs font-bold text-white">{symbol.charAt(0)}</span>
        </div>
      );
  }
};

const TokenSelector: React.FC<TokenSelectorProps> = ({
  tokens,
  selectedToken,
  onTokenChange,
  label = "Token",
  className = ""
}) => {
  const selectedTokenInfo = tokens.find(t => t.symbol === selectedToken);

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="token">{label}</Label>
      <Select value={selectedToken} onValueChange={onTokenChange}>
        <SelectTrigger id="token" className="h-12">
          <SelectValue>
            {selectedTokenInfo && (
              <div className="flex items-center gap-3">
                {getTokenIcon(selectedTokenInfo.symbol)}
                <div className="flex flex-col text-left">
                  <span className="font-medium">{selectedTokenInfo.symbol}</span>
                  <span className="text-xs text-muted-foreground">{selectedTokenInfo.name}</span>
                </div>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {tokens.map((token) => (
            <SelectItem key={token.symbol} value={token.symbol} className="h-14">
              <div className="flex items-center gap-3 w-full">
                {getTokenIcon(token.symbol)}
                <div className="flex flex-col flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{token.symbol}</span>
                    <Badge variant="secondary" className="text-xs">
                      {token.name}
                    </Badge>
                  </div>
                  {token.address && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {token.address.slice(0, 8)}...{token.address.slice(-6)}
                    </span>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TokenSelector;