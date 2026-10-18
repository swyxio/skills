import * as THREE from "three/webgpu";
import {
  Fn,
  abs,
  asin,
  atan,
  clamp,
  dot,
  exp,
  float,
  fract,
  length,
  max,
  min,
  mix,
  normalize,
  screenUV,
  sin,
  smoothstep,
  texture,
  time,
  uniform,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import { bloom } from "three/addons/tsl/display/BloomNode.js";

export const FILMIC_LENS_FLARE_PRESET = Object.freeze({
  initialFovDeg: 58,
  minimumFovDeg: 26,
  maximumFovDeg: 105,
  initialSourceScreen: Object.freeze([0.785, 0.625]),
  exposure: 0.92,
});

export function detectHdrSun(panoramaTexture) {
  const image = panoramaTexture.image;
  const data = image?.data;
  const width = image?.width || 1;
  const height = image?.height || 1;
  if (!data || !data.length) {
    return { u: 0.60, vTop: 0.48, maxLum: 1 };
  }

  const stride = data.length / (width * height);
  let maxLum = -Infinity;
  let maxIndex = 0;

  for (let index = 0, offset = 0; index < width * height; index += 1, offset += stride) {
    const r = data[offset] ?? 0;
    const g = data[offset + 1] ?? r;
    const b = data[offset + 2] ?? r;
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (Number.isFinite(luminance) && luminance > maxLum) {
      maxLum = luminance;
      maxIndex = index;
    }
  }

  const maximumX = maxIndex % width;
  const maximumY = Math.floor(maxIndex / width);
  const radius = Math.max(5, Math.floor(Math.min(width, height) * 0.018));
  const cutoff = maxLum * 0.22;
  let weightedX = 0;
  let weightedY = 0;
  let totalWeight = 0;

  for (
    let y = Math.max(0, maximumY - radius);
    y <= Math.min(height - 1, maximumY + radius);
    y += 1
  ) {
    for (
      let x = Math.max(0, maximumX - radius);
      x <= Math.min(width - 1, maximumX + radius);
      x += 1
    ) {
      const offset = (y * width + x) * stride;
      const r = data[offset] ?? 0;
      const g = data[offset + 1] ?? r;
      const b = data[offset + 2] ?? r;
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (!Number.isFinite(luminance) || luminance < cutoff) continue;
      const weight = Math.max(0, luminance - cutoff);
      weightedX += (x + 0.5) * weight;
      weightedY += (y + 0.5) * weight;
      totalWeight += weight;
    }
  }

  const centerX = totalWeight > 0
    ? weightedX / totalWeight
    : maximumX + 0.5;
  const centerYBottom = totalWeight > 0
    ? weightedY / totalWeight
    : maximumY + 0.5;

  return {
    u: centerX / width,
    vTop: 1 - centerYBottom / height,
    maxLum,
  };
}

export function equirectTopUvToDirection(
  u,
  vTop,
  out = new THREE.Vector3(),
) {
  const longitude = (u - 0.5) * Math.PI * 2;
  const latitude = (0.5 - vTop) * Math.PI;
  const latitudeCosine = Math.cos(latitude);
  return out.set(
    Math.sin(longitude) * latitudeCosine,
    Math.sin(latitude),
    -Math.cos(longitude) * latitudeCosine,
  ).normalize();
}

function wrapPi(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function makeBasis(yaw, pitch, forward, right, up) {
  const pitchCosine = Math.cos(pitch);
  forward.set(
    Math.sin(yaw) * pitchCosine,
    Math.sin(pitch),
    -Math.cos(yaw) * pitchCosine,
  ).normalize();
  right.set(Math.cos(yaw), 0, Math.sin(yaw)).normalize();
  up.crossVectors(right, forward).normalize();
}

export function solvePanoramaView({
  sunDirection,
  sourceScreen = FILMIC_LENS_FLARE_PRESET.initialSourceScreen,
  fovDeg = FILMIC_LENS_FLARE_PRESET.initialFovDeg,
  aspect = 1,
}) {
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();

  function project(yaw, pitch) {
    makeBasis(yaw, pitch, forward, right, up);
    const depth = sunDirection.dot(forward);
    const tangent = Math.tan(THREE.MathUtils.degToRad(fovDeg) * 0.5);
    if (depth <= 1e-6) return { x: 0.5, y: 0.5, depth };
    return {
      x: 0.5 + sunDirection.dot(right) / (depth * tangent * aspect) * 0.5,
      y: 0.5 - sunDirection.dot(up) / (depth * tangent) * 0.5,
      depth,
    };
  }

  let yaw = Math.atan2(sunDirection.x, -sunDirection.z);
  let pitch = Math.asin(THREE.MathUtils.clamp(sunDirection.y, -1, 1));
  const epsilon = 1e-4;

  for (let iteration = 0; iteration < 14; iteration += 1) {
    const projected = project(yaw, pitch);
    const errorX = projected.x - sourceScreen[0];
    const errorY = projected.y - sourceScreen[1];
    if (Math.hypot(errorX, errorY) < 1e-7) break;

    const yawStep = project(yaw + epsilon, pitch);
    const pitchStep = project(yaw, pitch + epsilon);
    const j00 = (yawStep.x - projected.x) / epsilon;
    const j10 = (yawStep.y - projected.y) / epsilon;
    const j01 = (pitchStep.x - projected.x) / epsilon;
    const j11 = (pitchStep.y - projected.y) / epsilon;
    const determinant = j00 * j11 - j01 * j10;
    if (Math.abs(determinant) < 1e-8) break;

    yaw -= (errorX * j11 - errorY * j01) / determinant;
    pitch -= (j00 * errorY - j10 * errorX) / determinant;
    pitch = THREE.MathUtils.clamp(
      pitch,
      -Math.PI * 0.495,
      Math.PI * 0.495,
    );
  }

  makeBasis(wrapPi(yaw), pitch, forward, right, up);
  return {
    yaw: wrapPi(yaw),
    pitch,
    forward: forward.clone(),
    right: right.clone(),
    up: up.clone(),
  };
}

export function createFilmicLensFlare({
  panoramaTexture,
  sunUv,
  aspect = 1,
  fovDeg = FILMIC_LENS_FLARE_PRESET.initialFovDeg,
  strength = 1,
}) {
  if (!panoramaTexture) {
    throw new Error("createFilmicLensFlare requires panoramaTexture.");
  }
  if (!sunUv || !Number.isFinite(sunUv.u) || !Number.isFinite(sunUv.vTop)) {
    throw new Error("createFilmicLensFlare requires a finite top-origin sunUv.");
  }

  const uAspect = uniform(aspect);
  const uTanHalfFov = uniform(
    Math.tan(THREE.MathUtils.degToRad(fovDeg) * 0.5),
  );
  const uForward = uniform(new THREE.Vector3(0, 0, -1));
  const uRight = uniform(new THREE.Vector3(1, 0, 0));
  const uUp = uniform(new THREE.Vector3(0, 1, 0));
  const uSource = uniform(
    new THREE.Vector2(...FILMIC_LENS_FLARE_PRESET.initialSourceScreen),
  );
  const uSourceVisibility = uniform(1);
  const uFieldCos = uniform(1);
  const uFieldSin = uniform(0);
  const uFieldDir = uniform(new THREE.Vector2(1, 0));
  const uStrength = uniform(strength);
  const uEffectMix = uniform(1);
  const sunDirection = equirectTopUvToDirection(sunUv.u, sunUv.vTop);
  const scratchForward = new THREE.Vector3();
  const scratchRight = new THREE.Vector3();
  const scratchUp = new THREE.Vector3();

  function updateView({
    forward,
    right,
    up,
    aspect: nextAspect,
    fovDeg: nextFovDeg,
  }) {
    uAspect.value = nextAspect;
    uTanHalfFov.value = Math.tan(
      THREE.MathUtils.degToRad(nextFovDeg) * 0.5,
    );
    uForward.value.copy(forward);
    uRight.value.copy(right);
    uUp.value.copy(up);

    scratchForward.copy(forward).normalize();
    scratchRight.copy(right).normalize();
    scratchUp.copy(up).normalize();
    const depth = sunDirection.dot(scratchForward);
    const tangent = uTanHalfFov.value;
    let sourceX = 0.5;
    let sourceY = 0.5;
    if (depth > 1e-6) {
      sourceX = 0.5 + sunDirection.dot(scratchRight)
        / (depth * tangent * nextAspect) * 0.5;
      sourceY = 0.5 - sunDirection.dot(scratchUp)
        / (depth * tangent) * 0.5;
    }

    if (
      depth <= 0.015 ||
      !Number.isFinite(sourceX) ||
      !Number.isFinite(sourceY)
    ) {
      uSourceVisibility.value = 0;
      uFieldCos.value = 1;
      uFieldSin.value = 0;
      return;
    }

    const fieldCosine = THREE.MathUtils.clamp(depth, 0, 1);
    uFieldCos.value = fieldCosine;
    uFieldSin.value = Math.sqrt(Math.max(0, 1 - fieldCosine * fieldCosine));

    const fieldX = (sourceX - 0.5) * nextAspect;
    const fieldY = sourceY - 0.5;
    const fieldLength = Math.hypot(fieldX, fieldY);
    if (fieldLength > 1e-7) {
      uFieldDir.value.set(fieldX / fieldLength, fieldY / fieldLength);
    }

    uSource.value.set(
      THREE.MathUtils.clamp(sourceX, -2, 3),
      THREE.MathUtils.clamp(sourceY, -2, 3),
    );
    const outside = Math.max(
      0,
      -sourceX,
      sourceX - 1,
      -sourceY,
      sourceY - 1,
    );
    const edgeFade = THREE.MathUtils.clamp(1 - outside / 0.36, 0, 1);
    const facingFade = THREE.MathUtils.smoothstep(depth, 0.015, 0.12);
    uSourceVisibility.value = edgeFade * facingFade;
  }

  const samplePlate = Fn(([suv]) => {
    const ndcX = suv.x.mul(2.0).sub(1.0);
    const ndcY = float(1.0).sub(suv.y.mul(2.0));

    const ray = normalize(
      uForward
        .add(uRight.mul(ndcX.mul(uAspect).mul(uTanHalfFov)))
        .add(uUp.mul(ndcY.mul(uTanHalfFov)))
    );

    const lon = atan(ray.x, ray.z.negate());
    const lat = asin(clamp(ray.y, -1.0, 1.0));

    const panoU = fract(lon.mul(1.0 / (Math.PI * 2)).add(0.5));
    const panoVTop = float(0.5).sub(lat.mul(1.0 / Math.PI));

    const panoVTexture = float(1.0).sub(panoVTop);
    return texture(panoramaTexture, vec2(panoU, clamp(panoVTexture, 0.0005, 0.9995))).rgb;
  });

  const gaussian = Fn(([x, falloff]) => exp(x.mul(x).mul(falloff).negate()));

  const ellipse = Fn(([suv, center, rx, ry]) => {
    const dx = suv.x.sub(center.x).mul(uAspect).div(rx);
    const dy = suv.y.sub(center.y).div(ry);
    return exp(dx.mul(dx).add(dy.mul(dy)).negate());
  });

  const ellipticalRing = Fn(([suv, center, rx, ry, width]) => {
    const dx = suv.x.sub(center.x).mul(uAspect).div(rx);
    const dy = suv.y.sub(center.y).div(ry);
    const q = length(vec2(dx, dy));
    const e = q.sub(1.0).div(width);
    return exp(e.mul(e).negate());
  });

  const ghostPos = Fn(([t]) => mix(uSource, vec2(0.5, 0.5), t));

  const opticalAxis = Fn(() => {
    const raw = vec2(
      float(0.5).sub(uSource.x).mul(uAspect),
      float(0.5).sub(uSource.y)
    );
    const len = max(length(raw), float(1e-5));
    return raw.div(len);
  });

  const orientedEllipticalRing = Fn(([suv, ringCenter, radialDir, radialRadius, tangentRadius, width]) => {
    const tangent = vec2(radialDir.y.negate(), radialDir.x);
    const rel = vec2(
      suv.x.sub(ringCenter.x).mul(uAspect),
      suv.y.sub(ringCenter.y)
    );
    const qr = dot(rel, radialDir).div(radialRadius);
    const qt = dot(rel, tangent).div(tangentRadius);
    const q = length(vec2(qr, qt));
    const e = q.sub(1.0).div(width);
    return exp(e.mul(e).negate());
  });

  const orientedEllipse = Fn(([suv, ellipseCenter, radialDir, radialRadius, tangentRadius]) => {
    const tangent = vec2(radialDir.y.negate(), radialDir.x);
    const rel = vec2(
      suv.x.sub(ellipseCenter.x).mul(uAspect),
      suv.y.sub(ellipseCenter.y)
    );
    const qr = dot(rel, radialDir).div(radialRadius);
    const qt = dot(rel, tangent).div(tangentRadius);
    return exp(qr.mul(qr).add(qt.mul(qt)).negate());
  });

  const fieldPupilEllipse = Fn(([suv, ghostCenter, radialDir, baseRadius]) => {
    const projectedRadial = baseRadius.mul(max(uFieldCos, float(0.34)));
    return orientedEllipse(suv, ghostCenter, radialDir, projectedRadial, baseRadius);
  });

  const fieldPupilRing = Fn(([suv, ghostCenter, radialDir, baseRadius, width]) => {
    const projectedRadial = baseRadius.mul(max(uFieldCos, float(0.34)));
    return orientedEllipticalRing(
      suv, ghostCenter, radialDir, projectedRadial, baseRadius, width
    );
  });

  const axisEllipse = Fn(([suv, center, longRadius, shortRadius]) => {
    const axis = opticalAxis();
    const rel = vec2(
      suv.x.sub(center.x).mul(uAspect),
      suv.y.sub(center.y)
    );
    const alongRaw = dot(rel, axis);
    const along = alongRaw.div(longRadius);
    const perpVec = rel.sub(axis.mul(alongRaw));
    const across = length(perpVec).div(shortRadius);
    return exp(along.mul(along).add(across.mul(across)).negate());
  });

  const hotAt = Fn(([suv]) => {
    const c = samplePlate(suv);
    const l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    const gate = smoothstep(float(4.0), float(18.0), l);
    return gate.mul(clamp(l.div(14.0), 0.0, 4.0).add(0.18));
  });

  function radialWarpUV(suv, k) {
    return vec2(
      float(0.5).add(suv.x.sub(0.5).div(k)),
      float(0.5).add(suv.y.sub(0.5).div(k))
    );
  }

  function radialGhostRGB(suv, k, dispersion) {
    const hr = hotAt(radialWarpUV(suv, k - dispersion));
    const hg = hotAt(radialWarpUV(suv, k));
    const hb = hotAt(radialWarpUV(suv, k + dispersion));
    return vec3(hr, hg, hb);
  }

  const flareLayer = Fn(([suv]) => {
    const src = uSource;
    const center = vec2(0.5, 0.5);
    const p = vec2(suv.x.sub(src.x).mul(uAspect), suv.y.sub(src.y));
    const d = length(p);

    const radialDir = uFieldDir;

    const core = gaussian(d, float(820.0)).mul(9.4);
    const nearGlow = gaussian(d, float(92.0)).mul(2.20);
    const midGlow = gaussian(d, float(22.0)).mul(0.96);
    const wideGlow = gaussian(d, float(5.8)).mul(0.36);

    const inwardVeil = axisEllipse(
      suv,
      mix(src, center, 0.34),
      float(0.72),
      float(0.27)
    ).mul(0.52);

    const sourceWash = ellipse(
      suv,
      mix(src, center, 0.19),
      float(0.62),
      float(0.44)
    ).mul(0.32);

    const amberFog = ellipse(
      suv,
      mix(src, center, 0.42).add(vec2(-0.035, 0.010)),
      float(0.68),
      float(0.31)
    ).mul(0.19);

    const redVeil = ellipse(
      suv,
      mix(src, center, 0.47).add(vec2(-0.060, -0.010)),
      float(0.54),
      float(0.24)
    ).mul(0.115);

    let flare = vec3(1.00, 0.90, 0.72).mul(core)
      .add(vec3(1.00, 0.42, 0.075).mul(nearGlow))
      .add(vec3(1.00, 0.24, 0.030).mul(midGlow))
      .add(vec3(1.00, 0.13, 0.015).mul(wideGlow))
      .add(vec3(1.00, 0.28, 0.045).mul(inwardVeil))
      .add(vec3(1.00, 0.22, 0.030).mul(sourceWash))
      .add(vec3(0.92, 0.20, 0.025).mul(amberFog))
      .add(vec3(0.62, 0.045, 0.025).mul(redVeil));

    flare = flare
      .add(radialGhostRGB(suv, -1.05, 0.010).mul(vec3(0.090, 0.078, 0.082)))
      .add(radialGhostRGB(suv, -0.73, 0.007).mul(vec3(0.075, 0.068, 0.074)))
      .add(radialGhostRGB(suv, -0.50, 0.0045).mul(vec3(0.055, 0.052, 0.060)))
      .add(radialGhostRGB(suv, -0.31, 0.0030).mul(vec3(0.038, 0.036, 0.043)));

    const gTerminalA = ghostPos(float(2.12));
    const gTerminalB = ghostPos(float(2.28));
    const gCool = ghostPos(float(1.84));
    const gWarm0 = ghostPos(float(1.62));
    const gWarm1 = ghostPos(float(1.48));
    const gBead0 = ghostPos(float(1.34));
    const gBead1 = ghostPos(float(1.23));
    const gBead2 = ghostPos(float(1.15));
    const gBead3 = ghostPos(float(1.08));
    const gBead4 = ghostPos(float(1.03));

    const terminalAOuter = fieldPupilEllipse(suv, gTerminalA, radialDir, float(0.086));
    const terminalAInner = fieldPupilEllipse(suv, gTerminalA, radialDir, float(0.052));
    const terminalAHalo  = fieldPupilEllipse(suv, gTerminalA, radialDir, float(0.132));
    const terminalBOuter = fieldPupilEllipse(suv, gTerminalB, radialDir, float(0.102));
    const terminalBInner = fieldPupilEllipse(suv, gTerminalB, radialDir, float(0.064));
    const terminalBHalo  = fieldPupilEllipse(suv, gTerminalB, radialDir, float(0.154));

    const coolCore = fieldPupilEllipse(suv, gCool, radialDir, float(0.047));
    const coolShell = fieldPupilRing(suv, gCool, radialDir, float(0.059), float(0.22));
    const coolLeak = fieldPupilEllipse(suv, gCool, radialDir, float(0.067));
    const coolHalo = fieldPupilEllipse(suv, gCool, radialDir, float(0.104));

    const warm0Outer = fieldPupilEllipse(suv, gWarm0, radialDir, float(0.058));
    const warm0Inner = fieldPupilEllipse(suv, gWarm0, radialDir, float(0.037));
    const warm0Halo = fieldPupilEllipse(suv, gWarm0, radialDir, float(0.094));
    const warm1 = fieldPupilEllipse(suv, gWarm1, radialDir, float(0.027));
    const warm1Halo = fieldPupilEllipse(suv, gWarm1, radialDir, float(0.052));

    const bead0 = fieldPupilEllipse(suv, gBead0, radialDir, float(0.0078));
    const bead1 = fieldPupilEllipse(suv, gBead1, radialDir, float(0.0062));
    const bead2 = fieldPupilEllipse(suv, gBead2, radialDir, float(0.0049));
    const bead3 = fieldPupilEllipse(suv, gBead3, radialDir, float(0.0036));
    const bead4 = fieldPupilEllipse(suv, gBead4, radialDir, float(0.0026));

    const residualHaze = axisEllipse(
      suv,
      ghostPos(float(2.34)),
      float(0.24),
      float(0.026)
    ).mul(0.62).add(axisEllipse(
      suv,
      ghostPos(float(2.18)),
      float(0.16),
      float(0.035)
    ).mul(0.38));

    flare = flare
      .add(vec3(1.00, 0.18, 0.030).mul(terminalAOuter).mul(0.27))
      .add(vec3(1.00, 0.46, 0.17).mul(terminalAInner).mul(0.62))
      .add(vec3(1.00, 0.31, 0.10).mul(terminalAHalo).mul(0.075))
      .add(vec3(1.00, 0.28, 0.085).mul(terminalBOuter).mul(0.074))
      .add(vec3(1.00, 0.54, 0.23).mul(terminalBInner).mul(0.032))
      .add(vec3(1.00, 0.34, 0.12).mul(terminalBHalo).mul(0.024))

      .add(vec3(0.53, 0.67, 1.00).mul(coolCore).mul(0.52))
      .add(vec3(0.21, 0.54, 0.92).mul(coolShell).mul(0.21))
      .add(vec3(1.00, 0.54, 0.22).mul(coolLeak).mul(0.066))
      .add(vec3(0.28, 0.48, 0.92).mul(coolHalo).mul(0.052))

      .add(vec3(1.00, 0.35, 0.14).mul(warm0Outer).mul(0.31))
      .add(vec3(1.00, 0.67, 0.40).mul(warm0Inner).mul(0.43))
      .add(vec3(1.00, 0.42, 0.16).mul(warm0Halo).mul(0.070))
      .add(vec3(1.00, 0.84, 0.56).mul(warm1).mul(0.35))
      .add(vec3(1.00, 0.58, 0.30).mul(warm1Halo).mul(0.045))

      .add(vec3(1.00, 0.74, 0.42).mul(bead0).mul(0.27))
      .add(vec3(1.00, 0.52, 0.18).mul(bead1).mul(0.21))
      .add(vec3(1.00, 0.82, 0.60).mul(bead2).mul(0.15))
      .add(vec3(0.98, 0.84, 0.74).mul(bead3).mul(0.095))
      .add(vec3(1.00, 0.58, 0.28).mul(bead4).mul(0.052))

      .add(vec3(1.00, 0.48, 0.16).mul(residualHaze).mul(0.036));

    const ringC = ghostPos(float(1.62));
    const spectralSpread = uFieldSin.mul(0.0075);
    const redRadius = float(0.056).add(spectralSpread);
    const greenRadius = float(0.056);
    const blueRadius = max(float(0.043), float(0.056).sub(spectralSpread));

    const redRing = fieldPupilRing(suv, ringC, radialDir, redRadius, float(0.180));
    const greenRing = fieldPupilRing(suv, ringC, radialDir, greenRadius, float(0.168));
    const blueRing = fieldPupilRing(suv, ringC, radialDir, blueRadius, float(0.185));
    const ringCore = fieldPupilEllipse(suv, ringC, radialDir, float(0.033));

    const ringOutside = max(
      max(float(0.0).sub(ringC.x), ringC.x.sub(1.0)),
      max(float(0.0).sub(ringC.y), ringC.y.sub(1.0))
    );
    const ringFrameGate = float(1.0).sub(smoothstep(float(0.02), float(0.18), ringOutside));
    const ringGate = uSourceVisibility.mul(ringFrameGate);

    flare = flare
      .add(vec3(1.00, 0.10, 0.015).mul(redRing).mul(0.080).mul(ringGate))
      .add(vec3(0.20, 0.52, 0.075).mul(greenRing).mul(0.044).mul(ringGate))
      .add(vec3(0.15, 0.22, 0.92).mul(blueRing).mul(0.052).mul(ringGate))
      .add(vec3(0.22, 0.08, 0.30).mul(ringCore).mul(0.018).mul(ringGate));

    const sourceFrameMargin = min(min(src.x, src.y), min(float(1.0).sub(src.x), float(1.0).sub(src.y)));
    const starEdgeGate = smoothstep(float(0.01), float(0.07), sourceFrameMargin).mul(0.80).add(0.20);

    const hRay = gaussian(abs(p.y), float(56000.0)).mul(gaussian(abs(p.x), float(11.5)));
    const vRay = gaussian(abs(p.x), float(78000.0)).mul(gaussian(abs(p.y), float(18.0)));

    const d1Along = p.x.mul(0.70710678).add(p.y.mul(0.70710678));
    const d1Perp  = p.y.mul(0.70710678).sub(p.x.mul(0.70710678));
    const d2Along = p.x.mul(0.70710678).sub(p.y.mul(0.70710678));
    const d2Perp  = p.y.mul(0.70710678).add(p.x.mul(0.70710678));
    const d1Ray = gaussian(abs(d1Perp), float(42000.0)).mul(gaussian(abs(d1Along), float(14.0)));
    const d2Ray = gaussian(abs(d2Perp), float(42000.0)).mul(gaussian(abs(d2Along), float(14.0)));

    const s1Along = p.x.mul(0.93969262).add(p.y.mul(0.34202014));
    const s1Perp  = p.y.mul(0.93969262).sub(p.x.mul(0.34202014));
    const s2Along = p.x.mul(0.93969262).sub(p.y.mul(0.34202014));
    const s2Perp  = p.y.mul(0.93969262).add(p.x.mul(0.34202014));
    const s1Ray = gaussian(abs(s1Perp), float(36000.0)).mul(gaussian(abs(s1Along), float(22.0)));
    const s2Ray = gaussian(abs(s2Perp), float(36000.0)).mul(gaussian(abs(s2Along), float(22.0)));

    const whiteStar = vec3(1.00, 0.97, 0.92).mul(
        hRay.mul(0.28)
        .add(vRay.mul(0.22))
        .add(d1Ray.mul(0.18))
        .add(d2Ray.mul(0.18))
        .add(s1Ray.mul(0.07))
        .add(s2Ray.mul(0.07))
      );
    const warmStar = vec3(1.00, 0.78, 0.50).mul(d1Ray.add(d2Ray).mul(0.11).add(vRay.mul(0.05)));
    const fringeStar = vec3(1.00, 0.56, 0.82).mul(hRay.mul(0.09)).add(vec3(0.52, 0.86, 0.72).mul(vRay.mul(0.03)));
    const sourceStar = whiteStar.add(warmStar).add(fringeStar);
    flare = flare.add(sourceStar.mul(0.34).mul(starEdgeGate));

    return flare.mul(uStrength).mul(uSourceVisibility).mul(uEffectMix);
  });

  const uv = screenUV;

  const fromCenter = uv.sub(0.5);
  const edge = clamp(dot(fromCenter, fromCenter).mul(1.55), 0.0, 1.0);
  const ca = fromCenter.mul(edge).mul(0.00042);

  const plateR = samplePlate(uv.add(ca)).r;
  const plateG = samplePlate(uv).g;
  const plateB = samplePlate(uv.sub(ca)).b;
  let plate = max(vec3(plateR, plateG, plateB), vec3(0.0));
  plate = plate.mul(0.79);

  const rawLuma = dot(plate, vec3(0.2126, 0.7152, 0.0722));
  const neutral = vec3(rawLuma);
  plate = mix(neutral, plate, 0.92);
  plate = plate.mul(vec3(1.070, 0.985, 0.900));

  const srcDelta = vec2(uv.x.sub(uSource.x).mul(uAspect), uv.y.sub(uSource.y));
  const srcDist = length(srcDelta);
  const sourceWindow = gaussian(srcDist, float(11.0)).mul(uSourceVisibility);

  const hotMask = smoothstep(float(2.9), float(10.5), rawLuma).mul(sourceWindow);
  const sourceSeedRGB = clamp(plate, 0.0, 28.0).mul(hotMask);
  const sourceBloom = bloom(vec4(sourceSeedRGB, 1.0), 0.62, 0.80, 0.0105);

  const haloMask = smoothstep(float(1.8), float(6.1), rawLuma).mul(sourceWindow);
  const haloSeedRGB = clamp(plate, 0.0, 18.0)
    .mul(haloMask)
    .mul(vec3(1.0, 0.30, 0.055));
  const haloBloom = bloom(vec4(haloSeedRGB, 1.0), 0.74, 0.96, 0.0080);

  const flare = flareLayer(uv);
  const flareBloom = bloom(vec4(flare, 1.0), 0.84, 0.90, 0.030);

  let comp = plate
    .add(sourceBloom.rgb.mul(0.92).mul(uEffectMix))
    .add(haloBloom.rgb.mul(vec3(1.0, 0.40, 0.13)).mul(1.30).mul(uEffectMix))
    .add(flare)
    .add(flareBloom.rgb.mul(0.56).mul(uEffectMix));

  const veilMaskA = axisEllipse(uv, mix(uSource, vec2(0.5, 0.5), 0.33), float(0.84), float(0.33));
  const veilMaskB = ellipse(uv, mix(uSource, vec2(0.5, 0.5), 0.28), float(0.70), float(0.52));
  const veilMask = clamp(veilMaskA.mul(0.88).add(veilMaskB.mul(0.58)), 0.0, 1.0)
    .mul(uSourceVisibility)
    .mul(uEffectMix);
  const compLumaBeforeVeil = dot(comp, vec3(0.2126, 0.7152, 0.0722));
  const warmNeutral = mix(vec3(compLumaBeforeVeil), vec3(1.24, 0.60, 0.30), 0.28);
  comp = mix(comp, comp.mul(0.60).add(warmNeutral.mul(0.62)), veilMask.mul(0.64));

  const milkMaskA = ellipse(uv, mix(uSource, vec2(0.5, 0.5), 0.40), float(0.96), float(0.60));
  const milkMaskB = axisEllipse(uv, mix(uSource, vec2(0.5, 0.5), 0.46), float(1.10), float(0.35));
  const milkMask = clamp(milkMaskA.mul(0.46).add(milkMaskB.mul(0.36)), 0.0, 1.0)
    .mul(uSourceVisibility)
    .mul(uEffectMix);
  const milkLuma = dot(comp, vec3(0.2126, 0.7152, 0.0722));
  const creamyLift = mix(vec3(milkLuma), vec3(1.34, 0.82, 0.42), 0.20);
  comp = mix(comp, comp.mul(0.82).add(creamyLift.mul(0.32)), milkMask.mul(0.24));

  const filmLuma = dot(comp, vec3(0.2126, 0.7152, 0.0722));
  const filmWarmMask = smoothstep(float(0.18), float(1.8), filmLuma);
  const shadowMask = float(1.0).sub(smoothstep(float(0.08), float(0.58), filmLuma));
  const shoulderMask = smoothstep(float(0.55), float(3.2), filmLuma);
  const filmTint = mix(vec3(0.972, 0.995, 1.032), vec3(1.105, 0.956, 0.836), filmWarmMask);
  comp = comp.mul(filmTint);
  comp = mix(comp, comp.mul(vec3(0.90, 0.94, 1.02)), shadowMask.mul(0.18));
  const shoulderLuma = dot(comp, vec3(0.2126, 0.7152, 0.0722));
  const creamyShoulder = mix(vec3(shoulderLuma), vec3(1.18, 0.86, 0.62), 0.18);
  comp = mix(comp, comp.mul(0.90).add(creamyShoulder.mul(0.16)), shoulderMask.mul(0.34));

  const densityMask = float(1.0).sub(smoothstep(float(1.0), float(4.0), filmLuma));
  comp = comp.mul(mix(float(1.0), float(0.72), densityMask));
  const highlightDesat = smoothstep(float(0.75), float(4.6), filmLuma).mul(0.15);
  comp = mix(comp, vec3(dot(comp, vec3(0.2126, 0.7152, 0.0722))), highlightDesat);

  const vx = fromCenter.x.mul(uAspect).mul(0.66);
  const vy = fromCenter.y;
  const vd = vx.mul(vx).add(vy.mul(vy));
  const vignette = float(1.0).sub(smoothstep(float(0.22), float(0.80), vd).mul(0.11));
  comp = comp.mul(vignette);

  const grainUV = uv.mul(vec2(1919.0, 1087.0)).add(vec2(time.mul(43.17), time.mul(17.71)));
  const noise = fract(sin(dot(grainUV, vec2(12.9898, 78.233))).mul(43758.5453)).sub(0.5);
  const compLuma = dot(comp, vec3(0.2126, 0.7152, 0.0722));
  const grainMask = float(1.0).sub(smoothstep(float(1.5), float(5.2), compLuma)).mul(0.0052);
  comp = max(comp.add(noise.mul(grainMask)), vec3(0.0));

  const outputNode = vec4(comp, 1);

  return {
    outputNode,
    nodes: {
      final: outputNode,
      plate: vec4(plate, 1),
      flare: vec4(flare, 1),
    },
    uniforms: {
      aspect: uAspect,
      tanHalfFov: uTanHalfFov,
      forward: uForward,
      right: uRight,
      up: uUp,
      source: uSource,
      sourceVisibility: uSourceVisibility,
      fieldCos: uFieldCos,
      fieldSin: uFieldSin,
      fieldDirection: uFieldDir,
      strength: uStrength,
      effectMix: uEffectMix,
    },
    sunDirection,
    updateView,
    setStrength(value) {
      uStrength.value = THREE.MathUtils.clamp(value, 0, 2);
    },
    setEnabled(enabled) {
      uEffectMix.value = enabled ? 1 : 0;
    },
  };
}
