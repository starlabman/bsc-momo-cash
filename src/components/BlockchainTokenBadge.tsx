import React from 'react';
import { Badge } from '@/components/ui/badge';

// Map des icônes blockchain (base64 SVG)
const NETWORK_ICONS: Record<string, string> = {
  'BASE': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMwMDUyRkYiLz4KPHBhdGggZD0iTTEyIDEyaDhWMjBIMTJWMTJ6IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
  'BSC': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNGM0JBMkYiLz4KPHBhdGggZD0iTTEwIDEyTDE2IDZMMjIgMTJMMjAgMTRMMTYgMTBMMTIgMTRMMTAgMTJ6TTYgMTZMMTAgMTJMOCAxMEw0IDE0VjE4TDggMjJMMTAgMjBMNiAxNnoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=',
  'ETH': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM2MjdFRUEiLz4KPHBhdGggZD0iTTE1Ljk5IDRMMTUuODQgNC41M1YyMS4xOEwxNS45OSAyMS4zM0wyNCAxNy4wM0wxNS45OSA0WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTE1Ljk5IDRMOCAxNy4wM0wxNS45OSAyMS4zM1Y0WiIgZmlsbD0iI0Y3RjdGNyIvPgo8L3N2Zz4K',
  'ETHEREUM': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM2MjdFRUEiLz4KPHBhdGggZD0iTTE1Ljk5IDRMMTUuODQgNC41M1YyMS4xOEwxNS45OSAyMS4zM0wyNCAxNy4wM0wxNS45OSA0WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTE1Ljk5IDRMOCAxNy4wM0wxNS45OSAyMS4zM1Y0WiIgZmlsbD0iI0Y3RjdGNyIvPgo8L3N2Zz4K',
  'ARB': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMzMzY5NEQiLz4KPHBhdGggZD0iTTEwIDEySDIyVjIwSDEwVjEyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
  'ARBITRUM': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMzMzY5NEQiLz4KPHBhdGggZD0iTTEwIDEySDIyVjIwSDEwVjEyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
  'OP': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNGRjA0MjAiLz4KPHBhdGggZD0iTTEwIDEySDIyVjIwSDEwVjEyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
  'OPTIMISM': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNGRjA0MjAiLz4KPHBhdGggZD0iTTEwIDEySDIyVjIwSDEwVjEyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
  'MATIC': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM4MjQ3RTUiLz4KPHBhdGggZD0iTTEwIDEySDIyVjIwSDEwVjEyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
  'POLYGON': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM4MjQ3RTUiLz4KPHBhdGggZD0iTTEwIDEySDIyVjIwSDEwVjEyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
  'SOL': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMxNEY0OTUiLz4KPHBhdGggZD0iTTEwIDEySDIyVjIwSDEwVjEyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
  'SOLANA': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMxNEY0OTUiLz4KPHBhdGggZD0iTTEwIDEySDIyVjIwSDEwVjEyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
  'TRX': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNFQjAwMjkiLz4KPHBhdGggZD0iTTEwIDEySDIyVjIwSDEwVjEyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
  'TRON': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNFQjAwMjkiLz4KPHBhdGggZD0iTTEwIDEySDIyVjIwSDEwVjEyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
  'LISK': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMwMDMzRkYiLz4KPHBhdGggZD0iTTEwIDEySDIyVjIwSDEwVjEyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
  'LSK': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMwMDMzRkYiLz4KPHBhdGggZD0iTTEwIDEySDIyVjIwSDEwVjEyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
};

// Couleurs de fond pour les badges par réseau
const NETWORK_COLORS: Record<string, string> = {
  'BASE': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'BSC': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  'ETH': 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  'ETHEREUM': 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  'ARB': 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  'ARBITRUM': 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  'OP': 'bg-red-500/10 text-red-600 border-red-500/20',
  'OPTIMISM': 'bg-red-500/10 text-red-600 border-red-500/20',
  'MATIC': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  'POLYGON': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  'SOL': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  'SOLANA': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  'TRX': 'bg-red-600/10 text-red-700 border-red-600/20',
  'TRON': 'bg-red-600/10 text-red-700 border-red-600/20',
  'LISK': 'bg-blue-600/10 text-blue-700 border-blue-600/20',
  'LSK': 'bg-blue-600/10 text-blue-700 border-blue-600/20',
};

interface BlockchainTokenBadgeProps {
  token: string; // Format: "USDC-BASE" ou "USDT-BSC"
  showAmount?: boolean;
  amount?: number;
  className?: string;
}

/**
 * Parse le token pour extraire le symbole et le réseau
 * Format attendu: "USDC-BASE", "USDT-BSC", etc.
 */
const parseToken = (token: string): { symbol: string; network: string } => {
  const parts = token.split('-');
  if (parts.length >= 2) {
    return {
      symbol: parts[0].toUpperCase(),
      network: parts.slice(1).join('-').toUpperCase()
    };
  }
  return { symbol: token.toUpperCase(), network: '' };
};

const BlockchainTokenBadge: React.FC<BlockchainTokenBadgeProps> = ({
  token,
  showAmount = false,
  amount,
  className = ''
}) => {
  const { symbol, network } = parseToken(token);
  const networkIcon = NETWORK_ICONS[network];
  const networkColorClass = NETWORK_COLORS[network] || 'bg-muted text-muted-foreground border-border';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showAmount && amount !== undefined && (
        <span className="font-medium">{amount}</span>
      )}
      <Badge 
        variant="outline" 
        className={`flex items-center gap-1.5 px-2 py-1 ${networkColorClass}`}
      >
        {networkIcon && (
          <img 
            src={networkIcon} 
            alt={network} 
            className="w-4 h-4 rounded-full"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        <span className="font-medium">{symbol}</span>
        {network && (
          <span className="text-xs opacity-75">({network})</span>
        )}
      </Badge>
    </div>
  );
};

export default BlockchainTokenBadge;
