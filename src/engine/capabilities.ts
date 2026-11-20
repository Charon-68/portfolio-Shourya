/**
 * Device capability probe + quality-tier selection.
 * Deliberately has NO three.js import so the app can decide whether to download
 * the engine at all (no WebGL → static fallback, zero 3D bytes).
 */

export type QualityTier = 'high' | 'medium' | 'low';

export type QualitySettings = {
  /** Upper bound for devicePixelRatio. */
  dprCap: number;
  /** Multiplier applied uniformly to every instanced-geometry population (keeps species ratios). */
  density: number;
  /** Multiplier for point sprites (meadow carpet, dust). One vertex each — cheap, so kept high. */
  pointDensity: number;
  /** EffectComposer chain (bloom + cinematic post shader). */
  postFx: boolean;
};

/** high = the tuned original. Lower tiers only scale counts / resolution / post — never shader constants. */
export const QUALITY: Record<QualityTier, QualitySettings> = {
  high: { dprCap: 2, density: 1, pointDensity: 1, postFx: true },
  medium: { dprCap: 1.5, density: 0.6, pointDensity: 0.9, postFx: true },
  low: { dprCap: 1, density: 0.35, pointDensity: 0.8, postFx: false },
};

export type WebGLCapabilities = {
  webgl: boolean;
  webgl2: boolean;
  /** SwiftShader / llvmpipe / etc. — CPU rasteriser. */
  software: boolean;
  renderer: string;
};

const SOFTWARE_RE = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i;

export function probeWebGL(): WebGLCapabilities {
  try {
    const canvas = document.createElement('canvas');
    const gl2 = canvas.getContext('webgl2');
    const gl = gl2 || canvas.getContext('webgl');
    if (!gl) return { webgl: false, webgl2: false, software: false, renderer: '' };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return { webgl: true, webgl2: !!gl2, software: SOFTWARE_RE.test(renderer), renderer };
  } catch {
    return { webgl: false, webgl2: false, software: false, renderer: '' };
  }
}

/** Kept for the engine's own fallback path when no capabilities are passed in. */
export function detectSoftwareWebGL(): boolean {
  const caps = probeWebGL();
  return !caps.webgl || caps.software;
}

/**
 * Picks a starting tier. Override for testing with `?quality=high|medium|low`.
 * The engine may additionally step down at runtime (DPR / post-fx only) if fps stays low.
 */
export function chooseQualityTier(caps: WebGLCapabilities): QualityTier {
  const override = new URLSearchParams(window.location.search).get('quality');
  if (override === 'high' || override === 'medium' || override === 'low') return override;

  if (caps.software) return 'low';

  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const shortSide = Math.min(window.screen.width, window.screen.height);
  if (coarse && shortSide < 820) return 'low';

  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 8;
  if (coarse || cores <= 4 || memory <= 4) return 'medium';

  return 'high';
}
