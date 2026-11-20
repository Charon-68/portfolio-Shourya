import { animate, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { cx } from '@/lib/cx';
import { dur, ease } from '@/lib/motion';
import { TodoMark } from './TodoMark';

export type MetricProps = {
  /** Exact value as written on the resume, e.g. "0.80", "5.5s", "11.5K", "49.4%". */
  value: string;
  label: string;
  /** Evaluation context. `{ todo }` renders a visible placeholder (see docs/CONTENT-TODO.md). */
  context?: string | { todo: string };
  /** Poppy for "before/baseline" values in comparisons. */
  tone?: 'default' | 'before';
  /** Count up from 0 once when scrolled into view. Off for non-numeric values. */
  countUp?: boolean;
  className?: string;
};

/** Splits "49.4%" → ["", "49.4", "%"], "6,000+" → ["", "6,000", "+"]. Commas are thousands separators. */
function splitNumber(value: string): [string, string, string] | null {
  const m = value.match(/^(.*?)(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)(.*)$/);
  return m ? [m[1], m[2], m[3]] : null;
}

export function Metric({ value, label, context, tone = 'default', countUp = true, className }: MetricProps) {
  const numRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(numRef, { once: true, margin: '0px 0px -10% 0px' });
  const reduce = useReducedMotion();
  const parts = splitNumber(value);

  useEffect(() => {
    if (!countUp || reduce || !inView || !parts || !numRef.current) return;
    const raw = parts[1];
    const grouped = raw.includes(',');
    const target = parseFloat(raw.replace(/,/g, ''));
    const decimals = (raw.split('.')[1] ?? '').length;
    const fmt = (v: number) =>
      grouped
        ? v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
        : v.toFixed(decimals);
    const node = numRef.current;
    const controls = animate(0, target, {
      duration: dur.scene,
      ease: ease.outExpo,
      onUpdate: (v) => {
        node.textContent = fmt(v);
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduce, countUp]);

  return (
    <figure className={cx('flex flex-col gap-3 border-t hairline pt-4', className)}>
      {/* The full value is always present for assistive tech; the animated digits are decorative. */}
      <span className="sr-only">{value}</span>
      <span
        aria-hidden="true"
        className={cx('font-display text-numeral tabular', tone === 'before' ? 'text-poppy' : 'ink-1')}
      >
        {parts ? (
          <>
            {parts[0]}
            <span ref={numRef}>{countUp && !reduce ? '0' : parts[1]}</span>
            {parts[2]}
          </>
        ) : (
          value
        )}
      </span>
      <figcaption className="flex flex-col gap-1.5">
        <span className="text-small ink-1">{label}</span>
        {typeof context === 'string' && <span className="label ink-3 normal-case tracking-normal">{context}</span>}
        {context && typeof context === 'object' && <TodoMark id={context.todo} compact>context</TodoMark>}
      </figcaption>
    </figure>
  );
}
