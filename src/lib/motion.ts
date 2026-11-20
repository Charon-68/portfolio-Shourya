/**
 * Shared motion vocabulary for DOM animation (motion/react).
 * Mirrors the CSS tokens in styles/tokens.css so CSS and JS transitions match.
 * The 3D engine has its own damping; do not drive the camera from here.
 */
import type { Transition, Variants } from 'motion/react';

export const ease = {
  /** House curve — long, soft landing. Used by the engine's sheet + most reveals. */
  outExpo: [0.16, 1, 0.3, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
  out: [0.33, 1, 0.68, 1] as const,
};

/** Seconds. */
export const dur = {
  fast: 0.18,
  base: 0.42,
  slow: 0.8,
  scene: 1.2,
};

export const stagger = {
  tight: 0.04,
  base: 0.07,
  loose: 0.12,
};

export const transition = {
  base: { duration: dur.base, ease: ease.outExpo } satisfies Transition,
  slow: { duration: dur.slow, ease: ease.outExpo } satisfies Transition,
  scene: { duration: dur.scene, ease: ease.inOut } satisfies Transition,
};

/** Fade + 18px rise. The default entrance for text blocks. */
export const rise: Variants = {
  hidden: { opacity: 0, y: 18 },
  shown: { opacity: 1, y: 0, transition: transition.slow },
};

/** Line mask reveal for display headings (wrap each line in overflow-hidden). */
export const lineReveal: Variants = {
  hidden: { y: '105%' },
  shown: { y: '0%', transition: { duration: dur.slow, ease: ease.outExpo } },
};

/** Container that staggers its children. */
export const staggerChildren = (gap: number = stagger.base, delay = 0): Variants => ({
  hidden: {},
  shown: { transition: { staggerChildren: gap, delayChildren: delay } },
});

/** Shared in-view options: reveal once, slightly before fully on screen. */
export const inViewOnce = { once: true, margin: '0px 0px -12% 0px' } as const;
