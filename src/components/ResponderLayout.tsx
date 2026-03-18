import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { Radio, LayoutDashboard, Map, ShieldCheck, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/dashboard', label: 'Queue', icon: LayoutDashboard },
  { to: '/map', label: 'Live Map', icon: Map },
];

export function ResponderLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  const isAdmin = profile?.role === 'admin';
  const allItems = isAdmin
    ? [...navItems, { to: '/admin', label: 'Admin', icon: ShieldCheck }]
    : navItems;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-16 lg:w-56 border-r border-border flex flex-col shrink-0">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Radio className="w-5 h-5 text-primary shrink-0" />
          <span className="text-lg font-bold text-foreground hidden lg:inline">Kaa-Rada</span>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {allItems.map((item) => (
            <Link key={item.to} to={item.to}>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 ${
                  location.pathname === item.to
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="hidden lg:inline">{item.label}</span>
              </Button>
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="hidden lg:block mb-2">
            <p className="text-sm text-foreground truncate">{profile?.full_name}</p>
            <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4" />
            <span className="hidden lg:inline">Sign Out</span>
          </Button>
        </div>
      </aside>
      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}
