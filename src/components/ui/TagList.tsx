import { cx } from '@/lib/cx';

/**
 * Inline technology list — mono text separated by thin slashes. Deliberately NOT pills.
 * Pass `highlight` to emphasise items (e.g. when a skill is selected in the Arsenal map).
 */
export function TagList({
  items,
  highlight,
  className,
  label,
}: {
  items: string[];
  highlight?: (item: string) => boolean;
  className?: string;
  /** Accessible name, e.g. "Technologies". */
  label?: string;
}) {
  return (
    <ul aria-label={label} className={cx('label flex flex-wrap items-baseline gap-x-2 gap-y-1.5 normal-case tracking-[0.02em]', className)}>
      {items.map((item, i) => (
        <li key={item} className="flex items-baseline gap-2">
          <span className={cx('transition-colors', highlight?.(item) ? 'text-pollen' : 'ink-2')}>{item}</span>
          {i < items.length - 1 && (
            <span aria-hidden="true" className="ink-4">
              /
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
