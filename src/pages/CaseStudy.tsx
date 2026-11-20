/**
 * Case study page (/work/:slug), laid over the dimmed valley like the journal.
 * One template for every project, driven entirely by src/content/projects.ts:
 * opener → Problem → Fig. Architecture → Contribution → Implementation → Stack → Results → Links → Next.
 * A sticky section index (lg+) highlights the section being read.
 */
import { useEffect, useRef, useState } from 'react';
import { Figure } from '@/components/ui/Figure';
import { Metric } from '@/components/ui/Metric';
import { Eyebrow } from '@/components/ui/SectionHeading';
import { TagList } from '@/components/ui/TagList';
import { TodoMark } from '@/components/ui/TodoMark';
import { projects, type Project } from '@/content/projects';
import { ProjectDiagram } from '@/diagrams/projects';
import { cx } from '@/lib/cx';
import { Link } from '@/lib/router';

const SECTIONS = [
  { id: 'problem', label: 'Problem' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'contribution', label: 'Contribution' },
  { id: 'implementation', label: 'Implementation' },
  { id: 'stack', label: 'Stack' },
  { id: 'results', label: 'Results' },
  { id: 'links', label: 'Links' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

const todoNote: Record<string, string> = {
  C6: 'evaluation set and how Recall@5 / MRR were measured',
  C7: 'backtest period, asset(s) and split',
  C8: 'definition of the out-of-distribution split',
  C9: 'meaning of NC / C feature counts',
  C16: 'confirm the data flow drawn in the figure',
  C18: 'measured tracking / speed numbers',
  C19: 'Recall@K, MRR and MAP values',
};

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function Block({ id, label, children }: { id: SectionId; label: string; children: React.ReactNode }) {
  return (
    <section id={`cs-${id}`} data-cs={id} aria-labelledby={`cs-${id}-h`} className="scroll-mt-[calc(var(--header-h)+2rem)] border-t hairline py-14 md:py-20">
      <h2 id={`cs-${id}-h`} className="label ink-3 mb-8 font-mono">
        {label}
      </h2>
      {children}
    </section>
  );
}

type CaseStudyProps = {
  project: Project;
  /** Back to the work index (history-aware; decided by the parent). */
  onBack: () => void;
};

export function CaseStudy({ project, onBack }: CaseStudyProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [current, setCurrent] = useState<SectionId | null>(null);

  const idx = projects.findIndex((p) => p.slug === project.slug);
  const next = projects[(idx + 1) % projects.length];

  // New project: back to the top, focus the title for screen readers, update the tab title.
  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    titleRef.current?.focus({ preventScroll: true });
    const prev = document.title;
    document.title = `${project.title} — Shourya Saxena`;
    return () => {
      document.title = prev;
    };
  }, [project.slug, project.title]);

  // Scrim (opener → reading) + current section for the index.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const vh = scroller.clientHeight;
      const opener = scroller.querySelector<HTMLElement>('[data-opener]');
      if (opener && scrimRef.current) {
        const o = opener.getBoundingClientRect();
        const coverage = (Math.min(o.bottom, vh) - Math.max(o.top, 0)) / vh;
        scrimRef.current.style.setProperty('--scrim-t', (1 - smoothstep(0.5, 0.85, coverage)).toFixed(3));
      }
      let found: SectionId | null = null;
      for (const el of scroller.querySelectorAll<HTMLElement>('[data-cs]')) {
        if (el.getBoundingClientRect().top <= vh * 0.4) found = el.dataset.cs as SectionId;
      }
      setCurrent((c) => (c === found ? c : found));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      scroller.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [project.slug]);

  const jump = (id: SectionId) => {
    const el = scrollerRef.current?.querySelector<HTMLElement>(`#cs-${id}`);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  const todos = project.todos.filter((t) => todoNote[t]);
  const hasLinks = !!(project.links.repo.href || project.links.demo.href);
  const sections = SECTIONS.filter((s) => s.id !== 'links' || hasLinks || import.meta.env.DEV);

  return (
    <div className="fixed inset-0 z-[var(--z-content)]">
      <div ref={scrimRef} aria-hidden="true" className="journal-scrim pointer-events-none absolute inset-0" />
      <div ref={scrollerRef} className="relative h-full overflow-y-auto overscroll-contain [scrollbar-width:thin]">
        <main id="case-main">
        <article className="page" aria-labelledby="cs-title">
          {/* Opener over the light scrim */}
          <header
            data-opener
            className="hero-legible flex min-h-[88svh] flex-col justify-end gap-6 pb-[10svh] pt-[calc(var(--header-h)+3rem)]"
          >
            <a
              href="/#work"
              onClick={(e) => {
                e.preventDefault();
                onBack();
              }}
              className="label ink-1 inline-flex w-fit items-center gap-2 transition-colors hover:text-pollen"
            >
              <span aria-hidden="true">←</span> All work
            </a>
            <Eyebrow index={project.no} tone="strong">
              {project.category}
            </Eyebrow>
            <h1 id="cs-title" ref={titleRef} tabIndex={-1} className="text-display-l uppercase outline-none">
              {project.title}
            </h1>
            <p className="label ink-1 flex flex-wrap gap-x-3 gap-y-1">
              <span>{project.context}</span>
              <span aria-hidden="true" className="text-pollen">/</span>
              <span className="tabular">{project.period}</span>
            </p>
            <p className="measure text-lead ink-1">{project.intro}</p>
          </header>

          <div className="grid gap-x-16 lg:grid-cols-[13rem_minmax(0,1fr)]">
            {/* Section index */}
            <nav aria-label="Case study sections" className="hidden lg:block">
              <ol className="sticky top-[calc(var(--header-h)+3rem)] flex flex-col gap-3 border-t hairline pt-14">
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <a
                      href={`#cs-${s.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        jump(s.id);
                      }}
                      aria-current={current === s.id ? 'true' : undefined}
                      className={cx(
                        'label flex items-center gap-3 transition-colors duration-[var(--dur-fast)] hover:text-cream',
                        current === s.id ? 'text-cream' : 'ink-3',
                      )}
                    >
                      <span className={cx('tabular', current === s.id ? 'text-pollen' : 'ink-4')}>{String(i + 1).padStart(2, '0')}</span>
                      {s.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="min-w-0">
              <Block id="problem" label="01 — Problem">
                <p className="measure text-lead ink-2">{project.problem}</p>
              </Block>

              <Block id="architecture" label="02 — Architecture">
                <Figure
                  number={project.no}
                  title={project.architecture.title}
                  caption={project.architecture.diagram ? project.architecture.caption : undefined}
                >
                  {project.architecture.diagram ? (
                    <ProjectDiagram id={project.architecture.diagram} />
                  ) : (
                    // No drawn figure yet (M6): the plate carries the architecture in words.
                    <div className="flex flex-col gap-5">
                      <p className="measure text-lead ink-1">{project.architecture.caption}</p>
                      <TodoMark id="M6">architecture figure</TodoMark>
                    </div>
                  )}
                </Figure>
              </Block>

              <Block id="contribution" label="03 — My contribution">
                <ol className="flex flex-col gap-6">
                  {project.contribution.map((c, i) => (
                    <li key={i} className="measure grid grid-cols-[2.5rem_1fr] gap-2">
                      <span className="label tabular pt-1.5 text-pollen">{String(i + 1).padStart(2, '0')}</span>
                      <span className="text-lead ink-1">{c}</span>
                    </li>
                  ))}
                </ol>
              </Block>

              <Block id="implementation" label="04 — Implementation">
                <div className="grid gap-x-12 gap-y-10 md:grid-cols-2">
                  {project.implementation.map((it) => (
                    <div key={it.heading} className="flex flex-col gap-3 border-t hairline pt-5">
                      <h3 className="text-display-s uppercase">{it.heading}</h3>
                      <p className="ink-2">{it.body}</p>
                    </div>
                  ))}
                </div>
              </Block>

              <Block id="stack" label="05 — Stack">
                <dl className="grid gap-x-12 gap-y-6 md:grid-cols-2">
                  {project.stack.map((g) => (
                    <div key={g.group} className="flex flex-col gap-2.5 border-t hairline pt-4">
                      <dt className="label ink-3">{g.group}</dt>
                      <dd>
                        <TagList items={g.items} label={g.group} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </Block>

              <Block id="results" label="06 — Results">
                {project.metrics.length > 0 && (
                  <div
                    className={cx(
                      'grid grid-cols-2 gap-x-6 gap-y-10',
                      // Columns follow the count so no row is left with a lone figure.
                      project.metrics.length === 1 && 'grid-cols-1',
                      project.metrics.length === 4 && 'xl:grid-cols-4',
                      project.metrics.length % 3 === 0 && 'xl:grid-cols-3',
                    )}
                  >
                    {project.metrics.map((m) => (
                      <Metric key={m.label} value={m.value} label={m.label} context={m.context} tone={m.tone} />
                    ))}
                  </div>
                )}
                {project.resultsNote && <p className={cx('measure text-lead ink-1', project.metrics.length > 0 && 'mt-10')}>{project.resultsNote}</p>}
                {todos.length > 0 && (
                  <ul className="mt-10 flex flex-col gap-2">
                    {todos.map((t) => (
                      <li key={t}>
                        <TodoMark id={t}>{todoNote[t]}</TodoMark>
                      </li>
                    ))}
                  </ul>
                )}
              </Block>

              {(hasLinks || import.meta.env.DEV) && (
              <Block id="links" label="07 — Links">
                <ul className="flex flex-col gap-4">
                  {(['repo', 'demo'] as const).filter((k) => import.meta.env.DEV || project.links[k].href).map((k) => {
                    const link = project.links[k];
                    const label = k === 'repo' ? 'Repository' : 'Live demo';
                    return (
                      <li key={k} className="flex flex-wrap items-baseline gap-4 border-b hairline pb-4">
                        <span className="label ink-3 w-28">{label}</span>
                        {link.href ? (
                          <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-cream underline decoration-[var(--hairline-strong)] underline-offset-4 hover:text-pollen">
                            {link.href.replace(/^https?:\/\//, '')} <span aria-hidden="true">↗</span>
                          </a>
                        ) : (
                          <TodoMark id={link.todo}>{k === 'repo' ? 'repository link' : 'demo link'}</TodoMark>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Block>
              )}
            </div>
          </div>

          {/* Next project */}
          <footer className="border-t hairline py-[var(--section-gap)]">
            <Link to={`/work/${next.slug}`} className="group/next flex flex-col gap-4">
              <span className="label ink-3">
                Next — <span className="tabular text-pollen">{next.no}</span>
              </span>
              <span className="flex items-baseline gap-4 font-display text-display-m uppercase transition-colors group-hover/next:text-pollen">
                {next.title}
                <span aria-hidden="true" className="transition-transform duration-[var(--dur-base)] ease-out-expo group-hover/next:translate-x-2">
                  →
                </span>
              </span>
              <span className="measure ink-2">{next.summary}</span>
            </Link>
          </footer>
        </article>
        </main>
      </div>
    </div>
  );
}
