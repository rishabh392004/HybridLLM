import React from 'react';
import { SourceBlendDetail } from '../api/types';
import { TrendArrow } from './TrendArrow';
import { formatPercentage } from '../lib/format';
import { SOURCE_COLORS } from '../lib/colors';

interface WeightBarsProps {
  sources: SourceBlendDetail[];
  className?: string;
}

export const WeightBars: React.FC<WeightBarsProps> = ({ sources, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`} role="region" aria-label="Forecast source model weight allocation">
      {sources.map((item) => {
        const percentNum = item.weight * 100;
        const color = SOURCE_COLORS[item.source] || '#38bdf8';

        return (
          <div
            key={item.source}
            className="p-4 rounded-xl border border-border/70 bg-surface/40 hover:bg-surface/70 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                />
                <span className="text-sm font-semibold text-text-primary tracking-tight">
                  {item.source}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <TrendArrow current={item.weight} previous={item.previous_weight} />
                <span className="text-sm font-bold font-heading text-text-primary">
                  {formatPercentage(item.weight)}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 bg-surface-hover rounded-full overflow-hidden p-0.5 border border-border/30">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${Math.min(100, Math.max(0, percentNum))}%`,
                  backgroundColor: color,
                }}
                role="progressbar"
                aria-valuenow={percentNum}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${item.source} weight ${formatPercentage(item.weight)}`}
              />
            </div>

            {/* Plain language explanation */}
            <p className="text-xs text-text-secondary mt-2 leading-relaxed flex items-baseline gap-1.5">
              <span className="text-accent font-medium text-[10px] uppercase tracking-wider shrink-0">
                Reason:
              </span>
              <span>{item.reason}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
};
