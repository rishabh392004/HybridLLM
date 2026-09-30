import React from 'react';
import { LeadTimeHours } from '../api/types';
import { Clock } from 'lucide-react';

interface LeadTimeSelectProps {
  leadTime: LeadTimeHours;
  onChange: (hours: LeadTimeHours) => void;
  className?: string;
}

export const LeadTimeSelect: React.FC<LeadTimeSelectProps> = ({
  leadTime,
  onChange,
  className = '',
}) => {
  const options: LeadTimeHours[] = [24, 48, 72, 120];

  return (
    <div
      className={`inline-flex items-center gap-1 p-1 rounded-xl bg-surface/90 border border-border backdrop-blur-md shadow-sm ${className}`}
      role="group"
      aria-label="Select forecast horizon lead time"
    >
      <div className="flex items-center gap-1 px-2 text-text-muted text-xs font-medium">
        <Clock className="w-3.5 h-3.5 text-accent" />
        <span className="hidden sm:inline">Lead:</span>
      </div>
      {options.map((hours) => {
        const isActive = leadTime === hours;
        return (
          <button
            key={hours}
            onClick={() => onChange(hours)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 ${
              isActive
                ? 'bg-accent/20 text-accent border border-accent/40 shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            }`}
            aria-pressed={isActive}
            aria-label={`${hours} hours forecast horizon`}
          >
            +{hours}h
          </button>
        );
      })}
    </div>
  );
};
