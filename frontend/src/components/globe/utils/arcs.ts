import * as THREE from 'three';
import { latLngToVector3 } from './geoCoords';

export interface ArcData {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color?: number;
}

/**
 * Creates 3D Quadratic Bezier Curve elevated above the sphere surface between start and end Lat/Lng.
 */
export function createArcCurve(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  globeRadius: number,
  maxElevation = 0.8
): THREE.QuadraticBezierCurve3 {
  const p1 = latLngToVector3(startLat, startLng, globeRadius);
  const p2 = latLngToVector3(endLat, endLng, globeRadius);

  // Calculate distance between points to scale height
  const distance = p1.distanceTo(p2);
  const midElevation = globeRadius + Math.min(distance * 0.45, maxElevation);

  // Midpoint projected outward from center
  const midPoint = new THREE.Vector3()
    .addVectors(p1, p2)
    .multiplyScalar(0.5)
    .normalize()
    .multiplyScalar(midElevation);

  return new THREE.QuadraticBezierCurve3(p1, midPoint, p2);
}

/**
 * Generate 3D TubeGeometry mesh for arc visualization.
 */
export function createArcMesh(
  curve: THREE.QuadraticBezierCurve3,
  color: number = 0x06b6d4,
  tubularSegments = 64,
  radius = 0.012
): THREE.Mesh {
  const geometry = new THREE.TubeGeometry(curve, tubularSegments, radius, 8, false);
  const material = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
  });

  return new THREE.Mesh(geometry, material);
}
