import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Message, Incident } from '@/lib/supabase';
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
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!incidentId) return;
    const fetchIncident = async () => {
      const { data } = await supabase.from('incidents').select('*, profiles(*)').eq('id', incidentId).single();
      setIncident(data as Incident);
    };
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, profiles(*)')
        .eq('incident_id', incidentId)
        .order('created_at', { ascending: true });
      setMessages((data as Message[]) || []);
    };
    fetchIncident();
    fetchMessages();

    const channel = supabase
      .channel(`messages-${incidentId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `incident_id=eq.${incidentId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center gap-4">
        <Link to={backLink}>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        {incident && (
          <div className="flex-1">
            <h2 className="font-semibold text-foreground">{incident.title}</h2>
            <div className="flex items-center gap-3 mt-1">
              <SeverityBadge severity={incident.ai_severity ?? incident.severity_self} size="sm" />
              <StatusTimeline status={incident.status} />
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">No messages yet. Start the conversation.</p>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMine ? 'bg-primary/20 text-foreground' : 'glass-card text-foreground'}`}>
                <p className="text-xs text-muted-foreground mb-1">
                  {msg.profiles?.full_name || 'User'} · {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                </p>
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4 flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="bg-background border-border text-foreground"
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <Button onClick={sendMessage} className="bg-primary text-primary-foreground shrink-0">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
