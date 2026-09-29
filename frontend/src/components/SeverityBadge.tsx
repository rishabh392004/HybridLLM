import React from 'react';
import { AlertSeverity } from '../api/types';
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { getSeverityBadgeStyles } from '../lib/colors';

interface SeverityBadgeProps {
  severity: AlertSeverity | 'normal';
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  showIcon = true,
  size = 'md',
  className = '',
}) => {
  const styles = getSeverityBadgeStyles(severity as AlertSeverity);

  const icons = {
    severe: AlertCircle,
    warning: AlertTriangle,
    advisory: Info,
    normal: CheckCircle2,
  };

  const IconComponent = icons[severity] || Info;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2',
  };

  const labelMap = {
    severe: 'Severe Warning',
    warning: 'Active Warning',
    advisory: 'Advisory Alert',
    normal: 'Normal Status',
  };

  return (
    <span
      className={`inline-flex items-center uppercase tracking-wider rounded-full border ${styles.bg} ${styles.text} ${styles.border} ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label={`Severity level: ${severity}`}
    >
      {showIcon && <IconComponent className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{labelMap[severity] || severity}</span>
    </span>
  );
};
