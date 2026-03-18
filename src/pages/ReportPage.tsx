import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { KENYA_COUNTIES, INCIDENT_TYPES, triageIncident } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { SeverityBadge } from '@/components/SeverityBadge';
import { AISafetyGuide } from '@/components/AISafetyGuide';
import { MapPin, Upload, Loader2, CheckCircle2, Navigation, AlertCircle, Waves, Flame, Activity, Skull, X } from 'lucide-react';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import { toast } from 'sonner';
import { CitizenLayout } from '@/components/CitizenLayout';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReportPage() {
  const { user } = useAuth();
  const [isSOS, setIsSOS] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [incidentType, setIncidentType] = useState('');
  const [severity, setSeverity] = useState([3]);
  const [county, setCounty] = useState('');
  const [town, setTown] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [showCoords, setShowCoords] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [triaging, setTriaging] = useState(false);
  const [triageResult, setTriageResult] = useState<{ severity: number; safetyGuide: string } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  
  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setDetectingLocation(false);
        toast.success('Location detected successfully');
      },
      (error) => {
        setDetectingLocation(false);
        // Default to Thika if fetching fails
        setTown('Thika');
        setCounty('Kiambu');
        setLat('-1.0333');
        setLng('37.0667');
        
        switch (error.code) {
          case 1:
            toast.error('Permission denied. Defaulting to Thika.');
            break;
          case 2:
            toast.error('Location unavailable. Defaulting to Thika.');
            break;
          case 3:
            toast.error('Location request timed out. Defaulting to Thika.');
            break;
          default:
            toast.error('Could not detect location. Defaulting to Thika.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSOS = async (type: string) => {
    if (!user) return;
    setSubmitting(true);
    setIncidentType(type);
    setTitle(`EMERGENCY: ${type}`);
    setDescription(`Immediate assistance required for ${type}. Reported via SOS mode.`);
    setSeverity([5]);

    // Ensure location is ready
    if (!lat) {
      toast.info("Capturing location...");
      // Wait a bit for GPS to settle if not already captured
    }

    // We call handleSubmit manually by passing a fake event
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    handleSubmit(fakeEvent, type, "SOS");
  };

  const handleSubmit = async (e: React.FormEvent, overrideType?: string, mode?: string) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    const finalType = overrideType || incidentType;
    const finalDesc = mode === "SOS" ? `Immediate assistance required for ${finalType}. Reported via SOS mode.` : description;
    const finalSeverity = mode === "SOS" ? 5 : severity[0];

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
          town,
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
      
      let finalTriage = null;
      if (mode === "SOS") {
        // Zero-latency path for SOS
        finalTriage = {
          severity: 5,
          safetyGuide: "PRIORITY EMERGENCY PROTOCOL: Local response teams are being dispatched to your coordinates instantly. Do not leave your area unless it is unsafe to stay. If possible, seek high ground or a designated safe zone immediately. Maintain communication via this hub and keep your device active."
        };
        setTriageResult(finalTriage);
      } else {
        try {
          finalTriage = await triageIncident(incident as any);
          setTriageResult(finalTriage);
  
          // Update incident with results
          await supabase
            .from('incidents')
            .update({ ai_severity: finalTriage.severity, ai_safety_guide: finalTriage.safetyGuide })
            .eq('id', incident.id);
        } catch (aiErr) {
          // Fallback: Use self-reported severity
          finalTriage = {
            severity: finalSeverity,
            safetyGuide: "Your report has been received by the Kaa-Rada Command Center. Verified safety guidance will be dispatched to your device shortly. Local responders are already coordinating based on your reported location."
          };
          setTriageResult(finalTriage);
        }
      }

      setTriaging(false);
      setSubmitted(true);
      toast.success('Incident reported successfully');

      // 1. Send safety guide to victim via email (FOR EVERY REPORT)
      const { sendBroadcast } = await import('@/lib/supabase');
      if (user.email) {
        sendBroadcast(
          `Personal Safety Guidance: ${finalType}`,
          `Your report has been formally received by the Kaa-Rada Hub. Please follow these verified safety instructions immediately:\n\n${finalTriage.safetyGuide}\n\nOur response teams have been notified of your exact location in ${town || county}. Please remain calm and await further contact.`,
          undefined,
          [user.email]
        ).catch(e => console.error("Safety email failed:", e));
      }

      // 2. Automated Alert for Responders (FOR HIGH SEVERITY ONLY)
      if (finalTriage.severity >= 4) {
        sendBroadcast(
          `CRITICAL: ${finalType} in ${town || county}`,
          `A high-severity ${finalType} has been reported in ${town ? `${town}, ${county}` : county}.\n\nDescription: ${finalDesc}\n\nView details: ${window.location.origin}/dashboard`
        ).catch(e => console.error("Auto-broadcast failed:", e));
      }
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
          <div className="text-center mb-6">
            <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground">Report Submitted</h2>
            <p className="text-muted-foreground mt-1">Your incident is being reviewed by responders</p>
          </div>
          
          <div className="glass-card bg-[#25D366]/5 border-[#25D366]/20 p-5 mb-8 text-center rounded-xl mx-auto max-w-md">
            <h3 className="font-semibold text-foreground text-sm flex items-center justify-center gap-2">
              <WhatsAppIcon className="w-5 h-5 text-[#25D366]" />
              Your report has been submitted. Stay informed:
            </h3>
            <a href="https://whatsapp.com/channel/0029Vb7OLvnJuyA6FLgPyg2w" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block w-full">
              <Button className="bg-[#25D366] hover:bg-[#1DA851] text-white font-medium shadow-md shadow-[#25D366]/20 gap-2 w-full">
                <WhatsAppIcon className="w-4 h-4 fill-current" />
                Follow our WhatsApp channel for updates
              </Button>
            </a>
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
      <div className="max-w-2xl mx-auto p-6 relative">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">Report an Incident</h1>
          <Button 
            onClick={() => setIsSOS(!isSOS)} 
            variant={isSOS ? "destructive" : "outline"}
            className={`gap-2 ${!isSOS ? 'border-destructive/50 text-destructive hover:bg-destructive/10' : 'bg-destructive text-white'}`}
          >
            {isSOS ? <X className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {isSOS ? 'Exit SOS Mode' : 'SOS Mode'}
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {isSOS ? (
            <motion.div 
              key="sos-mode"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl text-center">
                <p className="text-destructive font-bold text-lg">EMERGENCY SOS MODE</p>
                <p className="text-xs text-muted-foreground">Tap an incident type for one-click reporting with priority triage.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Flooding', icon: <Waves className="w-8 h-8" />, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
                  { label: 'Fire', icon: <Flame className="w-8 h-8" />, color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
                  { label: 'Medical', icon: <Activity className="w-8 h-8" />, color: 'bg-red-500/10 text-red-500 border-red-500/20' },
                  { label: 'Danger', icon: <Skull className="w-8 h-8" />, color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleSOS(item.label)}
                    disabled={submitting}
                    className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all hover:scale-105 active:scale-95 ${item.color} h-48`}
                  >
                    {item.icon}
                    <span className="mt-4 font-bold text-lg">{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-4 rounded-lg bg-background border border-border flex items-center justify-center gap-3">
                <MapPin className={`w-4 h-4 ${lat ? 'text-success' : 'text-muted-foreground animate-pulse'}`} />
                <span className="text-sm font-medium">
                  {lat ? `Location Captured: ${lat.slice(0, 8)}, ${lng.slice(0, 8)}` : 'Waiting for GPS...'}
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.form 
              key="regular-mode"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit} 
              className="space-y-5"
            >
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label className="text-foreground">Town / Nearest Landmark</Label>
              <Input 
                value={town} 
                onChange={(e) => setTown(e.target.value)} 
                placeholder="e.g. Kisumu CBD, Nyalenda B" 
                className="bg-background border-border text-foreground mt-1" 
                required 
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'].map(city => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setTown(city)}
                    className="text-[10px] px-2 py-1 rounded-full bg-secondary border border-border hover:bg-primary/20 hover:border-primary/40 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    + {city}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-foreground">Precise Location</Label>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowCoords(!showCoords)}
                className="text-xs text-muted-foreground hover:text-primary"
              >
                {showCoords ? 'Hide Coordinates' : 'Edit Coordinates'}
              </Button>
            </div>
            
            <div className={`p-4 rounded-lg border flex items-center justify-between transition-colors ${lat ? 'bg-success/5 border-success/20' : 'bg-muted/50 border-border'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${lat ? 'bg-success/20 text-success' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                  <Navigation className={`w-4 h-4 ${detectingLocation ? 'animate-pulse' : ''}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {detectingLocation ? 'Detecting location...' : lat ? 'Coordinates Captured' : 'Location access required'}
                  </p>
                  {lat && !showCoords && (
                    <p className="text-xs text-muted-foreground">
                      {lat.slice(0, 8)}, {lng.slice(0, 8)}
                    </p>
                  )}
                </div>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={detectLocation} 
                disabled={detectingLocation} 
                className="border-border-strong text-foreground hover:bg-secondary h-8 px-3"
              >
                {detectingLocation ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <MapPin className="w-3 h-3 mr-2" />}
                {lat ? 'Refresh' : 'Detect'}
              </Button>
            </div>

            {showCoords && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex gap-2 mt-2"
              >
                <Input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Latitude" className="bg-background border-border text-foreground" />
                <Input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="Longitude" className="bg-background border-border text-foreground" />
              </motion.div>
            )}
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
        </motion.form>
          )}
        </AnimatePresence>
      </div>
    </CitizenLayout>
  );
}
