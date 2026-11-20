# Design System — "Nocturne"

Tokens live in `src/styles/tokens.css` (Tailwind v4 `@theme` + `:root`). Base and utilities live in `src/styles/base.css`. To see everything live over the valley, run `npm run dev` and open **/specimen.html**. It is dev-only and not in the production build.

**Principle:** the valley is the world, and the interface is printed matter laid over it — thin rules, crop marks, mono captions, condensed display type. Nothing glows except the valley and one gold accent.

## Colour

| Token | Hex | Use | Contrast on night |
|---|---|---|---|
| `night` | `#040705` | Page and scene background (matches the engine's clear colour) | — |
| `night-2` | `#0a0d0b` | Raised backdrop (case-study page) | — |
| `moss` | `#1b231d` | Chart grid, subtle fills | — |
| `cream` | `#f5efe2` | Primary ink | 17.7 : 1 |
| `ink` | `#151510` | Text on cream (primary button) | — |
| **`pollen`** | `#eab560` | **The only accent.** Index numbers, figure numbers, focus ring, critical path in diagrams, highlights. Taken from the engine's pollen/stamen glow. | 10.9 : 1 |
| `pollen-deep` | `#b9852f` | Pressed state | 6.2 : 1 |
| `poppy` | `#d9573a` | **Data contrast only**: "before" values and baselines. Never decorative. | 5.2 : 1 |

**Ink levels** use cream at fixed opacities. Use the utilities (`ink-1` … `ink-4`), never ad-hoc `/60` values:

| | α | Use | Worst case over the reading scrim* |
|---|---|---|---|
| `ink-1` | .94 | Headings, primary | 9.6 : 1 |
| `ink-2` | .78 | Body | 7.1 : 1 |
| `ink-3` | .56 | Labels, secondary | 4.5 : 1 |
| `ink-4` | .34 | Decorative only (separators). **Never text that carries meaning.** | 2.6 : 1 |

\*Worst case means the brightest flower colour in the engine (`#ffdc4d`) sitting directly under the text with the reading scrim at its lightest point (α .80).

### Scrim

Content sits over the live valley in two stages. The reading scrim fades in over the first 60% of a viewport of scroll. This is implemented as a CSS var `--scrim-t`, so it causes no React re-renders.

- **Opener** (`--scrim-opener`, α .55): chapter openers. The valley stays clearly visible.
  - Only `ink-1` or `pollen` text, at display or lead sizes.
  - Worst case, `ink-1` still reaches 4.6 : 1.
- **Reading** (`--scrim-reading`, α .80 → .92): dense content.

No `backdrop-filter` blur: it's expensive over a WebGL canvas, and the plate aesthetic doesn't need it.

## Typography

Three self-hosted variable families (`@fontsource-variable`, WOFF2, unicode-range split; only Latin downloads):

| Family | Token | Role |
|---|---|---|
| Antonio | `font-display` | Names, chapter and project titles, numerals. Uppercase for h1–h3. |
| Manrope | `font-sans` (default) | Body, lead, UI copy |
| JetBrains Mono | `font-mono` | Labels, figure numbers, tags, metric context, telemetry. Small sizes only. |

All sizes are fluid, scaling from a 375 px to a 1440 px viewport:

| Utility | Size | Leading | Use |
|---|---|---|---|
| `text-display-xl` | 56 → 148 | .94 | Hero name only |
| `text-display-l` | 44 → 104 | .96 | Chapter titles (h2) |
| `text-display-m` | 36 → 72 | .98 | Project titles |
| `text-display-s` | 26 → 40 | 1.02 | Sub-heads (h3) |
| `text-numeral` | 40 → 76 | .9 | Metric values (tabular) |
| `text-lead` | 18 → 22.4 | 1.5 | Intros |
| `text-body` | 17 | 1.65 | Body (default) |
| `text-small` | 14 | 1.55 | Captions, notes |
| `label` utility | 12 mono, uppercase, +.14em | 1.4 | Eyebrows, tags, buttons |
| `text-micro` | 11 mono | 1.3 | Telemetry, compact TODOs |

**Other text rules:**
- Reading width is `measure` (64ch).
- Headings use `text-wrap: balance`; paragraphs use `pretty`.

## Layout

- **Container:** the `page` utility. Max width 1440 px, side gutter `--gutter` (20 → 56 px).
- **Grid:** a 12-column CSS grid where needed. Sections at lg+ use a two-column rhythm: `14rem` label rail plus content (see the specimen `Block`).
- **Vertical rhythm:**
  - `--section-gap` (96 → 176 px) between chapters;
  - 64 / 96 px between blocks;
  - 4 px base spacing.
- **Breakpoints:**
  - `sm` 640;
  - `md` 820 (the engine's mobile threshold; the existing CSS already breaks here);
  - `lg` 1100;
  - `xl` 1440.
- **Z layers:**
  - valley 0;
  - scrim 1;
  - UI 2;
  - content 3;
  - overlay 4;
  - loader 5.

## Shape

**Plates are sharp.**
- Only controls (buttons, pills) are round (`rounded-pill`).
- Everything else is 0 radius or `rounded-hair` (2 px).
- No cards with shadows.
- Structure comes from hairlines (`hairline`, `--hairline-strong`) and crop-mark corners.

## Components (`src/components/ui/`)

| Component | Notes |
|---|---|
| `Button` | Variants:<br>• `primary`: cream pill, turns pollen on hover<br>• `outline`<br>• `ghost`<br><br>Other options:<br>• Sizes `md` / `sm`.<br>• `arrow="right" \| "external"`. External links open in a new tab and include an sr-only notice.<br>• Renders an `<a>` when given `href`. |
| `ArrowLink` | Tones:<br>• `label`: mono, with an underline that grows on hover<br>• `text`: an inline prose link |
| `Eyebrow`, `SectionHeading` | Header pattern: `index` (pollen) — hairline — label, then display title, then optional lead.<br>Use `tone="strong"` on the opener scrim. |
| `Metric` | Shows the exact resume value.<br>• Counts up once when it enters the viewport.<br>• The real value is always available to screen readers.<br>• `tone="before"` = poppy.<br>• `context` takes a string or `{ todo: 'C6' }`. |
| `Figure` | The plate: "Fig. NN — Title" header rule, crop-mark frame, caption. |
| `TagList` | Mono, slash-separated technologies. **Not pills.** `highlight` turns items pollen. |
| `TodoMark` | Visible placeholder for missing content.<br>• `id` maps to `docs/CONTENT-TODO.md`, and is only shown in dev.<br>• `compact` variant for tight spots. |
| `Reveal` | Fade + 18 px rise, once, when it enters the viewport. Renders static under reduced motion. |

## Diagrams (`src/diagrams/primitives.tsx`)

Thin line-art system diagrams are the visual centre of every case study (there are no project screenshots).

- **`Diagram`**
  - SVG at a 960 px authored width.
  - Has `role="img"` and a **required** `label` describing the system in words.
  - Draws on when it enters the viewport.
  - Below `minWidth` (default 640) it scrolls horizontally instead of shrinking text. It then shows a hint and becomes a focusable region for keyboard users.
- **`DNode`**: hairline rectangle, 13 px mono label, 10.5 px sub-label. Tones:
  - `default`;
  - `accent` (pollen: the critical path, or the part Shourya built);
  - `muted` (dashed: external inputs).
- **`DEdge`**: a 1 px path with an open arrowhead. Draws in by `order` (140 ms steps). Optional label.
- **`DGroup`**: dashed subsystem boundary with a corner label.
- **Rules:**
  - Use at most two accent paths per diagram.
  - Size nodes to fit their sub-labels; check at 1440 and 375.
  - Diagram content must be factual, from the resume or confirmed by Shourya.

## Motion (`src/lib/motion.ts`, mirrored in CSS)

| Token | Value | Use |
|---|---|---|
| `ease.outExpo` / `ease-out-expo` | `cubic-bezier(.16,1,.3,1)` | House curve: reveals, UI (already used by the engine's sheet) |
| `ease.inOut` | `cubic-bezier(.65,0,.35,1)` | Edges drawing, scene changes |
| `dur.fast` | 180 ms | Hover, colour |
| `dur.base` | 420 ms | UI transitions |
| `dur.slow` | 800 ms | Reveals |
| `dur.scene` | 1200 ms | Chapter and camera transitions, count-ups |
| `stagger.base` | 70 ms | Lists |

**Rules:**
- Use Motion for the DOM and the engine for 3D. No GSAP, no Lenis.
- Animate transform and opacity only.
- Every animation has a `prefers-reduced-motion` path. Base CSS also clamps CSS animations globally.

## Interaction states

- **Focus:** a 2 px pollen outline, offset 3 px, on every interactive element. It is never removed.
- **Hover:**
  - Primary buttons go cream → pollen.
  - Outline buttons fill cream.
  - Links turn pollen, and their underline grows.
  - Arrows nudge 2 px.
- **Disabled:** 40% opacity, no pointer events.
- **Touch targets:** at least 40 px tall (`Button sm` is 40, `md` is 48).

## Content hierarchy (per case study)

`Eyebrow (no. · category · context · period)` → `display-m title` → `lead intro` → Problem → **Fig. Architecture** → Contribution → Implementation → Stack (`TagList`, grouped) → Results (`Metric` grid with context) → Links → Next project.
