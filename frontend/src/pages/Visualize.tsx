import React, { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
  Cell,
  Legend,
} from 'recharts';
import {
  Globe2,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Target,
  Clock,
  Filter,
  Info,
} from 'lucide-react';

import { Globe3D, GlobeDataItem } from '../components/globe/Globe3D';
import { MOCK_REGIONS, getMockBlend, getMockSkill } from '../api/mock';
import { WeatherParameter, LeadTimeHours } from '../api/types';

// ── Colour helpers ──────────────────────────────────────────────────────────
const PARAM_COLOR: Record<WeatherParameter, string> = {
  rainfall:    '#38bdf8',
  temperature: '#fb923c',
  wind:        '#a78bfa',
};

const SOURCE_COLORS: Record<string, string> = {
  'NWP (NCMRWF/GFS)':      '#38bdf8',
  'Ensemble (GEFS)':        '#34d399',
  'AI Model (FourCastNet)': '#a78bfa',
  'Regional Model (WRF)':   '#fb923c',
  'ForeCombine Blend':      '#facc15',
};

const SEVERITY_COLOR: Record<string, string> = {
  severe:  '#f87171',
  warning: '#fbbf24',
  normal:  '#34d399',
};

const LEAD_TIMES: LeadTimeHours[] = [24, 48, 72, 120];

function shortSourceName(s: string) {
  return s
    .replace(' (NCMRWF/GFS)', '')
    .replace(' (FourCastNet)', '')
    .replace(' (GEFS)', '')
    .replace(' (WRF)', '');
}

// ── Globe data from MOCK_REGIONS ─────────────────────────────────────────────
function buildGlobeItems(param: WeatherParameter): GlobeDataItem[] {
  return MOCK_REGIONS.map((r) => {
    const blend = getMockBlend(r.name, 24, param);
    const severity: 'severe' | 'warning' | 'normal' = r.isExtreme
      ? 'severe'
      : blend.blended_value > (blend.observed_value ?? 0) * 0.85
      ? 'warning'
      : 'normal';
    return {
      id: r.id,
      name: r.name,
      lat: r.lat,
      lng: r.lon,
      value: blend.blended_value,
      unit: blend.unit,
      severity,
      parameter: param,
      impactSector: r.state,
      forecastModel: 'ForeCombine Blend',
    };
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | null;
}
const MetricCard: React.FC<MetricCardProps> = ({ label, value, sub, color = '#38bdf8', icon, trend }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col gap-1 backdrop-blur-sm">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">{label}</span>
      {icon && <span className="text-white/40">{icon}</span>}
    </div>
    <div className="flex items-end gap-2 mt-1">
      <span className="text-2xl font-bold font-heading" style={{ color }}>{value}</span>
      {trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-400 mb-0.5" />}
      {trend === 'down' && <TrendingDown className="w-4 h-4 text-rose-400 mb-0.5" />}
    </div>
    {sub && <span className="text-[10px] text-white/40 font-mono">{sub}</span>}
  </div>
);

interface TooltipProps { active?: boolean; payload?: any[]; label?: string; unit?: string; }
const ChartTooltip: React.FC<TooltipProps> = ({ active, payload, label, unit = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0f1729]/95 backdrop-blur px-3 py-2 shadow-xl text-xs">
      <div className="font-mono text-white/50 mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/70 font-mono">{p.name}:</span>
          <span className="font-bold text-white">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}{unit}</span>
        </div>
      ))}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export const VisualizePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const paramFromUrl = (searchParams.get('param') || 'rainfall') as WeatherParameter;

  const [activeParam, setActiveParam] = useState<WeatherParameter>(paramFromUrl);
  const [selectedItem, setSelectedItem] = useState<GlobeDataItem | null>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [lead, setLead] = useState<LeadTimeHours>(24);
  const [showInfo, setShowInfo] = useState(false);

  // No ResizeObserver needed — we use explicit vh-based height

  const globeData = useMemo(() => buildGlobeItems(activeParam), [activeParam]);

  const handleGlobeSelect = useCallback((item: GlobeDataItem | null) => {
    setSelectedItem(item);
    setSelectedId(item?.id);
  }, []);

  const selectedRegion = useMemo(
    () => selectedItem ? MOCK_REGIONS.find((r) => r.id === selectedItem.id) ?? null : null,
    [selectedItem]
  );

  const blendData = useMemo(
    () => selectedRegion ? getMockBlend(selectedRegion.name, lead, activeParam) : null,
    [selectedRegion, lead, activeParam]
  );

  const skillData = useMemo(
    () => selectedRegion ? getMockSkill(selectedRegion.name, activeParam, 30) : null,
    [selectedRegion, activeParam]
  );

  const leadChart = useMemo(() => {
    if (!selectedRegion) return [];
    return LEAD_TIMES.map((lt) => {
      const bd = getMockBlend(selectedRegion.name, lt, activeParam);
      return { lead: `${lt}h`, Blended: bd.blended_value, Observed: bd.observed_value ?? 0 };
    });
  }, [selectedRegion, activeParam]);

  const sourceChart = useMemo(() => {
    if (!blendData) return [];
    return blendData.sources.map((s) => ({
      name: shortSourceName(s.source),
      value: s.value,
      color: SOURCE_COLORS[s.source] || '#94a3b8',
    }));
  }, [blendData]);

  const radarChart = useMemo(() => {
    if (!skillData) return [];
    return [
      ...skillData.rows,
      { source: 'ForeCombine Blend', rmse: skillData.blend.rmse, mae: skillData.blend.mae, rank: 1 },
    ].map((s) => ({ source: shortSourceName(s.source), RMSE: s.rmse, MAE: s.mae }));
  }, [skillData]);

  const kpis = useMemo(() => {
    if (!blendData) return null;
    const topSource = blendData.sources.reduce((a, b) => (a.weight > b.weight ? a : b));
    return {
      blended: `${blendData.blended_value} ${blendData.unit}`,
      observed: `${blendData.observed_value} ${blendData.unit}`,
      confidence: `${blendData.confidence_score}%`,
      topSource: topSource.source,
      topWeight: `${(topSource.weight * 100).toFixed(0)}%`,
      improvement: (skillData?.blend.improvement_vs_best_single?.toFixed(1) ?? '—') + '%',
      topReason: topSource.reason,
    };
  }, [blendData, skillData]);

  const paramColor = PARAM_COLOR[activeParam];

  return (
    <div
      className="flex flex-col w-full overflow-hidden bg-[#060d1a] text-white"
      style={{ height: 'calc(100vh - 3.625rem)' }}
    >
      {/* ── Top bar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/8 bg-[#080f20]/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center">
            <Globe2 className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-tight">3D Forecast Visualizer</h1>
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Adaptive AI–NWP Blending · India Domain</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Parameter selector */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
            {(['rainfall', 'temperature', 'wind'] as WeatherParameter[]).map((p) => (
              <button
                key={p}
                onClick={() => setActiveParam(p)}
                className="px-3 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all"
                style={
                  activeParam === p
                    ? { background: PARAM_COLOR[p] + '30', color: PARAM_COLOR[p], border: `1px solid ${PARAM_COLOR[p]}40` }
                    : { color: 'rgba(255,255,255,0.4)' }
                }
              >
                {p}
              </button>
            ))}
          </div>

          {/* Lead time selector */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
            {LEAD_TIMES.map((lt) => (
              <button
                key={lt}
                onClick={() => setLead(lt)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all ${
                  lead === lt
                    ? 'bg-teal-500/25 text-teal-300 border border-teal-500/40'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {lt}h
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-all"
            title="How to use"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showInfo && (
        <div className="px-5 py-2 bg-teal-500/8 border-b border-teal-500/20 text-[11px] text-teal-300/90 font-mono flex items-center gap-2 shrink-0">
          <Info className="w-3.5 h-3.5 shrink-0 text-teal-400" />
          Click any glowing marker on the globe to pin a region and see linked forecast charts. Use the controls above to switch parameter and lead-time globally.
        </div>
      )}

      {/* ── Main split layout ─────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* LEFT: 3D Globe */}
        <div className="flex-1 min-w-0 relative overflow-hidden">
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/20">
              India Domain · WebGL
            </div>
          </div>

          <div
            className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-mono font-semibold pointer-events-none"
            style={{ background: paramColor + '15', borderColor: paramColor + '40', color: paramColor }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: paramColor }} />
            {activeParam.charAt(0).toUpperCase() + activeParam.slice(1)}
          </div>

          <Globe3D
            key="globe-viz"
            data={globeData}
            selectedId={selectedId}
            onSelect={handleGlobeSelect}
            height="100%"
            className="!rounded-none !border-0 !shadow-none"
            showInternalDrawer={false}
          />

          {!selectedItem && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 border border-white/10 backdrop-blur-sm">
                <Target className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-[11px] font-mono text-white/60">Click a marker to pin region</span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Charts Panel */}
        <div className="w-[420px] shrink-0 border-l border-white/8 flex flex-col overflow-hidden bg-[#080f20]">
          {selectedItem && blendData ? (
            <>
              {/* Region header */}
              <div className="px-4 py-3 border-b border-white/8 bg-white/3 shrink-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-[13px] font-bold text-white leading-tight">{selectedItem.name}</h2>
                    <p className="text-[10px] font-mono text-white/40 mt-0.5">
                      {selectedRegion?.state} · {activeParam} · {lead}h lead
                    </p>
                  </div>
                  <div
                    className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border shrink-0 mt-0.5"
                    style={{
                      background: SEVERITY_COLOR[selectedItem.severity] + '20',
                      borderColor: SEVERITY_COLOR[selectedItem.severity] + '50',
                      color: SEVERITY_COLOR[selectedItem.severity],
                    }}
                  >
                    {selectedItem.severity}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

                {/* KPI grid */}
                {kpis && (
                  <div className="grid grid-cols-2 gap-2">
                    <MetricCard label="Blended Forecast" value={kpis.blended} sub={`${lead}h lead time`} color={paramColor} icon={<Zap className="w-3.5 h-3.5" />} />
                    <MetricCard label="Observed" value={kpis.observed} sub="Ground truth" color="#94a3b8" icon={<Activity className="w-3.5 h-3.5" />} />
                    <MetricCard label="Confidence" value={kpis.confidence} sub="Blend reliability" color="#34d399" trend="up" icon={<Target className="w-3.5 h-3.5" />} />
                    <MetricCard label="Error Reduction" value={kpis.improvement} sub="vs best single source" color="#facc15" trend="up" icon={<TrendingUp className="w-3.5 h-3.5" />} />
                  </div>
                )}

                {/* Dominant source badge */}
                {kpis && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/8 border border-purple-500/20 text-[11px]">
                    <Zap className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="text-white/50 font-mono">Highest weight:</span>
                    <span className="font-semibold text-purple-300 truncate">{shortSourceName(kpis.topSource)}</span>
                    <span className="ml-auto font-mono font-bold text-purple-400 shrink-0">{kpis.topWeight}</span>
                  </div>
                )}

                {/* Source Bar Chart */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Source Values vs. Observed</span>
                    <span className="text-[9px] font-mono text-white/25">{blendData.unit}</span>
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={sourceChart} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }} />
                      <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }} />
                      <Tooltip content={<ChartTooltip unit={` ${blendData.unit}`} />} />
                      <ReferenceLine
                        y={blendData.observed_value}
                        stroke="rgba(255,255,255,0.3)"
                        strokeDasharray="4 3"
                        label={{ value: 'Obs', position: 'right', fontSize: 8, fill: 'rgba(255,255,255,0.4)' }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {sourceChart.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} fillOpacity={0.85} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Adaptive weight bars */}
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 block mb-2">Adaptive Weight Allocation</span>
                  <div className="space-y-2.5">
                    {blendData.sources.map((s) => {
                      const color = SOURCE_COLORS[s.source] || '#94a3b8';
                      const pct = +(s.weight * 100).toFixed(0);
                      const prevPct = +(s.previous_weight * 100).toFixed(0);
                      const delta = pct - prevPct;
                      return (
                        <div key={s.source}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[10px] font-mono text-white/60 truncate max-w-[58%]">{shortSourceName(s.source)}</span>
                            <div className="flex items-center gap-1.5">
                              {delta !== 0 && (
                                <span className={`text-[8px] font-mono font-bold ${delta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {delta > 0 ? '▲' : '▼'}{Math.abs(delta)}%
                                </span>
                              )}
                              <span className="text-[10px] font-bold font-mono" style={{ color }}>{pct}%</span>
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color, opacity: 0.8 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Lead-time forecast chart */}
                {leadChart.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Forecast vs. Lead Time</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-white/25" />
                        <span className="text-[9px] font-mono text-white/25">degradation</span>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={150}>
                      <AreaChart data={leadChart} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                        <defs>
                          <linearGradient id="blendGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={paramColor} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={paramColor} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="lead" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }} />
                        <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }} />
                        <Tooltip content={<ChartTooltip unit={` ${blendData.unit}`} />} />
                        <ReferenceLine y={blendData.observed_value} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 3" />
                        <Area type="monotone" dataKey="Blended" stroke={paramColor} strokeWidth={2} fill="url(#blendGrad)" dot={{ r: 3, fill: paramColor }} />
                        <Area type="monotone" dataKey="Observed" stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} fill="none" strokeDasharray="4 3" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Radar skill chart */}
                {radarChart.length > 0 && (
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 block mb-2">30-Day Skill Profile (RMSE / MAE)</span>
                    <ResponsiveContainer width="100%" height={200}>
                      <RadarChart data={radarChart} margin={{ top: 8, right: 20, bottom: 8, left: 20 }}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="source" tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }} />
                        <PolarRadiusAxis angle={30} tick={{ fontSize: 7, fill: 'rgba(255,255,255,0.25)' }} axisLine={false} />
                        <Radar name="RMSE" dataKey="RMSE" stroke="#facc15" fill="#facc15" fillOpacity={0.15} strokeWidth={1.5} />
                        <Radar name="MAE" dataKey="MAE" stroke={paramColor} fill={paramColor} fillOpacity={0.1} strokeWidth={1.5} />
                        <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)' }} />
                        <Tooltip content={<ChartTooltip />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Reasoning card */}
                {kpis?.topReason && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[10px] font-mono text-amber-200/70">
                    <div className="flex items-center gap-1.5 mb-1.5 text-amber-400 font-bold text-[9px] uppercase tracking-widest">
                      <AlertTriangle className="w-3 h-3" />
                      Top source weight reasoning
                    </div>
                    <p className="leading-relaxed">{kpis.topReason}</p>
                  </div>
                )}

                <div className="h-4" />
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
              <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                <Globe2 className="w-8 h-8 text-teal-400/60" />
              </div>
              <div className="text-center">
                <p className="text-[13px] font-semibold text-white/50">Select a region</p>
                <p className="text-[11px] text-white/30 font-mono mt-1 leading-relaxed">
                  Click any glowing marker on the 3D globe<br />to see detailed forecast analytics
                </p>
              </div>
              <div className="w-full mt-2 space-y-2">
                {MOCK_REGIONS.slice(0, 5).map((r) => {
                  const gi = globeData.find((g) => g.id === r.id);
                  return (
                    <button
                      key={r.id}
                      onClick={() => { if (gi) { setSelectedItem(gi); setSelectedId(gi.id); } }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/4 border border-white/8 hover:bg-white/8 hover:border-teal-500/30 transition-all group text-left"
                    >
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: r.isExtreme ? '#f87171' : '#fbbf24' }} />
                      <div className="flex-1 min-w-0">
                        <span className="text-[12px] text-white/70 font-medium group-hover:text-white transition-colors truncate block">{r.name}</span>
                        <span className="text-[9px] font-mono text-white/30">{r.state}</span>
                      </div>
                      <Filter className="w-3 h-3 text-white/20 group-hover:text-teal-400 transition-colors shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisualizePage;
