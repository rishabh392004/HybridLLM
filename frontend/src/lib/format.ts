import { WeatherParameter } from '../api/types';

export function formatValue(value: number | undefined | null, digits: number = 1): string {
  if (value === undefined || value === null || isNaN(value)) return '--';
  return Number(value).toFixed(digits);
}

export function formatUnit(param: WeatherParameter): string {
  switch (param) {
    case 'rainfall':
      return 'mm/day';
    case 'temperature':
      return '°C';
    case 'wind':
      return 'km/h';
    default:
      return '';
  }
}

export function formatPercentage(val: number, decimals: number = 1): string {
  if (val === undefined || isNaN(val)) return '0.0%';
  return `${(val * 100).toFixed(decimals)}%`;
}

export function formatLeadTime(lead: number): string {
  return `+${lead}h (${lead / 24}d)`;
}

export function formatRoleTitle(role: string): string {
  switch (role) {
    case 'farmer':
      return 'Farmer / Agro Advisory';
    case 'disaster_management':
      return 'Disaster Management (NDRF/SDMA)';
    case 'analyst':
      return 'Meteorological Analyst';
    default:
      return role;
  }
}
