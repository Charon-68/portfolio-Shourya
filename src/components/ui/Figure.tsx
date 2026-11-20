import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';

type FigureProps = {
  /** "01" → rendered "Fig. 01". */
  number: string;
  title: string;
  caption?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Crop-mark corner, like a printed botanical plate. */
function Corner({ className }: { className: string }) {
  return <span aria-hidden="true" className={cx('pointer-events-none absolute size-3 border-cream/40', className)} />;
}

/**
 * The "plate": a framed technical figure with a numbered header and caption.
 * Frame is drawn with crop marks, not a box, so diagrams breathe over the valley.
 */
export function Figure({ number, title, caption, children, className }: FigureProps) {
  return (
    <figure className={cx('relative flex flex-col gap-5', className)}>
      <div className="label flex items-baseline justify-between gap-4 border-b hairline pb-3">
        <span className="ink-1">
          <span className="text-pollen">Fig. {number}</span>
          <span className="ink-4"> — </span>
          {title}
        </span>
      </div>
      <div className="relative px-1 py-6 md:px-6 md:py-10">
        <Corner className="left-0 top-0 border-l border-t" />
        <Corner className="right-0 top-0 border-r border-t" />
        <Corner className="bottom-0 left-0 border-b border-l" />
        <Corner className="bottom-0 right-0 border-b border-r" />
        {children}
      </div>
      {caption && <figcaption className="measure text-small ink-3">{caption}</figcaption>}
    </figure>
  );
}
