import * as THREE from 'three';

/**
 * Seeded deterministic PRNG for natural botanical irregularity during geometry generation
 * (avoids perfectly symmetrical cartoon shapes while remaining deterministic across reloads).
 */
function createRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * 1. Grounded 3D Curved Stem with Alternating Folded Botanical Leaves.
 * Rooted cleanly at (0, 0, 0); stem apex ends cleanly at (STEM_TIP_X, 1.0, 0.0).
 * Vertex attributes:
 *  - `aPart`: 0.0 = fibrous stem stalk, 1.0 = veined stem leaf
 *  - `uv`: [0..1] across width & length for leaf midrib/vein shading
 */
export const STEM_TIP_X = 0.03564026; // Math.sin(Math.PI * 0.65) * 0.04

export function createDetailedStemGeometry(): THREE.BufferGeometry {
  const positions: number[] = [];
  const parts: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let vertexOffset = 0;

  // Tapered slightly curving stalk from y=0 to y=1
  const radialSegs = 4;
  const heightSegs = 7;
  for (let iy = 0; iy <= heightSegs; iy++) {
    const t = iy / heightSegs;
    const radius = THREE.MathUtils.lerp(0.021, 0.008, Math.pow(t, 0.85));
    const curveX = Math.sin(t * Math.PI * 0.65) * 0.04;
    const curveZ = Math.sin(t * Math.PI) * 0.012;

    for (let ir = 0; ir <= radialSegs; ir++) {
      const a = (ir / radialSegs) * Math.PI * 2;
      positions.push(
        curveX + Math.cos(a) * radius,
        t,
        (t < 0.99 ? curveZ : 0) + Math.sin(a) * radius,
      );
      parts.push(0.0);
      uvs.push(ir / radialSegs, t);
    }
  }

  const stride = radialSegs + 1;
  for (let iy = 0; iy < heightSegs; iy++) {
    for (let ir = 0; ir < radialSegs; ir++) {
      const a = vertexOffset + iy * stride + ir;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  vertexOffset += (heightSegs + 1) * stride;

  // Three alternating naturalistic stem leaves at varied heights & yaws
  const leaves = [
    { startY: 0.14, yaw: 0.35, len: 0.38, width: 0.088, arch: 0.21, droop: 0.08 },
    { startY: 0.31, yaw: 2.65, len: 0.33, width: 0.075, arch: 0.18, droop: 0.07 },
    { startY: 0.50, yaw: 4.95, len: 0.25, width: 0.058, arch: 0.13, droop: 0.05 },
  ];

  for (const lf of leaves) {
    const segs = 6;
    const cosY = Math.cos(lf.yaw);
    const sinY = Math.sin(lf.yaw);
    const baseCurveX = Math.sin(lf.startY * Math.PI * 0.65) * 0.04;
    const baseCurveZ = Math.sin(lf.startY * Math.PI) * 0.012;

    for (let i = 0; i <= segs; i++) {
      const u = i / segs;
      // Lanceolate wildflower leaf taper with subtle serrature wave
      const serration = 1.0 + Math.sin(u * Math.PI * 6.0) * 0.07;
      const w = Math.sin(Math.pow(u, 0.72) * Math.PI) * lf.width * serration * (1 - u * 0.2);
      const reach = u * lf.len;
      const lift = Math.sin(u * Math.PI * 0.78) * lf.arch - u * u * lf.droop;

      const pts = [
        { lx: reach, ly: lf.startY + lift - w * 0.2, lz: -w, ux: 0.0 },
        { lx: reach, ly: lf.startY + lift + w * 0.1, lz: 0, ux: 0.5 },
        { lx: reach, ly: lf.startY + lift - w * 0.2, lz: w, ux: 1.0 },
      ];

      for (const p of pts) {
        const wx = baseCurveX + p.lx * cosY - p.lz * sinY;
        const wz = baseCurveZ + p.lx * sinY + p.lz * cosY;
        positions.push(wx, p.ly, wz);
        parts.push(1.0);
        uvs.push(p.ux, u);
      }
    }

    for (let i = 0; i < segs; i++) {
      const row = vertexOffset + i * 3;
      const next = row + 3;
      indices.push(row, next, row + 1, row + 1, next, next + 1);
      indices.push(row + 1, next + 1, row + 2, row + 2, next + 1, next + 2);
    }
    vertexOffset += (segs + 1) * 3;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('aPart', new THREE.Float32BufferAttribute(parts, 1));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * 2A. Wild Poppy / Cupped Meadow Blossom Geometry:
 * Irregular overlapping crinkled petals, segmented green sepals, and detailed pistil + stamen ring.
 * Attributes:
 *  - `aPart`: 0.0 = green calyx sepals, 1.0 = flower petals, 2.0 = central pistil / golden pollen ring
 *  - `aRadial`: 0.0 = throat base -> 1.0 = outer petal margin
 *  - `uv`: [0..1] petal surface coordinates for delicate venation
 */
export function createCuppedWildflowerGeometry(): THREE.BufferGeometry {
  const rng = createRng(4102);
  const positions: number[] = [];
  const parts: number[] = [];
  const radialFactors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let vertexOffset = 0;

  const addOrganicPetalRing = (
    count: number,
    baseLen: number,
    baseWidth: number,
    cupHeight: number,
    flarePitch: number,
    phase: number,
    ruffleAmp: number,
  ) => {
    const lengthSegs = 5;

    for (let p = 0; p < count; p++) {
      // Natural angular & size irregularity so blossoms never look stamped
      const angle = (p / count) * Math.PI * 2 + phase + (rng() - 0.5) * 0.24;
      const pLen = baseLen * (0.86 + rng() * 0.26);
      const pWidth = baseWidth * (0.88 + rng() * 0.24);
      const pCup = cupHeight * (0.85 + rng() * 0.3);
      const pTwist = (rng() - 0.5) * 0.16;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      for (let i = 0; i <= lengthSegs; i++) {
        const u = i / lengthSegs;
        const w =
          Math.sin(Math.pow(u, 0.65) * Math.PI) *
          pWidth *
          (0.4 + 0.6 * Math.sin(u * 1.35 + 0.35));
        const r = 0.025 + u * pLen;
        const ripple = Math.sin(u * 9.0 + p * 2.1) * ruffleAmp * u;
        const y =
          Math.sin(u * Math.PI * 0.68) * pCup +
          u * flarePitch -
          u * u * 0.045 +
          ripple * 0.35;

        // 5-vertex cross-section gives genuine curved petal cupping and delicate wavy rim
        const across = [
          { z: -w, dy: w * 0.34 + ripple, ux: 0.0 },
          { z: -w * 0.5, dy: w * 0.09, ux: 0.25 },
          { z: 0, dy: 0, ux: 0.5 },
          { z: w * 0.5, dy: w * 0.09, ux: 0.75 },
          { z: w, dy: w * 0.34 - ripple, ux: 1.0 },
        ];

        for (const a of across) {
          const zTwisted = a.z;
          const dyTwisted = a.dy + a.z * pTwist * u;
          const px = r * cosA - zTwisted * sinA;
          const pz = r * sinA + zTwisted * cosA;
          positions.push(px, y + dyTwisted, pz);
          parts.push(1.0);
          radialFactors.push(u);
          uvs.push(a.ux, u);
        }
      }

      for (let i = 0; i < lengthSegs; i++) {
        const row = vertexOffset + i * 5;
        const next = row + 5;
        for (let k = 0; k < 4; k++) {
          indices.push(row + k, row + k + 1, next + k, row + k + 1, next + k + 1, next + k);
        }
      }
      vertexOffset += (lengthSegs + 1) * 5;
    }
  };

  // Asymmetric outer & inner overlapping wildflower petals
  addOrganicPetalRing(5, 0.25, 0.125, 0.08, 0.045, 0.0, 0.016);
  addOrganicPetalRing(5, 0.175, 0.09, 0.095, 0.075, 0.62, 0.012);

  // Underside pointed green sepals
  const sepalCount = 5;
  for (let s = 0; s < sepalCount; s++) {
    const angle = (s / sepalCount) * Math.PI * 2 + 0.32 + (rng() - 0.5) * 0.14;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const pts = [
      { r: 0.0, y: -0.042, w: 0.016, v: 0.0 },
      { r: 0.068, y: -0.022, w: 0.034, v: 0.5 },
      { r: 0.145, y: -0.004, w: 0.002, v: 1.0 },
    ];
    for (const pt of pts) {
      positions.push(pt.r * cosA + pt.w * sinA, pt.y, pt.r * sinA - pt.w * cosA);
      parts.push(0.0);
      radialFactors.push(0.2);
      uvs.push(0.0, pt.v);

      positions.push(pt.r * cosA - pt.w * sinA, pt.y, pt.r * sinA + pt.w * cosA);
      parts.push(0.0);
      radialFactors.push(0.2);
      uvs.push(1.0, pt.v);
    }
    const b = vertexOffset;
    indices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
    indices.push(b + 2, b + 3, b + 4, b + 3, b + 5, b + 4);
    vertexOffset += 6;
  }

  // Sculpted pistil dome + ring of fine stamen filaments (aPart = 2.0)
  const domeSegs = 8;
  const domeRings = 3;
  for (let r = 0; r <= domeRings; r++) {
    const v = r / domeRings;
    const ringRadius = Math.sin(v * Math.PI * 0.5) * 0.056;
    const ringY = 0.016 + Math.cos(v * Math.PI * 0.5) * 0.044;
    for (let s = 0; s <= domeSegs; s++) {
      const theta = (s / domeSegs) * Math.PI * 2;
      positions.push(Math.cos(theta) * ringRadius, ringY, Math.sin(theta) * ringRadius);
      parts.push(2.0);
      radialFactors.push(v);
      uvs.push(s / domeSegs, v);
    }
  }
  const dStride = domeSegs + 1;
  for (let r = 0; r < domeRings; r++) {
    for (let s = 0; s < domeSegs; s++) {
      const a = vertexOffset + r * dStride + s;
      const b = a + 1;
      const c = a + dStride;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }
  vertexOffset += (domeRings + 1) * dStride;

  // Fine projecting stamen anthers around pistil
  const antherCount = 7;
  for (let k = 0; k < antherCount; k++) {
    const a = (k / antherCount) * Math.PI * 2 + rng() * 0.25;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const r0 = 0.036;
    const r1 = 0.068 + rng() * 0.014;
    const h = 0.055 + rng() * 0.015;
    const w = 0.008;
    const b = vertexOffset;
    positions.push(
      r0 * ca - w * sa, 0.022, r0 * sa + w * ca,
      r0 * ca + w * sa, 0.022, r0 * sa - w * ca,
      r1 * ca - w * 0.7 * sa, h, r1 * sa + w * 0.7 * ca,
      r1 * ca + w * 0.7 * sa, h, r1 * sa - w * 0.7 * ca,
    );
    for (let m = 0; m < 4; m++) {
      parts.push(2.0);
      radialFactors.push(m >= 2 ? 0.9 : 0.3);
      uvs.push(m % 2, m >= 2 ? 1 : 0);
    }
    indices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
    vertexOffset += 4;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('aPart', new THREE.Float32BufferAttribute(parts, 1));
  geo.setAttribute('aRadial', new THREE.Float32BufferAttribute(radialFactors, 1));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * 2B. Meadow Daisy / Chamomile Blossom Geometry:
 * 15 slender arching strap petals with natural length/droop variance and a textured golden disc center.
 */
export function createDaisyHeadGeometry(): THREE.BufferGeometry {
  const rng = createRng(7919);
  const positions: number[] = [];
  const parts: number[] = [];
  const radialFactors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let vertexOffset = 0;

  const petalCount = 15;
  const segs = 3;
  for (let p = 0; p < petalCount; p++) {
    const angle = (p / petalCount) * Math.PI * 2 + (rng() - 0.5) * 0.14;
    const pLen = 0.21 + rng() * 0.065;
    const pWidth = 0.026 + rng() * 0.008;
    const droop = -0.03 + (rng() - 0.5) * 0.045;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    for (let i = 0; i <= segs; i++) {
      const u = i / segs;
      const r = 0.045 + u * pLen;
      const w = Math.sin(Math.pow(u, 0.55) * Math.PI) * pWidth + (1 - u) * 0.008;
      const y = Math.sin(u * Math.PI * 0.8) * 0.024 + u * u * droop;

      const across = [
        { z: -w, dy: w * 0.16, ux: 0.0 },
        { z: 0, dy: 0, ux: 0.5 },
        { z: w, dy: w * 0.16, ux: 1.0 },
      ];
      for (const a of across) {
        positions.push(r * cosA - a.z * sinA, y + a.dy, r * sinA + a.z * cosA);
        parts.push(1.0);
        radialFactors.push(u);
        uvs.push(a.ux, u);
      }
    }

    for (let i = 0; i < segs; i++) {
      const row = vertexOffset + i * 3;
      const next = row + 3;
      indices.push(row, row + 1, next, row + 1, next + 1, next);
      indices.push(row + 1, row + 2, next + 1, row + 2, next + 2, next + 1);
    }
    vertexOffset += (segs + 1) * 3;
  }

  // Underside calyx bracts
  for (let s = 0; s < 6; s++) {
    const angle = (s / 6) * Math.PI * 2;
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);
    const b = vertexOffset;
    positions.push(
      0.01 * ca - 0.016 * sa, -0.028, 0.01 * sa + 0.016 * ca,
      0.01 * ca + 0.016 * sa, -0.028, 0.01 * sa - 0.016 * ca,
      0.095 * ca, -0.008, 0.095 * sa,
    );
    for (let k = 0; k < 3; k++) {
      parts.push(0.0);
      radialFactors.push(0.2);
      uvs.push(k * 0.5, k === 2 ? 1 : 0);
    }
    indices.push(b, b + 1, b + 2);
    vertexOffset += 3;
  }

  // Plump golden disc-floret cushion
  const domeSegs = 10;
  const domeRings = 3;
  for (let r = 0; r <= domeRings; r++) {
    const v = r / domeRings;
    const rr = Math.sin(v * Math.PI * 0.5) * 0.068;
    const ry = 0.006 + Math.cos(v * Math.PI * 0.5) * 0.044;
    for (let s = 0; s <= domeSegs; s++) {
      const th = (s / domeSegs) * Math.PI * 2;
      positions.push(Math.cos(th) * rr, ry, Math.sin(th) * rr);
      parts.push(2.0);
      radialFactors.push(v);
      uvs.push(s / domeSegs, v);
    }
  }
  const stride = domeSegs + 1;
  for (let r = 0; r < domeRings; r++) {
    for (let s = 0; s < domeSegs; s++) {
      const a = vertexOffset + r * stride + s;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('aPart', new THREE.Float32BufferAttribute(parts, 1));
  geo.setAttribute('aRadial', new THREE.Float32BufferAttribute(radialFactors, 1));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * 2C. Lupine / Delphinium Wildflower Raceme Spire Geometry:
 * Vertical spire of tiered cupped florets ascending a central green rachis stalk with unopened tip buds,
 * adding dramatic vertical botanical silhouettes across the meadow.
 */
export function createSpikeClusterGeometry(): THREE.BufferGeometry {
  const rng = createRng(9311);
  const positions: number[] = [];
  const parts: number[] = [];
  const radialFactors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let vertexOffset = 0;

  // Upper floral stalk rachis (aPart = 0.0)
  const rachisH = 0.52;
  const rSegs = 4;
  const rVerts = 5;
  for (let iy = 0; iy <= rVerts; iy++) {
    const t = iy / rVerts;
    const rad = THREE.MathUtils.lerp(0.014, 0.005, t);
    const cx = Math.sin(t * 2.2) * 0.015;
    for (let ir = 0; ir <= rSegs; ir++) {
      const a = (ir / rSegs) * Math.PI * 2;
      positions.push(cx + Math.cos(a) * rad, t * rachisH, Math.sin(a) * rad);
      parts.push(0.0);
      radialFactors.push(t);
      uvs.push(ir / rSegs, t);
    }
  }
  const stride = rSegs + 1;
  for (let iy = 0; iy < rVerts; iy++) {
    for (let ir = 0; ir < rSegs; ir++) {
      const a = vertexOffset + iy * stride + ir;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  vertexOffset += (rVerts + 1) * stride;

  // Whorls of small hooded lupine/bell florets ascending the spire
  const tiers = 7;
  for (let tIdx = 0; tIdx < tiers; tIdx++) {
    const t = tIdx / (tiers - 1);
    const yBase = 0.04 + t * (rachisH - 0.11);
    const tierScale = 1.05 - t * 0.52;
    const floretsInTier = tIdx < 5 ? 3 : 2;

    for (let f = 0; f < floretsInTier; f++) {
      const azimuth = (f / floretsInTier) * Math.PI * 2 + tIdx * 1.15 + (rng() - 0.5) * 0.3;
      const ca = Math.cos(azimuth);
      const sa = Math.sin(azimuth);
      const px = Math.sin(t * 2.2) * 0.015 + ca * 0.025 * tierScale;
      const pz = sa * 0.025 * tierScale;

      // Two cupped hood petals per floret (upper banner + lower wing)
      for (const hood of [0, 1]) {
        const len = (hood === 0 ? 0.115 : 0.095) * tierScale;
        const wid = (hood === 0 ? 0.052 : 0.044) * tierScale;
        const pitch = hood === 0 ? 0.48 : -0.22;

        const base = vertexOffset;
        const outR = len;
        const upY = Math.sin(pitch) * len;

        // 4 vertices forming a pinched cupped hood
        positions.push(
          px, yBase, pz,
          px + ca * outR * 0.55 - sa * wid, yBase + upY * 0.55 + wid * 0.35, pz + sa * outR * 0.55 + ca * wid,
          px + ca * outR * 0.55 + sa * wid, yBase + upY * 0.55 + wid * 0.35, pz + sa * outR * 0.55 - ca * wid,
          px + ca * outR, yBase + upY + (hood === 0 ? 0.02 : -0.018), pz + sa * outR,
        );

        const rads = [0.0, 0.55, 0.55, 1.0];
        const uvPairs = [
          [0.5, 0.0],
          [0.0, 0.55],
          [1.0, 0.55],
          [0.5, 1.0],
        ];
        for (let k = 0; k < 4; k++) {
          parts.push(t > 0.85 ? 0.0 : 1.0); // top unopened buds tinted greenish
          radialFactors.push(rads[k]);
          uvs.push(uvPairs[k][0], uvPairs[k][1]);
        }
        indices.push(base, base + 1, base + 3, base, base + 3, base + 2);
        vertexOffset += 4;
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('aPart', new THREE.Float32BufferAttribute(parts, 1));
  geo.setAttribute('aRadial', new THREE.Float32BufferAttribute(radialFactors, 1));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * 3. Diverse Wild Grass Tuft Geometry (7 varied blades per cluster: tall flowering stems,
 * arching mid blades, short basal shoots with twist variation). Rooted at y = 0.
 */
export function createVariedGrassTuftGeometry(): THREE.BufferGeometry {
  const rng = createRng(5521);
  const positions: number[] = [];
  const heightFactors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let vertexOffset = 0;

  const bladeCount = 7;
  for (let b = 0; b < bladeCount; b++) {
    const yaw = (b / bladeCount) * Math.PI * 2 + (rng() - 0.5) * 0.55;
    const h = 0.45 + (b % 3) * 0.25 + rng() * 0.28;
    const wBase = 0.022 + rng() * 0.018;
    const lean = 0.14 + rng() * 0.24;
    const curve = 0.08 + rng() * 0.14;
    const ox = (rng() - 0.5) * 0.08;
    const oz = (rng() - 0.5) * 0.08;

    const segs = 5;
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);

    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const w = wBase * (1 - Math.pow(t, 1.15) * 0.95);
      const y = t * h;
      const reach = Math.pow(t, 1.55) * lean + Math.sin(t * Math.PI) * curve;

      positions.push(ox + reach * cosY + w * sinY, y, oz + reach * sinY - w * cosY);
      heightFactors.push(t);
      uvs.push(0.0, t);

      positions.push(ox + reach * cosY - w * sinY, y, oz + reach * sinY + w * cosY);
      heightFactors.push(t);
      uvs.push(1.0, t);
    }

    for (let i = 0; i < segs; i++) {
      const row = vertexOffset + i * 2;
      indices.push(row, row + 2, row + 1, row + 1, row + 2, row + 3);
    }
    vertexOffset += (segs + 1) * 2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('aHeight', new THREE.Float32BufferAttribute(heightFactors, 1));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * 4. 3D Woodland Fern & Low Shrub Rosette Geometry:
 * 5 gracefully arching compound fronds with pinna-ribbed silhouette + central leafy shoots.
 * Rooted at y = 0 to bring mid-story foliage variety onto slopes and hollows.
 */
export function createFernRosetteGeometry(): THREE.BufferGeometry {
  const rng = createRng(8842);
  const positions: number[] = [];
  const heightFactors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let vertexOffset = 0;

  const fronds = 5;
  for (let f = 0; f < fronds; f++) {
    const yaw = (f / fronds) * Math.PI * 2 + (rng() - 0.5) * 0.35;
    const len = 0.72 + rng() * 0.36;
    const archH = 0.42 + rng() * 0.22;
    const maxW = 0.14 + rng() * 0.05;
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);

    const segs = 7;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      // Scalloped fern pinna envelope
      const pinnaWave = 0.68 + 0.32 * Math.sin(t * Math.PI * 10.0);
      const w = Math.sin(Math.pow(t, 0.55) * Math.PI) * maxW * (1 - t * 0.3) * pinnaWave;
      const reach = 0.06 + t * len;
      const y = Math.sin(t * Math.PI * 0.76) * archH + t * 0.08;

      const pts = [
        { z: -w, dy: -w * 0.18, ux: 0.0 },
        { z: 0, dy: w * 0.12, ux: 0.5 },
        { z: w, dy: -w * 0.18, ux: 1.0 },
      ];
      for (const p of pts) {
        positions.push(reach * cosY - p.z * sinY, y + p.dy, reach * sinY + p.z * cosY);
        heightFactors.push(Math.min(1, y / 0.65));
        uvs.push(p.ux, t);
      }
    }

    for (let i = 0; i < segs; i++) {
      const row = vertexOffset + i * 3;
      const next = row + 3;
      indices.push(row, next, row + 1, row + 1, next, next + 1);
      indices.push(row + 1, next + 1, row + 2, row + 2, next + 1, next + 2);
    }
    vertexOffset += (segs + 1) * 3;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('aHeight', new THREE.Float32BufferAttribute(heightFactors, 1));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}
