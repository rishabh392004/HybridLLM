import * as THREE from 'three';

/**
 * 1:1 Implementation of Three.js webgpu_tsl_earth.html / Three.js Journey Earth Shader
 * 
 * Features:
 * - Day / Night city lights transition based on sun orientation
 * - Smooth twilight atmosphere glow (mix between twilight #bc490b and day #4db2ff)
 * - Fresnel edge rim scattering on the globe horizon
 * - Backside atmospheric outer halo shell
 */

export const TslEarthGlobeShader = {
  uniforms: {
    uSunDirection: { value: new THREE.Vector3(0, 0, 3) },
    uAtmosphereDayColor: { value: new THREE.Color('#4db2ff') },
    uAtmosphereTwilightColor: { value: new THREE.Color('#bc490b') },
    uDayTexture: { value: null },
    uNightTexture: { value: null },
    uBumpRoughnessCloudsTexture: { value: null },
  },

  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform vec3 uSunDirection;
    uniform vec3 uAtmosphereDayColor;
    uniform vec3 uAtmosphereTwilightColor;
    uniform sampler2D uDayTexture;
    uniform sampler2D uNightTexture;
    uniform sampler2D uBumpRoughnessCloudsTexture;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;

    float smoothStepCustom(float edge0, float edge1, float x) {
      return clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    }

    void main() {
      vec3 viewDirection = normalize(cameraPosition - vPosition);
      vec3 normal = normalize(vNormal);

      // Fresnel rim
      float fresnel = 1.0 - abs(dot(viewDirection, normal));

      // Sun orientation
      float sunOrientation = dot(normal, normalize(uSunDirection));

      // Atmosphere color (twilight sunset to day blue transition)
      float atmosphereStep = smoothStepCustom(-0.25, 0.75, sunOrientation);
      vec3 atmosphereColor = mix(uAtmosphereTwilightColor, uAtmosphereDayColor, atmosphereStep);

      // Texture samples
      vec4 dayTex = texture2D(uDayTexture, vUv);
      vec3 nightTex = texture2D(uNightTexture, vUv).rgb;
      vec4 bumpClouds = texture2D(uBumpRoughnessCloudsTexture, vUv);

      // Clouds mask (blue channel)
      float cloudsStrength = smoothStepCustom(0.2, 1.0, bumpClouds.b);
      vec3 dayColor = mix(dayTex.rgb, vec3(1.0), cloudsStrength * 2.0);

      // Day / Night blend
      float dayStrength = smoothStepCustom(-0.25, 0.5, sunOrientation);
      vec3 finalColor = mix(nightTex, dayColor, dayStrength);

      // Horizon Atmosphere Mix
      float atmosphereDayStrength = smoothStepCustom(-0.5, 1.0, sunOrientation);
      float atmosphereMix = clamp(atmosphereDayStrength * pow(fresnel, 2.0), 0.0, 1.0);

      finalColor = mix(finalColor, atmosphereColor, atmosphereMix);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
};

export const TslAtmosphereShader = {
  uniforms: {
    uSunDirection: { value: new THREE.Vector3(0, 0, 3) },
    uAtmosphereDayColor: { value: new THREE.Color('#4db2ff') },
    uAtmosphereTwilightColor: { value: new THREE.Color('#bc490b') },
  },

  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform vec3 uSunDirection;
    uniform vec3 uAtmosphereDayColor;
    uniform vec3 uAtmosphereTwilightColor;

    varying vec3 vNormal;
    varying vec3 vPosition;

    float smoothStepCustom(float edge0, float edge1, float x) {
      return clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    }

    void main() {
      vec3 viewDirection = normalize(cameraPosition - vPosition);
      vec3 normal = normalize(vNormal);

      float fresnel = 1.0 - abs(dot(viewDirection, normal));
      float sunOrientation = dot(normal, normalize(uSunDirection));

      float atmosphereStep = smoothStepCustom(-0.25, 0.75, sunOrientation);
      vec3 atmosphereColor = mix(uAtmosphereTwilightColor, uAtmosphereDayColor, atmosphereStep);

      // Atmosphere outer halo alpha calculation
      float alpha = clamp((fresnel - 0.73) / (1.0 - 0.73), 0.0, 1.0);
      alpha = 1.0 - alpha;
      alpha = pow(alpha, 3.0);

      float dayStrength = smoothStepCustom(-0.5, 1.0, sunOrientation);
      alpha *= dayStrength;

      gl_FragColor = vec4(atmosphereColor, alpha);
    }
  `,
};
