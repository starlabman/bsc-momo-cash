import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useBlockchainNotifications } from '@/hooks/use-blockchain-notifications';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const BlockchainNotificationBell = () => {
  const { unreadCount, recentEvents, isConnected, markAllAsRead } = useBlockchainNotifications();

  const getNetworkColor = (network: string) => {
    const colors: Record<string, string> = {
      'base': 'bg-blue-500/10 text-blue-500',
      'bsc': 'bg-yellow-500/10 text-yellow-500',
      'ethereum': 'bg-purple-500/10 text-purple-500',
      'arbitrum': 'bg-sky-500/10 text-sky-500',
      'optimism': 'bg-red-500/10 text-red-500',
      'polygon': 'bg-purple-600/10 text-purple-600',
      'avalanche': 'bg-red-600/10 text-red-600',
      'lisk': 'bg-green-500/10 text-green-500',
      'solana': 'bg-gradient-to-r from-purple-500/10 to-cyan-500/10 text-purple-500'
    };
    return colors[network.toLowerCase()] || 'bg-gray-500/10 text-gray-500';
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-lg"
          aria-label="Notifications blockchain"
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          {isConnected && (
            <span className="absolute bottom-0 right-0 h-2 w-2 bg-green-500 rounded-full border border-background animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold text-sm">Transactions Blockchain</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
              {isConnected ? 'LIVE' : 'Déconnecté'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-7"
            >
              Tout marquer lu
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {recentEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Aucune transaction récente</p>
            </div>
          ) : (
            <div className="divide-y">
              {recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] px-1.5 py-0 ${getNetworkColor(event.network)}`}
                        >
                          {event.network.toUpperCase()}
                        </Badge>
                        <span className="text-xs font-semibold">
                          {event.amount} {event.token_symbol}
                        </span>
                      </div>
                      
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {event.transaction_hash.slice(0, 10)}...{event.transaction_hash.slice(-8)}
                      </p>
                      
                      {event.matched_request_type && (
                        <Badge variant="secondary" className="text-[10px] mt-1.5">
                          ✓ Matched {event.matched_request_type}
                        </Badge>
                      )}
                    </div>
                    
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(event.created_at), { 
                        addSuffix: true,
                        locale: fr 
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default BlockchainNotificationBell;
