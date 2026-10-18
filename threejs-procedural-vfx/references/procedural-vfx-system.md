# Layered procedural VFX systems

Use this reference for ship-conforming reentry plasma, generated wakes, instanced analytic sparks, dissolving debris, dense-swap pools, holographic projection shells, and scene-relative HDR contribution.

## Contents

- Reentry representation
- Reentry shell shading
- Wake construction
- Instanced spark contract
- Debris dissolve and pool ownership
- Holographic projection shells
- HDR contribution
- Observed limitations
- Diagnostics


## Reentry representation

A complete reentry system is not one particle emitter. It composes:

```text
ship-shaped front shell
  + expanding capsule core wake
  + larger low-opacity haze wake
  + two asymmetric side shear lobes
```

The shell is a clone of the actual ship mesh, scaled by `1.005`. This is the
key silhouette decision: plasma follows authored hull topology instead of a
generic sphere or cone.

The wake origin is found from sampled ship vertices. For the current local fall
direction, select the support point with the greatest dot product. Build an
orthonormal wake frame by projecting local up away from the fall direction,
falling back to local right when nearly parallel.

```text
wake forward = normalized fall direction
wake up = projected local up
wake right = cross(up, forward)
wake origin = hull support point along fall direction
```

The `reentry-plasma` example demonstrates the same grammar standalone: closed
layered wake shells with authored per-shell configs, flow-axis deformation,
advected filament fields, and opacity shaping, without requiring a host ship
mesh. Its shell constants are its own contract; read the example for exact
values.

## Reentry shell shading

The shell mask uses actual flow-facing geometry:

```text
facing = saturate(dot(normalWorld, -fallDirectionWorld))
facing mask = smoothstep(0.18, 0.96, facing)
```

Two world-space noise bands move along fall direction:

```text
coarse frequency = 3.6
fine frequency = 11.2
coarse/fine mix = 0.62 / 0.38
fine filament exponent = 3.1
flow speed basis = time * 5.4 + external flow * 0.08
```

The shell shader separates:

- core heat from flow-facing area;
- Fresnel envelope around silhouette;
- a shock band requiring high facing, rim response, and filaments.

Color hierarchy is explicit:

```text
hot core: orange -> near white
ion envelope: magenta -> violet
outer sheath: violet -> cyan
shock: white -> blue
```

The final shell uses additive blending, no depth write, depth test on, double
sided, and negative polygon offset. Treat the additive multiplier as part of
the scene’s HDR calibration, not a portable physical unit.

## Wake construction

Each wake is a generated capsule-profile tube. Along normalized length `t`:

```text
z = -trailLength * t
radial spread = 1 + t^1.24 * expansion
axial spread = 1 + 0.1 * t
profile turbulence = 1 + sin(theta * 3.3 + t * 8.7) * 0.1 * t
```

Dimensions relative to ship length:

```text
profile length = 0.74
profile radius = 0.068
trail length = 1.55

core: 52 radial x 26 longitudinal, expansion 1.9
haze: 40 x 20, radius 1.2x, length 1.05x, opacity 0.28
lobes: 28 x 14, half profile, length 0.88x, opacity 0.34
```

Wake shading uses elliptical profile distance, a front gate, tail fade,
coarse/fine longitudinal noise, Fresnel, and separate core/envelope/filament
colors. The core and haze use different scales and speeds instead of one mesh
with changed opacity.

## Instanced spark contract

Preallocate a fixed sprite pool of `12000`. Every instance stores:

```text
startPosition vec3
startVelocity vec3
acceleration vec3
spawnTimeSeconds float
```

Lifetime is `1.3 s`; velocity decay rate is `16`. Spark size falls linearly to
zero:

```text
scale = max((1.3 - age) * 0.4 / 1.3, 0)
```

The fragment is a circular sprite with radius `0.4`. HDR color interpolates
from `(1, 0.5, 0) * 80` toward dark red. Spawn adds random X/Z velocity in
`[-2, 2]`.

The pool is fixed-capacity and material attributes are per instance. No entity
owns an individual mesh.

## Debris dissolve and pool ownership

Debris spheres use:

```text
radius = 0.45
lifetime = random 2 -> 4 seconds
mass = 0.1
friction = 0.4
restitution = 0.8
gravity scale = 1.2
```

Per-instance material data:

```text
isOrange
removalTimeSeconds
```

Geometry-space noise creates a spatial dissolve against remaining lifetime.
The material also adds a Fresnel-shaped color response, a directional fake-AO
tint, and a low environment term of `0.05`.

When an instance is removed, the render system swaps the last live instance
into the vacant slot and copies:

- the 4x4 instance matrix;
- every custom attribute slice;
- the entity-to-index mapping.

This dense-swap invariant is the reusable pooling mechanism. Updating only
`mesh.count` without copying custom attributes would attach old effect state to
the moved instance.

## Holographic projection shells

A projected hologram is a rim effect, not a surface effect. The
`holographic-shape-transition` example implements this tier: one shell pass per
shape, front faces only, `AdditiveBlending`, `depthWrite: false`, `transparent:
true`. Additive composition is order independent, so no sorting or depth prepass
is required, and disabling depth write is what stops the shell from reading as a
solid body.

Three terms build the response, in this order:

```text
density  = mix(0.25, pow(mod((worldY - t*0.2) * 20.0, 1.0), 3.0), bandKeep)
fresnel  = pow(1.0 - abs(dot(N, V)), 2.0)
falloff  = smoothstep(0.8, 0.0, fresnel)
alpha    = (density * fresnel + fresnel * 1.25) * falloff
```

`abs()` on the incidence term is required: the shell is seen from both facings
along a silhouette, and a signed dot would blank one of them. The `falloff`
factor is not redundant with the exponent — squared Fresnel alone saturates the
exact silhouette into a hard outline, and the falloff restores an inner edge so
the rim reads as a glow. The `1.25` rim gain is the term that survives where the
scanline band is dark, so the silhouette never disappears between bands.

Scanline phase is world height, so the bands belong to the world and a rotating
shape turns inside them. The band field has no mip chain, so filter it by
footprint: measure periods crossed per pixel with `fwidth` on the cycle
coordinate and fade to the band's own mean, which for `pow(fract(x), 3.0)` is
exactly `0.25`. Fade the keep out between two samples per period and one
(`smoothstep(0.25, 0.5, footprint)`). Fading a radiance band to zero instead
makes a receding projection lose brightness with distance, which is a different
defect from the aliasing being fixed.

Vertex glitch is a gated band, not noise on everything:

```text
glitchTime = time - worldY
gate       = smoothstep(0.5, 1.0, (sin(gt)*sin(gt*3.45) + sin(gt*8.76)) / 3.0)
offsetXZ  += (random(worldXZ + time) - 0.5) * gate * 2.0
```

Three incommensurate sines rarely co-peak, so the smoothstep gate holds most of
the surface at exactly zero and only narrow height bands displace. Phasing on
world height is what makes the artifact travel through the projection.

Handover between shapes is a shared sweep plus complementary discards. One
normalised range spans the union of every shape's bounding box:

```text
minY = min(all boundingBox.min.y) + positionY - 0.1
maxY = max(all boundingBox.max.y) + positionY + 0.1
n    = (worldY - minY) / (maxY - minY)

discard if index is neither current nor next
discard if index == current && n < progress
discard if index == next    && n > progress
```

The range must be the union, never per shape: a per-shape range normalises two
different heights onto the same `0..1`, so the sweep line jumps vertically at the
instant of handover. The `0.1` margins keep the extreme rows off the exact
`progress` endpoints, where a whole row would switch in one frame. The two
discards are complementary, so the participating shapes never overlap — that is
what keeps an additive pass from doubling brightness mid-handover, and it is why
this works without any transition-specific blending.

Timing is one linear ramp inside a longer dwell:

```text
cycle speed        0.25 shapes/s  (one handover every 4 s)
sweep duration     1.5 s, linear
progress           min((elapsed - sweepStart) / 1.5, 1)
spin               0.5 rad/s on both x and y, per opted-in shape
```

The ramp is deliberately linear because the sweep is a moving line: any easing
makes it decelerate visibly against the static scanlines. Read the cycle index
from absolute elapsed time (`floor(elapsed * cycleSpeed) % count`) rather than
accumulating, so a dropped frame cannot desynchronise shape order from the sweep.
The set is preallocated; a handover creates and disposes nothing.

## HDR contribution

The compact signals are intentionally bright before bloom:

```text
spark core multiplier: 80
homing projectile multiplier: 30
laser multiplier: 10
```

These values are evidence of relative hierarchy inside one calibrated scene,
not universal exposure-independent constants. Preserve the relationship:

```text
spark flash > projectile > laser > ordinary surface
```

Validate all three in the raw HDR buffer and with bloom disabled.

## Observed limitations

- Spark position multiplies an already integrated decayed velocity by elapsed
  time again. This is dimensionally inconsistent but visually deliberate.
  Preserve it only when that trajectory is explicitly required.
- Acceleration uses `a * t^2` rather than `0.5 * a * t^2`, also an artistic
  choice.
- Spark randomization uses `Math.random`, so captures are not deterministic.
  Replace it with a seeded generator for regression work.
- The reentry wake disables depth test. This avoids hull intersections but can
  draw through unrelated geometry. Validate camera and occluder assumptions.
- The shell and wakes are analytic procedural meshes, not fluid simulation.
  Do not describe them as physically simulated plasma.
- A hologram rim is only as good as the frame its incidence is measured in.
  Multiplying a normal by the bare model basis is correct for rotation and
  uniform scale only; on a squashed instance the silhouette lights against a
  skewed frame. Resolve incidence in view space with the inverse-transpose
  `normalMatrix` and the displaced point's view position — a rigid view
  transform preserves the dot product, so this is the same incidence a correct
  world-space frame reports, without needing a per-object world normal matrix.
- An unfiltered periodic band is an aliasing source at any frequency. A
  projection whose bands are not footprint-filtered breaks into moire the moment
  the shell recedes or is seen at a grazing angle. MSAA cannot fix it.
- The glitch offsets world XZ, so it shears the shape laterally rather than
  along its own surface. That is the intended read for a projection artifact and
  is not a normal-space displacement.

## Diagnostics

Expose:

```text
fall direction and support point
shell facing/core/envelope/shock masks
coarse and fine wake noise
wake profile distance and tail fade
raw HDR emission by layer
bloom contribution by layer
spark age, velocity, and pool occupancy
debris remaining time and dissolve threshold
instance index/entity mapping
overdraw and depth-test modes
scanline density before and after the footprint keep
Fresnel rim before the falloff multiply
shared sweep range, normalised height, and live progress
glitch displacement magnitude per vertex
```

For a projection shell, read the sweep diagnostic while scrubbing time: the
normalised height must be continuous across a handover, and the transition band
must sit at the same screen height on both participating shapes. A band that
steps at the handover means the sweep range is per shape rather than shared.
