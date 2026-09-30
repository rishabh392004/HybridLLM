import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { GLOBE_CONFIG } from './config/globeConfig';
import { latLngToVector3, alignObjectToNormal } from './utils/geoCoords';
import { createArcCurve, createArcMesh } from './utils/arcs';
import { TslEarthGlobeShader, TslAtmosphereShader } from './shaders/TslEarthShader';
import {
  generateTslDayCanvas,
  generateTslNightCanvas,
  generateTslBumpRoughnessCloudsCanvas,
} from './utils/proceduralTextures';
import {
  Maximize2,
  RotateCw,
  Zap,
  Filter,
  Layers,
  MapPin,
  TrendingUp,
  X,
  Radio,
  Eye,
} from 'lucide-react';

import { WeatherParameter } from '../../api/types';

export interface GlobeDataItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
  value: number;
  unit: string;
  severity: 'severe' | 'warning' | 'normal';
  parameter: WeatherParameter;
  impactSector?: string;
  forecastModel?: string;
}

const DEFAULT_DATA: GlobeDataItem[] = [
  {
    id: 'konkan-1',
    name: 'Konkan & Goa',
    lat: 15.2993,
    lng: 74.124,
    value: 138.4,
    unit: 'mm/day',
    severity: 'severe',
    parameter: 'rainfall',
    impactSector: 'Coastal Drainage & Bunds',
    forecastModel: 'Blended AI (GFS+WRF)',
  },
  {
    id: 'sub-himalayan-1',
    name: 'Sub-Himalayan WB & Sikkim',
    lat: 27.036,
    lng: 88.2627,
    value: 94.2,
    unit: 'mm/day',
    severity: 'warning',
    parameter: 'rainfall',
    impactSector: 'Hill Slopes & Soil Stability',
    forecastModel: 'NCUM Ensemble',
  },
  {
    id: 'kerala-1',
    name: 'Kerala & Mahe',
    lat: 10.8505,
    lng: 76.2711,
    value: 68.5,
    unit: 'mm/day',
    severity: 'warning',
    parameter: 'rainfall',
    impactSector: 'High-Altitude Plantations',
    forecastModel: 'ECMWF Surrogate',
  },
  {
    id: 'delhi-1',
    name: 'IMD Central Forecast Hub',
    lat: 28.6139,
    lng: 77.209,
    value: 42.1,
    unit: 'km/h',
    severity: 'normal',
    parameter: 'wind',
    impactSector: 'Aviation Grid',
    forecastModel: 'Operational Blender',
  },
  {
    id: 'gujarat-1',
    name: 'Saurashtra & Kutch',
    lat: 22.3094,
    lng: 70.8022,
    value: 41.5,
    unit: '°C',
    severity: 'warning',
    parameter: 'temperature',
    impactSector: 'Agro Thermal Stress',
    forecastModel: 'WRF Regional',
  },
];

export interface Globe3DProps {
  data?: GlobeDataItem[];
  selectedId?: string;
  onSelect?: (item: GlobeDataItem | null) => void;
  height?: string;
  className?: string;
  showInternalDrawer?: boolean;
}

export const Globe3D: React.FC<Globe3DProps> = ({
  data = DEFAULT_DATA,
  selectedId,
  onSelect,
  height = '600px',
  className = '',
  showInternalDrawer = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedItem, setSelectedItem] = useState<GlobeDataItem | null>(null);
  const [hoveredItem, setHoveredItem] = useState<GlobeDataItem | null>(null);
  const [activeParamFilter, setActiveParamFilter] = useState<'all' | WeatherParameter>('all');
  const [autoRotate, setAutoRotate] = useState(true);
  const [webGlSupported, setWebGlSupported] = useState(true);

  // References for Three.js scene elements
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeRef = useRef<THREE.Mesh | null>(null);
  const atmosphereRef = useRef<THREE.Mesh | null>(null);
  const markersGroupRef = useRef<THREE.Group | null>(null);
  const arcsGroupRef = useRef<THREE.Group | null>(null);

  // Rotation and Interaction State
  const isDraggingRef = useRef(false);
  const previousMouseRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const currentRotationRef = useRef({ x: 0, y: 0 });
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (selectedId) {
      const found = data.find((d) => d.id === selectedId);
      if (found) setSelectedItem(found);
    }
  }, [selectedId, data]);

  const filteredData = useMemo(() => {
    if (activeParamFilter === 'all') return data;
    return data.filter((item) => item.parameter === activeParamFilter);
  }, [data, activeParamFilter]);

  // Three.js Scene Setup (1:1 WebGPU / TSL Earth Architecture)
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGlSupported(false);
        return;
      }
    } catch (e) {
      setWebGlSupported(false);
      return;
    }

    const width = container.clientWidth;
    const heightPx = container.clientHeight || 600;

    // 1. Perspective Camera matching webgpu_tsl_earth.html (FOV: 25)
    const camera = new THREE.PerspectiveCamera(25, width / heightPx, 0.1, 100);
    camera.position.set(4.5, 2, 3);
    cameraRef.current = camera;

    // 2. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // 3. Sun Directional Light (positioned at 0, 0, 3 matching webgpu_tsl_earth.html)
    const sun = new THREE.DirectionalLight('#ffffff', 2);
    sun.position.set(0, 0, 3);
    scene.add(sun);

    // 4. Procedural Textures matching webgpu_tsl_earth.html
    const dayCanvas = generateTslDayCanvas();
    const dayTexture = new THREE.CanvasTexture(dayCanvas);
    dayTexture.colorSpace = THREE.SRGBColorSpace;
    dayTexture.anisotropy = 8;

    const nightCanvas = generateTslNightCanvas();
    const nightTexture = new THREE.CanvasTexture(nightCanvas);
    nightTexture.colorSpace = THREE.SRGBColorSpace;
    nightTexture.anisotropy = 8;

    const bumpCloudsCanvas = generateTslBumpRoughnessCloudsCanvas();
    const bumpCloudsTexture = new THREE.CanvasTexture(bumpCloudsCanvas);
    bumpCloudsTexture.anisotropy = 8;

    // 5. Globe Mesh with TSL Earth Shader
    const globeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uSunDirection: { value: sun.position },
        uAtmosphereDayColor: { value: new THREE.Color('#4db2ff') },
        uAtmosphereTwilightColor: { value: new THREE.Color('#bc490b') },
        uDayTexture: { value: dayTexture },
        uNightTexture: { value: nightTexture },
        uBumpRoughnessCloudsTexture: { value: bumpCloudsTexture },
      },
      vertexShader: TslEarthGlobeShader.vertexShader,
      fragmentShader: TslEarthGlobeShader.fragmentShader,
    });

    const sphereGeometry = new THREE.SphereGeometry(1, 64, 64);
    const globe = new THREE.Mesh(sphereGeometry, globeMaterial);
    scene.add(globe);
    globeRef.current = globe;

    // 6. Atmosphere Shell Mesh (BackSide, scaled 1.04 matching webgpu_tsl_earth.html)
    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uSunDirection: { value: sun.position },
        uAtmosphereDayColor: { value: new THREE.Color('#4db2ff') },
        uAtmosphereTwilightColor: { value: new THREE.Color('#bc490b') },
      },
      vertexShader: TslAtmosphereShader.vertexShader,
      fragmentShader: TslAtmosphereShader.fragmentShader,
      side: THREE.BackSide,
      transparent: true,
    });

    const atmosphere = new THREE.Mesh(sphereGeometry, atmosphereMaterial);
    atmosphere.scale.setScalar(1.04);
    scene.add(atmosphere);
    atmosphereRef.current = atmosphere;

    // Data Marker & Arc Groups attached to globe
    const markersGroup = new THREE.Group();
    globe.add(markersGroup);
    markersGroupRef.current = markersGroup;

    const arcsGroup = new THREE.Group();
    globe.add(arcsGroup);
    arcsGroupRef.current = arcsGroup;

    // 7. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, heightPx);
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // 8. Animation Loop matching webgpu_tsl_earth.html (delta * 0.025 rotation speed)
    let animationFrameId: number;
    let clock = new THREE.Clock();
    const checkReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Auto-rotation matching webgpu_tsl_earth.html delta * 0.025
      if (autoRotate && !isDraggingRef.current && !checkReducedMotion) {
        targetRotationRef.current.y += delta * 0.025;
      }

      currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.08;
      currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.08;

      if (globeRef.current) {
        globeRef.current.rotation.x = currentRotationRef.current.x;
        globeRef.current.rotation.y = currentRotationRef.current.y;
      }

      // Marker pulse animation
      if (markersGroupRef.current) {
        markersGroupRef.current.children.forEach((child) => {
          if (child.userData?.isPulseRing) {
            const scale = 1 + (Math.sin(elapsedTime * 3) + 1) * 0.25;
            child.scale.set(scale, scale, scale);
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 600;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      sphereGeometry.dispose();
      globeMaterial.dispose();
      atmosphereMaterial.dispose();
      dayTexture.dispose();
      nightTexture.dispose();
      bumpCloudsTexture.dispose();

      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, [autoRotate]);

  // Data Pins & Arcs update on radius = 1.0
  useEffect(() => {
    const markersGroup = markersGroupRef.current;
    const arcsGroup = arcsGroupRef.current;
    if (!markersGroup || !arcsGroup) return;

    while (markersGroup.children.length > 0) {
      markersGroup.remove(markersGroup.children[0]);
    }
    while (arcsGroup.children.length > 0) {
      arcsGroup.remove(arcsGroup.children[0]);
    }

    const radius = 1.0;

    filteredData.forEach((item) => {
      const pos = latLngToVector3(item.lat, item.lng, radius);

      const colorHex =
        item.severity === 'severe'
          ? GLOBE_CONFIG.colors.severe
          : item.severity === 'warning'
          ? GLOBE_CONFIG.colors.warning
          : GLOBE_CONFIG.colors.normal;

      // Pin Cylinder Beacon
      const beaconGeo = new THREE.CylinderGeometry(0.008, 0.003, 0.12, 16);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.95,
      });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconMesh.position.copy(pos.clone().add(pos.clone().normalize().multiplyScalar(0.06)));
      alignObjectToNormal(beaconMesh, pos);
      beaconMesh.userData = { dataItem: item };
      markersGroup.add(beaconMesh);

      // Pulse Ring
      const ringGeo = new THREE.RingGeometry(0.02, 0.035, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pos.clone().multiplyScalar(1.002));
      alignObjectToNormal(ringMesh, pos);
      ringMesh.userData = { isPulseRing: true };
      markersGroup.add(ringMesh);
    });

    // Central Arcs connecting to New Delhi (28.6139, 77.2090)
    const hubLat = 28.6139;
    const hubLng = 77.209;

    filteredData.forEach((item) => {
      if (item.lat === hubLat && item.lng === hubLng) return;

      const curve = createArcCurve(item.lat, item.lng, hubLat, hubLng, radius, 0.4);
      const arcMesh = createArcMesh(curve, 0x4db2ff, 64, 0.006);
      arcsGroup.add(arcMesh);
    });
  }, [filteredData]);

  // Pointer Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMouseRef.current = { x: e.clientX, y: e.clientY };
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const container = mountRef.current;
    if (!container || !cameraRef.current || !markersGroupRef.current) return;

    if (isDraggingRef.current) {
      const deltaX = e.clientX - previousMouseRef.current.x;
      const deltaY = e.clientY - previousMouseRef.current.y;

      targetRotationRef.current.y += deltaX * 0.005;
      targetRotationRef.current.x += deltaY * 0.005;
      targetRotationRef.current.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, targetRotationRef.current.x));

      previousMouseRef.current = { x: e.clientX, y: e.clientY };
    } else {
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      const intersects = raycaster.intersectObjects(markersGroupRef.current.children);
      const found = intersects.find((i) => i.object.userData?.dataItem);

      if (found) {
        setHoveredItem(found.object.userData.dataItem);
        container.style.cursor = 'pointer';
      } else {
        setHoveredItem(null);
        container.style.cursor = 'grab';
      }
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setAutoRotate(true);
    }, GLOBE_CONFIG.resumeRotateDelayMs);
  };

  const handleClick = (e: React.MouseEvent) => {
    const container = mountRef.current;
    if (!container || !cameraRef.current || !markersGroupRef.current) return;

    const rect = container.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    const intersects = raycaster.intersectObjects(markersGroupRef.current.children);
    const found = intersects.find((i) => i.object.userData?.dataItem);

    if (found) {
      const item = found.object.userData.dataItem;
      setSelectedItem(item);
      if (onSelect) onSelect(item);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!cameraRef.current) return;
    const delta = e.deltaY * 0.003;
    cameraRef.current.position.z = Math.max(1.8, Math.min(10.0, cameraRef.current.position.z + delta));
  };

  const handleResetView = () => {
    targetRotationRef.current = { x: 0, y: 0 };
    if (cameraRef.current) {
      cameraRef.current.position.set(4.5, 2, 3);
    }
    setSelectedItem(null);
    if (onSelect) onSelect(null);
  };

  if (!webGlSupported) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-8 rounded-2xl bg-surface/50 border border-border text-center ${className}`}
        style={{ height }}
      >
        <Radio className="w-10 h-10 text-cyan-400 mb-3" />
        <h3 className="text-base font-heading font-bold text-text-primary">
          WebGL Hardware Acceleration Unavailable
        </h3>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden tactical-card border border-border/80 shadow-2xl bg-slate-950 ${className}`}
      style={{ height }}
    >
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      />

      {/* Top Header Overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-sky-500/40 text-xs font-mono text-sky-300">
          <Eye className="w-4 h-4 text-sky-400 animate-pulse" />
          <span className="font-bold">THREE.JS WEBGPU/TSL EARTH MODEL</span>
        </div>

        {/* Layer Filters */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md p-1 rounded-xl border border-border/80 pointer-events-auto">
          {(['all', 'rainfall', 'wind', 'temperature'] as const).map((param) => (
            <button
              key={param}
              onClick={() => setActiveParamFilter(param)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono uppercase font-bold transition-all ${
                activeParamFilter === param
                  ? 'bg-sky-400 text-slate-950 shadow-glow-cyan'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {param}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 z-10">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`p-2 rounded-xl border text-xs font-mono flex items-center gap-1.5 backdrop-blur-md transition-all ${
            autoRotate
              ? 'bg-sky-950/70 border-sky-400 text-sky-300'
              : 'bg-slate-950/80 border-border text-text-muted hover:text-text-primary'
          }`}
          title="Toggle Auto Rotation"
        >
          <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
          <span>{autoRotate ? 'AUTO ROTATE ON' : 'PAUSED'}</span>
        </button>

        <button
          onClick={handleResetView}
          className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-border text-text-secondary hover:text-text-primary text-xs font-mono flex items-center gap-1.5 backdrop-blur-md transition-all"
          title="Reset Camera Target"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>RESET VIEW</span>
        </button>
      </div>

      {/* Hover Tooltip Overlay */}
      {hoveredItem && !selectedItem && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none">
          <div className="bg-slate-950/90 border border-sky-400/60 p-3 rounded-xl shadow-glow-cyan backdrop-blur-md text-xs font-mono space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <span className="font-bold text-text-primary">{hoveredItem.name}</span>
            </div>
            <div className="text-sky-300 font-bold">
              {hoveredItem.value} {hoveredItem.unit} ({hoveredItem.parameter.toUpperCase()})
            </div>
            <div className="text-[10px] text-text-muted">Click node for detailed telemetry</div>
          </div>
        </div>
      )}

      {/* Selected Node Drawer Side Panel (Only if not handled by external drawer) */}
      {showInternalDrawer && selectedItem && (
        <div className="absolute top-4 right-4 bottom-4 w-72 bg-white/95 border border-sky-300 rounded-2xl p-4 z-20 backdrop-blur-md flex flex-col justify-between shadow-2xl animate-fade-in font-mono text-xs">
          <div>
            <div className="flex items-start justify-between border-b border-border/70 pb-3 mb-3">
              <div>
                <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider block">
                  SELECTED REGIONAL STATION
                </span>
                <h3 className="text-sm font-heading font-black text-text-primary mt-0.5">
                  {selectedItem.name}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedItem(null);
                  if (onSelect) onSelect(null);
                }}
                className="p-1 rounded-lg bg-surface hover:bg-surface-hover text-text-muted hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-500/30">
                <span className="text-[10px] text-text-muted block">Blended Forecast Value:</span>
                <span className="text-xl font-bold text-sky-300">
                  {selectedItem.value} <span className="text-xs font-normal">{selectedItem.unit}</span>
                </span>
              </div>

              <div className="space-y-1.5 text-text-secondary text-[11px]">
                <div className="flex justify-between">
                  <span>Coordinates:</span>
                  <span className="text-text-primary">
                    {selectedItem.lat.toFixed(2)}°N, {selectedItem.lng.toFixed(2)}°E
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Evaluation Metric:</span>
                  <span className="capitalize text-text-primary">{selectedItem.parameter}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hazard Status:</span>
                  <span
                    className={`font-bold capitalize ${
                      selectedItem.severity === 'severe'
                        ? 'text-red-400'
                        : selectedItem.severity === 'warning'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {selectedItem.severity}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Ensemble Source:</span>
                  <span className="text-text-primary">{selectedItem.forecastModel || 'Blended Core'}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-surface/70 border border-border/70 text-[10px] space-y-1">
                <span className="text-sky-400 font-bold block">Target Impact Sector:</span>
                <p className="text-text-secondary leading-relaxed">{selectedItem.impactSector}</p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border/60 text-[10px] text-text-muted flex justify-between">
            <span>NODE ID: {selectedItem.id}</span>
            <span className="text-emerald-400">LIVE FEED</span>
          </div>
        </div>
      )}
    </div>
  );
};
