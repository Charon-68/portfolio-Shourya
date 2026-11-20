import { motion, useReducedMotion, type Variants } from 'motion/react';
import type { ReactNode } from 'react';
import { inViewOnce, rise } from '@/lib/motion';

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Delay in seconds. */
  delay?: number;
  variants?: Variants;
  as?: 'div' | 'section' | 'li' | 'p' | 'span';
};

/**
 * Reveals its children once when they enter the viewport.
 * Under prefers-reduced-motion the content is rendered in its final state.
 */
export function Reveal({ children, className, delay = 0, variants = rise, as = 'div' }: RevealProps) {
  const reduce = useReducedMotion();
  if (reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }
  const M = motion[as];
  return (
    <M
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="shown"
      viewport={inViewOnce}
      transition={delay ? { delay } : undefined}
    >
      {children}
    </M>
  );
}
