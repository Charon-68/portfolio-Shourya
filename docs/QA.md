# Final QA — M9 (2026-11-20)

All checks were run against the production build (`npm run build && npm run preview`) in a Chromium-based browser on an Apple M1, unless noted otherwise. The browser pane used for testing throttles or stops `requestAnimationFrame` when unfocused, so time-based checks were read from page state, not from screenshots alone.

| Area | Result | How it was checked |
|---|---|---|
| TypeScript | ✅ `tsc --noEmit` clean | Runs as part of `npm run build` |
| Production build | ✅ | Shell 129 KB gz · engine 172 KB gz (lazy) · chapter bodies 10 KB gz (lazy) · case study 6 KB gz (lazy) |
| Every nav link and CTA | ✅ | Clicked each nav item, the hero CTA, "All work", "Next project", the wordmark and "Back to the valley" |
| All 11 case studies | ✅ | Crawled from the Work index. Every page renders its title, figure and sections, and its tab title updates |
| Internal links | ✅ 24 unique, 0 broken | Collected every `a[href]`. Hash targets exist; `/work/*` targets match real projects |
| Console | ✅ 0 errors, 0 warnings | Full crawl on the production build |
| Network | ✅ all 200 | No 404s; fonts load only the latin and latin-ext subsets |
| Back / Forward / deep links | ✅ | `/#chapter`, `/work/<slug>`, Back from a case study restores scroll and focus, hero ↔ case history (M5 review scenarios) |
| 404 | ✅ | `/work/nope` and `/nonsense` show the in-app 404; hero gestures are disabled behind it |
| Keyboard only | ✅ | Order: skip link → nav → hero CTA → journal → case-study index. Enter opens items. Focus moves to the new view's heading. Gold focus ring everywhere; Esc closes the menu |
| Reduced motion | ✅ | `?motion=reduced`: static hero, final metric values, fully drawn diagrams, camera cuts instead of flying, CSS transitions clamped |
| WebGL fallback | ✅ | `?webgl=off`: the captured poster renders and the engine chunk is never requested |
| Software GL | ✅ | SwiftShader and llvmpipe get the poster by default (the first frame took 4.6 s). `?quality=low` forces the engine |
| Context loss | ✅ | `WEBGL_lose_context` lose → restore; the loop resumes and the frame is not black (M2) |
| Responsive | ✅ | 1440, 1024, 840, 375 wide: no horizontal page overflow, nav fits from 820 px, diagrams and timeline scroll sideways on phones with hints |
| SEO metadata | ✅ | Per-route title, description, OG and Twitter tags, `<noscript>` summaries, JSON-LD Person, `robots.txt`. Sitemap and canonical need `SITE_URL` (C15) |
| Images | ✅ | `og.jpg` 1200×630 · 130 KB; `poster.webp` 1920 wide · 110 KB; favicon is an SVG |
| Lighthouse 13.6 | A11y **100** · Best Practices **100** · SEO **100** · CLS **0** | Headless Chrome with no GPU. Its Performance score (60–70) measures software compositing, not the site; re-measure with PageSpeed Insights after deploy |
| Live GPU frame cost | high 19.0 ms · medium 11.6 ms · low 5.4 ms | Forced-sync render timing at 1440×900 (M2) |

## Fixes made during M9

- **Scroll trackers** for the active chapter, the case-study section index and the scrim were scheduled with `requestAnimationFrame`. In occluded windows they could stall, leaving the nav highlight a section behind. They now use `nextFrameOrTimeout` (`src/lib/frame.ts`).
- **Reduced-motion QA switch** added (`?motion=reduced`). Its first version broke Motion's media-query listener; it now uses a complete `MediaQueryList` stand-in.
- **Fresh-eyes design review**, applied:
  - **Diagrams:** brighter, larger sub-labels and edge labels, and a brighter figure caption.
  - **Scrims:** a denser reading scrim, a wider hero halo, and a scrim anchored behind the Contact text.
  - **Chapter openers:** now a full viewport tall, so the next plate no longer peeks in.
  - **Achievements:** uppercase figures, the cohort on its own line, aligned label rows.
  - **Beyond Code:** columns aligned.
  - **Timeline:** flat bars with a pollen cap at "Now", and the Incoming row in display type.
  - **Mobile:** the contribution list uses body size.
- **Prerendered case-study pages** are now written as `work/<slug>.html`, with `cleanUrls` in `vercel.json`, so each `/work/<slug>` gets its own social card on Vercel.
- `vercel.json`: long cache for hashed assets, plus `nosniff`, `Referrer-Policy`, `X-Frame-Options` and `Permissions-Policy` headers.

## Not verifiable here, so do these after deploy

1. **PageSpeed Insights** on the deployed URL (real Chrome with a GPU on Google's side).
2. **A real phone:** iOS Safari and Android Chrome. Check the low tier's frame rate, touch swipe into the journal, and the mobile menu.
3. **Link previews:** paste a case-study URL into LinkedIn or Slack and confirm the card. This needs `SITE_URL` for absolute image URLs.
4. **Vercel routing:** confirm `/work/<slug>` serves its prerendered HTML (view source shows the project title) and that `/work/nope` shows the in-app 404.

## Launch blockers (content, not code)

These are listed in `docs/CONTENT-TODO.md`:
- **C1–C3:** email, LinkedIn and GitHub.
- **C4:** the redacted resume PDF.
- **C15:** the domain.

## Deployed (2026-11-20)

The site is live at **https://shouryasaxena.vercel.app** (Vercel project `shouryasaxena`).

| Check | Result |
|---|---|
| Public access | ✅ HTTP 200; no deployment protection on the production domain |
| Pages and files | ✅ `/` and `/work/<slug>` serve prerendered HTML with the project's title, canonical URL and absolute `og:image`. `/work/nope` returns a real 404. The resume PDF, OG image, `sitemap.xml` and `robots.txt` are all served |
| Security headers | ✅ `nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY` and `Permissions-Policy` are present |
| Live render | ✅ The engine loads (173 KB transferred), the valley renders, and the console is clean |

**PageSpeed Insights** (2026-11-21, mobile: emulated Moto G Power, slow 4G, Lighthouse 13.6):
- Scores: Performance **93**, Accessibility **100**, Best Practices **100**, SEO **100**.
- Metrics: FCP 1.5 s, LCP 2.7 s, TBT 0 ms, CLS 0, Speed Index 4.3 s.
- PageSpeed's test browser most likely has no GPU, so this measures the poster-fallback path. Devices with a GPU also download and run the 3D engine after first paint.
- The desktop run did not complete in the browser pane; re-run it at pagespeed.web.dev if needed.

Still to do by hand:
- a real phone;
- a LinkedIn link preview (Post Inspector).

