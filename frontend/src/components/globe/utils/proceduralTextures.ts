import * as THREE from 'three';

/**
 * Procedural Texture Generator matching Three.js webgpu_tsl_earth.html requirements.
 */

// Function to convert Lat/Lng to Canvas XY
const toXY = (lat: number, lng: number, width: number, height: number) => {
  const x = ((lng + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
};

const drawLandmass = (ctx: CanvasRenderingContext2D, points: { lat: number; lng: number }[], width: number, height: number) => {
  if (points.length === 0) return;
  ctx.beginPath();
  const first = toXY(points[0].lat, points[0].lng, width, height);
  ctx.moveTo(first.x, first.y);
  for (let i = 1; i < points.length; i++) {
    const pt = toXY(points[i].lat, points[i].lng, width, height);
    ctx.lineTo(pt.x, pt.y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
};

const CONTINENT_POLYGONS = [
  // India Subcontinent
  [
    { lat: 35, lng: 74 }, { lat: 32, lng: 76 }, { lat: 28, lng: 88 }, { lat: 24, lng: 92 },
    { lat: 22, lng: 88 }, { lat: 16, lng: 82 }, { lat: 10, lng: 79 }, { lat: 8, lng: 77 },
    { lat: 12, lng: 75 }, { lat: 15, lng: 73 }, { lat: 20, lng: 72 }, { lat: 24, lng: 69 }, { lat: 30, lng: 70 }
  ],
  // Eurasia
  [
    { lat: 70, lng: 10 }, { lat: 70, lng: 170 }, { lat: 50, lng: 140 }, { lat: 35, lng: 120 },
    { lat: 20, lng: 110 }, { lat: 10, lng: 100 }, { lat: 25, lng: 60 }, { lat: 30, lng: 50 },
    { lat: 40, lng: 30 }, { lat: 60, lng: 20 }
  ],
  // Africa
  [
    { lat: 35, lng: 10 }, { lat: 30, lng: 32 }, { lat: 10, lng: 50 }, { lat: -10, lng: 40 },
    { lat: -34, lng: 20 }, { lat: -15, lng: 12 }, { lat: 5, lng: 0 }, { lat: 15, lng: -17 }, { lat: 30, lng: -10 }
  ],
  // North America
  [
    { lat: 70, lng: -160 }, { lat: 60, lng: -100 }, { lat: 45, lng: -65 }, { lat: 25, lng: -80 },
    { lat: 15, lng: -90 }, { lat: 30, lng: -115 }, { lat: 50, lng: -130 }
  ],
  // South America
  [
    { lat: 10, lng: -75 }, { lat: -5, lng: -35 }, { lat: -25, lng: -48 }, { lat: -55, lng: -68 }, { lat: -15, lng: -75 }
  ],
  // Australia
  [
    { lat: -12, lng: 130 }, { lat: -15, lng: 145 }, { lat: -38, lng: 148 }, { lat: -32, lng: 115 }, { lat: -20, lng: 118 }
  ]
];

export function generateTslDayCanvas(width = 2048, height = 1024): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Ocean (Deep Blue Gradient)
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0c1a36');
  gradient.addColorStop(0.5, '#112244');
  gradient.addColorStop(1, '#0c1a36');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Grid Lines
  ctx.strokeStyle = 'rgba(77, 178, 255, 0.15)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += width / 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += height / 12) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Continents (Dark Tactical Green/Slate)
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;

  CONTINENT_POLYGONS.forEach((poly) => drawLandmass(ctx, poly, width, height));

  return canvas;
}

export function generateTslNightCanvas(width = 2048, height = 1024): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Deep Black Night Oceans & Land
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, width, height);

  // Night City Light Clusters (Warm Amber & Cyan Golden Glow)
  const cityClusters = [
    { lat: 28.61, lng: 77.20, r: 12 }, // New Delhi
    { lat: 19.07, lng: 72.87, r: 14 }, // Mumbai
    { lat: 13.08, lng: 80.27, r: 10 }, // Chennai
    { lat: 22.57, lng: 88.36, r: 10 }, // Kolkata
    { lat: 12.97, lng: 77.59, r: 12 }, // Bengaluru
    { lat: 51.50, lng: -0.12, r: 16 }, // London
    { lat: 40.71, lng: -74.00, r: 18 }, // New York
    { lat: 35.67, lng: 139.65, r: 20 }, // Tokyo
    { lat: 25.20, lng: 55.27, r: 14 }, // Dubai
    { lat: 1.35, lng: 103.81, r: 10 }, // Singapore
  ];

  cityClusters.forEach((c) => {
    const pt = toXY(c.lat, c.lng, width, height);
    const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, c.r * 2);
    grad.addColorStop(0, '#f59e0b');
    grad.addColorStop(0.4, '#d97706');
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, c.r * 2, 0, Math.PI * 2);
    ctx.fill();
  });

  return canvas;
}

export function generateTslBumpRoughnessCloudsCanvas(width = 2048, height = 1024): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Composite texture format:
  // Red channel = Elevation bump map
  // Green channel = Roughness
  // Blue channel = Clouds opacity mask

  ctx.fillStyle = 'rgba(0, 50, 0, 1)'; // Base roughness & low elevation
  ctx.fillRect(0, 0, width, height);

  // Draw Cloud Wisps in Blue Channel (RGB: 0, 100, 220)
  ctx.fillStyle = 'rgb(20, 80, 220)';
  for (let i = 0; i < 50; i++) {
    const rx = Math.random() * width;
    const ry = Math.random() * height;
    const rw = 100 + Math.random() * 200;
    const rh = 30 + Math.random() * 60;

    ctx.beginPath();
    ctx.ellipse(rx, ry, rw, rh, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}
