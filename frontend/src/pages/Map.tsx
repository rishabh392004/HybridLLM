import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polygon, CircleMarker, Polyline, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MOCK_REGIONS, getMockBlend } from '../api/mock';
import { LeadTimeHours, WeatherParameter } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { ParameterToggle } from '../components/ParameterToggle';
import { LeadTimeSelect } from '../components/LeadTimeSelect';
import { Legend } from '../components/Legend';
import { SeverityBadge } from '../components/SeverityBadge';
import { getParameterColor, getSourceColor } from '../lib/colors';
import { formatValue } from '../lib/format';
import type { GlobeDataItem } from '../components/globe/Globe3D';

const Globe3D = React.lazy(() =>
  import('../components/globe/Globe3D').then((m) => ({ default: m.Globe3D }))
);
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import {
  X,
  ArrowRight,
  ShieldAlert,
  Compass,
  CheckCircle2,
  Globe,
  Map as MapIcon,
  Layers,
  Activity,
  Flame,
  Network,
  Tag,
  BarChart2,
  TrendingUp,
} from 'lucide-react';

// Controller to fly map smoothly to selected region in 2D mode
const MapRecenter: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
};

export const MapPage: React.FC = () => {
  const { theme } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const selectedRegionName = searchParams.get('region') || 'Konkan & Goa';
  const param = (searchParams.get('param') as WeatherParameter) || 'rainfall';
  const lead = (Number(searchParams.get('lead')) as LeadTimeHours) || 24;
  const viewMode = (searchParams.get('view') as '2d' | '3d') || '2d';

  const [drawerOpen, setDrawerOpen] = useState(true);

  // Layer toggles
  const [layers, setLayers] = useState({
    zones: true,
    heat: true,
    links: true,
    labels: true,
  });

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const currentRegionMeta =
    MOCK_REGIONS.find((r) => r.name.toLowerCase() === selectedRegionName.toLowerCase()) ||
    MOCK_REGIONS[0];

  // Compute blend values and colors for all regions
  const regionsData = useMemo(() => {
    return MOCK_REGIONS.map((r) => {
      const blend = getMockBlend(r.name, lead, param);
      const color = getParameterColor(param, blend.blended_value);
      const isSelected = r.name.toLowerCase() === selectedRegionName.toLowerCase();
      const isExtreme = r.isExtreme && param === 'rainfall' && blend.blended_value >= 115.0;

      return {
        meta: r,
        blend,
        color,
        isSelected,
        isExtreme,
      };
    });
  }, [lead, param, selectedRegionName]);

  const selectedData =
    regionsData.find((d) => d.meta.name === currentRegionMeta.name) || regionsData[0];
  const topSource = [...selectedData.blend.sources].sort((a, b) => b.weight - a.weight)[0];
  const topSourceColor = getSourceColor(topSource.source);

  // Format dataset for 3D Globe component
  const globeDataItems: GlobeDataItem[] = useMemo(() => {
    return regionsData.map((d) => {
      const severity: 'severe' | 'warning' | 'normal' = d.isExtreme
        ? 'severe'
        : d.blend.blended_value >= 75.0
        ? 'warning'
        : 'normal';

      return {
        id: d.meta.id,
        name: d.meta.name,
        lat: d.meta.lat,
        lng: d.meta.lon,
        value: d.blend.blended_value,
        unit: d.blend.unit,
        severity,
        parameter: param,
        impactSector: d.meta.state || 'Regional Weather Sector',
        forecastModel: 'ForeCombine Blended AI',
      };
    });
  }, [regionsData, param]);

  // Radar chart data comparing each source vs blend
  const radarData = useMemo(() => {
    return selectedData.blend.sources.map((s) => ({
      source: s.source.split(' ')[0],
      sourceValue: s.value,
      blendValue: selectedData.blend.blended_value,
      fullMark: Math.max(s.value, selectedData.blend.blended_value) * 1.25 || 100,
    }));
  }, [selectedData]);

  // Ranked list of regions for the drawer ranking bar chart
  const rankedRegions = useMemo(() => {
    return [...regionsData].sort((a, b) => b.blend.blended_value - a.blend.blended_value);
  }, [regionsData]);

  const maxRankedVal = rankedRegions[0]?.blend.blended_value || 1;

  // Adaptive weight shift comparison (simulating previous run vs current calibrated run)
  const weightShifts = useMemo(() => {
    return selectedData.blend.sources.map((s, idx) => {
      const prevWeight = Math.max(0.1, parseFloat((s.weight + (idx % 2 === 0 ? -0.06 : 0.05)).toFixed(2)));
      const currWeight = parseFloat(s.weight.toFixed(2));
      const shift = parseFloat((currWeight - prevWeight).toFixed(2));
      return {
        source: s.source,
        prevWeight: Math.round(prevWeight * 100),
        currWeight: Math.round(currWeight * 100),
        shift: Math.round(shift * 100),
        color: getSourceColor(s.source),
      };
    });
  }, [selectedData]);

  // Free tile providers — no API key required
  const tileUrl =
    theme === 'dark'
      ? 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  // Custom 2D marker icon
  const createRegionMarkerIcon = (
    name: string,
    value: number,
    unit: string,
    isExtreme: boolean,
    isSelected: boolean
  ) => {
    return L.divIcon({
      className: 'custom-weather-marker',
      html: `
        <div class="relative flex items-center justify-center pointer-events-auto">
          ${
            isExtreme
              ? '<span class="absolute -inset-2.5 rounded-full bg-rose-500/50 animate-ping"></span>'
              : ''
          }
          <div style="font-family: 'JetBrains Mono', monospace;" class="px-2.5 py-1 rounded-xl text-[11px] font-bold shadow-lg border backdrop-blur-md transition-transform flex items-center gap-1.5 ${
            isExtreme
              ? 'bg-rose-600 text-white border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse'
              : isSelected
              ? 'bg-teal-500 text-slate-950 border-teal-300 ring-2 ring-teal-400/50 shadow-md scale-105'
              : 'bg-slate-900/90 text-slate-100 border-teal-500/30 hover:border-teal-400 shadow-sm'
          }">
            <span class="text-[9px] font-sans font-semibold opacity-70">${name.slice(0, 5)}</span>
            <span>${value}</span>
            <span class="text-[9px] font-normal opacity-80">${unit}</span>
          </div>
        </div>
      `,
      iconSize: [84, 32],
      iconAnchor: [42, 16],
    });
  };

  const selectedGlobeId = currentRegionMeta.id;

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-void">
      {/* ── Top Floating Controls & Layer Toggles ─────────────────── */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          {/* 2D / 3D Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl glass-panel shadow-md">
            <button
              onClick={() => updateParam('view', '2d')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === '2d'
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              aria-label="2D Map View"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>2D Map</span>
            </button>
            <button
              onClick={() => updateParam('view', '3d')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === '3d'
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              aria-label="3D Globe View"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>3D Globe</span>
            </button>
          </div>

          <ParameterToggle
            parameter={param}
            onChange={(newParam) => updateParam('param', newParam)}
          />

          <LeadTimeSelect
            leadTime={lead}
            onChange={(newLead) => updateParam('lead', String(newLead))}
          />

          {/* Layer toggles chips (2D only) */}
          {viewMode === '2d' && (
            <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl glass-panel shadow-md">
              <button
                onClick={() => toggleLayer('zones')}
                className={`chip ${layers.zones ? 'chip-active' : ''}`}
                aria-pressed={layers.zones}
                title="Toggle Regional Boundary Polygons"
              >
                <Layers className="w-3 h-3" />
                <span>Zones</span>
              </button>
              <button
                onClick={() => toggleLayer('heat')}
                className={`chip ${layers.heat ? 'chip-active' : ''}`}
                aria-pressed={layers.heat}
                title="Toggle Atmospheric Value Heat Haloes"
              >
                <Flame className="w-3 h-3" />
                <span>Heat</span>
              </button>
              <button
                onClick={() => toggleLayer('links')}
                className={`chip ${layers.links ? 'chip-active' : ''}`}
                aria-pressed={layers.links}
                title="Toggle Regional Correlation Links"
              >
                <Network className="w-3 h-3" />
                <span>Links</span>
              </button>
              <button
                onClick={() => toggleLayer('labels')}
                className={`chip ${layers.labels ? 'chip-active' : ''}`}
                aria-pressed={layers.labels}
                title="Toggle Value Pill Markers"
              >
                <Tag className="w-3 h-3" />
                <span>Labels</span>
              </button>
            </div>
          )}
        </div>

        {/* Legend on desktop */}
        <div className="pointer-events-auto hidden md:block">
          <Legend parameter={param} />
        </div>
      </div>

      {/* ── MAP CONTAINER ────────────────────────────────────────── */}
      <div className="w-full h-full">
        {viewMode === '3d' ? (
          /* 3D WebGL Globe View */
          <div className="w-full h-full relative bg-void">
            <React.Suspense
              fallback={
                <div className="w-full h-full flex flex-col items-center justify-center font-mono text-xs text-teal-400 gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
                  <span>Loading Three.js 3D Atmospheric Globe...</span>
                </div>
              }
            >
              <Globe3D
                data={globeDataItems}
                selectedId={selectedGlobeId}
                onSelect={(item) => {
                  if (item) {
                    updateParam('region', item.name);
                    setDrawerOpen(true);
                  }
                }}
                showInternalDrawer={false}
                height="100%"
                className="w-full h-full"
              />
            </React.Suspense>
          </div>
        ) : (
          /* 2D Leaflet Map with Theme-Responsive Tiles */
          <MapContainer
            center={[currentRegionMeta.lat, currentRegionMeta.lon]}
            zoom={6}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%', background: 'var(--bg-void)' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url={tileUrl}
              maxZoom={19}
            />

            <MapRecenter center={[currentRegionMeta.lat, currentRegionMeta.lon]} zoom={6} />

            {/* Layer 1: Links (Animated similarity polylines from selected region) */}
            {layers.links &&
              regionsData
                .filter((d) => !d.isSelected)
                .map(({ meta, blend, color }) => {
                  const diff = Math.abs(blend.blended_value - selectedData.blend.blended_value);
                  const similarity = Math.max(0.2, 1 - diff / 100);
                  return (
                    <Polyline
                      key={`link-${meta.id}`}
                      positions={[
                        [currentRegionMeta.lat, currentRegionMeta.lon],
                        [meta.lat, meta.lon],
                      ]}
                      pathOptions={{
                        color: '#2dd4bf',
                        weight: similarity * 3,
                        opacity: similarity * 0.45,
                        dashArray: '6, 8',
                      }}
                    />
                  );
                })}

            {/* Layer 2: Heat (Stacked translucent circles sized by value) */}
            {layers.heat &&
              regionsData.map(({ meta, blend, color, isExtreme }) => {
                const radius = Math.min(Math.max(blend.blended_value * 0.35, 14), 48);
                return (
                  <CircleMarker
                    key={`heat-${meta.id}`}
                    center={[meta.lat, meta.lon]}
                    radius={radius}
                    pathOptions={{
                      fillColor: color,
                      fillOpacity: isExtreme ? 0.45 : 0.25,
                      stroke: false,
                    }}
                  />
                );
              })}

            {/* Layer 3: Zones (Regional polygon boundaries) */}
            {layers.zones &&
              regionsData.map(({ meta, blend, color, isSelected, isExtreme }) => (
                <React.Fragment key={`zone-${meta.id}`}>
                  {meta.polygon && (
                    <Polygon
                      positions={meta.polygon}
                      pathOptions={{
                        color: isExtreme ? '#f43f5e' : isSelected ? '#2dd4bf' : color,
                        fillColor: color,
                        fillOpacity: isSelected ? 0.4 : 0.18,
                        weight: isSelected ? 2.5 : 1.2,
                        dashArray: isSelected ? undefined : '4, 4',
                      }}
                      eventHandlers={{
                        click: () => {
                          updateParam('region', meta.name);
                          setDrawerOpen(true);
                        },
                      }}
                    >
                      <Tooltip sticky direction="top" opacity={0.95}>
                        <div className="p-2 text-xs bg-slate-950 text-slate-100 rounded-xl border border-teal-500/40 shadow-xl">
                          <div className="font-bold text-teal-300 font-heading">{meta.name}</div>
                          <div className="text-slate-300 font-mono mt-0.5">
                            Blended {param}:{' '}
                            <span className="font-bold text-white">
                              {blend.blended_value} {blend.unit}
                            </span>
                          </div>
                          {isExtreme && (
                            <div className="text-rose-400 font-bold mt-1 text-[11px] flex items-center gap-1">
                              ⚠️ Severe Weather Protocol Active
                            </div>
                          )}
                        </div>
                      </Tooltip>
                    </Polygon>
                  )}
                </React.Fragment>
              ))}

            {/* Layer 4: Labels (Pill markers with value & severe pulse) */}
            {layers.labels &&
              regionsData.map(({ meta, blend, isSelected, isExtreme }) => (
                <Marker
                  key={`marker-${meta.id}`}
                  position={[meta.lat, meta.lon]}
                  icon={createRegionMarkerIcon(
                    meta.name,
                    blend.blended_value,
                    blend.unit,
                    !!isExtreme,
                    isSelected
                  )}
                  eventHandlers={{
                    click: () => {
                      updateParam('region', meta.name);
                      setDrawerOpen(true);
                    },
                  }}
                />
              ))}
          </MapContainer>
        )}
      </div>

      {/* Legend on mobile */}
      <div className="absolute bottom-4 left-4 z-[1000] md:hidden pointer-events-auto">
        <Legend parameter={param} />
      </div>

      {/* ── RIGHT INSIGHT DRAWER (Mobile Bottom Sheet / Desktop Sidebar) ── */}
      <div
        className={`absolute z-[1001] glass-panel shadow-2xl transition-transform duration-300 flex flex-col overflow-hidden ${
          /* Desktop: right sidebar | Mobile: bottom sheet */
          'bottom-0 left-0 right-0 max-h-[80vh] rounded-t-2xl sm:rounded-none sm:top-0 sm:right-0 sm:left-auto sm:h-full sm:w-[420px] sm:max-h-full border-t sm:border-t-0 sm:border-l border-border'
        } ${drawerOpen ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:translate-y-0 sm:translate-x-full'}`}
        aria-label="Region forecast details drawer"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-start justify-between bg-surface/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="panel-title">{currentRegionMeta.state}</span>
              {selectedData.isExtreme && <SeverityBadge severity="severe" size="sm" />}
            </div>
            <h2 className="text-xl font-heading font-bold text-text-primary tracking-tight">
              {currentRegionMeta.name}
            </h2>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto">
          {/* Hero Blended Metric Card */}
          <div
            className="p-4 sm:p-5 rounded-2xl border relative overflow-hidden shadow-sm"
            style={{
              borderColor: 'rgba(45,212,191,0.3)',
              background: `linear-gradient(135deg, ${selectedData.color}15, var(--bg-surface))`,
            }}
          >
            <div className="flex items-center justify-between text-xs text-text-muted mb-2 font-mono">
              <span className="font-semibold uppercase tracking-wider">
                ForeCombine Blend ({param})
              </span>
              <span className="text-teal-400 font-bold">+{lead}h Horizon</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold font-heading text-text-primary tracking-tight font-mono">
                {formatValue(selectedData.blend.blended_value)}
              </span>
              <span className="text-base font-semibold text-text-secondary">
                {selectedData.blend.unit}
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
              <span className="text-text-secondary font-medium">Observed AWS Ground Truth:</span>
              <span className="font-bold font-mono text-amber-400">
                {selectedData.blend.observed_value} {selectedData.blend.unit}
              </span>
            </div>
          </div>

          {/* Extreme Alert Notice if applicable */}
          {selectedData.isExtreme && (
            <div className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-500/10 flex items-start gap-3 animate-pulse">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-300">Active Extreme Weather Directive</h4>
                <p className="text-xs text-rose-200/90 mt-0.5 leading-relaxed">
                  Blended rainfall exceeds critical 115 mm/day threshold. Immediate civil defense, reservoir
                  discharge, and agro drainage protocols engaged.
                </p>
              </div>
            </div>
          )}

          {/* Top Contributing Model */}
          <div className="p-3.5 rounded-xl border border-border bg-surface/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="panel-title">Leading Source Model</span>
              <span className="text-xs font-bold font-mono" style={{ color: topSourceColor }}>
                {Math.round(topSource.weight * 100)}% Weight
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: topSourceColor }} />
              <span className="text-sm font-bold text-text-primary">{topSource.source}</span>
              <span className="text-xs text-text-muted font-mono">
                ({topSource.value} {selectedData.blend.unit})
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed border-t border-border pt-2">
              {topSource.reason}
            </p>
          </div>

          {/* Radar Chart: Sources vs Blend */}
          <div className="p-3.5 rounded-xl border border-border bg-surface/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="panel-title">Multi-Model Convergence Radar</span>
              <span className="text-[10px] font-mono text-teal-400 font-semibold">
                Blend vs Sources
              </span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="75%">
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis
                    dataKey="source"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'monospace' }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke="transparent" />
                  <Radar
                    name="Source Forecast"
                    dataKey="sourceValue"
                    stroke="#818cf8"
                    fill="#818cf8"
                    fillOpacity={0.25}
                  />
                  <Radar
                    name="Blended Value"
                    dataKey="blendValue"
                    stroke="#2dd4bf"
                    fill="#2dd4bf"
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Adaptive Weight-Shift Bars (Previous vs Current Calibrated Run) */}
          <div className="p-3.5 rounded-xl border border-border bg-surface/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="panel-title">Adaptive Weight Shifts (Δ 24h)</span>
              <span className="text-[10px] font-mono text-text-muted">Rolling Inv-Variance</span>
            </div>
            <div className="space-y-2">
              {weightShifts.map((ws) => (
                <div key={ws.source} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-text-primary font-medium">{ws.source.split(' ')[0]}</span>
                    <span className="text-text-secondary">
                      {ws.prevWeight}% → <strong className="text-text-primary">{ws.currWeight}%</strong>{' '}
                      <span className={ws.shift >= 0 ? 'text-teal-400' : 'text-rose-400'}>
                        ({ws.shift >= 0 ? `+${ws.shift}%` : `${ws.shift}%`})
                      </span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden flex">
                    <div
                      className="h-full transition-all duration-300 rounded-full"
                      style={{ width: `${ws.currWeight}%`, background: ws.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* All-Regions Regional Ranking Bar Chart */}
          <div className="p-3.5 rounded-xl border border-border bg-surface/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="panel-title">All-Regions Intensity Ranking</span>
              <span className="text-[10px] font-mono text-teal-400">Click to Fly Map</span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {rankedRegions.map((item) => {
                const isItemSel = item.meta.name === currentRegionMeta.name;
                const pct = Math.round((item.blend.blended_value / maxRankedVal) * 100);
                return (
                  <button
                    key={item.meta.id}
                    onClick={() => updateParam('region', item.meta.name)}
                    className={`w-full text-left p-1.5 rounded-lg transition-all flex flex-col gap-1 ${
                      isItemSel
                        ? 'bg-teal-500/15 border border-teal-500/30'
                        : 'hover:bg-surface-hover border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span
                        className={`truncate max-w-[170px] ${
                          isItemSel ? 'font-bold text-teal-300' : 'text-text-secondary'
                        }`}
                      >
                        {item.meta.name}
                      </span>
                      <span className="font-bold text-text-primary">
                        {item.blend.blended_value} {item.blend.unit}
                      </span>
                    </div>
                    <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, background: item.color }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Confidence Hint */}
          <div className="p-3.5 rounded-xl border border-teal-500/20 bg-teal-500/10 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-teal-300">
                {selectedData.blend.confidence_score}% Blending Confidence
              </h4>
              <p className="text-[11px] text-teal-200/80 mt-0.5 leading-relaxed">
                Adaptive weighting stabilized across 30-day sliding window. Multi-model ensemble variance minimized.
              </p>
            </div>
          </div>

          {/* Quick links to Weights, Compare, and Alerts */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() =>
                navigate(
                  `/weights?region=${encodeURIComponent(currentRegionMeta.name)}&param=${param}&lead=${lead}`
                )
              }
              className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-surface hover:bg-surface-hover text-xs font-semibold text-text-primary shadow-sm transition-all duration-200 group hover:border-teal-500/40"
            >
              <span>Inspect Source Weight Allocations</span>
              <ArrowRight className="w-4 h-4 text-teal-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() =>
                navigate(
                  `/compare?region=${encodeURIComponent(currentRegionMeta.name)}&param=${param}&lead=${lead}`
                )
              }
              className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-surface hover:bg-surface-hover text-xs font-semibold text-text-primary shadow-sm transition-all duration-200 group hover:border-teal-500/40"
            >
              <span>Compare Model vs Blended Multi-Line Chart</span>
              <ArrowRight className="w-4 h-4 text-teal-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => navigate(`/alerts?region=${encodeURIComponent(currentRegionMeta.name)}`)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-surface hover:bg-surface-hover text-xs font-semibold text-text-primary shadow-sm transition-all duration-200 group hover:border-teal-500/40"
            >
              <span>View Action Protocols & Emergency Directives</span>
              <ArrowRight className="w-4 h-4 text-teal-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Button to re-open drawer if closed */}
      {!drawerOpen && (
        <button
          onClick={() => setDrawerOpen(true)}
          className="absolute bottom-6 right-6 z-[1000] p-3 rounded-2xl glass-panel border border-teal-500/30 text-text-primary shadow-2xl flex items-center gap-2 text-xs font-semibold hover:border-teal-400 transition-all"
          aria-label="Open forecast details drawer"
        >
          <Compass className="w-4 h-4 text-teal-400" />
          <span>Region Forecast Details</span>
        </button>
      )}
    </div>
  );
};
