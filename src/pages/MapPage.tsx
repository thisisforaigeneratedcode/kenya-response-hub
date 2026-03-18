import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/integrations/supabase/client';
import { Incident } from '@/lib/supabase';
import { SeverityBadge } from '@/components/SeverityBadge';
import { ResponderLayout } from '@/components/ResponderLayout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KENYA_COUNTIES } from '@/lib/supabase';

const severityColors: Record<number, string> = {
  5: '#ef4444', 4: '#f97316', 3: '#38bdf8', 2: '#34d399', 1: '#34d399',
};

export default function MapPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [shelters, setShelters] = useState<any[]>([]);
  const [filterCounty, setFilterCounty] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');

  useEffect(() => {
    const fetchIncidents = async () => {
      let query = supabase.from('incidents').select('*').not('lat', 'is', null).not('lng', 'is', null);
      if (filterCounty !== 'all') query = query.eq('county', filterCounty);
      if (filterSeverity !== 'all') query = query.gte('severity_self', parseInt(filterSeverity));
      const { data } = await query;
      setIncidents((data as any as Incident[]) || []);
    };
    fetchIncidents();

    const fetchShelters = async () => {
      const { data } = await supabase.from('shelters' as any).select('*');
      setShelters(data || []);
    };
    fetchShelters();

    const channel = supabase
      .channel('map-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => fetchIncidents())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [filterCounty, filterSeverity]);

  return (
    <ResponderLayout>
      <div className="flex-1 flex flex-col h-full min-h-screen">
        <div className="flex items-center gap-2 p-3 border-b border-border bg-card">
          <h2 className="text-lg font-semibold text-foreground mr-4">Live Map</h2>
          <Select value={filterCounty} onValueChange={setFilterCounty}>
            <SelectTrigger className="w-40 bg-background border-border text-foreground text-sm">
              <SelectValue placeholder="County" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border max-h-60">
              <SelectItem value="all">All Counties</SelectItem>
              {KENYA_COUNTIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-36 bg-background border-border text-foreground text-sm">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="4">High & Critical</SelectItem>
              <SelectItem value="3">Medium+</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 relative w-full h-[calc(100vh-140px)] min-h-[500px]">
          <MapContainer
            center={[0.0236, 37.9062]}
            zoom={6}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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
                      <div className="mt-1">
                        <SeverityBadge severity={sev} size="sm" />
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
        </div>
      </div>
    </ResponderLayout>
  );
}
