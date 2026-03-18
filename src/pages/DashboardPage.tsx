import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Incident } from '@/lib/supabase';
import { IncidentCard } from '@/components/IncidentCard';
import { SeverityBadge } from '@/components/SeverityBadge';
import { ResponderLayout } from '@/components/ResponderLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, CheckCircle2, User, X, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { KENYA_COUNTIES, INCIDENT_TYPES } from '@/lib/supabase';

export default function DashboardPage() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCounty, setFilterCounty] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [messageText, setMessageText] = useState('');
  const [assigning, setAssigning] = useState(false);

  const [stats, setStats] = useState({ total: 0, critical: 0, mine: 0, resolved: 0 });

  const fetchIncidents = async () => {
    let query = supabase
      .from('incidents')
      .select('*')
      .order('severity_self', { ascending: false })
      .order('created_at', { ascending: false });

    if (filterStatus !== 'all') query = query.eq('status', filterStatus);
    if (filterCounty !== 'all') query = query.eq('county', filterCounty);
    if (filterType !== 'all') query = query.eq('incident_type', filterType);

    const { data } = await query;
    setIncidents((data as any as Incident[]) || []);
    setLoading(false);
  };

  const fetchStats = async () => {
    const { count: total } = await supabase.from('incidents').select('*', { count: 'exact', head: true });
    const { count: critical } = await supabase.from('incidents').select('*', { count: 'exact', head: true }).gte('severity_self', 4);
    const { count: mine } = await supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('responder_id', user?.id || '');
    const today = new Date().toISOString().split('T')[0];
    const { count: resolved } = await supabase.from('incidents').select('*', { count: 'exact', head: true }).eq('status', 'resolved').gte('created_at', today);
    setStats({ total: total || 0, critical: critical || 0, mine: mine || 0, resolved: resolved || 0 });
  };

  useEffect(() => {
    fetchIncidents();
    fetchStats();
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => {
        fetchIncidents();
        fetchStats();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [filterStatus, filterCounty, filterType]);

  const assignToMe = async () => {
    if (!selectedIncident || !user) return;
    setAssigning(true);
    try {
      await supabase.from('assignments').insert({
        incident_id: selectedIncident.id,
        responder_id: user.id,
      });
      await supabase.from('incidents').update({ status: 'assigned' }).eq('id', selectedIncident.id);
      toast.success('Incident assigned to you');
      setSelectedIncident({ ...selectedIncident, status: 'assigned' });
      fetchIncidents();
      fetchStats();
    } catch {
      toast.error('Failed to assign');
    }
    setAssigning(false);
  };

  const sendMessage = async () => {
    if (!selectedIncident || !user || !messageText.trim()) return;
    await supabase.from('messages').insert({
      incident_id: selectedIncident.id,
      sender_id: user.id,
      content: messageText.trim(),
    });
    setMessageText('');
    toast.success('Message sent');
  };

  const statCards = [
    { label: 'Total Incidents', value: stats.total, icon: <AlertTriangle className="w-5 h-5" />, color: 'text-primary' },
    { label: 'Critical', value: stats.critical, icon: <AlertTriangle className="w-5 h-5" />, color: 'text-severity-critical' },
    { label: 'Assigned to Me', value: stats.mine, icon: <User className="w-5 h-5" />, color: 'text-severity-medium' },
    { label: 'Resolved Today', value: stats.resolved, icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-success' },
  ];

  return (
    <ResponderLayout>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 border-b border-border">
          {statCards.map((s) => (
            <div key={s.label} className="glass-card p-3 flex items-center gap-3">
              <div className={s.color}>{s.icon}</div>
              <div>
                <div className="text-2xl font-bold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 p-4 border-b border-border flex-wrap">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 bg-background border-border text-foreground text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCounty} onValueChange={setFilterCounty}>
            <SelectTrigger className="w-40 bg-background border-border text-foreground text-sm">
              <SelectValue placeholder="County" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border max-h-60">
              <SelectItem value="all">All Counties</SelectItem>
              {KENYA_COUNTIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-44 bg-background border-border text-foreground text-sm">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Types</SelectItem>
              {INCIDENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Incident list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <p className="text-muted-foreground text-center py-12">Loading incidents...</p>
            ) : incidents.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No active incidents reported in this sector</p>
              </div>
            ) : (
              incidents.map((inc) => (
                <IncidentCard
                  key={inc.id}
                  incident={inc}
                  onClick={() => setSelectedIncident(inc)}
                  className={selectedIncident?.id === inc.id ? 'border-primary/50' : ''}
                />
              ))
            )}
          </div>

          {/* Detail panel */}
          {selectedIncident && (
            <div className="w-96 border-l border-border overflow-y-auto p-4 hidden lg:block">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Incident Details</h3>
                <Button variant="ghost" size="sm" onClick={() => setSelectedIncident(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-foreground">{selectedIncident.title}</h4>
                  <div className="flex gap-2 mt-2">
                    <SeverityBadge severity={selectedIncident.ai_severity ?? selectedIncident.severity_self} />
                    <span className="text-xs px-2 py-1 rounded bg-secondary text-muted-foreground">{selectedIncident.incident_type}</span>
                  </div>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{selectedIncident.description}</p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>County: {selectedIncident.county}</p>
                  {selectedIncident.lat && <p>GPS: {selectedIncident.lat}, {selectedIncident.lng}</p>}
                  <p>Reporter: {selectedIncident.profiles?.full_name || 'Unknown'}</p>
                </div>
                {selectedIncident.photo_url && (
                  <img src={selectedIncident.photo_url} alt="Incident" className="rounded-xl border border-border w-full" />
                )}
                {selectedIncident.ai_safety_guide && (
                  <div className="ai-glow rounded-xl p-3 border border-ai-purple/25 bg-ai-purple/5 text-sm text-foreground/90">
                    <p className="text-xs text-ai-purple font-medium mb-1">AI Safety Guide</p>
                    {selectedIncident.ai_safety_guide}
                  </div>
                )}
                {selectedIncident.status === 'pending' && (
                  <Button onClick={assignToMe} disabled={assigning} className="w-full bg-primary text-primary-foreground gap-2">
                    {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
                    Assign to Me
                  </Button>
                )}
                <div className="flex gap-2">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Send message to reporter..."
                    className="bg-background border-border text-foreground text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button size="sm" onClick={sendMessage} className="bg-primary text-primary-foreground shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ResponderLayout>
  );
}
