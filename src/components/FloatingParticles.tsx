import React, { useMemo } from 'react';

interface FloatingItem {
  id: number;
  type: 'blockchain' | 'country';
  icon: string;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

// Blockchain logos as inline SVGs
const BlockchainIcons: Record<string, React.ReactNode> = {
  ethereum: (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <path fill="#627EEA" d="M16 0l-.5.8V21.8l.5.5 9-5.3z"/>
      <path fill="#8C8C8C" d="M16 0L7 17l9 5.3V0z"/>
      <path fill="#627EEA" d="M16 24.3l-.3.4v6.9l.3.4 9-12.7z"/>
      <path fill="#8C8C8C" d="M16 32V24.3L7 19.3z"/>
      <path fill="#343434" d="M16 22.3l9-5.3-9-4.1z"/>
      <path fill="#8C8C8C" d="M7 17l9 5.3v-9.4z"/>
    </svg>
  ),
  bsc: (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle cx="16" cy="16" r="16" fill="#F3BA2F"/>
      <path fill="#fff" d="M12.1 14.5L16 10.6l3.9 3.9 2.3-2.3L16 6l-6.2 6.2 2.3 2.3zm-2.3 1.5l2.3-2.3 2.3 2.3-2.3 2.3-2.3-2.3zm6.2 0l2.3-2.3 2.3 2.3-2.3 2.3-2.3-2.3zm6.2 0l2.3-2.3 2.3 2.3-2.3 2.3-2.3-2.3zm-6.2 6.2l-3.9-3.9-2.3 2.3L16 26l6.2-6.2-2.3-2.3-3.9 3.9z"/>
    </svg>
  ),
  solana: (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <defs>
        <linearGradient id="solana-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00FFA3"/>
          <stop offset="100%" stopColor="#DC1FFF"/>
        </linearGradient>
      </defs>
      <rect rx="6" fill="url(#solana-grad)" width="32" height="32"/>
      <path fill="#fff" d="M9 20.5l2-2h12l-2 2H9zm0-5l2-2h12l-2 2H9zm14-3l-2-2H9l2 2h12z"/>
    </svg>
  ),
  arbitrum: (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle cx="16" cy="16" r="16" fill="#213147"/>
      <path fill="#12AAFF" d="M16 6l8 14-8 6-8-6 8-14z"/>
      <path fill="#fff" d="M16 8l6.5 11.5L16 24l-6.5-4.5L16 8z"/>
    </svg>
  ),
  optimism: (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle cx="16" cy="16" r="16" fill="#FF0420"/>
      <text x="16" y="21" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">OP</text>
    </svg>
  ),
  base: (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle cx="16" cy="16" r="16" fill="#0052FF"/>
      <circle cx="16" cy="16" r="8" fill="#fff"/>
    </svg>
  ),
  polygon: (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle cx="16" cy="16" r="16" fill="#8247E5"/>
      <path fill="#fff" d="M21 13l-3-2-5 3v6l5 3 3-2v-4l-3 2-2-1v-3l2-1 3 2v-3z"/>
    </svg>
  ),
  avalanche: (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle cx="16" cy="16" r="16" fill="#E84142"/>
      <path fill="#fff" d="M21 22H18L16 12L14 22H11L16 8L21 22Z"/>
    </svg>
  ),
};

// Country flags as emojis
const CountryFlags = ['🇨🇮', '🇸🇳', '🇧🇯', '🇹🇬', '🇧🇫', '🇲🇱', '🇳🇪', '🇬🇳'];

const FloatingParticles = () => {
  const blockchainKeys = Object.keys(BlockchainIcons);
  
  const items = useMemo<FloatingItem[]>(() => {
    const allItems: FloatingItem[] = [];
    
    // Create blockchain particles
    for (let i = 0; i < 12; i++) {
      allItems.push({
        id: i,
        type: 'blockchain',
        icon: blockchainKeys[i % blockchainKeys.length],
        x: Math.random() * 90 + 5,
        y: Math.random() * 90 + 5,
        size: Math.random() * 20 + 24,
        duration: Math.random() * 25 + 20,
        delay: Math.random() * 15,
        opacity: Math.random() * 0.4 + 0.15,
      });
    }
    
    // Create country flag particles
    for (let i = 0; i < 10; i++) {
      allItems.push({
        id: i + 12,
        type: 'country',
        icon: CountryFlags[i % CountryFlags.length],
        x: Math.random() * 90 + 5,
        y: Math.random() * 90 + 5,
        size: Math.random() * 16 + 20,
        duration: Math.random() * 30 + 25,
        delay: Math.random() * 20,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }
    
    return allItems;
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Large gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
      <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-violet-500/10 rounded-full blur-[100px] animate-pulse [animation-delay:4s]" />
      
      {/* Floating blockchain logos and country flags */}
      {items.map((item) => (
        <div
          key={`${item.type}-${item.id}`}
          className="absolute transition-transform"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            width: `${item.size}px`,
            height: `${item.size}px`,
            opacity: item.opacity,
            animation: `float-particle ${item.duration}s ease-in-out infinite`,
            animationDelay: `${item.delay}s`,
          }}
        >
          {item.type === 'blockchain' ? (
            <div className="w-full h-full drop-shadow-lg">
              {BlockchainIcons[item.icon]}
            </div>
          ) : (
            <span 
              className="block drop-shadow-md"
              style={{ fontSize: `${item.size}px`, lineHeight: 1 }}
            >
              {item.icon}
            </span>
          )}
        </div>
      ))}
      
      {/* Connecting lines effect - subtle grid */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.02]">
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
};

export default FloatingParticles;
