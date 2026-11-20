import { useEffect, useRef, type RefObject } from 'react';

type Options = {
  enabled: boolean;
  direction: 'down' | 'up';
  /** Accumulated wheel/touch distance (CSS px) that counts as intent. */
  threshold: number;
  onTrigger: () => void;
  /** 0..1 while building up — drive a hint; called with 0 when it decays away. */
  onProgress?: (progress: number) => void;
  /** Listen here instead of window (events still bubble from children). */
  target?: RefObject<HTMLElement | null>;
  /** Extra gate evaluated per event (e.g. "only while scrolled to the very top"). */
  when?: () => boolean;
};

/**
 * Detects a deliberate, sustained scroll in one direction — used to move between the
 * hero (where the wheel flies the camera) and the journal (where it scrolls text).
 * Reversing direction resets; idling decays the accumulator so stray flicks never trigger.
 */
export function useScrollIntent({ enabled, direction, threshold, onTrigger, onProgress, target, when }: Options) {
  const acc = useRef(0);
  const cb = useRef({ onTrigger, onProgress, when });
  cb.current = { onTrigger, onProgress, when };

  useEffect(() => {
    if (!enabled) return;
    acc.current = 0;
    cb.current.onProgress?.(0);
    const sign = direction === 'down' ? 1 : -1;
    let decayTimer = 0;
    let lastTouchY: number | null = null;
    let fired = false;

    const report = () => cb.current.onProgress?.(Math.min(1, acc.current / threshold));

    const push = (delta: number) => {
      if (fired) return;
      if (cb.current.when && !cb.current.when()) {
        acc.current = 0;
        report();
        return;
      }
      const d = delta * sign;
      if (d === 0) return; // touch jitter / first move after a new touch
      if (d < 0) {
        acc.current = 0; // direction reversal resets
      } else {
        acc.current += Math.min(d, 120); // clamp single large jumps (mouse wheels report 100+)
      }
      report();
      if (acc.current >= threshold) {
        fired = true;
        acc.current = 0;
        cb.current.onProgress?.(0);
        cb.current.onTrigger();
        return;
      }
      window.clearTimeout(decayTimer);
      decayTimer = window.setTimeout(function decay() {
        acc.current *= 0.6;
        if (acc.current < 4) acc.current = 0;
        report();
        if (acc.current > 0) decayTimer = window.setTimeout(decay, 120);
      }, 450);
    };

    const onWheel = (e: WheelEvent) => push(e.deltaY);
    const onTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY;
      if (y == null || lastTouchY == null) return;
      push((lastTouchY - y) * 2.2); // finger travel is shorter than wheel travel
      lastTouchY = y;
    };

    const el: HTMLElement | Window = target?.current ?? window;
    el.addEventListener('wheel', onWheel as EventListener, { passive: true });
    el.addEventListener('touchstart', onTouchStart as EventListener, { passive: true });
    el.addEventListener('touchmove', onTouchMove as EventListener, { passive: true });
    return () => {
      window.clearTimeout(decayTimer);
      el.removeEventListener('wheel', onWheel as EventListener);
      el.removeEventListener('touchstart', onTouchStart as EventListener);
      el.removeEventListener('touchmove', onTouchMove as EventListener);
    };
  }, [enabled, direction, threshold, target]);
}
