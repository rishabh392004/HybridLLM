import { AlertSeverity, WeatherParameter } from '../api/types';

/**
 * Semantic source identity colors.
 * These are permanent — never use these colors for decoration.
 * One color per source, consistent across all views.
 */
export const SOURCE_COLORS: Record<string, string> = {
  // NWP physics models — blue
  'NWP (NCMRWF/GFS)':   '#3b82f6',
  'ECMWF IFS':          '#3b82f6',
  'GFS':                '#3b82f6',
  // AI / neural surrogate — violet
  'AI Model (FourCastNet)': '#a78bfa',
  'FourCastNet AI':     '#a78bfa',
  'GraphCast AI':       '#a78bfa',
  'GraphCast':          '#a78bfa',
  // Ensemble — amber
  'Ensemble (GEFS)':    '#f59e0b',
  'GEFS':               '#f59e0b',
  // Regional NWP — emerald
  'Regional Model (WRF)': '#34d399',
  'WRF Regional':       '#34d399',
  'WRF':                '#34d399',
  // Blend output — teal (IMD standard)
  'ForeCombine Blend':  '#2dd4bf',
  'Blended':            '#2dd4bf',
  // Observed ground truth — gold
  'Observed':           '#fbbf24',
  'IMD AWS':            '#fbbf24',
};

/** Get color for a source by name with smart partial matching */
export function getSourceColor(sourceName: string): string {
  if (SOURCE_COLORS[sourceName]) return SOURCE_COLORS[sourceName];
  // partial match
  const lower = sourceName.toLowerCase();
  if (lower.includes('ncmrwf') || lower.includes('gfs') || lower.includes('ecmwf') || lower.includes('nwp')) return '#3b82f6';
  if (lower.includes('fourcast') || lower.includes('graphcast') || lower.includes('ai model') || lower.includes('neural')) return '#a78bfa';
  if (lower.includes('gefs') || lower.includes('ensemble')) return '#f59e0b';
  if (lower.includes('wrf') || lower.includes('regional')) return '#34d399';
  if (lower.includes('blend') || lower.includes('forecombine')) return '#2dd4bf';
  if (lower.includes('observed') || lower.includes('aws')) return '#fbbf24';
  // index fallback
  return '#3b82f6';
}

export const PARAM_METRICS: Record<WeatherParameter, { label: string; unit: string; icon: string }> = {
  rainfall:    { label: 'Precipitation', unit: 'mm/day', icon: 'CloudRain' },
  temperature: { label: 'Temperature',   unit: '°C',     icon: 'Thermometer' },
  wind:        { label: 'Wind Speed',    unit: 'km/h',   icon: 'Wind' },
};

/**
 * Maps a meteorological value to a severity color.
 * Based on IMD/WMO thresholds.
 */
export function getParameterColor(param: WeatherParameter, value: number): string {
  switch (param) {
    case 'rainfall':
      if (value >= 115.5) return '#ef4444'; // Extremely heavy
      if (value >= 64.5)  return '#f97316'; // Heavy
      if (value >= 35.5)  return '#eab308'; // Moderate heavy
      if (value >= 15.5)  return '#22c55e'; // Light-moderate
      return '#2dd4bf';                     // Trace/calm
    case 'temperature':
      if (value >= 42.0) return '#ef4444';  // Severe heat
      if (value >= 38.0) return '#f97316';  // Heatwave
      if (value >= 32.0) return '#eab308';  // Warm
      if (value <= 8.0)  return '#3b82f6';  // Cold wave
      return '#2dd4bf';
    case 'wind':
      if (value >= 65.0) return '#ef4444';  // Gale/storm
      if (value >= 45.0) return '#f97316';  // Strong squall
      if (value >= 30.0) return '#eab308';  // Moderate
      return '#2dd4bf';
    default:
      return '#2dd4bf';
  }
}

export function getSeverityColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'severe':   return '#ef4444';
    case 'warning':  return '#f97316';
    case 'advisory': return '#eab308';
    default:         return '#22c55e';
  }
}

export function getSeverityBadgeStyles(severity: AlertSeverity): {
  bg: string; text: string; border: string; badge: string; cardBorder: string;
} {
  switch (severity) {
    case 'severe':
      return {
        bg: 'bg-[rgba(239,68,68,0.10)]',
        text: 'text-red-400',
        border: 'border-[rgba(239,68,68,0.25)]',
        badge: 'bg-red-500 text-white',
        cardBorder: 'border-l-[3px] border-l-red-500',
      };
    case 'warning':
      return {
        bg: 'bg-[rgba(249,115,22,0.10)]',
        text: 'text-orange-400',
        border: 'border-[rgba(249,115,22,0.25)]',
        badge: 'bg-orange-500 text-white',
        cardBorder: 'border-l-[3px] border-l-orange-500',
      };
    case 'advisory':
      return {
        bg: 'bg-[rgba(234,179,8,0.10)]',
        text: 'text-yellow-400',
        border: 'border-[rgba(234,179,8,0.25)]',
        badge: 'bg-yellow-500 text-slate-900',
        cardBorder: 'border-l-[3px] border-l-yellow-500',
      };
    default:
      return {
        bg: 'bg-[rgba(45,212,191,0.08)]',
        text: 'text-[var(--blend)]',
        border: 'border-[rgba(45,212,191,0.20)]',
        badge: 'bg-[var(--blend)] text-slate-900',
        cardBorder: 'border-l-[3px] border-l-[var(--blend)]',
      };
  }
}
