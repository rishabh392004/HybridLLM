import React from 'react';
import { SourceBlendDetail } from '../api/types';
import { TrendArrow } from './TrendArrow';
import { formatPercentage } from '../lib/format';
import { getSourceColor } from '../lib/colors';

interface WeightBarsProps {
  sources: SourceBlendDetail[];
  className?: string;
}

export const WeightBars: React.FC<WeightBarsProps> = ({ sources, className = '' }) => {
  const maxWeight = Math.max(...sources.map((s) => s.weight), 0.01);

  return (
    <div className={`space-y-3 ${className}`} role="region" aria-label="Forecast source model weight allocation">
      {sources.map((item) => {
        const pct = item.weight * 100;
        const barPct = (item.weight / maxWeight) * 100;
        const color = getSourceColor(item.source);
        const delta = item.previous_weight ? item.weight - item.previous_weight : 0;
        const isTop = item.weight === maxWeight;

        return (
          <div
            key={item.source}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] hover:bg-[var(--bg-panel-raised)] transition-colors duration-150 overflow-hidden"
            style={isTop ? { borderColor: `${color}30` } : {}}
          >
            {/* Top accent for leading source */}
            {isTop && (
              <div className="h-[2px] w-full" style={{ background: color, opacity: 0.7 }} />
            )}

            <div className="px-4 pt-3.5 pb-3">
              {/* Header row */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}60` }}
                    aria-hidden="true"
                  />
                  <span className="text-[13px] font-semibold text-text-primary truncate">
                    {item.source}
                  </span>
                  {isTop && (
                    <span
                      className="text-[9px] px-1.5 py-px rounded-full font-bold uppercase tracking-wider"
                      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
                    >
                      Leading
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <TrendArrow current={item.weight} previous={item.previous_weight} />
                  <span
                    className="font-data text-[15px] font-bold tabular-nums"
                    style={{ color }}
                  >
                    {formatPercentage(item.weight)}
                  </span>
                </div>
              </div>

              {/* Weight bar */}
              <div className="weight-track mb-2.5">
                <div
                  className="weight-fill"
                  style={{
                    width: `${Math.min(100, Math.max(0, barPct))}%`,
                    background: `linear-gradient(90deg, ${color}99, ${color})`,
                  }}
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${item.source} weight ${formatPercentage(item.weight)}`}
                />
              </div>

              {/* Reason */}
              {item.reason && (
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  <span
                    className="font-bold uppercase tracking-widest text-[9px] mr-1.5"
                    style={{ color }}
                  >
                    ›
                  </span>
                  {item.reason}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
