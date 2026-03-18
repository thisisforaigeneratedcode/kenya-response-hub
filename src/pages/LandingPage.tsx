import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LiveCounter } from '@/components/LiveCounter';
import { AlertTriangle, Users, Shield, ArrowRight, Radio } from 'lucide-react';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function LandingPage() {
  const [incidentCount, setIncidentCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [shelters, setShelters] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);

  const severityColors: Record<number, string> = {
    5: '#ef4444', 4: '#f97316', 3: '#38bdf8', 2: '#34d399', 1: '#34d399',
  };

  useEffect(() => {
    const fetchCounts = async () => {
      const { count: total } = await supabase.from('incidents').select('*', { count: 'exact', head: true });
      const { count: pending } = await supabase.from('incidents').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      setIncidentCount(total ?? 0);
      setPendingCount(pending ?? 0);
    };
    fetchCounts();

    const fetchIncidents = async () => {
      const { data } = await supabase.from('incidents').select('*').not('lat', 'is', null).not('lng', 'is', null);
      setIncidents(data || []);
    };
    fetchIncidents();

    const fetchShelters = async () => {
      const { data } = await supabase.from('shelters' as any).select('*');
      setShelters(data || []);
    };
    fetchShelters();

    const channel = supabase
      .channel('landing-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => {
        fetchCounts();
        fetchIncidents();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold text-foreground tracking-tight">Kaa-Rada</span>
        </div>
        <Link to="/auth">
          <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
            Sign In
          </Button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-severity-critical/5" />
        <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-36">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-extrabold text-foreground tracking-tight leading-tight">
              Report. Respond.{' '}
              <span className="text-primary">Recover.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Kenya's real-time disaster management platform. Report emergencies instantly,
              coordinate first responders, and save lives — powered by AI triage.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
              <Link to="/auth">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-base px-8">
                  <AlertTriangle className="w-5 h-5" />
                  Report an Incident
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="border-border-strong text-foreground hover:bg-secondary gap-2 text-base px-8">
                  <Shield className="w-5 h-5" />
                  Responder Login
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Counters */}
      <section className="max-w-4xl mx-auto px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <LiveCounter
            value={incidentCount}
            label="Incidents Reported"
            icon={<AlertTriangle className="w-8 h-8" />}
          />
          <LiveCounter
            value={pendingCount}
            label="Awaiting Response"
            icon={<Users className="w-8 h-8" />}
          />
        </div>
      </section>

      {/* WhatsApp Banner */}
      <section className="max-w-4xl mx-auto px-6 mt-6 relative z-10">
        <div className="bg-[#25D366]/10 border border-[#25D366]/30 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm">
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl md:text-2xl font-bold text-foreground flex items-center justify-center md:justify-start gap-2">
              <WhatsAppIcon className="w-5 h-5 md:w-6 md:h-6 text-[#25D366]" />
              Get real-time flood alerts
            </h3>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">
              Join our WhatsApp channel for instant flood warnings across Kenya. Updated as incidents happen.
            </p>
            <p className="text-[#25D366] font-medium text-xs mt-3 flex items-center justify-center md:justify-start gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#25D366]"></span>
              </span>
              3 followers and growing
            </p>
          </div>
          <a href="https://whatsapp.com/channel/0029Vb7OLvnJuyA6FLgPyg2w" target="_blank" rel="noopener noreferrer" className="w-full md:w-auto shrink-0">
            <Button size="lg" className="w-full md:w-auto bg-[#25D366] hover:bg-[#1DA851] text-white font-bold shadow-lg shadow-[#25D366]/20 gap-2">
              <WhatsAppIcon className="w-5 h-5 fill-current" />
              Join Kaa Rada Floods Alert
            </Button>
          </a>
        </div>
      </section>

      {/* Map Preview */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card p-8"
        >
          <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Live Disaster Map</h2>
          <p className="text-muted-foreground text-center mb-8 text-sm">Real-time situational awareness for all Kenyan residents.</p>
          <div className="relative aspect-[16/9] w-full rounded-xl bg-background/60 overflow-hidden border border-border z-0">
            <MapContainer
              center={[0.0236, 37.9062]}
              zoom={6}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
              scrollWheelZoom={true}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
              />
              {incidents.map((inc) => {
                const sev = inc.ai_severity ?? inc.severity_self;
                const color = severityColors[sev] || '#38bdf8';
                return (
                  <CircleMarker
                    key={inc.id}
                    center={[inc.lat!, inc.lng!]}
                    radius={sev >= 4 ? 14 : 8}
                    fillColor={color}
                    color={color}
                    weight={sev >= 5 ? 4 : 2}
                    fillOpacity={sev >= 5 ? 0.8 : 0.6}
                    className={sev >= 5 ? 'pulse-zone' : ''}
                  >
                    <Popup>
                      <div className="text-foreground">
                        <h4 className="font-semibold text-sm">{inc.title}</h4>
                        <p className="text-xs mt-1">{inc.county} · {inc.incident_type}</p>
                        <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Severity</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${sev >= 4 ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'}`}>
                            {sev >= 5 ? 'CRITICAL' : sev >= 4 ? 'HIGH' : 'STABLE'}
                          </span>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
              {shelters.map((s) => (
                <CircleMarker
                  key={`shelter-${s.id}`}
                  center={[s.lat, s.lng]}
                  radius={6}
                  fillColor="#facc15"
                  color="#facc15"
                  weight={2}
                  fillOpacity={0.8}
                >
                  <Popup>
                    <div className="text-foreground">
                      <h4 className="font-semibold text-sm text-yellow-500">🛡️ {s.name}</h4>
                      <p className="text-xs mt-1">{s.county} · Capacity: {s.capacity}</p>
                      <p className="text-xs mt-1 font-mono">Contact: {s.contact}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
            <div className="absolute inset-0 pointer-events-none z-[400] shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]" />
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary" />
            <span className="text-lg font-bold text-foreground tracking-tight">Kaa-Rada</span>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-6">
            <a 
              href="https://whatsapp.com/channel/0029Vb7OLvnJuyA6FLgPyg2w" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[#25D366] hover:text-[#1DA851] font-medium transition-colors"
            >
              <WhatsAppIcon className="w-5 h-5 fill-current" />
              <span>Flood Alerts Channel</span>
            </a>
            <p className="text-sm text-muted-foreground">
              © 2026 Kaa-Rada Emergency Management System
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
