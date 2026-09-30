import {
  BlendResponse,
  SkillResponse,
  WeatherAlert,
  RegionMetadata,
  WeatherParameter,
  LeadTimeHours,
  UserRole,
} from './types';

export const MOCK_REGIONS: RegionMetadata[] = [
  {
    id: 'konkan-goa',
    name: 'Konkan & Goa',
    state: 'Maharashtra / Goa',
    lat: 15.8281,
    lon: 73.8180,
    isExtreme: true,
    polygon: [
      [18.98, 72.82],
      [18.52, 73.30],
      [16.99, 73.32],
      [15.29, 74.12],
      [14.90, 74.00],
      [15.50, 73.70],
      [18.00, 72.90],
      [18.98, 72.82],
    ],
  },
  {
    id: 'kerala',
    name: 'Kerala',
    state: 'Kerala',
    lat: 10.8505,
    lon: 76.2711,
    polygon: [
      [12.50, 75.00],
      [11.80, 75.50],
      [10.20, 76.50],
      [8.30, 77.10],
      [8.50, 76.80],
      [10.00, 76.10],
      [11.50, 75.60],
      [12.50, 75.00],
    ],
  },
  {
    id: 'east-rajasthan',
    name: 'East Rajasthan',
    state: 'Rajasthan',
    lat: 26.9124,
    lon: 75.7873,
    polygon: [
      [28.00, 75.00],
      [27.80, 77.20],
      [26.20, 77.00],
      [24.50, 76.20],
      [24.80, 74.50],
      [26.50, 74.80],
      [28.00, 75.00],
    ],
  },
  {
    id: 'assam-meghalaya',
    name: 'Assam & Meghalaya',
    state: 'Assam / Meghalaya',
    lat: 25.5788,
    lon: 91.8933,
    polygon: [
      [26.80, 90.00],
      [27.40, 94.50],
      [26.00, 95.00],
      [25.00, 92.50],
      [25.20, 90.00],
      [26.80, 90.00],
    ],
  },
  {
    id: 'punjab-haryana',
    name: 'Punjab & Haryana',
    state: 'Punjab / Haryana',
    lat: 30.7333,
    lon: 76.7794,
    polygon: [
      [32.00, 75.00],
      [31.50, 77.00],
      [29.50, 77.20],
      [28.20, 76.50],
      [29.00, 74.50],
      [31.00, 74.50],
      [32.00, 75.00],
    ],
  },
  {
    id: 'coastal-andhra',
    name: 'Coastal Andhra Pradesh',
    state: 'Andhra Pradesh',
    lat: 16.5062,
    lon: 80.6480,
    polygon: [
      [18.50, 84.00],
      [17.00, 82.20],
      [15.80, 80.50],
      [13.50, 80.10],
      [14.20, 79.50],
      [16.50, 80.00],
      [18.50, 84.00],
    ],
  },
];

export const MOCK_SOURCES = [
  'NWP (NCMRWF/GFS)',
  'Ensemble (GEFS)',
  'AI Model (FourCastNet)',
  'Regional Model (WRF)',
];

/**
 * Returns mock blend forecast for a region, parameter, and lead time.
 * Designed so that the Blended forecast is strictly and visibly closest to observed!
 */
export function getMockBlend(
  regionName: string,
  lead: LeadTimeHours = 24,
  param: WeatherParameter = 'rainfall',
  customWeights?: Record<string, number>
): BlendResponse {
  const isExtremeRegion = regionName.toLowerCase().includes('konkan') || regionName.toLowerCase().includes('goa');

  // Base values per parameter & region
  let observed: number;
  let sourceDeltas: number[];
  let unit: string;

  if (param === 'rainfall') {
    unit = 'mm/day';
    if (isExtremeRegion) {
      // EXTREME RAINFALL CASE (> 115 mm/day)
      observed = 138.4;
      // NWP overshoots, AI slightly undershoots, WRF high, Ensemble moderate
      sourceDeltas = [18.2, -14.6, -7.2, 11.5]; // 156.6, 123.8, 131.2, 149.9
    } else if (regionName.toLowerCase().includes('assam')) {
      observed = 94.2;
      sourceDeltas = [14.0, -10.5, -4.8, 8.2];
    } else if (regionName.toLowerCase().includes('kerala')) {
      observed = 72.8;
      sourceDeltas = [11.2, -8.6, -3.2, 6.4];
    } else if (regionName.toLowerCase().includes('rajasthan')) {
      observed = 4.2;
      sourceDeltas = [3.5, 1.2, -0.6, 2.1];
    } else if (regionName.toLowerCase().includes('coastal')) {
      observed = 61.5;
      sourceDeltas = [12.8, -9.4, -2.9, 7.3];
    } else {
      observed = 24.5;
      sourceDeltas = [6.2, -5.1, -1.8, 4.0];
    }
  } else if (param === 'temperature') {
    unit = '°C';
    if (regionName.toLowerCase().includes('rajasthan')) {
      observed = 42.4;
      sourceDeltas = [2.8, -2.1, 0.4, 1.9];
    } else if (regionName.toLowerCase().includes('punjab')) {
      observed = 32.1;
      sourceDeltas = [2.2, -1.8, -0.4, 1.3];
    } else {
      observed = 29.6;
      sourceDeltas = [2.4, -2.0, 0.5, 1.6];
    }
  } else {
    // wind (km/h)
    unit = 'km/h';
    if (regionName.toLowerCase().includes('coastal')) {
      observed = 63.8;
      sourceDeltas = [9.4, -8.1, -1.6, 6.2];
    } else if (isExtremeRegion) {
      observed = 52.4;
      sourceDeltas = [7.8, -6.5, -1.2, 4.8];
    } else {
      observed = 18.2;
      sourceDeltas = [4.1, -3.6, -0.8, 2.7];
    }
  }

  // Lead time variance penalty
  const leadFactor = lead === 24 ? 1.0 : lead === 48 ? 1.15 : lead === 72 ? 1.35 : 1.6;

  // Default intelligent adaptive weights (calibrated by recent inverse RMSE)
  // AI Model gets highest weight due to recent convective skill
  const defaultWeights: Record<string, { weight: number; prev: number; reason: string }> = {
    'NWP (NCMRWF/GFS)': {
      weight: 0.18,
      prev: 0.22,
      reason: 'Downweighted -4.0% due to persistent wet bias along coastal orographic barrier',
    },
    'Ensemble (GEFS)': {
      weight: 0.24,
      prev: 0.21,
      reason: 'Upweighted +3.0% capturing probabilistic spread during convective instability',
    },
    'AI Model (FourCastNet)': {
      weight: 0.38,
      prev: 0.33,
      reason: 'Upweighted +5.0% demonstrating lowest 48h RMSE & precise moisture flux convergence',
    },
    'Regional Model (WRF)': {
      weight: 0.20,
      prev: 0.24,
      reason: 'Downweighted -4.0% due to localized over-intensification of squall boundary',
    },
  };

  const sources = MOCK_SOURCES.map((name, idx) => {
    const rawVal = observed + sourceDeltas[idx] * leadFactor;
    const value = Math.max(0, parseFloat(rawVal.toFixed(1)));
    const meta = defaultWeights[name];
    const weight = customWeights && customWeights[name] !== undefined ? customWeights[name] : meta.weight;

    return {
      source: name,
      value,
      weight,
      previous_weight: meta.prev,
      reason: meta.reason,
    };
  });

  // Calculate blended value: sum(value * weight)
  const weightedSum = sources.reduce((acc, s) => acc + s.value * s.weight, 0);
  const blended_value = parseFloat(weightedSum.toFixed(1));

  return {
    region: regionName,
    parameter: param,
    lead_time: lead,
    blended_value,
    unit,
    sources,
    observed_value: observed,
    confidence_score: lead === 24 ? 94 : lead === 48 ? 89 : lead === 72 ? 81 : 73,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Returns mock skill scoreboard verification metrics
 */
export function getMockSkill(
  regionName: string,
  param: WeatherParameter = 'rainfall',
  days: number = 30
): SkillResponse {
  const isExtreme = regionName.toLowerCase().includes('konkan');
  const baseScale = param === 'rainfall' ? (isExtreme ? 18.0 : 9.5) : param === 'temperature' ? 2.4 : 6.8;
  const dayFactor = days === 7 ? 0.88 : days === 14 ? 0.94 : 1.0;

  const rows = [
    {
      source: 'AI Model (FourCastNet)',
      rmse: parseFloat((baseScale * 0.82 * dayFactor).toFixed(2)),
      mae: parseFloat((baseScale * 0.63 * dayFactor).toFixed(2)),
      rank: 2,
      trend: [14.2, 13.5, 12.8, 12.1, 11.4, 10.8, 10.2],
    },
    {
      source: 'Ensemble (GEFS)',
      rmse: parseFloat((baseScale * 0.96 * dayFactor).toFixed(2)),
      mae: parseFloat((baseScale * 0.74 * dayFactor).toFixed(2)),
      rank: 3,
      trend: [16.5, 15.8, 15.4, 14.9, 14.5, 14.1, 13.8],
    },
    {
      source: 'Regional Model (WRF)',
      rmse: parseFloat((baseScale * 1.12 * dayFactor).toFixed(2)),
      mae: parseFloat((baseScale * 0.87 * dayFactor).toFixed(2)),
      rank: 4,
      trend: [18.2, 17.6, 17.1, 16.8, 16.5, 16.0, 15.6],
    },
    {
      source: 'NWP (NCMRWF/GFS)',
      rmse: parseFloat((baseScale * 1.25 * dayFactor).toFixed(2)),
      mae: parseFloat((baseScale * 0.98 * dayFactor).toFixed(2)),
      rank: 5,
      trend: [19.8, 19.2, 18.9, 18.5, 18.1, 17.8, 17.4],
    },
  ];

  // ForeCombine Blend strictly outperforms all individual sources
  const blendRmse = parseFloat((baseScale * 0.68 * dayFactor).toFixed(2));
  const blendMae = parseFloat((baseScale * 0.51 * dayFactor).toFixed(2));

  return {
    region: regionName,
    parameter: param,
    days,
    rows,
    blend: {
      rmse: blendRmse,
      mae: blendMae,
      rank: 1, // Number 1
      improvement_vs_best_single: 17.1, // 17.1% error reduction
      trend: [11.2, 10.6, 10.1, 9.4, 8.8, 8.2, 7.9],
    },
  };
}

/**
 * Returns weather alerts tailored across all 3 target audiences:
 * Farmer, Disaster Management, Public
 */
export function getMockAlerts(regionFilter?: string, audienceFilter?: string): WeatherAlert[] {
  const alerts: WeatherAlert[] = [
    // 1. Extreme Rainfall (Konkan & Goa) - Primary Demo Case (>115 mm/day)
    {
      id: 'alt-konkan-rain-farmer',
      hazard: 'Extreme Heavy Rainfall & Waterlogging',
      severity: 'severe',
      region: 'Konkan & Goa',
      value: 138.4,
      threshold: 115.0,
      unit: 'mm/day',
      message: 'CRITICAL: Rainfall exceeds 115 mm. Inundation danger for standing kharif paddy nurseries and coastal orchards. Cut open secondary drainage canals immediately. Postpone all urea top-dressing and chemical sprays.',
      audience: 'farmer',
      parameter: 'rainfall',
      lead_time: 24,
      impact_sector: 'Kharif Crops & Seedbeds',
      action_protocol: 'Drain field bunds within 6 hours, anchor polyhouses',
    },
    {
      id: 'alt-konkan-rain-dm',
      hazard: 'Catastrophic Flash Flood & Landslide Threat',
      severity: 'severe',
      region: 'Konkan & Goa',
      value: 138.4,
      threshold: 115.0,
      unit: 'mm/day',
      message: 'RED ALERT: Projected 24h precipitation 138.4 mm (critical threshold: 115 mm). Deploy SDRF 5th Battalion to Sindhudurg & Ratnagiri. Issue evacuation notices for 14 vulnerable riverine villages. Stage high-capacity dewatering pumps at low-lying bridges.',
      audience: 'disaster_management',
      parameter: 'rainfall',
      lead_time: 24,
      impact_sector: 'Civil Infrastructure & Habitations',
      action_protocol: 'NDRF Level-3 mobilization, Section 144 near riverbanks',
    },
    {
      id: 'alt-konkan-rain-public',
      hazard: 'Extremely Severe Rainfall Warning',
      severity: 'severe',
      region: 'Konkan & Goa',
      value: 138.4,
      threshold: 115.0,
      unit: 'mm/day',
      message: 'PUBLIC DANGER ADVISORY: Relentless torrential rain (138+ mm/day) forecast over the next 24-48 hours. Avoid all non-essential travel along the Western Ghats and coastal highways. Keep mobile phones charged and stock 48h emergency water and medicines.',
      audience: 'analyst', // analyst also receives public bulletin
      parameter: 'rainfall',
      lead_time: 24,
      impact_sector: 'Transport & Daily Commute',
      action_protocol: 'Stay indoors, do not attempt to cross flooded causeways',
    },

    // 2. High Heatwave (East Rajasthan)
    {
      id: 'alt-raj-heat-farmer',
      hazard: 'Severe Heatwave Stress',
      severity: 'warning',
      region: 'East Rajasthan',
      value: 42.4,
      threshold: 40.0,
      unit: '°C',
      message: 'HEAT STRESS ADVISORY: Temperatures reaching 42.4°C. Schedule drip irrigation only during dusk or pre-dawn to avoid root scald. Provide thatched shade and mineral salts for livestock to prevent heatstroke.',
      audience: 'farmer',
      parameter: 'temperature',
      lead_time: 48,
      impact_sector: 'Livestock & Horticulture',
      action_protocol: 'Night irrigation, hydrate cattle with electrolyte troughs',
    },
    {
      id: 'alt-raj-heat-dm',
      hazard: 'Orange Level Heat Action Plan Activation',
      severity: 'warning',
      region: 'East Rajasthan',
      value: 42.4,
      threshold: 40.0,
      unit: '°C',
      message: 'ORANGE ALERT: 42.4°C temperature envelope across Jaipur, Tonk, and Dausa. Activate urban cooling shelters, mandate afternoon work pauses (12 PM - 3:30 PM) for construction laborers, and replenish hospital ORS reserves.',
      audience: 'disaster_management',
      parameter: 'temperature',
      lead_time: 48,
      impact_sector: 'Public Health & Outdoor Workers',
      action_protocol: 'Enforce heatwave SOP 4B, mobilize mobile drinking kiosks',
    },

    // 3. Gale Squalls / Coastal Wind (Coastal Andhra Pradesh)
    {
      id: 'alt-ap-wind-farmer',
      hazard: 'High Velocity Squalls & Coastal Gale',
      severity: 'warning',
      region: 'Coastal Andhra Pradesh',
      value: 63.8,
      threshold: 50.0,
      unit: 'km/h',
      message: 'GALE WIND WARNING: Wind gusts up to 64 km/h expected. Erect bamboo staking for banana plantations and papaya trees. Secure greenhouse sheets and harvest mature crops to minimize lodging loss.',
      audience: 'farmer',
      parameter: 'wind',
      lead_time: 48,
      impact_sector: 'Banana, Papaya & Sugarcane',
      action_protocol: 'Erect crop props and tie tall standing crops',
    },
    {
      id: 'alt-ap-wind-dm',
      hazard: 'Marine Squall & Fishermen Advisory',
      severity: 'warning',
      region: 'Coastal Andhra Pradesh',
      value: 63.8,
      threshold: 50.0,
      unit: 'km/h',
      message: 'COASTAL DEFENSE ADVISORY: Sustained winds 63.8 km/h. Hoist Local Cautionary Signal LC-3 at Visakhapatnam and Kakinada ports. Strictly prohibit deep-sea fishing trawlers from venturing into west-central Bay of Bengal.',
      audience: 'disaster_management',
      parameter: 'wind',
      lead_time: 48,
      impact_sector: 'Maritime Ports & Coastal Trawlers',
      action_protocol: 'Enforce coastal fishing ban, inspect shoreline communication towers',
    },

    // 4. Heavy Rainfall (Assam & Meghalaya)
    {
      id: 'alt-assam-farmer',
      hazard: 'Intense Riverine Inundation Warning',
      severity: 'warning',
      region: 'Assam & Meghalaya',
      value: 94.2,
      threshold: 65.0,
      unit: 'mm/day',
      message: 'FLOOD ALERT: 94 mm rainfall will elevate Brahmaputra river tributaries. Shift harvested grain to elevated granaries (Chang-ghar). Shift livestock to high ground embankments immediately.',
      audience: 'farmer',
      parameter: 'rainfall',
      lead_time: 24,
      impact_sector: 'Paddy & Livestock Safety',
      action_protocol: 'Evacuate riverine islands (chars) with livestock',
    },
    {
      id: 'alt-assam-dm',
      hazard: 'Brahmaputra Tributary Flood Alert',
      severity: 'warning',
      region: 'Assam & Meghalaya',
      value: 94.2,
      threshold: 65.0,
      unit: 'mm/day',
      message: 'WARNING: 94.2 mm rainfall in catchment areas. Water level at Nematighat and Dhubri expected to cross danger mark in 36h. Inspect vulnerable embankment spurs in Morigaon and Barpeta.',
      audience: 'disaster_management',
      parameter: 'rainfall',
      lead_time: 24,
      impact_sector: 'River Embankments & Floodplains',
      action_protocol: 'Pre-position SDRF rescue boats, stock sandbags at vulnerable dykes',
    },
  ];

  let filtered = alerts;
  if (regionFilter) {
    filtered = filtered.filter(a => a.region.toLowerCase().includes(regionFilter.toLowerCase()));
  }
  if (audienceFilter && audienceFilter !== 'all') {
    filtered = filtered.filter(a => a.audience === audienceFilter || a.audience === 'all');
  }

  return filtered;
}
