import { cn } from '@/lib/utils';
import { getSeverityLabel } from '@/lib/supabase';

interface SeverityBadgeProps {
  severity: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const colorMap: Record<string, string> = {
  Critical: 'bg-severity-critical/20 text-severity-critical border-severity-critical/30',
  High: 'bg-severity-high/20 text-severity-high border-severity-high/30',
  Medium: 'bg-severity-medium/20 text-severity-medium border-severity-medium/30',
  Low: 'bg-severity-low/20 text-severity-low border-severity-low/30',
  Minimal: 'bg-severity-low/20 text-severity-low border-severity-low/30',
};

const sizeMap = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5',
};

export function SeverityBadge({ severity, size = 'md', className }: SeverityBadgeProps) {
  const label = getSeverityLabel(severity);
  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border',
        colorMap[label],
        sizeMap[size],
        className
      )}
    >
      {label} ({severity})
    </span>
  );
}
