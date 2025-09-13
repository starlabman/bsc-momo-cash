import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Network } from 'lucide-react';

export interface BlockchainNetwork {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  rpcUrl: string;
  chainId: number;
  blockExplorer: string;
  tokens: {
    symbol: string;
    address: string;
    decimals: number;
  }[];
}

export const SUPPORTED_NETWORKS: BlockchainNetwork[] = [
  {
    id: 'base',
    name: 'Base',
    symbol: 'BASE',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMwMDUyRkYiLz4KPHBhdGggZD0iTTEyIDEyaDhWMjBIMTJWMTJ6IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
    rpcUrl: 'https://mainnet.base.org',
    chainId: 8453,
    blockExplorer: 'https://basescan.org',
    tokens: [
      {
        symbol: 'USDC',
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        decimals: 6
      },
      {
        symbol: 'USDbC',
        address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
        decimals: 6
      }
    ]
  },
  {
    id: 'bsc',
    name: 'Binance Smart Chain',
    symbol: 'BSC',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNGM0JBMkYiLz4KPHBhdGggZD0iTTEwIDEyTDE2IDZMMjIgMTJMMjAgMTRMMTYgMTBMMTIgMTRMMTAgMTJ6TTYgMTZMMTAgMTJMOCAxMEw0IDE0VjE4TDggMjJMMTAgMjBMNiAxNnoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    chainId: 56,
    blockExplorer: 'https://bscscan.com',
    tokens: [
      {
        symbol: 'USDC',
        address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
        decimals: 18
      },
      {
        symbol: 'USDT',
        address: '0x55d398326f99059fF775485246999027B3197955',
        decimals: 18
      }
    ]
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM2MjdFRUEiLz4KPHBhdGggZD0iTTE1Ljk5IDRMMTUuODQgNC41M1YyMS4xOEwxNS45OSAyMS4zM0wyNCAxNy4wM0wxNS45OSA0WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTE1Ljk5IDRMOCAxNy4wM0wxNS45OSAyMS4zM1Y0WiIgZmlsbD0iI0Y3RjdGNyIvPgo8L3N2Zz4K',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    chainId: 1,
    blockExplorer: 'https://etherscan.io',
    tokens: [
      {
        symbol: 'USDC',
        address: '0xA0b86a33E6135FF96e4D2bF53A4C2e86B5ae4f8c',
        decimals: 6
      },
      {
        symbol: 'USDT',
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        decimals: 6
      }
    ]
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum One',
    symbol: 'ARB',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMzMzY5NEQiLz4KPHBhdGggZD0iTTEwIDEySDIyVjIwSDEwVjEyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    chainId: 42161,
    blockExplorer: 'https://arbiscan.io',
    tokens: [
      {
        symbol: 'USDC',
        address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        decimals: 6
      },
      {
        symbol: 'USDT',
        address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
        decimals: 6
      }
    ]
  },
  {
    id: 'optimism',
    name: 'Optimism',
    symbol: 'OP',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNGRjA0MjAiLz4KPHBhdGggZD0iTTEwIDEySDIyVjIwSDEwVjEyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
    rpcUrl: 'https://mainnet.optimism.io',
    chainId: 10,
    blockExplorer: 'https://optimistic.etherscan.io',
    tokens: [
      {
        symbol: 'USDC',
        address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
        decimals: 6
      },
      {
        symbol: 'USDT',
        address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
        decimals: 6
      }
    ]
  },
  {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'MATIC',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM4MjQ3RTUiLz4KPHBhdGggZD0iTTEwIDEySDIyVjIwSDEwVjEyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
    rpcUrl: 'https://polygon-rpc.com',
    chainId: 137,
    blockExplorer: 'https://polygonscan.com',
    tokens: [
      {
        symbol: 'USDC',
        address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        decimals: 6
      },
      {
        symbol: 'USDT',
        address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        decimals: 6
      }
    ]
  },
  {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMxNEY0OTUiLz4KPHBhdGggZD0iTTEwIDEySDIyVjIwSDEwVjEyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    chainId: 101,
    blockExplorer: 'https://solscan.io',
    tokens: [
      {
        symbol: 'USDC',
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        decimals: 6
      },
      {
        symbol: 'USDT',
        address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        decimals: 6
      }
    ]
  }
];

interface NetworkSelectorProps {
  selectedNetwork: string;
  onNetworkChange: (networkId: string) => void;
  selectedToken: string;
  onTokenChange: (token: string) => void;
  className?: string;
}

const NetworkSelector: React.FC<NetworkSelectorProps> = ({
  selectedNetwork,
  onNetworkChange,
  selectedToken,
  onTokenChange,
  className = ''
}) => {
  const currentNetwork = SUPPORTED_NETWORKS.find(n => n.id === selectedNetwork);
  const availableTokens = currentNetwork?.tokens || [];

  return (
    <div className={`space-y-4 animate-slide-in-up ${className}`}>
      <div className="space-y-2">
        <Label htmlFor="network" className="flex items-center gap-2">
          <Network className="h-4 w-4" />
          Réseau blockchain
        </Label>
        <Select value={selectedNetwork} onValueChange={onNetworkChange}>
          <SelectTrigger className="text-base hover:bg-muted/50 transition-colors">
            <SelectValue placeholder="Sélectionner un réseau" />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg z-50">
            {SUPPORTED_NETWORKS.map((network) => (
              <SelectItem 
                key={network.id} 
                value={network.id}
                className="hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <img 
                    src={network.icon} 
                    alt={network.name} 
                    className="w-6 h-6 rounded-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{network.name}</span>
                    <span className="text-xs text-muted-foreground">{network.symbol}</span>
                  </div>
                  <Badge variant="outline" className="ml-auto text-xs">
                    #{network.chainId}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="token">Token</Label>
        <Select 
          value={selectedToken} 
          onValueChange={onTokenChange}
          disabled={!currentNetwork}
        >
          <SelectTrigger className="text-base hover:bg-muted/50 transition-colors">
            <SelectValue placeholder="Sélectionner un token" />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg z-50">
            {availableTokens.map((token) => (
              <SelectItem 
                key={token.symbol} 
                value={token.symbol}
                className="hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between w-full">
                  <span>{token.symbol}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {currentNetwork?.symbol}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {currentNetwork && (
        <div className="p-4 bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-lg animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <img 
              src={currentNetwork.icon} 
              alt={currentNetwork.name} 
              className="w-8 h-8 rounded-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base">{currentNetwork.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {currentNetwork.symbol}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="outline" className="text-xs">
                  Chain ID: {currentNetwork.chainId}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {availableTokens.length} token{availableTokens.length > 1 ? 's' : ''} disponible{availableTokens.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Explorer:</span>{' '}
            <a 
              href={currentNetwork.blockExplorer} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {currentNetwork.blockExplorer}
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkSelector;