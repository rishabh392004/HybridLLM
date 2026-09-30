/**
 * Globe Map Configuration Settings
 * Centralized magic numbers, colors, dimensions, and shader parameters.
 */

export const GLOBE_CONFIG = {
  // Dimension & Radii
  radius: 2.0,
  atmosphereRadius: 2.18,
  cloudsRadius: 2.03,
  
  // Camera settings
  cameraFov: 45,
  minDistance: 3.5,
  maxDistance: 8.0,
  defaultDistance: 5.2,

  // Animation Speeds
  autoRotateSpeed: 0.0015, // Radians per frame
  cloudsRotateSpeed: 0.0018,
  starfieldRotateSpeed: 0.0003,
  resumeRotateDelayMs: 4000, // Resume auto-rotate after interaction idle

  // Color Palette (Hex numbers for Three.js)
  colors: {
    background: 0x020617,
    oceanBase: 0x0a1428,
    landBase: 0x1e293b,
    gridLines: 0x06b6d4,
    atmosphereGlow: 0x22d3ee,
    atmosphereOuter: 0x3b82f6,
    clouds: 0x94a3b8,
    
    // Status colors
    severe: 0xef4444,
    warning: 0xf59e0b,
    normal: 0x10b981,
    arcTeal: 0x14b8a6,
    arcCyan: 0x06b6d4,
    
    // Telemetry highlight
    highlight: 0x38bdf8,
  },

  // Shader Parameters
  atmosphere: {
    fresnelPower: 3.2,
    intensity: 1.1,
  },

  // Performance Limits
  starsCount: 1500,
  maxDpr: 2,
};
