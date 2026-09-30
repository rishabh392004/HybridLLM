import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAlerts } from '../hooks/useAlerts';
import { useAuth } from '../context/AuthContext';
import { UserRole, AlertSeverity, WeatherAlert } from '../api/types';
import { SeverityBadge } from '../components/SeverityBadge';
import { EmptyState } from '../components/EmptyState';
import { CardSkeleton } from '../components/Skeletons';
import { RegionSelector } from '../components/RegionSelector';
import {
  AlertTriangle,
  ShieldAlert,
  Users,
  Sprout,
  Building2,
  Radio,
  Clock,
  Layers,
  CheckCircle,
  Filter,
  Zap,
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { role } = useAuth();

  const selectedRegion = searchParams.get('region') || '';

  // Audience tabs defaulting to current user role
  const [activeAudience, setActiveAudience] = useState<UserRole | 'all'>(role);
  const [severityFilter, setSeverityFilter] = useState<'all' | AlertSeverity>('all');

  // Keep active audience synced with role unless manually changed
  useEffect(() => {
    if (role) {
      setActiveAudience(role);
    }
  }, [role]);

  const { data: alerts, loading, error, refetch } = useAlerts(selectedRegion);

  const handleRegionChange = (newRegion: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('region', newRegion);
    setSearchParams(next, { replace: true });
  };

  const clearRegionFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('region');
    setSearchParams(next, { replace: true });
  };

  // Filter alerts by audience and severity
  // Same base hazard maps to different audience messages
  const audienceKey = activeAudience === 'all' ? role : activeAudience;

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesAudience = alert.audience === audienceKey || alert.audience === 'all';
    return matchesSeverity && matchesAudience;
  });

  const audienceTabs: { id: UserRole; label: string; icon: React.FC<{ className?: string }>; desc: string }[] = [
    {
      id: 'farmer',
      label: 'Farmer / Agro Advisory',
      icon: Sprout,
      desc: 'Actionable crop-level guidance on sowing, bund drainage, and chemical timings.',
    },
    {
      id: 'disaster_management',
      label: 'Disaster Management (NDRF/SDMA)',
      icon: Building2,
      desc: 'Tactical civil protection protocols, evacuation notices, and pump deployments.',
    },
    {
      id: 'analyst',
      label: 'Public / Weather Desk',
      icon: Radio,
      desc: 'Citizen safety bulletins, highway transport advisories, and grid alerts.',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-red-500/15 text-red-400">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
              Tactical Early Warning Network
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-text-primary tracking-tight">
            Hazard Bulletins & Action Directives
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Multi-tier plain language translation of blended extreme forecast thresholds.
          </p>
        </div>

        {/* Region & Severity Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {selectedRegion && (
            <button
              onClick={clearRegionFilter}
              className="px-2.5 py-1 text-xs rounded-lg bg-surface border border-border text-accent hover:bg-surface-hover flex items-center gap-1.5"
            >
              <span>Region: {selectedRegion}</span>
              <span className="text-text-muted hover:text-white">✕</span>
            </button>
          )}

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5 bg-surface/90 border border-border rounded-xl px-3 py-1.5 shadow-sm text-xs">
            <Filter className="w-3.5 h-3.5 text-text-muted" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="bg-transparent text-text-primary font-medium focus:outline-none cursor-pointer"
              aria-label="Filter alerts by severity"
            >
              <option value="all" className="bg-surface">All Severities</option>
              <option value="severe" className="bg-surface">Severe Only (Critical)</option>
              <option value="warning" className="bg-surface">Warnings</option>
              <option value="advisory" className="bg-surface">Advisories</option>
            </select>
          </div>
        </div>
      </div>

      {/* Extreme Scenario Quick Spotlight Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/40 via-surface to-amber-950/30 border border-red-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-glow-red">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 shrink-0">
            <Zap className="w-5 h-5 text-red-400 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                SIH Evaluator Demo Case: Extreme Rainfall Event
              </span>
              <span className="px-2 py-0.5 rounded-full bg-red-500/30 text-red-300 text-[10px] font-bold">
                138.4 mm/day (&gt; 115 mm threshold)
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
              Konkan & Goa triggering critical Red Alert. Toggle the audience tabs below to see how the exact
              same hazard is translated into distinct domain actions for Farmers, NDRF, and the Public.
            </p>
          </div>
        </div>
      </div>

      {/* Audience Tabs Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Audience Perspective (Click to preview domain-specific wording)
          </span>
          <span className="text-xs text-accent font-medium">
            Active Persona: {audienceKey.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {audienceTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = audienceKey === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveAudience(tab.id)}
                className={`p-3.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                  isActive
                    ? 'border-accent bg-accent/15 shadow-sm text-text-primary ring-1 ring-accent/40'
                    : 'border-border bg-surface/70 hover:bg-surface-hover text-text-secondary'
                }`}
                aria-pressed={isActive}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-accent' : 'text-text-muted'}`} />
                    <span className="text-xs sm:text-sm font-bold text-text-primary">
                      {tab.label}
                    </span>
                  </div>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                  )}
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  {tab.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Alert Card Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardSkeleton className="h-48" />
          <CardSkeleton className="h-48" />
          <CardSkeleton className="h-48" />
          <CardSkeleton className="h-48" />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <EmptyState
          title="No Active Weather Alerts for this Filter"
          description={`No active ${severityFilter === 'all' ? '' : severityFilter} hazard warnings registered for ${selectedRegion || 'the selected criteria'}. The meteorological envelope remains within safe operational limits.`}
          actionText="Reset Filter to All"
          onAction={() => {
            setSeverityFilter('all');
            clearRegionFilter();
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredAlerts.map((alert) => {
            const isSevere = alert.severity === 'severe';
            const isWarning = alert.severity === 'warning';

            return (
              <div
                key={alert.id}
                className={`glass-panel p-5 sm:p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                  isSevere
                    ? 'border-red-500/40 bg-red-950/15 shadow-glow-red'
                    : isWarning
                    ? 'border-amber-500/40 bg-amber-950/15 shadow-glow-amber'
                    : 'border-sky-500/40 bg-sky-950/15'
                }`}
              >
                {/* Top Severity Glow Line */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    isSevere ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-sky-500'
                  }`}
                />

                <div>
                  {/* Card Header: Hazard title, Region, Severity badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider font-mono">
                          {alert.region}
                        </span>
                        {alert.lead_time && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-accent font-medium">
                            <Clock className="w-3 h-3" />
                            +{alert.lead_time}h Horizon
                          </span>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-heading font-bold text-text-primary tracking-tight">
                        {alert.hazard}
                      </h3>
                    </div>

                    <SeverityBadge severity={alert.severity} size="sm" />
                  </div>

                  {/* Value vs Threshold Tag */}
                  <div className="p-3 rounded-xl bg-surface/80 border border-border/80 flex items-center justify-between text-xs mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-text-muted">Blended Forecast:</span>
                      <span className="font-bold text-text-primary font-mono text-sm">
                        {alert.value} {alert.unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-text-muted">Critical Threshold:</span>
                      <span className="font-bold text-amber-400 font-mono text-sm">
                        {alert.threshold} {alert.unit}
                      </span>
                    </div>
                  </div>

                  {/* Action Directives / Plain language text with animated swap */}
                  <div className="space-y-3">
                    <div className="transition-all duration-300 transform opacity-100 translate-y-0">
                      <span className="text-[11px] font-bold text-accent uppercase tracking-wider block mb-1">
                        Tactical Action Directive ({activeAudience.replace('_', ' ').toUpperCase()}):
                      </span>
                      <p className="text-xs sm:text-sm text-text-primary leading-relaxed bg-surface/40 p-3 rounded-xl border border-border/50">
                        {alert.message}
                      </p>
                    </div>

                    {/* Impact Sector & Action Protocol */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-[11px]">
                      <div>
                        <span className="text-text-muted block">Impact Sector:</span>
                        <span className="font-semibold text-text-primary truncate block">
                          {alert.impact_sector || 'General Environment'}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted block">Direct Intervention:</span>
                        <span className="font-semibold text-text-primary truncate block">
                          {alert.action_protocol || 'Standard SOP'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer status */}
                <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-text-muted">
                  <span>Authorized by IMD Early Warning Cell</span>
                  <span className="font-mono">PROTOCOL ACTIVE</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
