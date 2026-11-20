# Shourya Saxena — Portfolio

An interactive personal portfolio set in a procedural Three.js botanical valley (originally the "Fernhollow" engine). The valley stays behind the whole site: chapters open over it, the camera flies to a different spot for each chapter, and Contact lifts the camera back into the open meadow.

**Stack:** Vite · React 19 · TypeScript · Three.js (custom GLSL, instanced rendering, post-processing) · Tailwind CSS v4 · Motion. No backend, no API keys.

```bash
npm install
npm run dev        # http://127.0.0.1:3000  (dev-only: /specimen.html design-system page)
npm run build      # typecheck + production build to dist/ (+ prerendered case-study pages)
npm run preview    # serve dist/ on :4173
```

## Live

**https://shouryasaxena.vercel.app** (source: github.com/Charon-68/portfolio-Shourya). Pushes to `main` deploy to production automatically (Vercel Git integration); other branches get preview URLs.

## Deploying to Vercel

The repo is ready to import as-is: `vercel.json` sets the Vite framework, build command, output directory, clean URLs, SPA rewrites, cache headers for hashed assets, and baseline security headers.

1. Push the repo to GitHub and import it in Vercel. Alternatively, run `npx vercel` from the project root.
2. Once the domain is known, set the environment variable `SITE_URL=https://your-domain` in the Vercel project. The build then emits `sitemap.xml`, canonical URLs and absolute `og:image` URLs (see CONTENT-TODO C15).
3. Before going public, finish the launch blockers in [`docs/CONTENT-TODO.md`](docs/CONTENT-TODO.md):
   - C1–C3: email, LinkedIn and GitHub.
   - C4: the **redacted** resume PDF, placed in `public/` and linked in `src/content/profile.ts`.

**Routes**

| Route | What it serves |
|---|---|
| `/` | Hero, plus the chapters `#work`, `#experience`, `#about`, `#beyond`, `#contact` |
| `/work/<slug>` | One page per case study (prerendered HTML with its own title, description and social card) |
| anything else | In-app 404 |

## QA switches (work on any build)

| URL parameter | Effect |
|---|---|
| `?quality=high\|medium\|low` | Force a rendering tier. This also forces the engine on software-GL machines. |
| `?webgl=off` | Static poster fallback. The 3D engine is not downloaded. |
| `?motion=reduced` | Behave as if the OS prefers reduced motion. |

## Docs

- [`docs/BLUEPRINT.md`](docs/BLUEPRINT.md): research, the chosen art direction ("Nocturne") and architecture.
- [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md): tokens, typography, scrims, components, diagrams and motion.
- [`docs/QA.md`](docs/QA.md): final QA checklist and results.
- [`docs/CONTENT-TODO.md`](docs/CONTENT-TODO.md): content still needed from Shourya.
- [`CLAUDE.md`](CLAUDE.md): long-term constraints for anyone, human or Claude Code, working on this repo.
