import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LiveCounter } from '@/components/LiveCounter';
import { SeverityRing } from '@/components/SeverityRing';
import { AlertTriangle, Users, Shield, ArrowRight, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function LandingPage() {
  const [incidentCount, setIncidentCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      const { count: total } = await supabase.from('incidents').select('*', { count: 'exact', head: true });
      const { count: pending } = await supabase.from('incidents').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      setIncidentCount(total ?? 0);
      setPendingCount(pending ?? 0);
    };
    fetchCounts();

    const channel = supabase
      .channel('landing-counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => {
        fetchCounts();
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

      {/* Map Preview */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card p-8"
        >
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Live Incident Map</h2>
          <div className="relative aspect-[16/9] rounded-xl bg-background/60 overflow-hidden flex items-center justify-center border border-border">
            {/* Animated severity rings as preview */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full h-full">
                {[
                  { top: '30%', left: '45%', severity: 5 },
                  { top: '50%', left: '55%', severity: 4 },
                  { top: '40%', left: '35%', severity: 3 },
                  { top: '60%', left: '50%', severity: 2 },
                  { top: '35%', left: '60%', severity: 5 },
                  { top: '55%', left: '40%', severity: 4 },
                ].map((pin, i) => (
                  <div
                    key={i}
                    className="absolute"
                    style={{ top: pin.top, left: pin.left }}
                  >
                    <SeverityRing severity={pin.severity} size={24} />
                  </div>
                ))}
              </div>
            </div>
            <div className="relative z-10 text-center">
              <p className="text-muted-foreground text-sm">
                Sign in as a responder to access the live map
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>Kaa-Rada Emergency Management System — Protecting Kenya's Communities</p>
      </footer>
    </div>
  );
}
