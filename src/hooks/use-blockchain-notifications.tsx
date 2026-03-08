import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresInsertPayload } from '@supabase/supabase-js';

interface BlockchainEvent {
  id: string;
  transaction_hash: string;
  network: string;
  token_symbol: string;
  amount: number;
  from_address: string;
  to_address: string;
  created_at: string;
  matched_request_type: string | null;
  offramp_request_id: string | null;
}

export function useBlockchainNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentEvents, setRecentEvents] = useState<BlockchainEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize Web Audio API
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Play notification sound using Web Audio API
  const playNotificationSound = useCallback(() => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Create a pleasant two-tone notification sound
    oscillator.frequency.value = 800; // First tone
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);

    // Second tone
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc2.frequency.value = 1000;
      gain2.gain.setValueAtTime(0.3, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + 0.15);
    }, 100);
  }, []);

  // Handle new blockchain event
  const handleNewEvent = useCallback((payload: RealtimePostgresInsertPayload<BlockchainEvent>) => {
    const newEvent = payload.new;
    
    setRecentEvents(prev => [newEvent, ...prev].slice(0, 20)); // Keep last 20 events
    setUnreadCount(prev => prev + 1);
    
    // Play notification sound
    playNotificationSound();
    
    console.log('🔔 New blockchain event detected:', {
      network: newEvent.network,
      token: newEvent.token_symbol,
      amount: newEvent.amount,
      hash: newEvent.transaction_hash.slice(0, 10) + '...'
    });
  }, [playNotificationSound]);

  // Subscribe to blockchain events
  useEffect(() => {
    const channel = supabase
      .channel('blockchain-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'blockchain_events'
        },
        handleNewEvent
      )
      .subscribe((status) => {
        console.log('Blockchain notifications subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [handleNewEvent]);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // Mark single event as read
  const markAsRead = useCallback((eventId: string) => {
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  return {
    unreadCount,
    recentEvents,
    isConnected,
    markAllAsRead,
    markAsRead
  };
}
