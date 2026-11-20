import { useEffect, type RefObject } from 'react';

/**
 * Cross-fades the opener scrim into the reading scrim as `scroller` scrolls through the
 * first `distance` (fraction of viewport height). Writes `--scrim-t` on `target`; no re-renders.
 */
export function useScrimProgress(
  scroller: RefObject<HTMLElement | null> | 'window',
  target: RefObject<HTMLElement | null>,
  distance = 0.6,
) {
  useEffect(() => {
    const el = scroller === 'window' ? null : scroller.current;
    const tgt = target.current;
    if (!tgt || (scroller !== 'window' && !el)) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = el ? el.scrollTop : window.scrollY;
      const t = Math.min(1, Math.max(0, y / (window.innerHeight * distance)));
      tgt.style.setProperty('--scrim-t', t.toFixed(3));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    const src: HTMLElement | Window = el ?? window;
    src.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      src.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [scroller, target, distance]);
}
