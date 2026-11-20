import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '@/lib/cx';

type Variant = 'primary' | 'outline' | 'ghost';
type Size = 'md' | 'sm';

type Common = {
  variant?: Variant;
  size?: Size;
  /** Trailing arrow; "external" renders a diagonal arrow and opens in a new tab. */
  arrow?: 'right' | 'external' | false;
  children: ReactNode;
  className?: string;
};

type AsLink = Common & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'>;
type AsButton = Common & { href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>;

const base =
  'group/btn relative inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-pill label ' +
  'transition-[background-color,color,border-color,transform] duration-[var(--dur-fast)] ease-out-expo ' +
  'disabled:pointer-events-none disabled:opacity-40';

const variants: Record<Variant, string> = {
  primary: 'bg-cream text-ink hover:bg-pollen active:translate-y-px',
  outline: 'border border-[var(--hairline-strong)] text-cream hover:border-cream hover:bg-cream hover:text-ink',
  ghost: 'text-cream hover:text-pollen',
};

const sizes: Record<Size, string> = {
  md: 'h-12 px-6',
  sm: 'h-10 px-4.5 text-micro',
};

function Arrow({ kind }: { kind: 'right' | 'external' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={cx(
        'size-3.5 shrink-0 fill-none stroke-current stroke-[1.5] [stroke-linecap:round] [stroke-linejoin:round]',
        'transition-transform duration-[var(--dur-base)] ease-out-expo',
        kind === 'right' ? 'group-hover/btn:translate-x-0.5' : 'group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5',
      )}
    >
      {kind === 'right' ? <path d="M2.5 8h11M9.5 4l4 4-4 4" /> : <path d="M4.5 11.5l7-7M5.5 4.5h6v6" />}
    </svg>
  );
}

export function Button(props: AsLink | AsButton) {
  const { variant = 'primary', size = 'md', arrow = false, children, className, ...rest } = props;
  const classes = cx(base, variants[variant], sizes[size], variant === 'ghost' && 'h-auto px-0', className);
  const content = (
    <>
      <span>{children}</span>
      {arrow && <Arrow kind={arrow} />}
    </>
  );

  if ('href' in rest && rest.href !== undefined) {
    const external = arrow === 'external';
    return (
      <a
        {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
        className={classes}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {content}
        {external && <span className="sr-only"> (opens in a new tab)</span>}
      </a>
    );
  }
  return (
    <button type="button" {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)} className={classes}>
      {content}
    </button>
  );
}
