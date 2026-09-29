import React from 'react';

export const CardSkeleton: React.FC<{ className?: string }> = ({ className = 'h-36' }) => {
  return (
    <div
      className={`rounded-2xl border border-border/70 bg-surface/50 p-5 relative overflow-hidden skeleton-shimmer ${className}`}
      aria-hidden="true"
    >
      <div className="h-4 w-28 bg-surface-hover rounded-md mb-3" />
      <div className="h-8 w-44 bg-surface-hover rounded-md mb-4" />
      <div className="h-3 w-3/4 bg-surface-hover/70 rounded-md" />
    </div>
  );
};

export const ChartSkeleton: React.FC<{ className?: string }> = ({ className = 'h-72' }) => {
  return (
    <div
      className={`rounded-2xl border border-border/70 bg-surface/50 p-6 relative overflow-hidden skeleton-shimmer flex flex-col justify-between ${className}`}
      aria-hidden="true"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="h-5 w-48 bg-surface-hover rounded-md" />
        <div className="h-5 w-24 bg-surface-hover rounded-md" />
      </div>
      <div className="flex items-end justify-between gap-4 h-48 px-2">
        <div className="w-16 h-36 bg-surface-hover rounded-t-lg" />
        <div className="w-16 h-28 bg-surface-hover rounded-t-lg" />
        <div className="w-16 h-44 bg-surface-hover rounded-t-lg" />
        <div className="w-16 h-32 bg-surface-hover rounded-t-lg" />
        <div className="w-16 h-40 bg-accent/20 rounded-t-lg border-t-2 border-accent/40" />
      </div>
      <div className="h-3 w-full bg-surface-hover/40 rounded-md mt-4" />
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div
      className="rounded-2xl border border-border/70 bg-surface/50 p-4 relative overflow-hidden skeleton-shimmer space-y-3"
      aria-hidden="true"
    >
      <div className="h-8 w-full bg-surface-hover rounded-lg mb-2" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 w-full bg-surface-hover/60 rounded-lg flex items-center justify-between px-4">
          <div className="h-4 w-36 bg-surface-active rounded" />
          <div className="h-4 w-20 bg-surface-active rounded" />
          <div className="h-4 w-20 bg-surface-active rounded" />
          <div className="h-6 w-16 bg-surface-active rounded-full" />
        </div>
      ))}
    </div>
  );
};

export const WeightBarsSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 skeleton-shimmer" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl border border-border/60 bg-surface/50 space-y-2">
          <div className="flex justify-between">
            <div className="h-4 w-32 bg-surface-hover rounded" />
            <div className="h-4 w-16 bg-surface-hover rounded" />
          </div>
          <div className="h-3 w-full bg-surface-hover rounded-full" />
          <div className="h-3 w-2/3 bg-surface-hover/50 rounded" />
        </div>
      ))}
    </div>
  );
};
