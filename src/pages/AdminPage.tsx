import * as React from 'react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Incident, Profile, KENYA_COUNTIES, getResponders, assignResponder, sendBroadcast } from '@/lib/supabase';
import { ResponderLayout } from '@/components/ResponderLayout';
import { SeverityBadge } from '@/components/SeverityBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, AlertTriangle, Shield, Send, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [responders, setResponders] = useState<Profile[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'specific' | 'emails'>('all');
  const [selectedResponderIds, setSelectedResponderIds] = useState<string[]>([]);
  const [customEmails, setCustomEmails] = useState('');
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'incidents' | 'broadcast'>('stats');

  useEffect(() => {
    const fetchData = async () => {
      const { data: profilesData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      const allProfiles = (profilesData as Profile[]) || [];
      setUsers(allProfiles);
      setResponders(allProfiles.filter(p => p.role === 'responder' || p.role === 'admin'));

      const { data: incidentsData } = await supabase.from('incidents').select('*').order('created_at', { ascending: false });
      setIncidents((incidentsData as any as Incident[]) || []);

      const { data: assignmentsData } = await supabase.from('assignments').select('*');
      setAssignments(assignmentsData || []);
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
                {incidents.map((inc) => {
                  const assignment = assignments.find(a => a.incident_id === inc.id);
                  const assignedResponder = assignment ? responders.find(r => r.user_id === assignment.responder_id) : null;
                  
                  return (
                    <tr key={inc.id} className="border-b border-border/50">
                      <td className="p-3 text-foreground">{inc.title}</td>
                      <td className="p-3 text-muted-foreground">{inc.incident_type}</td>
                      <td className="p-3"><SeverityBadge severity={inc.ai_severity ?? inc.severity_self} size="sm" /></td>
                      <td className="p-3 text-muted-foreground">{inc.county}</td>
                      <td className="p-3">
                        <Select 
                          value={assignment?.responder_id || 'unassigned'} 
                          onValueChange={async (val) => {
                            if (val === 'unassigned') return;
                            toast.loading('Assigning responder...');
                            try {
                              await assignResponder(inc.id, val);
                              const { data: assignmentsData } = await supabase.from('assignments').select('*');
                              setAssignments(assignmentsData || []);
                              const { data: incidentsData } = await supabase.from('incidents').select('*').order('created_at', { ascending: false });
                              setIncidents((incidentsData as any as Incident[]) || []);
                              toast.dismiss();
                              toast.success('Responder assigned');
                            } catch (e: any) {
                              toast.dismiss();
                              toast.error('Failed to assign: ' + e.message);
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs bg-background border-border text-foreground w-40">
                            <SelectValue placeholder="Assign Responder" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            <SelectItem value="unassigned">-- Unassigned --</SelectItem>
                            {responders.map(r => (
                              <SelectItem key={r.user_id} value={r.user_id}>{r.full_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3 text-muted-foreground">{new Date(inc.created_at).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'broadcast' && (
          <div className="glass-card p-6 max-w-2xl">
            <h3 className="text-lg font-semibold text-foreground mb-4">Broadcast Alert</h3>
            
            <div className="mb-6 space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Recipients</Label>
                <div className="flex gap-3">
                  <Button 
                    variant={broadcastTarget === 'all' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setBroadcastTarget('all')}
                  >
                    All Responders
                  </Button>
                  <Button 
                    variant={broadcastTarget === 'specific' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setBroadcastTarget('specific')}
                  >
                    Specific Responders
                  </Button>
                  <Button 
                    variant={broadcastTarget === 'emails' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setBroadcastTarget('emails')}
                  >
                    Custom Emails
                  </Button>
                </div>
              </div>

              {broadcastTarget === 'specific' && (
                <div className="p-4 bg-secondary/30 rounded-lg border border-border">
                  <Label className="text-xs mb-3 block">Select Responders</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2">
                    {responders.map(r => (
                      <div key={r.user_id} className="flex items-center space-x-2 bg-background/50 p-2 rounded border border-border/50">
                        <Checkbox 
                          id={`resp-${r.user_id}`} 
                          checked={selectedResponderIds.includes(r.user_id)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedResponderIds([...selectedResponderIds, r.user_id]);
                            else setSelectedResponderIds(selectedResponderIds.filter(id => id !== r.user_id));
                          }}
                        />
                        <label htmlFor={`resp-${r.user_id}`} className="text-xs font-medium cursor-pointer flex-1">
                          {r.full_name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {broadcastTarget === 'emails' && (
                <div className="space-y-2">
                  <Label className="text-xs">Custom Responder Emails (comma separated)</Label>
                  <Input 
                    placeholder="e.g. unit1@redcross.org, duty@gov.ke" 
                    value={customEmails}
                    onChange={(e) => setCustomEmails(e.target.value)}
                    className="bg-background border-border text-foreground"
                  />
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
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
              <Button 
                className="w-full bg-severity-critical text-foreground gap-2 h-12 text-lg" 
                onClick={async () => {
                  if (!broadcastSubject || !broadcastMessage) {
                    toast.error('Please enter a subject and message');
                    return;
                  }
                  
                  const targetIds = broadcastTarget === 'specific' ? selectedResponderIds : undefined;
                  const targetEmailsList = broadcastTarget === 'emails' ? customEmails.split(',').map(e => e.trim()).filter(e => e) : undefined;

                  if (broadcastTarget === 'specific' && (!targetIds || targetIds.length === 0)) {
                    toast.error('Please select at least one responder');
                    return;
                  }

                  toast.loading('Sending broadcast...');
                  try {
                    const { success, error } = await sendBroadcast(broadcastSubject, broadcastMessage, targetIds, targetEmailsList);
                    if (success) {
                      toast.success('Broadcast sent successfully');
                      setBroadcastSubject('');
                      setBroadcastMessage('');
                      setSelectedResponderIds([]);
                      setCustomEmails('');
                    } else {
                      throw new Error(error);
                    }
                  } catch (err: any) {
                    toast.error(err.message || 'Failed to send broadcast');
                  } finally {
                    toast.dismiss();
                  }
                }}
              >
                <Send className="w-5 h-5" />
                Dispatch Alert
              </Button>
            </div>
          </div>
        )}
      </div>
    </ResponderLayout>
  );
}
