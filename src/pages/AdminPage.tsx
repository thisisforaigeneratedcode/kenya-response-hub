import { useEffect, useState } from 'react';
import { supabase, Incident, Profile, KENYA_COUNTIES } from '@/lib/supabase';
import { ResponderLayout } from '@/components/ResponderLayout';
import { SeverityBadge } from '@/components/SeverityBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, AlertTriangle, Shield, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'incidents' | 'broadcast'>('stats');

  useEffect(() => {
    const fetchData = async () => {
      const { data: profilesData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setUsers((profilesData as Profile[]) || []);
      const { data: incidentsData } = await supabase.from('incidents').select('*, profiles(*)').order('created_at', { ascending: false });
      setIncidents((incidentsData as Incident[]) || []);
    };
    fetchData();
  }, []);

  const countyData = KENYA_COUNTIES.map((c) => ({
    county: c.substring(0, 8),
    count: incidents.filter((i) => i.county === c).length,
  })).filter((d) => d.count > 0).sort((a, b) => b.count - a.count).slice(0, 15);

  const statusCounts = {
    pending: incidents.filter((i) => i.status === 'pending').length,
    assigned: incidents.filter((i) => i.status === 'assigned').length,
    resolved: incidents.filter((i) => i.status === 'resolved').length,
  };

  const changeRole = async (userId: string, newRole: string) => {
    await supabase.from('profiles').update({ role: newRole }).eq('user_id', userId);
    setUsers(users.map((u) => u.user_id === userId ? { ...u, role: newRole as any } : u));
    toast.success('Role updated');
  };

  const tabs = [
    { key: 'stats', label: 'Statistics' },
    { key: 'users', label: 'Users' },
    { key: 'incidents', label: 'Incidents' },
    { key: 'broadcast', label: 'Broadcast' },
  ] as const;

  return (
    <ResponderLayout>
      <div className="flex-1 overflow-y-auto p-4">
        <h1 className="text-2xl font-bold text-foreground mb-6">Admin Dashboard</h1>

        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab(tab.key)}
              className={activeTab === tab.key ? 'bg-secondary text-foreground' : 'text-muted-foreground'}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="glass-card p-4 text-center">
                <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-3xl font-bold text-foreground">{users.length}</div>
                <div className="text-xs text-muted-foreground">Total Users</div>
              </div>
              <div className="glass-card p-4 text-center">
                <AlertTriangle className="w-6 h-6 text-warning mx-auto mb-2" />
                <div className="text-3xl font-bold text-foreground">{statusCounts.pending}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
              <div className="glass-card p-4 text-center">
                <Shield className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-3xl font-bold text-foreground">{statusCounts.assigned}</div>
                <div className="text-xs text-muted-foreground">Assigned</div>
              </div>
              <div className="glass-card p-4 text-center">
                <Shield className="w-6 h-6 text-success mx-auto mb-2" />
                <div className="text-3xl font-bold text-foreground">{statusCounts.resolved}</div>
                <div className="text-xs text-muted-foreground">Resolved</div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Incidents by County</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={countyData}>
                    <XAxis dataKey="county" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f8fafc' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {countyData.map((_, i) => <Cell key={i} fill="#38bdf8" />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr className="text-muted-foreground text-left">
                  <th className="p-3">Name</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">County</th>
                  <th className="p-3">Joined</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border/50">
                    <td className="p-3 text-foreground">{u.full_name}</td>
                    <td className="p-3">
                      <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground capitalize">{u.role}</span>
                    </td>
                    <td className="p-3 text-muted-foreground">{u.county}</td>
                    <td className="p-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      <Select value={u.role} onValueChange={(v) => changeRole(u.user_id, v)}>
                        <SelectTrigger className="h-7 text-xs bg-background border-border text-foreground w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="citizen">Citizen</SelectItem>
                          <SelectItem value="responder">Responder</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'incidents' && (
          <div className="glass-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr className="text-muted-foreground text-left">
                  <th className="p-3">Title</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">County</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc) => (
                  <tr key={inc.id} className="border-b border-border/50">
                    <td className="p-3 text-foreground">{inc.title}</td>
                    <td className="p-3 text-muted-foreground">{inc.incident_type}</td>
                    <td className="p-3"><SeverityBadge severity={inc.ai_severity ?? inc.severity_self} size="sm" /></td>
                    <td className="p-3 text-muted-foreground">{inc.county}</td>
                    <td className="p-3"><span className="capitalize text-xs">{inc.status}</span></td>
                    <td className="p-3 text-muted-foreground">{new Date(inc.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'broadcast' && (
          <div className="glass-card p-6 max-w-xl">
            <h3 className="text-lg font-semibold text-foreground mb-4">Broadcast Alert to Responders</h3>
            <div className="space-y-3">
              <Input
                value={broadcastSubject}
                onChange={(e) => setBroadcastSubject(e.target.value)}
                placeholder="Subject"
                className="bg-background border-border text-foreground"
              />
              <Textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Alert message..."
                className="bg-background border-border text-foreground min-h-[120px]"
              />
              <Button className="bg-severity-critical text-foreground gap-2" onClick={() => toast.info('Broadcast endpoint not yet configured')}>
                <Send className="w-4 h-4" />
                Send Broadcast
              </Button>
            </div>
          </div>
        )}
      </div>
    </ResponderLayout>
  );
}
