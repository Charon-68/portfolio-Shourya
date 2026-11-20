/**
 * Owns the single ValleyEngine instance and exposes a small, stable API to React.
 *
 * - Probes WebGL first (no three.js import). No WebGL → static fallback, engine never downloaded.
 * - Lazy-loads the engine chunk (three + shaders) so the page shell paints before the 3D does.
 * - Per-frame values (telemetry) are read on demand via getTelemetry(); never pushed into state.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { chooseQualityTier, probeWebGL, type QualityTier } from '@/engine/capabilities';
import { HOME_WAYPOINT } from '@/content/chapters';
import type { EngineMode, ValleyEngine } from '@/engine/ValleyEngine';
import { ValleyContext, type ValleyContextValue, type ValleyStatus } from './useValley';

const IMPORT_WEIGHT = 0.25; // share of the progress bar for downloading the engine chunk

export function ValleyProvider({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ValleyEngine | null>(null);
  const modeRef = useRef<EngineMode>('explore');
  /** Last requested camera position — applied as the start point if it arrives before the engine. */
  const flyRef = useRef<number>(HOME_WAYPOINT);

  const [status, setStatus] = useState<ValleyStatus>('loading');
  const [progress, setProgress] = useState(0);
  const [introDone, setIntroDone] = useState(false);
  const [tier, setTier] = useState<QualityTier | null>(null);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    let engine: ValleyEngine | null = null;

    const fail = (reason: unknown) => {
      if (cancelled) return;
      console.warn('[valley] falling back to static background:', reason);
      engine?.dispose();
      engine = null;
      engineRef.current = null;
      setStatus('fallback');
      setIntroDone(true);
    };

    const caps = probeWebGL();
    // `?webgl=off` forces the static fallback (QA for browsers without WebGL).
    const params = new URLSearchParams(window.location.search);
    const forcedOff = params.get('webgl') === 'off';
    // Software rasterisers (SwiftShader, llvmpipe — VMs, remote desktops, GPU-less machines) take
    // seconds per frame on this scene and freeze the page. They get the captured poster instead;
    // an explicit ?quality=… still forces the engine (and its throttled software path) for testing.
    const softwareFallback = caps.software && !params.has('quality');
    if (!caps.webgl || forcedOff || softwareFallback) {
      fail('WebGL unavailable');
      return;
    }
    const startTier = chooseQualityTier(caps);
    setTier(startTier);
    setProgress(0.04);

    import('@/engine/ValleyEngine')
      .then(({ ValleyEngine }) => {
        if (cancelled) return;
        setProgress(IMPORT_WEIGHT);
        try {
          engine = new ValleyEngine(container, {
            quality: startTier,
            software: caps.software,
            initialProgress: flyRef.current,
            onProgress: (p) => !cancelled && setProgress(IMPORT_WEIGHT + p * (1 - IMPORT_WEIGHT)),
            onLoaded: () => !cancelled && setStatus('ready'),
            onIntroDone: () => !cancelled && setIntroDone(true),
            onError: fail,
            onQualityChange: (t) => !cancelled && setTier(t),
          });
          engine.setMode(modeRef.current);
          engineRef.current = engine;
          if (import.meta.env.DEV) {
            (window as unknown as { __valley?: ValleyEngine }).__valley = engine;
          }
        } catch (err) {
          fail(err);
        }
      })
      .catch(fail);

    return () => {
      cancelled = true;
      engine?.dispose();
      engineRef.current = null;
    };
  }, []);

  // The UI reveals when the intro swoop is ~92% done. On a slow device the swoop is slow too
  // (it advances per rendered frame), so never keep the interface hidden more than 2.5 s.
  useEffect(() => {
    if (status !== 'ready' || introDone) return;
    const t = window.setTimeout(() => setIntroDone(true), 2500);
    return () => window.clearTimeout(t);
  }, [status, introDone]);

  const toggleSound = useCallback(() => {
    const store = engineRef.current?.audioStore;
    if (!store) return;
    setSoundOn(!store.toggle());
  }, []);

  const setMode = useCallback((mode: EngineMode) => {
    modeRef.current = mode;
    engineRef.current?.setMode(mode);
  }, []);

  const flyTo = useCallback((p: number) => {
    flyRef.current = p;
    engineRef.current?.flyTo(p);
  }, []);
  const setPaused = useCallback((paused: boolean) => engineRef.current?.setPaused(paused), []);
  const startHover = useCallback(() => engineRef.current?.startHoverTransition(), []);
  const stopHover = useCallback(() => engineRef.current?.stopHoverTransition(), []);
  const getTelemetry = useCallback(() => engineRef.current?.getTelemetry() ?? null, []);

  const value = useMemo<ValleyContextValue>(
    () => ({
      status,
      progress,
      introDone,
      tier,
      soundOn,
      toggleSound,
      setMode,
      flyTo,
      setPaused,
      startHover,
      stopHover,
      getTelemetry,
    }),
    [status, progress, introDone, tier, soundOn, toggleSound, setMode, flyTo, setPaused, startHover, stopHover, getTelemetry],
  );

  return (
    <ValleyContext.Provider value={value}>
      <div id="valley" ref={containerRef} aria-hidden="true" data-status={status}>
        <div className="js-canvas-container" />
        {status === 'fallback' && <div className="valley-fallback" />}
      </div>
      {children}
    </ValleyContext.Provider>
  );
}
