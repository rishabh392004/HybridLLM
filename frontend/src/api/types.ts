export type UserRole = 'farmer' | 'disaster_management' | 'analyst';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  agency?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type WeatherParameter = 'rainfall' | 'temperature' | 'wind';

export type LeadTimeHours = 24 | 48 | 72 | 120;

export interface SourceBlendDetail {
  source: string;
  value: number;
  weight: number;
  previous_weight: number;
  reason: string;
}

export interface BlendResponse {
  region: string;
  parameter: WeatherParameter;
  lead_time: LeadTimeHours;
  blended_value: number;
  unit: string;
  sources: SourceBlendDetail[];
  observed_value?: number;
  confidence_score?: number; // 0 - 100%
  timestamp?: string;
}

export interface SkillRow {
  source: string;
  rmse: number;
  mae: number;
  rank: number;
  trend?: number[]; // Sparkline history points
}

export interface SkillResponse {
  region: string;
  parameter: WeatherParameter;
  days: number;
  rows: SkillRow[];
  blend: {
    rmse: number;
    mae: number;
    rank: number;
    improvement_vs_best_single?: number; // e.g. 18.4%
    trend?: number[];
  };
}

export type AlertSeverity = 'advisory' | 'warning' | 'severe';

export interface WeatherAlert {
  id?: string;
  hazard: string;
  severity: AlertSeverity;
  region: string;
  value: number;
  threshold: number;
  unit: string;
  message: string;
  audience: UserRole | 'all';
  lead_time?: LeadTimeHours;
  parameter?: WeatherParameter;
  timestamp?: string;
  impact_sector?: string;
  action_protocol?: string;
}

export type WeightOverridePayload = Record<string, number>;

export interface RegionMetadata {
  id: string;
  name: string;
  state: string;
  lat: number;
  lon: number;
  polygon?: [number, number][];
  isExtreme?: boolean;
}
