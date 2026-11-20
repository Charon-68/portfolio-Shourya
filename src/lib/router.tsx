/**
 * Minimal path router (History API). The site has exactly two kinds of page — "/" (hero +
 * journal, chapter in the hash) and "/work/:slug" (case study) — so this replaces React Router
 * (blueprint §5.1) with ~40 lines and no dependency. Vercel rewrites every path to index.html.
 */
import { useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from 'react';

const NAV_EVENT = 'app:navigate';

function subscribe(cb: () => void) {
  window.addEventListener('popstate', cb);
  window.addEventListener(NAV_EVENT, cb);
  return () => {
    window.removeEventListener('popstate', cb);
    window.removeEventListener(NAV_EVENT, cb);
  };
}

const getPath = () => window.location.pathname;

export function usePath(): string {
  return useSyncExternalStore(subscribe, getPath, () => '/');
}

export function matchProject(path: string): string | null {
  const m = path.match(/^\/work\/([a-z0-9-]+)\/?$/);
  return m ? m[1] : null;
}

/** How many consecutive in-app case-study entries sit on top of the journal entry (0 = none). */
export function caseDepth(): number {
  const d = (history.state as { caseDepth?: number } | null)?.caseDepth;
  return typeof d === 'number' ? d : 0;
}

export function navigate(to: string, { replace = false } = {}) {
  if (to === window.location.pathname + window.location.hash) return;
  // Record the depth of case studies opened in-app, so "All work" can step back to the
  // journal entry exactly (restoring its scroll) even after following "Next project" links.
  const toCase = matchProject(to.split('#')[0]) !== null;
  const fromCase = matchProject(window.location.pathname) !== null;
  const fromJournal = window.location.pathname === '/';
  const prev = caseDepth();
  // Chains that began from a deep link have no journal entry behind them → stay 0.
  const depth = toCase ? (fromCase ? (prev > 0 ? prev + (replace ? 0 : 1) : 0) : fromJournal ? 1 : 0) : 0;
  const state = depth > 0 ? { caseDepth: depth } : null;
  if (replace) history.replaceState(state, '', to);
  else history.pushState(state, '', to);
  window.dispatchEvent(new Event(NAV_EVENT));
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string };

/** Real <a href> (open-in-new-tab, copy link, middle-click all work); plain clicks route in-app. */
export function Link({ to, onClick, ...rest }: LinkProps) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to);
  };
  return <a href={to} onClick={handle} {...rest} />;
}
