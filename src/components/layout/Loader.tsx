import { useValley } from '@/scene/useValley';

/**
 * Understated loader: the pulsing pollen dot plus a hairline that fills with genuine
 * progress (engine download + staged scene build). Fades once the first frame renders.
 */
export function Loader() {
  const { status, progress } = useValley();
  const gone = status !== 'loading';
  return (
    <div className={`loader ${gone ? 'gone' : ''}`} role="status" aria-live="polite" aria-busy={!gone}>
      <span className="loader-dot" aria-hidden="true" />
      <span className="loader-track" aria-hidden="true">
        <span className="loader-fill" style={{ transform: `scaleX(${progress})` }} />
      </span>
      <span className="sr-only">{gone ? 'Loaded' : `Loading the valley, ${Math.round(progress * 100)} percent`}</span>
    </div>
  );
}
