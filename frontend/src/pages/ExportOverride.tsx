import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBlend } from '../hooks/useBlend';
import { api, ApiError } from '../api/client';
import { WeatherParameter, LeadTimeHours } from '../api/types';
import { ParameterToggle } from '../components/ParameterToggle';
import { LeadTimeSelect } from '../components/LeadTimeSelect';
import { ToastContainer, ToastMessage } from '../components/Toast';
import { CardSkeleton } from '../components/Skeletons';
import { SOURCE_COLORS } from '../lib/colors';
import { formatValue, formatPercentage, formatUnit } from '../lib/format';
import {
  Download,
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

  const { data, loading, error, refetch } = useBlend(region, lead, param);

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

  // Handle slider drag
  const handleSliderChange = (sourceName: string, value: number) => {
    setWeights((prev) => ({
      ...prev,
      [sourceName]: parseFloat(value.toFixed(3)),
    }));
    setHasModified(true);
  };

  // Compute live total
  const currentTotal = Object.values(weights).reduce((a, b) => a + b, 0);
  const isValidTotal = Math.abs(currentTotal - 1.0) <= 0.001;

  // "Normalize" helper button
  const handleNormalize = () => {
    if (currentTotal === 0) return;
    const normalized: Record<string, number> = {};
    const keys = Object.keys(weights);
    let sum = 0;

    keys.forEach((key, idx) => {
      if (idx === keys.length - 1) {
        // Last element gets exact remainder to guarantee sum = 1.000
        normalized[key] = parseFloat((1.0 - sum).toFixed(3));
      } else {
        const val = parseFloat((weights[key] / currentTotal).toFixed(3));
        normalized[key] = val;
        sum += val;
      }
    });

    setWeights(normalized);
    setHasModified(true);
    addToast('info', 'Weights Normalized', 'All source weights adjusted to total 1.000 exactly.');
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
  const manualBlend = data?.sources
    ? parseFloat(
        data.sources
          .reduce((sum, s) => sum + s.value * (weights[s.source] ?? s.weight), 0)
          .toFixed(1)
      )
    : 0;
  const blendDelta = parseFloat((manualBlend - autoBlend).toFixed(1));

  // Apply override via API
  const handleApplyOverride = async () => {
    if (!isValidTotal) {
      addToast(
        'error',
        'Validation Error (HTTP 422)',
        `Weights must sum to 1.00 (±0.001). Current total is ${currentTotal.toFixed(3)}. Use the 'Normalize' button to auto-balance.`
      );
      return;
    }

    setApplying(true);
    try {
      await api.weights.override(weights, region, lead, param);
      await refetch();
      addToast('success', 'Override Applied Successfully', `Blended forecast updated to ${manualBlend} ${data?.unit}.`);
      setHasModified(false);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 422) {
        addToast(
          'error',
          'Unprocessable Entity (422)',
          err.message || 'Model weights must sum to 1.00 (±0.001).'
        );
      } else {
        addToast('error', 'Override Failed', err?.message || 'Server rejected manual weights.');
      }
    } finally {
      setApplying(false);
    }
  };

  // Export handler
  const handleDownload = async (format: 'csv' | 'pdf') => {
    setExportingFormat(format);
    try {
      await api.export.download(format, {
        region,
        lead,
        param,
        blended_value: manualBlend,
        weights,
      });
      addToast(
        'success',
        `${format.toUpperCase()} Generated`,
        `Report for ${region} (+${lead}h) downloaded to your local device.`
      );
    } catch (err: any) {
      addToast('error', 'Export Error', 'Unable to render download bundle.');
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-accent/15 text-accent">
              <Sliders className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">
              Operational Governance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-text-primary tracking-tight">
            Export Center & Manual Weight Override
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Download certified bulletins or fine-tune multi-model ensembling weights with real-time validation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ParameterToggle
            parameter={param}
            onChange={(p) => updateParam('param', p)}
          />
          <LeadTimeSelect
            leadTime={lead}
            onChange={(l) => updateParam('lead', String(l))}
          />
        </div>
      </div>

      {/* Two Column Split: Left Export Hub | Right Weight Override Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Export Hub & Preview Card */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-border/80 shadow-md space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-heading font-bold text-text-primary">
                Meteorological Export Hub
              </h2>
              <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">
                MoES Certified
              </span>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Generate standardized data packages for field officers, researchers and media bulletins.
            </p>
          </div>

          {/* Action Download Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleDownload('csv')}
              disabled={exportingFormat !== null}
              className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-surface hover:bg-surface-hover text-text-primary border border-border/80 font-semibold text-xs transition-all duration-200 group hover:border-accent/40 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>{exportingFormat === 'csv' ? 'Generating...' : 'Export CSV Data'}</span>
            </button>

            <button
              onClick={() => handleDownload('pdf')}
              disabled={exportingFormat !== null}
              className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 font-semibold text-xs transition-all duration-200 shadow-glow-teal disabled:opacity-50"
            >
              <FileText className="w-4 h-4 text-slate-950" />
              <span>{exportingFormat === 'pdf' ? 'Rendering...' : 'Download PDF Bulletin'}</span>
            </button>
          </div>

          {/* Live Document Preview Card */}
          <div className="p-4 rounded-xl bg-surface/70 border border-border/70 space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-border/50 pb-2">
              <span className="font-bold text-text-primary">Live Export Contents Preview</span>
              <span className="font-mono text-text-muted">ISO-8601 FORMAT</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-text-secondary">
                <span>Subdivision / Region:</span>
                <span className="font-semibold text-text-primary">{region}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Lead Horizon:</span>
                <span className="font-mono text-text-primary">+{lead}h (Forecast Horizon)</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Evaluated Parameter:</span>
                <span className="capitalize text-text-primary">{param} ({data?.unit})</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Blended Output:</span>
                <span className="font-mono font-bold text-accent">
                  {manualBlend} {data?.unit}
                </span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Ground Truth (AWS):</span>
                <span className="font-mono text-amber-400 font-semibold">
                  {data?.observed_value} {data?.unit}
                </span>
              </div>
            </div>

            {/* Model Weight Breakdown Preview Table */}
            <div className="pt-2 border-t border-border/50">
              <span className="text-[11px] font-semibold text-text-muted block mb-1.5">
                Included Model Weights:
              </span>
              <div className="space-y-1 text-[11px]">
                {data?.sources?.map((s) => (
                  <div key={s.source} className="flex justify-between text-text-secondary">
                    <span className="truncate max-w-[180px]">{s.source}</span>
                    <span className="font-mono font-medium text-text-primary">
                      {formatPercentage(weights[s.source] ?? s.weight)} ({s.value} {data.unit})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-accent/10 border border-accent/20 flex items-center gap-2 text-[11px] text-accent">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Includes digital cryptographic checksum & IMD verification token</span>
            </div>
          </div>
        </div>

        {/* Right Column: Manual Weight Override Studio */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-border/80 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-heading font-bold text-text-primary">
                Multi-Model Weight Override Studio
              </h2>
              <p className="text-xs text-text-muted">
                Adjust source contributions. Sum must equal 1.000 (±0.001) for meteorologist validation.
              </p>
            </div>

            {/* Helper Buttons: Normalize & Reset */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleNormalize}
                className="px-3 py-1.5 rounded-xl bg-surface-hover hover:bg-surface-active text-text-primary border border-border text-xs font-semibold transition-colors flex items-center gap-1.5"
                title="Automatically adjust weights proportionally to equal 1.000"
              >
                <Scale className="w-3.5 h-3.5 text-accent" />
                <span>Normalize</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 rounded-xl bg-surface-hover hover:bg-surface-active text-text-secondary hover:text-text-primary border border-border text-xs font-medium transition-colors flex items-center gap-1.5"
                title="Restore default inverse-variance weights"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Live Blend Comparison Preview Banner */}
          <div className="p-4 rounded-xl bg-surface/80 border border-border/80 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <div className="text-center sm:text-left">
              <span className="text-[11px] text-text-muted uppercase tracking-wider block">
                Automatic Blend
              </span>
              <span className="text-xl font-bold font-heading text-text-primary">
                {autoBlend} <span className="text-xs font-normal text-text-muted">{data?.unit}</span>
              </span>
            </div>

            <div className="text-center">
              <span className="text-[11px] text-text-muted uppercase tracking-wider block">
                Manual Override Blend
              </span>
              <span className="text-xl font-bold font-heading text-accent">
                {manualBlend} <span className="text-xs font-normal text-accent/70">{data?.unit}</span>
              </span>
            </div>

            <div className="text-center sm:text-right">
              <span className="text-[11px] text-text-muted uppercase tracking-wider block">
                Forecast Delta (Δ)
              </span>
              <div className="inline-flex items-center gap-1">
                {blendDelta > 0 ? (
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                ) : blendDelta < 0 ? (
                  <TrendingDown className="w-4 h-4 text-sky-400" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-400" />
                )}
                <span
                  className={`text-sm font-bold font-mono ${
                    blendDelta === 0
                      ? 'text-emerald-400'
                      : blendDelta > 0
                      ? 'text-amber-400'
                      : 'text-sky-400'
                  }`}
                >
                  {blendDelta > 0 ? `+${blendDelta}` : blendDelta} {data?.unit}
                </span>
              </div>
            </div>
          </div>

          {/* Sliders per source */}
          {loading ? (
            <CardSkeleton className="h-64" />
          ) : (
            <div className="space-y-5">
              {data?.sources?.map((s) => {
                const currentVal = weights[s.source] !== undefined ? weights[s.source] : s.weight;
                const color = SOURCE_COLORS[s.source] || '#38bdf8';

                return (
                  <div
                    key={s.source}
                    className="p-4 rounded-xl border border-border/60 bg-surface/40 hover:bg-surface/60 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs sm:text-sm font-semibold text-text-primary">
                          {s.source}
                        </span>
                        <span className="text-xs text-text-muted">({s.value} {data.unit})</span>
                      </div>
                      <span className="text-xs sm:text-sm font-bold font-mono text-text-primary">
                        {(currentVal * 100).toFixed(1)}% ({currentVal.toFixed(3)})
                      </span>
                    </div>

                    {/* Range slider */}
                    <input
                      type="range"
                      min="0.00"
                      max="1.00"
                      step="0.01"
                      value={currentVal}
                      onChange={(e) => handleSliderChange(s.source, parseFloat(e.target.value))}
                      className="w-full h-2 bg-surface-hover rounded-lg appearance-none cursor-pointer accent-accent focus:outline-none"
                      aria-label={`${s.source} weight slider`}
                    />

                    <div className="flex justify-between text-[10px] text-text-muted font-mono">
                      <span>0.000</span>
                      <span>Default Auto: {s.weight.toFixed(3)}</span>
                      <span>1.000</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Total Sum Status & Apply Button */}
          <div className="p-4 rounded-xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              {isValidTotal ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 animate-pulse" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-text-primary">
                    Weight Sum Total:
                  </span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      isValidTotal ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {currentTotal.toFixed(3)} / 1.000
                  </span>
                </div>
                <p className="text-[11px] text-text-muted">
                  {isValidTotal
                    ? 'Valid configuration: ready for override execution'
                    : 'Discrepancy detected: must equal 1.000 (±0.001) to apply'}
                </p>
              </div>
            </div>

            <button
              onClick={handleApplyOverride}
              disabled={!isValidTotal || applying || !hasModified}
              className="py-2.5 px-6 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 font-bold text-xs transition-all duration-200 shadow-glow-teal disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {applying ? (
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Apply Weight Override</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
