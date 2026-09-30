import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAlerts } from '../hooks/useAlerts';
import { useAuth } from '../context/AuthContext';
import { UserRole, AlertSeverity, WeatherAlert } from '../api/types';
import { SeverityBadge } from '../components/SeverityBadge';
import { EmptyState } from '../components/EmptyState';
import { CardSkeleton } from '../components/Skeletons';
import { ActionPdfModal } from '../components/ActionPdfModal';
import { VoiceAdvisoryModal } from '../components/VoiceAdvisoryModal';
import { getSeverityColor } from '../lib/colors';
import {
  AlertTriangle,
  ShieldAlert,
  Sprout,
  Building2,
  Radio,
  Clock,
  CheckCircle,
  FileText,
  Volume2,
  X,
  ChevronDown,
  ChevronUp,
  LucideIcon,
  Flame,
  Droplets,
  Wind,
  Filter,
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { role } = useAuth();

  const selectedRegion = searchParams.get('region') || '';
  const [activeAudience, setActiveAudience] = useState<UserRole | 'all'>(role);
  const [severityFilter, setSeverityFilter] = useState<'all' | AlertSeverity>('all');
  const [hazardFilter, setHazardFilter] = useState<string>('all');
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  // Expanded protocol state per alert ID
  const [expandedProtocols, setExpandedProtocols] = useState<Record<string, boolean>>({});

  const toggleProtocol = (id: string) => {
    setExpandedProtocols((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    if (role) setActiveAudience(role);
  }, [role]);

  const { data: alerts, loading } = useAlerts(selectedRegion);

  const clearRegionFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('region');
    setSearchParams(next, { replace: true });
  };

  const audienceKey = activeAudience === 'all' ? role : activeAudience;

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesAudience = alert.audience === audienceKey || alert.audience === 'all';
    const matchesHazard =
      hazardFilter === 'all' ||
      (alert.parameter ? alert.parameter.toLowerCase().includes(hazardFilter.toLowerCase()) : false) ||
      (alert.hazard ? alert.hazard.toLowerCase().includes(hazardFilter.toLowerCase()) : false);
    return matchesSeverity && matchesAudience && matchesHazard;
  });

  const severeCnt = alerts.filter((a) => a.severity === 'severe').length;
  const warningCnt = alerts.filter((a) => a.severity === 'warning').length;

  const audienceTabs: { id: UserRole; label: string; icon: LucideIcon; desc: string }[] = [
    {
      id: 'farmer',
      label: 'Agro Advisory',
      icon: Sprout,
      desc: 'Crop-level guidance: sowing, bund drainage, chemical sprays.',
    },
    {
      id: 'disaster_management',
      label: 'Disaster Mgmt (NDRF)',
      icon: Building2,
      desc: 'Civil protection, evacuation warnings, emergency pumping.',
    },
    {
      id: 'analyst',
      label: 'Public / Weather Desk',
      icon: Radio,
      desc: 'Transport advisories, port warning flags, regional bulletins.',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      {/* Modals */}
      {pdfModalOpen && (
        <ActionPdfModal
          alerts={filteredAlerts.length > 0 ? filteredAlerts : alerts}
          region={selectedRegion}
          onClose={() => setPdfModalOpen(false)}
        />
      )}
      {voiceModalOpen && (
        <VoiceAdvisoryModal
          region={selectedRegion}
          onClose={() => setVoiceModalOpen(false)}
        />
      )}

      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-rose-400">
              <ShieldAlert className="w-3.5 h-3.5" />
              Impact-Based Weather Directives
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            Active Alerts & Action Protocols
          </h1>
          <p className="text-[13px] text-text-secondary mt-1">
            Automated civil protection protocols and farmer bulletins generated from ForeCombine Blend
            threshold breaches.
          </p>
        </div>

        {/* Action Buttons: PDF & Audio Voice Advisories */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setVoiceModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-teal-300 border border-teal-500/40 bg-teal-500/10 hover:bg-teal-500/20 transition-all shadow-sm"
          >
            <Volume2 className="w-4 h-4 text-teal-400" />
            <span>Multi-Lingual Voice Advisory</span>
          </button>

          <button
            onClick={() => setPdfModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white border border-teal-400 bg-teal-500 hover:bg-teal-400 transition-all shadow-md text-slate-950 font-bold"
          >
            <FileText className="w-4 h-4 text-slate-950" />
            <span>Generate PDF Bulletin</span>
          </button>
        </div>
      </div>

      {/* ── Filter Bar: Audience Selector ──────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {audienceTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeAudience === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveAudience(tab.id)}
              className={`p-3.5 rounded-2xl text-left border transition-all glass-panel ${
                isActive
                  ? 'border-teal-500 bg-teal-500/15 shadow-[0_0_15px_rgba(45,212,191,0.15)]'
                  : 'hover:border-border hover:bg-surface-hover opacity-80'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-text-muted'}`} />
                  <span className="font-heading font-bold text-sm text-text-primary">{tab.label}</span>
                </div>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_#2dd4bf]" />
                )}
              </div>
              <p className="text-[11px] text-text-secondary leading-snug">{tab.desc}</p>
            </button>
          );
        })}
      </div>

      {/* ── Secondary Filter Chips: Severity, Hazard, and Region ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl glass-panel text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider px-1">
            Severity:
          </span>
          {(['all', 'severe', 'warning', 'advisory'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`chip capitalize ${severityFilter === sev ? 'chip-active' : ''}`}
            >
              {sev}
              {sev === 'severe' && severeCnt > 0 && ` (${severeCnt})`}
              {sev === 'warning' && warningCnt > 0 && ` (${warningCnt})`}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider px-1">
            Hazard:
          </span>
          {[
            { id: 'all', label: 'All Hazards' },
            { id: 'rainfall', label: 'Rainfall' },
            { id: 'wind', label: 'Wind' },
            { id: 'temperature', label: 'Temperature' },
          ].map((h) => (
            <button
              key={h.id}
              onClick={() => setHazardFilter(h.id)}
              className={`chip ${hazardFilter === h.id ? 'chip-active' : ''}`}
            >
              {h.label}
            </button>
          ))}

          {selectedRegion && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 font-mono text-xs">
              <span>Region: {selectedRegion}</span>
              <button onClick={clearRegionFilter} className="hover:text-white" aria-label="Clear region">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Alert Cards List ───────────────────────────────────── */}
      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <EmptyState
          title="No Active Severe Alerts"
          description="All blended atmospheric metrics are currently within nominal safety thresholds."
          actionText="Clear Filter Parameters"
          onAction={() => {
            setSeverityFilter('all');
            setHazardFilter('all');
            clearRegionFilter();
          }}
        />
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert, index) => {
            const alertId = alert.id || `alert-${index}`;
            const isSevere = alert.severity === 'severe';
            const isWarning = alert.severity === 'warning';
            const isExpanded = !!expandedProtocols[alertId];

            // Threshold calculation for the visual gauge
            const currentVal = alert.value || 142.5;
            const threshold = alert.threshold || 115.0;
            const pctOfThreshold = Math.min(Math.round((currentVal / threshold) * 100), 160);

            const borderColor = isSevere
              ? 'border-rose-500/40'
              : isWarning
              ? 'border-amber-500/40'
              : 'border-teal-500/30';
            const glowColor = isSevere
              ? 'shadow-[0_0_20px_rgba(244,63,94,0.15)]'
              : 'shadow-md';

            return (
              <div
                key={alertId}
                className={`p-5 sm:p-6 rounded-2xl glass-panel border transition-all ${borderColor} ${glowColor}`}
              >
                {/* Top Row: Region, Severity Badge, Lead Time Horizon */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <SeverityBadge severity={alert.severity} size="md" />
                    <span className="font-heading font-bold text-base text-text-primary">
                      {alert.region}
                    </span>
                    <span className="text-xs text-text-muted font-mono">
                      · +{alert.lead_time || 24}h Horizon
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-text-secondary">
                    <Clock className="w-3.5 h-3.5 text-teal-400" />
                    <span>Issued: {alert.timestamp || 'Just now'}</span>
                  </div>
                </div>

                {/* Main Alert Message */}
                <div className="py-4 space-y-3">
                  <h3 className="font-heading text-lg font-bold text-text-primary leading-snug">
                    {alert.hazard || `${alert.parameter ? alert.parameter.toUpperCase() : 'METEOROLOGICAL'} Directive: ${alert.region}`}
                  </h3>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                    {alert.message}
                  </p>
                </div>

                {/* Value vs Threshold Gauge */}
                <div className="p-3.5 rounded-xl border border-border bg-surface/50 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-text-muted uppercase">Forecast vs Alert Threshold</span>
                    <span className="font-bold text-text-primary">
                      {currentVal} {alert.unit} / Threshold: {threshold} {alert.unit} (
                      <strong className={pctOfThreshold >= 100 ? 'text-rose-400' : 'text-teal-400'}>
                        {pctOfThreshold}%
                      </strong>
                      )
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pctOfThreshold >= 100 ? 'bg-rose-500' : 'bg-teal-400'
                      }`}
                      style={{ width: `${Math.min(pctOfThreshold, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Expandable Action Protocol Section */}
                <div className="mt-4 pt-3 border-t border-border">
                  <button
                    onClick={() => toggleProtocol(alertId)}
                    className="w-full flex items-center justify-between text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors"
                  >
                    <span className="flex items-center gap-2 font-mono uppercase tracking-wider">
                      <ShieldAlert className="w-4 h-4" />
                      Standard Operational Action Protocol ({alert.audience})
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 p-4 rounded-xl border border-teal-500/20 bg-teal-500/10 space-y-2.5 text-xs text-text-primary animate-fade-in-up">
                      <div className="font-semibold text-teal-300 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" />
                        Execute Immediate Directive Checklist:
                      </div>
                      <ul className="space-y-1.5 pl-5 list-disc text-text-secondary leading-relaxed">
                        <li>
                          <strong>Command Notification:</strong> Alert District Disaster Control Room and local
                          block development officers.
                        </li>
                        <li>
                          <strong>Drainage Channels:</strong> Mobilize heavy de-silting machinery along coastal
                          estuaries and low-lying agricultural culverts.
                        </li>
                        <li>
                          <strong>Public Safety Broadcast:</strong> Push SMS geo-fence alerts to active mobile
                          towers in the {alert.region} perimeter.
                        </li>
                        <li>
                          <strong>Fishermen Advisory:</strong> Impose complete prohibition on deep-sea fishing
                          and coastal navigation during the +24h to +72h horizon.
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
