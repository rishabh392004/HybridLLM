import * as THREE from 'three';

/**
 * Custom GLSL Fresnel Rim Atmosphere Glow Shader
 * Calculates dot product of vertex normal and camera view vector (1.0 - dot(N, V))^power
 * to create an atmospheric rim halo around the globe.
 */
export const AtmosphereShader = {
  uniforms: {
    color: { value: new THREE.Color(0x22d3ee) },
    fresnelPower: { value: 3.2 },
    intensity: { value: 1.1 },
  },

  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform vec3 color;
    uniform float fresnelPower;
    uniform float intensity;

    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      // Calculate view vector from surface position to camera
      vec3 viewDir = normalize(-vPosition);
      
      // Fresnel intensity: higher near silhouette rim where dot product is near 0
      float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), fresnelPower);
      float alpha = fresnel * intensity;

      gl_FragColor = vec4(color, alpha);
    }
  `,
};

export function createAtmosphereMaterial(colorHex = 0x22d3ee, power = 3.2, intensity = 1.1): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(colorHex) },
      fresnelPower: { value: power },
      intensity: { value: intensity },
    },
    vertexShader: AtmosphereShader.vertexShader,
    fragmentShader: AtmosphereShader.fragmentShader,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
  });
}
