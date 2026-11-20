import { Button } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/SectionHeading';

/** Unknown path or project slug. Sits over the dimmed valley like any other page. */
export function NotFound({ onHome, onWork }: { onHome: () => void; onWork: () => void }) {
  return (
    <div className="fixed inset-0 z-[var(--z-content)] grid place-items-center bg-night/70">
      <div className="page hero-legible flex flex-col items-start gap-6">
        <Eyebrow index="404" tone="strong">
          Off the path
        </Eyebrow>
        <h1 className="text-display-l uppercase">This page wandered off</h1>
        <p className="measure text-lead ink-1">The link may be old, or mistyped. The valley — and the work — are still here.</p>
        <div className="flex flex-wrap gap-3 [text-shadow:none]">
          <Button arrow="right" onClick={onWork}>
            See the work
          </Button>
          <Button variant="outline" onClick={onHome}>
            Back to the valley
          </Button>
        </div>
      </div>
    </div>
  );
}
