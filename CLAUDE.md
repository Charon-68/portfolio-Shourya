# CLAUDE.md — Shourya Saxena Portfolio

Personal portfolio for Shourya Saxena (B.Tech Mechanical Engineering + CSE minor, IIT Bombay).
The approved plan is in `docs/BLUEPRINT.md`. Direction **A, "Nocturne"**, was approved on 2026-11-20. Read the blueprint before any significant change.

## Commands
- `npm run dev` serves on http://127.0.0.1:3000. The Browser-pane launch config is "dev" in `.claude/launch.json`.
- `npm run build` runs `tsc --noEmit` and then `vite build`. It must pass before every commit.
- `npm run preview` serves `dist/` on :4173.

## Creative direction (non-negotiable)

**The valley persists.** The procedural botanical valley is the world of the whole site, not just a splash screen:
- Content opens over a dimmed valley.
- Each chapter moves the camera to its own waypoint.
- Contact lifts the camera back into the open meadow.

**Palette.**
- Night `#040705`, cream `#f5efe2`, ink `#151510`.
- **Pollen gold** is the one accent.
- Poppy red is for data contrast only.
- No purple gradients, neon, glassmorphism stacks, generic SaaS cards, or random icons.

**Type.**
- Antonio (display, names, numerals).
- Manrope (body).
- JetBrains Mono (small labels and metrics only).
- No other families.

**Projects are "plates".** Each one is an editorial spread built around an SVG architecture diagram drawn in thin cream lines, with numbered figures. Never a grid of small cards with badges.

**Motion.**
- Use Motion (`motion/react`) for DOM transitions.
- Use the engine for 3D.
- **No GSAP and no Lenis** unless the blueprint is revised. Native scroll only.
- Every animation needs a reduced-motion path.

## Engine rules (`src/engine/`)

**Do not change tuned values without explicit approval.** These are:
- `CAMERA_CONFIG`
- `computeTerrainCursorPush`
- `computeWindGust`
- `applyGoldenHourFog`
- the terrain functions and spline radii
- the bloom settings `(0.45, 0.56, 0.59)`
- the `SplitRgbNoiseVignetteShader` constants
- the per-species instance distributions

Add behaviour through new APIs (`setMode`, `flyTo`, `setQuality`, `onProgress`) instead of editing those.

**React integration.**
- `ValleyEngine` stays framework-agnostic: no React imports.
- React talks to it through a ref or context.
- Never push per-frame engine values into React state.

**Input.**
- The engine reads wheel and touch on `window`. Any scrollable content must be gated: those events are ignored outside `explore` mode or when they come from inside the content layer.
- Never intercept native scroll in order to drive the camera.

**Lifecycle.**
- One animation loop only.
- Everything created must be registered in `disposables`.
- Pause when `document.hidden`.
- Handle context loss and restore.
- If WebGL fails, show a static poster fallback. The site must stay fully usable without WebGL.

**Performance.**
- Cap DPR.
- Use quality tiers (high / medium / low) that scale instance counts and post-processing.
- Lazy-load `three` and the engine.
- Mobile uses the low tier.

**Engine API (M2).** React only talks to the engine through `useValley()` (`src/scene/useValley.ts`). The engine is owned by `src/scene/ValleyProvider.tsx`.
- `setMode('explore' | 'content' | 'contact')`:
  - `explore`: wheel/touch fly the camera.
  - `content`: input ignored, hover transition on, rendering at 30 fps.
  - `contact`: the camera rises by `introExtraHeight`.
- `flyTo(progress 0..1)`: eases to a waypoint, about 2 s for a 0.2 hop. Reduced motion cuts instead of travelling.
- `setPaused(bool)`: stops rendering entirely (use when an opaque page fully covers the canvas).
- `getTelemetry()`: read on demand. Never put it in React state per frame.
- `status`, `progress`, `introDone`, `tier`: React state for the loader and UI.

**Quality tiers** live in `src/engine/capabilities.ts`:

| Tier | DPR cap | Geometry density | Point density | Post-fx | Render cost* |
|---|---|---|---|---|---|
| high | 2 | 1 | 1 | yes | 19.0 ms |
| medium | 1.5 | .6 | .9 | yes | 11.6 ms |
| low | 1 | .35 | .8 | no | 5.4 ms |

\*Measured on an Apple M1 at 1440×900, forced sync.

- **Auto-selection:** software GL → low; coarse pointer with screen < 820 → low; ≤ 4 cores or ≤ 4 GB → medium; otherwise high.
- **Runtime step-down:** if explore-mode fps stays under 36 for 4 s, the engine first caps DPR at 1, then drops post-fx.

**QA switches** (any build):
- `?quality=high|medium|low`
- `?webgl=off` (forces the static fallback; no engine download)

In dev, `window.__valley` exposes the engine for console testing, e.g. forcing a context loss via the `WEBGL_lose_context` extension.

**Embedded preview panes** may report `document.hidden` while on screen. The rAF loop therefore doesn't trust `document.hidden`; only the software-GL timer loop pauses on it.

## Content rules (hard)

**Facts.**
- The resume (`~/Desktop/Shourya-Resume.pdf`) is the source of truth.
- Never invent metrics, links, repos, demos, roles, dates, companies or certifications.
- Rewording is allowed. Changing facts is not.
- Missing content becomes a typed `null` with a visible TODO in the UI, and an entry in `docs/CONTENT-TODO.md`.

**Never publish** DOB, gender, roll number, or the unredacted resume.

**Content lives only in `src/content/*.ts`.** No hard-coded copy in components.

**Metrics get a context line** (eval set, backtest period, split) once Shourya supplies it.

## Engineering
- Stack: Vite, React 19, TypeScript, Tailwind v4, three, motion, lucide-react. Do not add frameworks without a written reason in the blueprint.
- No API keys and no server code. It is a static deploy to Vercel.
- Accessibility:
  - a real `<h1>`;
  - a skip link;
  - visible focus;
  - focus trap and focus return on overlays;
  - full keyboard operation;
  - AA contrast for text over the valley.
- Assets:
  - `public/` holds only production assets: WebP/AVIF images and WOFF2 fonts.
  - Design references live in `design/references/`, which is gitignored and never shipped.

## Workflow
- Build in the milestone order of blueprint §6 (M0…M9). Commit a git checkpoint at the end of each milestone.
- **Visual verification is mandatory.** After each section:
  1. run it in the Browser pane;
  2. take screenshots at 1440, 1024 and 375 wide;
  3. fix what you see;
  4. check the console.

  Never claim verification without screenshots.
- Use a fresh-eyes subagent design and code review at M5 and M9.
