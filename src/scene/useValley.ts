/** Context + hook for the valley engine. Separate from the provider so React Fast Refresh works. */
import { createContext, useContext } from 'react';
import type { QualityTier } from '@/engine/capabilities';
import type { EngineMode, EngineTelemetry } from '@/engine/ValleyEngine';

export type ValleyStatus = 'loading' | 'ready' | 'fallback';

export type ValleyContextValue = {
  status: ValleyStatus;
  /** 0..1, genuine: engine chunk download + staged scene build. */
  progress: number;
  /** True once the intro swoop is (almost) finished — or immediately in fallback. */
  introDone: boolean;
  tier: QualityTier | null;
  soundOn: boolean;
  toggleSound: () => void;
  setMode: (mode: EngineMode) => void;
  flyTo: (progress: number) => void;
  setPaused: (paused: boolean) => void;
  startHover: () => void;
  stopHover: () => void;
  getTelemetry: () => EngineTelemetry | null;
};

export const ValleyContext = createContext<ValleyContextValue | null>(null);

export function useValley(): ValleyContextValue {
  const ctx = useContext(ValleyContext);
  if (!ctx) throw new Error('useValley must be used inside <ValleyProvider>');
  return ctx;
}

