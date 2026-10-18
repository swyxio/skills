import * as THREE from "three";

export const AURORA_CURTAIN_PRESET = Object.freeze({
  raySteps: 75,
  probeRaySteps: 40,
  speed: 0.65,
  noiseSeed: 19.6,
  intensity: 1,
  colorBase: "#59ff03",
  colorHigh: "#00aaff",
});

export const AURORA_PROBE_SIZE = Object.freeze({ width: 32, height: 16 });

const QUAD_VERTEX_SHADER = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const AURORA_VOLUME_GLSL = /* glsl */ `
  uniform vec2  iResolution;
  uniform float iTime;
  uniform float uSpeed;
  uniform float uSeed;
  uniform float uAuroraGain;
  uniform vec3  uColorBase;
  uniform vec3  uColorHigh;

  uniform mat3  uCamBasis;
  uniform float uFov;

  const float RAY_ITERATIONS = float(AURORA_STEPS);
  const float LUMINANCE_FACTOR = 0.05;

  const float Y_OFFSET_BOTTOM = 50.0;
  const float VOLUME_DEPTH = 75.0;
  const vec3 BOUND_LOW = vec3(-250.0, Y_OFFSET_BOTTOM, -500.0);
  const vec3 BOUND_HIGH = vec3(250.0, Y_OFFSET_BOTTOM + VOLUME_DEPTH, 500.0);

  float generateRandomFloat(vec2 seedVal) {
    vec3 p3 = fract(vec3(seedVal.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float computeHash1(float v) {
    vec3 hVec = fract(vec3(v) * 0.1031);
    hVec += dot(hVec, hVec.yzx + 19.19);
    return fract((hVec.x + hVec.y) * hVec.z);
  }

  float computeHash3(vec3 v3) {
    v3 = fract(v3 * vec3(0.1031, 0.1030, 0.0973));
    v3 += dot(v3, v3.yxz + 33.33);
    return fract((v3.xxy + v3.yxx) * v3.zyx).x;
  }

  float evaluateVolumeNoise(vec3 coord) {
    vec3 gridP = floor(coord);
    vec3 fractP = fract(coord);
    fractP = fractP * fractP * (3.0 - 2.0 * fractP);
    return mix(
      mix(
        mix(
          computeHash3(gridP + vec3(0.0, 0.0, 0.0)),
          computeHash3(gridP + vec3(1.0, 0.0, 0.0)),
          fractP.x
        ),
        mix(
          computeHash3(gridP + vec3(0.0, 1.0, 0.0)),
          computeHash3(gridP + vec3(1.0, 1.0, 0.0)),
          fractP.x
        ),
        fractP.y
      ),
      mix(
        mix(
          computeHash3(gridP + vec3(0.0, 0.0, 1.0)),
          computeHash3(gridP + vec3(1.0, 0.0, 1.0)),
          fractP.x
        ),
        mix(
          computeHash3(gridP + vec3(0.0, 1.0, 1.0)),
          computeHash3(gridP + vec3(1.0, 1.0, 1.0)),
          fractP.x
        ),
        fractP.y
      ),
      fractP.z
    );
  }

  float smoothCurve(float t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  }

  float pickGradient(float hVal, float posVal) {
    int idx = int(1e4 * hVal);
    return (idx - (idx / 2) * 2) == 0 ? posVal : -posVal;
  }

  float calculateLineNoise(float pt) {
    float ptInt = floor(pt);
    float ptFract = pt - ptInt;
    float weight = smoothCurve(ptFract);
    return mix(
      pickGradient(computeHash1(ptInt), ptFract),
      pickGradient(computeHash1(ptInt + 1.0), ptFract - 1.0),
      weight
    ) * 2.0;
  }

  float fractalVolumePattern(vec3 spacePt) {
    float accum = 0.0;
    float weightSum = 0.0;
    float currentWeight = 1.0;
    float currentFrequency = 1.0;
    for (int stepId = 0; stepId < 3; stepId++) {
      float noiseValue = evaluateVolumeNoise(spacePt * currentFrequency);
      accum += (1.0 - noiseValue) * currentWeight;
      weightSum += currentWeight;
      currentWeight *= 0.5;
      currentFrequency *= 2.0;
    }
    return clamp(accum / weightSum, 0.0, 1.0);
  }

  float calculateRadiance(float currentDistance, float glowRadius, float powerValue) {
    return pow(glowRadius / max(currentDistance, 1e-7), powerValue);
  }

  vec2 computeBoxIntersection(vec3 rayOrigin, vec3 rayDirection, vec3 boxLow, vec3 boxHigh) {
    vec3 lowerDistance = (boxLow - rayOrigin) / rayDirection;
    vec3 upperDistance = (boxHigh - rayOrigin) / rayDirection;
    vec3 minimumDistance = min(lowerDistance, upperDistance);
    vec3 maximumDistance = max(lowerDistance, upperDistance);
    return vec2(
      max(max(minimumDistance.x, minimumDistance.y), minimumDistance.z),
      min(min(maximumDistance.x, maximumDistance.y), maximumDistance.z)
    );
  }

  bool isWithinBounds(vec3 point) {
    float epsilon = 1e-4;
    return all(greaterThan(point, BOUND_LOW - epsilon))
      && all(lessThan(point, BOUND_HIGH + epsilon));
  }

  bool checkVolumeHit(
    vec3 rayOrigin,
    vec3 rayDirection,
    out float entryDistance,
    out float travelDistance
  ) {
    vec2 hit = computeBoxIntersection(rayOrigin, rayDirection, BOUND_LOW, BOUND_HIGH);
    if (isWithinBounds(rayOrigin)) {
      hit.x = 1e-4;
    }
    entryDistance = hit.x;
    travelDistance = hit.y - hit.x;
    return hit.x > 0.0 && hit.x < hit.y;
  }

  vec3 blendAuroraTints(float heightRatio) {
    return mix(uColorBase, uColorHigh, heightRatio);
  }

  vec3 warpSpatialCoords(vec3 rawPosition, float timeFlow) {
    float normalizedHeight = (rawPosition.y - Y_OFFSET_BOTTOM) / VOLUME_DEPTH;
    vec3 warpedPosition = 0.04 * vec3(
      rawPosition.x,
      2.0 * timeFlow,
      0.225 * rawPosition.z + timeFlow * 0.5
    );
    warpedPosition.xz += vec2(uSeed * 17.3, uSeed * 29.1);
    warpedPosition.x += 0.3 * normalizedHeight + 5.5 * cos(0.005 * rawPosition.z);
    warpedPosition.x += 0.02 * calculateLineNoise(0.1 * rawPosition.z + timeFlow * 2.0);
    return warpedPosition;
  }

  float sampleCurtainThickness(vec3 localPoint) {
    float timeFlow = iTime * uSpeed;
    vec3 shiftedPoint = warpSpatialCoords(localPoint, timeFlow);
    float basePattern = fractalVolumePattern(shiftedPoint);

    vec3 shapePoint = vec3(basePattern, localPoint.y - BOUND_LOW.y, basePattern);
    vec3 squishedPoint = shapePoint * vec3(1.0, 0.006, 1.0);
    squishedPoint.y += 0.48;
    squishedPoint.y += 0.015 * calculateLineNoise(1.0 * timeFlow + shiftedPoint.z);
    squishedPoint.y += 0.015 * calculateLineNoise(-2.0 * timeFlow + shiftedPoint.z);

    float thickness = calculateRadiance(length(squishedPoint), 0.55, 12.0);
    thickness *= cos(0.13 * shiftedPoint.x);
    return max(0.0, thickness);
  }

  vec3 renderAuroraLights(vec3 cameraOrigin, vec3 cameraDirection, float noiseShift) {
    float startTrace;
    float traceLength;
    if (!checkVolumeHit(cameraOrigin, cameraDirection, startTrace, traceLength)) {
      return vec3(0.0);
    }

    float stepLength = traceLength / RAY_ITERATIONS;
    float traceDistance = startTrace + stepLength * noiseShift * 0.25;
    vec3 lightAccumulation = vec3(0.0);

    for (float stepIndex = 0.0; stepIndex < RAY_ITERATIONS; stepIndex++) {
      vec3 point = cameraOrigin + cameraDirection * traceDistance;
      float localDensity = sampleCurtainThickness(point);

      lightAccumulation += localDensity
        * blendAuroraTints((point.y - BOUND_LOW.y) / VOLUME_DEPTH)
        * stepLength;

      traceDistance += stepLength;
    }
    return LUMINANCE_FACTOR * lightAccumulation;
  }

  vec3 auroraEmission(vec3 direction, float jitter) {
    return renderAuroraLights(
      vec3(0.0, 10.0, 0.0) + direction * 10.0,
      direction,
      jitter
    ) * uAuroraGain;
  }
`;

const AURORA_SCREEN_FRAGMENT_SHADER = AURORA_VOLUME_GLSL + /* glsl */ `
  void main() {
    vec2 fragmentCoordinate = gl_FragCoord.xy;
    vec2 screenPosition = fragmentCoordinate - iResolution.xy * 0.5;
    float focalLength = (0.5 * iResolution.y) / tan(radians(uFov) * 0.5);
    vec3 sightVector = normalize(uCamBasis * vec3(screenPosition, -focalLength));
    float ditherShift = generateRandomFloat(
      fragmentCoordinate + vec2(iTime * 13.0, iTime * 27.0)
    );
    gl_FragColor = vec4(auroraEmission(sightVector, ditherShift), 1.0);
  }
`;

const AURORA_PROBE_FRAGMENT_SHADER = AURORA_VOLUME_GLSL + /* glsl */ `
  void main() {
    vec3 accumulation = vec3(0.0);
    for (int sampleIndex = 0; sampleIndex < 4; sampleIndex++) {
      vec2 offset = vec2(
        sampleIndex == 1 || sampleIndex == 3 ? 0.5 : 0.0,
        sampleIndex >= 2 ? 0.5 : 0.0
      ) - 0.25;
      vec2 probeUv = (gl_FragCoord.xy + offset) / vec2(32.0, 16.0);
      float azimuth = probeUv.x * 6.2831853;
      float elevation = max(probeUv.y, 0.0) * 1.5407;
      vec3 direction = vec3(
        cos(elevation) * cos(azimuth),
        sin(elevation),
        cos(elevation) * sin(azimuth)
      );
      accumulation += auroraEmission(
        direction,
        generateRandomFloat(gl_FragCoord.xy + float(sampleIndex) * 3.7)
      );
    }
    gl_FragColor = vec4(accumulation * 0.25, 1.0);
  }
`;

function createUniforms(preset) {
  return {
    iResolution: { value: new THREE.Vector2(2, 2) },
    iTime: { value: 0 },
    uSpeed: { value: preset.speed },
    uSeed: { value: preset.noiseSeed },
    uAuroraGain: { value: preset.intensity },
    uColorBase: { value: new THREE.Color(preset.colorBase) },
    uColorHigh: { value: new THREE.Color(preset.colorHigh) },
    uCamBasis: { value: new THREE.Matrix3() },
    uFov: { value: 60 },
  };
}

export function createAuroraCurtains(options = {}) {
  const preset = { ...AURORA_CURTAIN_PRESET, ...options };
  const uniforms = createUniforms(preset);

  const materialOptions = {
    vertexShader: QUAD_VERTEX_SHADER,
    uniforms,
    defines: { AURORA_STEPS: Math.round(preset.raySteps) },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
  };

  const screenMaterial = new THREE.ShaderMaterial({
    ...materialOptions,
    fragmentShader: AURORA_SCREEN_FRAGMENT_SHADER,
  });
  const probeMaterial = new THREE.ShaderMaterial({
    ...materialOptions,
    fragmentShader: AURORA_PROBE_FRAGMENT_SHADER,
    defines: { AURORA_STEPS: Math.round(preset.probeRaySteps) },
  });

  return {
    uniforms,
    screenMaterial,
    probeMaterial,
    setSize(width, height) {
      uniforms.iResolution.value.set(width, height);
    },
    update(elapsed, camera) {
      uniforms.iTime.value = elapsed;
      camera.updateMatrixWorld(true);
      uniforms.uCamBasis.value.setFromMatrix4(camera.matrixWorld);
      uniforms.uFov.value = camera.fov;
    },
    dispose() {
      screenMaterial.dispose();
      probeMaterial.dispose();
    },
  };
}

export {
  AURORA_PROBE_FRAGMENT_SHADER,
  AURORA_SCREEN_FRAGMENT_SHADER,
  QUAD_VERTEX_SHADER,
};
