import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  ShieldCheck, 
  Zap, 
  Map as MapIcon, 
  MessageSquare, 
  ArrowRight, 
  ArrowLeft,
  Users,
  Radio,
  BarChart3,
  Phone,
  Layers,
  Code
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import { Link } from 'react-router-dom';

const slides = [
  {
    id: 'intro',
    title: "Kaa-Rada",
    subtitle: "Real-time Disaster Response & Recovery Hub for Kenya",
    content: "When seconds count, Kaa-Rada bridges the critical gap between disaster survivors and life-saving rescue teams.",
    icon: <ShieldCheck className="w-16 h-16 text-primary" />,
    gradient: "from-primary/20 via-background to-background"
  },
  {
    id: 'problem',
    title: "The Disaster Gap",
    subtitle: "Why 72 hours are called 'The Golden Window'",
    content: "During floods, the biggest killer is not just the water—it's the silence and the lack of immediate direction.",
    points: [
      "Survivors left without life-saving instructions",
      "Manual triage causes fatal dispatch delays",
      "Responders blinded by lack of real-time data",
      "Fragmented communication during critical hours"
    ],
    icon: <AlertTriangle className="w-16 h-16 text-destructive" />,
    gradient: "from-destructive/20 via-background to-background"
  },
  {
    id: 'zero-latency',
    title: "Zero-Latency Rescue",
    subtitle: "Efficiency that Saves Lives",
    content: "We've replaced manual processing with instant, automated triage to ensure help reaches the right person in minutes, not hours.",
    points: [
      "One-Tap SOS for instant GPS coordinates",
      "Automated Severity Scoring (1-5 Scale)",
      "Instant Dispatch to the nearest Responder"
    ],
    icon: <Zap className="w-16 h-16 text-yellow-500" />,
    gradient: "from-yellow-500/20 via-background to-background"
  },
  {
    id: 'rescue-sidekick',
    title: "The Rescue Sidekick",
    subtitle: "Restoring Trust and Safety",
    content: "Kaa-Rada ensures NO reporter is left in the dark. We provide immediate value the moment 'Submit' is tapped.",
    points: [
      "Instant Survival Manuals sent via Email",
      "Live Chat with human Responders",
      "Safe Zone Location-aware sidebar",
      "Automated 'Help is Coming' notifications"
    ],
    icon: <MessageSquare className="w-16 h-16 text-primary" />,
    gradient: "from-primary/20 via-background to-background"
  },
  {
    id: 'command-map',
    title: "Total Command",
    subtitle: "Operational Efficiency for Responders",
    content: "A unified operating picture that maps every pulse of the disaster in real-time.",
    points: [
      "Pulsing 'Crisis Zones' for high-severity areas",
      "Live responder tracking & assignment",
      "Unified public transparency map",
      "Cross-county resource coordination"
    ],
    icon: <MapIcon className="w-16 h-16 text-blue-500" />,
    gradient: "from-blue-500/20 via-background to-background"
  },
  {
    id: 'ai-engine',
    title: "The Intelligence Bureau",
    subtitle: "Powered by Gemini 2.0 Flash",
    content: "Behind the curtain, the world's fastest AI handles the chaos so humans can focus on the rescue.",
    points: [
      "Instant translation of raw reports into Intel",
      "AI-generated high-accuracy safety guides",
      "99% triage accuracy during peak loads"
    ],
    icon: <Users className="w-16 h-16 text-ai-purple" />,
    gradient: "from-ai-purple/20 via-background to-background"
  },
  {
    id: 'stack',
    title: "Resilient Architecture",
    subtitle: "Built for the Storm",
    content: "A serverless, event-driven foundation designed for 99.9% uptime during regional crises.",
    points: [
      "Supabase Realtime & Edge Functions",
      "PostgreSQL with Row-Level Security",
      "Resend-powered Emergency Broadcasts",
      "WhatsApp & SMS fallback channels"
    ],
    icon: <Layers className="w-16 h-16 text-cyan-400" />,
    gradient: "from-cyan-400/20 via-background to-background"
  },
  {
    id: 'impact',
    title: "Kenya's Safety Standard",
    subtitle: "Join the Kaa-Rada Network",
    points: [
      "75% expected reduction in dispatch latency",
      "100% safety coverage for all reporters",
      "A unified data standard for Kenya's recovery"
    ],
    icon: <Radio className="w-16 h-16 text-success" />,
    gradient: "from-success/20 via-background to-background"
  }
];

export default function PresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) setCurrentSlide(currentSlide + 1);
  };

  const prevSlide = () => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  };

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden relative">
      <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} transition-colors duration-1000 opacity-50`} />
      
      {/* HUD Header */}
      <div className="relative z-10 p-6 flex justify-between items-center border-b border-border/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <Radio className="w-5 h-5 text-primary-foreground animate-pulse" />
          </div>
          <span className="font-bold tracking-tight text-xl">KAA-RADA <span className="text-primary font-normal text-sm ml-2 opacity-70">PITCH DECK</span></span>
        </div>
        <div className="text-sm font-medium text-muted-foreground bg-secondary px-3 py-1 rounded-full">
          SLIDE {currentSlide + 1} / {slides.length}
        </div>
      </div>

      {/* Slide Content */}
      <div className="flex-1 relative z-10 flex flex-col items-center justify-center p-6 md:p-12 text-center max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full flex flex-col items-center"
          >
            <motion.div 
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mb-8"
            >
              {slide.icon}
            </motion.div>
            
            <h1 className="text-4xl md:text-7xl font-extrabold mb-4 tracking-tight drop-shadow-sm">
              {slide.title}
            </h1>
            <h2 className="text-xl md:text-3xl text-primary font-medium mb-8">
              {slide.subtitle}
            </h2>
            
            {slide.content && (
              <p className="text-lg md:text-2xl text-muted-foreground max-w-3xl leading-relaxed mb-10">
                {slide.content}
              </p>
            )}

            {slide.points && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left">
                {slide.points.map((point, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + (i * 0.1) }}
                    className="glass-card p-4 flex items-center gap-3 border-l-4 border-l-primary"
                  >
                    <ArrowRight className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-medium">{point}</span>
                  </motion.div>
                ))}
              </div>
            )}

            {currentSlide === slides.length - 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 }}
                className="mt-12 flex flex-col items-center gap-4"
              >
                <Link to="/">
                  <Button size="lg" className="bg-primary text-primary-foreground h-14 px-8 text-lg font-bold shadow-xl shadow-primary/20 gap-3">
                    <Radio className="w-5 h-5" />
                    ENTER LIVE SYSTEM
                  </Button>
                </Link>
                <div className="flex gap-4">
                   <a href="https://whatsapp.com/channel/0029Vb7OLvnJuyA6FLgPyg2w" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="gap-2 border-border-strong text-foreground hover:bg-[#25D366]/10 hover:text-[#25D366] transition-colors">
                      <WhatsAppIcon className="w-4 h-4" />
                      Live Alerts Channel
                    </Button>
                   </a>
                   <Link to="/auth">
                    <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                      Admin Portal
                    </Button>
                   </Link>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Bars */}
      <div className="relative z-10 p-8 flex justify-center items-center gap-12">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={prevSlide} 
          disabled={currentSlide === 0}
          className="rounded-full w-12 h-12 border-border-strong text-foreground hover:bg-secondary disabled:opacity-30 transition-all"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-8 bg-primary' : 'w-2 bg-border cursor-pointer hover:bg-muted-foreground/30'}`}
              onClick={() => setCurrentSlide(i)}
            />
          ))}
        </div>

        <Button 
          variant="default" 
          size="icon" 
          onClick={nextSlide} 
          disabled={currentSlide === slides.length - 1}
          className="rounded-full w-12 h-12 bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/20 disabled:opacity-30 transition-all"
        >
          <ArrowRight className="w-6 h-6" />
        </Button>
      </div>

      {/* Animated Elements */}
      <div className="absolute bottom-10 left-10 opacity-20 hidden lg:block">
        <BarChart3 className="w-20 h-20 text-muted-foreground" />
      </div>
      <div className="absolute top-40 right-10 opacity-10 hidden lg:block">
        <Phone className="w-32 h-32 text-muted-foreground -rotate-12" />
      </div>
    </div>
  );
}
