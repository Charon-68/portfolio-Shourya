/**
 * Experience — a concurrency timeline (the roles genuinely overlapped through 2026) above
 * the full entries. Bars and entries highlight each other; a bar click scrolls to its entry.
 */
import { useEffect, useRef, useState } from 'react';
import { Eyebrow } from '@/components/ui/SectionHeading';
import { TagList } from '@/components/ui/TagList';
import {
  experience,
  formatMonth,
  formatPeriod,
  incoming,
  monthIndex,
  TIMELINE_NOW,
  TIMELINE_START,
  type ExperienceEntry,
} from '@/content/experience';
import { cx } from '@/lib/cx';
import { Link } from '@/lib/router';

const NOW = monthIndex(TIMELINE_NOW) + 1; // months up to and including "now"
const TOTAL = NOW + 2; // room after "now" for the incoming role
const pct = (months: number) => `${(months / TOTAL) * 100}%`;

const lanes: Array<{ id: ExperienceEntry['lane']; label: string }> = [
  { id: 'work', label: 'Internships' },
  { id: 'leadership', label: 'Positions of responsibility' },
];

function scrollToEntry(id: string) {
  const el = document.getElementById(`exp-${id}`);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  el?.focus({ preventScroll: true });
}

function Timeline({ active, setActive }: { active: string | null; setActive: (id: string | null) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  // Narrow screens: start at the recent end — that's where the roles overlap.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const fit = () => {
      const o = el.scrollWidth > el.clientWidth + 1;
      setOverflows(o);
      if (o) el.scrollLeft = el.scrollWidth;
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  const years = [2025, 2026]
    .map((y) => ({ y, i: monthIndex(`${y}-01`) }))
    .map(({ y, i }) => ({ y, i: Math.max(0, i) }));

  return (
    <>
    <div
      ref={scrollRef}
      className="-mx-1 overflow-x-auto px-1 [scrollbar-width:thin]"
      {...(overflows ? { tabIndex: 0, role: 'region', 'aria-label': 'Timeline, scrollable' } : {})}
    >
      <div className="relative min-w-[640px] pb-2" role="group" aria-label={`Timeline from ${formatMonth(TIMELINE_START)} to now`}>
        {/* Axis */}
        <div className="relative ml-[9.5rem] h-8 border-b hairline">
          {years.map(({ y, i }) => (
            <span key={y} className="label ink-3 absolute bottom-2 tabular" style={{ left: pct(i) }}>
              {y}
            </span>
          ))}
          {Array.from({ length: TOTAL }, (_, m) => (
            <span key={m} aria-hidden="true" className="absolute bottom-0 h-1.5 w-px bg-[var(--hairline)]" style={{ left: pct(m) }} />
          ))}
          <span className="label absolute bottom-2 -translate-x-1/2 text-pollen" style={{ left: pct(NOW) }}>
            Now
          </span>
        </div>

        <div className="relative">
          {/* "Now" rule through all lanes */}
          <span aria-hidden="true" className="absolute inset-y-0 w-px bg-pollen/50" style={{ left: `calc(9.5rem + (100% - 9.5rem) * ${NOW / TOTAL})` }} />

          {lanes.map((lane) => {
            const entries = experience.filter((e) => e.lane === lane.id).sort((a, b) => a.start.localeCompare(b.start));
            return (
              <div key={lane.id} className="flex border-b hairline py-4">
                <p className="label ink-3 w-[9.5rem] shrink-0 pr-4 pt-1 leading-snug">{lane.label}</p>
                <ul className="relative flex-1">
                  {entries.map((e) => {
                    const s = monthIndex(e.start);
                    const end = e.end ? monthIndex(e.end) + 1 : NOW;
                    const on = active === e.id;
                    return (
                      <li key={e.id} className="relative h-12">
                        <button
                          type="button"
                          onClick={() => scrollToEntry(e.id)}
                          onPointerEnter={() => setActive(e.id)}
                          onPointerLeave={() => setActive(null)}
                          onFocus={() => setActive(e.id)}
                          onBlur={() => setActive(null)}
                          aria-label={`${e.role}, ${e.org}, ${formatPeriod(e)}. Show details.`}
                          className="group/bar absolute inset-y-0 flex flex-col justify-center gap-1.5 text-left"
                          style={{ left: pct(s), width: pct(end - s) }}
                        >
                          <span
                            className={cx(
                              'label whitespace-nowrap transition-colors duration-[var(--dur-fast)]',
                              on ? 'text-pollen' : 'ink-1',
                            )}
                          >
                            {e.org.split(',')[0].replace(' Pvt Ltd', '')}
                          </span>
                          <span
                            aria-hidden="true"
                            className={cx(
                              'block h-1.5 w-full transition-colors duration-[var(--dur-fast)]',
                              on ? 'bg-pollen' : 'bg-cream/70 group-hover/bar:bg-cream',
                              // Ongoing roles fade into "now".
                              !e.end && '[mask-image:linear-gradient(90deg,#000_75%,transparent)]',
                            )}
                          />
                        </button>
                      </li>
                    );
                  })}
                  {lane.id === 'work' && (
                    <li className="relative h-12">
                      <span className="absolute inset-y-0 flex flex-col justify-center gap-1.5" style={{ left: pct(NOW), width: pct(TOTAL - NOW) }}>
                        <span className="label whitespace-nowrap text-pollen">Incoming</span>
                        <span aria-hidden="true" className="block h-0 w-full border-t border-dashed border-pollen/70" />
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    {overflows && (
      <p aria-hidden="true" className="label ink-3">
        ← Swipe back to 2025
      </p>
    )}
    </>
  );
}

function Entry({ e, active, setActive }: { e: ExperienceEntry; active: boolean; setActive: (id: string | null) => void }) {
  return (
    <article
      id={`exp-${e.id}`}
      tabIndex={-1}
      onPointerEnter={() => setActive(e.id)}
      onPointerLeave={() => setActive(null)}
      aria-labelledby={`exp-${e.id}-h`}
      className="grid scroll-mt-[calc(var(--header-h)+2rem)] gap-6 border-t hairline py-12 outline-none md:grid-cols-[13rem_minmax(0,1fr)] md:gap-12"
    >
      <div className="flex flex-col gap-2">
        <p className={cx('label tabular transition-colors', active ? 'text-pollen' : 'ink-1')}>{formatPeriod(e)}</p>
        {e.team && <p className="label ink-3">{e.team}</p>}
        {e.note && <p className="label text-pollen">{e.note}</p>}
      </div>
      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h3 id={`exp-${e.id}-h`} className="text-display-s uppercase">
            {e.role}
          </h3>
          <p className="ink-1">{e.org}</p>
        </div>
        {e.summary && <p className="measure text-lead ink-1">{e.summary}</p>}
        {e.metrics.length > 0 && (
          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {e.metrics.map((m) => (
              <li key={m.label} className="flex items-baseline gap-2">
                <span className="font-display text-[1.75rem] leading-none tabular">{m.value}</span>
                <span className="label ink-3 normal-case tracking-[0.02em]">{m.label}</span>
              </li>
            ))}
          </ul>
        )}
        <ul className="measure flex flex-col gap-2.5">
          {e.bullets.map((b) => (
            <li key={b} className="grid grid-cols-[1.25rem_1fr] ink-2">
              <span aria-hidden="true" className="text-pollen">–</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <TagList items={e.stack} label="Tools and methods" />
        {e.caseStudy && (
          <Link to={`/work/${e.caseStudy}`} className="label inline-flex w-fit items-center gap-2 text-cream hover:text-pollen">
            Read the case study <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </article>
  );
}

export function Experience() {
  const [active, setActive] = useState<string | null>(null);
  const work = experience.filter((e) => e.lane === 'work');
  const leadership = experience.filter((e) => e.lane === 'leadership');

  return (
    <div className="flex flex-col gap-16">
      <section aria-labelledby="exp-timeline" className="flex flex-col gap-6">
        <Eyebrow index="A">
          <span id="exp-timeline">Side by side</span>
        </Eyebrow>
        <p className="measure ink-2">
          Through 2026 the internships ran in parallel — and alongside campus roles that began in 2025.
        </p>
        <Timeline active={active} setActive={setActive} />
      </section>

      <section aria-labelledby="exp-incoming" className="flex flex-col gap-3 border-y hairline py-6 md:flex-row md:items-baseline md:gap-12">
        <p id="exp-incoming" className="label text-pollen md:w-[13rem]">
          Incoming
        </p>
        <p className="text-lead ink-1">
          {incoming.role} · {incoming.org}
        </p>
      </section>

      <section aria-labelledby="exp-work" className="flex flex-col">
        <Eyebrow index="B" className="mb-2">
          <span id="exp-work">Internships</span>
        </Eyebrow>
        {work.map((e) => (
          <Entry key={e.id} e={e} active={active === e.id} setActive={setActive} />
        ))}
      </section>

      <section aria-labelledby="exp-lead" className="flex flex-col">
        <Eyebrow index="C" className="mb-2">
          <span id="exp-lead">Positions of responsibility</span>
        </Eyebrow>
        {leadership.map((e) => (
          <Entry key={e.id} e={e} active={active === e.id} setActive={setActive} />
        ))}
      </section>
    </div>
  );
}
