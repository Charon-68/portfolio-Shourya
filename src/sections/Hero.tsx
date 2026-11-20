import { motion, useReducedMotion, type Variants } from 'motion/react';
import { Telemetry } from '@/components/layout/Telemetry';
import { Button } from '@/components/ui/Button';
import { profile } from '@/content/profile';
import { cx } from '@/lib/cx';
import { dur, ease } from '@/lib/motion';
import { useValley } from '@/scene/useValley';

type HeroProps = {
  /** Hero is the active view (journal closed). */
  active: boolean;
  /** 0..1 progress of a sustained downward scroll toward the journal (drives the hint). */
  intent: number;
  onExplore: () => void;
};

const container: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.11, delayChildren: 0.1 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  shown: { opacity: 1, y: 0, transition: { duration: dur.scene, ease: ease.outExpo } },
};
const nameLine: Variants = {
  hidden: { y: '108%' },
  shown: { y: '0%', transition: { duration: 1.4, ease: ease.outExpo } },
};

/**
 * The first screen. Text is centred over the valley's mid-ground (where the engine's
 * look-target sits), so the brightest foreground blooms frame it rather than sit under it.
 */
export function Hero({ active, intent, onExplore }: HeroProps) {
  const { introDone, startHover, stopHover, status } = useValley();
  const reduce = useReducedMotion();
  const shown = introDone || !!reduce;

  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className={cx(
        'fixed inset-0 z-[var(--z-ui)] flex flex-col transition-[opacity,transform] duration-[var(--dur-slow)] ease-out-expo',
        active ? 'opacity-100' : 'pointer-events-none scale-[0.985] opacity-0',
      )}
      aria-hidden={!active}
      inert={!active}
    >
      {/* Soft local scrim: lifts text contrast without dimming the whole valley. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[image:var(--scrim-hero)]" />

      <motion.div
        className="page relative flex flex-1 flex-col items-center justify-center pt-[var(--header-h)] text-center hero-legible"
        variants={container}
        initial={reduce ? 'shown' : 'hidden'}
        animate={shown ? 'shown' : 'hidden'}
      >
        <motion.p variants={item} className="label ink-1 flex items-center justify-center gap-3 whitespace-nowrap">
          {profile.disciplines.map((d, i) => (
            <span key={d} className="flex items-center gap-3">
              {i > 0 && <span aria-hidden="true" className="size-1 rounded-full bg-pollen" />}
              <span className="max-sm:hidden">{d}</span>
              <span className="sm:hidden">{profile.disciplinesShort[i]}</span>
            </span>
          ))}
        </motion.p>

        <h1 id="hero-title" tabIndex={-1} className="mt-5 overflow-hidden pb-[0.04em] text-display-xl uppercase outline-none md:mt-7">
          <motion.span variants={nameLine} className="block">
            {profile.name}
          </motion.span>
        </h1>

        <motion.p variants={item} className="mt-6 text-lead ink-1 md:mt-8">
          {profile.tagline[0]}
          <br />
          {profile.tagline[1]}
        </motion.p>

        <motion.div variants={item} className="pointer-events-auto mt-9 flex flex-wrap items-center justify-center gap-3 [text-shadow:none] md:mt-11">
          <Button
            arrow="right"
            onClick={onExplore}
            onPointerEnter={startHover}
            onPointerLeave={stopHover}
            onFocus={startHover}
            onBlur={stopHover}
          >
            Explore work
          </Button>
        </motion.div>
      </motion.div>

      {/* Lower-third fade: the brightest foreground blooms sit here, under the rail. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-night/75 via-night/35 to-transparent"
      />

      {/* Bottom rail: live telemetry (left), interaction hint (right). */}
      <motion.div
        className="page relative flex items-end justify-between gap-6 pb-6 hero-legible md:pb-9"
        initial={false}
        animate={{ opacity: shown ? 1 : 0 }}
        transition={{ duration: dur.slow, delay: shown && !reduce ? 0.9 : 0 }}
      >
        <Telemetry className="hidden sm:block" />
        <div className="flex flex-col items-end gap-2 max-sm:mx-auto max-sm:items-center">
          <p className="label ink-2 flex items-center gap-3">
            {intent > 0.12 || status === 'fallback' ? (
              <span className="ink-1">Keep scrolling to read ↓</span>
            ) : (
              <>
                <span className="hidden md:inline">Scroll to fly · move to part the meadow</span>
                <span className="md:hidden">Swipe to fly</span>
              </>
            )}
          </p>
          {/* Fills as a sustained scroll builds toward entering the journal. */}
          <span aria-hidden="true" className="block h-px w-full min-w-24 bg-[var(--hairline-strong)]">
            <span
              className="block h-full origin-right bg-pollen transition-transform duration-[var(--dur-fast)] max-sm:origin-center"
              style={{ transform: `scaleX(${intent})` }}
            />
          </span>
        </div>
      </motion.div>
    </section>
  );
}
