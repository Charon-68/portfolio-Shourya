import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ValleyAudioStore } from './AudioEngine';
import {
  createCuppedWildflowerGeometry,
  createDaisyHeadGeometry,
  createDetailedStemGeometry,
  createFernRosetteGeometry,
  createSpikeClusterGeometry,
  createVariedGrassTuftGeometry,
  STEM_TIP_X,
} from './botanicalGeometries';
import {
  createBotanicalAtlasTexture,
  createDustTexture,
  createLightRayTexture,
  createSurfaceDetailTexture,
} from './botanicalTextures';

/**
 * Tunable elevated panoramic camera configuration.
 * Keeps the camera floating smoothly above the hills with a terrain-anchored downward look target.
 */
const CAMERA_CONFIG = {
  elevationAboveTerrain: 8.6,
  introExtraHeight: 3.4,
  lookAheadProgress: 0.048,
  lookTargetTerrainOffset: 0.45,
  panAmplitude: 5.2,
  panFrequency: 0.14,
  mouseParallaxX: 2.8,
  mouseParallaxY: 1.4,
  baseFovDesktop: 54,
  baseFovMobile: 62,
  driftSpeed: 0.0068,
};

/**
 * Refined cinematic post-processing shader: restrained chromatic dispersion strictly at outer corners,
 * gentle vibrancy polish, delicate film grain, and speed-reactive vignette preserving botanical detail.
 */
const SplitRgbNoiseVignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uSpeed: { value: 0 },
    uHover: { value: 0 },
    uResolution: { value: new THREE.Vector2(1600, 900) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uSpeed;
    uniform float uHover;
    uniform vec2 uResolution;
    varying vec2 vUv;

    float hash12(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    void main() {
      vec2 centered = vUv - 0.5;
      float dist = length(centered);

      // Restrained lens aberration strictly at outer corners so central & midground flora stay razor-sharp
      float edgeMask = smoothstep(0.42, 0.96, dist);
      float rgbAmount = (0.00045 + uSpeed * 0.0012) * edgeMask;
      vec2 offset = centered * rgbAmount;

      vec3 col;
      col.r = texture2D(tDiffuse, clamp(vUv + offset, 0.0, 1.0)).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, clamp(vUv - offset, 0.0, 1.0)).b;

      // Soft outer-frame atmospheric bokeh only at extreme vignette border
      vec2 texel = 1.0 / max(uResolution, vec2(1.0));
      float blurScale = edgeMask * 0.65;
      if (blurScale > 0.10) {
        vec3 blurTap =
          texture2D(tDiffuse, clamp(vUv + vec2(texel.x, texel.y) * blurScale, 0.0, 1.0)).rgb +
          texture2D(tDiffuse, clamp(vUv + vec2(-texel.x, texel.y) * blurScale, 0.0, 1.0)).rgb +
          texture2D(tDiffuse, clamp(vUv + vec2(texel.x, -texel.y) * blurScale, 0.0, 1.0)).rgb +
          texture2D(tDiffuse, clamp(vUv + vec2(-texel.x, -texel.y) * blurScale, 0.0, 1.0)).rgb;
        col = mix(col, blurTap * 0.25, edgeMask * 0.20);
      }

      // Clean saturation polish & gentle tone shaping without crushing forest shadows or blowing out petals
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(lum), col, 1.13);
      vec3 softCurve = col * col * (3.0 - 2.0 * clamp(col, 0.0, 1.0));
      col = mix(col, softCurve, 0.075);

      // Subtle photographic film grain
      float grain = (hash12(vUv * uResolution + fract(uTime * 19.7) * 100.0) - 0.5) * 0.018;
      col += grain;

      // Cinematic vignette gently tightening on faster scroll
      float vignetteInner = mix(0.48, 0.30, clamp(uSpeed * 1.3, 0.0, 1.0));
      float vignetteOuter = mix(1.04, 0.80, clamp(uSpeed * 1.1, 0.0, 1.0));
      float vignette = smoothstep(vignetteOuter, vignetteInner, dist);
      col *= mix(0.36, 1.0, vignette);

      gl_FragColor = vec4(max(col, 0.0), 1.0);
    }
  `,
};

/**
 * Shared GLSL wind gust, world-space cursor parting, and golden-hour atmospheric lighting functions
 * evaluated coherently across terrain, stems, 3D flowers, grass, ferns, rocks, and sprites.
 */
const GLSL_ENVIRONMENT_COMMON = /* glsl */ `
  vec2 rotate2D(vec2 v, float a) {
    float c = cos(a);
    float s = sin(a);
    return vec2(v.x * c - v.y * s, v.x * s + v.y * c);
  }

  vec2 computeWindGust(vec2 worldXZ, float time, float seed) {
    float gust1 = sin(dot(worldXZ, vec2(0.11, 0.075)) - time * 1.35) * 0.5 + 0.5;
    float gust2 = sin(dot(worldXZ, vec2(-0.07, 0.14)) - time * 1.85 + 1.3) * 0.5 + 0.5;
    float wavePower = 0.22 + gust1 * 0.72 + gust2 * 0.35;

    float flutter = sin(time * (2.1 + seed * 1.4) + seed * 17.3 + worldXZ.x * 0.42);
    float crossFlutter = cos(time * (1.65 + seed * 1.1) + seed * 11.7 + worldXZ.y * 0.38);

    vec2 windDir = vec2(0.857, 0.515);
    vec2 windPerp = vec2(-0.515, 0.857);
    return windDir * (wavePower * 0.18 + flutter * 0.036)
         + windPerp * ((gust2 - 0.5) * 0.11 + crossFlutter * 0.028);
  }

  vec2 computeTerrainCursorPush(
    vec3 worldPos,
    vec3 cursorWorld,
    float cursorActive,
    float radius,
    out float cursorGlow
  ) {
    vec2 delta = worldPos.xz - cursorWorld.xz;
    float d2 = dot(delta, delta);
    float d = sqrt(d2 + 0.0001);
    float normD = d / max(radius, 0.5);
    float influence = exp(-normD * normD * 2.0) * cursorActive;
    cursorGlow = exp(-normD * normD * 2.35) * cursorActive;
    vec2 dir = d > 0.001 ? (delta / d) : vec2(0.0, 1.0);
    return dir * influence;
  }

  vec3 applyGoldenHourFog(vec3 color, float depth, vec3 worldPos, vec3 camPos, vec3 sunDir) {
    vec3 rayDir = normalize(worldPos - camPos);
    float sunAlign = pow(clamp(dot(rayDir, sunDir), 0.0, 1.0), 3.0);
    // Low golden mist in hollows fading into cool twilight forest haze with distance
    float valleyMist = exp(-max(0.0, worldPos.y + 1.5) * 0.16) * 0.36;
    float distFog = 1.0 - exp(-0.000128 * depth * depth);
    float totalFog = clamp(distFog + valleyMist * smoothstep(9.0, 54.0, depth), 0.0, 1.0);

    vec3 twilightMist = vec3(0.025, 0.038, 0.031);
    vec3 warmSunMist = vec3(0.215, 0.142, 0.074);
    vec3 fogColor = mix(twilightMist, warmSunMist, sunAlign * 0.88);
    return mix(color, fogColor, totalFog);
  }
`;

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

const SPLINE_RADIUS_X = 44;
const SPLINE_RADIUS_Z = 78;

/**
 * Multi-scale rolling hills & valley geomorphology:
 * Broad sweeping hill crests, natural saddles, and distant mountain shoulders.
 */
function sampleTerrainHeight(x: number, z: number): number {
  const nx = x / SPLINE_RADIUS_X;
  const nz = z / SPLINE_RADIUS_Z;
  const ringDist = Math.abs(Math.hypot(nx, nz) - 1.0);
  const valleyBanks = Math.pow(Math.max(0, ringDist - 0.03) * 2.85, 1.42) * 3.1;

  // Broad majestic hills
  const broadHills =
    Math.sin(x * 0.052 + z * 0.034) * 2.45 +
    Math.cos(z * 0.048 - x * 0.041) * 1.95 +
    Math.sin((x - z) * 0.028) * 1.45;

  // Mid-scale swells & rolling ridges
  const swells =
    Math.sin(x * 0.13 + z * 0.10) * 0.52 +
    Math.cos(z * 0.16 - x * 0.11) * 0.42 +
    Math.sin(x * 0.29 + z * 0.24) * 0.15;

  return broadHills + swells + valleyBanks;
}

/**
 * Smooth terrain sampling for camera height stabilization (averages surrounding 4 samples
 * so the aerial drone camera never bobs nervously over tiny micro-bumps).
 */
function sampleSmoothedTerrainHeight(x: number, z: number): number {
  const r = 4.5;
  return (
    sampleTerrainHeight(x, z) * 0.4 +
    sampleTerrainHeight(x + r, z) * 0.15 +
    sampleTerrainHeight(x - r, z) * 0.15 +
    sampleTerrainHeight(x, z + r) * 0.15 +
    sampleTerrainHeight(x, z - r) * 0.15
  );
}

/**
 * Spatial organic patch field for sweeping wildflower species & vegetation drifts.
 */
function samplePatchField(x: number, z: number): number {
  const n1 = Math.sin(x * 0.14 + Math.cos(z * 0.11) * 1.8);
  const n2 = Math.cos(z * 0.13 - Math.sin(x * 0.10) * 1.6);
  const n3 = Math.sin((x + z) * 0.08) * 0.6;
  const raw = (n1 + n2 + n3) / 5.2 + 0.5;
  return THREE.MathUtils.clamp(raw, 0, 0.99999);
}

function makeInstancedFromBase(
  baseGeo: THREE.BufferGeometry,
  count: number,
): THREE.InstancedBufferGeometry {
  const inst = new THREE.InstancedBufferGeometry();
  inst.index = baseGeo.index;
  for (const name of Object.keys(baseGeo.attributes)) {
    inst.setAttribute(name, baseGeo.attributes[name]);
  }
  inst.instanceCount = count;
  return inst;
}

export class ValleyEngine {
  private container: HTMLElement;
  private onLoaded: () => void;
  private onIntroDone: () => void;
  public audioStore: ValleyAudioStore;

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private postPass: ShaderPass | null = null;

  private isSoftwareGl: boolean;
  private prefersReducedMotion: boolean;
  private isDisposed = false;
  private frameId = 0;

  private curve: THREE.CatmullRomCurve3;
  private pathProgress = 0.04;
  private scrollVelocity = 0;
  private targetScrollImpulse = 0;
  private smoothedSpeed = 0;

  private introProgress = 0;
  private introNotified = false;
  private elapsed = 0;
  private lastTimestamp = 0;

  private targetMouse = new THREE.Vector2(0, 0);
  private currentMouse = new THREE.Vector2(0, 0);
  private pointerHasMoved = false;
  private targetCursorActive = 0;
  private currentCursorActive = 0;
  private cursorSpawnAccumulator = 0;

  private targetHover = 0;
  private currentHover = 0;

  private readonly sunDir = new THREE.Vector3(0.58, 0.25, -0.77).normalize();

  private skyMaterial!: THREE.ShaderMaterial;
  private terrainMaterial!: THREE.ShaderMaterial;
  private stemMaterial!: THREE.ShaderMaterial;
  private headMaterials: THREE.ShaderMaterial[] = [];
  private grassMaterial!: THREE.ShaderMaterial;
  private fernMaterial!: THREE.ShaderMaterial;
  private rockMaterial!: THREE.ShaderMaterial;
  private flowerPointMaterial!: THREE.ShaderMaterial;
  private dustMaterial!: THREE.ShaderMaterial;
  private airStreamMaterial!: THREE.ShaderMaterial;
  private trailMaterial!: THREE.ShaderMaterial;
  private skyDome!: THREE.Mesh;

  private trailGeometry!: THREE.BufferGeometry;
  private trailPosAttr!: THREE.BufferAttribute;
  private trailColAttr!: THREE.BufferAttribute;
  private trailAlphaAttr!: THREE.BufferAttribute;
  private trailPool: Array<{
    isAmbient: boolean;
    active: boolean;
    age: number;
    life: number;
    seed: number;
    width: number;
    color: THREE.Color;
    vel: THREE.Vector3;
    points: THREE.Vector3[];
  }> = [];
  private nextCursorTrailIdx = 42;

  private petalMesh!: THREE.InstancedMesh;
  private petalData: Array<{
    basePos: THREE.Vector3;
    phase: number;
    speed: number;
    rotSpeed: THREE.Vector3;
    scale: number;
    disperse: THREE.Vector3;
  }> = [];
  private lightRays: THREE.Sprite[] = [];

  private disposables: Array<{ dispose: () => void }> = [];

  private readonly _pos = new THREE.Vector3();
  private readonly _lookTarget = new THREE.Vector3();
  private readonly _smoothedLookTarget = new THREE.Vector3();
  private readonly _tangent = new THREE.Vector3();
  private readonly _right = new THREE.Vector3();
  private readonly _up = new THREE.Vector3(0, 1, 0);
  private readonly _dummy = new THREE.Object3D();
  private readonly _rayDir = new THREE.Vector3();
  private readonly _rayPt = new THREE.Vector3();
  private readonly _cursorWorldTarget = new THREE.Vector3();
  private readonly _cursorWorldCurrent = new THREE.Vector3();
  private readonly _prevCursorWorld = new THREE.Vector3();
  private readonly _cursorVel = new THREE.Vector3();
  private readonly _trailForward = new THREE.Vector3();
  private readonly _trailToCam = new THREE.Vector3();
  private readonly _trailSide = new THREE.Vector3();
  private hasInitializedCamera = false;
  private hasInitializedCursor = false;

  private touchLastY = 0;
  private isTouching = false;

  constructor(
    container: HTMLElement,
    onLoaded: () => void,
    onIntroDone: () => void,
  ) {
    this.container = container;
    this.onLoaded = onLoaded;
    this.onIntroDone = onIntroDone;
    this.isSoftwareGl = detectSoftwareWebGL();
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const mountTarget =
      (container.querySelector('.js-canvas-container') as HTMLElement) || container;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const aspect = width / height;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x040705);

    const fov = aspect < 0.9 ? CAMERA_CONFIG.baseFovMobile : CAMERA_CONFIG.baseFovDesktop;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.2, 260);
    this.audioStore = new ValleyAudioStore(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.06;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    );
    this.renderer.setSize(width, height);
    mountTarget.innerHTML = '';
    mountTarget.appendChild(this.renderer.domElement);

    this.curve = this.createValleySpline();

    const detailTex = createSurfaceDetailTexture();
    this.disposables.push(detailTex);

    this.buildSkyAndTerrain(detailTex);
    this.buildBotanicalEcosystem(detailTex);
    this.buildBotanicalPointCarpet();
    this.buildFloatingPetals();
    this.buildDustAndAirStreams();
    this.buildParticleTrails();
    this.buildLightRays();

    if (!this.isSoftwareGl) {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));

      // Selective golden-hour bloom catching pollen domes, sunlit petal rims, focal blossoms & trails
      // without blurring crisp botanical petal silhouettes
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        0.45,
        0.56,
        0.59,
      );
      this.composer.addPass(this.bloomPass);

      this.postPass = new ShaderPass(SplitRgbNoiseVignetteShader);
      this.postPass.uniforms.uResolution.value.set(width, height);
      this.composer.addPass(this.postPass);
    }

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.updateCamera(0.016);

    requestAnimationFrame(() => {
      if (this.isDisposed) return;
      this.onLoaded();
      this.lastTimestamp = performance.now();
      this.tick(this.lastTimestamp);
    });
  }

  /**
   * Builds a smooth elevated horizontal XZ valley track.
   * Camera elevation is computed directly against terrain height in updateCamera()
   * and decoupled from the ground-anchored lookTarget.
   */
  private createValleySpline(): THREE.CatmullRomCurve3 {
    const points: THREE.Vector3[] = [];
    const segments = 40;

    for (let i = 0; i < segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      const x = Math.sin(t) * SPLINE_RADIUS_X + Math.sin(t * 2.0) * 6.5;
      const z = Math.cos(t) * SPLINE_RADIUS_Z + Math.cos(t * 3.0) * 4.5;
      const y = sampleSmoothedTerrainHeight(x, z);
      points.push(new THREE.Vector3(x, y, z));
    }

    return new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.5);
  }

  private buildSkyAndTerrain(detailTex: THREE.CanvasTexture): void {
    // 1. Atmospheric Golden-Hour Dusk Sky Dome
    const skyGeo = new THREE.SphereGeometry(210, 32, 20);
    this.skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uSunDir: { value: this.sunDir },
      },
      vertexShader: /* glsl */ `
        varying vec3 vLocalDir;
        void main() {
          vLocalDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uSunDir;
        varying vec3 vLocalDir;
        void main() {
          float h = clamp(vLocalDir.y * 0.5 + 0.5, 0.0, 1.0);
          float horizonBand = exp(-max(0.0, vLocalDir.y + 0.05) * 7.5);
          float sunGlow = pow(clamp(dot(normalize(vLocalDir), uSunDir), 0.0, 1.0), 8.0);

          vec3 zenithDark = vec3(0.008, 0.014, 0.016);
          vec3 duskSlate = vec3(0.025, 0.038, 0.032);
          vec3 goldenHorizon = vec3(0.20, 0.13, 0.065);

          vec3 col = mix(duskSlate, zenithDark, smoothstep(0.48, 0.76, h));
          col = mix(col, goldenHorizon, horizonBand * (0.42 + sunGlow * 0.85));
          col += vec3(0.45, 0.28, 0.12) * sunGlow * 0.55;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });

    this.skyDome = new THREE.Mesh(skyGeo, this.skyMaterial);
    this.scene.add(this.skyDome);
    this.disposables.push(skyGeo, this.skyMaterial);

    // 2. Expansive Multi-Layered Terrain Surface (loam soil, moss patches, rock scree, meadow turf)
    const geo = new THREE.PlaneGeometry(380, 420, 196, 196);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, sampleTerrainHeight(x, z) - 0.04);
    }
    geo.computeVertexNormals();

    this.terrainMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uDetailTex: { value: detailTex },
        uSunDir: { value: this.sunDir },
        uCursorWorld: { value: new THREE.Vector3() },
        uCursorActive: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying float vDepth;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPos;
        void main() {
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
          vec4 world = modelMatrix * vec4(position, 1.0);
          vWorldPos = world.xyz;
          vec4 mvPos = viewMatrix * world;
          vDepth = -mvPos.z;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uDetailTex;
        uniform vec3 uSunDir;
        uniform vec3 uCursorWorld;
        uniform float uCursorActive;
        varying float vDepth;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPos;

        ${GLSL_ENVIRONMENT_COMMON}

        void main() {
          vec3 n = normalize(vWorldNormal);

          // Multi-scale procedural ground textures (moss clumps, grass turf, exposed loam & pebble grain)
          vec3 texMacro = texture2D(uDetailTex, vWorldPos.xz * 0.032).rgb;
          vec3 texMicro = texture2D(uDetailTex, vWorldPos.xz * 0.24).rgb;

          float slope = 1.0 - clamp(n.y, 0.0, 1.0);
          float mossMask = smoothstep(0.35, 0.72, texMacro.r * 0.7 + texMicro.r * 0.3);
          float rockMask = smoothstep(0.18, 0.44, slope + (texMacro.b - 0.5) * 0.22);
          float loamMask = smoothstep(0.58, 0.85, texMicro.b * 0.65 + texMacro.b * 0.35) * (1.0 - mossMask * 0.5);

          vec3 deepTurf = vec3(0.044, 0.112, 0.036);
          vec3 meadowOlive = vec3(0.095, 0.175, 0.048);
          vec3 cushionMoss = vec3(0.064, 0.152, 0.042);
          vec3 richLoam = vec3(0.052, 0.040, 0.027);
          vec3 slateRock = vec3(0.085, 0.094, 0.084);

          vec3 surface = mix(deepTurf, meadowOlive, texMacro.r * 0.75 + texMicro.g * 0.25);
          surface = mix(surface, cushionMoss, mossMask * 0.55);
          surface = mix(surface, richLoam, loamMask * 0.48);
          surface = mix(surface, slateRock, rockMask * 0.72);

          // Golden-hour key sunlight + crest exposure + uncrushed cool emerald shadow fill
          float ndotl = clamp(dot(n, uSunDir), 0.0, 1.0);
          float hillExposure = smoothstep(-1.5, 4.0, vWorldPos.y);
          vec3 sunLight = vec3(1.24, 0.86, 0.46) * ndotl * (0.38 + hillExposure * 0.85);
          vec3 ambient = mix(vec3(0.042, 0.072, 0.040), vec3(0.092, 0.135, 0.088), n.y * 0.5 + 0.5);

          vec3 col = surface * (ambient + sunLight);

          // Soft warm sunlit cursor lantern pool over nearby terrain & moss
          float cDist = length(vWorldPos.xz - uCursorWorld.xz);
          float cursorPool = exp(-(cDist * cDist) / 45.0) * uCursorActive;
          col += surface * vec3(1.15, 0.82, 0.36) * cursorPool * 0.58;

          col = applyGoldenHourFog(col, vDepth, vWorldPos, cameraPosition, uSunDir);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });

    const terrain = new THREE.Mesh(geo, this.terrainMaterial);
    this.scene.add(terrain);
    this.disposables.push(geo, this.terrainMaterial);
  }

  /**
   * Builds the multi-species 3D ecosystem anchored directly to terrain hills:
   *  - 8,400 grounded 3D stems supporting 3 distinct species morphologies:
   *      1) Wild poppies, buttercups & anemones (3,800)
   *      2) Meadow daisies & chamomile (2,500)
   *      3) Vertical lupine / delphinium spires (2,100)
   *  - 18,000 varied 7-blade 3D meadow grass tufts
   *  - 3,400 3D arching woodland fern & low shrub rosettes
   *  - 420 mossy hillside rocks / meadow stones
   */
  private buildBotanicalEcosystem(detailTex: THREE.CanvasTexture): void {
    const poppyCount = 3800;
    const daisyCount = 2500;
    const spikeCount = 2100;
    const totalStemCount = poppyCount + daisyCount + spikeCount;

    const origins = new Float32Array(totalStemCount * 3);
    const stemHeights = new Float32Array(totalStemCount);
    const headScales = new Float32Array(totalStemCount);
    const yaws = new Float32Array(totalStemCount);
    const tilts = new Float32Array(totalStemCount * 2);
    const seeds = new Float32Array(totalStemCount);
    const colors = new Float32Array(totalStemCount * 3);
    const disperses = new Float32Array(totalStemCount * 3);

    // Rich, jewel-toned botanical wildflower palettes preserving natural tonal depth & contrast
    const speciesPalettes: Record<number, THREE.Color[]> = {
      // Poppies / Buttercups / Anemones (golden yellow, warm orange, coral, crimson, rose pink, blush, pearl)
      0: [
        new THREE.Color('#ff5424'), // poppy coral-orange
        new THREE.Color('#ffbf1a'), // buttercup golden yellow
        new THREE.Color('#ef2d62'), // rich crimson-rose
        new THREE.Color('#ff7ca8'), // luminous blush-pink
        new THREE.Color('#ff8e26'), // warm marigold orange
        new THREE.Color('#ffe5be'), // warm blush pearl
        new THREE.Color('#ff456e'), // rose-carmine
      ],
      // Meadow Daisies & Chamomile (ivory/pearl, warm apricot, sunlit yellow, soft blush pink)
      1: [
        new THREE.Color('#fff6e2'), // luminous daisy ivory
        new THREE.Color('#ffd3a8'), // warm blush apricot
        new THREE.Color('#ffdc4d'), // sunlit golden chamomile
        new THREE.Color('#f7b5dc'), // soft rose-blush
        new THREE.Color('#e8f0ff'), // pearl moonlight white
      ],
      // Lupine & Delphinium Spires (orchid purple, royal violet, periwinkle, cerulean, rose-magenta)
      2: [
        new THREE.Color('#8c56ff'), // royal violet
        new THREE.Color('#b678ff'), // orchid purple
        new THREE.Color('#e4469c'), // orchid rose-magenta
        new THREE.Color('#4f88ff'), // periwinkle-cerulean
        new THREE.Color('#42b8ff'), // luminous cerulean sky
      ],
    };

    const tmpPt = new THREE.Vector3();
    const tmpTan = new THREE.Vector3();
    const tmpRight = new THREE.Vector3();

    const assignFlowerPlacement = (idx: number, speciesIdx: number) => {
      const t = Math.random();
      this.curve.getPointAt(t, tmpPt);
      this.curve.getTangentAt(t, tmpTan);
      tmpRight.crossVectors(tmpTan, this._up).normalize();

      // Natural uneven drifts across rolling hillsides (avoid rigid stripes)
      const clusterAngle = t * Math.PI * 12.0 + speciesIdx * 2.1;
      const spreadBias = Math.sin(clusterAngle) * 5.0;
      const lateralOffset = (Math.random() - 0.5) * 42.0 + spreadBias + (Math.random() - 0.5) * 4.0;
      const forwardJitter = (Math.random() - 0.5) * 6.0;

      const wx = tmpPt.x + tmpRight.x * lateralOffset + tmpTan.x * forwardJitter;
      const wz = tmpPt.z + tmpRight.z * lateralOffset + tmpTan.z * forwardJitter;
      const wy = sampleTerrainHeight(wx, wz) - 0.03;

      origins[idx * 3] = wx;
      origins[idx * 3 + 1] = wy;
      origins[idx * 3 + 2] = wz;

      // Natural botanical scale suited for elevated panoramic framing
      stemHeights[idx] = 0.42 + Math.random() * 0.72;
      headScales[idx] =
        speciesIdx === 2
          ? 0.75 + Math.random() * 0.55
          : speciesIdx === 1
            ? 0.68 + Math.random() * 0.58
            : 0.72 + Math.random() * 0.65;
      yaws[idx] = Math.random() * Math.PI * 2;
      tilts[idx * 2] = (Math.random() - 0.5) * 0.36;
      tilts[idx * 2 + 1] = (Math.random() - 0.5) * 0.32;
      seeds[idx] = Math.random();

      const patch = samplePatchField(wx, wz);
      const pal = speciesPalettes[speciesIdx];
      const wrapped = (((patch + Math.random() * 0.32) % 1) + 1) % 1;
      const palIdx = THREE.MathUtils.clamp(
        Math.floor(wrapped * pal.length),
        0,
        pal.length - 1,
      );
      const col = pal[palIdx];
      const shade = 0.80 + Math.random() * 0.24;
      colors[idx * 3] = col.r * shade;
      colors[idx * 3 + 1] = col.g * shade;
      colors[idx * 3 + 2] = col.b * shade;

      const angle = Math.random() * Math.PI * 2;
      const radial = 0.8 + Math.random() * 1.25;
      disperses[idx * 3] = Math.cos(angle) * radial;
      disperses[idx * 3 + 1] = 0.45 + Math.random() * 1.0;
      disperses[idx * 3 + 2] = Math.sin(angle) * radial;
    };

    for (let i = 0; i < poppyCount; i++) assignFlowerPlacement(i, 0);
    for (let i = 0; i < daisyCount; i++) assignFlowerPlacement(poppyCount + i, 1);
    for (let i = 0; i < spikeCount; i++) assignFlowerPlacement(poppyCount + daisyCount + i, 2);

    const aspect =
      (this.container.clientWidth || window.innerWidth) /
      (this.container.clientHeight || window.innerHeight);

    // 1. All 8,400 Detailed 3D Stems & Alternating Veined Stem Leaves
    const baseStemGeo = createDetailedStemGeometry();
    const stemInstGeo = makeInstancedFromBase(baseStemGeo, totalStemCount);
    stemInstGeo.setAttribute('aOrigin', new THREE.InstancedBufferAttribute(origins, 3));
    stemInstGeo.setAttribute('aStemHeight', new THREE.InstancedBufferAttribute(stemHeights, 1));
    stemInstGeo.setAttribute('aYaw', new THREE.InstancedBufferAttribute(yaws, 1));
    stemInstGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
    stemInstGeo.setAttribute('aDisperse', new THREE.InstancedBufferAttribute(disperses, 3));

    this.stemMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCursorWorld: { value: new THREE.Vector3() },
        uCursorActive: { value: 0 },
        uAspect: { value: aspect },
        uHover: { value: 0 },
        uSunDir: { value: this.sunDir },
        uDetailTex: { value: detailTex },
      },
      vertexShader: /* glsl */ `
        attribute float aPart;
        attribute vec3 aOrigin;
        attribute float aStemHeight;
        attribute float aYaw;
        attribute float aSeed;
        attribute vec3 aDisperse;

        uniform float uTime;
        uniform vec3 uCursorWorld;
        uniform float uCursorActive;
        uniform float uHover;

        varying float vPart;
        varying float vHeightT;
        varying float vDepth;
        varying float vSeed;
        varying float vCursorGlow;
        varying vec2 vUv;
        varying vec3 vWorldPos;
        varying vec3 vWorldNormal;

        ${GLSL_ENVIRONMENT_COMMON}

        void main() {
          vPart = aPart;
          vSeed = aSeed;
          vUv = uv;
          float t = clamp(position.y, 0.0, 1.0);
          vHeightT = t;

          float stemThickness = 0.72 + aStemHeight * 0.35;
          vec3 localPos = vec3(position.x * stemThickness, position.y * aStemHeight, position.z * stemThickness);
          localPos.xz = rotate2D(localPos.xz, aYaw);

          vec3 localN = normal;
          localN.xz = rotate2D(localN.xz, aYaw);
          vWorldNormal = normalize(localN);

          vec3 worldPos = aOrigin + localPos;

          vec2 wind = computeWindGust(aOrigin.xz, uTime, aSeed);
          float bend = t * t * aStemHeight;
          vec2 windDisp = wind * bend;
          worldPos.xz += windDisp;
          worldPos.y -= dot(windDisp, windDisp) * 0.3;

          float cGlow = 0.0;
          vec2 push = computeTerrainCursorPush(
            aOrigin + vec3(0.0, aStemHeight, 0.0),
            uCursorWorld,
            uCursorActive,
            6.4,
            cGlow
          );
          vCursorGlow = cGlow;
          worldPos.xz += push * (0.48 * bend);
          worldPos.y -= length(push) * 0.08 * bend + uHover * 0.32 * t * aStemHeight;

          vWorldPos = worldPos;
          vec4 mvPos = viewMatrix * vec4(worldPos, 1.0);
          vDepth = -mvPos.z;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uSunDir;
        uniform sampler2D uDetailTex;
        uniform float uHover;

        varying float vPart;
        varying float vHeightT;
        varying float vDepth;
        varying float vSeed;
        varying float vCursorGlow;
        varying vec2 vUv;
        varying vec3 vWorldPos;
        varying vec3 vWorldNormal;

        ${GLSL_ENVIRONMENT_COMMON}

        void main() {
          if (vDepth < 0.3 || vDepth > 95.0) discard;

          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          vec3 n = normalize(vWorldNormal);
          if (dot(n, viewDir) < 0.0) n = -n;

          float vein = texture2D(uDetailTex, vUv).g;
          float ndotl = clamp(dot(n, uSunDir), 0.0, 1.0);
          float hillSun = smoothstep(-1.2, 4.0, vWorldPos.y);
          float sss = pow(clamp(dot(viewDir, -uSunDir + n * 0.42), 0.0, 1.0), 3.0);

          vec3 stalkGreen = vec3(0.052, 0.135, 0.036);
          vec3 leafGreen = mix(vec3(0.078, 0.205, 0.052), vec3(0.135, 0.275, 0.075), vein * 0.55);
          vec3 baseCol = mix(stalkGreen, leafGreen, vPart * 0.72 + vHeightT * 0.35);
          baseCol *= 0.85 + vSeed * 0.3;

          vec3 sunLight = vec3(1.22, 0.85, 0.45) * (ndotl * 0.80 + sss * 0.58) * (0.42 + hillSun * 0.75);
          vec3 ambient = vec3(0.072, 0.115, 0.064);
          vec3 col = baseCol * (ambient + sunLight);

          col += vec3(0.16, 0.22, 0.07) * vCursorGlow * vHeightT;
          col *= 1.0 - uHover * 0.55;
          col = applyGoldenHourFog(col, vDepth, vWorldPos, cameraPosition, uSunDir);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });

    const stemsMesh = new THREE.Mesh(stemInstGeo, this.stemMaterial);
    stemsMesh.frustumCulled = false;
    this.scene.add(stemsMesh);
    this.disposables.push(baseStemGeo, stemInstGeo, this.stemMaterial);

    // 2. Shared Flower Head Shader Factory & 3 Species Batches Locked to Stem Tips
    const buildHeadSpeciesBatch = (
      baseGeo: THREE.BufferGeometry,
      offset: number,
      count: number,
      hasGoldenEye: boolean,
    ) => {
      const slice3 = (src: Float32Array) =>
        new THREE.InstancedBufferAttribute(src.subarray(offset * 3, (offset + count) * 3), 3);
      const slice2 = (src: Float32Array) =>
        new THREE.InstancedBufferAttribute(src.subarray(offset * 2, (offset + count) * 2), 2);
      const slice1 = (src: Float32Array) =>
        new THREE.InstancedBufferAttribute(src.subarray(offset, offset + count), 1);

      const instGeo = makeInstancedFromBase(baseGeo, count);
      instGeo.setAttribute('aOrigin', slice3(origins));
      instGeo.setAttribute('aStemHeight', slice1(stemHeights));
      instGeo.setAttribute('aHeadScale', slice1(headScales));
      instGeo.setAttribute('aYaw', slice1(yaws));
      instGeo.setAttribute('aTilt', slice2(tilts));
      instGeo.setAttribute('aSeed', slice1(seeds));
      instGeo.setAttribute('aColor', slice3(colors));
      instGeo.setAttribute('aDisperse', slice3(disperses));

      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uCursorWorld: { value: new THREE.Vector3() },
          uCursorActive: { value: 0 },
          uAspect: { value: aspect },
          uHover: { value: 0 },
          uSunDir: { value: this.sunDir },
          uDetailTex: { value: detailTex },
          uHasGoldenEye: { value: hasGoldenEye ? 1.0 : 0.0 },
        },
        vertexShader: /* glsl */ `
          attribute float aPart;
          attribute float aRadial;
          attribute vec3 aOrigin;
          attribute float aStemHeight;
          attribute float aHeadScale;
          attribute float aYaw;
          attribute vec2 aTilt;
          attribute float aSeed;
          attribute vec3 aColor;
          attribute vec3 aDisperse;

          uniform float uTime;
          uniform vec3 uCursorWorld;
          uniform float uCursorActive;
          uniform float uHover;

          varying float vPart;
          varying float vRadial;
          varying vec3 vColor;
          varying float vDepth;
          varying float vCursorGlow;
          varying float vSeed;
          varying vec2 vUv;
          varying vec3 vWorldPos;
          varying vec3 vWorldNormal;

          ${GLSL_ENVIRONMENT_COMMON}

          void main() {
            vPart = aPart;
            vRadial = aRadial;
            vColor = aColor;
            vSeed = aSeed;
            vUv = uv;

            float stemThickness = 0.72 + aStemHeight * 0.35;
            vec2 tipLocalXZ = rotate2D(vec2(${STEM_TIP_X.toFixed(8)} * stemThickness, 0.0), aYaw);
            vec3 stemTip = aOrigin + vec3(tipLocalXZ.x, aStemHeight, tipLocalXZ.y);

            vec2 wind = computeWindGust(aOrigin.xz, uTime, aSeed);
            vec2 windDisp = wind * aStemHeight;
            stemTip.xz += windDisp;
            stemTip.y -= dot(windDisp, windDisp) * 0.3;

            float cGlow = 0.0;
            vec2 push = computeTerrainCursorPush(
              stemTip,
              uCursorWorld,
              uCursorActive,
              6.4,
              cGlow
            );
            vCursorGlow = cGlow;
            stemTip.xz += push * (0.48 * aStemHeight);
            stemTip.y -= length(push) * 0.08 * aStemHeight;

            float disperseCurve = uHover * uHover;
            vec3 disperseOffset = aDisperse * (disperseCurve * 12.0);
            disperseOffset.y += sin(uTime * 1.3 + aSeed * 18.0) * 0.4 * uHover;

            vec4 tipMv = viewMatrix * vec4(stemTip, 1.0);
            float approxDist = max(-tipMv.z, 0.2);
            // Smooth gentle LOD visibility without oversized foreground heads
            float lodScale = mix(0.62, 1.08, smoothstep(58.0, 9.0, approxDist));
            float hoverShrink = mix(1.0, 0.46, uHover);
            float hScale = aHeadScale * lodScale * hoverShrink;

            vec3 p = position * hScale;
            vec3 n = normal;

            float pitch = aTilt.x + length(wind) * 0.42 + push.y * 0.32;
            float cp = cos(pitch);
            float sp = sin(pitch);
            p.yz = vec2(p.y * cp - p.z * sp, p.y * sp + p.z * cp);
            n.yz = vec2(n.y * cp - n.z * sp, n.y * sp + n.z * cp);

            float roll = aTilt.y + wind.x * 0.38 - push.x * 0.32;
            float cr = cos(roll);
            float sr = sin(roll);
            p.xy = vec2(p.x * cr - p.y * sr, p.x * sr + p.y * cr);
            n.xy = vec2(n.x * cr - n.y * sr, n.x * sr + n.y * cr);

            p.xz = rotate2D(p.xz, aYaw);
            n.xz = rotate2D(n.xz, aYaw);

            vWorldNormal = normalize(n);
            vec3 worldPos = stemTip + p + disperseOffset;
            vWorldPos = worldPos;

            vec4 mvPos = viewMatrix * vec4(worldPos, 1.0);
            vDepth = -mvPos.z;
            gl_Position = projectionMatrix * mvPos;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform vec3 uSunDir;
          uniform sampler2D uDetailTex;
          uniform float uHover;
          uniform float uHasGoldenEye;

          varying float vPart;
          varying float vRadial;
          varying vec3 vColor;
          varying float vDepth;
          varying float vCursorGlow;
          varying float vSeed;
          varying vec2 vUv;
          varying vec3 vWorldPos;
          varying vec3 vWorldNormal;

          ${GLSL_ENVIRONMENT_COMMON}

          void main() {
            if (vDepth < 0.3 || vDepth > 95.0) discard;

            vec3 viewDir = normalize(cameraPosition - vWorldPos);
            vec3 n = normalize(vWorldNormal);
            if (dot(n, viewDir) < 0.0) n = -n;

            float veinTex = texture2D(uDetailTex, vUv).g;
            float ndotl = clamp(dot(n, uSunDir), 0.0, 1.0);
            float wrapDiff = clamp((dot(n, uSunDir) + 0.30) / 1.30, 0.0, 1.0);
            float hillSun = smoothstep(-1.2, 4.0, vWorldPos.y);
            float sss = pow(clamp(dot(viewDir, -uSunDir + n * 0.35), 0.0, 1.0), 2.8);
            float fresnel = pow(1.0 - clamp(dot(n, viewDir), 0.0, 1.0), 2.2);
            float spec = pow(clamp(dot(reflect(-uSunDir, n), viewDir), 0.0, 1.0), 22.0);

            vec3 sunLight = vec3(1.26, 0.88, 0.47) * (wrapDiff * 0.90 + sss * 0.82) * (0.46 + hillSun * 0.74);
            vec3 ambient = vec3(0.092, 0.116, 0.098);

            vec3 col;
            if (vPart < 0.5) {
              // Underside green sepals / spire rachis bracts
              vec3 sepalGreen = vec3(0.068, 0.210, 0.050);
              col = sepalGreen * (ambient + sunLight);
            } else if (vPart > 1.5) {
              // Selective HDR golden stamen/pollen dome catching crisp UnrealBloomPass halos
              vec3 pollenBase = mix(vec3(0.95, 0.70, 0.22), vec3(1.56, 1.14, 0.34), uHasGoldenEye);
              float seedShimmer = step(0.38, fract(vSeed * 17.3));
              float pulse = 0.88 + 0.12 * sin(uTime * 1.4 + vSeed * 21.0);
              col = pollenBase * (ambient + sunLight)
                  + vec3(0.66, 0.45, 0.12) * (0.54 + seedShimmer * 0.68) * pulse;
            } else {
              // Crisp botanical petals: recover full cupAO shadowing & surface vein micro-detail,
              // plus delicate multi-tone radial petal gradients and selective sunlit rim luminance
              float cupAO = mix(0.54, 1.18, smoothstep(0.0, 0.84, vRadial));
              float veinDarken = mix(0.84, 1.10, veinTex);

              // Subtle per-petal hue gradient from rich jewel throat to sunlit warm petal edge
              vec3 throatHue = vColor * vec3(0.76, 0.68, 0.84);
              vec3 tipHue = mix(vColor * 1.22, vColor.gbr * 0.65 + vec3(0.34, 0.25, 0.15), fract(vSeed * 13.7) * 0.45);
              vec3 petalBody = mix(throatHue, vColor, smoothstep(0.04, 0.48, vRadial));
              petalBody = mix(petalBody, tipHue, smoothstep(0.58, 1.0, vRadial));

              vec3 litPetals = petalBody * cupAO * veinDarken * (ambient + sunLight) * 1.12;

              // Selective sunlit rim translucency & species-colored petal radiance preserving crease AO
              float focalSeed = smoothstep(0.58, 0.94, fract(vSeed * 31.7 + 0.19));
              vec3 innerLumen = vColor * (0.12 + 0.18 * focalSeed) * cupAO * veinDarken * (0.45 + 0.55 * wrapDiff);
              vec3 rimEdge = (vColor * 0.85 + vec3(0.42, 0.29, 0.14))
                           * (sss * (0.48 + focalSeed * 0.48) + fresnel * 0.32 * smoothstep(0.45, 1.0, vRadial));

              col = litPetals + innerLumen + rimEdge + vec3(0.18, 0.14, 0.08) * spec;
            }

            // Interactive cursor hover illumination: highlights flower center & translucent edges cleanly
            float edgeFocus = mix(0.65, 1.18, vRadial);
            col *= 1.0 + vCursorGlow * (0.60 + 0.48 * step(1.5, vPart));
            col += (vColor * 0.38 + vec3(0.36, 0.23, 0.08)) * vCursorGlow * edgeFocus * 0.65;

            // Hover dispersal orb luminance
            vec3 orbCol = mix(vColor, vec3(1.0, 0.92, 0.72), 0.48) * 1.48;
            col = mix(col, orbCol, uHover * 0.85);

            col = applyGoldenHourFog(col, vDepth, vWorldPos, cameraPosition, uSunDir);
            gl_FragColor = vec4(col, 1.0);
          }
        `,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(instGeo, mat);
      mesh.frustumCulled = false;
      this.scene.add(mesh);
      this.headMaterials.push(mat);
      this.disposables.push(baseGeo, instGeo, mat);
    };

    buildHeadSpeciesBatch(createCuppedWildflowerGeometry(), 0, poppyCount, true);
    buildHeadSpeciesBatch(createDaisyHeadGeometry(), poppyCount, daisyCount, true);
    buildHeadSpeciesBatch(createSpikeClusterGeometry(), poppyCount + daisyCount, spikeCount, false);

    // 3. 18,000 Varied 7-Blade Meadow Grass Tufts
    const grassCount = 18000;
    const grassOrigins = new Float32Array(grassCount * 3);
    const grassScales = new Float32Array(grassCount);
    const grassYaws = new Float32Array(grassCount);
    const grassSeeds = new Float32Array(grassCount);
    const grassColors = new Float32Array(grassCount * 3);

    const grassPalette = [
      new THREE.Color('#224719'), // deep forest green
      new THREE.Color('#2d5c1e'), // rich emerald grass
      new THREE.Color('#42591e'), // warm olive green
      new THREE.Color('#2c4f1d'), // cushion moss green
      new THREE.Color('#4d7328'), // fresh sunlit meadow grass
    ];

    for (let i = 0; i < grassCount; i++) {
      const t = Math.random();
      this.curve.getPointAt(t, tmpPt);
      this.curve.getTangentAt(t, tmpTan);
      tmpRight.crossVectors(tmpTan, this._up).normalize();

      const side = Math.random() < 0.5 ? -1 : 1;
      const lateralDist = Math.pow(Math.random(), 0.75) * 32.0;
      const lateralOffset = side * lateralDist;
      const forwardJitter = (Math.random() - 0.5) * 5.2;

      const wx = tmpPt.x + tmpRight.x * lateralOffset + tmpTan.x * forwardJitter;
      const wz = tmpPt.z + tmpRight.z * lateralOffset + tmpTan.z * forwardJitter;
      const wy = sampleTerrainHeight(wx, wz) - 0.04;

      grassOrigins[i * 3] = wx;
      grassOrigins[i * 3 + 1] = wy;
      grassOrigins[i * 3 + 2] = wz;

      grassScales[i] = 0.58 + Math.random() * 0.92;
      grassYaws[i] = Math.random() * Math.PI * 2;
      grassSeeds[i] = Math.random();

      const gc = grassPalette[Math.floor(Math.random() * grassPalette.length)];
      const shade = 0.74 + Math.random() * 0.34;
      grassColors[i * 3] = gc.r * shade;
      grassColors[i * 3 + 1] = gc.g * shade;
      grassColors[i * 3 + 2] = gc.b * shade;
    }

    const baseGrassGeo = createVariedGrassTuftGeometry();
    const grassInstGeo = makeInstancedFromBase(baseGrassGeo, grassCount);
    grassInstGeo.setAttribute('aOrigin', new THREE.InstancedBufferAttribute(grassOrigins, 3));
    grassInstGeo.setAttribute('aScale', new THREE.InstancedBufferAttribute(grassScales, 1));
    grassInstGeo.setAttribute('aYaw', new THREE.InstancedBufferAttribute(grassYaws, 1));
    grassInstGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(grassSeeds, 1));
    grassInstGeo.setAttribute('aColor', new THREE.InstancedBufferAttribute(grassColors, 3));

    this.grassMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCursorWorld: { value: new THREE.Vector3() },
        uCursorActive: { value: 0 },
        uAspect: { value: aspect },
        uHover: { value: 0 },
        uSunDir: { value: this.sunDir },
      },
      vertexShader: /* glsl */ `
        attribute float aHeight;
        attribute vec3 aOrigin;
        attribute float aScale;
        attribute float aYaw;
        attribute float aSeed;
        attribute vec3 aColor;

        uniform float uTime;
        uniform vec3 uCursorWorld;
        uniform float uCursorActive;
        uniform float uHover;

        varying float vHeight;
        varying vec3 vColor;
        varying float vDepth;
        varying float vCursorGlow;
        varying vec3 vWorldPos;
        varying vec3 vWorldNormal;

        ${GLSL_ENVIRONMENT_COMMON}

        void main() {
          vHeight = aHeight;
          vColor = aColor;

          vec3 localPos = position * aScale;
          localPos.xz = rotate2D(localPos.xz, aYaw);

          vec3 localN = normal;
          localN.xz = rotate2D(localN.xz, aYaw);
          vWorldNormal = normalize(localN);

          vec3 worldPos = aOrigin + localPos;

          vec2 wind = computeWindGust(aOrigin.xz, uTime, aSeed);
          float bend = aHeight * aHeight * aScale;
          vec2 windDisp = wind * bend * 1.1;
          worldPos.xz += windDisp;
          worldPos.y -= dot(windDisp, windDisp) * 0.25;

          float cGlow = 0.0;
          vec2 push = computeTerrainCursorPush(
            aOrigin + vec3(0.0, aScale, 0.0),
            uCursorWorld,
            uCursorActive,
            6.8,
            cGlow
          );
          vCursorGlow = cGlow;
          worldPos.xz += push * (0.52 * bend);
          worldPos.y -= length(push) * 0.14 * bend;

          vWorldPos = worldPos;
          vec4 mvPos = viewMatrix * vec4(worldPos, 1.0);
          vDepth = -mvPos.z;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uSunDir;
        uniform float uHover;

        varying float vHeight;
        varying vec3 vColor;
        varying float vDepth;
        varying float vCursorGlow;
        varying vec3 vWorldPos;
        varying vec3 vWorldNormal;

        ${GLSL_ENVIRONMENT_COMMON}

        void main() {
          if (vDepth < 0.25 || vDepth > 85.0) discard;

          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          vec3 n = normalize(vWorldNormal);
          if (dot(n, viewDir) < 0.0) n = -n;

          float ndotl = clamp(dot(n, uSunDir), 0.0, 1.0);
          float hillSun = smoothstep(-1.2, 4.0, vWorldPos.y);
          float sss = pow(clamp(dot(viewDir, -uSunDir + vec3(0.0, 0.35, 0.0)), 0.0, 1.0), 3.0);

          vec3 rootCol = vColor * 0.48;
          vec3 tipCol = vColor * 1.24 + vec3(0.06, 0.10, 0.018);
          vec3 baseCol = mix(rootCol, tipCol, smoothstep(0.0, 0.88, vHeight));

          vec3 sunLight = vec3(1.24, 0.85, 0.45) * (ndotl * 0.74 + sss * 0.68 * vHeight) * (0.42 + hillSun * 0.76);
          vec3 ambient = vec3(0.075, 0.118, 0.066);
          vec3 col = baseCol * (ambient + sunLight);

          col += vec3(0.14, 0.18, 0.05) * vCursorGlow * vHeight;
          col *= 1.0 - uHover * 0.42;

          col = applyGoldenHourFog(col, vDepth, vWorldPos, cameraPosition, uSunDir);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });

    const grassMesh = new THREE.Mesh(grassInstGeo, this.grassMaterial);
    grassMesh.frustumCulled = false;
    this.scene.add(grassMesh);
    this.disposables.push(baseGrassGeo, grassInstGeo, this.grassMaterial);

    // 4. 3,400 Woodland Fern & Leafy Shrub Rosettes
    const fernCount = 3400;
    const fernOrigins = new Float32Array(fernCount * 3);
    const fernScales = new Float32Array(fernCount);
    const fernYaws = new Float32Array(fernCount);
    const fernSeeds = new Float32Array(fernCount);
    const fernColors = new Float32Array(fernCount * 3);

    const fernPalette = [
      new THREE.Color('#24561b'),
      new THREE.Color('#306b22'),
      new THREE.Color('#417a27'),
      new THREE.Color('#3e5d1e'),
    ];

    for (let i = 0; i < fernCount; i++) {
      const t = Math.random();
      this.curve.getPointAt(t, tmpPt);
      this.curve.getTangentAt(t, tmpTan);
      tmpRight.crossVectors(tmpTan, this._up).normalize();

      const side = Math.random() < 0.5 ? -1 : 1;
      const lateralOffset = side * (3.5 + Math.random() * 28.0);
      const forwardJitter = (Math.random() - 0.5) * 5.0;

      const wx = tmpPt.x + tmpRight.x * lateralOffset + tmpTan.x * forwardJitter;
      const wz = tmpPt.z + tmpRight.z * lateralOffset + tmpTan.z * forwardJitter;
      const wy = sampleTerrainHeight(wx, wz) - 0.04;

      fernOrigins[i * 3] = wx;
      fernOrigins[i * 3 + 1] = wy;
      fernOrigins[i * 3 + 2] = wz;
      fernScales[i] = 0.72 + Math.random() * 0.95;
      fernYaws[i] = Math.random() * Math.PI * 2;
      fernSeeds[i] = Math.random();

      const fc = fernPalette[Math.floor(Math.random() * fernPalette.length)];
      const shade = 0.80 + Math.random() * 0.28;
      fernColors[i * 3] = fc.r * shade;
      fernColors[i * 3 + 1] = fc.g * shade;
      fernColors[i * 3 + 2] = fc.b * shade;
    }

    const baseFernGeo = createFernRosetteGeometry();
    const fernInstGeo = makeInstancedFromBase(baseFernGeo, fernCount);
    fernInstGeo.setAttribute('aOrigin', new THREE.InstancedBufferAttribute(fernOrigins, 3));
    fernInstGeo.setAttribute('aScale', new THREE.InstancedBufferAttribute(fernScales, 1));
    fernInstGeo.setAttribute('aYaw', new THREE.InstancedBufferAttribute(fernYaws, 1));
    fernInstGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(fernSeeds, 1));
    fernInstGeo.setAttribute('aColor', new THREE.InstancedBufferAttribute(fernColors, 3));

    this.fernMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCursorWorld: { value: new THREE.Vector3() },
        uCursorActive: { value: 0 },
        uHover: { value: 0 },
        uSunDir: { value: this.sunDir },
        uDetailTex: { value: detailTex },
      },
      vertexShader: /* glsl */ `
        attribute float aHeight;
        attribute vec3 aOrigin;
        attribute float aScale;
        attribute float aYaw;
        attribute float aSeed;
        attribute vec3 aColor;

        uniform float uTime;
        uniform vec3 uCursorWorld;
        uniform float uCursorActive;

        varying float vHeight;
        varying vec3 vColor;
        varying float vDepth;
        varying float vCursorGlow;
        varying vec2 vUv;
        varying vec3 vWorldPos;
        varying vec3 vWorldNormal;

        ${GLSL_ENVIRONMENT_COMMON}

        void main() {
          vHeight = aHeight;
          vColor = aColor;
          vUv = uv;

          vec3 localPos = position * aScale;
          localPos.xz = rotate2D(localPos.xz, aYaw);

          vec3 localN = normal;
          localN.xz = rotate2D(localN.xz, aYaw);
          vWorldNormal = normalize(localN);

          vec3 worldPos = aOrigin + localPos;
          vec2 wind = computeWindGust(aOrigin.xz, uTime, aSeed);
          float bend = aHeight * aHeight * aScale;
          worldPos.xz += wind * (bend * 0.65);

          float cGlow = 0.0;
          vec2 push = computeTerrainCursorPush(
            aOrigin + vec3(0.0, 0.35, 0.0),
            uCursorWorld,
            uCursorActive,
            6.0,
            cGlow
          );
          vCursorGlow = cGlow;
          worldPos.xz += push * (0.28 * bend);

          vWorldPos = worldPos;
          vec4 mvPos = viewMatrix * vec4(worldPos, 1.0);
          vDepth = -mvPos.z;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uSunDir;
        uniform sampler2D uDetailTex;
        uniform float uHover;

        varying float vHeight;
        varying vec3 vColor;
        varying float vDepth;
        varying float vCursorGlow;
        varying vec2 vUv;
        varying vec3 vWorldPos;
        varying vec3 vWorldNormal;

        ${GLSL_ENVIRONMENT_COMMON}

        void main() {
          if (vDepth < 0.3 || vDepth > 90.0) discard;

          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          vec3 n = normalize(vWorldNormal);
          if (dot(n, viewDir) < 0.0) n = -n;

          float vein = texture2D(uDetailTex, vUv).g;
          float ndotl = clamp(dot(n, uSunDir), 0.0, 1.0);
          float hillSun = smoothstep(-1.2, 4.0, vWorldPos.y);
          float sss = pow(clamp(dot(viewDir, -uSunDir + n * 0.35), 0.0, 1.0), 3.0);

          vec3 leafCol = vColor * mix(0.84, 1.18, vein) * mix(0.68, 1.16, vHeight);
          vec3 sunLight = vec3(1.24, 0.85, 0.45) * (ndotl * 0.80 + sss * 0.58) * (0.44 + hillSun * 0.74);
          vec3 ambient = vec3(0.072, 0.115, 0.064);
          vec3 col = leafCol * (ambient + sunLight);
          col += vec3(0.14, 0.19, 0.06) * vCursorGlow * vHeight;
          col *= 1.0 - uHover * 0.45;

          col = applyGoldenHourFog(col, vDepth, vWorldPos, cameraPosition, uSunDir);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });

    const fernMesh = new THREE.Mesh(fernInstGeo, this.fernMaterial);
    fernMesh.frustumCulled = false;
    this.scene.add(fernMesh);
    this.disposables.push(baseFernGeo, fernInstGeo, this.fernMaterial);

    // 5. 420 Moss-Capped Natural Meadow Stones Partially Embedded in Hillsides
    const rockCount = 420;
    const baseRockGeo = new THREE.IcosahedronGeometry(0.45, 1);
    const rockPos = baseRockGeo.attributes.position;
    for (let i = 0; i < rockPos.count; i++) {
      const rx = rockPos.getX(i);
      const ry = rockPos.getY(i);
      const rz = rockPos.getZ(i);
      const warp = 0.82 + Math.sin(rx * 5.2 + rz * 3.7) * 0.16 + Math.cos(ry * 4.5) * 0.12;
      rockPos.setXYZ(i, rx * warp * 1.25, ry * warp * 0.58, rz * warp * 1.1);
    }
    baseRockGeo.computeVertexNormals();

    const rockInstGeo = makeInstancedFromBase(baseRockGeo, rockCount);
    const rockOrigins = new Float32Array(rockCount * 3);
    const rockScales = new Float32Array(rockCount);
    const rockYaws = new Float32Array(rockCount);

    for (let i = 0; i < rockCount; i++) {
      const t = Math.random();
      this.curve.getPointAt(t, tmpPt);
      this.curve.getTangentAt(t, tmpTan);
      tmpRight.crossVectors(tmpTan, this._up).normalize();

      const side = Math.random() < 0.5 ? -1 : 1;
      const lateralOffset = side * (2.5 + Math.random() * 28.0);
      const wx = tmpPt.x + tmpRight.x * lateralOffset + (Math.random() - 0.5) * 6.0;
      const wz = tmpPt.z + tmpRight.z * lateralOffset + (Math.random() - 0.5) * 6.0;
      const wy = sampleTerrainHeight(wx, wz) - 0.08;

      rockOrigins[i * 3] = wx;
      rockOrigins[i * 3 + 1] = wy;
      rockOrigins[i * 3 + 2] = wz;
      rockScales[i] = 0.75 + Math.random() * 1.6;
      rockYaws[i] = Math.random() * Math.PI * 2;
    }

    rockInstGeo.setAttribute('aOrigin', new THREE.InstancedBufferAttribute(rockOrigins, 3));
    rockInstGeo.setAttribute('aScale', new THREE.InstancedBufferAttribute(rockScales, 1));
    rockInstGeo.setAttribute('aYaw', new THREE.InstancedBufferAttribute(rockYaws, 1));

    this.rockMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uSunDir: { value: this.sunDir },
        uDetailTex: { value: detailTex },
      },
      vertexShader: /* glsl */ `
        attribute vec3 aOrigin;
        attribute float aScale;
        attribute float aYaw;
        varying float vDepth;
        varying vec3 vWorldPos;
        varying vec3 vWorldNormal;
        ${GLSL_ENVIRONMENT_COMMON}
        void main() {
          vec3 p = position * aScale;
          p.xz = rotate2D(p.xz, aYaw);
          vec3 n = normal;
          n.xz = rotate2D(n.xz, aYaw);
          vWorldNormal = normalize(n);
          vec3 worldPos = aOrigin + p;
          vWorldPos = worldPos;
          vec4 mvPos = viewMatrix * vec4(worldPos, 1.0);
          vDepth = -mvPos.z;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uSunDir;
        uniform sampler2D uDetailTex;
        varying float vDepth;
        varying vec3 vWorldPos;
        varying vec3 vWorldNormal;
        ${GLSL_ENVIRONMENT_COMMON}
        void main() {
          if (vDepth < 0.3 || vDepth > 110.0) discard;
          vec3 n = normalize(vWorldNormal);
          float grain = texture2D(uDetailTex, vWorldPos.xz * 0.45).b;
          float mossCap = smoothstep(0.45, 0.85, n.y + (grain - 0.5) * 0.3);

          vec3 stoneCol = mix(vec3(0.085, 0.088, 0.082), vec3(0.14, 0.135, 0.125), grain);
          vec3 mossCol = vec3(0.055, 0.135, 0.038);
          vec3 surface = mix(stoneCol, mossCol, mossCap * 0.78);

          float ndotl = clamp(dot(n, uSunDir), 0.0, 1.0);
          float hillSun = smoothstep(-1.2, 4.0, vWorldPos.y);
          vec3 sunLight = vec3(1.18, 0.80, 0.42) * ndotl * (0.4 + hillSun * 0.72);
          vec3 col = surface * (vec3(0.055, 0.075, 0.06) + sunLight);
          col = applyGoldenHourFog(col, vDepth, vWorldPos, cameraPosition, uSunDir);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });

    const rockMesh = new THREE.Mesh(rockInstGeo, this.rockMaterial);
    rockMesh.frustumCulled = false;
    this.scene.add(rockMesh);
    this.disposables.push(baseRockGeo, rockInstGeo, this.rockMaterial);
  }

  /**
   * Midground & distant hillside botanical carpet (clovers, ferns, meadow grasses, seed heads,
   * and wildflower drifts) carrying fine color & greenery smoothly onto far rolling ridges.
   */
  private buildBotanicalPointCarpet(): void {
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    const atlas = createBotanicalAtlasTexture(maxAniso);
    this.disposables.push(atlas);

    const foliageCount = 24000;
    const flowerCount = 14000;
    const totalCount = foliageCount + flowerCount;

    const positions = new Float32Array(totalCount * 3);
    const tiles = new Float32Array(totalCount * 2);
    const sizes = new Float32Array(totalCount);
    const seeds = new Float32Array(totalCount);
    const isLeaf = new Float32Array(totalCount);
    const colors = new Float32Array(totalCount * 3);
    const disperseDirs = new Float32Array(totalCount * 3);

    const flowerPatches = [
      [new THREE.Color('#ff5424'), new THREE.Color('#ffbf1a'), new THREE.Color('#ef2d62')],
      [new THREE.Color('#fff4db'), new THREE.Color('#ffdc4d'), new THREE.Color('#ff7ca8')],
      [new THREE.Color('#8c56ff'), new THREE.Color('#b678ff'), new THREE.Color('#4f88ff')],
      [new THREE.Color('#ff8e26'), new THREE.Color('#e4469c'), new THREE.Color('#42b8ff')],
    ];

    const foliagePalette = [
      new THREE.Color('#24561b'),
      new THREE.Color('#306b22'),
      new THREE.Color('#456a21'),
      new THREE.Color('#2e5c1f'),
      new THREE.Color('#4f7c2b'),
    ];

    const tmpPt = new THREE.Vector3();
    const tmpTan = new THREE.Vector3();
    const tmpRight = new THREE.Vector3();

    for (let i = 0; i < totalCount; i++) {
      const isFoliage = i < foliageCount;
      const t = Math.random();
      this.curve.getPointAt(t, tmpPt);
      this.curve.getTangentAt(t, tmpTan);
      tmpRight.crossVectors(tmpTan, this._up).normalize();

      const side = Math.random() < 0.5 ? -1 : 1;

      if (isFoliage) {
        const lateralOffset = side * (6.0 + Math.random() * 48.0);
        const forwardJitter = (Math.random() - 0.5) * 6.0;

        const wx = tmpPt.x + tmpRight.x * lateralOffset + tmpTan.x * forwardJitter;
        const wz = tmpPt.z + tmpRight.z * lateralOffset + tmpTan.z * forwardJitter;
        const wy = sampleTerrainHeight(wx, wz) + 0.14 + Math.random() * 0.72;

        positions[i * 3] = wx;
        positions[i * 3 + 1] = wy;
        positions[i * 3 + 2] = wz;

        tiles[i * 2] = Math.floor(Math.random() * 4);
        tiles[i * 2 + 1] = Math.random() < 0.72 ? 2.0 : 3.0;
        if (tiles[i * 2] === 2 && tiles[i * 2 + 1] === 3) tiles[i * 2] = 0;

        sizes[i] = 1.45 + Math.random() * 1.85;
        seeds[i] = Math.random();
        isLeaf[i] = 1.0;

        const col = foliagePalette[Math.floor(Math.random() * foliagePalette.length)];
        const shade = 0.78 + Math.random() * 0.28;
        colors[i * 3] = col.r * shade;
        colors[i * 3 + 1] = col.g * shade;
        colors[i * 3 + 2] = col.b * shade;
      } else {
        const lateralOffset = side * (9.0 + Math.random() * 44.0);
        const forwardJitter = (Math.random() - 0.5) * 6.5;

        const wx = tmpPt.x + tmpRight.x * lateralOffset + tmpTan.x * forwardJitter;
        const wz = tmpPt.z + tmpRight.z * lateralOffset + tmpTan.z * forwardJitter;
        const wy = sampleTerrainHeight(wx, wz) + 0.35 + Math.random() * 0.9;

        positions[i * 3] = wx;
        positions[i * 3 + 1] = wy;
        positions[i * 3 + 2] = wz;

        const patchIdx = THREE.MathUtils.clamp(
          Math.floor(samplePatchField(wx, wz) * flowerPatches.length),
          0,
          flowerPatches.length - 1,
        );
        tiles[i * 2] = (patchIdx + (Math.random() < 0.4 ? 1 : 0)) % 4;
        tiles[i * 2 + 1] = Math.random() < 0.55 ? 0.0 : 1.0;

        sizes[i] = 1.0 + Math.random() * 1.45;
        seeds[i] = Math.random();
        isLeaf[i] = 0.0;

        const palette = flowerPatches[patchIdx];
        const col = palette[Math.floor(Math.random() * palette.length)];
        const shade = 0.78 + Math.random() * 0.26;
        colors[i * 3] = col.r * shade;
        colors[i * 3 + 1] = col.g * shade;
        colors[i * 3 + 2] = col.b * shade;
      }

      const angle = Math.random() * Math.PI * 2;
      const radial = 0.7 + Math.random() * 1.2;
      disperseDirs[i * 3] = Math.cos(angle) * radial;
      disperseDirs[i * 3 + 1] = 0.35 + Math.random() * 0.9;
      disperseDirs[i * 3 + 2] = Math.sin(angle) * radial;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aTile', new THREE.BufferAttribute(tiles, 2));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute('aIsLeaf', new THREE.BufferAttribute(isLeaf, 1));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aDisperse', new THREE.BufferAttribute(disperseDirs, 3));

    this.flowerPointMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uAtlas: { value: atlas },
        uTime: { value: 0 },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uViewportHeight: { value: this.container.clientHeight || window.innerHeight },
        uAspect: {
          value:
            (this.container.clientWidth || window.innerWidth) /
            (this.container.clientHeight || window.innerHeight),
        },
        uCursorWorld: { value: new THREE.Vector3() },
        uCursorActive: { value: 0 },
        uHover: { value: 0 },
        uSunDir: { value: this.sunDir },
      },
      vertexShader: /* glsl */ `
        attribute vec2 aTile;
        attribute float aSize;
        attribute float aSeed;
        attribute float aIsLeaf;
        attribute vec3 aColor;
        attribute vec3 aDisperse;

        uniform float uTime;
        uniform float uPixelRatio;
        uniform float uViewportHeight;
        uniform vec3 uCursorWorld;
        uniform float uCursorActive;
        uniform float uHover;

        varying vec2 vTile;
        varying vec3 vColor;
        varying float vDepth;
        varying float vAlpha;
        varying float vCursorGlow;
        varying float vRot;
        varying float vIsLeaf;
        varying float vSeed;
        varying vec3 vWorldPos;

        ${GLSL_ENVIRONMENT_COMMON}

        void main() {
          vTile = aTile;
          vColor = aColor;
          vIsLeaf = aIsLeaf;
          vSeed = aSeed;

          vec3 pos = position;
          vec2 wind = computeWindGust(pos.xz, uTime, aSeed);
          pos.xz += wind * (0.55 + (1.0 - aIsLeaf) * 0.25);

          float cGlow = 0.0;
          vec2 push = computeTerrainCursorPush(pos, uCursorWorld, uCursorActive, 7.5, cGlow);
          pos.xz += push * (0.38 + (1.0 - aIsLeaf) * 0.14);
          vCursorGlow = cGlow;

          float disperseCurve = uHover * uHover;
          pos += aDisperse * (disperseCurve * 12.0);
          pos.y += sin(uTime * 1.2 + aSeed * 18.0) * 0.4 * uHover;

          vWorldPos = pos;
          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          float dist = -mvPos.z;
          vDepth = dist;

          float flowerBloom = mix(0.32, 0.96, smoothstep(82.0, 14.0, dist));
          float leafGrow = mix(0.48, 1.05, smoothstep(92.0, 16.0, dist));
          float growthScale = mix(flowerBloom, leafGrow, aIsLeaf);

          // Start carpet gracefully beyond immediate 3D foreground
          float nearFade = smoothstep(8.0, 18.0, dist);
          float farFade = 1.0 - smoothstep(85.0, 138.0, dist);
          vAlpha = nearFade * farFade * mix(0.92, 0.88, aIsLeaf);

          vec4 clipPos = projectionMatrix * mvPos;
          vRot = (aSeed - 0.5) * mix(1.4, 0.4, aIsLeaf) + wind.x * 0.22;

          gl_Position = clipPos;
          float baseScale = aSize * growthScale * mix(1.0, 0.35, uHover);
          float perspectiveSize = (baseScale * uViewportHeight * 0.31) / max(dist, 1.2);
          gl_PointSize = clamp(perspectiveSize * uPixelRatio, 1.5, 160.0 * uPixelRatio);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uAtlas;
        uniform float uHover;
        uniform vec3 uSunDir;

        varying vec2 vTile;
        varying vec3 vColor;
        varying float vDepth;
        varying float vAlpha;
        varying float vCursorGlow;
        varying float vRot;
        varying float vIsLeaf;
        varying float vSeed;
        varying vec3 vWorldPos;

        ${GLSL_ENVIRONMENT_COMMON}

        void main() {
          if (vDepth < 1.0 || vAlpha <= 0.005) discard;

          vec2 centered = gl_PointCoord - 0.5;
          float c = cos(vRot);
          float s = sin(vRot);
          vec2 rotated = vec2(
            centered.x * c - centered.y * s,
            centered.x * s + centered.y * c
          ) + 0.5;

          vec2 clamped = clamp(rotated, 0.02, 0.98);
          float localV = 1.0 - clamped.y;
          float u = vTile.x * 0.25 + clamped.x * 0.25;
          float v = (3.0 - vTile.y) * 0.25 + localV * 0.25;

          vec4 texel = texture2D(uAtlas, vec2(u, v));

          float radialDist = length(centered) * 2.0;
          float orbAlpha = pow(max(0.0, 1.0 - radialDist), 2.1);

          float alpha = mix(texel.a, orbAlpha, uHover * 0.85) * vAlpha;
          if (alpha < 0.03) discard;

          float greenMask = clamp((texel.g - max(texel.r, texel.b)) * 5.0, 0.0, 1.0);
          float goldEyeMask = clamp(((min(texel.r, texel.g) - texel.b) - 0.12) * 4.5, 0.0, 1.0) * (1.0 - greenMask);

          vec3 tintedPetals = texel.rgb * vColor;
          vec3 naturalGreen = texel.rgb * 0.84;
          vec3 warmEye = texel.rgb * 1.06;
          vec3 flowerSprite = mix(tintedPetals, warmEye, goldEyeMask * 0.85);
          flowerSprite = mix(flowerSprite, naturalGreen, greenMask);

          float whiteTipMask = clamp((min(min(texel.r, texel.g), texel.b) - 0.72) * 4.0, 0.0, 1.0) * vIsLeaf;
          vec3 leafSprite = mix(texel.rgb * vColor, texel.rgb * 0.88, whiteTipMask);
          vec3 spriteColor = mix(flowerSprite, leafSprite, vIsLeaf);

          // Crisp sunlit shading preserving petal-vs-center contrast; selective HDR sparkle on golden centers
          float hillSun = smoothstep(-1.2, 4.2, vWorldPos.y);
          vec3 light = vec3(0.095, 0.128, 0.082) + vec3(1.26, 0.87, 0.46) * (0.38 + hillSun * 0.70);
          float focalBoost = mix(1.34, 1.66, step(0.60, fract(vSeed * 27.3)));
          float flowerBoost = mix(focalBoost, 0.96, vIsLeaf);
          spriteColor = spriteColor * light * flowerBoost;
          spriteColor += vColor * (0.12 + 0.10 * hillSun) * (1.0 - vIsLeaf);
          spriteColor += vec3(0.58, 0.40, 0.10) * goldEyeMask * (1.0 - vIsLeaf);

          vec3 orbColor = mix(vColor, vec3(1.0, 0.90, 0.68), 0.45) * 1.48;
          vec3 finalColor = mix(spriteColor, orbColor, uHover * 0.85);

          float glowFactor = vCursorGlow * (1.0 - vIsLeaf * 0.65);
          finalColor *= 1.0 + glowFactor * 0.85;
          finalColor += vec3(0.32, 0.20, 0.06) * vCursorGlow * (1.0 - vIsLeaf * 0.72);

          finalColor = applyGoldenHourFog(finalColor, vDepth, vWorldPos, cameraPosition, uSunDir);
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    const points = new THREE.Points(geometry, this.flowerPointMaterial);
    points.frustumCulled = false;
    this.scene.add(points);
    this.disposables.push(geometry, this.flowerPointMaterial);
  }

  private buildFloatingPetals(): void {
    const petalCount = 260;
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(-0.07, 0.07, -0.05, 0.2, 0, 0.24);
    shape.bezierCurveTo(0.05, 0.2, 0.07, 0.07, 0, 0);

    const petalGeo = new THREE.ShapeGeometry(shape, 5);
    const petalMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.56,
    });

    this.petalMesh = new THREE.InstancedMesh(petalGeo, petalMat, petalCount);
    this.petalMesh.frustumCulled = false;

    const tmpPt = new THREE.Vector3();
    const color = new THREE.Color();
    const tints = ['#c85734', '#d69f2e', '#c45b76', '#8a74bf', '#e2d8c3'];

    for (let i = 0; i < petalCount; i++) {
      this.curve.getPointAt(Math.random(), tmpPt);
      const basePos = new THREE.Vector3(
        tmpPt.x + (Math.random() - 0.5) * 26.0,
        tmpPt.y + 1.2 + Math.random() * 6.5,
        tmpPt.z + (Math.random() - 0.5) * 26.0,
      );
      const angle = Math.random() * Math.PI * 2;
      this.petalData.push({
        basePos,
        phase: Math.random() * Math.PI * 2,
        speed: 0.42 + Math.random() * 0.65,
        rotSpeed: new THREE.Vector3(
          0.5 + Math.random() * 1.0,
          0.4 + Math.random() * 1.0,
          0.4 + Math.random() * 0.8,
        ),
        scale: 0.48 + Math.random() * 0.62,
        disperse: new THREE.Vector3(
          Math.cos(angle) * (4 + Math.random() * 6),
          2 + Math.random() * 5,
          Math.sin(angle) * (4 + Math.random() * 6),
        ),
      });

      color.set(tints[i % tints.length]);
      this.petalMesh.setColorAt(i, color);
    }

    if (this.petalMesh.instanceColor) {
      this.petalMesh.instanceColor.needsUpdate = true;
    }

    this.scene.add(this.petalMesh);
    this.disposables.push(petalGeo, petalMat);
  }

  /**
   * Three-layer atmospheric particles: golden pollen, warm-white motes, and floral sparkles
   * drifting with subtle curl swirl across hills and reacting organically to the cursor.
   */
  private buildDustAndAirStreams(): void {
    const dustTexture = createDustTexture();
    this.disposables.push(dustTexture);

    const count = 2100;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const layers = new Float32Array(count);
    const tmpPt = new THREE.Vector3();
    const c = new THREE.Color();
    const motePalette = [0xffe39e, 0xfff5db, 0xffb3cf, 0xd4b5ff, 0xffba78];

    for (let i = 0; i < count; i++) {
      this.curve.getPointAt(Math.random(), tmpPt);
      const wx = tmpPt.x + (Math.random() - 0.5) * 44.0;
      const wz = tmpPt.z + (Math.random() - 0.5) * 44.0;
      const wy = sampleTerrainHeight(wx, wz) + 0.55 + Math.random() * 8.4;
      positions[i * 3] = wx;
      positions[i * 3 + 1] = wy;
      positions[i * 3 + 2] = wz;
      seeds[i] = Math.random();
      layers[i] = i % 3;

      c.setHex(motePalette[i % motePalette.length]);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aLayer', new THREE.BufferAttribute(layers, 1));

    const aspect =
      (this.container.clientWidth || window.innerWidth) /
      (this.container.clientHeight || window.innerHeight);

    this.dustMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: dustTexture },
        uTime: { value: 0 },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uViewportHeight: { value: this.container.clientHeight || window.innerHeight },
        uAspect: { value: aspect },
        uCursorWorld: { value: new THREE.Vector3() },
        uCursorActive: { value: 0 },
        uHover: { value: 0 },
      },
      vertexShader: /* glsl */ `
        attribute float aSeed;
        attribute vec3 aColor;
        attribute float aLayer;
        uniform float uTime;
        uniform float uPixelRatio;
        uniform float uViewportHeight;
        uniform vec3 uCursorWorld;
        uniform float uCursorActive;
        uniform float uHover;

        varying float vAlpha;
        varying float vSparkle;
        varying vec3 vColor;

        void main() {
          vColor = aColor;
          vec3 pos = position;

          float speedFactor = 0.032 + aSeed * 0.030 + aLayer * 0.008;
          float driftCycle = fract(uTime * speedFactor + aSeed * 7.0);
          float fadeEnds = sin(driftCycle * 3.14159265);
          vec2 windStep = vec2(0.857, 0.515) * ((driftCycle - 0.5) * 14.5);

          pos.xz += windStep;
          pos.x += sin(uTime * (0.65 + aLayer * 0.15) + aSeed * 24.0) * 0.45;
          pos.y += sin(uTime * 0.8 + aSeed * 19.0 + driftCycle * 6.28) * 0.42;
          pos.z += cos(uTime * 0.60 + aSeed * 31.0) * 0.45;

          // Subtle swirl attraction near active terrain cursor
          vec3 toCur = uCursorWorld - pos;
          float curDist = length(toCur);
          float swirlMask = exp(-(curDist * curDist) / 64.0) * uCursorActive;
          pos.xz += vec2(-toCur.z, toCur.x) * swirlMask * 0.25;
          pos.y += swirlMask * 0.42;

          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          float dist = -mvPos.z;
          float twinkle = 0.42 + 0.58 * sin(uTime * (1.3 + aSeed * 2.1) + aSeed * 23.0);
          vSparkle = 1.28 + twinkle * 0.95 + swirlMask * 0.85 + uHover * 0.55;

          float layerOpacity = aLayer < 0.5 ? 0.34 : (aLayer < 1.5 ? 0.28 : 0.40);
          vAlpha = smoothstep(1.2, 4.5, dist) * (1.0 - smoothstep(32.0, 68.0, dist));
          vAlpha *= fadeEnds * (layerOpacity + 0.34 * twinkle) * mix(1.0, 1.5, uHover);

          gl_Position = projectionMatrix * mvPos;
          float baseSz = mix(0.16, 0.36, aSeed) * (aLayer > 1.5 ? 1.15 : 0.92);
          gl_PointSize = clamp((baseSz * uViewportHeight * 0.24) / max(dist, 1.2) * uPixelRatio, 1.0, 18.0 * uPixelRatio);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap;
        varying float vAlpha;
        varying float vSparkle;
        varying vec3 vColor;
        void main() {
          vec4 tex = texture2D(uMap, gl_PointCoord);
          float d = length(gl_PointCoord - 0.5) * 2.0;
          float core = exp(-d * d * 8.5);
          float a = clamp(core * 0.82 + tex.a * 0.42, 0.0, 1.0) * vAlpha;
          if (a < 0.01) discard;
          gl_FragColor = vec4(vColor * vSparkle, a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const dust = new THREE.Points(geometry, this.dustMaterial);
    dust.frustumCulled = false;
    this.scene.add(dust);
    this.disposables.push(geometry, this.dustMaterial);

    // Subtle soft air-current ribbons drifting smoothly above the hills
    const streamCount = 85;
    const baseRibbon = new THREE.PlaneGeometry(3.2, 0.05, 16, 1);
    const streamInst = makeInstancedFromBase(baseRibbon, streamCount);

    const streamOrigins = new Float32Array(streamCount * 3);
    const streamSeeds = new Float32Array(streamCount);
    const streamScales = new Float32Array(streamCount);

    for (let i = 0; i < streamCount; i++) {
      this.curve.getPointAt(i / streamCount, tmpPt);
      const wx = tmpPt.x + (Math.random() - 0.5) * 32.0;
      const wz = tmpPt.z + (Math.random() - 0.5) * 32.0;
      const wy = sampleTerrainHeight(wx, wz) + 1.6 + Math.random() * 4.5;
      streamOrigins[i * 3] = wx;
      streamOrigins[i * 3 + 1] = wy;
      streamOrigins[i * 3 + 2] = wz;
      streamSeeds[i] = Math.random();
      streamScales[i] = 0.85 + Math.random() * 1.15;
    }

    streamInst.setAttribute('aOrigin', new THREE.InstancedBufferAttribute(streamOrigins, 3));
    streamInst.setAttribute('aSeed', new THREE.InstancedBufferAttribute(streamSeeds, 1));
    streamInst.setAttribute('aScale', new THREE.InstancedBufferAttribute(streamScales, 1));

    this.airStreamMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uHover: { value: 0 },
      },
      vertexShader: /* glsl */ `
        attribute vec3 aOrigin;
        attribute float aSeed;
        attribute float aScale;
        uniform float uTime;
        varying vec2 vUv;
        varying float vAlpha;

        void main() {
          vUv = uv;
          float life = fract(uTime * (0.11 + aSeed * 0.06) + aSeed * 5.0);
          vAlpha = sin(life * 3.14159265) * 0.075;

          vec3 p = position;
          p.x *= aScale;
          p.y += sin(uv.x * 6.28318 - uTime * 2.8 + aSeed * 9.0) * 0.11;
          p.z += cos(uv.x * 4.5 - uTime * 2.1 + aSeed * 11.0) * 0.14;

          vec2 windDir = vec2(0.857, 0.515);
          vec2 windPerp = vec2(-0.515, 0.857);
          vec3 worldPos = aOrigin;
          worldPos.xz += windDir * ((life - 0.5) * 16.0 + p.x);
          worldPos.xz += windPerp * p.z;
          worldPos.y += p.y + sin(life * 6.28318 + aSeed * 6.0) * 0.25;

          vec4 mvPos = viewMatrix * vec4(worldPos, 1.0);
          float dist = -mvPos.z;
          vAlpha *= smoothstep(2.5, 7.0, dist) * (1.0 - smoothstep(32.0, 58.0, dist));
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uHover;
        varying vec2 vUv;
        varying float vAlpha;

        void main() {
          float lenFade = sin(vUv.x * 3.14159265);
          float widthFade = sin(vUv.y * 3.14159265);
          float a = lenFade * lenFade * widthFade * vAlpha * (1.0 - uHover * 0.4);
          if (a < 0.003) discard;
          gl_FragColor = vec4(0.95, 0.85, 0.68, a);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });

    const airStreams = new THREE.Mesh(streamInst, this.airStreamMaterial);
    airStreams.frustumCulled = false;
    this.scene.add(airStreams);
    this.disposables.push(baseRibbon, streamInst, this.airStreamMaterial);
  }

  /**
   * Single-draw-call pooled glowing particle ribbon trails (zero per-frame heap allocations):
   * - 42 ambient wind-drifting golden pollen/firefly trails gliding across the meadow hills
   * - 30 cursor-interactive swirl trails emitted as the pointer sweeps across flowers & grass
   */
  private buildParticleTrails(): void {
    const totalTrails = 72;
    const ambientCount = 42;
    const ptsPerTrail = 12;
    const segsPerTrail = ptsPerTrail - 1;
    const vertsPerTrail = segsPerTrail * 4;
    const indicesPerTrail = segsPerTrail * 6;

    const totalVerts = totalTrails * vertsPerTrail;
    const totalIndices = totalTrails * indicesPerTrail;

    const positions = new Float32Array(totalVerts * 3);
    const colors = new Float32Array(totalVerts * 3);
    const alphas = new Float32Array(totalVerts);
    const uvs = new Float32Array(totalVerts * 2);
    const indices = new Uint16Array(totalIndices);

    let vCursor = 0;
    let iCursor = 0;

    for (let t = 0; t < totalTrails; t++) {
      for (let s = 0; s < segsPerTrail; s++) {
        const baseV = vCursor;
        const u0 = s / segsPerTrail;
        const u1 = (s + 1) / segsPerTrail;

        uvs[vCursor * 2] = u0;
        uvs[vCursor * 2 + 1] = 0;
        uvs[(vCursor + 1) * 2] = u0;
        uvs[(vCursor + 1) * 2 + 1] = 1;
        uvs[(vCursor + 2) * 2] = u1;
        uvs[(vCursor + 2) * 2 + 1] = 0;
        uvs[(vCursor + 3) * 2] = u1;
        uvs[(vCursor + 3) * 2 + 1] = 1;

        indices[iCursor++] = baseV;
        indices[iCursor++] = baseV + 1;
        indices[iCursor++] = baseV + 2;
        indices[iCursor++] = baseV + 2;
        indices[iCursor++] = baseV + 1;
        indices[iCursor++] = baseV + 3;

        vCursor += 4;
      }
    }

    this.trailGeometry = new THREE.BufferGeometry();
    this.trailPosAttr = new THREE.BufferAttribute(positions, 3);
    this.trailColAttr = new THREE.BufferAttribute(colors, 3);
    this.trailAlphaAttr = new THREE.BufferAttribute(alphas, 1);

    this.trailPosAttr.setUsage(THREE.DynamicDrawUsage);
    this.trailColAttr.setUsage(THREE.DynamicDrawUsage);
    this.trailAlphaAttr.setUsage(THREE.DynamicDrawUsage);

    this.trailGeometry.setAttribute('position', this.trailPosAttr);
    this.trailGeometry.setAttribute('aColor', this.trailColAttr);
    this.trailGeometry.setAttribute('aAlpha', this.trailAlphaAttr);
    this.trailGeometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    this.trailGeometry.setIndex(new THREE.BufferAttribute(indices, 1));

    const trailColors = [0xffdf82, 0xfff3d1, 0xffa6c9, 0xd4afff, 0xffb36b];
    const tmpPt = new THREE.Vector3();

    for (let i = 0; i < totalTrails; i++) {
      const isAmbient = i < ambientCount;
      const pts: THREE.Vector3[] = [];
      let sx = 0;
      let sy = 0;
      let sz = 0;

      if (isAmbient) {
        this.curve.getPointAt(Math.random(), tmpPt);
        sx = tmpPt.x + (Math.random() - 0.5) * 32.0;
        sz = tmpPt.z + (Math.random() - 0.5) * 32.0;
        sy = sampleTerrainHeight(sx, sz) + 0.9 + Math.random() * 4.2;
      }

      for (let p = 0; p < ptsPerTrail; p++) {
        pts.push(new THREE.Vector3(sx, sy, sz));
      }

      this.trailPool.push({
        isAmbient,
        active: isAmbient,
        age: isAmbient ? Math.random() * 3.5 : 0,
        life: isAmbient ? 3.2 + Math.random() * 2.2 : 1.4 + Math.random() * 0.8,
        seed: Math.random(),
        width: isAmbient ? 0.045 + Math.random() * 0.032 : 0.052 + Math.random() * 0.035,
        color: new THREE.Color(trailColors[i % trailColors.length]),
        vel: new THREE.Vector3(),
        points: pts,
      });
    }

    this.trailMaterial = new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        attribute vec3 aColor;
        attribute float aAlpha;
        varying vec3 vColor;
        varying float vAlpha;
        varying vec2 vUv;

        void main() {
          vColor = aColor;
          vAlpha = aAlpha;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        varying float vAlpha;
        varying vec2 vUv;

        void main() {
          if (vAlpha <= 0.004) discard;
          // Smooth ribbon edge feathering + luminous traveling head tip
          float crossProfile = sin(vUv.y * 3.14159265);
          crossProfile = crossProfile * crossProfile;
          float headBoost = smoothstep(0.75, 1.0, vUv.x) * 1.15;
          float lum = 1.15 + headBoost;
          float a = crossProfile * vAlpha;
          gl_FragColor = vec4(vColor * lum, a);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });

    const trailMesh = new THREE.Mesh(this.trailGeometry, this.trailMaterial);
    trailMesh.frustumCulled = false;
    trailMesh.renderOrder = 3;
    this.scene.add(trailMesh);
    this.disposables.push(this.trailGeometry, this.trailMaterial);
  }

  private updateParticleTrails(dt: number): void {
    const ptsPerTrail = 12;
    const segsPerTrail = ptsPerTrail - 1;
    const vertsPerTrail = segsPerTrail * 4;

    const posArr = this.trailPosAttr.array as Float32Array;
    const colArr = this.trailColAttr.array as Float32Array;
    const alphaArr = this.trailAlphaAttr.array as Float32Array;

    // Emit interactive swirling trails smoothly when the user sweeps cursor across the valley
    const cursorSpeed = this._cursorVel.length();
    if (!this.prefersReducedMotion && this.currentCursorActive > 0.25 && cursorSpeed > 0.35) {
      this.cursorSpawnAccumulator += Math.min(cursorSpeed * dt * 4.5, 2.2);
      while (this.cursorSpawnAccumulator >= 1.0) {
        this.cursorSpawnAccumulator -= 1.0;
        const p = this.trailPool[this.nextCursorTrailIdx];
        this.nextCursorTrailIdx = 42 + ((this.nextCursorTrailIdx - 42 + 1) % 30);

        const jitterAngle = Math.random() * Math.PI * 2;
        const jitterR = 0.45 + Math.random() * 1.45;
        const sx = this._cursorWorldCurrent.x + Math.cos(jitterAngle) * jitterR;
        const sz = this._cursorWorldCurrent.z + Math.sin(jitterAngle) * jitterR;
        const sy = sampleTerrainHeight(sx, sz) + 0.45 + Math.random() * 0.75;

        p.active = true;
        p.age = 0;
        p.life = 1.25 + Math.random() * 0.85;
        p.seed = Math.random();
        for (let k = 0; k < ptsPerTrail; k++) {
          p.points[k].set(sx, sy, sz);
        }
        p.vel.set(
          this._cursorVel.x * 0.28 + Math.cos(jitterAngle + 1.4) * 1.4,
          0.95 + Math.random() * 1.1,
          this._cursorVel.z * 0.28 + Math.sin(jitterAngle + 1.4) * 1.4,
        );
      }
    }

    const windX = 1.65;
    const windZ = 0.98;
    const time = this.elapsed;

    for (let i = 0; i < this.trailPool.length; i++) {
      const p = this.trailPool[i];
      const baseVertexOffset = i * vertsPerTrail;

      if (!p.active) {
        for (let v = 0; v < vertsPerTrail; v++) {
          alphaArr[baseVertexOffset + v] = 0;
        }
        continue;
      }

      p.age += dt;
      if (p.age >= p.life) {
        if (p.isAmbient) {
          p.age = 0;
          // Respawn ambient firefly/pollen near the current camera look zone so hills stay alive
          const angle = Math.random() * Math.PI * 2;
          const dist = 5.0 + Math.random() * 24.0;
          const sx = this._smoothedLookTarget.x + Math.cos(angle) * dist;
          const sz = this._smoothedLookTarget.z + Math.sin(angle) * dist;
          const sy = sampleTerrainHeight(sx, sz) + 0.85 + Math.random() * 4.0;
          for (let k = 0; k < ptsPerTrail; k++) {
            p.points[k].set(sx, sy, sz);
          }
        } else {
          p.active = false;
          for (let v = 0; v < vertsPerTrail; v++) {
            alphaArr[baseVertexOffset + v] = 0;
          }
          continue;
        }
      }

      // Shift ribbon history tail back smoothly
      for (let k = 0; k < ptsPerTrail - 1; k++) {
        p.points[k].lerp(p.points[k + 1], Math.min(1, dt * 16.0));
      }

      const head = p.points[ptsPerTrail - 1];
      if (p.isAmbient) {
        const phase = time * (1.2 + p.seed * 0.9) + p.seed * 25.0;
        const speedScale = this.prefersReducedMotion ? 0.2 : 1.0;
        head.x += (windX + Math.sin(phase) * 0.9) * dt * speedScale;
        head.z += (windZ + Math.cos(phase * 0.85) * 0.9) * dt * speedScale;
        head.y += Math.sin(phase * 1.35) * 0.55 * dt * speedScale;

        const floorY = sampleTerrainHeight(head.x, head.z) + 0.55;
        if (head.y < floorY) head.y = floorY;
      } else {
        // Cursor-spawned pollen trail spirals gently upward & rides ambient wind
        const swirl = time * 4.2 + p.seed * 18.0;
        p.vel.x = p.vel.x * Math.exp(-1.5 * dt) + (windX * 0.45 + Math.cos(swirl) * 0.75) * dt;
        p.vel.z = p.vel.z * Math.exp(-1.5 * dt) + (windZ * 0.45 + Math.sin(swirl) * 0.75) * dt;
        p.vel.y = p.vel.y * Math.exp(-1.2 * dt) + 0.35 * dt;

        head.addScaledVector(p.vel, dt);
        const floorY = sampleTerrainHeight(head.x, head.z) + 0.35;
        if (head.y < floorY) head.y = floorY;
      }

      const normAge = p.age / p.life;
      const lifeEnvelope = p.isAmbient
        ? Math.sin(normAge * Math.PI) * 0.58
        : Math.sin(Math.min(normAge * 4.5, 1.0) * (Math.PI * 0.5)) * (1.0 - normAge) * 0.82;

      const hoverDim = 1.0 - this.currentHover * 0.45;
      const cr = p.color.r;
      const cg = p.color.g;
      const cb = p.color.b;

      for (let s = 0; s < segsPerTrail; s++) {
        const p0 = p.points[s];
        const p1 = p.points[s + 1];

        this._trailForward.subVectors(p1, p0);
        if (this._trailForward.lengthSq() < 1e-8) {
          this._trailForward.set(1, 0, 0);
        } else {
          this._trailForward.normalize();
        }
        this._trailToCam.subVectors(this.camera.position, p1).normalize();
        this._trailSide.crossVectors(this._trailForward, this._trailToCam);
        if (this._trailSide.lengthSq() < 1e-6) {
          this._trailSide.set(0, 1, 0);
        } else {
          this._trailSide.normalize();
        }

        const t0 = s / segsPerTrail;
        const t1 = (s + 1) / segsPerTrail;
        const w0 = p.width * (0.12 + 0.88 * t0 * t0);
        const w1 = p.width * (0.12 + 0.88 * t1 * t1);

        const a0 = lifeEnvelope * t0 * t0 * hoverDim;
        const a1 = lifeEnvelope * t1 * t1 * hoverDim;

        const vBase = baseVertexOffset + s * 4;
        const pIdx = vBase * 3;

        posArr[pIdx] = p0.x - this._trailSide.x * w0;
        posArr[pIdx + 1] = p0.y - this._trailSide.y * w0;
        posArr[pIdx + 2] = p0.z - this._trailSide.z * w0;

        posArr[pIdx + 3] = p0.x + this._trailSide.x * w0;
        posArr[pIdx + 4] = p0.y + this._trailSide.y * w0;
        posArr[pIdx + 5] = p0.z + this._trailSide.z * w0;

        posArr[pIdx + 6] = p1.x - this._trailSide.x * w1;
        posArr[pIdx + 7] = p1.y - this._trailSide.y * w1;
        posArr[pIdx + 8] = p1.z - this._trailSide.z * w1;

        posArr[pIdx + 9] = p1.x + this._trailSide.x * w1;
        posArr[pIdx + 10] = p1.y + this._trailSide.y * w1;
        posArr[pIdx + 11] = p1.z + this._trailSide.z * w1;

        for (let k = 0; k < 4; k++) {
          const cIdx = (vBase + k) * 3;
          colArr[cIdx] = cr;
          colArr[cIdx + 1] = cg;
          colArr[cIdx + 2] = cb;
        }

        alphaArr[vBase] = a0;
        alphaArr[vBase + 1] = a0;
        alphaArr[vBase + 2] = a1;
        alphaArr[vBase + 3] = a1;
      }
    }

    this.trailPosAttr.needsUpdate = true;
    this.trailColAttr.needsUpdate = true;
    this.trailAlphaAttr.needsUpdate = true;
  }

  private buildLightRays(): void {
    const rayTexture = createLightRayTexture();
    this.disposables.push(rayTexture);

    const rayCount = 24;
    const tmpPt = new THREE.Vector3();

    for (let i = 0; i < rayCount; i++) {
      const mat = new THREE.SpriteMaterial({
        map: rayTexture,
        color: i % 2 === 0 ? 0xf5cf90 : 0xe8d5b2,
        transparent: true,
        opacity: 0.055,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const sprite = new THREE.Sprite(mat);
      this.curve.getPointAt(i / rayCount, tmpPt);
      sprite.position.set(
        tmpPt.x + (Math.random() - 0.5) * 26,
        tmpPt.y + 11.5,
        tmpPt.z + (Math.random() - 0.5) * 26,
      );
      sprite.scale.set(11.0 + Math.random() * 8.0, 32 + Math.random() * 14, 1);
      sprite.material.rotation = -0.48 + (Math.random() - 0.5) * 0.14;
      sprite.userData = { baseOpacity: 0.068 + Math.random() * 0.052, phase: Math.random() * 10 };

      this.scene.add(sprite);
      this.lightRays.push(sprite);
      this.disposables.push(mat);
    }
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('wheel', this.handleWheel, { passive: true });
    window.addEventListener('pointermove', this.handlePointerMove, { passive: true });
    window.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    window.addEventListener('touchmove', this.handleTouchMove, { passive: true });
    window.addEventListener('touchend', this.handleTouchEnd, { passive: true });

    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.handleContextRestored);
  }

  private handleResize = (): void => {
    if (this.isDisposed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const pixelRatio = this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    const aspect = width / height;

    this.camera.fov =
      aspect < 0.9 ? CAMERA_CONFIG.baseFovMobile : CAMERA_CONFIG.baseFovDesktop;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();

    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height);

    if (this.composer) {
      this.composer.setSize(width, height);
    }
    if (this.bloomPass) {
      this.bloomPass.resolution.set(width, height);
    }
    if (this.postPass) {
      this.postPass.uniforms.uResolution.value.set(width, height);
    }

    this.stemMaterial.uniforms.uAspect.value = aspect;
    for (const mat of this.headMaterials) {
      mat.uniforms.uAspect.value = aspect;
    }
    this.grassMaterial.uniforms.uAspect.value = aspect;

    this.flowerPointMaterial.uniforms.uPixelRatio.value = pixelRatio;
    this.flowerPointMaterial.uniforms.uViewportHeight.value = height;
    this.flowerPointMaterial.uniforms.uAspect.value = aspect;

    this.dustMaterial.uniforms.uPixelRatio.value = pixelRatio;
    this.dustMaterial.uniforms.uViewportHeight.value = height;
    this.dustMaterial.uniforms.uAspect.value = aspect;
  };

  private handleWheel = (e: WheelEvent): void => {
    this.targetScrollImpulse += e.deltaY * 0.000018;
  };

  private handleTouchStart = (e: TouchEvent): void => {
    if (e.touches.length > 0) {
      this.isTouching = true;
      this.touchLastY = e.touches[0].clientY;
      const width = window.innerWidth || 1;
      const height = window.innerHeight || 1;
      this.targetMouse.x = (e.touches[0].clientX / width) * 2 - 1;
      this.targetMouse.y = -(e.touches[0].clientY / height) * 2 + 1;
      this.pointerHasMoved = true;
      this.targetCursorActive = 1;
    }
  };

  private handleTouchMove = (e: TouchEvent): void => {
    if (!this.isTouching || e.touches.length === 0) return;
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    const dy = this.touchLastY - y;
    this.touchLastY = y;
    this.targetScrollImpulse += dy * 0.000018 * 20;

    const width = window.innerWidth || 1;
    const height = window.innerHeight || 1;
    this.targetMouse.x = (x / width) * 2 - 1;
    this.targetMouse.y = -(y / height) * 2 + 1;
    this.pointerHasMoved = true;
    this.targetCursorActive = 1;
  };

  private handleTouchEnd = (): void => {
    this.isTouching = false;
  };

  private handlePointerMove = (e: PointerEvent): void => {
    const width = window.innerWidth || 1;
    const height = window.innerHeight || 1;
    this.targetMouse.x = (e.clientX / width) * 2 - 1;
    this.targetMouse.y = -(e.clientY / height) * 2 + 1;
    this.pointerHasMoved = true;
    this.targetCursorActive = 1;
  };

  private handleContextLost = (e: Event): void => {
    e.preventDefault();
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
  };

  private handleContextRestored = (): void => {
    this.lastTimestamp = performance.now();
    this.tick(this.lastTimestamp);
  };

  public startHoverTransition(): void {
    this.targetHover = 1;
    this.audioStore.setMuffled(true);
  }

  public stopHoverTransition(): void {
    this.targetHover = 0;
    this.audioStore.setMuffled(false);
  }

  /**
   * Zero-allocation analytical terrain raycast from NDC pointer coordinates
   * returning exact world-space ground intersection for cohesive shader + particle interaction.
   */
  private updateCursorTerrainWorld(dt: number): void {
    this.currentCursorActive = THREE.MathUtils.damp(
      this.currentCursorActive,
      this.pointerHasMoved ? this.targetCursorActive : 0,
      5.0,
      dt,
    );

    if (!this.pointerHasMoved) {
      this._cursorWorldTarget.copy(this._smoothedLookTarget);
    } else {
      this.camera.updateMatrixWorld();
      this._rayDir.set(this.currentMouse.x, this.currentMouse.y, 0.5).unproject(this.camera);
      this._rayDir.sub(this.camera.position).normalize();

      let hit = false;
      let tPrev = 3.0;
      let tCurr = 3.0;
      const maxT = 90.0;
      const step = 2.6;

      for (let t = 3.0; t <= maxT; t += step) {
        this._rayPt.copy(this.camera.position).addScaledVector(this._rayDir, t);
        const h = sampleTerrainHeight(this._rayPt.x, this._rayPt.z);
        if (this._rayPt.y <= h) {
          tCurr = t;
          hit = true;
          break;
        }
        tPrev = t;
      }

      if (hit) {
        for (let b = 0; b < 4; b++) {
          const mid = 0.5 * (tPrev + tCurr);
          this._rayPt.copy(this.camera.position).addScaledVector(this._rayDir, mid);
          if (this._rayPt.y <= sampleTerrainHeight(this._rayPt.x, this._rayPt.z)) {
            tCurr = mid;
          } else {
            tPrev = mid;
          }
        }
        this._cursorWorldTarget.copy(this.camera.position).addScaledVector(this._rayDir, tCurr);
        this._cursorWorldTarget.y = sampleTerrainHeight(
          this._cursorWorldTarget.x,
          this._cursorWorldTarget.z,
        );
      } else {
        this._cursorWorldTarget.copy(this.camera.position).addScaledVector(this._rayDir, 36.0);
        this._cursorWorldTarget.y = sampleTerrainHeight(
          this._cursorWorldTarget.x,
          this._cursorWorldTarget.z,
        );
      }
    }

    if (!this.hasInitializedCursor) {
      this._cursorWorldCurrent.copy(this._cursorWorldTarget);
      this._prevCursorWorld.copy(this._cursorWorldTarget);
      this.hasInitializedCursor = true;
    } else {
      this._prevCursorWorld.copy(this._cursorWorldCurrent);
      this._cursorWorldCurrent.x = THREE.MathUtils.damp(
        this._cursorWorldCurrent.x,
        this._cursorWorldTarget.x,
        14.0,
        dt,
      );
      this._cursorWorldCurrent.y = THREE.MathUtils.damp(
        this._cursorWorldCurrent.y,
        this._cursorWorldTarget.y,
        14.0,
        dt,
      );
      this._cursorWorldCurrent.z = THREE.MathUtils.damp(
        this._cursorWorldCurrent.z,
        this._cursorWorldTarget.z,
        14.0,
        dt,
      );
    }

    const invDt = dt > 0.001 ? 1 / dt : 60;
    this._cursorVel
      .subVectors(this._cursorWorldCurrent, this._prevCursorWorld)
      .multiplyScalar(invDt);
  }

  /**
   * Elevated panoramic drone/tracking camera:
   * - Camera altitude stays genuinely elevated above local terrain (`elevationAboveTerrain`)
   * - Intro swoop eases down cleanly from +12u into +8.6u (never dropping into stems/grass)
   * - Look-at target is anchored directly near terrain height ahead + gentle lateral valley pan
   *   producing a natural cinematic downward landscape perspective.
   */
  private updateCamera(dt: number): void {
    if (this.introProgress < 1) {
      this.introProgress = Math.min(1, this.introProgress + dt * 0.65);
      if (this.introProgress >= 0.92 && !this.introNotified) {
        this.introNotified = true;
        this.onIntroDone();
      }
    } else if (!this.introNotified) {
      this.introNotified = true;
      this.onIntroDone();
    }

    this.currentHover = THREE.MathUtils.damp(this.currentHover, this.targetHover, 3.2, dt);
    this.currentMouse.x = THREE.MathUtils.damp(this.currentMouse.x, this.targetMouse.x, 4.2, dt);
    this.currentMouse.y = THREE.MathUtils.damp(this.currentMouse.y, this.targetMouse.y, 4.2, dt);

    const flightScale = this.prefersReducedMotion ? 0.15 : 1 - this.currentHover * 0.95;
    const targetVelocity = (CAMERA_CONFIG.driftSpeed + this.targetScrollImpulse) * flightScale;
    this.scrollVelocity = THREE.MathUtils.damp(this.scrollVelocity, targetVelocity, 4.2, dt);
    this.targetScrollImpulse *= Math.exp(-5.0 * dt);

    this.pathProgress = (this.pathProgress + this.scrollVelocity * dt + 1) % 1;

    const speedMetric = Math.abs(this.scrollVelocity - CAMERA_CONFIG.driftSpeed * flightScale) * 28.0;
    this.smoothedSpeed = THREE.MathUtils.damp(this.smoothedSpeed, speedMetric, 4.0, dt);

    // 1. Sample horizontal spline position and set camera altitude relative to terrain
    this.curve.getPointAt(this.pathProgress, this._pos);
    this.curve.getTangentAt(this.pathProgress, this._tangent);
    this._right.crossVectors(this._tangent, this._up).normalize();

    const swoopEase = Math.pow(1 - this.introProgress, 2.2);
    const localGround = sampleSmoothedTerrainHeight(this._pos.x, this._pos.z);
    // Gentle lateral drone drift + guaranteed terrain clearance
    const lateralDrift = Math.sin(this.elapsed * CAMERA_CONFIG.panFrequency * 0.7) * 2.2;
    this._pos.addScaledVector(this._right, lateralDrift);
    this._pos.y =
      Math.max(localGround, sampleTerrainHeight(this._pos.x, this._pos.z)) +
      CAMERA_CONFIG.elevationAboveTerrain +
      swoopEase * CAMERA_CONFIG.introExtraHeight;

    // 2. Decoupled terrain-anchored look-at target ahead for genuine downward panoramic framing
    const aheadT = (this.pathProgress + CAMERA_CONFIG.lookAheadProgress) % 1;
    this.curve.getPointAt(aheadT, this._lookTarget);

    const panSweep =
      Math.sin(this.elapsed * CAMERA_CONFIG.panFrequency + this.pathProgress * Math.PI * 2.0) *
      CAMERA_CONFIG.panAmplitude;
    this._lookTarget.addScaledVector(
      this._right,
      panSweep + this.currentMouse.x * CAMERA_CONFIG.mouseParallaxX,
    );

    const targetGround = sampleSmoothedTerrainHeight(this._lookTarget.x, this._lookTarget.z);
    this._lookTarget.y =
      targetGround +
      CAMERA_CONFIG.lookTargetTerrainOffset +
      this.currentMouse.y * CAMERA_CONFIG.mouseParallaxY -
      swoopEase * 1.1;

    if (!this.hasInitializedCamera) {
      this._smoothedLookTarget.copy(this._lookTarget);
      this.hasInitializedCamera = true;
    } else {
      this._smoothedLookTarget.x = THREE.MathUtils.damp(
        this._smoothedLookTarget.x,
        this._lookTarget.x,
        4.5,
        dt,
      );
      this._smoothedLookTarget.y = THREE.MathUtils.damp(
        this._smoothedLookTarget.y,
        this._lookTarget.y,
        4.5,
        dt,
      );
      this._smoothedLookTarget.z = THREE.MathUtils.damp(
        this._smoothedLookTarget.z,
        this._lookTarget.z,
        4.5,
        dt,
      );
    }

    this.camera.position.copy(this._pos);
    this.camera.lookAt(this._smoothedLookTarget);
    if (this.skyDome) {
      this.skyDome.position.copy(this._pos);
    }

    this.updateCursorTerrainWorld(dt);
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.isDisposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = (now = performance.now()): void => {
    if (this.isDisposed) return;

    const dt = Math.min((now - this.lastTimestamp) / 1000 || 0.016, 0.08);
    this.lastTimestamp = now;
    this.elapsed += dt;

    this.updateCamera(dt);

    this.terrainMaterial.uniforms.uCursorWorld.value.copy(this._cursorWorldCurrent);
    this.terrainMaterial.uniforms.uCursorActive.value = this.currentCursorActive;

    this.stemMaterial.uniforms.uTime.value = this.elapsed;
    this.stemMaterial.uniforms.uCursorWorld.value.copy(this._cursorWorldCurrent);
    this.stemMaterial.uniforms.uCursorActive.value = this.currentCursorActive;
    this.stemMaterial.uniforms.uHover.value = this.currentHover;

    for (const mat of this.headMaterials) {
      mat.uniforms.uTime.value = this.elapsed;
      mat.uniforms.uCursorWorld.value.copy(this._cursorWorldCurrent);
      mat.uniforms.uCursorActive.value = this.currentCursorActive;
      mat.uniforms.uHover.value = this.currentHover;
    }

    this.grassMaterial.uniforms.uTime.value = this.elapsed;
    this.grassMaterial.uniforms.uCursorWorld.value.copy(this._cursorWorldCurrent);
    this.grassMaterial.uniforms.uCursorActive.value = this.currentCursorActive;
    this.grassMaterial.uniforms.uHover.value = this.currentHover;

    this.fernMaterial.uniforms.uTime.value = this.elapsed;
    this.fernMaterial.uniforms.uCursorWorld.value.copy(this._cursorWorldCurrent);
    this.fernMaterial.uniforms.uCursorActive.value = this.currentCursorActive;
    this.fernMaterial.uniforms.uHover.value = this.currentHover;

    this.flowerPointMaterial.uniforms.uTime.value = this.elapsed;
    this.flowerPointMaterial.uniforms.uCursorWorld.value.copy(this._cursorWorldCurrent);
    this.flowerPointMaterial.uniforms.uCursorActive.value = this.currentCursorActive;
    this.flowerPointMaterial.uniforms.uHover.value = this.currentHover;

    this.dustMaterial.uniforms.uTime.value = this.elapsed;
    this.dustMaterial.uniforms.uCursorWorld.value.copy(this._cursorWorldCurrent);
    this.dustMaterial.uniforms.uCursorActive.value = this.currentCursorActive;
    this.dustMaterial.uniforms.uHover.value = this.currentHover;

    this.airStreamMaterial.uniforms.uTime.value = this.elapsed;
    this.airStreamMaterial.uniforms.uHover.value = this.currentHover;

    this.updateParticleTrails(dt);

    const hoverSq = this.currentHover * this.currentHover;
    const windDriftX = Math.sin(this.elapsed * 0.42) * 0.85;
    const windDriftZ = Math.cos(this.elapsed * 0.35) * 0.6;
    for (let i = 0; i < this.petalData.length; i++) {
      const p = this.petalData[i];
      const t = this.elapsed * p.speed + p.phase;
      this._dummy.position.set(
        p.basePos.x + Math.sin(t) * 0.75 + windDriftX * 0.35 + p.disperse.x * hoverSq,
        p.basePos.y + Math.cos(t * 0.8) * 0.45 + p.disperse.y * hoverSq,
        p.basePos.z + Math.sin(t * 0.7 + 1.2) * 0.75 + windDriftZ * 0.35 + p.disperse.z * hoverSq,
      );
      this._dummy.rotation.set(
        t * p.rotSpeed.x,
        t * p.rotSpeed.y,
        t * p.rotSpeed.z,
      );
      this._dummy.scale.setScalar(p.scale);
      this._dummy.updateMatrix();
      this.petalMesh.setMatrixAt(i, this._dummy.matrix);
    }
    this.petalMesh.instanceMatrix.needsUpdate = true;

    for (const ray of this.lightRays) {
      const base = ray.userData.baseOpacity as number;
      const phase = ray.userData.phase as number;
      ray.material.opacity =
        base * (0.78 + 0.22 * Math.sin(this.elapsed * 0.5 + phase)) * (1 - this.currentHover * 0.45);
    }

    if (this.postPass) {
      this.postPass.uniforms.uTime.value = this.elapsed;
      this.postPass.uniforms.uSpeed.value = this.smoothedSpeed;
      this.postPass.uniforms.uHover.value = this.currentHover;
    }

    if (this.isSoftwareGl || !this.composer) {
      this.renderer.render(this.scene, this.camera);
    } else {
      this.composer.render();
    }

    if (this.isSoftwareGl) {
      this.afterDraw(() => this.tick(performance.now()));
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  public dispose(): void {
    this.isDisposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('wheel', this.handleWheel);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleTouchEnd);

    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.handleContextRestored);

    this.audioStore.dispose();
    this.disposables.forEach((d) => d.dispose());
    this.composer?.dispose();
    this.renderer.dispose();
  }
}
