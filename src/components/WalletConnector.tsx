import React from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, ChevronDown, Copy, ExternalLink, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const getNetworkLogo = (chainId: number) => {
  switch (chainId) {
    case 8453: // Base
      return (
        <svg width="16" height="16" viewBox="0 0 111 111" className="inline">
          <path d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 21.8699 0.239624 49.8840H72.8538V60.1597H0.239624C2.35281 88.1738 26.0432 110.034 54.921 110.034Z" fill="#0052FF"/>
        </svg>
      );
    case 1: // Ethereum
      return (
        <svg width="16" height="16" viewBox="0 0 256 417" className="inline">
          <path d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z" fill="#343434"/>
          <path d="M127.962 0L0 212.32l127.962 75.639V154.158z" fill="#8C8C8C"/>
          <path d="M127.961 312.187l-1.575 1.92v98.199l1.575 4.6L256 236.587z" fill="#3C3C3B"/>
          <path d="M127.962 416.905v-104.72L0 236.585z" fill="#8C8C8C"/>
          <path d="M127.961 287.958l127.96-75.637-127.96-58.162z" fill="#141414"/>
          <path d="M0 212.32l127.96 75.638v-133.8z" fill="#393939"/>
        </svg>
      );
    case 42161: // Arbitrum
      return (
        <svg width="16" height="16" viewBox="0 0 64 64" className="inline">
          <circle cx="32" cy="32" r="32" fill="#28A0F0"/>
          <path d="M32 8L48 40H40L32 24L24 40H16L32 8Z" fill="white"/>
        </svg>
      );
    case 10: // Optimism
      return (
        <svg width="16" height="16" viewBox="0 0 256 256" className="inline">
          <circle cx="128" cy="128" r="128" fill="#FF0420"/>
          <path d="M128 32C67.157 32 18 81.157 18 142s49.157 110 110 110 110-49.157 110-110S188.843 32 128 32zm0 180c-38.66 0-70-31.34-70-70s31.34-70 70-70 70 31.34 70 70-31.34 70-70 70z" fill="white"/>
        </svg>
      );
    case 137: // Polygon
      return (
        <svg width="16" height="16" viewBox="0 0 38.4 33.5" className="inline">
          <path d="M29,10.2c-0.7-0.4-1.6-0.4-2.4,0L21,13.5l-3.8,2.1l-5.5,3.3c-0.7,0.4-1.6,0.4-2.4,0L5,16.3c-0.7-0.4-1.2-1.2-1.2-2.1v-5c0-0.8,0.4-1.6,1.2-2.1l4.3-2.5c0.7-0.4,1.6-0.4,2.4,0L16,7.2c0.7,0.4,1.2,1.2,1.2,2.1v3.3l3.8-2.2V7c0-0.8-0.4-1.6-1.2-2.1L12.5,1.7c-0.7-0.4-1.6-0.4-2.4,0L2.8,4.8c-0.8,0.4-1.2,1.2-1.2,2.1v6.4c0,0.8,0.4,1.6,1.2,2.1L9.1,19c0.7,0.4,1.6,0.4,2.4,0l5.5-3.2l3.8-2.2l5.5-3.2c0.7-0.4,1.6-0.4,2.4,0l4.3,2.5c0.7,0.4,1.2,1.2,1.2,2.1v5c0,0.8-0.4,1.6-1.2,2.1L29,24.6c-0.7,0.4-1.6,0.4-2.4,0l-4.3-2.5c-0.7-0.4-1.2-1.2-1.2-2.1V16l-3.8,2.2v3.3c0,0.8,0.4,1.6,1.2,2.1l7.2,4.2c0.7,0.4,1.6,0.4,2.4,0l7.2-4.2c0.8-0.4,1.2-1.2,1.2-2.1v-6.4C37.2,14.3,36.8,13.5,37.2,12.7z" fill="#8247E5"/>
        </svg>
      );
    case 56: // BSC
      return (
        <svg width="16" height="16" viewBox="0 0 256 256" className="inline">
          <circle cx="128" cy="128" r="128" fill="#F3BA2F"/>
          <path d="M116.4 121.6L128 110l11.6 11.6 19.8-19.8L128 70.4l-31.4 31.4 19.8 19.8zm-19.8 12.8L108.2 128l-11.6-6.4L96 140.8l11.6 11.6 19.8-19.8zm23.4 23.4L128 146.4l11.6 11.6 19.8-19.8L128 106.8l-31.4 31.4 19.8 19.8z" fill="white"/>
        </svg>
      );
    default:
      return <Wallet className="h-4 w-4" />;
  }
};

const WalletConnector: React.FC = () => {
  const { toast } = useToast();
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast({
        title: "Adresse copiée",
        description: "L'adresse du portefeuille a été copiée",
      });
    }
  };

  const openExplorer = () => {
    if (address && chain?.blockExplorers?.default) {
      window.open(`${chain.blockExplorers.default.url}/address/${address}`, '_blank');
    }
  };

  if (isConnected && address) {
    return (
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-700 dark:text-green-300">
                  Portefeuille connecté
                </span>
              </div>
              {chain && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center gap-1.5">
                  {getNetworkLogo(chain.id)}
                  {chain.name}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyAddress}
                className="h-8 w-8 p-0 hover:bg-green-100 dark:hover:bg-green-900"
              >
                <Copy className="h-4 w-4" />
              </Button>
              
              {chain?.blockExplorers?.default && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openExplorer}
                  className="h-8 w-8 p-0 hover:bg-green-100 dark:hover:bg-green-900"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => disconnect()}
                className="text-xs border-green-200 hover:bg-green-100 dark:border-green-800 dark:hover:bg-green-900"
              >
                Déconnecter
              </Button>
            </div>
          </div>
          
          <div className="mt-2">
            <p className="text-sm font-mono text-muted-foreground break-all">
              {address}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
      <CardContent className="p-4">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <span className="font-medium">Connecter un portefeuille</span>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Connectez votre portefeuille pour une expérience optimisée
          </p>
          
          <div className="grid grid-cols-1 gap-2">
            {connectors.map((connector) => (
              <Button
                key={connector.uid}
                onClick={() => connect({ connector })}
                disabled={isPending}
                variant="outline"
                className="justify-center hover:bg-primary/10 border-primary/20"
              >
                {connector.name}
                {connector.name === 'MetaMask' && ' 🦊'}
                {connector.name === 'WalletConnect' && ' 🔗'}
                {connector.name === 'Coinbase Wallet' && ' 🔵'}
              </Button>
            ))}
          </div>
          
          <p className="text-xs text-muted-foreground">
            La connexion du portefeuille est optionnelle mais recommandée pour Base
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletConnector;