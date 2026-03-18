import { cn } from '@/lib/utils';
import { Bot, ShieldCheck } from 'lucide-react';

interface AISafetyGuideProps {
  guide: string;
  severity: number;
  className?: string;
}

export function AISafetyGuide({ guide, severity, className }: AISafetyGuideProps) {
  return (
    <div className={cn('rounded-2xl p-5 ai-glow border border-ai-purple/25 bg-ai-purple/8', className)}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-ai-purple/20 flex items-center justify-center">
          <Bot className="w-4 h-4 text-ai-purple" />
        </div>
        <div>
          <h4 className="font-semibold text-foreground text-sm">AI Safety Assessment</h4>
          <p className="text-xs text-ai-purple">Severity Score: {severity}/5</p>
        </div>
      </div>
      <div className="flex items-start gap-2 bg-background/40 rounded-xl p-3">
        <ShieldCheck className="w-4 h-4 text-ai-purple mt-0.5 flex-shrink-0" />
        <p className="text-sm text-foreground/90 leading-relaxed">{guide}</p>
      </div>
    </div>
  );
}
