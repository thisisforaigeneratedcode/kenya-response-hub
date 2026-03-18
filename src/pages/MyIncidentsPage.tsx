import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Incident } from '@/lib/supabase';
import { IncidentCard } from '@/components/IncidentCard';
import { CitizenLayout } from '@/components/CitizenLayout';
import { Link } from 'react-router-dom';
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
  }, [user]);

  return (
    <CitizenLayout>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">My Incident Reports</h1>
        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading reports...</div>
        ) : incidents.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No incidents reported yet</p>
            <Link to="/report" className="text-primary text-sm hover:underline mt-2 inline-block">
              Report your first incident
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {incidents.map((inc) => (
              <Link key={inc.id} to={`/messages/${inc.id}`}>
                <IncidentCard incident={inc} showTimeline className="mb-3" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </CitizenLayout>
  );
}
