import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Network, ExternalLink, Zap, Shield, Coins, Clock } from 'lucide-react';
import { SUPPORTED_NETWORKS, BlockchainNetwork } from './NetworkSelector';

interface EnhancedNetworkSelectorProps {
  selectedNetwork: string;
  onNetworkChange: (networkId: string) => void;
  selectedToken: string;
  onTokenChange: (token: string) => void;
  className?: string;
}

const NetworkFeatures = {
  base: { speed: 'Ultra rapide', fees: 'Très faibles', security: 'Sécurisé' },
  ethereum: { speed: 'Moyenne', fees: 'Élevées', security: 'Très sécurisé' },
  bsc: { speed: 'Rapide', fees: 'Faibles', security: 'Sécurisé' },
  arbitrum: { speed: 'Rapide', fees: 'Faibles', security: 'Très sécurisé' },
  optimism: { speed: 'Rapide', fees: 'Faibles', security: 'Très sécurisé' },
  polygon: { speed: 'Très rapide', fees: 'Très faibles', security: 'Sécurisé' },
  solana: { speed: 'Ultra rapide', fees: 'Très faibles', security: 'Sécurisé' }
};

const EnhancedNetworkSelector: React.FC<EnhancedNetworkSelectorProps> = ({
  selectedNetwork,
  onNetworkChange,
  selectedToken,
  onTokenChange,
  className = ''
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const currentNetwork = SUPPORTED_NETWORKS.find(n => n.id === selectedNetwork);
  const availableTokens = currentNetwork?.tokens || [];
  const features = NetworkFeatures[selectedNetwork as keyof typeof NetworkFeatures];

  const getFeatureColor = (type: string, value: string) => {
    const colors = {
      speed: {
        'Ultra rapide': 'text-green-600',
        'Très rapide': 'text-green-500',
        'Rapide': 'text-blue-500',
        'Moyenne': 'text-yellow-500'
      },
      fees: {
        'Très faibles': 'text-green-600',
        'Faibles': 'text-green-500',
        'Élevées': 'text-red-500'
      },
      security: {
        'Très sécurisé': 'text-green-600',
        'Sécurisé': 'text-green-500'
      }
    };
    return colors[type as keyof typeof colors]?.[value as keyof any] || 'text-muted-foreground';
  };

  return (
    <div className={`space-y-6 animate-slide-in-up ${className}`}>
      {/* Network Selection */}
      <div className="space-y-3">
        <Label htmlFor="network" className="flex items-center gap-2 text-base font-medium">
          <Network className="h-5 w-5 text-primary" />
          Réseau blockchain
        </Label>
        
        <Select value={selectedNetwork} onValueChange={onNetworkChange}>
          <SelectTrigger className="text-base h-12 hover:bg-muted/50 transition-all duration-300 border-2 hover:border-primary/30">
            <SelectValue placeholder="Sélectionner un réseau" />
          </SelectTrigger>
          <SelectContent className="bg-background border-2 shadow-xl z-50 max-w-sm">
            {SUPPORTED_NETWORKS.map((network) => (
              <SelectItem 
                key={network.id} 
                value={network.id}
                className="hover:bg-muted/50 transition-colors p-3 cursor-pointer"
              >
                <div className="flex items-center gap-3 w-full">
                  <span className="text-xl">{network.icon}</span>
                  <div className="flex flex-col flex-1">
                    <span className="font-medium text-sm">{network.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs px-2 py-0.5">
                        {network.symbol}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Chain {network.chainId}
                      </span>
                    </div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Token Selection */}
      <div className="space-y-3">
        <Label htmlFor="token" className="flex items-center gap-2 text-base font-medium">
          <Coins className="h-5 w-5 text-primary" />
          Token
        </Label>
        
        <Select 
          value={selectedToken} 
          onValueChange={onTokenChange}
          disabled={!currentNetwork}
        >
          <SelectTrigger className="text-base h-12 hover:bg-muted/50 transition-all duration-300 border-2 hover:border-primary/30">
            <SelectValue placeholder="Sélectionner un token" />
          </SelectTrigger>
          <SelectContent className="bg-background border-2 shadow-xl z-50">
            {availableTokens.map((token) => (
              <SelectItem 
                key={token.symbol} 
                value={token.symbol}
                className="hover:bg-muted/50 transition-colors p-3"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{token.symbol}</span>
                    <Badge variant="secondary" className="text-xs">
                      {token.decimals} dec
                    </Badge>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {currentNetwork?.symbol}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Network Details Card */}
      {currentNetwork && (
        <Card className="bg-gradient-to-br from-primary/5 via-transparent to-accent/5 border-primary/20 animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{currentNetwork.icon}</span>
                <div>
                  <h3 className="font-semibold text-lg">{currentNetwork.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      Chain ID: {currentNetwork.chainId}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(currentNetwork.blockExplorer, '_blank')}
                      className="h-6 px-2 text-xs hover:bg-primary/10"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Explorer
                    </Button>
                  </div>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="hover:bg-primary/10"
              >
                {showDetails ? 'Masquer' : 'Détails'}
              </Button>
            </div>

            {/* Network Features */}
            {features && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Vitesse</p>
                    <p className={`text-xs font-medium ${getFeatureColor('speed', features.speed)}`}>
                      {features.speed}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
                  <Coins className="h-4 w-4 text-blue-500" />
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Frais</p>
                    <p className={`text-xs font-medium ${getFeatureColor('fees', features.fees)}`}>
                      {features.fees}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
                  <Shield className="h-4 w-4 text-green-500" />
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Sécurité</p>
                    <p className={`text-xs font-medium ${getFeatureColor('security', features.security)}`}>
                      {features.security}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Available Tokens */}
            {showDetails && (
              <div className="animate-slide-in-down">
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Coins className="h-4 w-4" />
                    Tokens disponibles
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {availableTokens.map((token) => (
                      <div
                        key={token.symbol}
                        className="flex items-center justify-between p-2 bg-background/50 rounded-lg"
                      >
                        <span className="text-sm font-medium">{token.symbol}</span>
                        <Badge variant="outline" className="text-xs">
                          {token.decimals} dec
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedNetworkSelector;