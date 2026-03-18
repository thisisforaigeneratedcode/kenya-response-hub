import { cn } from '@/lib/utils';

interface StatusTimelineProps {
  status: 'pending' | 'assigned' | 'resolved';
  className?: string;
}

const steps = ['Reported', 'Assigned', 'Resolved'] as const;
const statusIndex = { pending: 0, assigned: 1, resolved: 2 };

export function StatusTimeline({ status, className }: StatusTimelineProps) {
  const activeIdx = statusIndex[status];

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-1">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-3 h-3 rounded-full border-2 transition-colors',
                i <= activeIdx
                  ? i === activeIdx
                    ? 'bg-primary border-primary'
                    : 'bg-success border-success'
                  : 'bg-transparent border-border-strong'
              )}
            />
            <span
              className={cn(
                'text-xs mt-1 font-medium',
                i <= activeIdx ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                'w-8 h-0.5 mb-5',
                i < activeIdx ? 'bg-success' : 'bg-border'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
