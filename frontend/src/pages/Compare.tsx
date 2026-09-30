import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBlend } from '../hooks/useBlend';
import { WeatherParameter, LeadTimeHours } from '../api/types';
import { getMockBlend } from '../api/mock';
import { ParameterToggle } from '../components/ParameterToggle';
import { LeadTimeSelect } from '../components/LeadTimeSelect';
import { StatCard } from '../components/StatCard';
import { CardSkeleton, ChartSkeleton } from '../components/Skeletons';
import { getSourceColor } from '../lib/colors';
import { formatValue } from '../lib/format';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Brush,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  BarChart3,
  Award,
  Sparkles,
  TrendingDown,
  Activity,
  Layers,
  CheckCircle2,
  ZoomIn,
  Eye,
  EyeOff,
} from 'lucide-react';

export const ComparePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const region = searchParams.get('region') || 'Konkan & Goa';
  const param = (searchParams.get('param') as WeatherParameter) || 'rainfall';
  const lead = (Number(searchParams.get('lead')) as LeadTimeHours) || 24;

  const [activeTab, setActiveTab] = useState<'timeline' | 'errors'>('timeline');

  // Source visibility toggles
  const [visibleSources, setVisibleSources] = useState<Record<string, boolean>>({
    'ForeCombine Blend': true,
    'Observed Ground Truth': true,
    'Ensemble Spread': true,
    'NWP (NCMRWF/GFS)': true,
    'AI Model (FourCastNet)': true,
    'Ensemble (GEFS)': true,
    'WRF Regional': true,
  });

  const toggleSourceVisibility = (name: string) => {
    setVisibleSources((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const { data: currentBlend, loading } = useBlend(region, lead, param);

  // Lead times horizon list for multi-line forecast
  const leadTimes: LeadTimeHours[] = [24, 48, 72, 120];

  // Build time-series multi-line forecast data across lead times
  const timeSeriesData = useMemo(() => {
    return leadTimes.map((lt) => {
      const b = getMockBlend(region, lt, param);
      const row: Record<string, any> = {
        lead: `+${lt}h`,
        leadHours: lt,
        'ForeCombine Blend': b.blended_value,
        'Observed Ground Truth': b.observed_value,
      };

      const sourceVals: number[] = [];
      b.sources.forEach((s) => {
        row[s.source] = s.value;
        sourceVals.push(s.value);
      });

      const minVal = Math.min(...sourceVals);
      const maxVal = Math.max(...sourceVals);
      row.spreadMin = minVal;
      row.spreadMax = maxVal;
      row.spreadDelta = parseFloat((maxVal - minVal).toFixed(1));

      return row;
    });
  }, [region, param]);

  // Error breakdown at selected lead time
  const errorData = useMemo(() => {
    if (!currentBlend) return [];
    const obs = currentBlend.observed_value ?? 0;
    const items = currentBlend.sources.map((s) => ({
      name: s.source,
      shortName: s.source.split(' ')[0],
      forecast: s.value,
      observed: obs,
      error: parseFloat(Math.abs(s.value - obs).toFixed(1)),
      weight: Math.round(s.weight * 100),
      isBlend: false,
      color: getSourceColor(s.source),
    }));

    items.push({
      name: 'ForeCombine Blend',
      shortName: 'Blend',
      forecast: currentBlend.blended_value,
      observed: obs,
      error: parseFloat(Math.abs(currentBlend.blended_value - obs).toFixed(1)),
      weight: 100,
      isBlend: true,
      color: '#2dd4bf',
    });

    return items;
  }, [currentBlend]);

  const singleModels = errorData.filter((d) => !d.isBlend);
  const bestSingle = singleModels.length
    ? singleModels.reduce((min, cur) => (cur.error < min.error ? cur : min), singleModels[0])
    : null;
  const blendError = errorData.find((d) => d.isBlend)?.error ?? 0;
  const errorImprovement = bestSingle
    ? parseFloat(Math.abs(bestSingle.error - blendError).toFixed(1))
    : 0;

  // Custom Shared Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-3.5 rounded-xl border border-teal-500/30 shadow-2xl text-xs space-y-2 min-w-[220px]">
          <div className="flex items-center justify-between pb-1.5 border-b border-border">
            <span className="font-heading font-bold text-text-primary">{label} Horizon</span>
            <span className="font-mono text-[10px] text-teal-400 font-semibold">{region}</span>
          </div>
          <div className="space-y-1.5">
            {payload
              .filter((p: any) => p.dataKey !== 'spreadMin' && p.dataKey !== 'spreadMax')
              .map((p: any, idx: number) => {
                const isObserved = p.dataKey === 'Observed Ground Truth';
                const isBlend = p.dataKey === 'ForeCombine Blend';
                return (
                  <div key={idx} className="flex items-center justify-between gap-4 font-mono text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                      <span className={isBlend ? 'font-bold text-teal-300' : 'text-text-secondary'}>
                        {p.name}
                      </span>
                    </div>
                    <span
                      className={`font-bold ${
                        isObserved ? 'text-amber-400' : isBlend ? 'text-teal-400' : 'text-text-primary'
                      }`}
                    >
                      {p.value} {currentBlend?.unit}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-teal-400">
              <BarChart3 className="w-3.5 h-3.5" />
              Multi-Source Verification & Spread
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            Forecast Convergence & Verification
          </h1>
          <p className="text-[13px] text-text-secondary mt-1 max-w-lg">
            Compare 4 source models vs the optimal blend and AWS observed ground truth across lead times in{' '}
            <span className="text-text-primary font-medium">{region}</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ParameterToggle parameter={param} onChange={(p) => updateParam('param', p)} />
          <LeadTimeSelect leadTime={lead} onChange={(l) => updateParam('lead', String(l))} />

          {/* Mode switch */}
          <div className="flex items-center p-1 rounded-xl glass-panel shadow-sm">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'timeline'
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Horizon Timeline
            </button>
            <button
              onClick={() => setActiveTab('errors')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'errors'
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Error |Δ| Bars
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────── */}
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
              label="ForeCombine Blend"
              value={formatValue(currentBlend?.blended_value)}
              unit={currentBlend?.unit}
              icon={Sparkles}
              subtext={`Optimal blend at +${lead}h`}
              accentColor="var(--blend)"
            />
            <StatCard
              label="Observed Ground Truth"
              value={formatValue(currentBlend?.observed_value)}
              unit={currentBlend?.unit}
              icon={Activity}
              subtext="IMD AWS Network Verification"
              accentColor="var(--observed)"
            />
            <StatCard
              label="Optimal Error |Δ|"
              value={formatValue(blendError)}
              unit={currentBlend?.unit}
              icon={TrendingDown}
              subtext={
                errorImprovement > 0
                  ? `Improves by ${errorImprovement} ${currentBlend?.unit} over best single`
                  : 'Optimal divergence'
              }
              accentColor="#22c55e"
            />
            <StatCard
              label="Ensemble Spread"
              value={formatValue(timeSeriesData.find((t) => t.leadHours === lead)?.spreadDelta)}
              unit={currentBlend?.unit}
              icon={Layers}
              subtext="Multi-model dispersion band"
              accentColor="var(--source-ensemble)"
            />
          </>
        )}
      </div>

      {/* ── Source Visibility Chips ──────────────────────────────── */}
      <div className="p-3 rounded-2xl glass-panel flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider px-2">
          Model Layers:
        </span>
        {Object.keys(visibleSources).map((key) => {
          const isVisible = visibleSources[key];
          const isBlend = key === 'ForeCombine Blend';
          const isObserved = key === 'Observed Ground Truth';
          const isSpread = key === 'Ensemble Spread';

          let color = '#818cf8';
          if (isBlend) color = '#2dd4bf';
          else if (isObserved) color = '#f59e0b';
          else if (isSpread) color = '#0d9488';
          else color = getSourceColor(key);

          return (
            <button
              key={key}
              onClick={() => toggleSourceVisibility(key)}
              className={`chip ${isVisible ? 'chip-active' : 'opacity-40'}`}
              aria-pressed={isVisible}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-[11px] font-medium">{key}</span>
              {isVisible ? <Eye className="w-3 h-3 ml-0.5" /> : <EyeOff className="w-3 h-3 ml-0.5" />}
            </button>
          );
        })}
      </div>

      {/* ── Main Chart Area ──────────────────────────────────────── */}
      <div className="p-5 sm:p-6 rounded-2xl glass-panel space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-bold text-text-primary">
              {activeTab === 'timeline'
                ? 'Multi-Model Forecast Horizon (+24h to +120h)'
                : `Model Error |Forecast - Observed| at +${lead}h`}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              {activeTab === 'timeline'
                ? 'Includes shaded ensemble spread band, individual models, blend, and verified AWS ground truth.'
                : 'Lower error denotes superior calibration against observed ground truth.'}
            </p>
          </div>

          {activeTab === 'timeline' && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-teal-400">
              <ZoomIn className="w-3.5 h-3.5" />
              <span>Use brush slider below to zoom</span>
            </div>
          )}
        </div>

        {activeTab === 'timeline' ? (
          <div className="h-[420px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timeSeriesData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="spreadShading" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0.05} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="lead"
                  stroke="var(--text-muted)"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'monospace' }}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'monospace' }}
                  unit={` ${currentBlend?.unit || ''}`}
                />
                <RechartsTooltip content={<CustomTooltip />} />

                {/* Shaded Ensemble Spread */}
                {visibleSources['Ensemble Spread'] && (
                  <Area
                    type="monotone"
                    dataKey="spreadMax"
                    stroke="none"
                    fill="url(#spreadShading)"
                    name="Ensemble Spread"
                  />
                )}

                {/* ForeCombine Blend Line */}
                {visibleSources['ForeCombine Blend'] && (
                  <Line
                    type="monotone"
                    dataKey="ForeCombine Blend"
                    stroke="#2dd4bf"
                    strokeWidth={3.5}
                    dot={{ fill: '#2dd4bf', r: 5 }}
                    activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }}
                    name="ForeCombine Blend"
                  />
                )}

                {/* Observed Line (Dashed) */}
                {visibleSources['Observed Ground Truth'] && (
                  <Line
                    type="monotone"
                    dataKey="Observed Ground Truth"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#f59e0b', r: 4 }}
                    name="Observed Truth"
                  />
                )}

                {/* Single Models */}
                {visibleSources['NWP (NCMRWF/GFS)'] && (
                  <Line
                    type="monotone"
                    dataKey="NWP (NCMRWF/GFS)"
                    stroke="var(--source-nwp)"
                    strokeWidth={1.75}
                    dot={{ r: 3 }}
                    name="NWP (NCMRWF/GFS)"
                  />
                )}
                {visibleSources['AI Model (FourCastNet)'] && (
                  <Line
                    type="monotone"
                    dataKey="AI Model (FourCastNet)"
                    stroke="var(--source-ai)"
                    strokeWidth={1.75}
                    dot={{ r: 3 }}
                    name="AI Model (FourCastNet)"
                  />
                )}
                {visibleSources['Ensemble (GEFS)'] && (
                  <Line
                    type="monotone"
                    dataKey="Ensemble (GEFS)"
                    stroke="var(--source-ensemble)"
                    strokeWidth={1.75}
                    dot={{ r: 3 }}
                    name="Ensemble (GEFS)"
                  />
                )}
                {visibleSources['WRF Regional'] && (
                  <Line
                    type="monotone"
                    dataKey="WRF Regional"
                    stroke="var(--source-regional)"
                    strokeWidth={1.75}
                    dot={{ r: 3 }}
                    name="WRF Regional"
                  />
                )}

                {/* Brush for zoom */}
                <Brush
                  dataKey="lead"
                  height={28}
                  stroke="#2dd4bf"
                  fill="var(--bg-surface)"
                  travellerWidth={8}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[400px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={errorData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="shortName"
                  stroke="var(--text-muted)"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'monospace' }}
                  unit={` ${currentBlend?.unit || ''}`}
                />
                <RechartsTooltip
                  formatter={(val: any) => [`${val} ${currentBlend?.unit}`, 'Error |Δ|']}
                  contentStyle={{
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine y={0} stroke="var(--border)" />
                <Bar dataKey="error" radius={[8, 8, 0, 0]}>
                  {errorData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isBlend ? '#2dd4bf' : entry.color}
                      stroke={entry.isBlend ? '#5eead4' : 'transparent'}
                      strokeWidth={entry.isBlend ? 2 : 0}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
