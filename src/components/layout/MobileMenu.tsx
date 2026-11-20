import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useRef } from 'react';
import { chapters, type ChapterId } from '@/content/chapters';
import { profile } from '@/content/profile';
import { dur, ease, stagger } from '@/lib/motion';
import { useFocusTrap } from '@/lib/useFocusTrap';
import { ResumeLink } from './ResumeLink';

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  onHome: () => void;
  onChapter: (id: ChapterId) => void;
};

/** Full-screen menu over the dimmed valley (< md). Focus-trapped; Esc closes; focus returns to the toggle. */
export function MobileMenu({ open, onClose, onHome, onChapter }: MobileMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  useFocusTrap(ref, open, onClose);

  const items: Array<{ id: 'home' | ChapterId; index: string; label: string }> = [
    { id: 'home', index: '00', label: 'Home' },
    ...chapters.map((c) => ({ id: c.id, index: c.index, label: c.label })),
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          tabIndex={-1}
          className="fixed inset-0 z-[3] flex flex-col bg-night/80 pt-[var(--header-h)] outline-none md:hidden"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0 }}
          transition={{ duration: dur.base, ease: ease.outExpo }}
        >
          <nav aria-label="Main" className="page flex flex-1 flex-col justify-center">
            <ul className="flex flex-col">
              {items.map((item, i) => (
                <motion.li
                  key={item.id}
                  className="border-b hairline first:border-t"
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: dur.slow, ease: ease.outExpo, delay: reduce ? 0 : 0.05 + i * stagger.base }}
                >
                  <a
                    href={item.id === 'home' ? '#top' : `#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      if (item.id === 'home') onHome();
                      else onChapter(item.id);
                    }}
                    className="flex items-baseline gap-4 py-3.5 text-cream transition-colors active:text-pollen"
                  >
                    <span className="label tabular text-pollen">{item.index}</span>
                    <span className="font-display text-display-s uppercase">{item.label}</span>
                  </a>
                </motion.li>
              ))}
            </ul>
          </nav>
          <div className="page flex flex-wrap items-center justify-between gap-4 pb-8 pt-6">
            <ResumeLink />
            <p className="label ink-3">{profile.affiliation}</p>
            {/* Reachable inside the focus trap (the header toggle sits outside it). */}
            <button type="button" onClick={onClose} className="label ink-2 underline decoration-[var(--hairline-strong)] underline-offset-4">
              Close menu
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
