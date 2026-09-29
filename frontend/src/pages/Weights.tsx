import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBlend } from '../hooks/useBlend';
import { WeatherParameter, LeadTimeHours } from '../api/types';
import { ParameterToggle } from '../components/ParameterToggle';
import { LeadTimeSelect } from '../components/LeadTimeSelect';
import { WeightBars } from '../components/WeightBars';
import { StatCard } from '../components/StatCard';
import { CardSkeleton, WeightBarsSkeleton } from '../components/Skeletons';
import { formatValue } from '../lib/format';
import {
  Scale,
  Brain,
  Layers,
  HelpCircle,
  Sparkles,
  CheckCircle,
  Calendar,
  Activity,
} from 'lucide-react';

export const WeightsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const region = searchParams.get('region') || 'Konkan & Goa';
  const param = (searchParams.get('param') as WeatherParameter) || 'rainfall';
  const lead = (Number(searchParams.get('lead')) as LeadTimeHours) || 24;

  const [season, setSeason] = useState('Active Southwest Monsoon');

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const { data, loading, error, refetch } = useBlend(region, lead, param);

  const topSource = data?.sources?.reduce(
    (max, cur) => (cur.weight > max.weight ? cur : max),
    data.sources[0]
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-accent/15 text-accent">
              <Scale className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">
              Dynamic Ensembling Core
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-text-primary tracking-tight">
            Adaptive Model Weight Distribution
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Real-time weight allocation computed from rolling forecast error variances across {region}.
          </p>
        </div>

        {/* Global Controls & Season Regime Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <ParameterToggle
            parameter={param}
            onChange={(p) => updateParam('param', p)}
          />
          <LeadTimeSelect
            leadTime={lead}
            onChange={(l) => updateParam('lead', String(l))}
          />

          {/* Season / Regime Filter */}
          <div className="flex items-center gap-1.5 bg-surface/90 border border-border rounded-xl px-3 py-1.5 shadow-sm text-xs">
            <Calendar className="w-3.5 h-3.5 text-text-muted" />
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="bg-transparent text-text-primary font-medium focus:outline-none cursor-pointer"
              aria-label="Filter synoptic weather season"
            >
              <option value="Active Southwest Monsoon" className="bg-surface">Monsoon Regime</option>
              <option value="Post-Monsoon Convective" className="bg-surface">Post-Monsoon Transition</option>
              <option value="Pre-Monsoon Squalls" className="bg-surface">Pre-Monsoon Convective</option>
              <option value="Winter Western Disturbance" className="bg-surface">Western Disturbance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Blended Target Output"
              value={formatValue(data?.blended_value)}
              unit={data?.unit}
              icon={Sparkles}
              subtext={`Horizon +${lead}h`}
              accentColor="#2dd4bf"
            />
            <StatCard
              label="Top Weighted Engine"
              value={topSource ? `${Math.round(topSource.weight * 100)}%` : '--'}
              unit={topSource?.source.split(' ')[0]}
              icon={Brain}
              subtext={topSource?.source}
              accentColor="#34d399"
            />
            <StatCard
              label="Observed Reference"
              value={formatValue(data?.observed_value)}
              unit={data?.unit}
              icon={Activity}
              subtext="IMD AWS Network"
              accentColor="#f59e0b"
            />
            <StatCard
              label="Verification Window"
              value="30"
              unit="Days"
              icon={Layers}
              subtext="Rolling RMSE calibration"
              accentColor="#818cf8"
            />
          </>
        )}
      </div>

      {/* Main Grid: Weight Bars Left, Explainer Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Horizontal Animated Weight Bars */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-border/80 shadow-md">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base sm:text-lg font-heading font-bold text-text-primary">
                Current Source Weight Allocations
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Normalized allocation (sum = 100%) with rolling trend trajectories
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-accent font-semibold px-2.5 py-1 rounded-full bg-accent/10 border border-accent/25">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Calibrated</span>
            </div>
          </div>

          {loading ? (
            <WeightBarsSkeleton />
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              <p>{error}</p>
              <button
                onClick={() => refetch()}
                className="mt-2 text-xs font-semibold text-accent underline"
              >
                Retry calculation
              </button>
            </div>
          ) : data?.sources ? (
            <WeightBars sources={data.sources} />
          ) : null}
        </div>

        {/* Right Column: "Why This Weight?" Meteorological Explainer */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-teal-500/30 bg-teal-950/20 shadow-glow-teal relative overflow-hidden">
            <div className="flex items-center gap-2 text-teal-400 mb-3">
              <HelpCircle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-heading font-bold text-text-primary">
                Why this weight?
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-4">
              ForeCombine applies an adaptive inverse-variance blending kernel. Rather than relying on static
              averaging, weights are continuously recalibrated according to each model's verified skill over
              the preceding 30 days:
            </p>

            <div className="p-3 rounded-xl bg-surface/90 border border-border/80 font-mono text-xs text-accent text-center mb-4 shadow-inner">
              w_i = (1 / RMSE_i²) / ∑ (1 / RMSE_j²)
            </div>

            <div className="space-y-2.5 text-xs text-text-secondary">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1.5" />
                <span>
                  <strong className="text-text-primary">Orographic Penalty:</strong> Physics NWP models
                  habitually over-accumulate rain on windward mountain slopes (e.g. Western Ghats). Their weight
                  is automatically pruned.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1.5" />
                <span>
                  <strong className="text-text-primary">Neural Surrogate Gain:</strong> AI models
                  (FourCastNet / GraphCast) capture non-linear moisture advection with lower root-mean-square
                  error at 48h lead times and receive higher weight.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1.5" />
                <span>
                  <strong className="text-text-primary">Ensemble Spread Insurance:</strong> GEFS ensembles
                  are maintained at a minimum baseline weight to safeguard against unpredicted rapid cyclogenesis.
                </span>
              </div>
            </div>
          </div>

          {/* Operational Policy Card */}
          <div className="glass-panel p-5 rounded-2xl border border-border/70 text-xs text-text-muted space-y-2">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Governance & Override Safeguards
            </h4>
            <p className="leading-relaxed">
              Meteorologists retain full authority to manually tune weights in the{' '}
              <strong className="text-accent font-medium">Export & Override</strong> console. Manual
              allocations are logged with agency credentials to maintain an audit trail for emergency operations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
