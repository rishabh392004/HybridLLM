import * as THREE from 'three';

/**
 * Converts Latitude and Longitude to 3D Cartesian Vector on a Sphere of given radius.
 * 
 * Math mapping:
 * phi = (90 - lat) * (pi / 180)
 * theta = (lng + 180) * (pi / 180)
 * x = -(R * sin(phi) * cos(theta))
 * z = (R * sin(phi) * sin(theta))
 * y = (R * cos(phi))
 */
export function latLngToVector3(
  lat: number,
  lng: number,
  radius: number,
  heightOffset = 0.0
): THREE.Vector3 {
  const r = radius + heightOffset;
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(r * Math.sin(phi) * Math.cos(theta));
  const z = r * Math.sin(phi) * Math.sin(theta);
  const y = r * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

/**
 * Align an object's normal vector to point outwards from sphere surface at position.
 */
export function alignObjectToNormal(object: THREE.Object3D, position: THREE.Vector3) {
  const up = new THREE.Vector3(0, 1, 0);
  const normal = position.clone().normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
  object.quaternion.copy(quaternion);
}
