import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { Radio, AlertTriangle, FileText, LogOut, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CitizenLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  const links = [
    { to: '/report', label: 'Report', icon: AlertTriangle },
    { to: '/my-incidents', label: 'My Reports', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary" />
            <span className="text-lg font-bold text-foreground">Kaa-Rada</span>
          </Link>
          <div className="flex items-center gap-1">
            {links.map((link) => (
              <Link key={link.to} to={link.to}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-2 ${location.pathname === link.to ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium">Citizen</span>
          <span className="text-sm text-muted-foreground hidden sm:inline">{profile?.full_name}</span>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </nav>
      {children}
    </div>
  );
}
