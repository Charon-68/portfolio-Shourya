/**
 * Build-time helpers (vite plugins). Nothing here ships to the browser.
 *
 * - devCapture: DEV ONLY. POST /__capture?name=poster.png with a data-URL body writes the image
 *   into design/captures/ (gitignored scratch). Used to capture the poster / OG image straight
 *   from the live engine, then optimised into public/ by scripts/optimise-captures.sh.
 * - prerenderRoutes: writes dist/work/<slug>/index.html (and a 404.html) with per-route
 *   <title>, description, Open Graph/Twitter tags, canonical (when SITE_URL is set) and a
 *   <noscript> summary — so link previews and no-JS crawlers see real content.
 * - sitemap: writes robots.txt always, sitemap.xml only when SITE_URL is known (CONTENT-TODO C15).
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { projects } from '../src/content/projects.ts';

const root = path.resolve(import.meta.dirname, '..');

export function devCapture(): Plugin {
  return {
    name: 'dev-capture',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__capture', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }
        const name = new URL(req.url ?? '', 'http://x').searchParams.get('name') ?? 'capture.png';
        if (!/^[a-z0-9-]+\.png$/.test(name)) {
          res.statusCode = 400;
          res.end('bad name');
          return;
        }
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => {
          const body = Buffer.concat(chunks).toString();
          const b64 = body.replace(/^data:image\/png;base64,/, '');
          const dir = path.join(root, 'design/captures');
          fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(path.join(dir, name), Buffer.from(b64, 'base64'));
          res.end('ok');
        });
      });
    },
  };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

type Meta = { title: string; description: string; path: string; noscript: string };

function withMeta(html: string, m: Meta, siteUrl: string | undefined): string {
  const abs = (p: string) => (siteUrl ? siteUrl.replace(/\/$/, '') + p : p);
  const tags = [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}" />`,
    `<meta property="og:title" content="${esc(m.title)}" />`,
    `<meta property="og:description" content="${esc(m.description)}" />`,
    `<meta property="og:image" content="${abs('/og.jpg')}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:title" content="${esc(m.title)}" />`,
    `<meta name="twitter:description" content="${esc(m.description)}" />`,
    `<meta name="twitter:image" content="${abs('/og.jpg')}" />`,
    siteUrl ? `<link rel="canonical" href="${abs(m.path)}" />` : '',
    siteUrl ? `<meta property="og:url" content="${abs(m.path)}" />` : '',
  ]
    .filter(Boolean)
    .join('\n    ');
  return html
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, '')
    .replace(/<meta\s+property="og:title"[\s\S]*?\/>/, '')
    .replace(/<meta\s+property="og:description"[\s\S]*?\/>/, '')
    .replace('<!--seo-->', tags)
    .replace('<!--noscript-->', `<noscript>${m.noscript}</noscript>`);
}

export function prerenderRoutes(): Plugin {
  return {
    name: 'prerender-routes',
    apply: 'build',
    closeBundle() {
      const dist = path.join(root, 'dist');
      const indexPath = path.join(dist, 'index.html');
      if (!fs.existsSync(indexPath)) return;
      const base = fs.readFileSync(indexPath, 'utf8');
      const siteUrl = process.env.SITE_URL;

      const home: Meta = {
        title: 'Shourya Saxena — Software Engineering · Applied ML · Systems',
        description:
          'Portfolio of Shourya Saxena (IIT Bombay): retrieval systems, models built from scratch, real-time platforms and data pipelines — told as engineering case studies.',
        path: '/',
        noscript: `<main><h1>Shourya Saxena</h1><p>Software engineering, applied machine learning and systems. IIT Bombay.</p><h2>Selected work</h2><ul>${projects
          .map((p) => `<li><a href="/work/${p.slug}">${esc(p.title)}</a> — ${esc(p.summary)}</li>`)
          .join('')}</ul></main>`,
      };
      fs.writeFileSync(indexPath, withMeta(base, home, siteUrl));

      for (const p of projects) {
        const m: Meta = {
          title: `${p.title} — Shourya Saxena`,
          description: p.summary,
          path: `/work/${p.slug}`,
          noscript: `<main><h1>${esc(p.title)}</h1><p>${esc(p.category)} · ${esc(p.context)} · ${esc(p.period)}</p><p>${esc(
            p.intro,
          )}</p><h2>Problem</h2><p>${esc(p.problem)}</p><h2>What I built</h2><ul>${p.contribution
            .map((c) => `<li>${esc(c)}</li>`)
            .join('')}</ul><p><a href="/#work">All work</a></p></main>`,
        };
        const dir = path.join(dist, 'work', p.slug);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'index.html'), withMeta(base, m, siteUrl));
      }

      fs.writeFileSync(
        path.join(dist, '404.html'),
        withMeta(
          base,
          { title: 'Not found — Shourya Saxena', description: 'This page wandered off.', path: '/404', noscript: '<p><a href="/">Back to the valley</a></p>' },
          siteUrl,
        ),
      );
    },
  };
}

export function sitemap(): Plugin {
  return {
    name: 'sitemap',
    apply: 'build',
    closeBundle() {
      const dist = path.join(root, 'dist');
      if (!fs.existsSync(dist)) return;
      const siteUrl = process.env.SITE_URL?.replace(/\/$/, '');
      const robots = ['User-agent: *', 'Allow: /', siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml` : ''].filter(Boolean).join('\n');
      fs.writeFileSync(path.join(dist, 'robots.txt'), robots + '\n');
      if (!siteUrl) return; // sitemap URLs must be absolute — needs the domain (C15)
      const urls = ['/', ...projects.map((p) => `/work/${p.slug}`)];
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
        .map((u) => `  <url><loc>${siteUrl}${u}</loc></url>`)
        .join('\n')}\n</urlset>\n`;
      fs.writeFileSync(path.join(dist, 'sitemap.xml'), xml);
    },
  };
}
