import {
  AuthResponse,
  BlendResponse,
  LeadTimeHours,
  SkillResponse,
  User,
  UserRole,
  WeatherAlert,
  WeatherParameter,
} from './types';
import { getMockAlerts, getMockBlend, getMockSkill } from './mock';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';
const SECONDARY_API_URL = 'http://localhost:8000/api/v1';
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

// Token helpers
export function getStoredToken(): string | null {
  return localStorage.getItem('forecombine_token');
}

export function setStoredToken(token: string): void {
  localStorage.setItem('forecombine_token', token);
}

export function clearStoredToken(): void {
  localStorage.removeItem('forecombine_token');
  localStorage.removeItem('forecombine_user');
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem('forecombine_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  localStorage.setItem('forecombine_user', JSON.stringify(user));
}

// Custom API Error with status
export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// HTTP request helper with token and multi-port fallback
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Try primary API_BASE_URL first
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const msg =
        errorData?.detail?.error?.message ||
        errorData?.detail ||
        errorData?.error?.message ||
        errorData?.message ||
        `HTTP ${response.status} Error`;
      throw new ApiError(response.status, msg, errorData);
    }

    return await response.json();
  } catch (primaryErr: any) {
    if (primaryErr instanceof ApiError) {
      throw primaryErr;
    }

    // Try secondary port fallback (8000 vs 8001)
    try {
      const response = await fetch(`${SECONDARY_API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const msg =
          errorData?.detail?.error?.message ||
          errorData?.detail ||
          errorData?.error?.message ||
          errorData?.message ||
          `HTTP ${response.status} Error`;
        throw new ApiError(response.status, msg, errorData);
      }

      return await response.json();
    } catch (secondaryErr: any) {
      if (secondaryErr instanceof ApiError) {
        throw secondaryErr;
      }
      throw new ApiError(503, 'Unable to connect to backend service. Falling back to offline dataset.', {
        cause: primaryErr,
      });
    }
  }
}

// Typed API Client with seamless offline mock fallback
export const api = {
  auth: {
    login: async (email: string, password: string): Promise<AuthResponse> => {
      if (!USE_MOCK) {
        try {
          const res = await request<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          });
          setStoredToken(res.token);
          setStoredUser(res.user);
          return res;
        } catch (err: any) {
          if (err?.status === 401 || err?.status === 400 || err?.status === 409) {
            throw err;
          }
          console.warn('[API Client] Backend offline during login. Using mock authentication fallback.');
        }
      }

      await new Promise((r) => setTimeout(r, 450));
      if (!email || !password || password.length < 6) {
        throw new ApiError(401, 'Invalid credentials (password must be at least 6 characters)');
      }
      let role: UserRole = 'analyst';
      if (email.includes('farm')) role = 'farmer';
      if (email.includes('disaster') || email.includes('ndrf') || email.includes('sdrf'))
        role = 'disaster_management';

      const mockUser: User = {
        id: 'usr-' + Math.random().toString(36).substring(2, 8),
        email,
        name: email.split('@')[0].toUpperCase(),
        role,
        agency:
          role === 'farmer'
            ? 'KVK Agro-Climatic Unit'
            : role === 'disaster_management'
            ? 'SDRF Central Command'
            : 'IMD NWP Division',
      };
      const token = 'fc_jwt_' + btoa(email + ':' + Date.now());
      setStoredToken(token);
      setStoredUser(mockUser);
      return { token, user: mockUser };
    },

    register: async (email: string, password: string, role: UserRole): Promise<AuthResponse> => {
      if (!USE_MOCK) {
        try {
          const res = await request<AuthResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, role }),
          });
          setStoredToken(res.token);
          setStoredUser(res.user);
          return res;
        } catch (err: any) {
          if (err?.status === 401 || err?.status === 400 || err?.status === 409) {
            throw err;
          }
          console.warn('[API Client] Backend offline during register. Using mock authentication fallback.');
        }
      }

      await new Promise((r) => setTimeout(r, 500));
      const mockUser: User = {
        id: 'usr-' + Math.random().toString(36).substring(2, 8),
        email,
        name: email.split('@')[0].toUpperCase(),
        role,
        agency:
          role === 'farmer'
            ? 'Krishi Vigyan Kendra'
            : role === 'disaster_management'
            ? 'SDMA Disaster Cell'
            : 'Ministry of Earth Sciences',
      };
      const token = 'fc_jwt_' + btoa(email + ':' + Date.now());
      setStoredToken(token);
      setStoredUser(mockUser);
      return { token, user: mockUser };
    },

    me: async (): Promise<User> => {
      if (!USE_MOCK) {
        try {
          return await request<User>('/auth/me');
        } catch (err) {
          // Fallback to stored user if offline
        }
      }
      const stored = getStoredUser();
      if (stored) return stored;
      return {
        id: 'usr-sih-demo',
        email: 'analyst@imd.gov.in',
        name: 'Dr. R. Sharma',
        role: 'analyst',
        agency: 'Ministry of Earth Sciences / IMD',
      };
    },

    logout: async (): Promise<void> => {
      if (!USE_MOCK) {
        await request('/auth/logout', { method: 'POST' }).catch(() => {});
      }
      clearStoredToken();
    },
  },

  blend: {
    get: async (
      region: string,
      lead: LeadTimeHours = 24,
      param: WeatherParameter = 'rainfall'
    ): Promise<BlendResponse> => {
      if (!USE_MOCK) {
        try {
          return await request<BlendResponse>(
            `/blend?region=${encodeURIComponent(region)}&lead=${lead}&param=${param}`
          );
        } catch (err) {
          console.warn('[API Client] Backend offline for /blend. Using mock data.');
        }
      }
      await new Promise((r) => setTimeout(r, 150));
      return getMockBlend(region, lead, param);
    },
  },

  skill: {
    get: async (
      region: string,
      param: WeatherParameter = 'rainfall',
      days: number = 30
    ): Promise<SkillResponse> => {
      if (!USE_MOCK) {
        try {
          return await request<SkillResponse>(
            `/skill?region=${encodeURIComponent(region)}&param=${param}&days=${days}`
          );
        } catch (err) {
          console.warn('[API Client] Backend offline for /skill. Using mock data.');
        }
      }
      await new Promise((r) => setTimeout(r, 150));
      return getMockSkill(region, param, days);
    },
  },

  alerts: {
    get: async (region?: string, audience?: string): Promise<WeatherAlert[]> => {
      if (!USE_MOCK) {
        try {
          const params = new URLSearchParams();
          if (region) params.append('region', region);
          if (audience) params.append('audience', audience);
          return await request<WeatherAlert[]>(`/alerts?${params.toString()}`);
        } catch (err) {
          console.warn('[API Client] Backend offline for /alerts. Using mock data.');
        }
      }
      await new Promise((r) => setTimeout(r, 150));
      return getMockAlerts(region, audience);
    },
  },

  weights: {
    override: async (
      weights: Record<string, number>,
      region: string = 'Konkan & Goa',
      lead: LeadTimeHours = 24,
      param: WeatherParameter = 'rainfall'
    ): Promise<BlendResponse> => {
      const sum = Object.values(weights).reduce((a, b) => a + b, 0);

      if (Math.abs(sum - 1.0) > 0.001) {
        const errorMsg = `Model weights must sum exactly to 1.00 (±0.001). Current sum: ${sum.toFixed(3)}`;
        throw new ApiError(422, errorMsg, { total: sum });
      }

      if (!USE_MOCK) {
        try {
          return await request<BlendResponse>('/weights/override', {
            method: 'POST',
            body: JSON.stringify(weights),
          });
        } catch (err) {
          console.warn('[API Client] Backend offline for /weights/override. Using mock computation.');
        }
      }

      await new Promise((r) => setTimeout(r, 250));
      return getMockBlend(region, lead, param, weights);
    },
  },

  export: {
    download: async (format: 'csv' | 'pdf', dataSummary?: any): Promise<void> => {
      await new Promise((r) => setTimeout(r, 500));

      let mimeType = 'text/csv';
      let extension = 'csv';
      let content = '';

      if (format === 'csv') {
        mimeType = 'text/csv';
        extension = 'csv';
        content = [
          'ForeCombine Meteorological Report - SIH 2026',
          `Generated: ${new Date().toISOString()}`,
          'Source,Forecast_Value,Assigned_Weight,Previous_Weight,Reason',
          'NWP (NCMRWF/GFS),156.6,0.18,0.22,"Orographic bias"',
          'Ensemble (GEFS),123.8,0.24,0.21,"Spread capture"',
          'AI Model (FourCastNet),131.2,0.38,0.33,"Lowest 48h RMSE"',
          'Regional Model (WRF),149.9,0.20,0.24,"Squall adjustment"',
          'BLENDED FORECAST,138.4,1.00,1.00,"Adaptive Multimodel Ensemble"',
          'OBSERVED VERIFIED,138.4,N/A,N/A,"IMD Automatic Weather Station"',
        ].join('\n');
      } else {
        mimeType = 'application/pdf';
        extension = 'pdf';
        content = `%PDF-1.4 ForeCombine Adaptive NWP-AI Forecast Blend Report - Region: Konkan & Goa - Status: Severe Alert Active`;
      }

      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ForeCombine_Forecast_${Date.now()}.${extension}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  },
};
