import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Network, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';

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
        symbol: 'USDT',
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
        address: 'Fq9sgX7UHqEEwpVMu7UKjpstQGcf1JD3kPnUTYRbEdcZ',
        decimals: 6
      },
      {
        symbol: 'USDT',
        address: 'Fq9sgX7UHqEEwpVMu7UKjpstQGcf1JD3kPnUTYRbEdcZ',
        decimals: 6
      }
    ]
  },
  {
    id: 'avalanche',
    name: 'Avalanche',
    symbol: 'AVAX',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNFODQxNDIiLz4KPHBhdGggZD0iTTIxIDIySDE4TDE2IDEyTDE0IDIySDExTDE2IDhMMjEgMjJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    chainId: 43114,
    blockExplorer: 'https://snowtrace.io',
    tokens: [
      {
        symbol: 'USDC',
        address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
        decimals: 6
      },
      {
        symbol: 'USDT',
        address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
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
    <div className={`space-y-6 animate-slide-in-up ${className}`}>
      {/* Network Selection */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-base font-semibold">
          <Network className="h-5 w-5 text-primary" />
          Sélectionner le réseau
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {SUPPORTED_NETWORKS.map((network) => (
            <Card
              key={network.id}
              onClick={() => onNetworkChange(network.id)}
              className={`
                relative p-4 cursor-pointer transition-all duration-300
                hover:shadow-lg hover:scale-[1.02] border-2
                ${selectedNetwork === network.id 
                  ? 'border-primary bg-primary/5 shadow-primary' 
                  : 'border-border hover:border-primary/50'
                }
              `}
            >
              {selectedNetwork === network.id && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
              <div className="flex flex-col items-center gap-2 text-center">
                <img 
                  src={network.icon} 
                  alt={network.name} 
                  className="w-10 h-10 rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div className="space-y-1">
                  <p className="font-semibold text-sm">{network.name}</p>
                  <Badge variant="outline" className="text-xs">
                    {network.symbol}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Token Selection */}
      {currentNetwork && (
        <div className="space-y-3 animate-slide-in-up">
          <Label className="text-base font-semibold">
            Sélectionner le token sur {currentNetwork.name}
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {availableTokens.map((token) => (
              <Card
                key={token.symbol}
                onClick={() => onTokenChange(token.symbol)}
                className={`
                  relative p-4 cursor-pointer transition-all duration-300
                  hover:shadow-lg hover:scale-[1.02] border-2
                  ${selectedToken === token.symbol 
                    ? 'border-primary bg-primary/5 shadow-primary' 
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                {selectedToken === token.symbol && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {token.symbol.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{token.symbol}</p>
                    <p className="text-xs text-muted-foreground">
                      {token.decimals} decimals
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Network Info */}
          <Card className="p-4 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <div className="flex items-start gap-3">
              <img 
                src={currentNetwork.icon} 
                alt={currentNetwork.name} 
                className="w-10 h-10 rounded-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{currentNetwork.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {currentNetwork.symbol}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Chain #{currentNetwork.chainId}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{availableTokens.length} tokens disponibles</span>
                  <span>•</span>
                  <a 
                    href={currentNetwork.blockExplorer} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Explorer ↗
                  </a>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default NetworkSelector;