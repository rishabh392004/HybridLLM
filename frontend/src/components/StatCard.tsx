import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  subtext?: string;
  badge?: React.ReactNode;
  trend?: React.ReactNode;
  accentColor?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  icon: Icon,
  subtext,
  badge,
  trend,
  accentColor,
  className = '',
}) => {
  return (
    <div
      className={`glass-panel p-5 rounded-2xl relative overflow-hidden transition-all duration-200 hover:border-border-focus/50 group ${className}`}
    >
      {accentColor && (
        <div
          className="absolute top-0 left-0 right-0 h-1 transition-opacity opacity-80 group-hover:opacity-100"
          style={{ backgroundColor: accentColor }}
        />
      )}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
          {label}
        </span>
        <div className="flex items-center gap-2">
          {badge}
          {Icon && (
            <div className="p-1.5 rounded-lg bg-surface-hover/80 text-text-secondary group-hover:text-accent transition-colors">
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-2xl sm:text-3xl font-bold font-heading text-text-primary tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="text-xs sm:text-sm font-medium text-text-secondary">
            {unit}
          </span>
        )}
      </div>

      {(subtext || trend) && (
        <div className="flex items-center justify-between text-xs text-text-muted mt-2 pt-2 border-t border-border/40">
          <span>{subtext}</span>
          {trend && <div>{trend}</div>}
        </div>
      )}
    </div>
  );
};
