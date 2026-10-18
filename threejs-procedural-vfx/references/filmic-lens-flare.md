# Filmic HDR lens flare

Use the `filmic-lens-flare` example for a fullscreen TSL compositor with
HDR-emitter extraction, radial image ghosts, finite pupil families,
field-angle deformation, localized bloom, veiling glare, and a film response.

## Contents

- Input and view contract
- HDR emitter extraction
- Optical-axis and field-angle contract
- Highlight-derived ghosts
- Finite pupil families
- Spectral pupil ring and source star
- Bloom and film composition
- Configuration contract
- Observed limits and defects
- Failure diagnosis
- Diagnostics

## Input and view contract

The example consumes a linear equirectangular HDR texture. Horizontal sampling
repeats and vertical sampling clamps. The panorama sampler reconstructs a world
ray from top-origin screen UV, aspect ratio, vertical FOV, and an orthonormal
camera basis:

```text
ndcX = 2*screenU - 1
ndcY = 1 - 2*screenV
ray = normalize(forward
              + right*(ndcX*aspect*tan(fov/2))
              + up*(ndcY*tan(fov/2)))
longitude = atan(ray.x, -ray.z)
latitude  = asin(clamp(ray.y, -1, 1))
panoU     = fract(longitude/(2π) + 0.5)
panoVTop  = 0.5 - latitude/π
textureV  = 1 - panoVTop
```

The final inversion is required for EXR data whose decoded row zero is the
bottom scanline. Do not invert at both load and sample time.

`detectHdrSun()` searches the decoded HDR pixels for maximum Rec. 709
luminance, then computes a luminance-weighted centroid inside a radius of
`max(5 px, floor(0.018*min(width,height)))`. Only pixels above `22%` of the
maximum contribute. The returned latitude coordinate is top-origin.

## HDR emitter extraction

The plate luminance is:

```text
luma = dot(rgb, (0.2126, 0.7152, 0.0722))
gate = smoothstep(4, 18, luma)
hot  = gate * (clamp(luma/14, 0, 4) + 0.18)
```

This threshold rejects ordinary sky and ground values while retaining the HDR
sun and its immediate core. The plate receives only `0.00042` maximum
screen-edge chromatic offset, a `0.79` gain, `0.92` saturation, and the channel
gain `(1.070, 0.985, 0.900)` before flare composition. Keep global chromatic
aberration restrained; spectral separation belongs to individual ghosts.

## Optical-axis and field-angle contract

Every synthetic ghost centre lies on the segment from source UV to image
centre:

```text
ghostCenter(t) = mix(sourceUV, (0.5, 0.5), t)
```

Use aspect-correct sensor coordinates for all distances and axes. The radial
field direction is the normalized vector from image centre to source. Retain
its last finite value when source UV crosses the optical axis; normalizing a
zero vector can poison the whole node graph with NaNs.

Pupil deformation uses the true three-dimensional field angle:

```text
fieldCos = clamp(dot(sunDirection, viewForward), 0, 1)
fieldSin = sqrt(max(0, 1 - fieldCos²))
radialRadius = baseRadius * max(fieldCos, 0.34)
tangentRadius = baseRadius
```

Do not derive deformation from screen radius. Screen radius changes with FOV
and aspect ratio even when the physical field angle is unchanged.

Source visibility is the product of a `0.015–0.12` facing smoothstep and a
linear off-frame fade over `0.36` screen UV. Source coordinates are bounded to
`[-2,3]` on each axis after visibility is evaluated.

## Highlight-derived ghosts

Four plate-derived RGB ghosts use radial image warps with scale factors
`-1.05`, `-0.73`, `-0.50`, and `-0.31`. Their per-channel scale offsets are
respectively `0.010`, `0.007`, `0.0045`, and `0.0030`. A negative scale reflects
the highlight across the compositor centre.

Sample red, green, and blue at `k-dispersion`, `k`, and `k+dispersion`. Keep
these image-derived ghosts subordinate to the finite pupil structure; their
RGB weights are `(0.090,0.078,0.082)`, `(0.075,0.068,0.074)`,
`(0.055,0.052,0.060)`, and `(0.038,0.036,0.043)`.

## Finite pupil families

The calibrated ghost positions are finite and explicit:

```text
terminal family  t = 2.12, 2.28
cool family      t = 1.84
warm family      t = 1.62, 1.48
micro family     t = 1.34, 1.23, 1.15, 1.08, 1.03
residual haze    t = 2.34, 2.18
```

Each pupil ellipse and ring uses the same radial/tangential field basis. The
principal radii in screen-height units are:

```text
terminal A    0.086 outer, 0.052 inner, 0.132 halo
terminal B    0.102 outer, 0.064 inner, 0.154 halo
cool          0.047 core, 0.059 ring, 0.067 leak, 0.104 halo
warm 0        0.058 outer, 0.037 inner, 0.094 halo
warm 1        0.027 core, 0.052 halo
micro beads   0.0078, 0.0062, 0.0049, 0.0036, 0.0026
```

The terminal continuation is haze, not an unbounded bead chain. Preserve the
finite family count so the composition reads as one optical system rather than
an arbitrary line of sprites.

## Spectral pupil ring and source star

The spectral ring shares the warm-family centre at `t = 1.62`. Its field-angle
split is:

```text
spread      = fieldSin * 0.0075
redRadius   = 0.056 + spread
greenRadius = 0.056
blueRadius  = max(0.043, 0.056 - spread)
```

Ring widths are `0.180`, `0.168`, and `0.185` for red, green, and blue. Fade the
ring once its centre moves `0.02–0.18` UV beyond the frame.

Source-centred aperture response contains horizontal, vertical, diagonal
`±45°`, and shallow `±20°` ray pairs. Gaussian cross-axis falloffs are
`56000`, `78000`, `42000`, and `36000`; longitudinal falloffs are `11.5`,
`18`, `14`, and `22`. Apply the combined star at `0.34` gain. Never place an
additional star at a ghost centre.

## Bloom and film composition

Use three localized bloom nodes:

```text
source bloom  threshold 0.62, strength 0.80, radius 0.0105, composite gain 0.92
halo bloom    threshold 0.74, strength 0.96, radius 0.0080, composite gain 1.30
flare bloom   threshold 0.84, strength 0.90, radius 0.0300, composite gain 0.56
```

Source bloom gates luminance through `smoothstep(2.9,10.5)` and clamps the seed
to `28`. Halo bloom uses `smoothstep(1.8,6.1)`, clamps to `18`, and tints the
seed `(1,0.30,0.055)`.

After additive composition, two broad masks reduce local contrast and add warm
neutral energy. The film stage then applies:

```text
shadow transition       0.08–0.58 luminance
warm-highlight ramp     0.18–1.8 luminance
shoulder transition     0.55–3.2 luminance
print-density transition 1–4 luminance, darkening to 0.72
highlight desaturation  0.75–4.6 luminance, maximum 0.15
vignette transition     0.22–0.80 sensor-radius², maximum 0.11
grain grid              1919 × 1087
grain drift             (43.17,17.71) texels/s
grain amplitude         0.0052 below the 1.5–5.2 luminance fade
```

The renderer uses ACES filmic tone mapping with exposure `0.92` after this
linear HDR node graph.

## Configuration contract

The `filmic-lens-flare` example uses:

```text
initial vertical FOV        58 degrees
permitted FOV range         26–105 degrees
initial source screen UV    (0.785,0.625), top-origin
strength range              0–2
effect mix                  0 or 1 for before/after
renderer exposure           0.92
```

Tune only after source projection, HDR scale, and output transform are
correct. Adjust source response, ghost-family energy, localized bloom, veil,
then film density in that order.

## Observed limits and defects

- The example models a calibrated artistic lens response, not a prescription
  traced through measured glass elements and coatings.
- The spectral ring ordering is fixed. A physical sign and magnitude require a
  concrete glass/coating prescription.
- Bloom nodes make this a WebGPU/TSL compositor and require renderer-owned
  post-processing execution.
- The plate sampler assumes bottom-row-first decoded EXR data. Other texture
  loaders may require a different vertical convention.
- Grain is animated without temporal reconstruction and can shimmer under
  aggressive downsampling.
- The HDR sun detector assumes one dominant compact emitter. Multiple similarly
  bright emitters require an explicit emitter-selection contract.

## Failure diagnosis

```text
whole frame turns black when source UV crosses centre
  -> a zero optical-axis vector was normalized

ghosts change shape when only FOV changes
  -> screen radius replaced the object-space field cosine

panorama is upside down
  -> top-origin latitude was sampled without the EXR row inversion

snow or sky creates duplicate ghost chains
  -> the 4–18 HDR highlight gate was weakened or omitted

flare persists behind the camera
  -> source visibility does not include the 0.015–0.12 facing fade

composition resembles a sprite chain
  -> extra ghost centres were added beyond the finite family

global rainbow fringe dominates the frame
  -> scene-level chromatic aberration replaced per-ghost dispersion

flare is invisible until bloom is extreme
  -> the additive source, pupil, ring, and veil layers are not HDR-legible
```

## Diagnostics

Inspect:

```text
HDR plate without flare
flare contribution on black
source UV and visibility
field cosine, sine, and radial direction
highlight extraction mask
finite ghost-family centres and pupil ellipses
source, halo, and flare bloom seeds separately
final output with effect mix zero
```
