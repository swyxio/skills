import * as THREE from "three";
import {
  createHologramMaterial,
  HOLOGRAM_DEBUG_MODES,
} from "./hologram-material.js";

/**
 * Shape-cycling projection: a fixed set of meshes sharing one hologram shell
 * shader, one shared vertical sweep range, and one linear progress ramp that
 * dissolves the current shape upward while the next one materialises behind it.
 *
 * The set is preallocated. Nothing is created, disposed, or reparented during a
 * transition — the handover is entirely a uniform state change plus two
 * complementary fragment discards, so a projection with a large shape library
 * has a flat per-frame cost.
 */

/** Cycle timing. The dwell is `1 / cycleSpeed`, of which `sweepDuration` moves. */
export const HOLOGRAM_TRANSITION = {
  /** Shapes advanced per second: one handover every four seconds. */
  cycleSpeed: 0.25,
  /** Seconds the sweep takes to travel the full shared height range. */
  sweepDuration: 1.5,
  /** The ramp is deliberately linear: the sweep line must move at one speed. */
  sweepEase: "linear",
  /** Radians per second applied to both spin axes of a spinning shape. */
  rotationSpeed: 0.5,
  /** Metres the projected set is lifted above its stage. */
  positionY: 0.5,
  /**
   * Metres of slack added to each end of the shared sweep range. Without it the
   * first and last rows of the tallest shape sit exactly at progress 0 and 1,
   * where the sweep would clip a whole row on or off in one frame.
   */
  boundingMargin: 0.1,
};

/**
 * Compute the sweep range shared by every shape in the set.
 *
 * The range must span the union of all bounding boxes, not each shape's own
 * extent. A per-shape range would normalise two different heights to the same
 * 0..1, so the sweep line would jump vertically at the instant of handover.
 */
export function computeSharedSweepRange(
  geometries,
  { positionY = HOLOGRAM_TRANSITION.positionY, boundingMargin = HOLOGRAM_TRANSITION.boundingMargin } = {},
) {
  let minY = Infinity;
  let maxY = -Infinity;
  for (const geometry of geometries) {
    if (!geometry.boundingBox) geometry.computeBoundingBox();
    minY = Math.min(minY, geometry.boundingBox.min.y);
    maxY = Math.max(maxY, geometry.boundingBox.max.y);
  }
  return {
    minY: minY + positionY - boundingMargin,
    maxY: maxY + positionY + boundingMargin,
  };
}

/**
 * Build the projection set.
 *
 * `shapes` is an ordered list of `{ geometry, spin }`. Order is the cycle order,
 * and the index each mesh is given is its position in that list. `spin` opts a
 * shape into the shared two-axis rotation; a shape whose silhouette is already
 * symmetric under it gains nothing and is left static.
 */
export function createHologramProjection({
  shapes,
  color = "#00d5ff",
  positionY = HOLOGRAM_TRANSITION.positionY,
  boundingMargin = HOLOGRAM_TRANSITION.boundingMargin,
  cycleSpeed = HOLOGRAM_TRANSITION.cycleSpeed,
  sweepDuration = HOLOGRAM_TRANSITION.sweepDuration,
  rotationSpeed = HOLOGRAM_TRANSITION.rotationSpeed,
} = {}) {
  if (!Array.isArray(shapes) || shapes.length < 2) {
    throw new Error("A hologram projection needs at least two shapes to cycle between.");
  }

  const object = new THREE.Group();
  const { minY, maxY } = computeSharedSweepRange(
    shapes.map((shape) => shape.geometry),
    { positionY, boundingMargin },
  );

  // Write the shared range before cloning: a ShaderMaterial clone deep-copies
  // its uniform values, so anything set afterwards would only reach one shape.
  const baseMaterial = createHologramMaterial({ color });
  baseMaterial.uniforms.uMinY.value = minY;
  baseMaterial.uniforms.uMaxY.value = maxY;

  const materials = [];
  const spinning = [];
  shapes.forEach((shape, index) => {
    const material = baseMaterial.clone();
    material.uniforms.uIndex.value = index;
    const mesh = new THREE.Mesh(shape.geometry, material);
    mesh.position.y = positionY;
    object.add(mesh);
    materials.push(material);
    if (shape.spin) spinning.push(mesh);
  });

  const totalShapes = shapes.length;
  const state = { currentIndex: 0, nextIndex: 1, sweepStart: 0 };

  const beginTransition = (elapsed) => {
    state.sweepStart = elapsed;
    for (const material of materials) {
      material.uniforms.uCurrentIndex.value = state.currentIndex;
      material.uniforms.uNextIndex.value = state.nextIndex;
      material.uniforms.uProgress.value = 0;
    }
  };
  beginTransition(0);

  return {
    object,
    materials,
    sweepRange: { minY, maxY },

    update({ delta, elapsed }) {
      // The cycle index is read from absolute elapsed time rather than
      // accumulated, so a dropped frame cannot desynchronise the shape order
      // from the sweep it is supposed to ride.
      const cycleIndex = Math.floor((elapsed * cycleSpeed) % totalShapes);
      if (cycleIndex !== state.currentIndex) {
        state.currentIndex = cycleIndex;
        state.nextIndex = cycleIndex === totalShapes - 1 ? 0 : cycleIndex + 1;
        beginTransition(elapsed);
      }

      // Linear 0..1 over the sweep duration, then held at 1 for the rest of the
      // dwell: the outgoing shape stays fully dissolved instead of reappearing.
      const progress = Math.min((elapsed - state.sweepStart) / sweepDuration, 1);

      for (const mesh of spinning) {
        mesh.rotation.y += delta * rotationSpeed;
        mesh.rotation.x += delta * rotationSpeed;
      }
      for (const material of materials) {
        material.uniforms.uTime.value = elapsed;
        material.uniforms.uProgress.value = progress;
      }
    },

    setDebugMode(mode) {
      const value = HOLOGRAM_DEBUG_MODES[mode] ?? 0;
      for (const material of materials) {
        material.uniforms.uDebugMode.value = value;
      }
    },

    setColor(color) {
      for (const material of materials) {
        material.uniforms.uColor.value = new THREE.Color(color);
      }
    },

    dispose() {
      baseMaterial.dispose();
      for (const material of materials) material.dispose();
      object.traverse((child) => {
        if (child.isMesh) child.geometry.dispose();
      });
    },
  };
}
