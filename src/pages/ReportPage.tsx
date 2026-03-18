import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, KENYA_COUNTIES, INCIDENT_TYPES, triageIncident } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { SeverityBadge } from '@/components/SeverityBadge';
import { AISafetyGuide } from '@/components/AISafetyGuide';
import { MapPin, Upload, Loader2, CheckCircle2, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { CitizenLayout } from '@/components/CitizenLayout';

export default function ReportPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [incidentType, setIncidentType] = useState('');
  const [severity, setSeverity] = useState([3]);
  const [county, setCounty] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [triaging, setTriaging] = useState(false);
  const [triageResult, setTriageResult] = useState<{ severity: number; safetyGuide: string } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const detectLocation = () => {
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setDetectingLocation(false);
        toast.success('Location detected');
      },
      () => {
        toast.error('Could not detect location');
        setDetectingLocation(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    try {
      let photoUrl: string | null = null;
      if (photo) {
        const ext = photo.name.split('.').pop();
        const path = `incidents/${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('incident-photos').upload(path, photo);
        if (!upErr) {
          const { data } = supabase.storage.from('incident-photos').getPublicUrl(path);
          photoUrl = data.publicUrl;
        }
      }

      const { data: incident, error } = await supabase
        .from('incidents')
        .insert({
          reporter_id: user.id,
          title,
          description,
          incident_type: incidentType,
          severity_self: severity[0],
          county,
          lat: lat ? parseFloat(lat) : null,
          lng: lng ? parseFloat(lng) : null,
          photo_url: photoUrl,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // AI Triage
      setSubmitting(false);
      setTriaging(true);
      const result = await triageIncident(incident);
      setTriageResult(result);

      // Update incident with AI results
      await supabase
        .from('incidents')
        .update({ ai_severity: result.severity, ai_safety_guide: result.safetyGuide })
        .eq('id', incident.id);

      setTriaging(false);
      setSubmitted(true);
      toast.success('Incident reported successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit report');
      setSubmitting(false);
      setTriaging(false);
    }
  };

  if (submitted && triageResult) {
    return (
      <CitizenLayout>
        <div className="max-w-2xl mx-auto p-6">
          <div className="text-center mb-8">
            <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground">Report Submitted</h2>
            <p className="text-muted-foreground mt-1">Your incident is being reviewed by responders</p>
          </div>
          <AISafetyGuide guide={triageResult.safetyGuide} severity={triageResult.severity} className="mb-6" />
          <div className="flex gap-3 justify-center">
            <Button onClick={() => { setSubmitted(false); setTriageResult(null); setTitle(''); setDescription(''); }} variant="outline" className="border-border-strong text-foreground hover:bg-secondary">
              Report Another
            </Button>
            <Button onClick={() => window.location.href = '/my-incidents'} className="bg-primary text-primary-foreground">
              View My Reports
            </Button>
          </div>
        </div>
      </CitizenLayout>
    );
  }

  if (triaging) {
    return (
      <CitizenLayout>
        <div className="max-w-2xl mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="ai-glow rounded-2xl p-8 border border-ai-purple/25 bg-ai-purple/5 text-center">
            <Loader2 className="w-12 h-12 text-ai-purple animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">AI Triage in Progress</h3>
            <p className="text-sm text-muted-foreground mt-1">Analyzing incident severity and generating safety guidance...</p>
          </div>
        </div>
      </CitizenLayout>
    );
  }

  return (
    <CitizenLayout>
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">Report an Incident</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label className="text-foreground">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief incident title" className="bg-background border-border text-foreground mt-1" required />
          </div>

          <div>
            <Label className="text-foreground">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the situation in detail..." className="bg-background border-border text-foreground mt-1 min-h-[120px]" required />
          </div>

          <div>
            <Label className="text-foreground">Incident Type</Label>
            <Select value={incidentType} onValueChange={setIncidentType} required>
              <SelectTrigger className="bg-background border-border text-foreground mt-1">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {INCIDENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-foreground">Severity Assessment: {severity[0]}/5</Label>
            <div className="mt-3 px-1">
              <Slider value={severity} onValueChange={setSeverity} min={1} max={5} step={1} className="w-full" />
            </div>
            <div className="mt-2">
              <SeverityBadge severity={severity[0]} size="sm" />
            </div>
          </div>

          <div>
            <Label className="text-foreground">County</Label>
            <Select value={county} onValueChange={setCounty} required>
              <SelectTrigger className="bg-background border-border text-foreground mt-1">
                <SelectValue placeholder="Select county" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border max-h-60">
                {KENYA_COUNTIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-foreground">Location</Label>
            <div className="flex gap-2 mt-1">
              <Input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Latitude" className="bg-background border-border text-foreground" />
              <Input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="Longitude" className="bg-background border-border text-foreground" />
              <Button type="button" variant="outline" onClick={detectLocation} disabled={detectingLocation} className="border-border-strong text-foreground hover:bg-secondary shrink-0">
                {detectingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-foreground">Photo (optional)</Label>
            <div className="mt-1 glass-card p-4 flex items-center gap-3">
              <Upload className="w-5 h-5 text-muted-foreground" />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                className="text-sm text-foreground file:bg-secondary file:text-foreground file:border-0 file:rounded file:px-3 file:py-1 file:mr-3 file:cursor-pointer"
              />
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit Report
          </Button>
        </form>
      </div>
    </CitizenLayout>
  );
}
