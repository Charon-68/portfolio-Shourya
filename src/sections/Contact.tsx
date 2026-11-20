/**
 * Contact — the closing scene. Sits over the open meadow (contact mode lifts the camera).
 * Only real, supplied links render; missing ones are dev-only TODOs (C1–C4).
 */
import { Button } from '@/components/ui/Button';
import { TodoMark } from '@/components/ui/TodoMark';
import { profile, type MaybeLink } from '@/content/profile';

type Row = { label: string; link: MaybeLink; display?: (href: string) => string; external?: boolean };

const rows: Row[] = [
  { label: 'Email', link: profile.links.email, display: (h) => h.replace(/^mailto:/, '') },
  { label: 'LinkedIn', link: profile.links.linkedin, display: (h) => h.replace(/^https?:\/\/(www\.)?/, ''), external: true },
  { label: 'GitHub', link: profile.links.github, display: (h) => h.replace(/^https?:\/\/(www\.)?/, ''), external: true },
  { label: 'Resume', link: profile.links.resume, display: () => 'Download PDF', external: true },
];

export function Contact({ onHome }: { onHome: () => void }) {
  const visible = rows.filter((r) => r.link.href || import.meta.env.DEV);
  return (
    <div className="flex flex-col gap-12">
      {visible.length > 0 && (
        <ul className="flex max-w-3xl flex-col border-t border-[var(--hairline-strong)]">
          {visible.map((r) => (
            <li key={r.label} className="grid grid-cols-[7rem_1fr] items-baseline gap-4 border-b border-[var(--hairline-strong)] py-5 md:grid-cols-[9rem_1fr]">
              <span className="label ink-1">{r.label}</span>
              {r.link.href ? (
                <a
                  href={r.link.href}
                  {...(r.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="group/c inline-flex w-fit items-baseline gap-3 font-display text-display-s uppercase text-cream transition-colors hover:text-pollen"
                >
                  {r.display ? r.display(r.link.href) : r.link.href}
                  <span aria-hidden="true" className="transition-transform duration-[var(--dur-base)] ease-out-expo group-hover/c:translate-x-1">
                    {r.external ? '↗' : '→'}
                  </span>
                  {r.external && <span className="sr-only"> (opens in a new tab)</span>}
                </a>
              ) : (
                <TodoMark id={r.link.todo}>{r.label.toLowerCase()}</TodoMark>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-4 [text-shadow:none]">
        <Button variant="outline" arrow="right" onClick={onHome}>
          Back to the valley
        </Button>
      </div>

      <p className="label ink-1">
        © {new Date().getFullYear()} {profile.name} · Built with React, Three.js and custom GLSL
      </p>
    </div>
  );
}
