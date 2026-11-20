import { motion, useReducedMotion } from 'motion/react';
import { chapters, type ChapterId } from '@/content/chapters';
import { profile } from '@/content/profile';
import { cx } from '@/lib/cx';
import { dur, ease } from '@/lib/motion';
import { ResumeLink } from './ResumeLink';
import { SoundToggle } from './SoundToggle';

type HeaderProps = {
  visible: boolean;
  view: 'hero' | 'journal';
  activeChapter: ChapterId | null;
  menuOpen: boolean;
  onHome: () => void;
  onChapter: (id: ChapterId) => void;
  onToggleMenu: () => void;
};

export function Header({ visible, view, activeChapter, menuOpen, onHome, onChapter, onToggleMenu }: HeaderProps) {
  const reduce = useReducedMotion();
  return (
    <motion.header
      className="pointer-events-none fixed inset-x-0 top-0 z-[var(--z-overlay)]"
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible || reduce ? 0 : -8 }}
      transition={{ duration: dur.slow, ease: ease.outExpo }}
    >
      {/* Night fade under the nav: full in the journal (scrolling text never collides with links), half over the hero. */}
      <div
        aria-hidden="true"
        className={cx(
          'absolute inset-x-0 top-0 h-[calc(var(--header-h)+3rem)] bg-[linear-gradient(180deg,var(--color-night)_0%,rgb(4_7_5/0.96)_62%,rgb(4_7_5/0)_100%)] transition-opacity duration-[var(--dur-slow)]',
          view === 'journal' || menuOpen ? 'opacity-100' : 'opacity-50',
        )}
      />
      <div className="page relative flex h-[var(--header-h)] items-center justify-between gap-6">
        {/* Wordmark doubles as Home */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onHome();
          }}
          aria-label={`${profile.name} — home`}
          aria-current={view === 'hero' ? 'page' : undefined}
          className="pointer-events-auto font-display text-[1.375rem] leading-none tracking-[0.01em] uppercase text-cream transition-colors duration-[var(--dur-fast)] hover:text-pollen"
        >
          {profile.name}
        </a>

        <nav aria-label="Main" className="pointer-events-auto hidden items-center gap-8 md:flex lg:gap-10">
          <ul className="flex items-center gap-6 lg:gap-8">
            {chapters.map((c) => {
              const active = view === 'journal' && activeChapter === c.id;
              return (
                <li key={c.id}>
                  <a
                    href={`#${c.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onChapter(c.id);
                    }}
                    aria-current={active ? 'location' : undefined}
                    className={cx(
                      'label group/nav relative py-2 transition-colors duration-[var(--dur-fast)] hover:text-cream',
                      active ? 'text-cream' : 'ink-2',
                    )}
                  >
                    {c.label}
                    <span
                      aria-hidden="true"
                      className={cx(
                        'absolute inset-x-0 bottom-0.5 h-px origin-left bg-pollen transition-transform duration-[var(--dur-base)] ease-out-expo',
                        active ? 'scale-x-100' : 'scale-x-0 group-hover/nav:scale-x-100',
                      )}
                    />
                  </a>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center gap-3">
            <ResumeLink />
            <SoundToggle />
          </div>
        </nav>

        {/* Mobile */}
        <div className="pointer-events-auto flex items-center gap-1 md:hidden">
          <SoundToggle />
          <button
            type="button"
            onClick={onToggleMenu}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="label flex h-10 items-center gap-3 rounded-pill border border-[var(--hairline-strong)] px-4 text-cream"
          >
            <span>{menuOpen ? 'Close' : 'Menu'}</span>
            <span aria-hidden="true" className="relative block h-2.5 w-4">
              <span
                className={cx(
                  'absolute left-0 h-px w-full bg-current transition-transform duration-[var(--dur-base)] ease-out-expo',
                  menuOpen ? 'top-1/2 rotate-45' : 'top-0',
                )}
              />
              <span
                className={cx(
                  'absolute left-0 h-px w-full bg-current transition-transform duration-[var(--dur-base)] ease-out-expo',
                  menuOpen ? 'top-1/2 -rotate-45' : 'bottom-0',
                )}
              />
            </span>
          </button>
        </div>
      </div>
    </motion.header>
  );
}
