import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';

type EyebrowProps = {
  index?: string;
  children: ReactNode;
  className?: string;
  /** "strong" (ink-1) is required over the light opener scrim; "quiet" (ink-3) only over the reading scrim. */
  tone?: 'quiet' | 'strong';
};

/** Mono label above headings: "02 — Experience". */
export function Eyebrow({ index, children, className, tone = 'quiet' }: EyebrowProps) {
  return (
    <p className={cx('label flex items-center gap-3', tone === 'strong' ? 'ink-1' : 'ink-3', className)}>
      {index && <span className="tabular text-pollen">{index}</span>}
      {index && <span aria-hidden="true" className="h-px w-6 bg-[var(--hairline-strong)]" />}
      <span>{children}</span>
    </p>
  );
}

type SectionHeadingProps = {
  index?: string;
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  /** Heading level; chapters are h2, sub-sections h3. */
  level?: 2 | 3;
  size?: 'l' | 'm' | 's';
  id?: string;
  className?: string;
  /** "opener" when the heading sits on the light opener scrim (strong eyebrow, ink-1 lead). */
  tone?: 'opener' | 'reading';
};

const sizeClass = { l: 'text-display-l', m: 'text-display-m', s: 'text-display-s' } as const;

export function SectionHeading({
  index,
  eyebrow,
  title,
  lead,
  level = 2,
  size = 'l',
  id,
  className,
  tone = 'reading',
}: SectionHeadingProps) {
  const H = level === 2 ? 'h2' : 'h3';
  return (
    <header className={cx('flex flex-col gap-5 md:gap-6', className)}>
      <Eyebrow index={index} tone={tone === 'opener' ? 'strong' : 'quiet'}>
        {eyebrow}
      </Eyebrow>
      {/* tabIndex -1: view changes move focus here (never into the tab order). */}
      <H id={id} tabIndex={id ? -1 : undefined} className={cx(sizeClass[size], 'ink-1 uppercase outline-none')}>
        {title}
      </H>
      {lead && <p className={cx('measure text-lead', tone === 'opener' ? 'ink-1' : 'ink-2')}>{lead}</p>}
    </header>
  );
}
