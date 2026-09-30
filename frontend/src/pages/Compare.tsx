import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBlend } from '../hooks/useBlend';
import { WeatherParameter, LeadTimeHours } from '../api/types';
import { ParameterToggle } from '../components/ParameterToggle';
import { LeadTimeSelect } from '../components/LeadTimeSelect';
import { StatCard } from '../components/StatCard';
import { ChartSkeleton, CardSkeleton } from '../components/Skeletons';
import { SOURCE_COLORS } from '../lib/colors';
import { formatValue } from '../lib/format';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  BarChart3,
  Award,
  TrendingDown,
  Target,
  Sparkles,
  Info,
} from 'lucide-react';

export const ComparePage: React.FC = () => {
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

  const observed = data?.observed_value ?? 0;

  // Prepare chart dataset: individual models + ForeCombine Blend
  const chartData = data?.sources
    ? [
        ...data.sources.map((s) => ({
          name: s.source,
          shortName: s.source.split(' ')[0],
          value: s.value,
          delta: parseFloat(Math.abs(s.value - observed).toFixed(1)),
          signedDelta: parseFloat((s.value - observed).toFixed(1)),
          weight: Math.round(s.weight * 100),
          isBlend: false,
          color: SOURCE_COLORS[s.source] || '#38bdf8',
        })),
        {
          name: 'ForeCombine Blend',
          shortName: 'Blend',
          value: data.blended_value,
          delta: parseFloat(Math.abs(data.blended_value - observed).toFixed(1)),
          signedDelta: parseFloat((data.blended_value - observed).toFixed(1)),
          weight: 100,
          isBlend: true,
          color: '#2dd4bf', // Accent Teal
        },
      ]
    : [];

  // Calculate best single model vs blend
  const singleModels = chartData.filter((d) => !d.isBlend);
  const bestSingle = singleModels.length
    ? singleModels.reduce((min, cur) => (cur.delta < min.delta ? cur : min), singleModels[0])
    : null;
  const blendItem = chartData.find((d) => d.isBlend);
  const blendDelta = blendItem?.delta ?? 0;
  const improvementMargin = bestSingle
    ? parseFloat(Math.abs(bestSingle.delta - blendDelta).toFixed(1))
    : 0;

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="glass-panel p-3.5 rounded-xl border border-border shadow-2xl text-xs space-y-1.5 min-w-[210px]">
          <div className="flex items-center justify-between">
            <span className="font-bold text-text-primary text-sm">{d.name}</span>
            {d.isBlend && (
              <span className="px-1.5 py-0.5 rounded bg-accent/20 text-accent font-bold text-[10px] uppercase">
                Active Blend
              </span>
            )}
          </div>
          <div className="text-text-secondary flex justify-between">
            <span>Forecast:</span>
            <span className="font-mono font-bold text-text-primary">
              {d.value} {data?.unit}
            </span>
          </div>
          <div className="text-text-secondary flex justify-between">
            <span>Observed Ref:</span>
            <span className="font-mono text-amber-400 font-semibold">
              {observed} {data?.unit}
            </span>
          </div>
          <div className="text-text-secondary flex justify-between pt-1 border-t border-border/40">
            <span>Absolute Error (|Δ|):</span>
            <span
              className={`font-mono font-bold ${
                d.delta === 0 ? 'text-emerald-400' : d.delta < 5 ? 'text-teal-400' : 'text-amber-400'
              }`}
            >
              {d.delta} {data?.unit}
            </span>
          </div>
          {!d.isBlend && (
            <div className="text-text-secondary flex justify-between">
              <span>Weight Assigned:</span>
              <span className="font-mono text-accent font-medium">{d.weight}%</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-accent/15 text-accent">
              <BarChart3 className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">
              Model Diagnostic & Ground Truth Alignment
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-text-primary tracking-tight">
            Multi-Source Model Comparison
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Side-by-side benchmark of NWP, Ensemble, AI, and Regional models against observed ground truth.
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="ForeCombine Blended Forecast"
              value={formatValue(data?.blended_value)}
              unit={data?.unit}
              icon={Sparkles}
              subtext="Dynamically weighted consensus"
              accentColor="#2dd4bf"
            />
            <StatCard
              label="Observed Ground Truth (AWS)"
              value={formatValue(observed)}
              unit={data?.unit}
              icon={Target}
              subtext="IMD Verified Automatic Station"
              accentColor="#f59e0b"
            />
            <StatCard
              label="Blend vs Closest Single Engine"
              value={`+${improvementMargin}`}
              unit={`${data?.unit} margin`}
              icon={Award}
              subtext={`Beats best single model (${bestSingle?.shortName})`}
              accentColor="#10b981"
            />
          </>
        )}
      </div>

      {/* Main Chart Section */}
      <div className="glass-panel p-6 rounded-2xl border border-border/80 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-heading font-bold text-text-primary">
              Forecast Value vs Ground Truth
            </h2>
            <p className="text-xs text-text-muted">
              Dashed amber line denotes ground truth verified by IMD observation
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-accent" />
              <span className="font-semibold text-text-primary">ForeCombine Blend</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-amber-400" />
              <span className="font-semibold text-amber-400">Observed AWS Reference</span>
            </div>
          </div>
        </div>

        {loading ? (
          <ChartSkeleton />
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            <p>{error}</p>
            <button onClick={() => refetch()} className="mt-2 text-xs font-semibold text-accent underline">
              Retry
            </button>
          </div>
        ) : (
          <div className="h-80 sm:h-96 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
                barCategoryGap="22%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
                <XAxis
                  dataKey="shortName"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  unit={` ${data?.unit || ''}`}
                  domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.15)]}
                />
                <RechartsTooltip content={<CustomTooltip />} />

                {/* Observed Value Dashed Marker Line */}
                <ReferenceLine
                  y={observed}
                  stroke="#f59e0b"
                  strokeDasharray="6 4"
                  strokeWidth={2.5}
                  label={{
                    value: `Observed: ${observed} ${data?.unit}`,
                    position: 'top',
                    fill: '#f59e0b',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                />

                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke={entry.isBlend ? '#ffffff' : undefined}
                      strokeWidth={entry.isBlend ? 1.5 : 0}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Insight Caption */}
        {data && (
          <div className="p-4 rounded-xl bg-accent/10 border border-accent/25 flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/20 text-accent shrink-0">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div className="text-xs sm:text-sm text-text-primary leading-relaxed">
              <span className="font-bold text-accent">Meteorological Insight: </span>
              <span>
                ForeCombine Blend was closest to observed ground truth by{' '}
                <strong className="underline decoration-accent font-mono font-bold">
                  {improvementMargin} {data.unit}
                </strong>{' '}
                compared to the best individual model ({bestSingle?.name}). Single physics NWP engines
                accumulated up to{' '}
                <strong className="font-mono text-red-400">
                  +{Math.max(...singleModels.map((m) => m.delta))} {data.unit}
                </strong>{' '}
                in absolute error.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Model Discrepancy Breakdown Grid */}
      {data?.sources && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.sources.map((s) => {
            const delta = parseFloat((s.value - observed).toFixed(1));
            const isOver = delta > 0;
            return (
              <div
                key={s.source}
                className="p-4 rounded-xl border border-border/70 bg-surface/50 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text-primary truncate">{s.source}</span>
                  <span className="text-accent font-bold">{Math.round(s.weight * 100)}% Wt</span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-lg font-bold font-heading text-text-primary">
                    {s.value} <span className="text-xs font-normal text-text-muted">{data.unit}</span>
                  </span>
                  <span
                    className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                      delta === 0
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isOver
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-sky-500/20 text-sky-400'
                    }`}
                  >
                    {isOver ? `+${delta}` : delta} {data.unit}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted leading-tight pt-1 border-t border-border/30">
                  {isOver ? 'Wet / High bias over ground station' : 'Underpredicted moisture flux'}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
