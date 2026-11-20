/**
 * The scrolling "journal" laid over the dimmed valley (blueprint §4.2).
 *
 * Each chapter = an opener (≈ one viewport; the scrim lifts so the valley shows through)
 * followed by its body (reading scrim). As chapters cross the reading line the parent is
 * told, which moves the camera to that chapter's waypoint and syncs the URL hash.
 * Native scroll only — the engine ignores wheel/touch outside explore mode.
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { TodoMark } from '@/components/ui/TodoMark';
import { chapters, type ChapterId } from '@/content/chapters';
import { cx } from '@/lib/cx';
import { useScrollIntent } from '@/lib/useScrollIntent';

export type JournalHandle = {
  scrollTo: (id: ChapterId, smooth?: boolean) => void;
  reset: () => void;
};

type JournalProps = {
  open: boolean;
  onActiveChange: (id: ChapterId) => void;
  onReturnHome: () => void;
  /** Chapter bodies, filled in M5–M7. */
  bodies?: Partial<Record<ChapterId, ReactNode>>;
};

const pendingMilestone: Record<ChapterId, string> = {
  work: 'project case studies (M5–M6)',
  experience: 'experience timeline (M7)',
  about: 'about, achievements and technical arsenal (M7)',
  beyond: 'beyond code (M7)',
  contact: 'contact links (M7)',
};

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export const Journal = forwardRef<JournalHandle, JournalProps>(function Journal(
  { open, onActiveChange, onReturnHome, bodies },
  ref,
) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const [returnProgress, setReturnProgress] = useState(0);
  const activeRef = useRef<ChapterId | null>(null);
  const onActiveRef = useRef(onActiveChange);
  onActiveRef.current = onActiveChange;

  useImperativeHandle(ref, () => ({
    scrollTo: (id, smooth = true) => {
      const scroller = scrollerRef.current;
      const el = scroller?.querySelector<HTMLElement>(`#${id}`);
      if (!el || !scroller) return;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      scroller.scrollTo({ top: el.offsetTop, behavior: smooth && !reduce ? 'smooth' : 'auto' });
    },
    reset: () => {
      scrollerRef.current?.scrollTo({ top: 0, behavior: 'auto' });
      activeRef.current = null;
    },
  }));

  /**
   * One rAF-throttled scroll handler drives both:
   *  - scrim: --scrim-t = 1 − max(opener coverage) → valley visible while an opener fills the view
   *  - active chapter: the section crossing 45% of the viewport height
   */
  const measure = useCallback(() => {
    const scroller = scrollerRef.current;
    const scrim = scrimRef.current;
    if (!scroller || !scrim) return;
    const vh = scroller.clientHeight;
    let openness = 0;
    let active: ChapterId | null = null;
    for (const section of scroller.querySelectorAll<HTMLElement>('section[data-chapter]')) {
      const opener = section.querySelector<HTMLElement>('[data-opener]');
      const r = section.getBoundingClientRect();
      if (r.top <= vh * 0.45 && r.bottom > vh * 0.45) active = section.dataset.chapter as ChapterId;
      if (!opener) continue;
      const o = opener.getBoundingClientRect();
      const coverage = (Math.min(o.bottom, vh) - Math.max(o.top, 0)) / vh;
      openness = Math.max(openness, smoothstep(0.5, 0.85, coverage));
    }
    scrim.style.setProperty('--scrim-t', (1 - openness).toFixed(3));
    if (active && active !== activeRef.current) {
      activeRef.current = active;
      onActiveRef.current(active);
    }
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !open) return;
    let raf = 0;
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(() => ((raf = 0), measure()));
    };
    measure();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      scroller.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [open, measure]);

  // Pull past the top of the first chapter to return to the valley.
  useScrollIntent({
    enabled: open,
    direction: 'up',
    threshold: 900,
    target: scrollerRef,
    when: () => (scrollerRef.current?.scrollTop ?? 1) <= 0,
    onProgress: setReturnProgress,
    onTrigger: onReturnHome,
  });

  return (
    <div
      className={cx(
        'fixed inset-0 z-[var(--z-content)] transition-opacity duration-[var(--dur-slow)] ease-out-expo',
        open ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
      aria-hidden={!open}
      inert={!open}
    >
      <div ref={scrimRef} aria-hidden="true" className="journal-scrim pointer-events-none absolute inset-0" />

      {/* Return-to-valley hint: appears only while pulling up at the top. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[calc(var(--header-h)+0.5rem)] z-[1] flex flex-col items-center gap-2 transition-opacity duration-[var(--dur-fast)]"
        style={{ opacity: returnProgress > 0.08 ? 1 : 0 }}
      >
        <span className="label ink-1">↑ Keep scrolling to return to the valley</span>
        <span className="h-px w-28 bg-[var(--hairline)]">
          <span className="block h-full origin-left bg-pollen" style={{ transform: `scaleX(${returnProgress})` }} />
        </span>
      </div>

      <div
        ref={scrollerRef}
        className="relative h-full overflow-y-auto overscroll-contain [scrollbar-color:var(--hairline-strong)_transparent] [scrollbar-width:thin]"
        tabIndex={-1}
      >
        <main
          id="main"
          className={cx(
            'page transition-transform duration-[var(--dur-scene)] ease-out-expo',
            open ? 'translate-y-0' : 'translate-y-8',
          )}
        >
          {chapters.map((c) => {
            const isContact = c.id === 'contact';
            return (
              <section key={c.id} id={c.id} data-chapter={c.id} aria-labelledby={`${c.id}-title`} className="relative">
                <div
                  data-opener
                  className={cx(
                    // Openers sit over the light scrim → same soft halo as the hero.
                    'hero-legible flex flex-col justify-end pb-[12svh] pt-[calc(var(--header-h)+4rem)]',
                    isContact ? 'min-h-[100svh] justify-center pb-0' : 'min-h-[92svh]',
                  )}
                >
                  <SectionHeading index={c.index} eyebrow={c.label} id={`${c.id}-title`} title={c.title} lead={c.lead} tone="opener" />
                  {isContact && <div className="mt-12">{bodies?.contact ?? <TodoMark id="M-chapter">{pendingMilestone.contact}</TodoMark>}</div>}
                </div>
                {!isContact && (
                  <div data-body className="border-t hairline pb-[var(--section-gap)] pt-16">
                    {bodies?.[c.id] ?? <TodoMark id="M-chapter">{pendingMilestone[c.id]}</TodoMark>}
                  </div>
                )}
              </section>
            );
          })}
        </main>
      </div>
    </div>
  );
});
