# Scene-referred exposure and color pipeline

Use this reference for a measured HDR-to-display path with encoded luminance readback, asymmetric adaptation, one tone-map owner, and a generated display-domain 3D LUT.

## Contents

- Exact pipeline order
- Luminance meter
- Exposure target and adaptation
- 3D LUT construction
- LUT placement
- Tone mapping ownership
- Observed limitations
- Diagnostics


## Exact pipeline order

The pipeline computes:

```text
HDR scene after AO/atmosphere
  -> bloom added in HDR
  -> multiply by adapted exposure
  -> renderOutput using renderer tone mapping
  -> saturate to LUT domain
  -> sample 3D LUT
  -> blend LUT intensity
  -> optional FXAA
```

`RenderPipeline.outputColorTransform` is disabled and one output node owns the
final conversion. Renderer tone-mapping mode and renderer exposure are still
configuration inputs to `renderOutput`.

## Luminance meter

The implementation renders a `64 x 36` meter target using unsigned bytes. It encodes
unbounded luminance:

```text
encoded = luminance / (luminance + 1)
decoded = encoded / max(0.0001, 1 - encoded)
```

Readback occurs asynchronously every `12` frames by default. While one readback
is pending, another is not started.

CPU reduction uses weighted log average:

```text
weight = 1.0 when luminance > 0.002
weight = 0.15 otherwise

average =
  exp(sum(log(max(luminance, 0.0001)) * weight) / sum(weight))
```

This suppresses black-pixel dominance without requiring a histogram.

## Exposure target and adaptation

Defaults:

```text
minimum exposure = 0.45
maximum exposure = 1.85
middle gray = 0.18
compensation = 0 EV
speed up = 3.2
speed down = 1.1
```

Target:

```text
target =
  clamp(
    middleGray / averageLuminance
    * 2^exposureCompensation,
    minExposure,
    maxExposure
  )
```

Frame-rate-independent adaptation:

```text
speed = target > current ? speedUp : speedDown
amount = 1 - exp(-max(deltaSeconds, 0) * speed)
current += (target - current) * amount
```

When disabled, current and target reset to `1`.

## 3D LUT construction

Build a `32^3` RGBA `Data3DTexture` with linear filtering, clamp wrapping, no
mipmaps, and unsigned-byte storage.

Each preset recipe owns:

```text
contrast
saturation
vibrance
black/white point
per-channel gamma
shadow/midtone/highlight tint
strength for each tonal range
```

Recipe order:

```text
normalize black/white range
S-curve blend, fixed amount 0.44
contrast around 0.5
shadow tint
midtone tint
highlight tint
per-channel gamma
saturation
vibrance
small highlight glow bias
clamp to [0, 1]
```

Tonal weights are calculated from pre-grade luminance:

```text
shadow = 1 - smoothstep(0.12, 0.54, luma)
highlight = smoothstep(0.48, 0.92, luma)
midtone = max(0, 1 - abs(luma - 0.5) * 2)
```

## LUT placement

The LUT samples tone-mapped display-linear RGB after saturation:

```text
uv = saturate(displayColor.rgb) * ((32 - 1) / 32) + 0.5 / 32
graded = texture3D(lut, uv)
final = mix(displayColor, graded, lutIntensity)
```

This means the included recipes are authored for a bounded post-tone-map
domain. Do not move them before tone mapping without rebuilding the recipes and
documenting a scene-linear or log domain.

## Tone mapping ownership

Available renderer modes include:

```text
None, Linear, Reinhard, Cineon, ACES, AgX, Neutral
```

Color defaults:

```text
tone mapping = ACES
renderer exposure = 0.72
LUT = Real Daylight
LUT intensity = 1
```

The configuration layer initially disables LUT intensity and eye adaptation
until enabled through settings. Distinguish configuration defaults from active
feature state.

## Observed limitations

- The meter has no center weighting, percentile clipping, sky mask, or UI mask.
- Unsigned-byte encoding loses precision near extreme luminance.
- Readback cadence is frame-count based, so wall-clock cadence changes with
  frame rate.
- A failed readback resets target exposure to `1`, which can cause a visible
  adaptation shift.
- LUT generation clamps every entry to `[0,1]`; it is display-domain grading,
  not HDR scene-referred grading.
- The pipeline exposes both renderer `toneMappingExposure` and a separate
  adapted exposure multiplier. Their combined ownership must be documented to
  avoid accidental double exposure.
- FXAA is applied after grading, but dithering/gamut compression are absent.

## Diagnostics

Expose:

```text
meter source
encoded meter target
decoded luminance
weight mask
measured average
target/current exposure over time
readback pending and cadence
HDR before exposure
tone-mapped before LUT
neutral versus selected LUT
per-recipe tonal weights
clipped/out-of-domain mask
final with one exposure stage disabled at a time
```
