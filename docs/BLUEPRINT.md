# Shourya Saxena — Portfolio Blueprint (Phase 1: research + plan)

Status: **awaiting approval**. Nothing in the app has been changed. The only edits so far: `npm install` in `fernhollow/` (needed `--legacy-peer-deps`, see §3.6) and a `.claude/launch.json` so the dev server can run in the browser pane.

---

## 0. What was inspected (and what wasn't)

| Resource | Status | How |
|---|---|---|
| Resume `~/Desktop/Shourya-Resume.pdf` | Both pages read in full | PDF read |
| Fernhollow ZIP | Read in full: every file in `src/`, all configs, all 7 images | Source read + run locally (Vite, port 3000), screenshots at 1024×768 and 375×812 |
| Friend's repo | Shallow clone, source read | Not installed or run |
| Friend's live site | Opened in a browser; hero, intro, work grid scrolled and screenshotted | Project detail pages were not opened |

**Things to note:**

- **ZIP name.** The only archive on disk is `~/Downloads/fernhollow.zip` (12:59 today). There is no `fernhollow(2).zip`. The extracted `portfolio/fernhollow/` is byte-identical to that ZIP.
  - I'm treating it as the **updated** version because `App.tsx:133` already has `<h1>Shourya Saxena</h1>`, and it contains `CAMERA_CONFIG`, `computeTerrainCursorPush`, `applyGoldenHourFog` and the multi-species ecosystem.
  - No older ZIP was available, so I couldn't do a before/after diff.
- **Software-GL fallback.** I didn't exercise it; the M1 GPU always took the hardware path. WebGL context loss wasn't triggered either. Both are on the QA list.

---

## 1. Source analysis

### 1.1 Updated Fernhollow: how it actually works

**Stack**
- React 19, Vite 8, TypeScript 7, Tailwind v4, three 0.187, motion, lucide-react.
- About 5.5K lines in total. Most of that is in `src/engine/ValleyEngine.ts` (2,888 lines).
- The engine is a plain TypeScript class with no React inside it. That's a big asset: it can be wrapped, not rewritten.

| System | Implementation (file:line) | Verdict |
|---|---|---|
| Renderer | ACES filmic tone mapping (exposure 1.06), sRGB, DPR capped at 2 (1 on software GL), `powerPreference: high-performance` (`ValleyEngine.ts:392-404`) | Keep. Add quality tiers (§5.5). |
| Camera | `CAMERA_CONFIG` (`:27`): 8.6u above terrain, 3.4u intro swoop, look-ahead 0.048 along a closed Catmull-Rom loop (radii 44×78), pan amplitude 5.2 at 0.14 Hz, mouse parallax 2.8/1.4, FOV 54 (desktop) / 62 (mobile), drift 0.0068. `updateCamera()` (`:2657`) samples a 5-tap smoothed terrain height so the camera never bobs, and damps the look target separately. | **Keep the values exactly.** Only add an API on top. |
| Terrain | Analytic height function `sampleTerrainHeight` (`:200`), built from broad hills, swells and valley banks, which the GPU and CPU share | Keep |
| Cursor | `updateCursorTerrainWorld()` (`:2562`): an analytic ray march (step 2.6, up to 90u), then 4 bisection steps, with no allocations. The world point is damped at 14 and fed as `uCursorWorld` to every material. | Keep. This is the best interaction in the project. |
| Cursor push | `computeTerrainCursorPush` (`:146`): a Gaussian falloff (`exp(-n²·2)`) pushes radially and also outputs a glow term. It's shared GLSL across terrain, stems, heads, grass, ferns and points (radius 7.5 for the point carpet, `:1695`). | Keep |
| Wind | `computeWindGust`: two travelling gust waves, per-instance flutter, and a perpendicular cross-flutter | Keep |
| Ecosystem | Instanced stems and heads, split by species: 3,800 poppy (cupped), 2,500 daisy, 2,100 spike. Plus 18,000 grass tufts, 3,400 fern rosettes, 420 rocks, a 38,000-point sprite carpet drawn from a canvas atlas, 260 instanced petals, dust and air streams, a trail pool, and light-ray sprites. All geometry and textures are procedural (`botanicalGeometries.ts`, `botanicalTextures.ts`), so there are **zero image or model downloads**. | Keep. Scale the counts by quality tier. |
| Fog | `applyGoldenHourFog` (`:163`): squared-exponential distance fog plus low valley mist. It blends twilight green (0.025, 0.038, 0.031) toward warm sun mist (0.215, 0.142, 0.074) by how closely the view ray lines up with the sun (sun direction (0.58, 0.25, -0.77)). | Keep |
| Post-processing | `UnrealBloomPass(strength 0.45, radius 0.56, threshold 0.59)`, then `SplitRgbNoiseVignetteShader`: chromatic aberration only past r>0.42, a 4-tap edge blur only at the frame border, saturation ×1.13, grain 0.018, and a vignette that tightens with scroll speed. The centre of the frame stays sharp. | Keep |
| "Hover transition" | `start/stopHoverTransition()`: flight slows by 95%, petals disperse, light rays dim, and the audio is muffled. This is how the existing panel opens. | Reuse as the "content mode" transition |
| Input | Listeners on `window` for `wheel`, `pointermove` and `touch*`. Wheel adds to `targetScrollImpulse`. | **Has to change** (§3.6) |
| Audio | `AudioEngine.ts`: fully synthesised. A 5-voice drone with breathing LFOs, pink-noise wind and random chimes, run through a low-pass "muffle". Starts muted. **No audio files.** | Keep, but fix the init timing (§3.6) |
| Loader | A pulsing dot that hides on the first frame | Replace with real staged progress |
| Lifecycle | `dispose()` removes listeners, disposes every registered geometry, material and texture, and the composer and renderer | Good. Gaps are listed in §3.6. |

**What I saw in the browser (M1, Chrome-based pane)**
- At 1024×768 the hero renders cleanly. It's a dark meadow with emissive poppies, daisies and spikes, and the name is readable.
- Measured **≈32 fps** at DPR 2 with the full composer. That's acceptable on desktop, but there's no headroom for mobile.
- At 375×812 (mobile emulation) the loader was **still showing after 5 s**. The whole scene is built synchronously in the constructor, which blocks the main thread.
- The 3 landscape reference screenshots (see below) show a softer, more depth-of-field "tilt-shift" look than the current build, whose post shader deliberately keeps the centre sharp. I'll keep the current behaviour unless you prefer the softer look.
- The current Work panel is a centred, rounded, translucent modal with a flat list. It's adequate for a studio and too thin for case studies.

### 1.2 Reference assets: `public/assets/aistudio/` (14.9 MB, referenced by no code)

| File | What it is | Decision |
|---|---|---|
| `image_b6670d7c`, `image_b7bef5cb`, `image_b966b9a2` (wide) | Screenshots of the earlier Fernhollow hero ("Grown, not built.") | **Design reference only.** Move out of `public/`. |
| `image_0d988f8c` (forest god-rays and roses), `image_1d938583` (hillside wildflowers at sunset), `image_2df862d5` (lilies on black), `image_f1d99bb3` (fantasy arch garden) | Mood images, apparently AI-generated or saved from a moodboard. Rights unknown. | **Reference only. Never ship them.** Move to `design/references/`. |

None of these are production assets. Shipping `public/` as it is would add 15 MB to the deploy for nothing.

### 1.3 Friend's portfolio: Amogh-ui/amogh-portfolio

**Stack:** vanilla JS and Vite multi-page, GSAP + ScrollTrigger, Lenis, three. The whole home page is built with `innerHTML` from a 2,061-line `main.js`, and each of the 8 project pages is its own near-duplicate HTML/JS/CSS set.

**Identity:**
- An electric-blue (`#0a5cff`) shader hero, with the name in Geist plus a PP Editorial New italic.
- A "tap to enter" intro.
- An orbiting-thumbnail interlude.
- A work grid of mockup-heavy cards with tag chips.
- A footer with a halftone canvas and a local-time clock.
- It's a **product and UX designer's** portfolio, so the work is told visually through mockups. Yours is engineering work with almost no screenshots, and that changes the storytelling strategy (§4).

**Worth borrowing (adapted, not copied):**
1. A loader driven by real loading progress (theirs counts actual image loads, `main.js:112-150`).
2. Continuity: the hero name shrinks into the header.
3. The work index as an expandable **list** (rows reveal an overview in place) with an alternative view.
4. A **sticky section index** on case studies that highlights the current phase.
5. Offscreen canvases pausing via IntersectionObserver, plus lazy `import()` of the WebGL code.
6. A disciplined palette: near-black, warm cream ink and one accent; a serif italic against a sans.
7. Thorough reduced-motion handling (Lenis, intro and GSAP all skipped).
8. Small human details (their local clock).

**Avoid (with evidence):**
1. **Case-study text baked into 1–1.6 MB JPEGs**, 14 per page (~15–20 MB). Search engines and screen readers can't read it.
2. **No real routing.** Cards are `<button>`s that call `location.href`, so there's no "open in new tab"; full page reloads cause a flash; the URL map is duplicated (`main.js:733`, `:773`).
3. **The intro gates the content.** "Tap to enter" locks scroll, which costs you recruiters.
4. **Uncapped DPR** on the full-screen shader.
5. **Empty-shell SEO.** No meta description, no OG tags, and `robots.txt` and `sitemap.xml` both 404.
6. **Asset weight.** A 74.8 MB autoplay MP4, PNG thumbnails, 45 OTF font files with no WOFF2.
7. **The name heading is `aria-hidden`**, so the hero has no accessible h1.
8. **Live-site defects I saw:**
   - The fixed header text collides with card titles while scrolling (the "ScreenCalorie" row overlaps "Amogh Shete").
   - A mid-scroll transition shows a fully blank black viewport.

### 1.4 Resume → content model (facts preserved verbatim)

**Identity**
- B.Tech, **Mechanical Engineering**, IIT Bombay, graduating 2028, CPI 8.15.
- Minor in CSE.
- "Upcoming AI/ML Intern at **American Express**". This is on the resume but wasn't in your brief. Should it go on the site?

**Experience**
- **OLA Krutrim**, Maps & Mobility, SDE Intern, Jun'26–Present.
- **PetsGo & PetsDoor**, PINN & LLM team, ML Intern, May'26–Present.
- **SDOTJ Hospitality**, Data Analytics Intern, Jun'26–Jul'26, with an LoR.

**Projects (11)**
- The 9 in your brief.
- Two more from Positions of Responsibility:
  - **UGAC Project Allocation Platform** (6,000+ students, deployed on Gymkhana servers).
  - **Airship route planner** (GRIB weather data, A*/Dijkstra).
- PINN engineering lives in the PetsGo experience entry.

**Achievements**
- District Topper and H.S.C. merit rank 140 of 600K+.
- CBSE top 0.1%.
- Codeforces Specialist, 1450+.
- Codeforces Round 1104 rank 1,342 of 24K+.
- INSPIRE-SHE, top 1%.
- Medhavi Chhatra and Excellence Medal (MSME Minister).
- CodeWars V5: 17th of 500+.
- Web Brawl GC: 4th.

**Certifications and courses**
- AWS Cloud (S3, EC2, IAM, VPC).
- Google Cloud MLOps (Kubeflow, TFX, CI/CD).
- JPMorgan Chase Quantitative Research simulation (99%+ ROC-AUC, 10K+ loans).
- Tata GenAI Data Analytics.

**Beyond code**
- Mentored 3 teams and 10+ students (CodeWars V6).
- Guided 10+ mentees (WiDS'25, SoS'26).
- Ultimate Frisbee: 2nd at Freshiesta'25 and at the Institute Sports GC'26.
- A year of Keyboard training under NSO.

**Differences between your brief and the resume.** The resume wins on all of these:
- **Deep RL:** the resume gives the exact margins, +12.3% over Buy-and-Hold and +38.7% over MA Crossover. I'll use those numbers instead of "outperformed".
- **Fatigue predictor:** the resume calls it a **MoE** pipeline (Gradient Boosting & Random Forest), with features cut from 26 to "16(NC), 7(C)". I'll keep that notation and ask you what NC/C mean.
- **Vision Meets Transformers** has a 4th fact that isn't in the brief: the residual-ablation finding of **49% loss degradation**.

**Never published:** DOB, gender and roll number from the resume header. The resume served on the site must be a redacted copy (§7).

### 1.5 Technical risks

1. **Wheel and touch conflict.** The engine reads `wheel` and `touch*` on `window`. Any scrollable content would also fly the camera, and the touch-drag handler turns every mobile swipe into flight.
2. **No WebGL fallback.** If WebGL is missing, `new WebGLRenderer` throws inside a `useEffect`, and the app white-screens with a black loader forever.
3. **Blocking build.** The constructor builds about 70K instances, canvas atlases and a shader compile in one go, which caused the slow mobile load (>5 s).
4. **Same density everywhere.** There's no tier for instance counts or post-processing: mobile gets the same 18K grass and 38K points as desktop.
5. **Wasted rendering.** It keeps rendering when the tab is hidden, and while a full-screen overlay covers it.
6. **Incomplete context restore.** On `webglcontextrestored` it only restarts the tick, so the procedural `CanvasTexture`s may need `needsUpdate`. Untested.
7. **Audio init timing.** The `AudioContext` is created on mount, before any user gesture, so it starts suspended and Chrome logs warnings.
8. **Dependency debt:**
   - `@google/genai`, `express`, `dotenv`, `tsx`, `@types/express` are unused.
   - The pinned `esbuild ^0.25` breaks `npm install` against vite 8 (needed `--legacy-peer-deps`).
   - AI Studio leftovers: the `metadata.json` Gemini capability, `.env.example` with `GEMINI_API_KEY`, the vite `copy-unbundled-src-assets` plugin and the `DISABLE_HMR` hooks.
   - Build-time packages listed under `dependencies`.
9. **SEO and accessibility gaps:** Fernhollow meta/OG, `overflow:hidden` on `html/body`, no skip link, and `aria-hidden` set on the container instead of the canvas only. The panel is `role=dialog` but has no focus trap or focus return.

---

## 2. Reuse / Adapt / Redesign / Remove

| **Reuse as-is** | **Adapt** | **Redesign** | **Remove** |
|---|---|---|---|
| `CAMERA_CONFIG`, terrain functions, spline | `ValleyEngine` constructor → staged async build with progress + quality tier | `StudioSheet` → full content layer + case-study routes | `@google/genai`, `express`, `dotenv`, `tsx`, `@types/express`, esbuild pin, `autoprefixer` |
| `computeTerrainCursorPush`, `computeWindGust`, `applyGoldenHourFog` | Input binding → mode-gated (`explore` / `content` / `contact`) | Hero copy, nav (7 items), mobile menu | `metadata.json`, `.env.example`, AI Studio README, vite copy plugin, `DISABLE_HMR` |
| All botanical geometries, textures and shaders | `start/stopHoverTransition` → `setMode()` | Loader → real staged progress | `public/assets/aistudio/` (moved to `design/references/`) |
| Bloom + post shader parameters | AudioEngine → lazy init on first toggle | Contact (fake form → real links) | Fernhollow branding, studio copy, journal, `hello@fernhollow.studio` |
| `dispose()` pattern, software-GL detection | DPR / instances / bloom by tier, visibility pause | Typography scale, tokens, focus handling | `overflow:hidden` on `html` (content needs native scroll) |

---

## 3. Three visual directions

All three keep the valley as the hero. They differ in **what happens after the first screen.**

### A. "Nocturne": one continuous world ★ recommended

- **Concept:** the valley never leaves. The site is one place you move through, and your engineering work is set into it like field notes on a night walk.
- **Hero:** the current valley, unchanged in feel.
  - "SHOURYA SAXENA" in Antonio, a two-line tagline, an "Explore work" control.
  - A small live engine readout in the corner, e.g. `x 12.4 · z −33.1 · 58 fps`. It's a quiet signal that this was engineered, not bought.
- **Moving through the site:** clicking Work (or scrolling past the hero) runs the existing hover transition: flight slows to 5%, petals disperse, audio muffles.
  - A content layer rises over a dimmed, slightly desaturated valley (a CSS gradient scrim; no blur, for performance).
  - The camera then **eases to a different waypoint on the loop for each chapter** (Work → Experience → About…). The valley behind changes subtly as you read.
  - **Contact reverses it:** the scrim fades away, the camera rises (intro swoop in reverse) and you end in the open meadow.
- **Palette:** night (`#040705`), cream ink (`#f5efe2`), with **pollen gold** as the single accent, taken from the bloom highlights. Poppy red appears only in data (e.g. "before" values).
- **Type:**
  - Antonio (condensed display, already in place) for names and numbers.
  - Manrope for body text.
  - JetBrains Mono, small sizes only, for metrics, labels and the readout.
- **Projects are "plates":** each one gets a large editorial spread built around a **hand-made SVG architecture diagram**, drawn as thin cream lines like a botanical plate, with numbered figures ("Fig. 01 — Hybrid retrieval").
  - This solves the missing-screenshots problem honestly, and it shows how much you understand each system.
- **Motion:**
  - Diagrams draw themselves (stroke-dashoffset) when they enter the viewport.
  - Metric numbers count up once.
  - Text lines reveal via clip-path.
  - Everything is skipped under reduced motion.
- **Risk:** keeping WebGL running behind long content. Mitigated by content-mode throttling (§5.5).

### B. "Herbarium": night valley, daylight archive

- **Concept:** a two-world contrast. The night valley is the threshold; scrolling past it brings you into a cream, paper-toned editorial archive, like a natural-history collection of your systems.
- **Hero:** the same valley. Scrolling lifts the camera into fog and then cross-fades to paper.
- **Palette:** paper `#f3eee3`, ink `#151510`, moss `#3e4a3a`, poppy `#c4492b` as the accent.
- **Type:** Antonio headlines, Newsreader (serif) body, mono for specimen labels.
- **Layout:** asymmetric plate pages with specimen numbers ("No. 03 · Retrieval Systems"), Linnaean-style taxonomy for skills (Domain → Family → Tool), and technical drawings in ink.
- **Strengths:** the most readable, the fastest (the canvas fully pauses after the hero), and very editorial.
- **Weaknesses:** the valley becomes a splash screen. The 3D investment pays off only once, and the light/dark switch is hard to make feel seamless.

### C. "Field Station": the instrument view

- **Concept:** you're looking at the valley through a research instrument.
- **Interface:**
  - The UI is a calibrated HUD: mono type, crosshair cursor, live telemetry from the engine (camera altitude, cursor world coordinates, instance counts, frame time).
  - Projects are "logs" with charts.
  - Experience is a signal timeline.
- **Palette:** night, cream, instrument amber `#ffb347`, sparing cyan for selection.
- **Strengths:** it says "engineer" most loudly, and the telemetry is real, not decoration.
- **Weaknesses:** it slides toward generic sci-fi HUD styling, which is exactly what your brief warns against. Dense mono UI also tires readers over long case studies.

### Recommendation: **A (Nocturne)**, plus two ideas borrowed from the others

1. **From B:** the **plate and figure language** for case studies (numbered figures, ink-line diagrams, generous margins). It's the most legible format for long technical reading.
2. **From C:** **one** restrained telemetry readout in the hero corner, using real engine values. It's an engineering signature without turning the site into a HUD.

**Why A:**
- It's the only direction where the 3D world earns its cost on every screen, not just the first one.
- The organic-world versus engineering-content contrast you asked for runs through the whole site, instead of being a splash screen (B) or a costume (C).
- It reuses the engine's existing transition machinery (hover, muffle, disperse) rather than inventing a new one.

---

## 4. Information architecture and content

### 4.1 Routes

Real URLs, so case studies can be shared and indexed. React Router 7 in declarative/library mode, with lazy-loaded routes, a Vercel SPA rewrite, and pre-rendered HTML per route at build time for SEO (a small `vite-react-ssg`-style step, or a simple script). That last part is decided in M8.

```
/                  Hero (valley in explore mode)
/#work … /#contact The scrolling "journal" over the valley (one long document, in-page anchors, hash sync)
/work/:slug        Case study (full page over the dimmed valley; sticky section index)
/resume            → redirects to /Shourya-Saxena-Resume.pdf (redacted)
*                  404 that sends you back to the valley
```

**Nav:** Home · Work · Experience · About · Beyond Code · Contact · Resume ↗.
- On desktop it's an inline uppercase row, as now.
- On mobile it's a full-screen menu over the dimmed valley (focus-trapped, closes on Esc).

### 4.2 The journal document, in order

1. **Work.** An editorial index of all projects, then 2 "systems in the field" (UGAC, Airship).
2. **Experience.** A **concurrency timeline** (Gantt-style on a 2025–26 axis).
   - Your internships and roles overlap (OLA ∥ PetsGo ∥ SDOTJ ∥ Airship), and a plain vertical list hides that.
   - Selecting a row expands its bullets and stack.
   - Positions of Responsibility sit on the same axis as a second lane.
3. **About.** A short first-person bio, then Education (IIT Bombay ME, CSE minor, CPI if you want it shown), then **Achievements** and the **Technical Arsenal** as sub-chapters.
4. **Beyond Code.** Warmer and looser: mentoring numbers, Frisbee, Keyboard, CodeWars and Web Brawl, certifications. It needs photos (optional; §7). The fallback is typography plus small illustrations drawn in the plate style.
5. **Contact.** The scrim lifts and the camera rises. "Let's build what's next." Email, LinkedIn, GitHub, Resume. No fake form.

### 4.3 Project hierarchy

| Tier | Projects | Treatment |
|---|---|---|
| **Flagship**: full case study + bespoke animated diagram | 01 Legal GraphRAG · 02 Vision Meets Transformers · 03 Traffic Analytics & MOT · 04 Coding Duel System · 05 Deep RL Trading | Large plate on the index, all 10 fields, 3–5 figures |
| **Selected**: shorter case study + one diagram | 06 SIH AI Tariff Simulator · 07 Neural Retrieval · 08 Fatigue Strength Predictor · 09 Cross-Generator Image Forensics | Compact row on the index, all 10 fields, short |
| **Systems in the field** | UGAC Project Allocation Platform · Airship Route Planner | Case-study pages, linked from Experience and Work |

**Proposals, since you asked me to challenge weak spots:**

1. **Promote the UGAC platform.** It's the only project with **real users at scale** (6,000+) and a production deployment. To a reviewer that reads more strongly than several model benchmarks. I'd place it in Work right after Coding Duel.
2. **Give metrics their context.**
   - "MRR = 1.00" and "49.4% return" will make careful engineers raise an eyebrow unless the evaluation setup is right next to them.
   - Each metric gets a short context line (e.g. "49.4% return, backtested over [TODO: period]"; "MRR 1.00 on [TODO: N-query eval set]").
   - I won't invent that context. It stays as a visible TODO until you supply it.

**Case-study template** (shared for every project, driven by data):
`Header (no. · category · context · period) → Intro → Problem → Fig. Architecture → My contribution → Implementation notes → Stack (grouped) → Results (metric tiles with context) → Links (repo / demo, or "private / on request") → Next project`

### 4.4 Section visualisations: each has to earn its place

| Section | Visual | Why it's there |
|---|---|---|
| Work index | Hovering or focusing a row previews its architecture diagram | No screenshots exist, and the diagram is the substance |
| Case studies | Animated SVG system diagrams, e.g. GraphRAG: BM25 ∥ MiniLM → RRF → Cross-Encoder → Neo4j multi-hop → Qwen3-8B | Shows understanding, not decoration |
| Experience | Concurrency timeline | Shows real parallel workload |
| Achievements | Four large figures with a single thin percentile rule each (140 / 600K+, top 0.1%, top 1%, 1450+) | Restrained. No badge wall. |
| Arsenal | An **evidence map**: grouped skills; selecting one highlights the projects and roles that used it | Turns a list of skills into proof |
| Contact | The valley itself | It closes the loop |

### 4.5 Tagline options (please pick one, or edit)

1. **"Building intelligent systems — from first principles to production."** (recommended: it ties "VLM from scratch" to "deployed at OLA")
2. "Models, pipelines, and the software that makes them real."
3. "Building intelligent systems. Engineering what comes next." (your draft)

Supporting line: `Software Engineering · Applied Machine Learning · Systems`

---

## 5. Technical architecture

### 5.1 Stack decision

Keep **Vite + React 19 + TypeScript + Tailwind v4 + three + motion**. No framework migration: Next.js adds nothing that justifies rewiring a canvas-centric SPA.

**Add:**
- `react-router` (routes).
- `@fontsource` packages for self-hosted WOFF2 fonts (Antonio, Manrope, JetBrains Mono, subset to Latin).

**Do not add:**
- **GSAP:** motion already covers reveals, layout and presence, and scroll-linked camera waypoints go through the engine API, not a scroll library.
- **Lenis:** native scroll keeps the engine's input handling intact and works better for accessibility.

### 5.2 Folder structure

```
portfolio/                      ← promote fernhollow/ contents to repo root; git init
├─ CLAUDE.md                    long-term design + engineering constraints
├─ docs/ BLUEPRINT.md · DESIGN-SYSTEM.md · CONTENT-TODO.md
├─ design/references/           the 7 aistudio images (not shipped)
├─ public/  Shourya-Saxena-Resume.pdf (redacted) · og.jpg · poster.webp · favicon.svg · robots.txt · sitemap.xml
└─ src/
   ├─ main.tsx · App.tsx · routes.tsx
   ├─ engine/          ValleyEngine.ts (tuned values untouched) · AudioEngine.ts · botanical*.ts
   │                   config.ts (CAMERA_CONFIG moved here verbatim) · quality.ts · waypoints.ts
   ├─ scene/           ValleyCanvas.tsx (mount/fallback/lifecycle) · ValleyContext.tsx (setMode, flyTo, progress)
   ├─ components/
   │   ├─ layout/      Header · Nav · MobileMenu · SoundToggle · Loader · Telemetry · SkipLink
   │   └─ ui/          Button · ArrowLink · Metric · Figure · SectionHeading · Reveal · TagList
   ├─ sections/        Hero · WorkIndex · Experience · About · Achievements · Arsenal · BeyondCode · Contact
   ├─ pages/           Journal.tsx · CaseStudy.tsx · NotFound.tsx
   ├─ diagrams/        GraphRag.tsx · Vlm.tsx · Mot.tsx · CodingDuel.tsx · DeepRl.tsx · … (SVG + motion)
   ├─ content/         profile.ts · projects.ts · experience.ts · achievements.ts · skills.ts · beyond.ts · links.ts
   ├─ styles/          tokens.css · base.css · index.css
   └─ lib/             motion.ts (shared easings/durations) · useReducedMotion · useInView · seo.ts
```

### 5.3 Content types

These are the single source of truth. Missing items stay `null` with a TODO, and the UI shows "Private / available on request" instead of a dead link.

```ts
type Metric = { value: string; label: string; context?: string | TODO };
type Project = {
  slug: string; no: number; tier: 'flagship' | 'selected' | 'field';
  title: string; category: string; context: string; period: string;  // e.g. "Summer of Science · Maths & Physics Club", "May'26–Jul'26"
  intro: string; problem: string;
  architecture: { diagram: DiagramId; caption: string };
  contribution: string[]; implementation: { heading: string; body: string }[];
  stack: { group: string; items: string[] }[];
  metrics: Metric[];
  links: { repo: string | null; demo: string | null };
  related?: { experience?: string[]; skills?: string[] };
};
```

### 5.4 Engine integration: small, explicit API, tuned values untouched

```ts
engine.setMode('explore' | 'content' | 'contact')
//  explore: current behaviour (wheel/touch drive flight)
//  content: wraps startHoverTransition, input listeners ignore events, render throttled
//  contact: reverse swoop, flight resumes slowly

engine.flyTo(progress, { duration })   // eases pathProgress to a chapter waypoint (adds to velocity, never teleports)
engine.onProgress(cb)                  // real staged-build progress → loader
engine.setQuality('high' | 'medium' | 'low')
engine.getTelemetry()                  // read by the readout via rAF, never through React state
```

- Wheel and touch listeners check `mode === 'explore'` and ignore events that come from inside the content layer. In explore mode, wheel down past a threshold (or the Explore button) switches to content mode.
- The engine stays out of React state. React talks to it through refs and context, with no per-frame re-renders.

### 5.5 Performance strategy

**Quality tiers**, picked at startup from `hardwareConcurrency`, viewport size, software-GL detection and a 1-second fps probe, then adjusted downward at runtime if fps stays under 40:

| Tier | DPR | Grass / Flowers / Points | Bloom | Trails |
|---|---|---|---|---|
| High | ≤2 | 100% | yes | yes |
| Medium | ≤1.5 | 60% | yes (half resolution) | reduced |
| Low (mobile / software GL) | 1 | 35% | no | off |

**Other measures:**
- **Staged build:** the constructor yields between `build*` steps (`await` a frame), which gives real progress and no long blocking task.
- **Content mode:** render at 30 fps with no bloom. Fully paused on `document.hidden` or when an opaque case-study backdrop is fully shown.
- **WebGL failure:** `try/catch` around init sends you to a static `poster.webp` (captured from the engine itself, ~150 KB) plus a CSS gradient. The whole site works with no WebGL.
- **Context loss:** pause, then on restore mark all `CanvasTexture`s `needsUpdate`. If that fails, rebuild the engine.
- **Code splitting:** `three` and the engine are dynamically imported so first text paints immediately; journal sections and diagrams load lazily.
- **Budgets:** JS ≤ 350 KB gzip excluding three; LCP < 2.5 s on fast 4G for the hero text; zero layout shift from fonts (`size-adjust` fallbacks).

### 5.6 Accessibility and SEO

**Accessibility**
- A real `<h1>`, a skip link, native scroll, visible focus, and a focus trap plus focus return on menus and overlays.
- Every interaction works by keyboard.
- `prefers-reduced-motion`: camera drift almost stops (the existing 0.15 scale), reveals become instant, and diagrams render fully drawn.
- Contrast is AA or better: scrim strength is tuned so body text on the valley reaches ≥ 4.5:1.

**SEO**
- Per-route title, description and OG tags.
- OG image rendered from the valley.
- `sitemap.xml`, `robots.txt`, JSON-LD `Person`.

---

## 6. Implementation roadmap (each milestone ends with a browser check and a git checkpoint)

| # | Milestone | Done when |
|---|---|---|
| M0 | **Foundation**: promote to repo root, `git init`, remove dead dependencies and AI Studio files, move references, `CLAUDE.md`, clean `npm install` without legacy flags | `tsc` + `vite build` pass; the valley renders exactly as now (screenshot match) |
| M1 | **Design system**: tokens, self-hosted fonts, type scale, Button/Link/Metric/Figure, motion presets, `DESIGN-SYSTEM.md` | Specimen page reviewed in the browser |
| M2 | **Engine integration**: `ValleyCanvas`, fallback, staged progress loader, quality tiers, `setMode`, input gating, visibility pause, lazy audio | fps measured per tier; no-WebGL and context-loss tested by forcing them |
| M3 | **Hero + nav**: typography, tagline, telemetry, desktop and mobile nav, sound toggle | Desktop 1440/1024 and mobile 375 screenshots reviewed |
| M4 | **Content layer + transitions**: journal over the valley, waypoints, scrim, hash sync | Scroll, wheel and touch don't fight the camera |
| M5 | **Work index + case-study template + 5 flagship diagrams** | Each case study read end to end in the browser |
| M6 | **Selected and field case studies** | All 11 pages complete |
| M7 | **Experience timeline · About · Achievements · Arsenal · Beyond Code · Contact** | Full journal complete |
| M8 | **Responsive and accessibility pass, SEO/prerender, OG image, poster** | Keyboard-only walkthrough; Lighthouse run |
| M9 | **QA + Vercel deploy prep**: link checks, console/network clean, production build, independent design review by a subagent with fresh eyes | Checklist in Phase 7 of the brief all green |

**Workflow:**
- `CLAUDE.md` records the hard constraints:
  - Don't touch `CAMERA_CONFIG` or the shader tuning.
  - No invented facts.
  - Use the design tokens only.
  - Run a browser check after every section.
- A subagent does a fresh-eyes design and code review at M5 and M9.
- No complicated multi-agent setup.

---

## 7. Missing information (what I need from you)

| Needed | Used for | If missing |
|---|---|---|
| **Email, LinkedIn URL, GitHub URL** | Contact, header, JSON-LD | Contact shows TODO placeholders (it can't launch without them) |
| **Public resume PDF** without DOB, gender and roll number | Resume link | I won't publish the current PDF |
| **Repo / demo links** for each of the 11 projects (or "private") | Case-study links | Shown as "Private / available on request" |
| **Eval context:** GraphRAG eval-set size; Deep RL backtest period and asset; Image Forensics test split; Fatigue "NC/C" meaning | Metric context lines | TODO shown next to the metric |
| Project screenshots or figures (optional): Streamlit dashboards, SIH dashboard, UGAC platform, Coding Duel UI, training curves | Extra case-study figures | Diagrams carry the story on their own |
| Photos for Beyond Code (optional): frisbee, mentoring | Beyond Code section | Typographic and illustrated version |
| Show CPI 8.15? Mention American Express? Codeforces handle? | About / Achievements | Defaults: CPI hidden, Amex shown as "Incoming", no handle |
| Domain name | SEO canonical, OG | `*.vercel.app` |
| Keep ambient audio? | Hero | Default: keep it, muted, with a visible toggle (it's synthesised, so it costs 0 bytes) |
