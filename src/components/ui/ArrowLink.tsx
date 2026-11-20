import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { cx } from '@/lib/cx';

type ArrowLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> & {
  href: string;
  children: ReactNode;
  external?: boolean;
  /** "label" = mono uppercase (UI), "text" = inline prose link. */
  tone?: 'label' | 'text';
};

/** Underlined text link with a trailing arrow. Underline grows from the left on hover. */
export function ArrowLink({ href, children, external, tone = 'label', className, ...rest }: ArrowLinkProps) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...rest}
      className={cx(
        'group/link inline-flex items-baseline gap-1.5 text-cream transition-colors duration-[var(--dur-fast)] hover:text-pollen',
        tone === 'label' ? 'label' : 'underline decoration-[var(--hairline-strong)] underline-offset-4 hover:decoration-pollen',
        className,
      )}
    >
      <span className={cx(tone === 'label' && 'relative')}>
        {children}
        {tone === 'label' && (
          <span
            aria-hidden="true"
            className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-[0.25] bg-current transition-transform duration-[var(--dur-base)] ease-out-expo group-hover/link:scale-x-100"
          />
        )}
      </span>
      <span aria-hidden="true" className="translate-y-px transition-transform duration-[var(--dur-base)] ease-out-expo group-hover/link:translate-x-0.5 group-hover/link:-translate-y-px">
        {external ? '↗' : '→'}
      </span>
      {external && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
}
