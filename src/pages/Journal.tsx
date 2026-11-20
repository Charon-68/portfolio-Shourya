/**
 * The scrolling "journal" laid over the dimmed valley (blueprint §4.2).
 * M3: structure, scrim and chapter openers so navigation has a real target.
 * M4 adds camera waypoints, hash sync and transitions; M5–M7 fill each chapter.
 */
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { TodoMark } from '@/components/ui/TodoMark';
import { chapters, type ChapterId } from '@/content/chapters';
import { cx } from '@/lib/cx';
import { useScrimProgress } from '@/lib/useScrimProgress';

export type JournalHandle = { scrollTo: (id: ChapterId, smooth?: boolean) => void };

type JournalProps = { open: boolean };

const pendingMilestone: Record<ChapterId, string> = {
  work: 'project case studies (M5–M6)',
  experience: 'experience timeline (M7)',
  about: 'about, achievements and technical arsenal (M7)',
  beyond: 'beyond code (M7)',
  contact: 'contact links',
};

export const Journal = forwardRef<JournalHandle, JournalProps>(function Journal({ open }, ref) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  useScrimProgress(scrollerRef, scrimRef);

  useImperativeHandle(ref, () => ({
    scrollTo: (id, smooth = true) => {
      const el = scrollerRef.current?.querySelector<HTMLElement>(`#${id}`);
      if (!el || !scrollerRef.current) return;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      scrollerRef.current.scrollTo({ top: el.offsetTop, behavior: smooth && !reduce ? 'smooth' : 'auto' });
    },
  }));

  return (
    <div
      className={cx(
        'fixed inset-0 z-[var(--z-content)] transition-opacity duration-[var(--dur-slow)] ease-out-expo',
        open ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
      aria-hidden={!open}
      inert={!open}
    >
      {/* Two-stage scrim (DESIGN-SYSTEM §Scrim) driven by this layer's own scroll. */}
      <div ref={scrimRef} aria-hidden="true" className="journal-scrim pointer-events-none absolute inset-0" />

      <div ref={scrollerRef} className="relative h-full overflow-y-auto overscroll-contain" tabIndex={-1}>
        <main id="main" className="page">
          {chapters.map((c, i) => (
            <section
              key={c.id}
              id={c.id}
              aria-labelledby={`${c.id}-title`}
              className="flex min-h-[100svh] flex-col justify-center gap-10 border-b hairline py-[var(--section-gap)] pt-[calc(var(--header-h)+4rem)]"
            >
              <SectionHeading
                index={c.index}
                eyebrow={c.label}
                id={`${c.id}-title`}
                title={c.title}
                lead={c.lead}
                tone={i === 0 ? 'opener' : 'reading'}
              />
              <TodoMark id="M-chapter">{pendingMilestone[c.id]}</TodoMark>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
});
