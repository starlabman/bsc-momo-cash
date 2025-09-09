import React from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, ChevronDown, Copy, ExternalLink, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
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