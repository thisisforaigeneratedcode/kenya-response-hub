import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Message, Incident } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SeverityBadge } from '@/components/SeverityBadge';
import { StatusTimeline } from '@/components/StatusTimeline';
import { Send, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export default function MessagesPage() {
  const { incidentId } = useParams<{ incidentId: string }>();
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [shelters, setShelters] = useState<any[]>([]);
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!incidentId) return;

    const fetchIncident = async () => {
      console.log("Fetching incident context:", incidentId);
      const { data, error } = await supabase.from('incidents').select('*, profiles(*)').eq('id', incidentId).single();
      if (error) {
        console.error("Error fetching incident:", error);
        return;
      }
      const incData = data as any as Incident;
      setIncident(incData);
      
      if (incData.county) {
        const { data: shelterData } = await supabase
          .from('shelters' as any)
          .select('*')
          .eq('county', incData.county)
          .limit(3);
        setShelters(shelterData || []);
      }
    };

    const fetchMessages = async () => {
      console.log("Fetching messages for:", incidentId);
      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles(*)')
        .eq('incident_id', incidentId)
        .order('created_at', { ascending: true });
      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }
      setMessages((data as any as Message[]) || []);
    };

    fetchIncident();
    fetchMessages();

    console.log("Subscribing to real-time updates for incident:", incidentId);
    const channel = supabase
      .channel(`incident-live-${incidentId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `incident_id=eq.${incidentId}` 
      }, (payload) => {
        console.log("New real-time message received:", payload);
        fetchMessages();
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'incidents', 
        filter: `id=eq.${incidentId}` 
      }, (payload) => {
        console.log("Incident status updated real-time:", payload);
        setIncident(payload.new as Incident);
      })
      .subscribe((status) => {
        console.log("Real-time subscription status:", status);
      });

    return () => { 
      console.log("Cleaning up channels for:", incidentId);
      supabase.removeChannel(channel); 
    };
  }, [incidentId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim() || !user || !incidentId) return;
    await supabase.from('messages').insert({
      incident_id: incidentId,
      sender_id: user.id,
      content: text.trim(),
    });
    setText('');
  };

  const backLink = profile?.role === 'citizen' ? '/my-incidents' : '/dashboard';

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col border-r border-border h-full overflow-hidden">
        {/* Header */}
        <div className="border-b border-border p-4 flex items-center gap-4 bg-card/30 backdrop-blur">
          <Link to={backLink}>
            <Button variant="ghost" size="sm" className="text-muted-foreground p-0 w-8 h-8 rounded-full hover:bg-secondary">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          {incident && (
            <div className="flex-1 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-foreground truncate max-w-[200px]">{incident.title}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                   <SeverityBadge severity={incident.ai_severity ?? incident.severity_self} size="sm" />
                   <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Live Status</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <StatusTimeline status={incident.status} />
                <span className="text-[10px] text-muted-foreground mt-1 opacity-70">Case ID: {incident.id.slice(0, 8)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-6 h-6 text-muted-foreground opacity-50" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">Safe communication channel established.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Updates from responders will appear here in real-time.</p>
            </div>
          )}
          {messages.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${isMine ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground'}`}>
                  {!isMine && (
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">
                      Responder {msg.profiles?.full_name ? `· ${msg.profiles.full_name}` : ''}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p className={`text-[10px] mt-1 opacity-60 ${isMine ? 'text-right' : 'text-left'}`}>
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-card/30">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Send a status update or request assistance..."
              className="bg-background border-border text-foreground h-11"
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button onClick={sendMessage} className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-5">
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar - Safe Zones */}
      <div className="w-full md:w-80 bg-card/20 p-6 overflow-y-auto hidden lg:block">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
           <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
           Nearest Safe Zones
        </h3>
        <div className="space-y-4">
          {shelters.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No immediate shelters detected in your area. Stay where you are if safe, or seek high ground.</p>
          ) : (
            shelters.map((s) => (
              <div key={s.id} className="glass-card p-4 border-l-4 border-success/40">
                <h4 className="font-bold text-sm text-foreground mb-1">{s.name}</h4>
                <p className="text-xs text-muted-foreground mb-3">{s.county} · {s.type || 'Relief Centre'}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full font-bold">
                    CAPACITY: {s.capacity || 'Varies'}
                  </span>
                </div>
              </div>
            ))
          )}
          
          <div className="mt-8 pt-8 border-t border-border">
             <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Critical Actions</h4>
             <ul className="space-y-3 text-xs text-muted-foreground">
               <li className="flex gap-2">
                 <span className="text-primary font-bold">01.</span> Keep your device in low-power mode.
               </li>
               <li className="flex gap-2">
                 <span className="text-primary font-bold">02.</span> Report any changes in water levels or fire spread.
               </li>
               <li className="flex gap-2">
                 <span className="text-primary font-bold">03.</span> If responders name is visible, follow their instructions.
               </li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
