import { LayoutDashboard, ArrowRightLeft, ArrowDownUp, TrendingUp } from 'lucide-react';
import { NavLink } from '@/components/NavLink';

export function AdminSidebar() {
  return (
    <div className="w-64 bg-card border-r border-border p-4 space-y-6">
      <div className="space-y-1">
        <NavLink to="/admin" icon={LayoutDashboard} label="Dashboard" />
        <NavLink to="/admin#offramp" icon={ArrowRightLeft} label="Offramp" />
        <NavLink to="/admin#onramp" icon={ArrowDownUp} label="Onramp" />
      </div>

      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Statistiques
        </div>
        <NavLink to="/admin#stats-country" icon={TrendingUp} label="Par Pays" />
        <NavLink to="/admin#stats-blockchain" icon={TrendingUp} label="Par Réseau" />
        <NavLink to="/admin#stats-users" icon={TrendingUp} label="Utilisateurs" />
      </div>
    </div>
  );
}
