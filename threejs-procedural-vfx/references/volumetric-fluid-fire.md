# Volumetric fluid fire

Use the `volumetric-fluid-fire` example for a bounded WebGPU fire and smoke
volume driven by coupled velocity, dye, pressure, vorticity, emitter, and
signed-distance fields.

## Contents

- Simulation volume and texture ownership
- Compute schedule
- Velocity advection and forces
- Dye advection and mesh emission
- Pressure projection
- Signed-distance collision volume
- Volume scattering and composition
- Configuration contract
- Observed limits and defects
- Failure diagnosis
- Diagnostics

## Simulation volume and texture ownership

Own three related dimensions explicitly:

```text
world size         metres in the fire object's local frame
physics resolution velocity, pressure, vorticity, and collision voxels
render resolution  density, temperature, age, and tint voxels
```

The example stage uses a `7.6200376 × 5.9751163 × 3.7697034 m` world box. It
derives voxel widths from the longest world axis and rounds each axis, producing
a `100 × 78 × 49` render grid and an `80 × 63 × 40` physics grid. Do not force
both grids to be cubic: equal world-space voxel scale matters more than equal
axis counts.

Allocate these 11 three-dimensional textures:

```text
curlNoise       RGBA half float, physics-independent 64³ periodic field
velocity A/B    RGBA half float, physics resolution
dye A/B         RGBA half float, render resolution
divergence      red float, physics resolution
pressure A/B    red float, physics resolution
vorticity       RGBA half float, physics resolution
SDF             RGBA half float, physics resolution: normal.xyz + distance.w
SDF velocity    RGBA half float, physics resolution: surface velocity.xyz
```

The dye channel contract is exact:

```text
R density
G temperature
B age in seconds
A special-colour mass
```

Give every compute entry a `4 × 4 × 4` workgroup. Dispatch `ceil(resolution / 4)`
workgroups per axis and reject global IDs outside the actual grid before any
texture access.

## Compute schedule

Precompute the `64³` curl-noise texture during `initialize()`. Each active
update follows this ownership order. Step 1 runs once per `update()` call;
steps 2–9 run once for every complete step in the accumulator:

```text
1. bake every collider into SDF and SDF-velocity textures
2. compute vorticity from velocity A
3. advect velocity A into velocity B and apply forces
4. compute divergence from velocity B
5. run 4 alternating Jacobi iterations: A→B, B→A, A→B, B→A
6. subtract pressure-A gradient and write projected velocity A
7. advect dye A into dye B
8. inject mesh-vertex density, temperature, age, and tint into dye B
9. swap dye A and B texture ownership
```

The fixed base step is `1/30 s`. The preset simulation speed is `1.5`, so the
shader step is `0.05 s`; both the accumulator increment and threshold scale by
the same speed. When `update()` runs at least 30 times per second, this retains
30 compute steps per wall-clock second while each step advances the field by
`0.05 s`.

Keep the pass order and ping-pong endpoints together. The projection pass reads
pressure A, so use an even Jacobi count. An odd count leaves the newest pressure
in B and projects with stale A data.

## Velocity advection and forces

Backtrace the physics velocity in normalized volume coordinates:

```text
velocityUVW = velocity / worldSize
previousUVW = uvw - velocityUVW * dt
newVelocity = sample(velocityA, previousUVW)
```

Apply buoyancy and smoke weight on world Y:

```text
verticalForce = temperature * 2.3729 - density * 0.15
newVelocity.y += verticalForce * dt
```

Generate the periodic curl field from grid coordinates corrected by volume
aspect:

```text
p = (globalID / 64) * (worldSize.x / worldSize.y, 1, worldSize.z / worldSize.y)
frequency = 6.81
finiteDifferenceOffset = 0.1 / frequency
curl multiplier = 5.82
```

The field uses central differences of three simplex-vector samples per axis.
Do not divide the curl by `2 * finiteDifferenceOffset`; the `5.82` multiplier is
calibrated to the unnormalised differences.

Sample two turbulence bands during velocity advection:

```text
thermalUVW = uvw + (0, -age*0.6, age*0.13) / frequency
thermalDecay = exp(-age * 0.76)
thermal = curl(thermalUVW) * 0.2 * temperature * thermalDecay

ambientUVW = uvw + (0, time*0.15, time*0.01) / frequency
ambient = curl(ambientUVW) * 0.2 * density

turbulence = (thermal + ambient) * 0.2 * 0.1
newVelocity += turbulence * dt
```

The second `0.2` multiplication is intentional: the turbulence control affects
both sampled bands and their combined force.

Apply linear damping with `max(1 - 0.25*dt, 0)`. Fade velocity to zero within
`0.02` normalized units of the volume boundary. Finally add vorticity
confinement:

```text
omega = curl(velocityA)
eta = 0.5 * gradient(length(omega))
N = eta / (length(eta) + 0.00001)
force = 7.01 * cross(N, omega)
newVelocity += force * dt
```

## Dye advection and mesh emission

Backtrace dye with velocity A using the same world-size conversion. If the
backtrace begins inside a collider, move the current world point outward by the
absolute signed distance along the baked normal, transform it back into the
volume frame, and use that corrected UVW.

Advance the dye channels as follows:

```text
density'     = density * max(1 - 1.02*dt, 0)
temperature' = temperature * max(1 - 0.4831*dt, 0)
colourMass'  = colourMass * max(1 - 1.02*dt, 0)
age'         = nearestNeighbourAge(previousUVW) + dt
age'         = 0 when density' <= 0.01
```

Nearest-neighbour age avoids numerical diffusion while density, temperature,
and tint retain filtered sampling.

Prepack each emitter definition's geometry positions into one read-only
storage buffer. Preallocate proxy transforms up to `maxCount`, and upload only
matrix, active/emission/tint properties, and velocity ranges that changed.
Dispatch one compute invocation per predeclared emitter vertex.

For an active vertex inside the volume:

```text
addedDensity = (emitDensity / 20) * emitMultiplier
addedTemperature = emitTemperature * 0.05
newDensity = clamp(oldDensity + addedDensity, 0, 1)
newTemperature = oldTemperature + addedTemperature
newColourMass = oldColourMass + addedDensity * tintFactor
freshWeight = clamp(addedDensity / max(newDensity, 0.001), 0, 1)
newAge = mix(oldAge, 0, freshWeight)
```

Here `oldDensity`, `oldTemperature`, `oldColourMass`, and `oldAge` come from
dye A at the emitter UVW. The kernel writes the result to dye B, replacing the
just-advected dye-B value at that voxel rather than adding to it.

The stage uses emitter multipliers `13` for the broad mesh and `22` with tint
factor `1` for the teapot. Added temperature is gated by positive density
emission but is not multiplied by the per-emitter multiplier.

## Pressure projection

Compute divergence from the six velocity-B neighbours:

```text
divergence = 0.5 * ((vR.x-vL.x) + (vU.y-vD.y) + (vF.z-vB.z))
```

When a neighbour is solid, reflect an inward current velocity across the baked
normal before selecting its component. The discretisation intentionally omits
explicit voxel-spacing division.

For each Jacobi iteration, write zero pressure inside a solid. For a fluid
voxel, sum only open-fluid neighbours and divide by their count:

```text
pressure = (sumOpenNeighbourPressure - divergence) / openNeighbourCount
```

During projection, treat a solid neighbour as having the current voxel's
pressure. This imposes a zero pressure gradient at the wall. Subtract the
central pressure gradient from velocity B, enforce the moving-collider boundary
response, and write velocity A. Write exactly zero velocity for voxels inside a
solid.

## Signed-distance collision volume

Represent each collider with uniform arrays for inverse rigid transform, world
position, linear velocity, angular velocity, half extents, and activity. The
inverse transform removes translation and rotation but deliberately leaves
scale in the half extents.

The built-in fields are:

```text
box:
q = abs(localPosition) - halfExtents
d = length(max(q, 0)) + min(max(q.x, max(q.y, q.z)), 0)

ellipsoid:
k0 = length(position / radii)
k1 = length(position / (radii*radii))
d = k0 * (k0 - 1) / k1
```

At every physics voxel, find the minimum active distance. Multiply the selected
distance by `1 - collisionMargin`, where the preset collision margin is
`0.034`. Estimate the normal with world-space central differences at `0.1 m`.
Store the winning surface velocity:

```text
surfaceVelocity = linearVelocity + cross(angularVelocity, point - centre)
```

Near a collider, use a separate hard boundary width of `0.1 m`. Inside, eject
fluid at `abs(distance) * 20 m/s` along the normal on top of surface velocity.
Outside but within the boundary, blend toward surface velocity by proximity
times friction `0.9`, then remove any remaining inward relative-normal
velocity.

## Volume scattering and composition

Sample dye in the fire object's volume frame. Warp only the boundary mask by
`velocity/worldSize * 0.35 * turbulence`; the dye lookup itself remains at the
unwarped UVW. Modulate density with animated simplex detail:

```text
detail = snoise(localPosition*5.5 + (0, -age*0.8, 0)) * turbulence
density *= detail*0.35 + 0.85
density *= smoothstep(0, 0.03, nearestWarpedBoundaryDistance)
crispDensity = density^1.5
```

Map temperature to emission with the preset:

```text
radiance = temperature^3 * 14.78 + 1
selfAbsorption = exp(-crispDensity * 2)
fireAbsorption = mix(1, selfAbsorption, smoothstep(0.2, 0, temperature))
normalisedTemperature = temperature / 10
```

Interpolate the temperature palette through these smoothstep intervals:

```text
base    #000000
tier 1  #ff5900 over 0.01 -> 0.10
tier 2  #ffff6c over 0.30 -> 0.50
tier 3  #ffffff over 0.70 -> 0.80
special #00ffff
```

The final ordinary emission is:

```text
colour = palette(normalisedTemperature)
       * radiance
       * crispDensity
       * fireAbsorption
```

When colour mass exceeds `0.1`, replace it with the length of the ordinary
emission multiplied by the special colour.

Raymarch `22` steps through a double-sided additive volume with depth writes
disabled. Jitter the ray offset by interleaved-gradient noise plus
`frameId * 0.118033988749895`, then take the fractional part. Bind the scene
depth texture to the volume material so opaque geometry terminates the march.

Render the volume pass at `0.75` resolution scale. Add a half-resolution bloom
node with strength `0.01`, radius `0.1`, and HDR threshold `13`. Keep the raw
non-bloom volume legible; bloom expands existing high-temperature structure and
does not define it.

## Configuration contract

The example's complete perceptual preset is:

```text
simulation speed             1.5
vorticity confinement        7.01
emission temperature         8.5
emission density             0.644
turbulence frequency         6.81
turbulence decay             0.76
turbulence strength          0.2
density dissipation          1.02 /s
cooling                      0.4831 /s
velocity damping             0.25 /s
buoyancy                     2.3729
smoke weight                 0.15
pressure iterations          4
curl multiplier              5.82
surface friction             0.9
angular velocity multiplier  1.36
collision margin             0.034
temperature at tier 3        10
radiance multiplier          14.78
raymarch steps               22
volume pass scale            0.75
```

Tune in causal groups: grid and step cost; velocity motion; dye lifetime;
emission; palette/radiance; collision response; raymarch/composition. Do not
compensate a weak velocity field by increasing bloom or a weak emitter by
increasing vorticity.

## Observed limits and defects

- Mesh emission performs unordered storage-texture writes. Multiple vertices
  can target one dye voxel without atomics, so exact accumulation can vary by
  GPU scheduling.
- The precomputed vertex-brush offset array is not consumed by the emission
  pass. `vertexEmissionRadius` therefore allocates offsets but does not widen
  the injected footprint.
- A moving-emitter velocity kernel is assembled but not dispatched. Proxy
  motion relocates the injection points; it does not inject emitter velocity.
- The simulation accumulator measures `performance.now()` internally rather
  than using the caller's delta. It clamps each measured interval to `1/30 s`,
  so loops below 30 updates per second lose wall-clock simulation time. Pause by
  skipping `update()`, not by passing zero.
- Mesh injection reads dye A and overwrites dye B at each injected voxel after
  advection. It does not accumulate onto the just-advected dye-B value.
- The `noise.frecuency` configuration field does not drive the curl pass. The
  active frequency is the mutable turbulence-frequency uniform.
- The ellipsoid-capacity field is not read when allocating the built-in
  ellipsoid slots; box capacity is used for both built-in shape arrays.
- The emitter vertex table advances its next-definition offset by vertex count
  times `maxCount`, while the unique-vertex buffer stores one copy. Multiple
  definitions after a definition whose `maxCount` exceeds one can address the
  wrong vertex range.
- Divergence and pressure gradients omit physical voxel-size factors. Grid
  resolution changes therefore retune the apparent motion.
- The class has no explicit texture or storage-buffer disposal method. Let the
  owning renderer die with an isolated scene, or add lifecycle ownership before
  using repeated live creation/destruction.
- Several uniforms are reserved but inactive in the final branch, including
  key-light position, special-colour multiplier, and tint blend range.

## Failure diagnosis

If the volume is empty:

1. confirm `initialize()` completed before the render loop;
2. confirm every emitter proxy is active and lies inside the world box;
3. inspect density before temperature or bloom;
4. verify dye A/B swaps after emission;
5. check that the volume layer is present in the dedicated pass.

If fire appears but does not move, inspect velocity magnitude, then vorticity,
then buoyancy. A zero dye age with nonzero density points to repeated injection,
not failed advection.

If fire crosses a collider, inspect the baked signed distance and normal before
changing friction. A missing collider field cannot be repaired by a larger
boundary drag. Confirm the proxy's world transform updates before the bake.

If pressure projection flickers, confirm the Jacobi count is even and the final
result lands in pressure A. Inspect divergence before and after projection at
the same voxel coordinates.

If the volume disappears when opaque geometry enters the frame, inspect the
scene-depth node and volume layer composition. The volume pass must sample the
main scene depth but must not render the opaque scene into its own colour pass.

## Diagnostics

Expose at least these views without changing the final branch:

```text
final        temperature palette, self-absorption, additive composition, bloom
no bloom     identical fire emission without the bloom node
density      post-detail density sampled during raymarching
temperature  temperature divided by the 10-unit palette maximum
velocity     absolute velocity components divided by 5 m/s
colliders    red where baked signed distance is negative
```

Also report render-grid dimensions, physics-grid dimensions, raymarch steps,
and pressure-iteration count. For deeper inspection, capture velocity A/B,
divergence, pressure A/B, vorticity, SDF distance/normal, surface velocity, dye
age, and special-colour mass independently.
