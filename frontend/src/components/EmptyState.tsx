import React from 'react';
import { LucideIcon, CloudOff } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = CloudOff,
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border border-dashed border-border/80 bg-surface/30 backdrop-blur-sm ${className}`}
      role="region"
      aria-label={title}
    >
      <div className="w-14 h-14 rounded-2xl bg-surface-hover/70 flex items-center justify-center text-text-muted mb-4 shadow-inner">
        <Icon className="w-7 h-7 text-accent/80" />
      </div>
      <h3 className="text-base font-semibold text-text-primary tracking-tight font-heading mb-1.5">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-text-secondary max-w-sm leading-relaxed mb-5">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-surface-hover text-text-primary hover:bg-accent hover:text-slate-950 transition-all duration-200 border border-border"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
