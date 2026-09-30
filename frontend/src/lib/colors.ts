import { AlertSeverity, WeatherParameter } from '../api/types';

export const SOURCE_COLORS: Record<string, string> = {
  'NWP (NCMRWF/GFS)': '#38bdf8', // Sky Blue
  'Ensemble (GEFS)': '#818cf8',   // Indigo
  'AI Model (FourCastNet)': '#34d399', // Emerald
  'Regional Model (WRF)': '#f472b6',   // Coral/Pink
  'ForeCombine Blend': '#2dd4bf',      // Primary Blend Teal
  'Observed': '#f59e0b',               // Golden Amber
};

export const PARAM_METRICS: Record<WeatherParameter, { label: string; unit: string; icon: string }> = {
  rainfall: { label: 'Precipitation', unit: 'mm/day', icon: 'CloudRain' },
  temperature: { label: 'Temperature', unit: '°C', icon: 'Thermometer' },
  wind: { label: 'Wind Speed', unit: 'km/h', icon: 'Wind' },
};

/**
 * Maps a value to a color on the meteorological scale:
 * Teal (low/normal) -> Yellow (moderate) -> Orange (advisory/warning) -> Red (severe)
 */
export function getParameterColor(param: WeatherParameter, value: number): string {
  switch (param) {
    case 'rainfall': {
      // IMD classification: < 15.5 normal, 15.6-64.4 moderate, 64.5-115.5 heavy, > 115.5 extremely heavy
      if (value >= 115.5) return '#ef4444'; // Severe Red
      if (value >= 64.5) return '#f97316';  // Orange Warning
      if (value >= 35.5) return '#eab308';  // Yellow Advisory
      if (value >= 15.5) return '#10b981';  // Light Green/Teal
      return '#2dd4bf';                     // Teal calm
    }
    case 'temperature': {
      if (value >= 42.0) return '#ef4444'; // Extreme Heat Red
      if (value >= 38.0) return '#f97316'; // Heatwave Orange
      if (value >= 32.0) return '#eab308'; // Warm Yellow
      if (value <= 8.0) return '#38bdf8';  // Cold Wave Blue
      return '#2dd4bf';                    // Moderate
    }
    case 'wind': {
      if (value >= 65.0) return '#ef4444'; // Gale/Storm Red
      if (value >= 45.0) return '#f97316'; // Strong squall Orange
      if (value >= 30.0) return '#eab308'; // Moderate breeze Yellow
      return '#2dd4bf';                    // Mild
    }
    default:
      return '#2dd4bf';
  }
}

export function getSeverityBadgeStyles(severity: AlertSeverity): {
  bg: string;
  text: string;
  border: string;
  badge: string;
} {
  switch (severity) {
    case 'severe':
      return {
        bg: 'bg-red-500/10 dark:bg-red-500/15',
        text: 'text-red-600 dark:text-red-400',
        border: 'border-red-500/30',
        badge: 'bg-red-500 text-white',
      };
    case 'warning':
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-500/15',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-500/30',
        badge: 'bg-amber-500 text-slate-900',
      };
    case 'advisory':
      return {
        bg: 'bg-sky-500/10 dark:bg-sky-500/15',
        text: 'text-sky-600 dark:text-sky-400',
        border: 'border-sky-500/30',
        badge: 'bg-sky-500 text-white',
      };
    default:
      return {
        bg: 'bg-teal-500/10 dark:bg-teal-500/15',
        text: 'text-teal-600 dark:text-teal-400',
        border: 'border-teal-500/30',
        badge: 'bg-teal-500 text-slate-900',
      };
  }
}
