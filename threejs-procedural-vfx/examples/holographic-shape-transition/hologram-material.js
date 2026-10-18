import * as THREE from "three";

/**
 * Holographic projection material: an additive, depth-write-free shell whose
 * whole silhouette is carried by a squared Fresnel rim, banded by object-space
 * scanlines, and cut by a shared vertical sweep that hands one shape over to
 * the next.
 *
 * The material is one shell pass — front faces only, additive blending, no
 * depth write — so composition is order independent and the projection never
 * occludes itself into a solid body.
 *
 * Every mesh in a projection set shares this shader and differs only by
 * `uIndex`. `uCurrentIndex`/`uNextIndex` name the two shapes taking part in the
 * live transition; every other index discards in the first fragment statement,
 * so an arbitrarily large shape library costs one skipped draw each.
 */

/**
 * Glitch, sweep, and scanline constants. These are the projection's identity —
 * read them as the contract, not as tuning dials.
 */
export const HOLOGRAM_CONTRACT = {
  /** Scanline bands per object-space metre. */
  scanlineFrequency: 20,
  /** Object-space metres per second the bands crawl downward. */
  scanlineSpeed: 0.2,
  /** Mean of pow(fract(x), 3) over one band period; the filtered limit. */
  scanlineMean: 0.25,
  /** Fresnel rim exponent, and the falloff that keeps the rim from filling in. */
  fresnelExponent: 2,
  fresnelFalloffEdge: 0.8,
  /** Rim weight added on top of the scanline-modulated rim. */
  rimGain: 1.25,
  /** Ambient body glitch: displacement metres at full gate strength. */
  glitchStrength: 2,
  /** Transition-band glitch: displacement metres inside the sweep. */
  transitionGlitchStrength: 0.3,
  /** Normalised half-width of the transition glitch band. */
  transitionGlitchWidth: 0.02,
};

export const HOLOGRAM_DEBUG_MODES = {
  final: 0,
  scanlines: 1,
  fresnel: 2,
  transition: 3,
  glitch: 4,
};

const hologramVertexShader = /* glsl */ `
uniform float uTime;
uniform float uProgress;
uniform float uMinY;
uniform float uMaxY;

varying vec3 vPosition;
varying vec3 vViewPosition;
varying vec3 vNormal;
varying float vGlitch;

// Pseudo-random number generator based on 2D input
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);

  // ── Base Glitch Effect ──────────────────────────────────
  // The phase is offset by world height, so the artifact reads as a band
  // travelling up the projection rather than whole-body jitter. Three
  // incommensurate sines gate through smoothstep, so most of the surface sits
  // at exactly zero and only narrow bands displace.
  float glitchTime = uTime - modelPosition.y;
  float glitchStrength = sin(glitchTime)
                       * sin(glitchTime * 3.45)
                       + sin(glitchTime * 8.76);
  glitchStrength /= 3.0;
  glitchStrength  = smoothstep(0.5, 1.0, glitchStrength);
  glitchStrength *= 2.0;

  modelPosition.x += (random(modelPosition.xz + uTime) - 0.5) * glitchStrength;
  modelPosition.z += (random(modelPosition.xz + uTime) - 0.5) * glitchStrength;

  // ── Progress-Based Glitch (transition wave) ─────────────
  // A second, much weaker displacement pinned to the sweep line itself, so the
  // handover edge frays instead of cutting cleanly.
  float normalizedY    = (modelPosition.y - uMinY) / (uMaxY - uMinY);
  float diff           = abs(normalizedY - uProgress);
  float progressGlitch = smoothstep(0.02, 0.0, diff);
  progressGlitch      *= 0.3;

  modelPosition.x += (random(modelPosition.xz + uTime) - 0.5) * progressGlitch;
  modelPosition.z += (random(modelPosition.xz + uTime) - 0.5) * progressGlitch;

  // ── Final Position ──────────────────────────────────────
  gl_Position = projectionMatrix * viewMatrix * modelPosition;

  // World position carries the scanline phase and the shared sweep range.
  vPosition = modelPosition.xyz;
  vGlitch = glitchStrength + progressGlitch;

  // The rim IS the normal, so the frame it is measured in has to be exact.
  // Resolve incidence in view space: normalMatrix is the inverse transpose of
  // the model-view basis, which stays correct under non-uniform scale, and the
  // displaced point's view position gives the view ray with the camera at the
  // origin. A rigid view transform preserves the dot product, so this is the
  // same incidence a correct world-space frame would report — while a bare
  // basis multiply of the normal is only correct for rotation and uniform
  // scale, and skews the silhouette on any squashed instance.
  vViewPosition = (viewMatrix * modelPosition).xyz;
  vNormal = normalMatrix * normal;
}
`;

const hologramFragmentShader = /* glsl */ `
uniform float uTime;
uniform float uIndex;
uniform float uCurrentIndex;
uniform float uNextIndex;
uniform float uProgress;
uniform vec3  uColor;
uniform float uMinY;
uniform float uMaxY;
uniform int   uDebugMode;

varying vec3 vPosition;
varying vec3 vViewPosition;
varying vec3 vNormal;
varying float vGlitch;

void main() {

  // ── Discard meshes not involved in current transition ───
  if (uIndex != uCurrentIndex && uIndex != uNextIndex) {
    discard;
  }

  // ── Scan Line Effect ────────────────────────────────────
  float lines  = 20.0;
  float offset = vPosition.y - uTime * 0.2;
  float cycles = offset * lines;
  float density = mod(cycles, 1.0);
  density = pow(density, 3.0);
  // The band field has no mip chain, so once one pixel spans a whole period it
  // beats into moire. Measure the periods crossed per pixel and dissolve the
  // band into its own mean (pow(fract, 3) integrates to 0.25) from two samples
  // per period down to one. Fading to zero instead would make a receding
  // projection lose brightness with distance: the band is a radiance term.
  float bandFootprint = fwidth(cycles);
  float bandKeep = 1.0 - smoothstep(0.25, 0.5, bandFootprint);
  density = mix(0.25, density, bandKeep);

  // ── Fresnel Rim Glow ────────────────────────────────────
  vec3  viewDirection = normalize(vViewPosition);
  float fresnel       = 1.0 - abs(dot(normalize(vNormal), viewDirection));
  fresnel             = pow(fresnel, 2.0);

  // ── Fresnel Falloff ─────────────────────────────────────
  // Squared Fresnel alone saturates the exact silhouette into a hard outline;
  // the falloff pulls the extreme grazing band back down so the rim keeps an
  // inner edge and reads as a glow.
  float falloff = smoothstep(0.8, 0.0, fresnel);

  // ── Combine Effects ─────────────────────────────────────
  float holographic  = density * fresnel;
  holographic       += fresnel * 1.25;
  holographic       *= falloff;

  // ── Transition Masking ──────────────────────────────────
  // One shared normalised height range across every shape in the set, so the
  // sweep line stays continuous as the projection swaps bodies. The two
  // discards are complementary, so the participating shapes never overlap —
  // which is what stops an additive pass from doubling brightness mid-handover.
  float normalizedY = (vPosition.y - uMinY) / (uMaxY - uMinY);

  // Hide bottom of current mesh as progress sweeps up
  if (uIndex == uCurrentIndex && normalizedY < uProgress) {
    discard;
  }

  // Hide top of next mesh until progress sweeps through
  if (uIndex == uNextIndex && normalizedY > uProgress) {
    discard;
  }

  // ── Final Color Output ──────────────────────────────────
  gl_FragColor = vec4(uColor, holographic);

  if (uDebugMode == 1) {
    gl_FragColor = vec4(vec3(density), 1.0);
  } else if (uDebugMode == 2) {
    gl_FragColor = vec4(vec3(fresnel), 1.0);
  } else if (uDebugMode == 3) {
    float band = smoothstep(0.02, 0.0, abs(normalizedY - uProgress));
    gl_FragColor = vec4(normalizedY * 0.35, band, uProgress * 0.35, 1.0);
  } else if (uDebugMode == 4) {
    gl_FragColor = vec4(vec3(vGlitch * 0.5), 1.0);
  }

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/**
 * One projection shell material. Clone it per shape and set `uIndex`; write the
 * shared `uMinY`/`uMaxY` before cloning so every clone starts from the same
 * sweep range.
 */
export function createHologramMaterial({ color = "#00d5ff" } = {}) {
  const uniforms = {
    uColor: new THREE.Uniform(new THREE.Color(color)),
    uTime: new THREE.Uniform(0),
    uProgress: new THREE.Uniform(0),
    uIndex: new THREE.Uniform(0),
    uCurrentIndex: new THREE.Uniform(0),
    uNextIndex: new THREE.Uniform(1),
    uMinY: new THREE.Uniform(0),
    uMaxY: new THREE.Uniform(0),
    uDebugMode: new THREE.Uniform(0),
  };

  return new THREE.ShaderMaterial({
    vertexShader: hologramVertexShader,
    fragmentShader: hologramFragmentShader,
    uniforms,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

export { hologramFragmentShader, hologramVertexShader };
