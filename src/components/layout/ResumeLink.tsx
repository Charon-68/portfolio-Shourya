import { profile } from '@/content/profile';
import { cx } from '@/lib/cx';
import { TodoMark } from '@/components/ui/TodoMark';

/**
 * Resume ↗. Only rendered once the redacted PDF exists (CONTENT-TODO C4).
 * In development a visible TODO stands in so the slot is never forgotten.
 */
export function ResumeLink({ className, variant = 'pill' }: { className?: string; variant?: 'pill' | 'menu' }) {
  const { href, todo } = profile.links.resume;
  if (!href) {
    return import.meta.env.DEV ? <TodoMark id={todo} compact className={className}>resume</TodoMark> : null;
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cx(
        variant === 'pill'
          ? 'label inline-flex h-10 items-center gap-2 rounded-pill border border-[var(--hairline-strong)] px-4.5 text-cream transition-colors duration-[var(--dur-fast)] hover:border-cream hover:bg-cream hover:text-ink'
          : 'inline-flex items-baseline gap-3',
        className,
      )}
    >
      Resume <span aria-hidden="true">↗</span>
      <span className="sr-only"> (PDF, opens in a new tab)</span>
    </a>
  );
}
