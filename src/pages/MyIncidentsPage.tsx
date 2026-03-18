import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Incident } from '@/lib/supabase';
import { IncidentCard } from '@/components/IncidentCard';
import { StatusTimeline } from '@/components/StatusTimeline';
import { CitizenLayout } from '@/components/CitizenLayout';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function MyIncidentsPage() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('incidents')
        .select('*')
        .eq('reporter_id', user.id)
        .order('created_at', { ascending: false });
      setIncidents((data as any as Incident[]) || []);
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel('my-incidents-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents', filter: `reporter_id=eq.${user.id}` }, () => {
        fetch();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <CitizenLayout>
      <div className="max-w-4xl mx-auto p-6 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">My Disaster Support</h1>
            <p className="text-muted-foreground mt-1">Track your coordinates and responder communication in real-time.</p>
          </div>
          <Link to="/report">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6">
              New Incident Report
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground font-medium">Syncing with Kaa-Rada Command Center...</p>
          </div>
        ) : incidents.length === 0 ? (
          <div className="glass-card p-12 text-center border-dashed border-2">
            <AlertTriangle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">No Reports Found</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
              You haven't submitted any reports yet. If you are in danger, please use the SOS button below.
            </p>
            <Link to="/report">
              <Button variant="outline" className="text-primary hover:text-primary border-primary/20">
                Report an Incident
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {incidents.map((inc) => (
              <div key={inc.id} className="glass-card overflow-hidden hover:border-primary/50 transition-all border border-border/50">
                <IncidentCard incident={inc} showTimeline={false} className="border-none bg-transparent shadow-none" />
                <div className="px-4 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/20 pt-4 bg-muted/5">
                   <div className="w-full sm:w-auto">
                     <StatusTimeline status={inc.status} />
                   </div>
                   <Link to={`/messages/${inc.id}`} className="w-full sm:w-auto">
                     <Button size="sm" className="w-full bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-bold transition-all px-8">
                       OPEN LIVE CHAT
                     </Button>
                   </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CitizenLayout>
  );
}
