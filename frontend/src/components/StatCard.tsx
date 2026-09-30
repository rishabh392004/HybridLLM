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
      className={`relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-5 transition-all duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--bg-panel-raised)] group ${className}`}
    >
      {/* Accent line */}
      {accentColor && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px] transition-opacity opacity-70 group-hover:opacity-100"
          style={{ backgroundColor: accentColor }}
        />
      )}

      {/* Label row */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="stat-label">{label}</span>
        <div className="flex items-center gap-2">
          {badge}
          {Icon && (
            <div
              className="p-1.5 rounded-lg transition-colors"
              style={{
                background: accentColor ? `${accentColor}18` : 'rgba(37,99,235,0.08)',
              }}
            >
              <Icon
                className="w-3.5 h-3.5"
                style={{ color: accentColor || 'var(--text-muted)' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main value */}
      <div className="flex items-baseline gap-1.5">
        <span
          className="font-data text-[1.875rem] font-bold leading-none tracking-tight"
          style={{ color: accentColor ? `${accentColor}ee` : 'var(--text-data)' }}
        >
          {value}
        </span>
        {unit && (
          <span className="stat-unit">{unit}</span>
        )}
      </div>

      {/* Footer */}
      {(subtext || trend) && (
        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-[var(--border-muted)]">
          <span className="text-[11px] text-text-muted leading-snug">{subtext}</span>
          {trend && <div>{trend}</div>}
        </div>
      )}
    </div>
  );
};
