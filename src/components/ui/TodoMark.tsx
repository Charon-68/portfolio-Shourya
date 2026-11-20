import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';

/**
 * Visible placeholder for content Shourya has not supplied yet.
 * `id` refers to a row in docs/CONTENT-TODO.md. Never replace with invented content.
 */
export function TodoMark({
  id,
  children,
  className,
  compact,
}: {
  id: string;
  children?: ReactNode;
  className?: string;
  /** Single-line, smaller variant for tight spots (metric captions, table cells). */
  compact?: boolean;
}) {
  return (
    <span
      className={cx(
        'label inline-flex w-fit max-w-full flex-wrap items-center gap-x-2 rounded-hair border border-dashed border-pollen/50 text-pollen/90',
        compact ? 'px-1.5 py-0.5 text-micro tracking-[0.06em]' : 'px-2 py-1',
        className,
      )}
      data-todo={id}
    >
      <span aria-hidden="true">◌</span>
      <span>{compact ? <>{children ?? 'To come'} · TBC</> : <>To come{children ? <> · {children}</> : null}</>}</span>
      {import.meta.env.DEV && <span className="ink-4">{id}</span>}
    </span>
  );
}
