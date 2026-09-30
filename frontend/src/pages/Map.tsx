import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polygon, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MOCK_REGIONS, getMockBlend } from '../api/mock';
import { LeadTimeHours, WeatherParameter } from '../api/types';
import { ParameterToggle } from '../components/ParameterToggle';
import { LeadTimeSelect } from '../components/LeadTimeSelect';
import { Legend } from '../components/Legend';
import { SeverityBadge } from '../components/SeverityBadge';
import { getParameterColor } from '../lib/colors';
import { formatValue, formatUnit } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import {
  X,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Zap,
  Layers,
  Compass,
  CheckCircle2,
} from 'lucide-react';

// Controller to fly map to selected region
const MapRecenter: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
};

export const MapPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme } = useAuth();

  const selectedRegionName = searchParams.get('region') || 'Konkan & Goa';
  const param = (searchParams.get('param') as WeatherParameter) || 'rainfall';
  const lead = (Number(searchParams.get('lead')) as LeadTimeHours) || 24;

  const [drawerOpen, setDrawerOpen] = useState(true);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const currentRegionMeta =
    MOCK_REGIONS.find((r) => r.name.toLowerCase() === selectedRegionName.toLowerCase()) ||
    MOCK_REGIONS[0];

  const currentBlend = getMockBlend(currentRegionMeta.name, lead, param);

  // Compute blend values and colors for all 6 regions
  const regionsData = MOCK_REGIONS.map((r) => {
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

  const selectedData = regionsData.find((d) => d.meta.name === currentRegionMeta.name) || regionsData[0];
  const topSource = [...selectedData.blend.sources].sort((a, b) => b.weight - a.weight)[0];

  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  // Custom marker icon creation with blended values & pulsing indicators
  const createRegionMarkerIcon = (value: number, unit: string, isExtreme: boolean, isSelected: boolean) => {
    return L.divIcon({
      className: 'custom-weather-marker',
      html: `
        <div class="relative flex items-center justify-center">
          ${
            isExtreme
              ? '<span class="absolute -inset-2 rounded-full bg-red-500/40 animate-ping"></span>'
              : ''
          }
          <div class="px-2 py-1 rounded-lg text-[11px] font-bold shadow-xl border ${
            isExtreme
              ? 'bg-red-600 text-white border-red-300 animate-pulse'
              : isSelected
              ? 'bg-accent text-slate-950 border-white ring-2 ring-accent'
              : 'bg-slate-900/90 text-white border-slate-700'
          }">
            ${value} <span class="text-[9px] font-normal opacity-80">${unit}</span>
          </div>
        </div>
      `,
      iconSize: [60, 28],
      iconAnchor: [30, 14],
    });
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Floating Top Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          <ParameterToggle
            parameter={param}
            onChange={(newParam) => updateParam('param', newParam)}
          />
          <LeadTimeSelect
            leadTime={lead}
            onChange={(newLead) => updateParam('lead', String(newLead))}
          />
        </div>

        {/* Legend on desktop */}
        <div className="pointer-events-auto hidden md:block">
          <Legend parameter={param} />
        </div>
      </div>

      {/* Main Full-Height Leaflet Map */}
      <div className="w-full h-full">
        <MapContainer
          center={[currentRegionMeta.lat, currentRegionMeta.lon]}
          zoom={6}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url={tileUrl}
            maxZoom={18}
          />

          <MapRecenter center={[currentRegionMeta.lat, currentRegionMeta.lon]} zoom={6} />

          {/* Regional Polygons & Markers */}
          {regionsData.map(({ meta, blend, color, isSelected, isExtreme }) => (
            <React.Fragment key={meta.id}>
              {meta.polygon && (
                <Polygon
                  positions={meta.polygon}
                  pathOptions={{
                    color: isExtreme ? '#ef4444' : isSelected ? '#2dd4bf' : color,
                    fillColor: color,
                    fillOpacity: isSelected ? 0.55 : 0.35,
                    weight: isSelected ? 3 : 1.5,
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
                    <div className="p-1 text-xs">
                      <div className="font-bold text-slate-900">{meta.name}</div>
                      <div className="text-slate-700">
                        Blended {param}: <span className="font-bold">{blend.blended_value} {blend.unit}</span>
                      </div>
                      {isExtreme && (
                        <div className="text-red-600 font-bold mt-0.5">⚠️ Extreme Weather Alert Active</div>
                      )}
                    </div>
                  </Tooltip>
                </Polygon>
              )}

              {/* Center point marker */}
              <Marker
                position={[meta.lat, meta.lon]}
                icon={createRegionMarkerIcon(blend.blended_value, blend.unit, !!isExtreme, isSelected)}
                eventHandlers={{
                  click: () => {
                    updateParam('region', meta.name);
                    setDrawerOpen(true);
                  },
                }}
              />
            </React.Fragment>
          ))}
        </MapContainer>
      </div>

      {/* Legend on mobile */}
      <div className="absolute bottom-4 left-4 z-[1000] md:hidden">
        <Legend parameter={param} />
      </div>

      {/* Side Detail Drawer */}
      <div
        className={`absolute top-0 right-0 h-full w-full sm:w-96 z-[1001] bg-surface/95 backdrop-blur-xl border-l border-border shadow-2xl transition-transform duration-300 flex flex-col ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Region forecast details drawer"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-border flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-wider text-text-muted font-mono">
                {currentRegionMeta.state}
              </span>
              {selectedData.isExtreme && (
                <SeverityBadge severity="severe" size="sm" />
              )}
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

        {/* Drawer Body */}
        <div className="p-5 space-y-6 flex-1 overflow-y-auto">
          {/* Main Blended Metric Card */}
          <div
            className="p-5 rounded-2xl border relative overflow-hidden shadow-sm"
            style={{
              borderColor: `${selectedData.color}50`,
              background: `linear-gradient(135deg, ${selectedData.color}15, rgba(15, 23, 42, 0.6))`,
            }}
          >
            <div className="flex items-center justify-between text-xs text-text-muted mb-2">
              <span className="font-semibold uppercase tracking-wider">
                ForeCombine Blend ({param})
              </span>
              <span className="font-mono text-accent">+{lead}h Horizon</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold font-heading text-text-primary tracking-tight">
                {formatValue(selectedData.blend.blended_value)}
              </span>
              <span className="text-base font-semibold text-text-secondary">
                {selectedData.blend.unit}
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
              <span className="text-text-muted">Observed Verification:</span>
              <span className="font-bold text-amber-400 font-mono">
                {selectedData.blend.observed_value} {selectedData.blend.unit}
              </span>
            </div>
          </div>

          {/* Top Contributing Model */}
          <div className="p-4 rounded-xl bg-surface-card border border-border/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Leading Source Model
              </span>
              <span className="text-xs font-bold text-accent">
                {Math.round(topSource.weight * 100)}% Weight
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-text-primary">{topSource.source}</span>
              <span className="text-xs text-text-muted">({topSource.value} {selectedData.blend.unit})</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed border-t border-border/40 pt-2">
              {topSource.reason}
            </p>
          </div>

          {/* Confidence Hint */}
          <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/25 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-teal-300">
                {selectedData.blend.confidence_score}% Blending Confidence
              </h4>
              <p className="text-xs text-teal-200/80 mt-0.5 leading-relaxed">
                Adaptive weighting stabilized across 30-day sliding window. Ensemble variance minimized.
              </p>
            </div>
          </div>

          {/* Extreme Alert Notice if applicable */}
          {selectedData.isExtreme && (
            <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 flex items-start gap-3 animate-pulse">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-red-300">Active Severe Weather Alert</h4>
                <p className="text-xs text-red-200/90 mt-0.5 leading-relaxed">
                  Blended rainfall exceeds critical 115 mm threshold. Immediate civil defense and agro
                  drainage actions required.
                </p>
              </div>
            </div>
          )}

          {/* Quick links to Weights and Compare */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => navigate(`/weights?region=${encodeURIComponent(currentRegionMeta.name)}&param=${param}&lead=${lead}`)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-hover hover:bg-accent hover:text-slate-950 text-text-primary text-xs font-semibold border border-border transition-all duration-200 group"
            >
              <span>Inspect Source Weight Allocations</span>
              <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-slate-950 transition-colors" />
            </button>

            <button
              onClick={() => navigate(`/compare?region=${encodeURIComponent(currentRegionMeta.name)}&param=${param}&lead=${lead}`)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-hover hover:bg-accent hover:text-slate-950 text-text-primary text-xs font-semibold border border-border transition-all duration-200 group"
            >
              <span>Compare Model vs Blended Chart</span>
              <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-slate-950 transition-colors" />
            </button>

            <button
              onClick={() => navigate(`/alerts?region=${encodeURIComponent(currentRegionMeta.name)}`)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-hover hover:bg-accent hover:text-slate-950 text-text-primary text-xs font-semibold border border-border transition-all duration-200 group"
            >
              <span>View Multi-Audience Action Bulletins</span>
              <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-slate-950 transition-colors" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Button to re-open drawer if closed */}
      {!drawerOpen && (
        <button
          onClick={() => setDrawerOpen(true)}
          className="absolute bottom-6 right-6 z-[1000] p-3 rounded-2xl bg-surface/90 hover:bg-surface border border-border text-text-primary shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-semibold"
          aria-label="Open forecast details drawer"
        >
          <Compass className="w-4 h-4 text-accent" />
          <span>Region Forecast Details</span>
        </button>
      )}
    </div>
  );
};
