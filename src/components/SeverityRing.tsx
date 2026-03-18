import { cn } from '@/lib/utils';

interface SeverityRingProps {
  severity: number;
  size?: number;
  className?: string;
  children?: React.ReactNode;
}

export function SeverityRing({ severity, size = 40, className, children }: SeverityRingProps) {
  const pulseClass = severity >= 5 ? 'pulse-critical' : severity >= 4 ? 'pulse-high' : severity >= 3 ? 'pulse-medium' : 'pulse-low';
  const borderColor = severity >= 5 ? 'border-severity-critical' : severity >= 4 ? 'border-severity-high' : severity >= 3 ? 'border-severity-medium' : 'border-severity-low';

  return (
    <div
      className={cn('rounded-full border-2 flex items-center justify-center', pulseClass, borderColor, className)}
      style={{ width: size, height: size }}
    >
      {children}
    </div>
  );
}
