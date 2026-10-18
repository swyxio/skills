# Volumetric aurora curtains

Use the `raymarched-aurora-curtains` example for a finite-footprint,
emissive slab with warped curtain density, uniform ray integration, gentle
start jitter, and matching perspective/equirectangular materials.

## Contents

- Representation and coordinate contract
- Curtain density field
- Ray interval and uniform step schedule
- Start jitter and radiance accumulation
- Screen and probe materials
- Configuration contract
- Observed limits and defects
- Failure diagnosis
- Diagnostics

## Representation and coordinate contract

Represent the aurora as emission inside a shallow horizontal slab:

```text
lower bound  (-250, 50, -500) world units
upper bound  ( 250, 125, 500) world units
depth        75 world units
observer     (0, 10, 0) world units
```

The finite XZ bounds are perceptual, not incidental. They prevent a
near-horizontal ray from accumulating kilometres of weak density into a flat
emissive band. The `500 × 1000` world-unit footprint retains the principal
curtain while letting the box sides terminate the unwanted limb path. Let the
finite volume own the lower silhouette; do not recover horizon coverage by
widening the box or masking an oversized volume by view angle.

Intersect every view ray with the slab box. When the ray begins inside the box,
replace its entry distance with `0.0001` world units. Reject intervals whose
entry is non-positive or not less than the exit.

## Curtain density field

Drive time with:

```text
timeFlow = elapsedSeconds * 0.65
```

For world point `p`, normalise height over the 75-unit slab and build the
warped coordinate exactly:

```text
h = (p.y - 50) / 75
q = 0.04 * (p.x, 2*timeFlow, 0.225*p.z + 0.5*timeFlow)
q.xz += (seed*17.3, seed*29.1)
q.x  += 0.3*h + 5.5*cos(0.005*p.z)
q.x  += 0.02*lineNoise(0.1*p.z + 2*timeFlow)
seed = 19.6
```

Evaluate three octaves of trilinearly interpolated value noise at frequencies
`1`, `2`, and `4`, with weights `1`, `0.5`, and `0.25`. Invert each octave
before the weighted average:

```text
base = weightedAverage(1 - valueNoise(q*frequency))
```

Convert that broad field into a vertically compressed radiance filament:

```text
shape = (base, p.y - 50, base) * (1, 0.006, 1)
shape.y += 0.48
shape.y += 0.015*lineNoise( timeFlow + q.z)
shape.y += 0.015*lineNoise(-2*timeFlow + q.z)
density = max(0, (0.55 / max(length(shape), 1e-7))^12 * cos(0.13*q.x))
```

The power-12 inverse-distance term forms narrow folds. The cosine breaks the
field into alternating emissive curtains; clamping after multiplication keeps
the negative lobes empty.

## Ray interval and uniform step schedule

Use `75` screen-ray steps and `40` equirectangular-probe steps. Divide a ray
interval of length `L` uniformly:

```text
stepLength = L / N
```

The finite footprint bounds the longest interval, so uniform spacing retains
enough samples across the whole slab. It is particularly important for the
power-12 density field: changing to a growing step schedule changes how often
thin folds are hit and therefore changes perceived density.

Do not introduce geometric growth merely to reach the horizon. That problem is
removed by the finite volume rather than solved by redistributing samples over
an oversized interval.

## Start jitter and radiance accumulation

Advance the first sample by at most one quarter of a uniform step:

```text
traceDistance = entryDistance + stepLength * jitter * 0.25
```

The screen material hashes `fragmentCoordinate + (time*13, time*27)` to one
jitter value per pixel and frame. The equirectangular material hashes its texel
plus `sampleIndex*3.7` and remains static in time.

Accumulate the step-length-weighted emission without distance extinction:

```text
radiance += density
          * mix(#59ff03, #00aaff, (sampleY - 50)/75)
          * stepLength
emission = radiance * 0.05 * intensity
```

The finite footprint prevents horizon-stuffing paths from existing, so neither
distance extinction nor a direction-based elevation gate is needed. Keeping
those suppressors after restoring the finite bounds makes legitimate lower
folds sparse and dim.

## Screen and probe materials

The screen material reconstructs the raster camera ray from the drawing-buffer
resolution, vertical FOV, and the camera's world basis:

```text
screen = fragmentCoordinate - 0.5*resolution
focal  = (0.5*resolution.y) / tan(0.5*radians(fov))
ray    = normalize(cameraBasis * (screen.x, screen.y, -focal))
```

Write linear HDR emission with additive blending, depth testing disabled, and
depth writes disabled. Composite backdrop, stars, grading, terrain, and weather
outside this material.

The second material writes a `32 × 16 texel` upper-hemisphere equirectangular
map. Supersample every texel at four offsets around its centre:

```text
offsets = (-0.25,-0.25), (0.25,-0.25), (-0.25,0.25), (0.25,0.25)
azimuth   = uv.x * 2π
elevation = max(uv.y, 0) * 1.5407 radians
direction = (cos(el)*cos(az), sin(el), cos(el)*sin(az))
```

Average the four radiance samples. Keep this material additive as well so a
scene can combine the same aurora radiance with its own environment probe
without moving sky or lighting code into the effect.

## Configuration contract

The `raymarched-aurora-curtains` tier uses:

```text
screen ray steps       75
probe ray steps        40
slab floor             50 world units
slab depth             75 world units
slab X half-extent     250 world units
slab Z half-extent     500 world units
animation speed        0.65 simulation seconds / elapsed second
noise seed             19.6
intensity              1
lower colour           #59ff03
upper colour           #00aaff
radiance multiplier    0.05
screen start jitter    0.25 of one uniform step
probe resolution       32 × 16 texels
probe supersampling    4 samples / texel
```

Tune in causal groups: slab footprint and height; field shape; step count and
start jitter; then intensity and colour. Do not compensate an oversized
footprint with extinction, an elevation gate, or bloom.

## Observed limits and defects

- The observer anchor is fixed at `(0, 10, 0)` world units and advanced `10`
  units along the ray before intersection. Parameterise both together when the
  scene uses a materially different scale or origin.
- The footprint is asymmetric in X and Z. Rotate the field coordinates with
  the intended curtain orientation instead of swapping or widening the bounds.
- The screen jitter changes every frame and has no temporal reconstruction.
  It softens uniform-step banding but does not converge it.
- The `32 × 16` equirectangular material is a radiance map, not a cosine-weighted
  irradiance convolution. Consumers own any lighting integration.
- The material models emissive volume only. It does not own atmospheric sky
  scattering, stars, cloud extinction, terrain light transport, or grading.

## Failure diagnosis

```text
dense horizontal horizon stuffing
  -> the slab footprint was widened or replaced by an effectively unbounded field

main curtain lobes are clipped
  -> the camera is framed too low or the finite footprint is misoriented

white horizon band
  -> the finite footprint was widened or step length was removed from accumulation

horizontal slice flicker
  -> start jitter was removed or the uniform ray-step count is too low

curtains vanish overhead
  -> camera basis/FOV/resolution disagree with the raster camera

probe lighting pulses
  -> probe jitter depends on time instead of texel coordinates

probe seams at azimuth wrap
  -> the probe texture does not repeat on its horizontal axis

brightness changes with ray-step count
  -> density accumulation omitted the current step length
```

## Diagnostics

Inspect:

```text
aurora emission on black
scene with aurora disabled
ray entry/exit and interval length
uniform step length
raw density before colour
accumulated HDR radiance before the 0.05 multiplier
finite-box hit mask by view direction
32 × 16 equirectangular radiance map with horizontal wrap
```
