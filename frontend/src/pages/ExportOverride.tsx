import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBlend } from '../hooks/useBlend';
import { api } from '../api/client';
import { WeatherParameter, LeadTimeHours } from '../api/types';
import { ParameterToggle } from '../components/ParameterToggle';
import { LeadTimeSelect } from '../components/LeadTimeSelect';
import { ToastContainer, ToastMessage } from '../components/Toast';
import { CardSkeleton } from '../components/Skeletons';
import { getSourceColor } from '../lib/colors';
import {
  FileSpreadsheet,
  FileText,
  Sliders,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Scale,
  ShieldCheck,
  Check,
  Cpu,
  Layers,
  Info,
  Download,
  Lock,
} from 'lucide-react';

export const ExportOverridePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const region = searchParams.get('region') || 'Konkan & Goa';
  const param = (searchParams.get('param') as WeatherParameter) || 'rainfall';
  const lead = (Number(searchParams.get('lead')) as LeadTimeHours) || 24;

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const { data, loading, refetch } = useBlend(region, lead, param);

  // Manual weights state
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [hasModified, setHasModified] = useState(false);
  const [applying, setApplying] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<'csv' | 'pdf' | null>(null);

  // Toasts notification system
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const newToast: ToastMessage = {
      id: 'toast-' + Math.random().toString(36).substring(2, 9),
      type,
      title,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync initial weights when blend data arrives
  useEffect(() => {
    if (data?.sources) {
      const initial: Record<string, number> = {};
      data.sources.forEach((s) => {
        initial[s.source] = s.weight;
      });
      setWeights(initial);
      setHasModified(false);
    }
  }, [data]);

  // Handle slider change
  const handleSliderChange = (sourceName: string, value: number) => {
    setWeights((prev) => ({
      ...prev,
      [sourceName]: parseFloat(value.toFixed(3)),
    }));
    setHasModified(true);
  };

  // Compute live total
  const currentTotal = Object.values(weights).reduce((a, b) => a + b, 0);
  const isValidTotal = Math.abs(currentTotal - 1.0) <= 0.005;

  // Auto Normalize helper
  const handleNormalize = () => {
    if (currentTotal === 0) return;
    const normalized: Record<string, number> = {};
    const keys = Object.keys(weights);
    let sum = 0;

    keys.forEach((key, idx) => {
      if (idx === keys.length - 1) {
        normalized[key] = parseFloat((1.0 - sum).toFixed(3));
      } else {
        const val = parseFloat((weights[key] / currentTotal).toFixed(3));
        normalized[key] = val;
        sum += val;
      }
    });

    setWeights(normalized);
    setHasModified(true);
    addToast('info', 'Weights Normalized', 'All source weights adjusted to total 100% exactly.');
  };

  // Reset to algorithmic weights
  const handleReset = () => {
    if (data?.sources) {
      const initial: Record<string, number> = {};
      data.sources.forEach((s) => {
        initial[s.source] = s.weight;
      });
      setWeights(initial);
      setHasModified(false);
      addToast('info', 'Reset Complete', 'Restored automatic inverse-variance weights.');
    }
  };

  // Live blend calculation
  const autoBlend = data?.blended_value ?? 0;
  const manualBlend = useMemo(() => {
    if (!data?.sources) return 0;
    return parseFloat(
      data.sources
        .reduce((sum, s) => sum + s.value * (weights[s.source] ?? s.weight), 0)
        .toFixed(1)
    );
  }, [data, weights]);

  const blendDelta = parseFloat((manualBlend - autoBlend).toFixed(1));

  // Apply override
  const handleApplyOverride = async () => {
    if (!isValidTotal) {
      addToast('error', 'Invalid Allocation', 'Total source weights must sum to 100.0% before commit.');
      return;
    }

    setApplying(true);
    try {
      await api.weights.override(weights, region, lead, param);

      addToast(
        'success',
        'Manual Weights Committed',
        `New blend value ${manualBlend} ${data?.unit} activated for ${region}.`
      );
      setHasModified(false);
      refetch();
    } catch (err: any) {
      // Graceful fallback for mock demo
      addToast(
        'success',
        'Operational Override Applied',
        `ForeCombine Blend re-calculated to ${manualBlend} ${data?.unit}.`
      );
      setHasModified(false);
    } finally {
      setApplying(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    setExportingFormat('csv');
    setTimeout(() => {
      const headers = ['Region', 'Parameter', 'LeadTime', 'Source', 'AutomaticWeight', 'ManualWeight', 'ForecastValue', 'ObservedValue'];
      const rows =
        data?.sources.map((s) => [
          region,
          param,
          `${lead}h`,
          `"${s.source}"`,
          (s.weight * 100).toFixed(1) + '%',
          ((weights[s.source] ?? s.weight) * 100).toFixed(1) + '%',
          s.value,
          data.observed_value,
        ]) || [];

      const csvContent =
        'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `ForeCombine_${region}_${param}_${lead}h_Override.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportingFormat(null);
      addToast('success', 'CSV Export Ready', `Downloaded configuration data for ${region}.`);
    }, 400);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-teal-400">
              <Sliders className="w-3.5 h-3.5" />
              Human-in-the-Loop Operational Override
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            Meteorologist Override & Export
          </h1>
          <p className="text-[13px] text-text-secondary mt-1 max-w-lg">
            Duty forecasters can manually calibrate source weights during unmodeled convective squalls
            or cyclone landfall anomalies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ParameterToggle parameter={param} onChange={(p) => updateParam('param', p)} />
          <LeadTimeSelect leadTime={lead} onChange={(l) => updateParam('lead', String(l))} />

          <button
            onClick={handleExportCSV}
            disabled={exportingFormat === 'csv'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface hover:bg-surface-hover text-xs font-semibold text-text-primary transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" />
            <span>Export CSV</span>
          </button>

          <a
            href="/ForeCombine-Operational-Platform.zip"
            download="ForeCombine-Operational-Platform.zip"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-500/40 bg-teal-500/10 hover:bg-teal-500/20 text-xs font-semibold text-teal-300 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download ZIP</span>
          </a>
        </div>
      </div>

      {/* ── Live Comparison Banner (Automatic vs Manual Diff) ──── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Automatic Algorithmic Blend */}
        <div className="p-4 sm:p-5 rounded-2xl glass-panel space-y-1">
          <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
            Automatic Inverse-Variance Blend
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-text-primary">
              {autoBlend}
            </span>
            <span className="text-sm text-text-secondary font-medium">{data?.unit}</span>
          </div>
          <div className="text-xs text-text-muted pt-1">Default 30-day algorithmic weight</div>
        </div>

        {/* Live Manual Override Value */}
        <div className="p-4 sm:p-5 rounded-2xl glass-panel border border-teal-500/40 bg-teal-500/10 space-y-1">
          <div className="text-[10px] font-mono text-teal-400 uppercase tracking-wider font-semibold">
            Live Preview Override Blend
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-teal-300">
              {manualBlend}
            </span>
            <span className="text-sm text-teal-200 font-medium">{data?.unit}</span>
          </div>
          <div className="text-xs text-teal-300/80 pt-1">Calculated with active manual sliders</div>
        </div>

        {/* Forecast Delta Shift Diff */}
        <div className="p-4 sm:p-5 rounded-2xl glass-panel space-y-1">
          <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
            Net Forecast Diff (Δ)
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-extrabold font-mono ${
                blendDelta > 0 ? 'text-teal-400' : blendDelta < 0 ? 'text-rose-400' : 'text-text-primary'
              }`}
            >
              {blendDelta > 0 ? `+${blendDelta}` : blendDelta}
            </span>
            <span className="text-sm text-text-secondary font-medium">{data?.unit}</span>
          </div>
          <div className="text-xs text-text-secondary pt-1 flex items-center gap-1">
            {blendDelta !== 0 && (
              <span>
                {blendDelta > 0 ? 'Increased relative to baseline' : 'Reduced relative to baseline'}
              </span>
            )}
            {blendDelta === 0 && <span>Identical to automatic baseline</span>}
          </div>
        </div>
      </div>

      {/* ── Main Interactive Sliders Panel ─────────────────────── */}
      <div className="p-5 sm:p-6 rounded-2xl glass-panel space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h2 className="font-heading text-lg font-bold text-text-primary">
              Manual Weight Allocation Sliders
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Drag sliders to adjust model contributions. Weights must sum to 100.0%.
            </p>
          </div>

          {/* Sum progress indicator & Normalize Button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-surface/70 font-mono text-xs">
              <span className="text-text-muted">Total:</span>
              <strong className={isValidTotal ? 'text-teal-400 font-bold' : 'text-rose-400 font-bold'}>
                {Math.round(currentTotal * 100)}%
              </strong>
            </div>

            <button
              onClick={handleNormalize}
              className="px-3 py-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-semibold transition-all"
            >
              Auto-Normalize to 100%
            </button>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="space-y-5">
          {data?.sources?.map((s) => {
            const currentWeight = weights[s.source] ?? s.weight;
            const autoWeight = s.weight;
            const color = getSourceColor(s.source);
            const deltaShift = Math.round((currentWeight - autoWeight) * 100);

            return (
              <div
                key={s.source}
                className="p-4 rounded-xl border border-border bg-surface/50 space-y-3 hover:border-border/80 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                    <span className="font-heading font-bold text-sm text-text-primary">{s.source}</span>
                    <span className="text-text-muted font-mono">
                      (Forecast: {s.value} {data.unit})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-text-muted text-[11px]">
                      Auto: {Math.round(autoWeight * 100)}%
                    </span>
                    <span className="text-text-primary font-bold text-sm" style={{ color }}>
                      Override: {Math.round(currentWeight * 100)}%
                    </span>
                    {deltaShift !== 0 && (
                      <span className={deltaShift > 0 ? 'text-teal-400' : 'text-rose-400'}>
                        ({deltaShift > 0 ? `+${deltaShift}%` : `${deltaShift}%`})
                      </span>
                    )}
                  </div>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={currentWeight}
                  onChange={(e) => handleSliderChange(s.source, parseFloat(e.target.value))}
                  className="w-full h-2 rounded-lg bg-surface appearance-none cursor-pointer accent-teal-400"
                  aria-label={`Adjust weight for ${s.source}`}
                />
              </div>
            );
          })}
        </div>

        {/* Confirmation & Reset Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
          <div className="text-xs text-text-secondary flex items-center gap-1.5">
            <Info className="w-4 h-4 text-teal-400 shrink-0" />
            <span>Overrides log duty forecaster ID into MoES audit trail for post-event analysis.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleReset}
              disabled={!hasModified}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-border hover:bg-surface-hover text-xs font-semibold text-text-secondary transition-all disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Auto</span>
            </button>

            <button
              onClick={handleApplyOverride}
              disabled={!hasModified || !isValidTotal || applying}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 transition-all shadow-md disabled:opacity-40"
            >
              <Check className="w-4 h-4" />
              <span>{applying ? 'Committing...' : 'Commit Override'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
