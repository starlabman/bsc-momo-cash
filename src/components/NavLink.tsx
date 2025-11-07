import React from 'react';
import { LucideIcon } from 'lucide-react';

interface NavLinkProps {
  to: string;
  icon: LucideIcon;
  label: string;
}

export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ to, icon: Icon, label }, ref) => {
    const isActive = window.location.pathname + window.location.hash === to || 
                     (to === '/admin' && window.location.hash === '');
    
    return (
      <a
        ref={ref}
        href={to}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
          isActive 
            ? 'bg-primary text-primary-foreground' 
            : 'hover:bg-accent text-muted-foreground hover:text-foreground'
        }`}
      >
        <Icon className="h-5 w-5" />
        <span className="font-medium">{label}</span>
      </a>
    );
  }
);

NavLink.displayName = 'NavLink';
