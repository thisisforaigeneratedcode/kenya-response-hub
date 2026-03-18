import { Incident } from '@/lib/supabase';
import { SeverityBadge } from './SeverityBadge';
import { SeverityRing } from './SeverityRing';
import { StatusTimeline } from './StatusTimeline';
import { MapPin, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface IncidentCardProps {
  incident: Incident;
  onClick?: () => void;
  showTimeline?: boolean;
  className?: string;
}

export function IncidentCard({ incident, onClick, showTimeline, className }: IncidentCardProps) {
  const severity = incident.ai_severity ?? incident.severity_self;
  const timeAgo = formatDistanceToNow(new Date(incident.created_at), { addSuffix: true });

  return (
    <div
      onClick={onClick}
      className={cn(
        'glass-card p-4 cursor-pointer hover:border-primary/40 transition-all duration-200',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <SeverityRing severity={severity} size={36}>
          <span className="text-xs font-bold text-foreground">{severity}</span>
        </SeverityRing>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-foreground truncate">{incident.title}</h3>
            <SeverityBadge severity={severity} size="sm" />
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {incident.county}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </span>
            {incident.profiles?.full_name && (
              <span className="inline-flex items-center gap-1">
                <User className="w-3 h-3" />
                {incident.profiles.full_name}
              </span>
            )}
          </div>
          <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded bg-secondary text-muted-foreground">
            {incident.incident_type}
          </span>
        </div>
      </div>
      {showTimeline && (
        <div className="mt-3 pt-3 border-t border-border">
          <StatusTimeline status={incident.status} />
        </div>
      )}
    </div>
  );
}
