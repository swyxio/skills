# Camera rig and cinematic systems

Use this reference for scale-aware chase, side, orbit, authored-shot, pointer-look, floating-origin, projection, and lifecycle camera systems. It defines two systems: a planetary flight rig (chase, side, and orbit cameras around large bodies) and an authored cinematic shot system.

## Contents

- Camera contract
- Ship-scaled chase mount
- Thrust-lag spring
- Side and orbit camera
- Explicit camera handoffs
- Cinematic shot ownership
- Pointer-look and movement constraints
- Floating origin and background handling
- Projection and lifecycle ownership
- Failure modes and diagnostics


## Camera contract

Record before implementation:

```ts
type CameraDirectionContract = {
  subject: THREE.Object3D
  subjectScale: number
  projection: { fov: number; near: number; far: number }
  positionMode: "authored" | "mount" | "body-relative" | "floating-origin"
  upMode: "world" | "subject" | "dominant-body"
  inputMode: "locked" | "pointer-look" | "orbit-offset"
  handoffOwner: string
  spatialConstraints: string[]
}
```

Do not combine modes until each can produce a valid position and quaternion
independently.

## Ship-scaled chase mount

`CameraRigSystem` derives the chase mount from ship length:

```text
height = shipLength * 0.5
back = shipLength * 1.3
mount position = (0, height, -back)

look target:
  up = shipLength * 0.0001
  forward = shipLength * 0.35
```

It constructs a basis:

```text
forward = normalize(target - mount)
right = normalize(cross(worldUp, forward))
up = normalize(cross(forward, right))
quaternion = quaternion(makeBasis(right, up, forward))
quaternion *= rotation(worldUp, π)
```

The final `π` correction is model-convention specific. Verify the camera’s
local forward convention before retaining it.

The mount is parented to `ShipRoot`, so its world position/quaternion follows
the ship without recomputing the authored chase pose.

## Thrust-lag spring

The chase rig adds camera distance behind the ship only while manual thrust is
active. Throttle and boost own separate scalar spring states:

```text
throttle max = 3.8
boost max = 5.8
combined max = 8.2

drive acceleration:
  throttle 12
  boost 22.8

held stiffness:
  throttle 6
  boost 7.5

return stiffness = 34
held damping ratio = 1.04
return damping ratio = 1.30
```

Per component:

```text
damping = 2 * dampingRatio * sqrt(stiffness)
acceleration =
  activeDrive
  - stiffness * distance
  - damping * velocity

velocity += acceleration * dt
distance += velocity * dt
distance = clamp(distance, 0, maxDistance)
```

If clamping blocks velocity in the same direction, zero it. Apply total lag
along negative ship forward after reading the chase mount’s world pose.

This gives acceleration weight without adding camera rotation lag.

## Side and orbit camera

Scale-aware offsets after the ship model loads:

```text
side = (
  shipLength * 3.2,
  shipLength * 1.0,
  -shipLength * 1.35
)

orbit = (
  shipLength * 4.85,
  shipLength * 1.35,
  -shipLength * 2.15
)
```

The camera uses the dominant-body radial vector as up:

```text
bodyUp = normalize(shipPosition - bodyPosition)
```

For orbit lock, forward comes from relative velocity; otherwise it comes from
ship orientation. Project forward onto the body tangent plane:

```text
tangent = forward - bodyUp * dot(forward, bodyUp)
```

Frame-rate-independent smoothing:

```text
side forward response = 1 - exp(-6.5 * dt)
offset response = 1 - exp(-3.6 * dt)
mode blend lambda = 3.2
```

Rebuild an orthonormal frame:

```text
right = normalize(cross(bodyUp, tangent))
tangent = normalize(cross(right, bodyUp))
offset =
  right * offset.x
  + bodyUp * offset.y
  + tangent * offset.z
```

Yaw rotates the offset around `bodyUp`. Pitch rotates around
`cross(bodyUp, offset)`. Pointer input scales:

```text
yaw -= mouseDeltaX * 0.0022
pitch -= mouseDeltaY * 0.0018
```

Pitch bounds vary by flight mode. The implementation also enforces camera height above
the ship:

```text
landed minimum = shipLength * 0.42
other side-camera minimum = shipLength * 0.20
```

If tangent becomes nearly parallel to up (`abs(dot) > 0.985`), rebuild it from
`cross(bodyUp, worldUp)` and then X as a final fallback.

Look target:

```text
target = bodyUp * shipLength * 0.12
quaternion = lookAt(cameraPosition, target, bodyUp)
```

This camera is positioned in ship-root-local coordinates. Preserve that
coordinate ownership when adapting the rig.

## Explicit camera handoffs

The rig captures position and quaternion at transition start. Launch handoff
begins at progress `0.68`; orbit-exit duration varies from `1.1` to `2.6`
seconds based on the current side-camera blend.

Ease:

```text
eased = 1 - (1 - t)^1.8
position = lerp(startPosition, chasePosition, eased)
orientation = slerp(startQuaternion, chaseQuaternion, eased)
```

Critical transition invariant:

```text
explicit transition active
  -> write camera directly from one lerp/slerp
  -> return from camera update
```

Do not apply the normal follow smoother after this interpolation. Stacked
smoothing causes a mid-transition half-halt.

Outside explicit transitions, the final chase/side pose is followed with:

```text
lambda 9.5 while side blend is active/transitioning
lambda 18 when pure chase
```

At effectively zero blend, copy the chase pose exactly to prevent a permanent
subpixel tail.

## Cinematic shot ownership

Each cinematic scene owns its shot and projection values, for example:

```text
gas-giant approach:
  FOV 40
  near 12
  far 360000

spin docking:
  FOV 46
  near 35
  far 90000
```

Scenes save prior FOV/near/far, update the projection, and restore all three on
dispose.

The spin-docking shot uses authored world anchors:

```text
camera position = (6878.606, 4914.173, 6141.678)
look target = (6301.714, 4779.175, 5336.091)
```

Ships are then staged in the camera frame:

```text
forward = normalize(lookTarget - cameraPosition)
right = normalize(cross(forward, worldUp))
up = normalize(cross(right, forward))

staging center = cameraPosition + forward * 340
```

Subject offsets are expressed in this shot basis. This is more robust than
tuning independent world coordinates after the camera is framed.

The launch shot instead hard-anchors to a rocket-relative orbit target every
frame. It intentionally avoids follow lag against a rapidly accelerating
subject.

## Pointer-look and movement constraints

`PointerLookControls` uses Euler order `YXZ`, clamps pitch to
`±(π/2 - 0.01)`, and re-syncs yaw/pitch from the current camera quaternion
whenever pointer lock is acquired.

Movement:

```text
forward = camera world direction
right = normalize(cross(forward, worldUp))
distance = movementSpeed * dt
```

Default speed is `9`, sensitivity `0.0023`.

Keys are cleared on:

- pointer-lock exit;
- window blur;
- any update while unlocked.

Scene-specific constraints then run after controls:

- An interior room scene clamps X/Y/Z with floor, ceiling, and wall clearance.
- A terrain-walk scene clamps camera Y above sampled terrain plus `0.2`.
- cinematic scenes block movement keys while retaining their authored camera.

Input control and spatial constraint are separate layers.

## Floating origin and background handling

The gas-giant approach scene first computes a virtual camera pose, stores its
orientation basis, then:

```text
camera position = origin
planet group position = -virtualCameraPosition
atmosphere center uniform = planet group position
stars position = camera position
```

The ship flyby is animated in the stored camera basis. This preserves the
authored composition while avoiding enormous camera coordinates.

Stars are tethered to the camera in multiple scenes to remove deep-space
parallax and prevent them from crossing the far envelope.

## Projection and lifecycle ownership

The flight rig’s global camera uses:

```text
FOV 38
near 0.2
far 3.0e7
```

It prewarms pipelines by temporarily aiming at representative bodies, then
restores both position and quaternion in `finally`.

The cinematic scene manager:

```text
dispose active scene
clear scene-root children
create next scene
await init
```

Every scene that changes projection or background restores it on disposal.
This ownership prevents one shot’s lens from leaking into another.

## Failure modes and diagnostics

Observed boundaries:

- The thrust-lag scalar spring is semi-implicit Euler; clamp `dt` during long
  frame stalls.
- The chase mount’s final 180-degree correction depends on model conventions.
- Side-camera local/world ownership is easy to break when adapting the ship
  hierarchy.
- Authored cinematic world coordinates are scene-specific; preserve the
  camera-frame staging method, not literal positions.
- Hard camera anchoring is correct for launch composition but unsuitable when
  inertial camera feel is the goal.
- Global-Y pointer movement is not valid for walking on a spherical planet.

Expose:

```text
camera mode and owner
design-frame guides and subject screen bounds
camera local basis
body-up/tangent/right vectors
chase mount and thrust-lag distance/velocity
side/orbit target pose and blend
handoff start, target, t, and easing
FOV/near/far and depth precision
constraint contacts
floating-origin offset
camera-relative background state
```
