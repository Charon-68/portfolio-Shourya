/**
 * Run `cb` on the next animation frame — or after `timeoutMs` if frames are not being produced
 * (occluded windows, embedded panes, background-throttled contexts report "visible" but never
 * fire rAF). Returns a cancel function. Used by scroll trackers so state never stalls.
 */
export function nextFrameOrTimeout(cb: () => void, timeoutMs = 100): () => void {
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    clearTimeout(t);
    cb();
  };
  const raf = requestAnimationFrame(run);
  const t = window.setTimeout(run, timeoutMs);
  return () => {
    done = true;
    cancelAnimationFrame(raf);
    clearTimeout(t);
  };
}
