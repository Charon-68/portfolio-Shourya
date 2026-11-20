import * as THREE from 'three';

/**
 * Generates a high-detail 4x4 naturalistic botanical sprite atlas (2048x2048).
 *
 * Rows 0-1: 8 distinct meadow & woodland wildflowers (wild poppy, wood anemone,
 * Shasta daisies, lupine spire, meadow clover, field buttercup, Queen Anne's lace, cornflower).
 * Petals are painted with neutral-ivory shading + fine capillary veins so the shader can
 * apply natural meadow palettes while preserving green-dominant stems/foliage.
 *
 * Rows 2-3: 8 diverse greenery & groundcover textures (bracken fern, foxtail seed grasses,
 * wood-sorrel clover, leafy shrub shoots, cushion moss, airy seed umbels, forest ivy, seed clock).
 */
export function createBotanicalAtlasTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const size = 2048;
  const cols = 4;
  const rows = 4;
  const cellW = size / cols; // 512
  const cellH = size / rows; // 512

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);

  const withCell = (col: number, row: number, draw: (cx: number, cy: number) => void) => {
    ctx.save();
    ctx.translate(col * cellW, row * cellH);
    ctx.beginPath();
    ctx.rect(0, 0, cellW, cellH);
    ctx.clip();
    draw(cellW / 2, cellH / 2);
    ctx.restore();
  };

  // --- ROW 0 & 1: NATURALISTIC WILDFLOWERS ---

  // (0,0) Wild Poppy: crinkled tissue-like overlapping petals, dark base blotches, stamen halo
  withCell(0, 0, (cx, cy) => {
    for (let i = 0; i < 4; i++) {
      const a = ((i + 0.5) / 4) * Math.PI * 2 + 0.2;
      drawSerratedLeaf(ctx, cx, cy, a, 210, 44, '#1b3f15', '#3e6e29');
    }
    const petalAngles = [-1.45, 0.12, 1.65, 3.18];
    const petalLens = [182, 174, 186, 170];
    for (let i = 0; i < 4; i++) {
      drawCrinkledPoppyPetal(ctx, cx, cy, petalAngles[i], petalLens[i], 134, '#f7f3ec', '#9e958b');
    }
    // Deep smoky-amber poppy center pod & golden stamen ring
    drawNaturalEye(ctx, cx, cy, 42, '#695c34', '#262116', '#e6c25a', 20);
  });

  // (1,0) Wood Anemone / Wild Rosehip Blossom with finely veined leaves
  withCell(1, 0, (cx, cy) => {
    for (let i = 0; i < 5; i++) {
      const a = ((i + 0.48) / 5) * Math.PI * 2 - Math.PI / 2;
      drawSerratedLeaf(ctx, cx, cy, a, 218, 52, '#1a3d14', '#406f2b');
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + ((i % 2) * 0.08 - 0.04);
      const len = 166 + (i % 3) * 10;
      drawVeinedPetal(ctx, cx, cy, a, len, 88, '#f8f5ef', '#b8afa4');
    }
    drawNaturalEye(ctx, cx, cy, 34, '#f0cc5c', '#997428', '#fff0a8', 18);
  });

  // (2,0) Shasta Meadow Daisy Spray (3 staggered blooms on slender stalks)
  withCell(2, 0, (cx, cy) => {
    const stems = [
      { bx: -14, by: 198, fx: -78, fy: -32, r: 102, rot: -0.2 },
      { bx: 0, by: 204, fx: 72, fy: -66, r: 90, rot: 0.35 },
      { bx: 12, by: 196, fx: 18, fy: 64, r: 92, rot: 0.1 },
    ];
    for (const s of stems) {
      ctx.strokeStyle = '#2c591e';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx + s.bx, cy + s.by);
      ctx.quadraticCurveTo(cx + s.fx * 0.45, cy + 84, cx + s.fx, cy + s.fy);
      ctx.stroke();
      drawSerratedLeaf(ctx, cx + s.bx * 0.5, cy + 125, s.rot - 0.85, 92, 22, '#1a3e14', '#44752d');
    }

    for (const s of stems) {
      const fx = cx + s.fx;
      const fy = cy + s.fy;
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 + s.rot + Math.sin(i * 3.1) * 0.04;
        const len = s.r * (0.9 + ((i * 7) % 5) * 0.045);
        drawDaintyStrapPetal(ctx, fx, fy, a, len, s.r * 0.21, '#f7f4ee', '#b2aba0');
      }
      drawNaturalEye(ctx, fx, fy, s.r * 0.27, '#ecc246', '#946719', '#fae28a', 14);
    }
  });

  // (3,0) Lupine Raceme Spire with Palmate Basal Foliage
  withCell(3, 0, (cx, cy) => {
    for (let i = 0; i < 5; i++) {
      const a = -0.9 + i * 0.45;
      drawSerratedLeaf(ctx, cx, cy + 178, a, 140, 20, '#183b12', '#3f6e29');
    }
    ctx.strokeStyle = '#29541c';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 195);
    ctx.quadraticCurveTo(cx - 8, cy + 20, cx + 4, cy - 185);
    ctx.stroke();

    const tiers = 11;
    for (let t = 0; t < tiers; t++) {
      const u = t / (tiers - 1);
      const y = cy + 68 - u * 238;
      const spread = (1 - u * 0.68) * 56;
      const floretSize = (1 - u * 0.45) * 34;
      for (const side of [-1, 0, 1]) {
        if (side === 0 && t % 2 === 1) continue;
        const fx = cx + side * spread * (0.65 + (t % 2) * 0.25);
        const colTip = u > 0.82 ? '#6b8e4e' : '#f4f0ea';
        const colBase = u > 0.82 ? '#345e24' : '#a8a098';
        drawVeinedPetal(ctx, fx, y, side * 0.72 - 0.1, floretSize * 1.4, floretSize * 0.9, colTip, colBase);
      }
    }
  });

  // (0,1) Nodding Bluebell / Woodland Bellflower Spray
  withCell(0, 1, (cx, cy) => {
    ctx.strokeStyle = '#2b571d';
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 46, cy + 196);
    ctx.bezierCurveTo(cx - 58, cy + 32, cx - 20, cy - 132, cx + 88, cy - 146);
    ctx.stroke();

    drawSerratedLeaf(ctx, cx - 44, cy + 186, -0.52, 165, 30, '#183c13', '#42732b');
    drawSerratedLeaf(ctx, cx - 40, cy + 186, 0.34, 150, 28, '#183c13', '#3d6b27');

    const bells = [
      { x: -16, y: -90, r: 54, rot: 2.68 },
      { x: 26, y: -130, r: 46, rot: 2.88 },
      { x: 74, y: -144, r: 38, rot: 3.06 },
      { x: -42, y: -20, r: 58, rot: 2.58 },
    ];
    for (const b of bells) {
      drawFairyBell(ctx, cx + b.x, cy + b.y, b.r, b.rot);
    }
  });

  // (1,1) Wild Field Buttercup with Waxy Highlight & Cleft Leaf
  withCell(1, 1, (cx, cy) => {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.42;
      drawSerratedLeaf(ctx, cx, cy, a, 206, 52, '#193e13', '#42732c');
    }
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2 + Math.sin(i * 2.3) * 0.08;
      drawVeinedPetal(ctx, cx, cy, a, 174 + (i % 2) * 8, 110, '#faf7f0', '#b8af9e');
    }
    drawNaturalEye(ctx, cx, cy, 38, '#f0ce60', '#966c1a', '#fff2b0', 22);
  });

  // (2,1) Queen Anne's Lace / Wild Yarrow Flat-Topped Umbel with Feathery Leaf
  withCell(2, 1, (cx, cy) => {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3;
      drawDetailedFern(ctx, cx, cy + 40, a, 190, 44);
    }
    const clusters = [
      { x: -82, y: -48 }, { x: -24, y: -88 }, { x: 46, y: -82 }, { x: 94, y: -32 },
      { x: -102, y: 18 }, { x: -34, y: -18 }, { x: 32, y: -12 }, { x: 96, y: 34 },
      { x: -58, y: 74 }, { x: 8, y: 66 }, { x: 64, y: 78 },
    ];
    for (const cl of clusters) {
      ctx.strokeStyle = 'rgba(56, 102, 42, 0.72)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 125);
      ctx.quadraticCurveTo(cx + cl.x * 0.42, cy + cl.y * 0.25 + 24, cx + cl.x, cy + cl.y);
      ctx.stroke();

      for (let k = 0; k < 5; k++) {
        const ka = (k / 5) * Math.PI * 2 + cl.x * 0.05;
        ctx.fillStyle = '#f5f2ea';
        ctx.beginPath();
        ctx.ellipse(
          cx + cl.x + Math.cos(ka) * 16,
          cy + cl.y + Math.sin(ka) * 16,
          11,
          8,
          ka,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      ctx.fillStyle = '#cfa84a';
      ctx.beginPath();
      ctx.arc(cx + cl.x, cy + cl.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // (3,1) Wild Knapweed / Cornflower with Frilled Cleft Florets
  withCell(3, 1, (cx, cy) => {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.15;
      drawSerratedLeaf(ctx, cx, cy, a, 198, 28, '#1a3f14', '#40702a');
    }
    const rays = 14;
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2 + ((i % 2) * 0.07);
      const len = 166 + (i % 3) * 16;
      drawDaintyStrapPetal(ctx, cx, cy, a, len, 32, '#f5f2eb', '#9b938c');
    }
    drawNaturalEye(ctx, cx, cy, 42, '#5c4b34', '#2b241b', '#d9be7a', 16);
  });

  // --- ROW 2 & 3: WOODLAND GREENERY & GROUNDCOVER ---

  // (0,2) Lady & Bracken Fern Rosette
  withCell(0, 2, (cx, cy) => {
    const angles = [-0.74, -0.36, 0.02, 0.39, 0.76];
    for (let i = 0; i < angles.length; i++) {
      drawDetailedFern(ctx, cx, cy + 184, angles[i], 312 + (i % 2) * 46, 76);
    }
  });

  // (1,2) Tall Meadow Grasses & Foxtail Seed Panicles
  withCell(1, 2, (cx, cy) => {
    const blades = [
      { dx: -64, bend: -138, h: 280, w: 12, c1: '#112c0c', c2: '#3f6e29' },
      { dx: -40, bend: -88, h: 350, w: 14, c1: '#153610', c2: '#4d7f32' },
      { dx: -16, bend: -26, h: 396, w: 15, c1: '#194013', c2: '#598d3a' },
      { dx: 8, bend: 30, h: 382, w: 15, c1: '#163911', c2: '#4e8133' },
      { dx: 30, bend: 86, h: 338, w: 13, c1: '#13310e', c2: '#42702a' },
      { dx: 52, bend: 140, h: 280, w: 12, c1: '#10290b', c2: '#366122' },
    ];
    for (let idx = 0; idx < blades.length; idx++) {
      const b = blades[idx];
      const baseX = cx + b.dx;
      const baseY = cy + 208;
      const grad = ctx.createLinearGradient(baseX, baseY, baseX + b.bend, baseY - b.h);
      grad.addColorStop(0, b.c1);
      grad.addColorStop(0.65, b.c2);
      grad.addColorStop(1, '#75a64e');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(baseX - b.w * 0.5, baseY);
      ctx.quadraticCurveTo(baseX + b.bend * 0.25 - b.w * 0.3, baseY - b.h * 0.55, baseX + b.bend, baseY - b.h);
      ctx.quadraticCurveTo(baseX + b.bend * 0.35 + b.w * 0.3, baseY - b.h * 0.5, baseX + b.w * 0.5, baseY);
      ctx.closePath();
      ctx.fill();

      // Delicate oat/foxtail grain spikelets on alternate tall stalks
      if (idx === 2 || idx === 3) {
        const tx = baseX + b.bend * 0.92;
        const ty = baseY - b.h * 0.92;
        for (let k = 0; k < 6; k++) {
          ctx.fillStyle = k > 3 ? '#c8ba84' : '#7b944e';
          ctx.beginPath();
          ctx.ellipse(tx + (k % 2 === 0 ? -7 : 7), ty + k * 14, 4, 8, (k % 2 === 0 ? -0.4 : 0.4), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  });

  // (2,2) Woodland Clover & Sorrel Groundcover Patch
  withCell(2, 2, (cx, cy) => {
    const clovers = [
      { x: -78, y: -62, rot: -0.4, s: 1.0 },
      { x: 74, y: -48, rot: 0.35, s: 0.95 },
      { x: -8, y: 12, rot: 0.08, s: 1.12 },
      { x: -64, y: 92, rot: -0.25, s: 0.9 },
      { x: 68, y: 96, rot: 0.5, s: 0.88 },
    ];
    for (const c of clovers) {
      drawCloverLeaf(ctx, cx + c.x, cy + c.y, c.rot, 74 * c.s, '#183d12', '#4a7d31');
    }
  });

  // (3,2) Woody Shrub Shoot with Serrated Veined Leaves
  withCell(3, 2, (cx, cy) => {
    ctx.strokeStyle = '#334d22';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 195);
    ctx.quadraticCurveTo(cx - 14, cy, cx + 8, cy - 175);
    ctx.stroke();

    const pairs = 6;
    for (let i = 0; i < pairs; i++) {
      const t = i / (pairs - 1);
      const y = cy + 142 - t * 270;
      const len = 144 * (1 - t * 0.4);
      drawSerratedLeaf(ctx, cx - 2, y, -1.05 + t * 0.3, len, 42 * (1 - t * 0.3), '#173b11', '#45762c');
      drawSerratedLeaf(ctx, cx + 2, y, 1.05 - t * 0.3, len, 42 * (1 - t * 0.3), '#173b11', '#45762c');
    }
    drawSerratedLeaf(ctx, cx + 8, cy - 170, 0.04, 116, 36, '#1b4714', '#528736');
  });

  // (0,3) Cushion Moss & Groundcover Violet Leaves
  withCell(0, 3, (cx, cy) => {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      drawHeartLeaf(ctx, cx, cy, a, 162 + (i % 2) * 26, 68, '#14330f', '#43732c');
    }
  });

  // (1,3) Wild Chervil / Airy Meadow Parsley & Fern Sprig
  withCell(1, 3, (cx, cy) => {
    drawDetailedFern(ctx, cx - 18, cy + 180, -0.22, 316, 66);
    drawDetailedFern(ctx, cx + 20, cy + 180, 0.25, 290, 60);

    const dots = [
      { x: -84, y: -88 }, { x: -32, y: -144 }, { x: 38, y: -136 }, { x: 94, y: -74 },
      { x: -102, y: -10 }, { x: -18, y: -48 }, { x: 54, y: -24 }, { x: 108, y: 18 },
      { x: -58, y: 56 }, { x: 18, y: 46 },
    ];
    for (const d of dots) {
      ctx.strokeStyle = 'rgba(60, 108, 42, 0.65)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 95);
      ctx.quadraticCurveTo(cx + d.x * 0.4, cy + d.y * 0.3, cx + d.x, cy + d.y);
      ctx.stroke();

      for (let k = 0; k < 5; k++) {
        const ka = (k / 5) * Math.PI * 2;
        ctx.fillStyle = '#f3efe6';
        ctx.beginPath();
        ctx.arc(cx + d.x + Math.cos(ka) * 7.5, cy + d.y + Math.sin(ka) * 7.5, 5.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });

  // (2,3) Woodland Ivy & Curled Forest Tendrils
  withCell(2, 3, (cx, cy) => {
    const strands = [-56, -16, 26, 66];
    for (let sIdx = 0; sIdx < strands.length; sIdx++) {
      const sx = cx + strands[sIdx];
      const topY = cy - 210;
      const len = 340 + (sIdx % 2) * 50;
      ctx.strokeStyle = '#204a17';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(sx, topY);
      ctx.quadraticCurveTo(sx + Math.sin(sIdx) * 20, topY + len * 0.5, sx - 6, topY + len);
      ctx.stroke();

      for (let k = 0; k < 9; k++) {
        const t = k / 8;
        const ly = topY + 26 + t * (len - 42);
        const lx = sx + Math.sin(t * 5 + sIdx) * 6;
        const leafSide = k % 2 === 0 ? -1 : 1;
        drawHeartLeaf(ctx, lx, ly, leafSide * 2.35, 38 - t * 10, 18, '#163810', '#44752c');
      }
    }
  });

  // (3,3) Wild Seed Clock & Dried Autumn Stalk
  withCell(3, 3, (cx, cy) => {
    ctx.strokeStyle = '#3b5724';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 200);
    ctx.lineTo(cx, cy + 16);
    ctx.stroke();

    const rays = 32;
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2;
      const r = 130 + (i % 3) * 16;
      ctx.strokeStyle = 'rgba(232, 224, 206, 0.52)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 10);
      ctx.lineTo(cx + Math.cos(a) * r, cy - 10 + Math.sin(a) * r);
      ctx.stroke();

      const tx = cx + Math.cos(a) * r;
      const ty = cy - 10 + Math.sin(a) * r;
      ctx.strokeStyle = 'rgba(244, 238, 224, 0.78)';
      ctx.lineWidth = 1.1;
      for (let k = -2; k <= 2; k++) {
        const ka = a + k * 0.24;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + Math.cos(ka) * 16, ty + Math.sin(ka) * 16);
        ctx.stroke();
      }
    }
    drawSerratedLeaf(ctx, cx, cy + 12, -2.3, 44, 15, '#193d12', '#42702b');
    drawSerratedLeaf(ctx, cx, cy + 12, 2.3, 44, 15, '#193d12', '#42702b');
    ctx.fillStyle = '#a38958';
    ctx.beginPath();
    ctx.arc(cx, cy - 10, 12, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates a tileable fine botanical & terrain micro-detail texture:
 *  - R channel: organic moss / lichen / petal micro-speckle
 *  - G channel: fibrous venation striations (used along 3D petal/leaf UVs)
 *  - B channel: soil & fine rock grain
 */
export function createSurfaceDetailTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const data = img.data;

  const hash = (x: number, y: number) => {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  };

  const smoothNoise = (x: number, y: number, period: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const x0 = ((xi % period) + period) % period;
    const x1 = (x0 + 1) % period;
    const y0 = ((yi % period) + period) % period;
    const y1 = (y0 + 1) % period;
    const a = hash(x0, y0);
    const b = hash(x1, y0);
    const c = hash(x0, y1);
    const d = hash(x1, y1);
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const u = x / size;
      const v = y / size;

      // R: multi-octave organic moss clump mask
      const moss =
        smoothNoise(u * 8, v * 8, 8) * 0.55 +
        smoothNoise(u * 24, v * 24, 24) * 0.3 +
        smoothNoise(u * 64, v * 64, 64) * 0.15;

      // G: fine longitudinal petal/leaf veins
      const veinWave = Math.sin((u - 0.5) * 46.0 + smoothNoise(u * 12, v * 12, 12) * 3.0) * 0.5 + 0.5;
      const centerRib = Math.exp(-Math.pow((u - 0.5) * 14.0, 2));
      const veins = Math.min(1, veinWave * 0.45 + centerRib * 0.55);

      // B: crisp rocky soil micro-grain
      const soilGrain =
        smoothNoise(u * 32 + 5, v * 32 + 9, 32) * 0.55 +
        smoothNoise(u * 96 + 3, v * 96 + 7, 96) * 0.45;

      data[idx] = Math.round(moss * 255);
      data[idx + 1] = Math.round(veins * 255);
      data[idx + 2] = Math.round(soilGrain * 255);
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

export function createDustTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;

  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0.0, 'rgba(255, 242, 206, 0.85)');
  grad.addColorStop(0.32, 'rgba(246, 208, 138, 0.38)');
  grad.addColorStop(0.65, 'rgba(180, 175, 118, 0.08)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function createLightRayTexture(): THREE.CanvasTexture {
  const width = 256;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const hGrad = ctx.createLinearGradient(0, 0, width, 0);
  hGrad.addColorStop(0.0, 'rgba(255, 224, 170, 0)');
  hGrad.addColorStop(0.3, 'rgba(255, 220, 165, 0.08)');
  hGrad.addColorStop(0.5, 'rgba(255, 232, 185, 0.16)');
  hGrad.addColorStop(0.7, 'rgba(255, 220, 165, 0.08)');
  hGrad.addColorStop(1.0, 'rgba(255, 224, 170, 0)');

  ctx.fillStyle = hGrad;
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation = 'destination-in';
  const vGrad = ctx.createLinearGradient(0, 0, 0, height);
  vGrad.addColorStop(0.0, 'rgba(0,0,0,0)');
  vGrad.addColorStop(0.24, 'rgba(0,0,0,0.85)');
  vGrad.addColorStop(0.78, 'rgba(0,0,0,0.4)');
  vGrad.addColorStop(1.0, 'rgba(0,0,0,0)');
  ctx.fillStyle = vGrad;
  ctx.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function drawCrinkledPoppyPetal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angle: number,
  length: number,
  width: number,
  tipColor: string,
  baseColor: string,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  const grad = ctx.createRadialGradient(0, -length * 0.25, 6, 0, -length * 0.55, length);
  grad.addColorStop(0, baseColor);
  grad.addColorStop(0.28, tipColor);
  grad.addColorStop(0.88, tipColor);
  grad.addColorStop(1, '#d8d0c6');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-width * 0.68, -length * 0.3, -width * 0.96, -length * 0.78, -width * 0.34, -length * 0.96);
  ctx.quadraticCurveTo(-width * 0.08, -length * 0.89, 0, -length * 1.0);
  ctx.quadraticCurveTo(width * 0.14, -length * 0.91, width * 0.36, -length * 0.97);
  ctx.bezierCurveTo(width * 0.94, -length * 0.76, width * 0.68, -length * 0.28, 0, 0);
  ctx.fill();

  // Silky crinkled radial creases
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.09)';
  ctx.lineWidth = 1.2;
  for (const offset of [-0.42, -0.2, 0.02, 0.22, 0.44]) {
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.quadraticCurveTo(width * offset * 0.55, -length * 0.48, width * offset, -length * 0.86);
    ctx.stroke();
  }
  ctx.restore();
}

function drawVeinedPetal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angle: number,
  length: number,
  width: number,
  tipColor: string,
  baseColor: string,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  const grad = ctx.createLinearGradient(0, 0, 0, -length);
  grad.addColorStop(0, baseColor);
  grad.addColorStop(0.45, tipColor);
  grad.addColorStop(1, '#ede8df');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-width * 0.74, -length * 0.3, -width * 0.82, -length * 0.88, -width * 0.08, -length);
  ctx.quadraticCurveTo(0, -length * 0.96, width * 0.1, -length * 0.99);
  ctx.bezierCurveTo(width * 0.82, -length * 0.86, width * 0.74, -length * 0.3, 0, 0);
  ctx.fill();

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 1.1;
  for (const offset of [-0.24, 0, 0.24]) {
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.quadraticCurveTo(width * offset * 0.5, -length * 0.5, width * offset, -length * 0.84);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDaintyStrapPetal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angle: number,
  length: number,
  width: number,
  tipColor: string,
  baseColor: string,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  const grad = ctx.createLinearGradient(0, 0, 0, -length);
  grad.addColorStop(0, baseColor);
  grad.addColorStop(0.5, tipColor);
  grad.addColorStop(1, tipColor);
  ctx.fillStyle = grad;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-width, -length * 0.45, -width * 0.75, -length, 0, -length);
  ctx.bezierCurveTo(width * 0.75, -length, width, -length * 0.45, 0, 0);
  ctx.fill();
  ctx.restore();
}

function drawFairyBell(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  rot: number,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);

  ctx.fillStyle = '#24521c';
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.24, size * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();

  const grad = ctx.createLinearGradient(0, 0, 0, -size);
  grad.addColorStop(0, '#968d85');
  grad.addColorStop(0.55, '#eeeae1');
  grad.addColorStop(1, '#faf8f2');
  ctx.fillStyle = grad;

  ctx.beginPath();
  ctx.moveTo(-size * 0.22, -4);
  ctx.bezierCurveTo(-size * 0.35, -size * 0.48, -size * 0.62, -size * 0.85, -size * 0.54, -size);
  ctx.quadraticCurveTo(-size * 0.28, -size * 0.82, 0, -size * 1.04);
  ctx.quadraticCurveTo(size * 0.28, -size * 0.82, size * 0.54, -size);
  ctx.bezierCurveTo(size * 0.62, -size * 0.85, size * 0.35, -size * 0.48, size * 0.22, -4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawNaturalEye(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  innerColor: string,
  ringColor: string,
  pollenColor: string,
  stamens: number,
) {
  ctx.save();
  const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius);
  grad.addColorStop(0, innerColor);
  grad.addColorStop(0.68, ringColor);
  grad.addColorStop(0.92, '#3b2b18');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < stamens; i++) {
    const a = (i / stamens) * Math.PI * 2;
    const r = radius * 0.82;
    ctx.fillStyle = pollenColor;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSerratedLeaf(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angle: number,
  length: number,
  width: number,
  baseColor: string,
  tipColor: string,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  const grad = ctx.createLinearGradient(0, 0, 0, -length);
  grad.addColorStop(0, baseColor);
  grad.addColorStop(0.6, tipColor);
  grad.addColorStop(1, tipColor);
  ctx.fillStyle = grad;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  const teeth = 7;
  for (let i = 1; i <= teeth; i++) {
    const t = i / teeth;
    const w = Math.sin(t * Math.PI) * width;
    ctx.lineTo(-w * 1.06, -length * (t - 0.04));
    ctx.lineTo(-w * 0.84, -length * t);
  }
  ctx.lineTo(0, -length);
  for (let i = teeth; i >= 1; i--) {
    const t = i / teeth;
    const w = Math.sin(t * Math.PI) * width;
    ctx.lineTo(w * 0.84, -length * t);
    ctx.lineTo(w * 1.06, -length * (t - 0.04));
  }
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(150, 200, 108, 0.32)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.lineTo(0, -length * 0.9);
  for (let i = 1; i <= 4; i++) {
    const y = -length * (i * 0.18);
    const span = Math.sin((i / 5) * Math.PI) * width * 0.68;
    ctx.moveTo(0, y);
    ctx.lineTo(-span, y - length * 0.09);
    ctx.moveTo(0, y);
    ctx.lineTo(span, y - length * 0.09);
  }
  ctx.stroke();
  ctx.restore();
}

function drawHeartLeaf(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angle: number,
  length: number,
  width: number,
  baseColor: string,
  tipColor: string,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  const grad = ctx.createLinearGradient(0, 0, 0, -length);
  grad.addColorStop(0, baseColor);
  grad.addColorStop(0.65, tipColor);
  grad.addColorStop(1, tipColor);
  ctx.fillStyle = grad;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-width * 1.15, -length * 0.25, -width * 0.95, -length * 0.72, 0, -length);
  ctx.bezierCurveTo(width * 0.95, -length * 0.72, width * 1.15, -length * 0.25, 0, 0);
  ctx.fill();

  ctx.strokeStyle = 'rgba(155, 205, 110, 0.28)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(0, -length * 0.86);
  ctx.stroke();
  ctx.restore();
}

function drawCloverLeaf(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angle: number,
  radius: number,
  baseColor: string,
  tipColor: string,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    ctx.save();
    ctx.rotate(a);
    const grad = ctx.createLinearGradient(0, 0, 0, -radius);
    grad.addColorStop(0, baseColor);
    grad.addColorStop(0.7, tipColor);
    grad.addColorStop(1, tipColor);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-radius * 0.72, -radius * 0.35, -radius * 0.65, -radius * 1.05, -radius * 0.08, -radius * 0.92);
    ctx.lineTo(0, -radius * 0.8);
    ctx.lineTo(radius * 0.08, -radius * 0.92);
    ctx.bezierCurveTo(radius * 0.65, -radius * 1.05, radius * 0.72, -radius * 0.35, 0, 0);
    ctx.fill();

    ctx.strokeStyle = 'rgba(165, 212, 138, 0.34)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, -radius * 0.22, radius * 0.38, -Math.PI * 0.78, -Math.PI * 0.22);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawDetailedFern(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angle: number,
  length: number,
  span: number,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  ctx.strokeStyle = 'rgba(38, 76, 26, 0.92)';
  ctx.lineWidth = 3.0;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(8, -length * 0.5, 16, -length);
  ctx.stroke();

  const pairs = 18;
  for (let i = 0; i < pairs; i++) {
    const t = i / (pairs - 1);
    const y = -18 - t * (length - 22);
    const x = 8 * t + 8 * t * t;
    const pinnaLen = (1 - t * 0.76) * (0.42 + Math.sin(t * Math.PI) * 0.68) * span;
    const w = 11 * (1 - t * 0.45);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(side * (1.06 - t * 0.25));
      const grad = ctx.createLinearGradient(0, 0, 0, -pinnaLen);
      grad.addColorStop(0, 'rgba(18, 46, 14, 0.96)');
      grad.addColorStop(0.6, 'rgba(48, 92, 34, 0.94)');
      grad.addColorStop(1, 'rgba(92, 142, 56, 0.9)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(side * w, -pinnaLen * 0.5, 0, -pinnaLen);
      ctx.quadraticCurveTo(-side * w * 0.68, -pinnaLen * 0.45, 0, 0);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}
