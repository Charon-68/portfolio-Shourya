import { useValley } from '@/scene/useValley';
import { cx } from '@/lib/cx';

/** Ambient sound on/off. Muted by default; hidden when the static fallback is showing. */
export function SoundToggle({ className }: { className?: string }) {
  const { soundOn, toggleSound, status } = useValley();
  if (status === 'fallback') return null;
  return (
    <button
      type="button"
      onClick={toggleSound}
      aria-pressed={soundOn}
      aria-label={soundOn ? 'Mute ambient sound' : 'Play ambient sound'}
      title={soundOn ? 'Mute ambient sound' : 'Play ambient sound'}
      className={cx(
        'group/sound relative grid size-10 shrink-0 place-items-center rounded-pill text-cream transition-colors duration-[var(--dur-fast)] hover:text-pollen',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-none stroke-current stroke-[1.5] [stroke-linecap:round] [stroke-linejoin:round]">
        <path d="M4 9.5v5h3.5L12 18V6L7.5 9.5Z" />
        <path
          d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"
          className={cx('transition-opacity duration-[var(--dur-base)]', soundOn ? 'opacity-100' : 'opacity-0')}
        />
        <path d="m16 10 4 4m0-4-4 4" className={cx('transition-opacity duration-[var(--dur-base)]', soundOn ? 'opacity-0' : 'opacity-100')} />
      </svg>
      {/* Small level meter — animates only while playing. */}
      <span
        aria-hidden="true"
        className={cx(
          'absolute -bottom-0.5 left-1/2 h-px w-3 -translate-x-1/2 origin-center bg-pollen transition-transform duration-[var(--dur-base)]',
          soundOn ? 'scale-x-100' : 'scale-x-0',
        )}
      />
    </button>
  );
}
