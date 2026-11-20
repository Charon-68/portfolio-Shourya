import { useEffect, useRef } from 'react';
import { useValley } from '@/scene/useValley';
import { cx } from '@/lib/cx';

const fmt = (n: number) => (n < 0 ? '−' : '') + Math.abs(n).toFixed(1);

/**
 * Live engine readout — the one "instrument" detail (blueprint §3 recommendation).
 * Values are real (camera position, altitude above terrain, smoothed fps, quality tier),
 * written straight to the DOM 4× a second; React never re-renders for them.
 * Decorative for assistive tech.
 */
export function Telemetry({ className }: { className?: string }) {
  const { getTelemetry, status } = useValley();
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (status !== 'ready') return;
    let raf = 0;
    let last = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 250) return;
      last = now;
      const t = getTelemetry();
      if (!t || !ref.current) return;
      ref.current.textContent =
        `x ${fmt(t.x)} · z ${fmt(t.z)} · alt ${t.altitude.toFixed(1)} · ` +
        `${Math.round(t.fps)} fps · ${t.tier}`;
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [status, getTelemetry]);

  if (status === 'fallback') return null;
  return (
    <p
      ref={ref}
      aria-hidden="true"
      className={cx('font-mono text-micro uppercase tracking-[0.12em] tabular ink-2 whitespace-nowrap', className)}
    >
      &nbsp;
    </p>
  );
}
