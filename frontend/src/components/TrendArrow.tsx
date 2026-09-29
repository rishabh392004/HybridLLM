import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { formatPercentage } from '../lib/format';

interface TrendArrowProps {
  current: number;
  previous: number;
  showPercent?: boolean;
  className?: string;
}

export const TrendArrow: React.FC<TrendArrowProps> = ({
  current,
  previous,
  showPercent = true,
  className = '',
}) => {
  const diff = current - previous;
  const isUp = diff > 0.005;
  const isDown = diff < -0.005;

  if (isUp) {
    return (
      <span
        className={`inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-500 dark:text-emerald-400 ${className}`}
        aria-label={`Increased by ${formatPercentage(diff)}`}
      >
        <ArrowUpRight className="w-3.5 h-3.5" />
        {showPercent && <span>+{formatPercentage(diff)}</span>}
      </span>
    );
  }

  if (isDown) {
    return (
      <span
        className={`inline-flex items-center gap-0.5 text-xs font-semibold text-red-500 dark:text-red-400 ${className}`}
        aria-label={`Decreased by ${formatPercentage(Math.abs(diff))}`}
      >
        <ArrowDownRight className="w-3.5 h-3.5" />
        {showPercent && <span>{formatPercentage(diff)}</span>}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium text-text-muted ${className}`}
      aria-label="No change in weight"
    >
      <Minus className="w-3 h-3" />
      {showPercent && <span>0.0%</span>}
    </span>
  );
};
